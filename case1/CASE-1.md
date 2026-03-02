# Case 1. UUIDv7 Persistable + Outbox 비동기 분리

> 기준일: 2026-02-28  
> 재진행 목적: Before/After 증거를 같은 절차로 다시 촬영

---

## 0) 최종 결론 한 줄

Case 1의 원래 목적은 회원가입 처리에서 영속성과 메시징 책임을 분리하고, Outbox 원자 커밋으로 일관성과 복구 가능성을 확보하는 것이다.

## 0-1) 시점 혼동 정리 (중요)

1. `3c17e0bf` (2025-10-07): 회원가입 Outbox 비동기 큐잉 전환 (`202 Accepted`, `X-User-Id`)
2. `03504bf3` (2025-10-08): `CreateAuthUserService` 저장 경로 `save -> persist` 전환
3. `8282a2d9` (2025-12-06)는 Case 1 원인 커밋이 아니다
4. 결론: Case 1 정식 비교축은 `3c17e0bf^ -> 3c17e0bf` 하나만 사용한다
5. "회원가입은 이미 비동기인데 Outbox/Persistable은 없음" 같은 조합은 이 저장소 기준 정식 축으로 보지 않는다
6. 실행 기준: Before는 `3c17e0bf^`, `3c17e0bf`는 After다

## 0-2) 현재 코드 경로 확인 (JVM 이벤트 체인)

1. `UserController.registerUser` -> `CreateUserService.createUser` 호출 후 즉시 `200` 반환
2. `CreateUserService`는 `ApplicationEventPublisher.publishEvent(AuthRegistrationRequestedEvent)` 호출
3. `AuthUserRegistrationEventHandler`는 `@EventListener`로 수신 (동일 JVM 내부 이벤트)
4. `UserAuthIdUpdateEventHandler`는 `@TransactionalEventListener`로 후속 처리
5. 결론: 회원가입 요청 경로는 RMQ 큐를 직접 기다리지 않는 JVM 이벤트 체인이다

---

## 1) 증거 포인트

1. 회원가입 API 응답 캡처
   - Before: `POST /api/v1/users` -> `200`
   - After: `POST /api/v1/users` -> `202` + `X-User-Id`
2. Hibernate SQL 로그 (Loki 권장)
   - 회원가입(`POST /api/v1/users`) 구간의 `auth_user`, `users` SQL 패턴
3. Outbox 테이블 증거 (DB 쿼리)
   - `auth_outbox_event`, `user_outbox_event` 최근 row / status
4. RabbitMQ Management UI/근거 문구
   - After: 큐 `app.events.auth`, `app.events.user` 상태/rate 캡처
   - Before: `N/A(요청 경로 동기식)` 근거 문구 캡처

## 1-1) Case 1에서 안 하는 것

1. k6 부하테스트는 Case 1 범위에서 제외
2. EXPLAIN ANALYZE는 Case 1 필수 아님
3. 부하 중 DB에 수동 성능 쿼리(EXPLAIN/대량 조회) 실행하지 않음

---

## 2) 기준 시점

### 정식 비교축 (고정)
```bash
# 회원가입 동기 -> 비동기(Outbox) 전환을 가장 명확하게 보여주는 축
# Before: 동기 회원가입(200 + 토큰 즉시 발급)
git checkout 3c17e0bf^

# After: 비동기 회원가입(202 + X-User-Id, Outbox 큐잉)
git checkout 3c17e0bf
```

### 실행 주의 (DB 초기화 환경 필독)

1. `3c17e0bf`는 Before가 아니라 After다.
2. DB를 완전 초기화한 뒤 `3c17e0bf`를 Flyway만으로 실행하면 `user_outbox_event` 누락으로 500이 발생할 수 있다.
3. After 실행은 아래 둘 중 하나로 고정한다.
   - 실행 A(권장): `git checkout db2e33c2` (2025-10-23, Flyway V1에 outbox 테이블 포함)
   - 실행 B: `git checkout 3c17e0bf` + `V2__Create_Outbox_Tables.sql` 적용 브랜치에서 실행
4. 문서 비교축/서술은 계속 `3c17e0bf^ -> 3c17e0bf`를 사용한다.

참고(부록 전용):
```bash
# save -> persist 전환만 별도 검증하고 싶을 때
git checkout 03504bf3^   # Before
git checkout 03504bf3    # After

# 주의: 이 축은 회원가입(/api/v1/users) 경로가 아니라
# Auth 서비스 내부 저장 경로 검증에 가깝다.
```

---

## 3) 로그 레벨 (application-dev.yml 매핑 기준)

Case 1 촬영용 권장 환경변수:

```bash
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_COM_EXAMPLE_PROJECT=INFO

LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG
LOGGING_LEVEL_ORG_HIBERNATE_TYPE_DESCRIPTOR_SQL_BASICBINDER=TRACE

LOGGING_LEVEL_COM_EXAMPLE_PROJECT_AUTH_INFRASTRUCTURE_ADAPTER_OUTBOUND_OUTBOX=DEBUG
LOGGING_LEVEL_COM_EXAMPLE_PROJECT_USER_INFRASTRUCTURE_ADAPTER_OUTBOUND_OUTBOX=DEBUG
LOGGING_LEVEL_COM_EXAMPLE_PROJECT_COMMON_INFRASTRUCTURE_MESSAGING=DEBUG

LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_AMQP_RABBIT_CORE_RABBITTEMPLATE=DEBUG
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_AMQP=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_AMQP_RABBIT_CONNECTION=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_AMQP_RABBIT_LISTENER=INFO
LOGGING_LEVEL_COM_RABBITMQ_CLIENT=INFO
```

운영 주의:
1. `BasicBinder=TRACE`는 로그량이 큼
2. 증거 촬영 후 `INFO` 중심으로 복구

---

## 4) 타이밍 규칙 (핵심)

1. 기능 증명은 부하테스트 없이 진행 가능
2. 증거 캡처는 실행 종료 후:
   - Loki 쿼리로 SQL 패턴 캡처
   - DB 쿼리로 Outbox 테이블 캡처
3. Loki는 종료 후에도 시간구간 고정 조회로 캡처 가능

---

## 5) 부하 시작 전 준비 (Pre-Load)

1. 대상 커밋 체크아웃
2. 재빌드
```bash
docker compose build --no-cache
docker compose up -d
```
3. Flyway 마이그레이션 확인 (`V2`, `V3`, `V4` 자동 적용)
```sql
SELECT version, script, success
FROM flyway_schema_history
WHERE version IN ('2', '3', '4')
ORDER BY installed_rank DESC
LIMIT 3;

SELECT to_regclass('public.auth_outbox_event') AS auth_outbox_event_table,
       to_regclass('public.user_outbox_event') AS user_outbox_event_table;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'auth_user'
  AND column_name IN ('created_at', 'updated_at', 'deleted_at', 'user_id')
ORDER BY column_name;

SELECT is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'auth_id';
```
4. 결과 폴더 준비
```bash
mkdir -p Z-PORTFOLIO-LOCAL/docs/upgrade_todo/Portfolio/case1/before
mkdir -p Z-PORTFOLIO-LOCAL/docs/upgrade_todo/Portfolio/case1/after
```
5. 회원가입 샘플 이메일 1개 준비 (수동 검증용)
   - 예: `case1-manual-20260228@example.com`

---

## 6) 실행 순서 (Before/After 공통)

1. 서버 기동 + 로그 레벨 적용 확인
2. 수동 회원가입 1회 호출 (SQL 패턴 트리거)
3. 필수 증거 수집:
   - 회원가입 API 응답 캡처
   - Loki SQL 캡처
   - DB Outbox 쿼리 캡처
   - After: RabbitMQ UI 캡처
   - Before: `N/A(요청 경로 동기식)` 표기 캡처

---

## 7) 수동 회원가입 트리거 (SQL 증거용)

```bash
curl -i -X POST "https://lifenavigation.store/api/v1/users" \
  -H "Content-Type: application/json" \
  -d '{    "email": "test3331111111111121@example.com",
    "password": "<TEST_PASSWORD_********>",
    "nickName": "1es22ter2321111",
    "age": 25,
    "gender": "MALE"
  }'
```

확인 포인트:
1. Before: 응답 코드 `200`
2. After: 응답 코드 `202` + `X-User-Id` 헤더 확인

---

## 8) 실행 후(DB) 실행 SQL

중요:
1. 아래 SQL은 회원가입 요청 실행 후 DBeaver/psql에서 실행
2. `outbox_events`가 없으면 정상이며, 아래 실제 테이블(`auth_outbox_event`, `user_outbox_event`) 사용

테이블 존재 확인:
```sql
SELECT to_regclass('public.outbox_events') AS outbox_events_view,
       to_regclass('public.auth_outbox_event') AS auth_outbox_event_table,
       to_regclass('public.user_outbox_event') AS user_outbox_event_table;
```

최근 Outbox row:
```sql
SELECT 'auth' AS domain, id, event_type, status, created_at, published_at
FROM auth_outbox_event
ORDER BY created_at DESC
LIMIT 10;

SELECT 'user' AS domain, id, event_type, status, created_at, published_at
FROM user_outbox_event
ORDER BY created_at DESC
LIMIT 10;
```

상태 집계:
```sql
SELECT 'auth' AS domain, status, COUNT(*) AS cnt
FROM auth_outbox_event
GROUP BY status
UNION ALL
SELECT 'user' AS domain, status, COUNT(*) AS cnt
FROM user_outbox_event
GROUP BY status
ORDER BY domain, status;
```

---

## 9) Loki 쿼리 (요청 실행 후 시간구간 고정 조회)

기본 selector 예시:
```logql
{project="upgrade_todo_stress", service="spring", logstream="stdout"}
```

회원가입 SQL 패턴:
```logql
{project="upgrade_todo_stress", service="spring", logstream="stdout"}
|= "org.hibernate.SQL"
|~ "(?i)insert into auth_user|insert into users|select .* from auth_user|select .* from users"
```

Outbox/Rabbit 발행 패턴:
```logql
{project="upgrade_todo_stress", service="spring", logstream="stdout"}
|~ "(?i)SIGNUP_ENQUEUED|outbox|auth_outbox_event|user_outbox_event|Publishing message|app.events.auth|app.events.user"
```

판정 기준:
1. 회원가입 구간에서 `insert into auth_user` / `insert into users` 확인
2. Outbox 저장/발행 관련 로그 확인
3. Before/After 비교는 같은 시간길이 구간으로 맞춰서 조회

---

## 10) 파일 저장 규칙

### 10-1) 기능 증명 필수 파일

```text
case1/
  before/case1-signup-response-before.png
  before/case1-hibernate-before.png
  before/case1-outbox-table-before.png
  before/case1-rabbitmq-before-NA.md   # N/A 근거 문서 (또는 본문 N/A 주석)
  after/case1-signup-response-after.png
  after/case1-hibernate-after.png
  after/case1-outbox-table-after.png
  after/case1-rabbitmq-queue-after-auth.png
  after/case1-rabbitmq-queue-after-user.png
```

### 10-2) TODO 파일명 호환

기존 TODO의 단일 파일명으로 제출할 때 매핑:
1. `case1-outbox-table.png` = `case1-outbox-table-after.png`
2. `case1-rabbitmq-queue.png` = `case1-rabbitmq-queue-after-user.png` (또는 `case1-rabbitmq-queue-after-auth.png`)

---

## 11) 체크리스트

### Before (정식 비교축의 Before 커밋)
- [x] 로그 레벨 적용
- [x] 수동 회원가입 1회 호출
- [x] 회원가입 API 응답 캡처 (`case1-signup-response-before.png`, 200)
- [x] Loki SQL 패턴 캡처 (`case1-hibernate-before.png`)
- [x] Outbox 테이블 결과 캡처 (`case1-outbox-table-before.png`)
- [x] `N/A(요청 경로 동기식)` 근거 정리
  - 문서(`before/case1-rabbitmq-before-NA.md`) 또는 본문 주석 중 하나면 충분

### After (정식 비교축의 After 커밋)
- [x] 로그 레벨 적용
- [x] 수동 회원가입 1회 호출
- [x] 회원가입 API 응답 캡처 (`case1-signup-response-after.png`, 202 + X-User-Id)
- [x] Loki SQL 패턴 캡처 (`case1-hibernate-after.png`)
- [x] Outbox 테이블 결과 캡처 (`case1-outbox-table-after.png`)
- [x] RabbitMQ 큐 캡처 (`case1-rabbitmq-queue-after-auth.png`, `case1-rabbitmq-queue-after-user.png`)
- [x] 기능 증명 결론 작성(동기 -> 비동기 전환 확인)

---

## 12) 빠른 트러블슈팅

1. `outbox_events` 테이블이 없다는 오류:
   - 정상일 수 있음. `auth_outbox_event`, `user_outbox_event`를 사용
2. Loki에서 SQL이 안 보임:
   - `LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG` 누락 확인
3. RabbitMQ 큐 depth가 0:
   - 소비가 빠른 상태일 수 있음. depth 대신 message rate/ack 흐름 캡처
4. merge/save vs persist를 별도로 보여주고 싶을 때:
   - 부록으로 `03504bf3^ -> 03504bf3` 축을 추가해 별도 캡처
