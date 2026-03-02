# Case 4 로그 증거 정리 (기준 고정: 2026-02-27 07:30 fail run)

## 1) 관측된 핵심 시그니처

- `event=method_error ... class=com.example.project.auth.adapter.in.web.AuthController method=login`
- `durationMs=4358~4571` (login 요청 단위 실패가 4.3~4.6초대에서 반복)
- 예외 체인:
  - `java.util.NoSuchElementException: Timeout waiting for idle object, borrowMaxWaitDuration≈PT3S`
  - `org.springframework.data.redis.connection.PoolException: Could not get a resource from the pool`
  - `org.springframework.data.redis.RedisConnectionFailureException: Unable to connect to Redis`
- 동일 구간 k6 증상:
  - `request timeout`
  - `status=0`

## 2) 원인 해석

1. 최하위에서 `NoSuchElementException`이 `borrowMaxWaitDuration≈PT3S`로 반복됩니다.
2. 이는 Redis pool에서 idle connection을 빌리지 못했다는 직접 신호입니다.
3. 상위로 `PoolException` -> `RedisConnectionFailureException`이 연쇄되며 인증(`AuthController.login`) 실패로 전파됩니다.
4. 같은 시점 k6 `request timeout/status=0`와 결합되어 사용자 요청 실패로 확인됩니다.

정리:
- Case 4의 본문 원인은 `Redis connection pool borrow timeout`으로 고정합니다.
- 원인 확정은 `share=false` Fail vs `share=true` Control 대조로 마무리합니다.

## 3) 기록 원칙 (스크린샷 최소화)

필수 파일:

- `case4/evidence/fail/config.txt`
- `case4/evidence/fail/k6-summary.txt`
- `case4/evidence/fail/app-key.log`
- `case4/evidence/fail/root-cause.txt`
- `case4/evidence/control/config.txt`
- `case4/evidence/control/k6-summary.txt`
- `case4/evidence/control/app-key.log`
- `case4/evidence/shared-false-rationale.md`

Control run에서도 다시 기록해야 하나?

- 예. 반드시 다시 기록합니다.
- 목적은 "실패 발생" 증명이 아니라 동일 부하에서 동일 패턴이 사라지거나 급감했는지 검증하는 것입니다.

## 4) 제외 규칙 (혼선 방지)

아래 패턴은 본문 원인 근거에서 제외:

- `durationMs=299xxx`
- `RedisPipelineException: Pipeline contained one or more invalid commands`
- `QueryTimeoutException: Redis command timed out`

위 패턴은 다른 시점/다른 run의 로그로 분리 보관하고, Case 4 본문 결론에는 사용하지 않습니다.
