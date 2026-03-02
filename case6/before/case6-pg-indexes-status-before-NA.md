# case6-pg-indexes-status-before-NA

## 사유

- Case 6 Before(`bed9f9fe^`)는 V7 status partial index(`idx_*_pending/done`) 도입 전 시점이다.
- 따라서 `pg_indexes` SQL B 결과가 비어있는 것(0 row)은 정상이며, `status-before` 스크린샷이 없더라도 `N/A(부재)`로 인정한다.

## 판정 근거

1. Before에서 active index(V3) 확인 증거는 별도 존재 (`case6-pg-indexes-active-before.png`)
2. After에서 status index 존재 증거는 별도 존재 (`case6-pg-indexes-active-after.png`, `case6-pg-indexes-status-after.png`)
3. 핵심 비교는 "Before에 status index가 없음" vs "After에 status index가 있음"이다.
