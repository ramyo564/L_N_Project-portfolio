# Case 6. JDBC Batch + Partial Index + 원자적 INSERT 통합 튜닝

> 동기화 기준: 2026-03-02
> 기준 부하: read/write 모두 1000VU

## 요약

Case 6는 단일 튜닝이 아니라 다음 3축을 함께 검증한 케이스다.

1. `insertWithPosition`으로 `SELECT MAX + INSERT` 경쟁 구간 축소
2. `status partial index(V7)` 적용으로 상태 조회 비용 최적화
3. JDBC batch 및 캐시/트랜잭션 순서 정리로 처리량 안정화

## 핵심 규칙

1. Before/After 비교는 1000VU 기준으로 통일한다.
2. Before `status index(B)`는 V7 미적용 시점이면 없는 것이 정상이다.
3. 따라서 Before B 증거는 `0 row` 캡처 또는 `N/A(부재)` 문서로 대체 가능하다.

## 필수 증거

1. k6 Read/Write before/after
2. Hibernate SQL before/after
3. EXPLAIN before 3장 + after 3장
4. `pg_indexes` active/status 증거

## 주요 파일

### Before

- `before/case6-k6-read-1000-before.png`
- `before/case6-k6-write-1000-before.png`
- `before/case6-hibernate-separate-before.png`
- `before/case6-explain-before-1.png`
- `before/case6-explain-before-2.png`
- `before/case6-explain-before-3.png`
- `before/case6-pg-indexes-active-before.png`
- `before/case6-pg-indexes-status-before-NA.md`

### After

- `after/case6-k6-read-1000-after.png`
- `after/case6-k6-write-1000-after.png`
- `after/case6-hibernate-atomic-after.png`
- `after/case6-explain-after-1.png`
- `after/case6-explain-after-2.png`
- `after/case6-explain-after-3.png`
- `after/case6-pg-indexes-active-after.png`
- `after/case6-pg-indexes-status-after.png`

## 판정

- 파일명 표준화 완료
- 1000VU 기준 통일 완료
- Before status index(B)는 `N/A(부재)` 허용 규칙 적용 완료
