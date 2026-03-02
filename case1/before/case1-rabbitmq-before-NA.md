# Case 1 Before RabbitMQ 증거 N/A

## 결론

Before 구간(`3c17e0bf^`)의 회원가입 요청 경로는 RabbitMQ 큐 관찰을 필수 증거로 요구하지 않는다.

## 근거

1. 요청 경로는 동기 처리/JVM 내부 이벤트 체인이며, `app.events.auth`, `app.events.user` 큐 상태 비교는 After에서만 핵심 증거로 사용한다.
2. 따라서 Before의 RabbitMQ 항목은 `N/A(요청 경로 동기식)`로 기록한다.
3. 포트폴리오 UI에서는 동일 취지로 missing reason을 노출한다.

