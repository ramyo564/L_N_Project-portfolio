# Case 3. 캐시 경계 재설계 — idle in transaction 제거 + Pending Cache 보완

## Before 시점
```bash
git checkout e4d083e8^  # "트랜잭션 readOnly 개선" 직전 (2025-11-26)
```

## VU 설정 (동기화 기준)
- 현재 포트폴리오 증거는 **1000VU 기준**으로 고정한다.
- 대표 k6 캡처: `case3-k6-read-1000-before.png`, `case3-k6-read-1000-after.png`
- 과거 500VU 절차는 참고 이력으로만 유지하고, 최종 제출 문구/캡션은 1000VU를 사용한다.

## case-2
### 읽기
docker compose --env-file env_docker/local/.env.k6 -f docker-compose.k6.yml \
  run --rm k6 \
  run --out web-dashboard=export=scenarios_2/results/report.html \
  /k6/scenarios_2/test/smoke_test/mvc-read-fixed-user-load-test-old.js \
  --env RAMPING_PROFILE=stress --env TOTAL_USERS=1000

######################
---

## 인프라 전환 명령어

```bash
cd ~/upgrade_todo
STRESS_COMPOSE_FILES="-f docker-compose.database-test.yml -f docker-compose.dev.yml -f docker-compose.monitoring.yml -f docker-compose.monitoring.stress.yml"

# 1. 기존 스택 내리기 + 볼륨 초기화
docker compose --env-file .env.stress $STRESS_COMPOSE_FILES down -v --remove-orphans

# 2. .env.stress에서 이미지 태그 변경 (Case 3 Before 이미지로)
# sed -i 's/^BRANCH_TAG=.*/BRANCH_TAG=case3-before/' .env.stress
# 또는 직접 이미지 pull

# 3. 이미지 pull + 스택 올리기
docker compose --env-file .env.stress $STRESS_COMPOSE_FILES pull
docker compose --env-file .env.stress -f docker-compose.database-test.yml up -d postgres

# 4. PostgreSQL 준비 대기
until docker compose --env-file .env.stress -f docker-compose.database-test.yml exec -T postgres pg_isready -U $(grep "^POSTGRES_USER=" .env.stress | cut -d= -f2) -d $(grep "^POSTGRES_DB=" .env.stress | cut -d= -f2); do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL ready"

# 5. Flyway 초기화
PGUSER=$(grep "^POSTGRES_USER=" .env.stress | cut -d= -f2)
PGDB=$(grep "^POSTGRES_DB=" .env.stress | cut -d= -f2)
docker compose --env-file .env.stress -f docker-compose.database-test.yml exec -T postgres \
  psql -U "$PGUSER" -d "$PGDB" -c "DROP TABLE IF EXISTS flyway_schema_history CASCADE;" || true

# 6. 전체 스택 올리기
docker compose --env-file .env.stress $STRESS_COMPOSE_FILES up -d
```

---

## 촬영 가이드

### 1. 데이터 준비 (회원가입 + 로그인 + 프로젝트 생성)

```bash
# Step 1: 회원가입
curl -s -X POST "https://lifenavigation.store/api/v1/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "case3test@example.com",
    "password": "<TEST_PASSWORD_********>",
    "nickName": "case3tester",
    "age": 25,
    "gender": "MALE"
  }'

# Step 2: 로그인 (토큰 획득)
ACCESS_TOKEN=$(curl -s -c cookies.txt -X POST "https://lifenavigation.store/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"case3test@example.com","password":"<TEST_PASSWORD_********>"}' | jq -r '.data.accessToken // .accessToken // empty')
echo "TOKEN: ${ACCESS_TOKEN:0:8}********"
```

---

### 2. 📸 pg_stat_activity — idle in transaction 캡처

**k6 부하 실행 중에** 아래 쿼리를 DBeaver 또는 psql로 실행합니다.

#### psql 접근
```bash
# 컨테이너에서 직접 접속
docker compose --env-file .env.stress -f docker-compose.database-test.yml exec -T postgres \
  psql -U "$PGUSER" -d "$PGDB"
```

#### Before 캡처 쿼리 (idle in transaction 다수 row 기대)
```sql
-- ⭐ 핵심 캡처: idle in transaction 세션 목록
SELECT pid, state, backend_start, query_start, 
       age(now(), query_start) as idle_duration,
       left(query, 80) as query_preview
FROM pg_stat_activity 
WHERE state = 'idle in transaction'
ORDER BY query_start;
```

```sql
-- idle in transaction 건수 카운트 (숫자 증거)
SELECT state, count(*) 
FROM pg_stat_activity 
WHERE datname = current_database()
GROUP BY state 
ORDER BY count(*) DESC;
```

```sql
-- 트러블슈팅 문서 원본과 동일한 패턴 확인
-- Before에서는 이 쿼리가 idle in transaction 상태로 남아있음:
-- "select pe1_0.id from projects pe1_0 where pe1_0.id=$1 and pe1_0.user_id=$2 and pe1_0.deleted_at is null"
SELECT pid, state, left(query, 120) as query
FROM pg_stat_activity 
WHERE state = 'idle in transaction'
  AND query LIKE '%projects%'
ORDER BY query_start;
```

> **캡처 타이밍**: k6 부하가 **ramp-up 완료 후 안정 구간**일 때 (VU가 최대에 도달한 후)
> **기대 결과**: Before에서는 수십~수백 row, After에서는 0 또는 극소

---

### 3. 📸 HikariCP 커넥션 풀 — Grafana 캡처

k6 부하 중 아래 **필수 3개 패널만** 캡처합니다.  
전체 대시보드 캡처는 필수가 아닙니다.

필수 패널(패널명 고정):

1. `Monitoring-Stress` → **HikariCP Connection Pool - Spring**
2. `Monitoring-Stress` → **DB 상태별 총 연결 수**
3. `Monitoring-Stress` → **Connection Efficiency & Leak Monitoring**

- **Before 기대**: active 커넥션이 maximum-pool-size에 근접 (거의 포화)
- **After 기대**: active가 안정적이고 여유 있음

선택 패널(부록):

1. `postgres_overview` → **Active Connections**
2. `Monitoring-Stress` → **슬로우 쿼리 top 10** (패널은 존재하지만 Case 3 필수는 아님)
3. `Monitoring-Stress`의 기타 패널 (필요 시)

패널 해석 기준:
1. `postgres_overview` 패널은 Case 3에서도 사용 가능하며, `pg_stat_activity` 결과와 교차 검증용이다.
2. Slow Query 패널은 주로 Case 2/6 핵심 증거이므로 Case 3에서는 선택 증거로만 취급한다.

---

### 4. 📸 생성 직후 즉시 조회 응답 (403 재현은 선택)

> **핵심**: 프로젝트 생성(POST) 직후 즉시 조회(GET) 테스트로 Race Condition 여부를 점검한다.  
> `403`은 타이밍 의존(확률 재현)이라, 재현 실패 시 `N/A`로 기록해도 된다.

**Before에서 403 재현 시도(선택):**
```bash
# 프로젝트 생성 + 즉시 조회 (1줄로 연속 실행)
# 중요: POST /projects 는 202 + 빈 바디라 jq로 id 파싱하면 안 됨
PROJECT_ID=$(cat /proc/sys/kernel/random/uuid) && \
echo "Client ID: $PROJECT_ID" && \
curl -s -w "\nPOST_STATUS: %{http_code}\n" -X POST "https://lifenavigation.store/api/v1/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -d "{\"id\":\"$PROJECT_ID\",\"title\":\"403 테스트 프로젝트\",\"description\":\"Race Condition 재현\"}" && \
curl -s -w "\nHTTP_STATUS: %{http_code}\n" -X GET "https://lifenavigation.store/api/v1/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt

# 기대 결과(재현 성공 시): POST_STATUS: 202, HTTP_STATUS: 403
```

> ⚠️ **sleep 없이 바로 GET** — 이것이 포인트. `&&`로 연결해서 POST 응답 직후 즉시 GET 실행  
> ⚠️ 한 번에 안 되면 여러 번 시도 (비동기 타이밍 이슈라 확률적)  
> ⚠️ 부하 중에 시도하면 재현율이 더 높음 (시스템이 바쁠수록 캐시 갱신이 느림)  
> ⚠️ 재현이 끝내 안 되면 `case3-response-403-before`는 `N/A(재현 실패)`로 기록하고, 아래 3가지를 필수 증거로 채택한다.  
> 1) Before `pg_stat_activity` idle in tx, 2) After 즉시 GET 200, 3) After pending key/TTL

**After에서 200 캡처:**
```bash
# 동일 명령어 — After에서는 Pending Cache가 있어서 즉시 200
PROJECT_ID=$(cat /proc/sys/kernel/random/uuid) && \
echo "Client ID: $PROJECT_ID" && \
curl -s -w "\nPOST_STATUS: %{http_code}\n" -X POST "https://lifenavigation.store/api/v1/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -d "{\"id\":\"$PROJECT_ID\",\"title\":\"200 테스트 프로젝트\",\"description\":\"Pending Cache 증명\"}" && \
curl -s -w "\nHTTP_STATUS: %{http_code}\n" -X GET "https://lifenavigation.store/api/v1/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt

# 기대 결과: POST_STATUS: 202, HTTP_STATUS: 200
```

증거 판정:
1. `sleep` 없이 POST 직후 GET이 같은 커맨드 체인에 있어야 함
2. 최종 줄에 `HTTP_STATUS: 200`이 보여야 함
3. 권장 파일명: `case3-response-200-after.png`

---

### 5. 📸 Redis Pending Cache (After only)

After에서 프로젝트 생성 직후 Redis에 pending 키가 존재하는지 확인합니다.

```bash
# Redis 접속
docker exec -it upgrade_todo_stress-redis-1 redis-cli
AUTH <REDIS_PASSWORD_********>

# 프로젝트 생성 직후 실행:
GET "project:pending:<PROJECT_ID>"
TTL "project:pending:<PROJECT_ID>"
# 기대: 값 존재 + TTL 양수 (보통 30~60초)

# ownership 캐시에 false가 없는지 확인
KEYS "ownership:*"
# 기대: false 값이 캐싱되지 않음 (unless="#result==false" 조건 적용)
```

> Before에는 Pending Cache 자체가 없으므로 촬영 불필요

---

### 6. 📸 k6 부하 테스트 (Before + After)

```bash
# 읽기 1000VU 5분 부하 실행 (Case 2와 동일 시나리오)
# k6 실행 명령어는 Case 2와 동일

# 📸 캡처 목록:
# 1) k6 Summary (터미널 스크린샷)
# 2) k6 HTML Report 저장
# 3) Grafana HikariCP Connection Pool - Spring 패널 캡처
# 4) Grafana DB 상태별 총 연결 수 패널 캡처
# 5) Grafana Connection Efficiency & Leak Monitoring 패널 캡처
```

---

## 촬영 체크리스트

### Before (e4d083e8^)
- [x] k6 읽기 1000VU 실행 (`before/case3-k6-read-1000-before.png`)
- [x] `pg_stat_activity` idle in transaction 캡처 (`before/case3-pg_stat_idle_transaction-before.png`)
- [x] `pg_stat_activity` state count 캡처 (`before/case3-pg_stat_state_count-before.png`)
- [x] Grafana HikariCP 패널 캡처 (`before/case3-Grafana-HikariCP-before.png`)
- [x] Grafana DB 상태별 연결 수 캡처 (`before/case3-Grafana-db-before.png`)
- [x] Grafana Connection Efficiency & Leak Monitoring 캡처 (`before/case3-Grafana-Connectuib-efficiency-leak-before.png`)
- [x] 생성 직후 GET 403은 재현 실패로 `N/A` 기록 (`before/case3-response-403-before-NA.md`)

### After (main 최신 — 일괄 촬영)
- [x] k6 읽기 1000VU 실행 (`after/case3-k6-read-1000-after.png`)
- [x] `pg_stat_activity` idle in transaction 0 row 캡처 (`after/case3-pg_stat_idle_transaction-after.png`)
- [x] Grafana HikariCP 패널 캡처 (`after/case3-Grafana-HikariCP-after.png`)
- [x] Grafana DB 상태별 연결 수 캡처 (`after/case3-Grafana-db-after.png`)
- [x] Grafana Connection Efficiency & Leak Monitoring 캡처 (`after/case3-Grafana-Connectuib-efficiency-leak-after.png`)
- [x] 프로젝트 생성 직후 GET 200 응답 캡처 (`after/case3-response-200-after.png`)
- [x] Redis Pending key 캡처 (`after/case3-redis-pending-key-after.png`)
- [x] k6 raw 결과 보관 (`after/mvc-read-fixed-user-load-test-summary.json`, `after/mvc-read-failure-summary.txt`, `after/read-report.html`)

---

## 핵심 증명 포인트 요약

| 증명 | Before | After | 도구 |
|---|---|---|---|
| idle in transaction | 수십~수백 row | 0 row | pg_stat_activity |
| 커넥션 풀 | max 근접 (포화) | 안정적 (여유) | Grafana HikariCP |
| 생성 직후 조회 | 403 Forbidden (재현 성공 시) 또는 N/A | 200 OK | curl |
| Pending Cache | 없음 | 키 존재 + TTL 양수 | Redis CLI |

## 트러블슈팅 참고

원인: `@Cacheable` 메서드에 `@Transactional`이 없어서 DB 커넥션이 반환되지 않고 `idle in transaction` 상태로 남음. 
AOP 검증(커넥션 1) + 메인 트랜잭션(커넥션 2)이 **커넥션 2개를 동시 소모** → 풀 고갈.

해결:
1. Phase 1: `@Transactional(readOnly=true)` 적용 → idle 시간 최소화
2. Phase 2: Redis 호출을 트랜잭션 밖으로 분리 → 커넥션 점유 시간 단축
3. Pending Cache 추가 → 생성 직후 403 Race Condition 해소
