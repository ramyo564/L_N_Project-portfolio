# Case 6. JDBC Batch + Partial Index + 원자적 INSERT 통합 튜닝

> 기준일: 2026-03-13
> 비교축 A: `초기 테스트(500VU) summary` 기준 대표 성능
> 비교축 B: `1000VU` 기준 상세 case-local 캡처와 구조 증거

## 요약

Case 6은 단일 변경이 아니라
원자적 INSERT, partial index, batch/캐시/트랜잭션 경계 정리를 함께 적용한 사례다.

이 케이스는 두 층의 증거로 설명한다.

1. `초기 테스트(500VU)`: 초창기 MVP 완료 시점과 현재 main의 대표 성능 변화
2. `1000VU case-local`: 통합 튜닝 이후 고부하에서 보이는 상세 동작과 구조 증거

## 문제

1. 쓰기 경로에서 위치 계산 SELECT와 INSERT가 분리되어 경쟁 구간이 커졌다.
2. 상태 조회 쿼리에는 status partial index 부재 구간이 존재했다.
3. 캐시 무효화와 트랜잭션 순서가 흔들리면 일관성과 처리량이 함께 악화될 수 있었다.

## 해결

1. `insertWithPosition` 네이티브 경로로 위치 계산과 INSERT를 한 흐름으로 묶었다.
2. Flyway 마이그레이션으로 ownership/status/outbox partial index를 추가했다.
3. 캐시 무효화와 트랜잭션 경계를 after-commit 중심으로 정리했다.
4. 읽기/쓰기 부하를 각각 측정해 처리량과 tail latency 변화를 확인했다.

## 결과

### 초기 테스트(500VU)

- 읽기 RPS `972 -> 3,680`
- 쓰기 RPS `373 -> 916`
- 읽기 p95 `975ms -> 141ms`
- 쓰기 p95 `1.9s -> 126ms`

### 1000VU case-local

- 읽기 RPS `1206.50 -> 2151.70`
- 읽기 p95 `683.44ms -> 301.15ms`
- 쓰기 after RPS `1011.90`
- 쓰기 after p95 `123.80ms`

## 사용한 증거

1. k6 read/write 1000VU before/after 캡처
2. read/write report.html
3. read/write raw summary json
4. Hibernate SQL before/after 캡처
5. EXPLAIN before/after 캡처
6. `pg_indexes` active/status 캡처

## 핵심 파일

### Before

- `before/case6-k6-read-1000-before.png`
- `before/case6-k6-write-1000-before.png`
- `before/case6-hibernate-separate-before.png`
- `before/case6-explain-before-1.png`
- `before/case6-explain-before-2.png`
- `before/case6-explain-before-3.png`
- `before/case6-pg-indexes-active-before.png`
- `before/mvc-read-fixed-user-load-test-summary.json`
- `before/read-report.html`
- `before/write-report.html`

### After

- `after/case6-k6-read-1000-after.png`
- `after/case6-k6-write-1000-after.png`
- `after/case6-hibernate-atomic-after.png`
- `after/case6-explain-after-1.png`
- `after/case6-explain-after-2.png`
- `after/case6-explain-after-3.png`
- `after/case6-pg-indexes-active-after.png`
- `after/case6-pg-indexes-status-after.png`
- `after/mvc-read-fixed-user-load-test-summary.json`
- `after/mvc-task-subtask-fixed-user-load-test-summary.json`
- `after/read-report.html`
- `after/write-report.html`

## 해석

Case 6의 대표 KPI는 `초기 테스트(500VU)`를 기준으로 설명한다.
상세 페이지의 `1000VU` 캡처는
원자적 INSERT, index, batch/캐시/트랜잭션 정리가
고부하 동작에서 어떻게 반영되는지 보여주는 보강 증거로 사용한다.
