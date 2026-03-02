# case3-response-403-before-NA

## 사유

- Case 3 Before(`e4d083e8^`)에서 `POST /projects -> 즉시 GET /tasks` 403 재현을 여러 차례 시도했으나, 타이밍 의존성으로 재현되지 않음.
- `CASE-3.md` 규칙에 따라 403은 선택 증거이며, 재현 실패 시 `N/A`로 대체 가능.

## 대체 증거(채택)

1. Before `pg_stat_activity`에서 `idle in transaction` 다수 확인
2. After `case3-response-200-after.png` 확인 (sleep 없이 즉시 GET 200)
3. After Redis pending key/TTL 확인 (`case3-redis-pending-key-after.png`)

