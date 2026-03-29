# CASE 6 Data Pack

> 범위: `/home/yohan/Git-U/L_N_Project-portfolio/case6`
> 비교축 A: `500VU benchmark summary` 기준 대표 KPI
> 비교축 B: `1000VU case-local before/after 캡처` 기준 구조 증거
> 목적: Case 6 이미지를 다시 열지 않고도, 이력서/포트폴리오/면접 문구를 바로 뽑아 쓸 수 있게 정규화한 데이터 자산

## 사용 규칙

1. 이 케이스의 본체는 `500VU benchmark`다. `1000VU case-local`은 상세 구조 증거로 쓴다.
2. `500VU benchmark`와 `1000VU case-local` 수치는 같은 문장에 섞지 않는다.
3. `read`는 `summary.json`이 canonical이고, `write`는 `after summary.json` + `Grafana/k6` 조합이 canonical이다.
4. `write before`에는 이 폴더에 별도 `summary.json`이 없다. before write 숫자는 `Grafana`와 `report.html`을 보조로 쓴다.
5. `checks`는 read case에서 negative assertion이 섞여 있으므로, headline KPI로 쓰지 않는다.
6. `Hibernate`, `EXPLAIN`, `pg_indexes`는 `insertWithPosition`, partial index, after-commit 정리의 구조 증거다.
7. 스크린샷 숫자와 raw `summary.json` 숫자는 캡처 창이 다를 수 있으므로, 한 delta 문장 안에서 섞지 않는다.

## 0) Source Priority

1. `CASE-6.md`의 `500VU benchmark` 요약
2. `summary.json`의 case-local raw 수치
3. `k6/Grafana screenshot`의 사람 눈 기준 수치
4. `Hibernate / EXPLAIN / pg_indexes` 구조 증거
5. `report.html`, `mvc-read-failure-summary.txt`, `mvc-write-failure-summary.txt` 보조 자료

## 1) Headline-ready claim slots

- `500VU benchmark에서 read RPS 972 -> 3,680, write RPS 373 -> 916`
- `500VU benchmark에서 read p95 975ms -> 141ms, write p95 1.9s -> 126ms`
- `1000VU case-local read에서 p95 683.435ms -> 301.152ms, req/s 1.206k -> 2.152k`
- `1000VU case-local write after에서 p95 123.796ms, req/s 1.012k`
- `insertWithPosition + partial indexes + after-commit 정리로 고부하 경로를 안정화`
- `projects / tasks / sub_tasks의 query plan을 partial index 중심으로 전환`

## 2) 이미지 인벤토리

### 2-1. 500VU benchmark summary

> 이 수치는 `CASE-6.md`의 결과 섹션에 정리된 benchmark 대표값이다.  
> 이 폴더에는 해당 benchmark의 별도 before/after 이미지가 없으므로, summary-only 기준으로 쓴다.

| metric | before | after | 메모 |
|---|---:|---:|---|
| Read RPS | `972` | `3,680` | benchmark 대표 KPI |
| Write RPS | `373` | `916` | benchmark 대표 KPI |
| Read p95 | `975ms` | `141ms` | benchmark latency |
| Write p95 | `1.9s` | `126ms` | benchmark latency |

### 2-2. 1000VU read path

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case6-k6-read-1000-before.png` | `Request Rate 1.76k/s`, `Request Duration p95 756ms 370µs`, `Request Failed 0.0%`, `VUs 998` | before 1000VU read의 지연과 처리량 한계 | screenshot-level canonical |
| `after/case6-k6-read-1000-after.png` | `Request Rate 3.53k/s`, `Request Duration p95 350ms 800µs`, `Request Failed 0.0%`, `VUs 996` | after 1000VU read의 지연 완화와 처리량 개선 | screenshot-level canonical |
| `before/case6-grafana-read-response-time-before.png` | `HTTP Response Time Percentiles`가 `~850ms~1.1s` 대까지 올라감 | tail latency가 높았던 before 흐름 | 보강 증거 |
| `after/case6-grafana-read-response-time-after.png` | `HTTP Response Time Percentiles`가 `~100ms~150ms` 대로 내려감 | after read 안정화 | 보강 증거 |
| `before/case6-grafana-read-http-rpm-before.png` | `HTTP Requests per Minute`가 낮은 plateau에 머뭄 | before read throughput 한계 | 보강 증거 |
| `after/case6-grafana-read-http-rpm-after.png` | `HTTP Requests per Minute` plateau가 더 높고 길게 유지됨 | after read throughput 개선 | 보강 증거 |

### 2-3. 1000VU write path

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case6-grafana-write-response-time-before.png` | `HTTP Response Time Percentiles`가 `~1.7s~2.0s` 대까지 상승 | before write의 tail latency가 높았던 상태 | 구조/추세 증거 |
| `before/case6-grafana-write-http-rpm-before.png` | `HTTP Requests per Minute`가 plateau를 이루지만 after보다 낮음 | before write throughput 한계 | 구조/추세 증거 |
| `after/case6-k6-write-1000-after.png` | `Request Rate 1.8k/s`, `Request Duration p95 137ms 520µs`, `Request Failed 0.0%`, `VUs 995` | after write의 안정화와 처리량 개선 | screenshot-level canonical |
| `after/case6-grafana-write-response-time-after.png` | `HTTP Response Time Percentiles`가 `~100ms~130ms` 대로 내려감 | after write tail latency 개선 | 보강 증거 |
| `after/case6-grafana-write-http-rpm-after.png` | endpoint별 `HTTP Requests per Minute` plateau가 더 높고 안정적임 | after write throughput 개선 | 보강 증거 |

### 2-4. Hibernate / SQL shape

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case6-hibernate-separate-before.png` | `org.hibernate.SQL`, `tomcat-handler-*`, `select max(position)`와 `insert into ...`가 분리되어 보임 | before에는 위치 계산 SELECT와 INSERT가 분리된 경로였음 | 구조 증거 |
| `after/case6-hibernate-atomic-after.png` | `rabbit-listener-*`, `INSERT INTO tasks ... COALESCE(MAX(position), 0) + 1 ... RETURNING *` 패턴이 보임 | atomic INSERT 경로로 묶인 after 상태 | 구조 증거 |

### 2-5. EXPLAIN plan

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case6-explain-before-1.png` | `SELECT EXISTS` on `projects` uses `idx_projects_user_pos_active` | before에는 user_pos active index로 처리 | plan 비교 1 |
| `after/case6-explain-after-1.png` | `SELECT EXISTS` on `projects` uses `idx_projects_ownership` with `Index Only Scan` | ownership index가 적용된 after plan | plan 비교 1 |
| `before/case6-explain-before-2.png` | `tasks` pending query uses `idx_tasks_project_pos_active` + `status='PENDING'` filter | before에는 pending 전용 index가 없었던 상태 | plan 비교 2 |
| `after/case6-explain-after-2.png` | `tasks` pending query uses `idx_tasks_pending` | pending partial index가 적용된 after plan | plan 비교 2 |
| `before/case6-explain-before-3.png` | `COALESCE(MAX(position), 0)` query uses `idx_tasks_project_pos_active` | before max-position 조회 경로 | plan 비교 3 |
| `after/case6-explain-after-3.png` | `COALESCE(MAX(position), 0)` query uses `Index Only Scan Backward` + `LIMIT` | max-position 조회 경로가 더 직접적/효율적으로 정리됨 | plan 비교 3 |

### 2-6. pg_indexes / partial indexes

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case6-pg-indexes-active-before.png` | active partial indexes 3개만 보임: `idx_projects_user_pos_active`, `idx_sub_tasks_task_pos_active`, `idx_tasks_project_pos_active` | before는 active 경로 중심이었음 | index inventory before |
| `after/case6-pg-indexes-active-after.png` | active index inventory가 10개로 확장됨 | pending/done/ownership index가 추가된 상태 | index inventory after |
| `after/case6-pg-indexes-status-after.png` | `idx_projects_done`, `idx_projects_ownership`, `idx_projects_pending`, `idx_projects_user_pos_active`, `idx_sub_tasks_done`, `idx_sub_tasks_pending`, `idx_sub_tasks_task_pos_active`, `idx_tasks_done`, `idx_tasks_pending`, `idx_tasks_project_pos_active` | status별 partial indexes가 실제 생성되었음을 증명 | index status view |

### 2-7. Auxiliary raw artifacts

| 파일 | 읽히는 값 | 메모 |
|---|---|---|
| `before/mvc-read-fixed-user-load-test-summary.json` | read before raw summary | read canonical before |
| `after/mvc-read-fixed-user-load-test-summary.json` | read after raw summary | read canonical after |
| `after/mvc-task-subtask-fixed-user-load-test-summary.json` | write after raw summary | write canonical after |
| `before/read-report.html` | k6 dashboard export | 보조용 |
| `after/read-report.html` | k6 dashboard export | 보조용 |
| `before/write-report.html` | k6 dashboard export | before write는 별도 raw JSON이 없어서 보조용 |
| `after/write-report.html` | k6 dashboard export | 보조용 |
| `after/mvc-read-failure-summary.txt` | `HTTP 요청 실패 100%`, `Check 실패 29.2212%` | read failure slice. headline 금지 |
| `after/mvc-write-failure-summary.txt` | `HTTP 요청 실패 100%`, `Check 실패 0%` | write failure slice / 보조 자료. raw summary와 다를 수 있으므로 headline 금지 |

## 3) 바로 써도 되는 수치

### 3-1. 1000VU read screenshot canonical

- `before`: `Request Rate 1.76k/s`, `Request Duration p95 756ms 370µs`, `Request Failed 0.0%`, `VUs 998`
- `after`: `Request Rate 3.53k/s`, `Request Duration p95 350ms 800µs`, `Request Failed 0.0%`, `VUs 996`

### 3-2. 1000VU read raw summary canonical

| snapshot | http_req_failed.rate | http_req_duration p95 | http_reqs rate | checks.rate | checks pass / fail | vus_max |
|---|---:|---:|---:|---:|---:|---:|
| `before/mvc-read-fixed-user-load-test-summary.json` | `0` | `683.4358497000001ms` | `1206.499234079533/s` | `1` | `2083367 / 0` | `1000` |
| `after/mvc-read-fixed-user-load-test-summary.json` | `0` | `301.1524846999999ms` | `2151.7013487099507/s` | `0.7077882452456821` | `2531990 / 1045337` | `1000` |

> 주의: read after의 `checks.rate`는 negative assertion이 섞인 그룹이라 headline success KPI로 쓰지 않는다.

### 3-3. 1000VU write screenshot canonical

- `before`: `HTTP Response Time Percentiles`가 `~1.7s~2.0s` 대까지 상승
- `after`: `Request Rate 1.8k/s`, `Request Duration p95 137ms 520µs`, `Request Failed 0.0%`, `VUs 995`

### 3-4. 1000VU write raw summary canonical

| snapshot | http_req_failed.rate | http_req_duration p95 | http_reqs rate | checks.rate | checks pass / fail | vus_max |
|---|---:|---:|---:|---:|---:|---:|
| `after/mvc-task-subtask-fixed-user-load-test-summary.json` | `0` | `123.79575859999997ms` | `1011.895809867784/s` | `1` | `841470 / 0` | `1000` |

> 주의: `write before`는 별도 raw summary JSON이 이 폴더에 없다.  
> 따라서 write before의 정량 문장은 `Grafana screenshot`과 `CASE-6.md`의 benchmark summary를 기준으로 쓰는 것이 안전하다.

### 3-5. 500VU benchmark canonical

- `Read RPS`: `972 -> 3,680`
- `Write RPS`: `373 -> 916`
- `Read p95`: `975ms -> 141ms`
- `Write p95`: `1.9s -> 126ms`

## 4) 추천 문구 템플릿

### 4-1. Benchmark 중심

`[JDBC Batch + Partial Index + 원자적 INSERT 통합 튜닝] 500VU benchmark에서 read RPS 972 -> 3,680, write RPS 373 -> 916, read p95 975ms -> 141ms, write p95 1.9s -> 126ms로 개선`

### 4-2. Case-local read/write 중심

`[JDBC Batch + Partial Index + 원자적 INSERT 통합 튜닝] 1000VU case-local에서 read p95 683.435ms -> 301.152ms, req/s 1.206k -> 2.152k로 개선하고, write after는 p95 123.796ms, req/s 1.012k까지 안정화`

### 4-3. 구조 증거 중심

`[JDBC Batch + Partial Index + 원자적 INSERT 통합 튜닝] insertWithPosition으로 위치 계산과 INSERT를 원자화하고, ownership/pending/done partial index를 추가해 projects / tasks / sub_tasks의 query plan을 정리`

## 5) 한 줄 결론

Case 6는 `500VU benchmark`에서 대표 성능을 크게 끌어올리고, `1000VU case-local`에서는 atomic INSERT, partial index, after-commit 정리를 통해 read/write 경로를 구조적으로 안정화한 사례다.
