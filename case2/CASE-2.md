# Case 2. JWT Claims + AOP 권한게이트로 인증 경로 쿼리 축소

> 기준일: 2026-03-13
> 비교축: `e67fc2b7^ -> 3c2bffd8`

## 요약

Case 2는 인증 성공 이후에도 반복되던 사용자/권한 조회를
JWT Claims + 단일 AOP 권한게이트로 정리한 사례다.

공개 문서에서 사용하는 대표 claim은
`GET /projects/{projectId}/tasks` 기준 기본 권한 게이트 쿼리를 `3 -> 1`로 줄였다는 점이다.

## 문제

1. JWT 인증 이후에도 사용자 정보를 다시 조회해 요청당 기본 쿼리 비용이 누적되었다.
2. 프로젝트 접근 검증이 여러 지점에서 반복되어 읽기 경로 부하가 커졌다.

## 해결

1. `JwtAuthenticationFilter`에서 JWT Claims 기반으로 userId/email을 직접 구성했다.
2. `AuthTokenCachePort`를 적용해 토큰 캐시 HIT 시 인증 컨텍스트 구성을 단순화했다.
3. `@CheckProjectAccess`와 `ProjectAccessAspect`로 프로젝트 접근 검증 경계를 한 곳으로 모았다.
4. ownership 검증을 단일 repository predicate 경로로 수렴시켰다.

## 결과

- 대표 단일 요청 기본 권한 게이트 `3 -> 1`
- 인증/권한 검증 경계 단순화
- 읽기 경로의 반복 DB 조회 축소

## 사용한 증거

1. Hibernate Queries before/after 캡처
2. Redis auth token key before/after 캡처
3. Grafana slow query / postgres 패널 before/after 캡처
4. k6 read 1000VU before/after 캡처

## 핵심 파일

### Before

- `before/case2-hibernate-queries-before.png`
- `before/case2-redis-empty-before.png`
- `before/case2-grafana-slowQuery-before.png`
- `before/case2-grafana-postgres-before.png`
- `before/case2-k6-read-1000-before.png`

### After

- `after/case2-hibernate-queries-after.png`
- `after/case2-redis-key-after.png`
- `after/case2-grafana-slowQuery-after.png`
- `after/case2-grafana-postgres-after.png`
- `after/case2-k6-read-1000-after.png`

## 해석

Case 2의 공개 claim은 `대표 단일 요청 3 -> 1`이다.
즉, 인증과 권한 검증이 한 요청에서 몇 번의 기본 조회를 유발하는지에 대한 개선 사례로 설명한다.
