# Case 5. 비동기 발행 데코레이터로 p95 500ms -> 50ms 단축

> 기준일: 2026-02-27  
> 재진행 목적: Before/After를 처음부터 다시 촬영

---

## 0) 최종 결론 한 줄

Case 5는 같은 쓰기 부하에서 `convertAndSend` 발행 스레드가 `요청 스레드(tomcat-handler/http-nio)`에서 `전용 발행 스레드(rabbit-pub/rabbit-publisher)`로 분리되며, timeout/p95가 개선되는 것을 증명한다.

---

## 1) 증거 포인트 (필수)

1. k6 Summary: `http_req_failed`, `http_req_duration p(95)`
2. Loki 로그: `Publishing message`의 `thread_name` (Before vs After)
3. RabbitMQ Web UI `Channels` 탭: 부하 중 상태(`running`, `Unacked`, `deliver/ack`)
4. Grafana 3개 패널(정확한 패널명)
   - `Monitoring-Stress` 대시보드: `HTTP Response Time Percentiles`
   - `Monitoring-Stress` 대시보드: `RabbitMQ Message Processing`
   - `rabbitmq_overview` 대시보드: `Channels`

`RabbitMQ Web UI Channels`(3번)과 `Grafana Channels 패널`(4번-3)은 서로 다른 화면이다.

---

## 2) 기준 시점

### Before
```bash
git checkout aafc30e0
```

### After
```bash
git checkout main
# 또는 Case 5 변경 커밋 기준으로 7a257892
```

---

## 3) 로그 레벨 (application-dev.yml 기준)

`application-dev.yml`의 로거 매핑은 환경변수로 제어되므로, 아래를 명시해서 실행한다.

```bash
LOGGING_LEVEL_COM_EXAMPLE_PROJECT=DEBUG
LOGGING_LEVEL_COM_EXAMPLE_PROJECT_COMMON_INFRASTRUCTURE_MESSAGING=DEBUG
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_AMQP=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_AMQP_RABBIT_CONNECTION=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_AMQP_RABBIT_LISTENER=INFO
LOGGING_LEVEL_COM_RABBITMQ_CLIENT=INFO
```

`RabbitTemplate` 단독 DEBUG를 쓰려면 `application-dev.yml`에 아래 키를 추가해 둔다.

```yml
logging:
  level:
    org.springframework.amqp.rabbit.core.RabbitTemplate: ${LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_AMQP_RABBIT_CORE_RABBITTEMPLATE:INFO}
```

그다음:

```bash
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_AMQP_RABBIT_CORE_RABBITTEMPLATE=DEBUG
```

---

## 4) 실행 순서 (Before/After 공통)

1. 대상 코드/이미지로 스택 기동
2. k6 쓰기 부하 실행 (`1000VU` 기준)
3. 부하가 살아있는 구간(steady)에서 RabbitMQ `Channels` 캡처
4. 부하 종료 후 k6 Summary 캡처
5. Loki에서 동일 시간구간 조회 후 스레드 증거 캡처
6. Grafana 패널 캡처

---

## 5) k6 실행 예시

프로젝트에서 사용 중인 명령을 그대로 사용한다. 예:

```bash
docker compose --env-file env_docker/local/.env.k6 -f docker-compose.k6.yml \
  run --rm --service-ports k6 \
  "k6 run --out web-dashboard=export=scenarios_2/results/report.html \
   --out influxdb=http://influxdb:8086/k6 \
   /k6/scenarios_2/test/smoke_test/mvc-write-task-subtask-fixed-user-load-test.js \
   --env RAMPING_PROFILE=stress --env TOTAL_USERS=1000"
```

---

## 6) RabbitMQ Channels 캡처 규칙

캡처 타이밍:

1. k6가 ramp-up을 지나 부하가 유지되는 시점
2. 테스트 종료 직전/종료 후가 아님

화면 조건:

1. `All channels (N)` 헤더가 보일 것
2. 표에 `State`, `Unacked`, `deliver/ack` 컬럼이 보일 것
3. 가능하면 `running` 행 1개 이상 + `Unacked` 또는 `deliver/ack`가 0이 아닌 행이 포함될 것

주의:

1. 종료 후 캡처하면 대부분 `idle`, `0.00/s`로 내려가서 증거가 약해짐
2. Before/After는 같은 화면 비율/같은 조건으로 비교

---

## 7) Loki 쿼리 (실시간 추적 없이, 종료 후 조회)

사전 확인:

1. Loki 라벨에 `service`, `project`, `env`, `logstream`가 있는지 확인
2. `job` 라벨이 없으면 selector에서 `job=...`를 넣지 않는다

기본 selector:

```logql
{project="upgrade_todo_stress", service="spring", logstream="stdout"}
```

발행 스레드 증거 쿼리:

```logql
{project="upgrade_todo_stress", service="spring", logstream="stdout"}
|= "Publishing message"
| json
| logger_name="org.springframework.amqp.rabbit.core.RabbitTemplate"
| line_format "[{{.thread_name}}] {{.message}}"
```

판정 기준:

1. Before: `tomcat-handler-*` 또는 `http-nio-*`
2. After: `rabbit-pub-*` 또는 `rabbit-publisher-*`

시간 주의:

1. Grafana 표시 시간과 로그 `@timestamp`(UTC)는 시간대 차이로 다르게 보일 수 있음
2. 조회 구간을 반드시 부하 실행 시각으로 맞춘다

---

## 8) 파일 저장 규칙 (권장)

의미:

1. Case 5 캡처 이미지는 `case5/before`, `case5/after` 폴더에 분리 저장
2. 파일명 패턴은 `case5-증거종류-before|after.png`로 통일
3. `before/after`를 반드시 파일명 끝에 넣어서 짝 비교가 가능하게 유지

```text
case5/before/
  case5-k6-write-1000-before.png
  case5-thread-http-nio-before.png
  case5-rmq-web-channels-before.png
  case5-rmq-web-channels-before-extra-1.png
  case5-rmq-web-channels-before-extra-2.png
  case5-rmq-web-channels-before-extra-3.png
  case5-grafana-http-response-time-percentiles-before.png
  case5-grafana-rabbitmq-message-processing-before.png
  case5-grafana-channels-before.png

case5/after/
  case5-k6-write-1000-after.png
  case5-thread-rabbit-publisher-after.png
  case5-rmq-web-channels-after.png
  case5-grafana-http-response-time-percentiles-after.png
  case5-grafana-rabbitmq-message-processing-after.png
  case5-grafana-channels-after.png
```

`http-nio` 대신 `tomcat-handler`가 찍혀도 Before 증거로 인정한다.
`timeout/p95` 수치는 `report.html`, `mvc-write-failure-summary.txt`, `mvc-task-subtask-fixed-user-load-test-summary.json`에서 확인한다.

---

## 9) 체크리스트

### Before (`aafc30e0`)
- [x] k6 쓰기 부하 실행 (`before/case5-k6-write-1000-before.png`)
- [x] k6 raw 결과 저장 (`before/report.html`, `before/mvc-write-failure-summary.txt`, `before/mvc-task-subtask-fixed-user-load-test-summary.json`)
- [x] Loki `Publishing message` 스레드가 `tomcat-handler/http-nio`임을 캡처 (`before/case5-thread-http-nio-before.png`)
- [x] RabbitMQ `Channels` 부하 중 캡처 (`before/case5-rmq-web-channels-before.png`)
- [x] Grafana `HTTP Response Time Percentiles` 캡처 (`before/case5-grafana-http-response-time-percentiles-before.png`)
- [x] Grafana `RabbitMQ Message Processing` 캡처 (`before/case5-grafana-rabbitmq-message-processing-before.png`)
- [x] Grafana `Channels` 캡처 (`before/case5-grafana-channels-before.png`)

### After (`main` 또는 `7a257892`)
- [x] k6 쓰기 부하 실행 (`after/case5-k6-write-1000-after.png`)
- [x] k6 raw 결과 저장 (`after/report.html`, `after/mvc-write-failure-summary.txt`, `after/mvc-task-subtask-fixed-user-load-test-summary.json`)
- [x] Loki `Publishing message` 스레드가 `rabbit-pub/rabbit-publisher`임을 캡처 (`after/case5-thread-rabbit-publisher-after.png`)
- [x] RabbitMQ `Channels` 부하 중 캡처 (`after/case5-rmq-web-channels-after.png`)
- [x] Grafana `HTTP Response Time Percentiles` 캡처 (`after/case5-grafana-http-response-time-percentiles-after.png`)
- [x] Grafana `RabbitMQ Message Processing` 캡처 (`after/case5-grafana-rabbitmq-message-processing-after.png`)
- [x] Grafana `Channels` 캡처 (`after/case5-grafana-channels-after.png`)

---

## 10) 빠른 트러블슈팅

1. Loki `No data`: 라벨 selector에서 `job=...` 제거 후 `project/service/logstream`로 조회
2. Loki는 되는데 `Publishing message` 없음: 조회 시간이 부하 구간이 아님
3. `Publishing message`는 나오는데 스레드 분리가 안 보임: After 코드/이미지 반영 여부 재확인
4. Channels가 전부 `idle`: 캡처 시점이 늦음 (steady 구간에서 재촬영)
