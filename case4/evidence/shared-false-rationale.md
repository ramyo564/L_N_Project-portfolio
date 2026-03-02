# Case 4 `shareNativeConnection=false` 채택/한계 기록

## 채택 이유 (당시)

1. Redis 풀 메트릭(`lettuce.pool.*`)을 확인하기 위해 풀 모드가 필요했습니다.
2. API/Worker 혼합 워크로드 테스트에서 `share=false`가 더 높은 쓰기 처리량을 보였습니다.
3. 당시 목표는 병목 가시화와 처리량 개선이었습니다.

## Case 4에서 드러난 한계

1. `VT=true + 단일 컨테이너 + 고부하(900~1000VU)` 조건에서 Redis connection pool 고갈 위험이 커졌습니다.
2. Fail run에서 `NoSuchElementException (borrowMaxWaitDuration≈PT3S)` -> `PoolException` -> `RedisConnectionFailureException` 체인이 반복되었습니다.
3. 이 체인이 `AuthController.login` `event=method_error`와 함께 나타나며, k6 `status=0/request timeout`과 동시 발생했습니다.
4. 같은 조건에서 `share=true` Control Run으로 전환 시 동일 체인이 사라지거나 급감하면 원인 축을 확정합니다.

## 최종 판단 규칙

- 로그는 "실패 경로" 증거입니다.
- 원인 확정은 Fail/Control 설정 on/off 대조 결과로 합니다.
