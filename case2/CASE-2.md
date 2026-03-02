STRESS_COMPOSE_FILES="-f docker-compose.database-test.yml -f docker-compose.dev.yml -f docker-compose.monitoring.yml -f docker-compose.monitoring.stress.yml"

docker compose --env-file .env.stress $STRESS_COMPOSE_FILES down -v --remove-orphans

docker compose --env-file .env.stress $STRESS_COMPOSE_FILES pull

docker compose --env-file .env.stress $STRESS_COMPOSE_FILES up -d
# ============================================================
# 3. DB만 먼저 올리고 준비 대기 (dev 프로파일인듯) 
# ============================================================
docker compose --env-file .env.stress -f docker-compose.database-test.yml up -d postgres
# PostgreSQL 준비 대기
until docker compose --env-file .env.stress -f docker-compose.database-test.yml exec -T postgres pg_isready -U $(grep "^POSTGRES_USER=" .env.stress | cut -d= -f2) -d $(grep "^POSTGRES_DB=" .env.stress | cut -d= -f2); do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL ready"
# Flyway 히스토리 초기화 (깨끗한 스키마)
PGUSER=$(grep "^POSTGRES_USER=" .env.stress | cut -d= -f2)
PGDB=$(grep "^POSTGRES_DB=" .env.stress | cut -d= -f2)
docker compose --env-file .env.stress -f docker-compose.database-test.yml exec -T postgres \
  psql -U "$PGUSER" -d "$PGDB" -c "DROP TABLE IF EXISTS flyway_schema_history CASCADE;" || true

## SQL 디버깅 켜야함
LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG

###

CASE 2
##
## 이거 id 없는 null 일때 처리해야함 ###
ProjectRequest
에 String id 필드가 있고, UUIDv7.fromOrGenerate(this.id) — 클라이언트가 id를 보내면 그걸 쓰고, 안 보내면 서버가 생성하는 구조네요.

##

curl -i -X POST "https://lifenavigation.store/api/v1/users" \
  -H "Content-Type: application/json" \
  -d '{    "email": "test3331111111111121@example.com",
    "password": "<TEST_PASSWORD_********>",
    "nickName": "1es22ter2321111",
    "age": 25,
    "gender": "MALE"
  }'

# Redis
docker exec -it upgrade_todo_stress-redis-1 redis-cli
AUTH <REDIS_PASSWORD_********>
# 주의 1) 키 prefix는 auth-token 이 아니라 auth_token::
# 주의 2) 로그인 직후에는 비어있을 수 있음 (보호 API 호출 시 JwtAuthenticationFilter가 put)
SCAN 0 MATCH "auth_token::*" COUNT 100
# 캡처 주의 3) 보안상 key value는 검은색 마스킹 가능
# 캡처 판정 4) `auth_token::*` 패턴 key가 보이면 증거 유효

## 키 매핑 변경 이유 (문서 반영용)

1. Before(`e67fc2b7^`)에는 JWT 인증 토큰 캐시 자체가 없었음
2. 따라서 Before 시점에는 `auth_token::*` 키가 생성되지 않는 것이 정상
3. After(`3c2bffd8` 이후 main)에서 `AuthTokenCacheAdapter`가 도입되며 토큰 캐시 키를 사용
4. 키 prefix는 코드 상수 기준 `auth_token::`(MVC), `auth_token_wf::`(WF)로 분리됨
5. 분리 이유: MVC/WF 경로의 캐시 직렬화/운영 경계를 분명히 하고 충돌을 방지하기 위함

## curl 명령어 전체 흐름
## Step 1: 회원가입
```bash
curl -s -X POST "https://lifenavigation.store/api/v1/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "case2test@example.com",
    "password": "<TEST_PASSWORD_********>",
    "nickName": "case2tester",
    "age": 25,
    "gender": "MALE"
  }'
  
```
## Step 2: 로그인 (토큰 획득)
```bash
# 쿠키를 파일로 저장
curl -s -c cookies.txt -X POST "https://lifenavigation.store/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "case2test@example.com",
    "password": "<TEST_PASSWORD_********>"
  }'
```
응답에서 accessToken이 JSON Body로 올 수도 있고, 쿠키에 태워줄 수도 있습니다. 응답을 확인해서 ACCESS_TOKEN 값을 변수로 저장하세요.

## Step 3: 응답에서 토큰 추출 (jq 필요)
```bash
ACCESS_TOKEN=$(curl -s -c cookies.txt -X POST "https://lifenavigation.store/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"case2test@example.com","password":"<TEST_PASSWORD_********>"}' | jq -r '.data.accessToken // .accessToken // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "ACCESS_TOKEN 추출 실패"
  exit 1
fi
echo "TOKEN: ${ACCESS_TOKEN:0:8}********"
```

## Step 4-A (Before 전용): 기존 동기 방식 유지
Before(`e67fc2b7^`)에서는 생성 API가 동기 응답(`200/201` + body에 `id`)이므로 기존 방식 그대로 진행한다.

```bash
BASE_URL="https://lifenavigation.store"

# 프로젝트 생성 -> 응답에서 ID 추출
PROJECT_ID=$(curl -s -X POST "$BASE_URL/api/v1/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -d '{"title":"Case2 테스트 프로젝트","description":"N+1 쿼리 증거용"}' | jq -r '.id // .data.id // empty')

if [ -z "$PROJECT_ID" ]; then
  echo "PROJECT_ID 추출 실패 (Before 동기 응답 확인 필요)"
  exit 1
fi
echo "PROJECT_ID: $PROJECT_ID"
sleep 2

# Task 생성 -> 응답에서 ID 추출
TASK_ID=$(curl -s -X POST "$BASE_URL/api/v1/projects/$PROJECT_ID/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -d '{"title":"증거용 Task 1"}' | jq -r '.id // .data.id // empty')

if [ -z "$TASK_ID" ]; then
  echo "TASK_ID 추출 실패 (Before 동기 응답 확인 필요)"
  exit 1
fi
echo "TASK_ID: $TASK_ID"
sleep 2

# SubTask 생성 (before payload: titles)
curl -s -X POST "$BASE_URL/api/v1/projects/$PROJECT_ID/tasks/$TASK_ID/subtasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -d '{"titles":["증거용 SubTask 1"]}' | jq .
sleep 2
```

## Step 4-B (After 전용): 비동기 방식 추가
After(main)에서는 `POST /projects`, `POST /tasks`, `POST /subtasks`가 `202 Accepted` + 빈 바디일 수 있다.  
따라서 **ID를 클라이언트 선발급**하고, 각 단계마다 조회 API로 반영 완료를 확인한다.

```bash
BASE_URL="https://lifenavigation.store"
PROJECT_ID=$(uuidgen | tr 'A-Z' 'a-z')
TASK_ID=$(uuidgen | tr 'A-Z' 'a-z')
SUBTASK_ID=$(uuidgen | tr 'A-Z' 'a-z')

echo "PROJECT_ID=$PROJECT_ID"
echo "TASK_ID=$TASK_ID"
echo "SUBTASK_ID=$SUBTASK_ID"

# 프로젝트 생성 (202 기대)
curl -s -o /tmp/case2-create-project.body \
  -D /tmp/case2-create-project.headers \
  -w "HTTP_STATUS:%{http_code}\n" \
  -X POST "$BASE_URL/api/v1/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -d "{
    \"id\":\"$PROJECT_ID\",
    \"title\":\"Case2 테스트 프로젝트\",
    \"description\":\"N+1 쿼리 증거용\"
  }"

# 프로젝트 반영 대기
PROJECT_READY=0
for i in $(seq 1 20); do
  STATUS=$(curl -s -o /tmp/case2-project-get.json -w "%{http_code}" \
    -X GET "$BASE_URL/api/v1/projects/$PROJECT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -b cookies.txt)
  if [ "$STATUS" = "200" ]; then PROJECT_READY=1; break; fi
  sleep 1
done
[ "$PROJECT_READY" -eq 1 ] || { echo "Project 반영 대기 실패"; exit 1; }

# Task 생성 (202 기대)
curl -s -o /tmp/case2-create-task.body \
  -D /tmp/case2-create-task.headers \
  -w "HTTP_STATUS:%{http_code}\n" \
  -X POST "$BASE_URL/api/v1/projects/$PROJECT_ID/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -d "{
    \"id\":\"$TASK_ID\",
    \"title\":\"증거용 Task 1\",
    \"description\":\"N+1 쿼리 캡처용\"
  }"

# Task 반영 대기
TASK_READY=0
for i in $(seq 1 20); do
  STATUS=$(curl -s -o /tmp/case2-task-get.json -w "%{http_code}" \
    -X GET "$BASE_URL/api/v1/projects/$PROJECT_ID/tasks/$TASK_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -b cookies.txt)
  if [ "$STATUS" = "200" ]; then TASK_READY=1; break; fi
  sleep 1
done
[ "$TASK_READY" -eq 1 ] || { echo "Task 반영 대기 실패"; exit 1; }

# SubTask 생성 (after payload: items)
curl -s -o /tmp/case2-create-subtask.body \
  -D /tmp/case2-create-subtask.headers \
  -w "HTTP_STATUS:%{http_code}\n" \
  -X POST "$BASE_URL/api/v1/projects/$PROJECT_ID/tasks/$TASK_ID/subtasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
  -d "{
    \"items\": [
      {\"id\":\"$SUBTASK_ID\", \"title\":\"증거용 SubTask 1\"}
    ]
  }"

# (선택) SubTask 반영 확인
for i in $(seq 1 20); do
  curl -s -X GET "$BASE_URL/api/v1/projects/$PROJECT_ID/tasks/$TASK_ID/subtasks" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -b cookies.txt > /tmp/case2-subtasks-get.json
  if jq -e --arg sid "$SUBTASK_ID" 'type=="array" and any(.[]?; .id == $sid)' /tmp/case2-subtasks-get.json >/dev/null; then
    break
  fi
  sleep 1
done
```

## Step 5 (공통): 핵심 조회 1회 호출 + traceId 추출
Before/After 모두 이 단계는 동일하다.

```bash
curl -s -D /tmp/case2-tasks.headers \
  -o /tmp/case2-tasks.body \
  -X GET "$BASE_URL/api/v1/projects/$PROJECT_ID/tasks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt

cat /tmp/case2-tasks.body | jq .

TRACE_ID=$(awk 'BEGIN{IGNORECASE=1} /^x-trace-id:/ {print $2}' /tmp/case2-tasks.headers | tr -d '\r' | head -n1 | cut -d- -f1)
echo "TRACE_ID=$TRACE_ID"
```

## Step 6 (공통): traceId 기반 SQL 로그 필터링
```bash
# 원본 JSON 로그 (진위 증거용)
docker logs upgrade_todo_stress-spring-1 --since 10m 2>&1 | \
  grep '"org.hibernate.SQL"' | \
  grep "$TRACE_ID"
```

```bash
# 가독성 포맷
docker logs upgrade_todo_stress-spring-1 --since 10m 2>&1 | \
  grep '"org.hibernate.SQL"' | \
  grep "$TRACE_ID" | \
  jq -r '"[\(."@timestamp" | .[:19])] \(.message)"'
```

```bash
# 쿼리 카운트
echo "Total queries: $(docker logs upgrade_todo_stress-spring-1 --since 10m 2>&1 | grep '"org.hibernate.SQL"' | grep "$TRACE_ID" | wc -l)"
```

### (선택) 실시간 감시 방식
```bash
# 터미널 1: 실시간 로그 감시 시작
docker logs -f upgrade_todo_stress-spring-1 2>&1 | \
  grep --line-buffered '"org.hibernate.SQL"' | \
  jq -r '"[\(."@timestamp" | .[:19])] [\(.traceId | .[:8])] \(.message)"' | \
  tee /tmp/case2-queries.log

# 터미널 2: GET /api/v1/projects/$PROJECT_ID/tasks 실행
# → 터미널 1에서 캡처 후 Ctrl+C
# → 쿼리 수: wc -l /tmp/case2-queries.log
```

---

## Step 7 (공통): Grafana 패널 캡처 기준

Case 2는 SQL 로그 증거와 함께 Grafana 패널을 같이 남깁니다.

필수 패널:
1. `Monitoring-Stress` -> **HTTP Response Time Percentiles**
2. `Monitoring-Stress` -> **슬로우 쿼리 top 10**
3. `postgres_overview` -> **Tuples Fetched**

권장 패널:
1. `postgres_overview` -> **Active Connections**

정리:
1. Slow Query 패널과 Postgres 패널은 Case 2에서 모두 사용한다.
2. 케이스 문서/체크리스트에는 위 패널명을 그대로 적어 캡처 누락을 방지한다.

---

## 🚨 트러블슈팅 요약: "21쿼리 → 3쿼리" 문제 분석 파악

**Q. 왜 쿼리가 21개가 아니라 3개(Before) 또는 1개(After)만 나오나요? 데이터(Task, SubTask)를 많이 생성해야 하나요?**
**A. 아닙니다. 데이터를 많이 생성할 필요가 없습니다.**

트러블슈팅 문서(`2025-11-25-n_plus_1_query_analysis.md`) 분석 결과, "21개 쿼리"는 단일 API 호출에서 발생한 것이 아니라 **k6 테스트 시나리오 전체 흐름(API 7번 연속 호출)**에서 누적된 쿼리 수였습니다.

### 🔍 근본 원인 (단일 API 기준)
Task나 SubTask를 조회하는 단일 API 요청(`GET /projects/{id}/tasks` 등)을 보낼 때, 기존(Before) 코드에서는 항상 다음 3개의 DB 쿼리가 고정적으로 발생했습니다:
1. `JwtAuthenticationFilter`에서 `auth_user` 테이블 조회 (JWT에 이미 회원 정보가 있음에도 불필요하게 조회)
2. `ProjectAccessVerifier`에서 소유권 확인 (`isOwner` - 엔티티 전체 조회)
3. `ProjectAccessVerifier`에서 활성화 상태 확인 (`isProjectActive` - COUNT 조회)

**즉, 단일 API 요청 1번당 "불필요한 권한 인증 쿼리 3개"가 발생합니다.**
k6 테스트에서는 이와 같은 API를 7번 호출했기 때문에 `3개 * 7번 호출 = 21개 쿼리`가 쌓였던 것입니다.

### ✅ 증거 수집 전략 결론
따라서 데이터를 반복문을 돌려 수십 개 생성할 필요가 없습니다. 
포트폴리오에 "인증 쿼리 21→3 최적화"를 증명하기 위해서는, **단일 API(`GET /projects/$PROJECT_ID/tasks`)를 1번 호출하여 쿼리 수가 어떻게 변했는지**만 보여주면 됩니다.

- **Before (`e67fc2b7^`) 캡처**: 위에서 설명한 3개의 권한 게이트 쿼리가 찍히는 것을 확인. (단건 API에서 3개 쿼리 발생 확인)
- **After (최신 브랜치) 캡처**: JWT Claims 활용 및 AOP 권한 게이트 통합 덕분에 권한 관련 추가 쿼리 없이 **단 1개의 조회 쿼리**만 찍히는 것을 확인.

결국 단건 쿼리가 3개에서 1개로 줄어든 것을 증명하는 것이, k6 시나리오에서 21개 쿼리가 7개(또는 3개)로 줄어든 것과 완벽히 동일한 원리입니다. 증거로는 단건 API 호출 시의 로그를 첨부하면 됩니다.
