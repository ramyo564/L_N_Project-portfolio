# Case A. 대용량 트래픽 램프업(Ramp-up) 부하 테스트 기반 통합 성능 최적화

> 기준일: 2026-03-25
> 비교축: `1000VU 쓰기 Ramp-up 1차 병목 -> 2차 병목`, `VT Supplementary`

## 요약 (REVIEWER SUMMARY)

- **문제:** 10분간 1000VU 쓰기 Ramp-up에서 요청 스레드의 RabbitMQ 동기 발행 때문에 실패율 0.93%와 초기 지연이 먼저 드러났고, 이어지는 저장 경로에서는 위치 계산과 INSERT 분리, 인덱스 미정리로 추가 tail latency가 남아 있었습니다.
- **원인:** 가상 스레드 매트릭스로 VT 자체를 교차 검증한 뒤, 실제 병목이 요청 스레드 블로킹과 저장 경로의 원자성 부족이었음을 확인했습니다.
- **해결:** RabbitMQ 발행을 전용 executor 기반 비동기 데코레이터로 분리하고, insertWithPosition 네이티브 쿼리와 Flyway 인덱스 튜닝을 통합 적용했습니다.
- **결과(안정성):** RabbitMQ 동기 발행 블로킹을 분리해 http_req_failed.rate 0.93% -> 0%, p95 488ms -> 124ms를 달성했습니다.
- **결과(지연):** 원자적 INSERT와 partial index 튜닝으로 1000VU 쓰기 p95 2.3s -> 124ms로 단축했습니다.
- **결과(처리량):** 초기 테스트(500VU) 대비 읽기 RPS +279% (972 -> 3,680), 쓰기 RPS +145% (373 -> 916) 대폭 향상을 달성했습니다.

## 증거 구조

1. **Pair 1**: 1000VU 쓰기 Ramp-up에서 RabbitMQ 동기 발행 블로킹을 async publisher split으로 해소
2. **Pair 2**: Pair 1 적용 이후에도 남아 있던 DB 경로 경쟁을 insertWithPosition + Flyway index tuning으로 해소
3. **Supplementary · Case 4**: VT matrix로 root cause를 교차 검증

## 문제 (Phase 1. 문제 상황 및 베이스라인)

1000VU 쓰기 Ramp-up에서는 먼저 요청 스레드의 RabbitMQ 동기 발행 대기가 드러났고, 이후 저장 경로의 경쟁이 추가로 확인되었습니다.

- **Pair 1 Before:** 요청 스레드에서 RabbitMQ `convertAndSend` 동기 발행을 직접 수행하던 상태
- **Pair 2 Before:** Pair 1 개선 이후에도 저장 경로의 원자성 부족과 인덱스 미정리가 남아 있던 상태

## 원인 분석 (Phase 2. 병목 추적 및 가설 검증)

신규 기술인 가상 스레드(VT)가 원인인지 파악하기 위해 매트릭스 테스트를 진행하였고, VT가 아닌 '스레드 블로킹'과 '저장 경로 경쟁'이 문제임을 좁혀나갔습니다.

1. **[Matrix Test] 가상 스레드(VT) 및 인프라 변수 교차 검증:** VT 환경에서의 불확실성을 제거하고 실제 병목 구간을 특정했습니다.
2. **[Bottleneck Tracing] RabbitMQ 동기 발행 대기:** API 스레드가 RabbitMQ의 동기 발행(`convertAndSend`) 대기를 직접 부담하며 블로킹이 발생하는 것을 식별했습니다.
3. **[Storage Path Tracing] 원자성 부족 및 인덱스 미정리:** 위치 계산 SELECT와 INSERT 분리, 그리고 index 최적화 미반영이 남아 있음을 확인했습니다.

## 해결 및 결과 (Phase 3. 성능 폭발 및 최종 결과)

RabbitMQ 비동기 발행 분리, 원자적 쿼리(insertWithPosition), Flyway 인덱스 튜닝을 순차 적용한 후, 인프라 증설 없이도 동일 부하에서 시스템이 완벽하게 트래픽을 소화하는 것을 증명했습니다.

- **[Pair 1 After] 요청 스레드 블로킹 제거 결과:** RabbitMQ 동기 발행 분리를 적용해 실패율 0% 달성과 p95 488ms -> 124ms를 확인했습니다.
- **[Pair 2 After] 잔여 병목 제거 결과:** 저장 경로 경쟁을 원자화 및 인덱스 최적화로 해소해 1000VU 쓰기 p95 2.3s -> 124ms를 확인했습니다.

## 사용한 증거 (EVIDENCE AT A GLANCE)

1. **[Pair 1 Before]** 1000VU 쓰기 Ramp-up RabbitMQ 동기 발행 baseline k6 그래프
2. **[Pair 1 After]** RabbitMQ 비동기 발행 분리 후 k6 그래프
3. **[Pair 2 Before]** Pair 1 개선 이후에도 남아 있던 DB 경로 경쟁 캡처
4. **[Pair 2 After]** 원자적 INSERT + 인덱스 최적화 후 k6 그래프 (p95 124ms, RPS 향상)
5. **[Supplementary / Case 4]** 가상 스레드 및 인프라 변수 교차 검증 매트릭스

## 핵심 파일

- `case5/before/case5-k6-write-1000-before.png` (Pair 1 Before, RabbitMQ sync publish baseline)
- `case5/after/case6-k6-write-1000-backup.png` (Pair 1 After, async publisher split)
- `case5/after/case5-grafana-rabbitmq-message-processing-after.png` (Pair 1 After, RabbitMQ message processing proof)
- `case6/before/case6-k6-write-1000-before.png` (Pair 2 Before, Pair 1 이후 남아 있던 DB path 경쟁)
- `case6/after/case6-k6-write-1000-after.png` (Pair 2 After, atomic INSERT + index tuning)
- `case4/before/case4-phase-a-matrix-before-2026-03-13.svg` (Supplementary Before, VT matrix validation)
- `case4/after/case4-phase-c-matrix-after-2026-03-14.svg` (Supplementary After, VT root cause ruled out)

## 해석

Case A의 대표 서사는 `요청 스레드 블로킹 -> 저장 경로 경쟁 -> VT 배제` 순서로 읽어야 합니다.
첫 번째 증거는 RabbitMQ 동기 발행 블로킹을 잡는 증거이고, 두 번째 증거는 그 이후에도 남아 있던 DB 경로 경쟁을 마무리하는 증거입니다.
보조 증거는 VT 자체를 원인에서 제외하는 교차 검증입니다.
