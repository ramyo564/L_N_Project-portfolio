# CASE 1 Data Pack

> 범위: `/home/yohan/Git-U/L_N_Project-portfolio/case1`
> 비교축: `3c17e0bf^ -> 3c17e0bf`
> 목적: Case 1 이미지를 다시 열지 않고도, 이력서/포트폴리오/면접 문구를 바로 뽑아 쓸 수 있게 정규화한 데이터 자산

## 사용 규칙

1. 이 케이스의 본질은 `기능 경계 전환`이다.
2. 숫자는 보강 증거로 쓸 수 있지만, `50VU before`와 `500VU after`를 같은 부하의 순수 delta로 합치면 안 된다.
3. 스크린샷 값과 `summary.json` 값이 서로 다르므로, 한 문장 안에서 섞지 말고 별도 레이어로 관리한다.
4. 이력서용으로는 `회원가입 응답 200 -> 202 Accepted + X-User-Id`, `merge 경로 제거`, `Outbox/RMQ 분리`, `고부하 안정성` 순으로 쓰는 것이 안전하다.
5. 우선순위는 `계약/구조 스크린샷` -> `k6/Grafana 스크린샷` -> `summary.json` -> `report.html` 순서로 둔다.

## 1) Headline-ready claim slots

- `회원가입 응답을 200 -> 202 Accepted + X-User-Id 비동기 흐름으로 전환`
- `UUIDv7 merge(SELECT+INSERT) 경로를 Persistable.isNew()로 INSERT 중심 경로로 정리`
- `Outbox 테이블 저장 + RabbitMQ 비동기 발행으로 후속 처리 경계를 분리`
- `50VU에서 failed 100%, p95 21.5s였던 흐름을 500VU에서도 failed 0%, p95 3.8s, 206.5 req/s로 안정화`

## 2) 이미지 인벤토리

### 2-1. 회원가입 계약

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case1-signup-response-before.png` | `HTTP/2 200` | 회원가입이 동기 완료 응답으로 끝나던 before 상태 | 응답 코드 증거 |
| `after/case1-signup-response-after.png` | `HTTP/2 202`, `X-User-Id` 헤더 확인 | 회원가입을 비동기 접수 흐름으로 전환 | 이력서에 가장 안전한 숫자/계약 증거 |

### 2-2. Hibernate SQL 경계

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case1-hibernate-before.png` | `org.hibernate.SQL` 로그에서 `insert into users`, `insert into auth_user`, `select ... users` 패턴이 보임 | 저장/조회가 한 요청 흐름에 붙어 있던 before 경로 | 정량 KPI보다는 구조 증거 |
| `after/case1-hibernate-after.png` | 동일 로그 스트림에서 `insert into users`, `insert into auth_user` 경로가 정리된 상태로 보임 | Persistable/Outbox 이후의 저장 경로 정리 | SQL 경계 증거 |

### 2-3. Outbox 테이블

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case1-outbox-table-before.png` | `domain=user`, `event_type=UserRegisteredEvent`, `status=PUBLISHED`, `created_at=2026-02-28 20:08:37.365 +0900`, `published_at=2026-02-28 20:08:37.882 +0900` | Outbox row가 실제로 생성되고 발행되는 lifecycle | publish lag 약 `0.52s` |
| `after/case1-outbox-table-after.png` | `domain=user`, `event_type=UserRegisteredEvent`, `status=PUBLISHED`, `created_at=2026-02-28 21:20:47.438 +0900`, `published_at=2026-02-28 21:20:48.084 +0900` | 동일한 Outbox lifecycle이 after run에서도 확인됨 | publish lag 약 `0.65s` |

> 주의: 이 두 이미지는 `before/after 상태 비교`라기보다 `capture 시점이 다른 Outbox row 확인`에 가깝다.  
> 따라서 `status가 어떻게 바뀌었는가`보다 `Outbox row persisted + published`를 증명하는 용도로 쓰는 것이 맞다.

### 2-4. Grafana / k6 스크린샷 값

| 이미지 | 읽히는 값 | 무엇을 쓰면 좋은가 | 메모 |
|---|---|---|---|
| `before/case1-grafana-http-rate-before.png` | `Request Rate 0.9/s`, `Request Duration p95 21.5s`, `Request Failed 100.0%`, `VUs 50` | before 고부하 한계/실패 증거 | screenshot-level canonical |
| `after/case1-grafana-http-rate-after.png` | `Request Rate 206.5/s`, `Request Duration p95 3.8s`, `Request Failed 0.0%`, `VUs 499` | after 고부하 안정성/처리량 증거 | screenshot-level canonical |
| `before/case1-k6-write-50-before.png` | `Request Rate 0.9/s`, `p95 21.5s`, `Request Failed 100.0%`, `VUs 50` | Grafana와 같은 값의 원본 부하테스트 화면 | 이 케이스의 가장 강한 수치 |
| `after/case1-k6-write-500-after.png` | `Request Rate 206.5/s`, `p95 3.8s`, `Request Failed 0.0%`, `VUs 499` | after 고부하 안정화 결과 | `499 VUs`로 표시됨 |

### 2-5. RabbitMQ 큐

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `after/case1-rabbitmq-queue-after-auth.png` | `Queue app.events.auth`, `Ready 1304`, `Unacked 250`, `Total 1554`, `Publish 0.40/s`, `Consumer ack 1.2/s`, `Consumers 1` | auth 후속 이벤트가 큐로 분리되어 쌓이고 소비되는 모습 | after-only 보강 증거 |
| `after/case1-rabbitmq-queue-after-user.png` | `Queue app.events.user`, `Ready 4231`, `Unacked 250`, `Total 4481`, `Publish 8.4/s`, `Consumer ack 0.80/s`, `Consumers 1` | user 후속 이벤트도 큐로 분리되어 흐르는 모습 | after-only 보강 증거 |

## 3) 바로 써도 되는 수치

### 3-1. 스크린샷 기준

- `회원가입 응답`: `200 -> 202 Accepted + X-User-Id`
- `before 부하`: `50VU`, `failed 100.0%`, `p95 21.5s`, `0.9 req/s`
- `after 부하`: `500VU`, `failed 0.0%`, `p95 3.8s`, `206.5 req/s`
- `Outbox publish lag`: `~0.5s` to `~0.7s`
- `RabbitMQ after queue`: `app.events.auth ready 1304 / unacked 250`, `app.events.user ready 4231 / unacked 250`

### 3-2. raw summary.json 기준

| snapshot | http_req_failed | http_req_duration p95 | http_reqs rate | checks | vus_max |
|---|---:|---:|---:|---:|---:|
| `before/case1-signup-before-summary.json` | `2.104%` | `315.189ms` | `28.421/s` | `98.95%` | `50` |
| `after/case1-signup-summary.json` | `0%` | `5.177s` | `168.352/s` | `100%` | `500` |

> 주의: 위 raw summary 값은 스크린샷 값과 캡처 창이 다르다.  
> 따라서 `before -> after` 개선 문장에 raw summary와 screenshot 값을 같이 넣지 말고, 하나의 레이어만 선택해서 쓰는 것이 안전하다.

### 3-3. checks raw counts

| snapshot | signup status matches expectation | accepted response includes X-User-Id | total checks |
|---|---:|---:|---:|
| `before/case1-signup-before-summary.json` | `5908 pass / 127 fail` | `6035 pass / 0 fail` | `11943 pass / 127 fail` |
| `after/case1-signup-summary.json` | `168366 pass / 0 fail` | `168366 pass / 0 fail` | `336732 pass / 0 fail` |

> 이 표는 `회원가입 API 계약`이 단순한 응답 코드 변경이 아니라, 체크 레이어에서도 완전히 안정화되었음을 보강한다.

## 4) 추천 문구 템플릿

### 4-1. 계약/구조 중심

`[JPA 영속성 컨텍스트 최적화] UUIDv7 merge(SELECT+INSERT) 경로를 Persistable.isNew()와 Outbox 패턴으로 정리하고, 회원가입 응답을 200 -> 202 Accepted + X-User-Id 비동기 흐름으로 전환`

### 4-2. 수치 포함형

`[JPA 영속성 컨텍스트 최적화] 회원가입을 200 -> 202 Accepted + X-User-Id 비동기 흐름으로 전환하고, 50VU에서 failed 100%, p95 21.5s였던 흐름을 500VU에서도 failed 0%, p95 3.8s, 206.5 req/s로 안정화`

### 4-3. 보수형

`[JPA 영속성 컨텍스트 최적화] UUIDv7 merge(SELECT+INSERT) 병목을 Persistable.isNew()와 Outbox 비동기 분리로 해소해 저장 책임과 메시징 책임의 경계를 명확히 하고, 고부하에서도 안정적인 응답 계약을 확보`

## 5) 한 줄 결론

Case 1은 `성능 수치`보다 `응답 계약 전환`이 본체이고,  
숫자는 `50VU 실패 100% -> 500VU 실패 0%`, `p95 21.5s -> 3.8s`, `req/s 0.9 -> 206.5`를 보강 근거로 붙이는 것이 가장 안전하다.
