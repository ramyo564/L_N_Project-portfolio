# CASE 5 Data Pack

> 범위: `/home/yohan/Git-U/L_N_Project-portfolio/case5`
> 비교축: `before/after 동일 시나리오 재촬영`
> 목적: Case 5 이미지를 다시 열지 않고도, 이력서/포트폴리오/면접 문구를 바로 뽑아 쓸 수 있게 정규화한 데이터 자산

## 사용 규칙

1. 이 케이스의 본질은 `1000VU 쓰기 부하`에서 `convertAndSend` 발행 경로를 요청 스레드에서 분리한 비동기 발행 구조 개선이다.
2. `raw summary.json`과 `screenshot`은 같은 테스트라도 캡처 창이 다르므로, 한 headline 문장 안에서 섞지 않는다.
3. `http_req_failed.rate 0.93% -> 0%`, `p95 487.978ms -> 123.796ms`는 raw summary canonical이다.
4. `Request Rate 3.3/s -> 1.8k/s`, `Request Duration p95 30.4s -> 137ms`는 screenshot canonical이다.
5. `Loki thread_name`, `RabbitMQ Channels`, `Grafana Channels`, `Grafana Message Processing`은 원인/경로/백로그를 보강하는 구조 증거다.
6. `mvc-write-failure-summary.txt`는 보조 자료다. raw summary와 값이 다를 수 있으므로 headline에는 쓰지 않는다.
7. `case5/after/case6-k6-write-1000-backup.png`는 Case A 브리지용 보관 이미지다. 파일명만 보고 semantic before/after를 판단하지 않는다.
8. `RabbitMQ Web UI Channels`와 `Grafana Channels`는 서로 다른 화면이므로, 카운트를 서로 섞지 않는다.

## 0) Source Priority

1. `summary.json` - 최종 수치의 우선 근거
2. `k6/Grafana screenshot` - 사람이 바로 읽는 시각적 근거
3. `Loki thread_name` - 요청 스레드 vs 발행 스레드 분리 증거
4. `RabbitMQ Web UI / Grafana Channels` - 백로그와 채널 상태 보강
5. `report.html`, `mvc-write-failure-summary.txt` - 보조 자료

## 1) Headline-ready claim slots

- `convertAndSend를 request-thread(tomcat-handler/http-nio)에서 rabbit-pub/rabbit-publisher로 분리`
- `1000VU 쓰기에서 http_req_failed.rate 0.93% -> 0%로 완화`
- `1000VU 쓰기에서 http_req_duration p95 487.978ms -> 123.796ms로 개선`
- `스크린샷 기준 Request Rate 3.3/s -> 1.8k/s, p95 30.4s -> 137ms로 개선`
- `RabbitMQ backlog와 Unacked 잔량을 줄여 처리 경로를 안정화`

## 2) 이미지 인벤토리

### 2-1. 요청 경로 / 스레드

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case5-k6-write-1000-before.png` | `Request Rate 3.3/s`, `Request Duration p95 30.4s`, `Request Failed 100.0%`, `VUs 1k` | before 1000VU 쓰기 한계와 실패 상태 | screenshot-level canonical |
| `after/case5-k6-write-1000-after.png` | `Request Rate 1.8k/s`, `Request Duration p95 137ms 520µs`, `Request Failed 0.0%`, `VUs 995` | after 안정화와 처리량 개선 | screenshot-level canonical |
| `before/case5-thread-http-nio-before.png` | `Publishing message`가 `tomcat-handler-*` / `http-nio-*` 경로에서 관측됨 | 발행이 요청 스레드에 묶여 있던 before 경로 | 구조 증거 |
| `after/case5-thread-rabbit-publisher-after.png` | `Publishing message`가 `rabbit-pub-*` / `rabbit-publisher-*` 경로에서 관측됨 | 전용 발행 스레드로 분리된 after 경로 | 구조 증거 |

### 2-2. RabbitMQ / 채널 상태

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case5-rmq-web-channels-before.png` | 표에 `running` 행이 보이고 `Unacked 250`, `publish 44/s`, `deliver/ack 221~331/s`가 관측됨 | live-load에서 채널이 압박받는 상태 | 실시간 채널 증거 |
| `before/case5-rmq-web-channels-before-extra-1.png` | 같은 채널 화면의 확대 crop | before 채널의 세부 행 확인용 | crop variant |
| `before/case5-rmq-web-channels-before-extra-2.png` | 같은 채널 화면의 확대 crop | before 채널의 세부 행 확인용 | crop variant |
| `before/case5-rmq-web-channels-before-extra-3.png` | 같은 채널 화면의 확대 crop | before 채널의 세부 행 확인용 | crop variant |
| `after/case5-rmq-web-channels-after.png` | `Channels 172`, `Unacked 0`, `publish 16/s`, `confirm 16/s`, `deliver/ack 16/s`가 보임 | after 채널 상태가 훨씬 안정적임 | 실시간 채널 증거 |
| `after/case6-k6-write-1000-backup.png` | `case6` before와 동일한 시각적 내용 | Case A 브리지용 연결 이미지 | unique after canonical 아님 |

### 2-3. Grafana

| 이미지 | 읽히는 값 | 무엇을 증명하는가 | 메모 |
|---|---|---|---|
| `before/case5-grafana-http-response-time-percentiles-before.png` | `Request Rate 3.3/s`, `Request Duration p95 30.4s`, `Request Failed 100.0%` | before 응답 지연이 폭발한 상태 | Grafana canonical |
| `after/case5-grafana-http-response-time-percentiles-after.png` | `Request Rate 1.8k/s`, `Request Duration p95 137ms 520µs`, `Request Failed 0.0%` | after 응답 지연 개선 | Grafana canonical |
| `before/case5-grafana-rabbitmq-message-processing-before.png` | queue depth가 약 `67K`까지 상승 | RabbitMQ backlog가 쌓이던 상태 | backlog 증거 |
| `after/case5-grafana-rabbitmq-message-processing-after.png` | queue depth가 후반에 내려가며 drain됨 | 처리 지연이 해소되는 흐름 | backlog 해소 증거 |
| `before/case5-grafana-channels-before.png` | `Connections 1`, `Channels 312`, `Queues 10`, `Messages Ready 67242`, `Messages Unacked 538` | 채널/메시지 backlog가 컸던 상태 | overview 증거 |
| `after/case5-grafana-channels-after.png` | visible rows에서 `Unacked 0`, `publish/confirm/deliver ack`가 약 `16/s`로 안정적 | 채널 상태가 안정화된 상태 | overview 증거 |

### 2-4. Auxiliary raw artifacts

| 파일 | 읽히는 값 | 메모 |
|---|---|---|
| `before/report.html` | hover 시점별 raw 값 확인 가능 | 보조용 |
| `after/report.html` | hover 시점별 raw 값 확인 가능 | 보조용 |
| `before/mvc-task-subtask-fixed-user-load-test-summary.json` | raw summary canonical before | headline 우선 소스 |
| `after/mvc-task-subtask-fixed-user-load-test-summary.json` | raw summary canonical after | headline 우선 소스 |
| `before/mvc-write-failure-summary.txt` | `HTTP 요청 실패 446202 / 450406 (99.0666%)`, `Check 실패 3275 / 392303 (0.8348%)` | 보조 자료. raw summary와 캡처 창이 다를 수 있음 |
| `after/mvc-write-failure-summary.txt` | `HTTP 요청 실패 963680 / 963680 (100.0000%)`, `Check 실패 0 / 841470 (0.0000%)` | raw summary와 충돌 가능. headline 금지 |

## 3) 바로 써도 되는 수치

### 3-1. Screenshot canonical

- `1000VU write before`: `Request Rate 3.3/s`, `Request Duration p95 30.4s`, `Request Failed 100.0%`, `VUs 1k`
- `1000VU write after`: `Request Rate 1.8k/s`, `Request Duration p95 137ms 520µs`, `Request Failed 0.0%`, `VUs 995`
- `Grafana HTTP Response Time Percentiles before`: `Request Rate 3.3/s`, `p95 30.4s`, `Request Failed 100.0%`
- `Grafana HTTP Response Time Percentiles after`: `Request Rate 1.8k/s`, `p95 137ms 520µs`, `Request Failed 0.0%`
- `RabbitMQ web channels before`: `running`, `Unacked 250`, `publish 44/s`, `deliver/ack 221~331/s`
- `RabbitMQ web channels after`: `Channels 172`, `Unacked 0`, `publish 16/s`, `confirm 16/s`, `deliver/ack 16/s`
- `Grafana channels before`: `Connections 1`, `Channels 312`, `Queues 10`, `Messages Ready 67242`, `Messages Unacked 538`
- `Grafana message processing before`: queue depth `~67K`
- `Grafana message processing after`: queue depth drain observed

### 3-2. Raw summary.json canonical

| snapshot | http_req_failed.rate | http_req_duration p95 | http_reqs rate | checks.rate | checks pass / fail | http_req_failed pass / fail | vus_max |
|---|---:|---:|---:|---:|---:|---:|---:|
| `before/mvc-task-subtask-fixed-user-load-test-summary.json` | `0.00933380105948855` (`0.9334%`) | `487.97803899999997ms` | `432.90291011716295/s` | `0.9916518609340229` (`99.1652%`) | `389028 / 3275` | `4204 / 446202` | `1000` |
| `after/mvc-task-subtask-fixed-user-load-test-summary.json` | `0` (`0%`) | `123.79575859999997ms` | `1011.895809867784/s` | `1` (`100%`) | `841470 / 0` | `0 / 0` | `1000` |

> 주의: 위 raw summary 값은 screenshot 값과 캡처 창이 다르다.
> 따라서 `0.93% -> 0%`, `487.978ms -> 123.796ms` 같은 raw summary 문장과 `Request Rate 3.3/s -> 1.8k/s`, `p95 30.4s -> 137ms` 같은 screenshot 문장을 한 줄에 섞지 않는 것이 안전하다.

### 3-3. Raw checks counts

| snapshot | checks passes | checks fails | http_req_failed passes | http_req_failed fails |
|---|---:|---:|---:|---:|
| `before/mvc-task-subtask-fixed-user-load-test-summary.json` | `389028` | `3275` | `4204` | `446202` |
| `after/mvc-task-subtask-fixed-user-load-test-summary.json` | `841470` | `0` | `0` | `0` |

> 이 표는 `convertAndSend` 경로 분리 이후 체크 레이어까지 안정화되었음을 보강한다.

### 3-4. Failure summary txt 참고값

| snapshot | 읽히는 값 | 메모 |
|---|---|---|
| `before/mvc-write-failure-summary.txt` | `HTTP 요청 실패 446202 / 450406 (99.0666%)`, `Check 실패 3275 / 392303 (0.8348%)` | 보조 참고값 |
| `after/mvc-write-failure-summary.txt` | `HTTP 요청 실패 963680 / 963680 (100.0000%)`, `Check 실패 0 / 841470 (0.0000%)` | raw summary.json과 충돌할 수 있으므로 headline 금지 |

## 4) 추천 문구 템플릿

### 4-1. 구조 중심

`[가상 스레드 및 비동기 파이프라인 최적화] convertAndSend를 request-thread(tomcat-handler/http-nio)에서 rabbit-pub/rabbit-publisher로 분리하고, RabbitMQ backlog와 Unacked 잔량을 줄여 비동기 발행 경계를 명확히 함`

### 4-2. 수치 포함형

`[가상 스레드 및 비동기 파이프라인 최적화] 1000VU 쓰기에서 http_req_failed.rate 0.93% -> 0%, http_req_duration p95 487.98ms -> 123.80ms로 개선하고, raw summary 기준 http_reqs rate 432.90/s -> 1011.90/s로 처리량을 끌어올림`

### 4-3. 스크린샷 포함형

`[가상 스레드 및 비동기 파이프라인 최적화] k6 스크린샷 기준 Request Rate 3.3/s -> 1.8k/s, p95 30.4s -> 137ms로 개선하고, Loki thread_name과 RabbitMQ Channels로 request-thread 분리와 backlog 완화를 확인`

## 5) 한 줄 결론

Case 5는 `request-thread`에 묶여 있던 `RabbitMQ convertAndSend`를 전용 발행 스레드로 분리해, raw summary 기준 `http_req_failed.rate 0.93% -> 0%`, `p95 487.978ms -> 123.796ms`를 달성한 비동기 발행 개선 케이스다.
