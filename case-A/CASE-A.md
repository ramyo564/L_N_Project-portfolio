# Case A. 대용량 트래픽 램프업(Ramp-up) 부하 테스트 기반 통합 성능 최적화

> 기준일: 2026-03-25
> 비교축: `Before (Case 6 Baseline) -> After (Integrated Tuning)`

## 요약 (REVIEWER SUMMARY)

- **문제:** 10분간 1000VU 램프업 부하 테스트 중, 간헐적인 API 지연 및 응답 실패(0.93%) 발생.
- **원인:** 가상 스레드(VT) 환경의 불확실성을 교차 검증한 결과, VT 자체의 문제가 아니라 Redis 호출과 RabbitMQ 동기 발행 대기로 인한 API 스레드 블로킹, 그리고 저장 경로의 원자성 부족이 근본 원인임을 확인.
- **해결:** 비동기 데코레이터 패턴으로 RMQ 발행을 분리하고, 원자적 쿼리(InsertWithPosition) 및 Flyway 인덱스 튜닝을 통합 적용.
- **결과:** 에러율 0% 달성, p95 지연 시간 1/4 단축, 1000VU 환경에서 기존 대비 2~3배의 읽기/쓰기 처리량(RPS) 달성.

## 문제 (Phase 1. 문제 상황 및 베이스라인)

1000VU Ramp-up 초기 부하 테스트 결과, 특정 구간에서 처리량이 무너지고 실패율 0.93% 및 응답 지연이 발생하는 지점을 포착했습니다.

- **Baseline 증거:** [Baseline] 1000VU Ramp-up 초기 부하 테스트 (실패율 0.93% 및 응답 지연 발생)

## 원인 분석 (Phase 2. 병목 추적 및 가설 검증)

신규 기술인 가상 스레드(VT)가 원인인지 파악하기 위해 매트릭스 테스트를 진행하였고, VT가 아닌 '스레드 블로킹'이 문제임을 좁혀나갔습니다.

1. **[Matrix Test] 가상 스레드(VT) 및 인프라 변수 교차 검증:** VT 환경에서의 불확실성을 제거하고 실제 병목 구간을 특정했습니다.
2. **[Bottleneck Tracing] RabbitMQ 동기 발행 대기:** API 스레드가 RabbitMQ의 동기 발행(`convertAndSend`) 대기를 직접 부담하며 블로킹이 발생하는 것을 식별했습니다.

## 해결 및 결과 (Phase 3. 성능 폭발 및 최종 결과)

비동기 분리 및 인덱스 최적화 적용 후, 인프라 증설 없이도 동일 부하에서 시스템이 완벽하게 트래픽을 소화하는 것을 증명했습니다.

- **[After Tuning] 통합 최적화 결과:** 1000VU 부하 테스트에서 실패율 0% 달성 및 RPS 2~3배 향상을 확인했습니다.

## 사용한 증거 (EVIDENCE AT A GLANCE)

1. **[Baseline]** 초기 부하 테스트 k6 그래프 (실패율 0.93%)
2. **[Matrix Test]** 가상 스레드 및 인프라 변수 교차 검증 매트릭스
3. **[Bottleneck Tracing]** RabbitMQ 동기 발행 대기 식별 Grafana 지표
4. **[After Tuning]** 통합 최적화 후 k6 그래프 (실패율 0%, RPS 향상)

## 핵심 파일

- `case6/before/case6-k6-write-1000-before.png` (Phase 1 Baseline)
- `case4/after/case4-phase-c-matrix-after-2026-03-14.svg` (Phase 2 Matrix)
- `case5/after/case5-grafana-rabbitmq-message-processing-after.png` (Phase 2 Tracing)
- `case6/after/case6-k6-write-1000-after.png` (Phase 3 Final Impact)
