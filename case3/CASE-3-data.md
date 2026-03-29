# CASE 3 Data Pack

> 범위: `/home/yohan/Git-U/L_N_Project-portfolio/case3`
> 비교축: `e4d083e8^ -> main`
> 목적: Case 3 이미지를 다시 열지 않고도, 이력서/포트폴리오/면접 문구를 바로 뽑아 쓸 수 있게 정규화한 데이터 자산

## 사용 규칙

1. 이 케이스의 본질은 `트랜잭션 경계 축소 + Redis Pending Cache 보완 + 고부하 read 안정화`다.
2. 스크린샷 값과 `summary.json` 값이 서로 다른 캡처 창을 가리키므로, 한 headline 문장 안에서 섞지 않는다.
3. headline은 `pg_stat_activity / Redis / Grafana / k6 스크린샷` 레이어를 우선 쓰고, raw 수치는 보강 증거로 둔다.
4. `failure summary txt`는 실패 슬라이스 보조자료다. 개선 문장에는 쓰지 않는다.
5. 이력서용 숫자는 `idle in transaction`처럼 변동하는 값은 `pg_stat_activity snapshot` 기준으로만 쓰고, `1000VU p95 3.1s -> 314ms`, `1.52k/s -> 3.79k/s`, `HTTP_STATUS 200`, `TTL 366s` 순으로 쓰는 것이 안전하다.

## 1) Headline-ready claim slots

- `트랜잭션 경계를 분리하고 Redis Pending Cache를 도입해 idle in transaction을 snapshot 기준 9 -> 0으로 해소`
- `1000VU read에서 p95 3.1s -> 314ms, req/s 1.52k -> 3.79k로 개선`
- `프로젝트 생성 직후 GET 200을 확보하고 Redis project:pending:* TTL 366s를 확인`
- `HikariCP 풀의 active/idle oscillation을 안정화`

## 2) 이미지 인벤토리

### 2-1. Read path

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case3-k6-read-1000-before.png` | `Request Rate 1.52k/s`, `Request Duration p95 3.1s`, `Request Failed 0.0%`, `VUs 1k` | before 고부하 read 한계와 지연 | screenshot-level canonical |
| `after/case3-k6-read-1000-after.png` | `Request Rate 3.79k/s`, `Request Duration p95 314ms`, `Request Failed 0.0%`, `VUs 1k` | after read 안정화와 처리량 증가 | screenshot-level canonical |

### 2-2. DB session / connection

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case3-pg_stat_idle_transaction-before.png` | `idle in transaction` 세션 9개가 보임 | 캡처 시점에 캐시 미스 구간에서 트랜잭션이 오래 붙잡혀 있던 상태 | snapshot 기준 세션 증거 |
| `after/case3-pg_stat_idle_transaction-after.png` | 행 0개 | idle in transaction이 해소된 상태 | after canonical |
| `before/case3-pg_stat_state_count-before.png` | `idle 17`, `idle in transaction 5`, `active 4` | DB state mix가 아직 불안정했던 before | 보조 정량 증거 |
| `before/case3-Grafana-HikariCP-before.png` | active/idle이 계속 출렁이고 total 20 풀을 소모 | 커넥션 풀이 압박받던 상태 | 정량보다는 추세 증거 |
| `after/case3-Grafana-HikariCP-after.png` | total 20이 유지되며 active가 낮고 idle이 안정적 | HikariCP 고갈 위험이 줄어든 상태 | after 추세 증거 |
| `before/case3-Grafana-db-before.png` | `idle`, `idle in transaction`, `active`가 함께 흔들림 | DB 세션 혼잡과 대기 상태가 섞여 있던 before | 추세 증거 |
| `after/case3-Grafana-db-after.png` | `idle`이 우세하고 `idle in transaction`은 사실상 사라짐 | 트랜잭션 경계 분리 후 안정화 상태 | 추세 증거 |
| `before/case3-Grafana-Connectuib-efficiency-leak-before.png` | Hikari worker / Spring / idle tx 지표가 출렁임 | connection efficiency leak 압박이 있던 상태 | 보조 증거 |
| `after/case3-Grafana-Connectuib-efficiency-leak-after.png` | leak pressure가 거의 0으로 평평함 | leak pressure 완화 | 보조 증거 |

### 2-3. Pending cache / 생성 직후 조회

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `after/case3-redis-pending-key-after.png` | `project:pending:*` 키가 존재, `TTL 366`, `ownership:*`는 empty array | Pending Cache가 실제로 적재되고 유지되는 모습 | after-only 보강 증거 |
| `after/case3-response-200-after.png` | 프로젝트 생성 후 후속 GET에서 `HTTP_STATUS: 200` | 생성 직후 조회 race가 완화된 결과 | 기능 정상화 증거 |

## 3) 바로 써도 되는 수치

### 3-1. 스크린샷 기준

- `1000VU read before`: `Request Rate 1.52k/s`, `p95 3.1s`, `Request Failed 0.0%`, `VUs 1k`
- `1000VU read after`: `Request Rate 3.79k/s`, `p95 314ms`, `Request Failed 0.0%`, `VUs 1k`
- `pg_stat_activity before snapshot`: `idle in transaction visible rows 9`
- `pg_stat_activity after`: `0`
- `DB state count before`: `idle 17`, `idle in transaction 5`, `active 4`
- `Redis pending after`: `project:pending:*`, `TTL 366s`, `ownership:*` empty
- `생성 직후 조회 after`: `HTTP_STATUS 200`

### 3-2. raw summary.json 기준

| snapshot | http_req_failed | http_req_duration p95 | http_reqs rate | checks success rate | vus_max |
|---|---:|---:|---:|---:|---:|
| `after/mvc-read-fixed-user-load-test-summary.json` | `0` | `301.152ms` | `2151.701/s` | `70.7788%` | `1000` |

> 주의: 이 raw summary는 스크린샷 캡처 창과 다르다.  
> 따라서 `3.1s -> 314ms` 같은 screenshot-level 문장과 `301.152ms` 같은 raw summary 문장을 한 줄에 섞지 않는 것이 안전하다.

### 3-3. raw checks counts

| snapshot | checks passes | checks fails | total |
|---|---:|---:|---:|
| `after/mvc-read-fixed-user-load-test-summary.json` | `2,531,990` | `1,045,337` | `3,577,327` |

> 이 값은 전체 task-level checks를 합친 raw 수치다.  
> 이력서 headline에는 `성공률 %`보다 `세션 안정화`와 `즉시 조회 정상화`를 쓰는 편이 더 정확하다.

### 3-4. additional failure slice

| artifact | 읽히는 값 | 메모 |
|---|---|---|
| `after/mvc-read-failure-summary.txt` | `HTTP 요청 실패 2,495,612 / 2,495,612 (100.0000%)`, `Check 실패 1,045,337 / 3,577,327 (29.2212%)` | 실패 슬라이스 보조자료. 개선 headline에는 사용하지 않는다 |

## 4) 추천 문구 템플릿

### 4-1. 안정화 중심

`[DB 트랜잭션 및 커넥션 튜닝] 트랜잭션 경계를 분리하고 Redis Pending Cache를 도입해 pg_stat_activity snapshot 기준 idle in transaction 9 -> 0으로 해소, 1000VU read에서 p95 3.1s -> 314ms, req/s 1.52k -> 3.79k로 개선`

### 4-2. 조회 정상화 중심

`[DB 트랜잭션 및 커넥션 튜닝] 캐시 미스 구간의 트랜잭션 결합을 끊고 Pending Cache를 보완해 생성 직후 조회를 HTTP_STATUS 200으로 안정화`

### 4-3. 커넥션 풀 중심

`[DB 트랜잭션 및 커넥션 튜닝] 트랜잭션 경계 분리와 Redis Pending Cache로 HikariCP 고갈을 방지하고, 고부하에서도 안정적인 세션 관리와 동시 처리 능력을 확보`

## 5) 한 줄 결론

Case 3는 `처리량` 자체보다 `세션 안정화`와 `즉시 조회 정상화`가 본체이고,  
숫자는 `pg_stat_activity snapshot 기준 idle in transaction 9 -> 0`, `1000VU p95 3.1s -> 314ms`, `1.52k/s -> 3.79k/s`, `HTTP_STATUS 200`을 보강 근거로 붙이는 것이 가장 안전하다.
