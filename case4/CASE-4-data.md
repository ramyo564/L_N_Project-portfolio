# CASE 4 Data Pack

> 범위: `/home/yohan/Git-U/L_N_Project-portfolio/case4`
> 목적: Case 4의 `phase A/B/C` 수치를 다시 열지 않고도, 이력서/포트폴리오/면접 문구를 바로 뽑아 쓸 수 있게 정규화한 데이터 자산
> 기준: `2026-03-13` 재수집 + `2026-03-14` latest-branch 2x2 matrix complete closure

## 사용 규칙

1. Case 4는 일반적인 before/after pair가 아니라 `phase A -> phase B -> phase C`의 matrix 케이스다.
2. 숫자를 쓸 때는 먼저 `canonical claim ledger`와 `case4-final-status-2026-03-14.md`를 우선한다.
3. 포트폴리오 SVG는 전달용 파생 산출물이고, raw compare 문서가 더 강한 근거다.
4. `2026-03-13` 완화와 `2026-03-14` complete closure를 한 문장에 섞어도 되지만, phase를 명시하는 편이 더 안전하다.
5. `영구 0 오류 보장`, `단일 변수 100% 증명` 같은 과잉 단정은 쓰지 않는다.

## Source Priority

1. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/canonical-claim-ledger.md` (`CASE-4` row)
2. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-final-status-2026-03-14.md`
3. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-logic-flow.md`
4. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-root-cause-2026-03-13/compare.md`
5. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-root-cause-2026-03-14/after/compare.md`
6. `./case4-evidence-manifest.md`
7. `./before/*.svg`, `./after/*.svg`

## 1) Headline-ready claim slots

- `2026-03-13 장애 패턴(TaskRejectedException=1067, RedisConnectionFailureException=8002, Pool exhausted=8002)을 기준으로 최신 브랜치를 재검증`
- `2026-03-13 fail/control 재수집에서 req/s 651.62 -> 808.62, health timeout -> HTTP 200으로 사용자 경로 회복`
- `2026-03-14 2x2 matrix에서 app-key NO_MATCH 12/12, health 200 4/4로 complete closure`
- `2026-03-14 matrix raw에서 http_req_failed.rate 0/0/0.0000011747/0, checks.rate 1/1/0.9999986543/1`
- `Phase A에서 C3/C4 matrix가 완화축을 분리했고, Phase B에서 사용자 경로 회복을 확인한 뒤, Phase C에서 latest-branch complete를 확정`

## 2) Image Inventory

### 2-1. Phase A Summary

| image | 읽히는 값 | 의미 | note |
|---|---|---|---|
| `before/case4-phase-a-matrix-before-2026-03-13.svg` | `C3: http_req_failed.rate 0.0106`, `checks.rate 0.9908`, `req/s 442.77`, `method_error_count 524`; `C4: http_req_failed.rate 0.0000`, `checks.rate 1.0000`, `req/s 804.68`, `redis_conn_failure_count 2448` | `VT=true` 구간에서 완화축을 식별한 요약 카드 | derived summary |

### 2-2. Phase B Summary

| image | 읽히는 값 | 의미 | note |
|---|---|---|---|
| `before/case4-phase-b-fail-control-before-2026-03-13.svg` | `FAIL: http_req_failed.rate 0.0024898`, `checks.rate 0.9975160`, `req/s 651.62`, `health timeout`, `nginx 499 2350`; `CONTROL: http_req_failed.rate 0`, `checks.rate 1`, `req/s 808.62`, `health HTTP 200` | 사용자 경로 회복은 확인됐지만 내부 Redis 예외가 남아 있던 재수집 요약 카드 | derived summary |

### 2-3. Phase C Summary

| image | 읽히는 값 | 의미 | note |
|---|---|---|---|
| `after/case4-phase-c-matrix-after-2026-03-14.svg` | `app-key NO_MATCH 12/12`, `health 200 4/4`, `http_req_failed.rate 0/0/0.0000011747/0`, `checks.rate 1/1/0.9999986543/1` | latest-branch 2x2 matrix complete closure | public portfolio summary |
| `after/case4-phase-c-codepath-after-2026-03-14.svg` | `TaskRejectedException 1067`, `RejectedExecutionException 1067`, `AsyncExecutionInterceptor 9067`, `RedisConnectionFailureException 8002`, `Pool exhausted 8002`; latest branch에서는 공용 `CacheEvictionListener` 제거, 리스너 분리, `@Async` 제거 | 과거 장애 시그니처가 최신 브랜치에서 사라졌는지 보여주는 코드/로그 카드 | code-path closure |

### 2-4. Supporting After Captures

| image | 읽히는 값 | 의미 | note |
|---|---|---|---|
| `after/web-dashboard-img/after-vt-true-redis-true.png` | matrix support capture | VT/Redis 조합 시각화 보조 | after-only |
| `after/web-dashboard-img/after-vt-true-redis-false.png` | matrix support capture | VT/Redis 조합 시각화 보조 | after-only |
| `after/web-dashboard-img/after-vt-false-redis-true.png` | matrix support capture | VT/Redis 조합 시각화 보조 | after-only |
| `after/web-dashboard-img/after-vt-false-redis-false.png` | matrix support capture | VT/Redis 조합 시각화 보조 | after-only |

## 3) Phase-A / Phase-B / Phase-C Numeric Snapshot

### 3-1. Phase A: C3/C4 matrix

| case | http_req_failed.rate | checks.rate | req/s | p95(ms) | summary count |
|---|---:|---:|---:|---:|---|
| `C3` | `0.0105797574` | `0.9907792549` | `442.7722447` | `243.333635` | `method_error_count 524`, `redis_conn_failure_count 0` |
| `C4` | `0` | `1` | `804.6822642` | `468.0983063` | `method_error_count 0`, `redis_conn_failure_count 2448` |

### 3-2. Phase B: fail/control recapture

| run | http_req_failed.rate | checks.rate | req/s | p95(ms) | health | nginx evidence | log evidence |
|---|---:|---:|---:|---:|---|---|---|
| `FAIL (share-native=false)` | `0.002489808324989272` | `0.997516005121639` | `651.6166638477929` | `460.2798065` | `timeout` | `499=2350` | `spring app log lines 0` |
| `CONTROL (share-native=true)` | `0` | `1` | `808.616883970911` | `411.8873139` | `HTTP 200` | `499/5xx none` | `spring app log lines 5068`, `RedisConnectionFailureException`, `Pool exhausted` |

### 3-3. Phase C: 2x2 matrix compare

| case_id | vt | redis share-native | http_req_failed.rate | checks.rate | http_reqs.count | p95(ms) | avg(ms) | health |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `after-vt-true-redis-true` | true | true | `0` | `1` | `831007` | `379.083` | `184.968` | `HTTP/1.1 200` |
| `after-vt-true-redis-false` | true | false | `0` | `1` | `802784` | `459.780` | `206.305` | `HTTP/1.1 200` |
| `after-vt-false-redis-true` | false | true | `0.0000011747` | `0.9999986543` | `851296` | `325.502` | `169.657` | `HTTP/1.1 200` |
| `after-vt-false-redis-false` | false | false | `0` | `1` | `821984` | `368.897` | `191.908` | `HTTP/1.1 200` |

### 3-4. Phase C: code/path signatures

| artifact | 읽히는 값 | 의미 |
|---|---|---|
| `case4-phase-c-codepath-after-2026-03-14.svg` | `TaskRejectedException 1067`, `RejectedExecutionException 1067`, `AsyncExecutionInterceptor 9067`, `RedisConnectionFailureException 8002`, `Pool exhausted 8002` | 2026-03-13의 핵심 시그니처가 최신 브랜치에서는 재현되지 않았음을 보여줌 |
| `case4-phase-c-codepath-after-2026-03-14.svg` | `common CacheEvictionListener: removed`, `project/task/subtask listeners: split`, `@Async on listeners: none`, `2x2 matrix app-key NO_MATCH`, `2x2 matrix health 200` | 코드 경로 소거와 complete 판정의 근거 |

## 4) Raw Archive Snapshot Table

| archive | http_req_failed.rate | checks.rate | req/s | p95(ms) | summary note |
|---|---:|---:|---:|---:|---|
| `before/c1` | `0` | `1` | `932.3316613` | `269.3867895` | `method_error_count 0`, `redis_conn_failure_count 0` |
| `before/c2` | `0.0002535962` | `0.9997240364` | `793.1046584` | `495.2065954` | `method_error_count 0`, `redis_conn_failure_count 3044` |
| `before/c3` | `0.0105797574` | `0.9907792549` | `442.7722447` | `243.3336350` | `method_error_count 524`, `redis_conn_failure_count 0` |
| `before/c4` | `0` | `1` | `804.6822642` | `468.0983063` | `method_error_count 0`, `redis_conn_failure_count 2448` |

> 주의: `c1~c4`는 raw archive snapshot이다.  
> 공개 문장에는 `phase A/B/C` 또는 canonical compare 값만 쓰고, `c1~c4`는 보조 자산으로만 사용한다.

## 5) 바로 써도 되는 수치

### 5-1. 수치형 claim

- `2026-03-13 장애 시그니처`: `TaskRejectedException 1067`, `RejectedExecutionException 1067`, `AsyncExecutionInterceptor 9067`, `RedisConnectionFailureException 8002`, `Pool exhausted 8002`
- `Phase A`: `C3 0.0105797574 -> C4 0`의 `http_req_failed.rate`, `req/s 442.7722447 -> 804.6822642`
- `Phase B`: `fail 651.6166638 req/s / timeout / 499 2350 -> control 808.6168839 req/s / HTTP 200 / 499 none`
- `Phase C matrix`: `app-key NO_MATCH 12/12`, `health 200 4/4`
- `Phase C raw`: `http_req_failed.rate 0/0/0.0000011747/0`, `checks.rate 1/1/0.9999986543/1`

### 5-2. 권장 해석

- `Phase A`는 완화축 식별
- `Phase B`는 사용자 경로 회복 확인
- `Phase C`는 latest-branch complete closure
- `Case 4`는 단일 before/after가 아니라 `matrix verification`으로 설명하는 것이 가장 정확하다

## 6) 추천 문구 템플릿

### 6-1. 완료 판정 중심

`[완전 검증형 안정화] 2026-03-13에서 확인된 @Async CacheEvictionListener/Redis pool 예외 패턴을 기준으로 최신 브랜치를 재검증하고, 2026-03-14 2x2 matrix에서 app-key NO_MATCH 12/12, health 200 4/4로 complete 종료`

### 6-2. 사용자 경로 중심

`[사용자 경로 회복] 2026-03-13 fail/control 재수집에서 req/s 651.62 -> 808.62, health timeout -> HTTP 200, nginx 499 2350 -> none으로 회복을 확인`

### 6-3. 시그니처 소거 중심

`[장애 시그니처 소거] TaskRejectedException 1067, RedisConnectionFailureException 8002, Pool exhausted 8002가 2026-03-14 latest-branch 2x2 matrix에서는 재현되지 않음`

## 7) 한 줄 결론

Case 4는 `2026-03-13 장애 패턴 식별`에서 끝나는 케이스가 아니라,  
`2026-03-14 latest-branch 2x2 matrix complete closure`까지 포함해야 문맥이 맞고,  
수치 자산화의 핵심은 `fail/control 회복`, `C3/C4 matrix`, `app-key NO_MATCH 12/12`, `health 200 4/4`, `TaskRejectedException/RedisConnectionFailureException 소거`다.
