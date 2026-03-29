# CASE 2 Data Pack

> 범위: `/home/yohan/Git-U/L_N_Project-portfolio/case2`
> 비교축: `e67fc2b7^ -> 3c2bffd8`
> 목적: Case 2 이미지를 다시 열지 않고도, 이력서/포트폴리오/면접 문구를 바로 뽑아 쓸 수 있게 정규화한 데이터 자산

## 사용 규칙

1. 이 케이스의 본질은 `JWT Claims + AOP 단일 권한 게이트`다.
2. 공개 claim의 중심 숫자는 `대표 단일 요청 권한 게이트 3 -> 1`이다.
3. 스크린샷 값과 `summary.json` 값이 서로 다른 캡처 창을 가리키므로, 한 headline 문장 안에서 섞지 않는다.
4. `failure summary txt`는 진단용 보조 자료다. headline에는 쓰지 않는다.
5. OAuth2 확장성은 `Google / Kakao / Naver` 3개 공급자 추상화로 수치화할 수 있다.

## 1) Headline-ready claim slots

- `대표 단일 요청 권한 게이트를 3 -> 1로 축소`
- `JWT Claims + AOP 단일 게이트로 인증/권한 검증 경계를 단일화`
- `1000VU read에서 p95 742ms -> 290ms, req/s 1.67k -> 4.32k로 개선`
- `Google / Kakao / Naver 3개 OAuth2 공급자를 인터페이스로 추상화`

## 2) 이미지 인벤토리

### 2-1. 인증/권한 쿼리 경로

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case2-hibernate-queries-before.png` | `Total queries: 3` | 대표 단일 요청에서 인증/권한 쿼리가 3회 발생하던 before | 공개 claim의 핵심 증거 |
| `after/case2-hibernate-queries-after.png` | `Total queries: 1` | JWT Claims + AOP 적용 후 1회로 수렴한 after | 공개 claim의 핵심 증거 |

### 2-2. Read path

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case2-k6-read-1000-before.png` | `Request Rate 1.67k/s`, `Request Duration p95 742ms 610µs`, `Request Failed 0.0%`, `VUs 995` | before read 경로의 지연과 처리량 기준점 | screenshot-level canonical |
| `after/case2-k6-read-1000-after.png` | `Request Rate 4.32k/s`, `Request Duration p95 290ms 420µs`, `Request Failed 0.0%`, `VUs 1k` | after read 안정화와 처리량 증가 | screenshot-level canonical |
| `before/case2-grafana-slowQuery-before.png` | before read 지연과 병목 시각화 | k6 screenshot과 같은 방향의 보조 증거 | 숫자는 k6 screenshot 우선 |
| `after/case2-grafana-slowQuery-after.png` | after read 지연 안정화 시각화 | k6 screenshot과 같은 방향의 보조 증거 | 숫자는 k6 screenshot 우선 |

### 2-3. Redis auth token cache

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case2-redis-empty-before.png` | auth token namespace가 비어 있음 | 캐시 미적재 before 상태 | 구조 증거 |
| `after/case2-redis-key-after.png` | auth token key lookup / scan 경로가 확인됨 | 토큰 캐시가 반영된 after 상태 | 구조 증거 |

### 2-4. Postgres / slow query 패널

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case2-grafana-postgres-before.png` | 인증/권한 쿼리 부담이 누적된 상태 | 쿼리 3 -> 1과 같은 방향의 보조 증거 | 수치보다 추세용 |
| `after/case2-grafana-postgres-after.png` | 쿼리 경로가 단순화된 상태 | after 안정화 보조 증거 | 수치보다 추세용 |

## 3) 바로 써도 되는 수치

### 3-1. 스크린샷 기준

- `대표 단일 요청 권한 게이트`: `3 -> 1`
- `1000VU read before`: `Request Rate 1.67k/s`, `p95 742ms`, `Request Failed 0.0%`, `VUs 995`
- `1000VU read after`: `Request Rate 4.32k/s`, `p95 290ms`, `Request Failed 0.0%`, `VUs 1k`
- `OAuth2 공급자 수`: `3` (`Google / Kakao / Naver`)

### 3-2. raw summary.json 기준

| snapshot | http_req_failed | http_req_duration p95 | http_reqs rate | checks success rate | vus_max |
|---|---:|---:|---:|---:|---:|
| `before/mvc-read-fixed-user-load-test-summary.json` | `0` | `651.973ms` | `1106.956/s` | `100%` | `1000` |
| `after/mvc-read-fixed-user-load-test-summary.json` | `0` | `238.748ms` | `2479.398/s` | `70.7584%` | `1000` |

> 주의: raw summary는 스크린샷 캡처 창과 다르다.  
> 따라서 `742ms -> 290ms` 같은 screenshot-level 문장과 `651.973ms -> 238.748ms` 같은 raw summary 문장을 한 줄에 섞지 않는 것이 안전하다.

### 3-3. raw checks counts

| snapshot | checks passes | checks fails | total |
|---|---:|---:|---:|
| `before/mvc-read-fixed-user-load-test-summary.json` | `1,988,051` | `0` | `1,988,051` |
| `after/mvc-read-fixed-user-load-test-summary.json` | `3,012,053` | `1,244,758` | `4,256,811` |

> 이 값은 전체 task-level checks를 합친 raw 수치다.  
> `after`는 일부 서브체크 실패가 섞여 있어, 이력서 headline에는 `checks rate`보다 `쿼리 수 3 -> 1`과 `read p95 / req/s`를 쓰는 편이 더 정확하다.

### 3-4. failure summary txt

| artifact | 읽히는 값 | 메모 |
|---|---|---|
| `before/mvc-read-failure-summary.txt` | 템플릿 플레이스홀더가 그대로 남아 있어 수치화 불가 | 진단용 보조 자료, headline 금지 |
| `after/mvc-read-failure-summary.txt` | `HTTP 요청 실패 2,966,023 / 2,966,023 (100.0000%)`, `Check 실패 1,244,758 / 4,256,811 (29.2416%)` | raw summary와 충돌하므로 headline 금지 |

## 4) 추천 문구 템플릿

### 4-1. 구조 중심

`[확장 가능한 인증 아키텍처 설계] JWT Claims + AOP 기반 단일 권한 게이트로 대표 요청의 기본 검증 경로를 3 -> 1로 줄이고, Google / Kakao / Naver 3개 OAuth2 공급자를 인터페이스로 추상화`

### 4-2. 수치 포함형

`[확장 가능한 인증 아키텍처 설계] JWT Claims + AOP 기반 권한 게이트를 3 -> 1로 단순화하고, 1000VU read에서 p95 742ms -> 290ms, req/s 1.67k -> 4.32k로 개선`

### 4-3. 확장성 중심

`[확장 가능한 인증 아키텍처 설계] OAuth2UserInfo 추상화로 Google / Kakao / Naver 3개 소셜 로그인 공급자를 통합하고, 핵심 비즈니스 로직 변경 범위를 최소화`

## 5) 한 줄 결론

Case 2는 `인증/권한 쿼리 3 -> 1`이 본체이고,  
숫자는 `1000VU read p95 742ms -> 290ms`, `1.67k/s -> 4.32k/s`, `OAuth2 공급자 3개`, `쿼리 3 -> 1`을 보강 근거로 붙이는 것이 가장 안전하다.
