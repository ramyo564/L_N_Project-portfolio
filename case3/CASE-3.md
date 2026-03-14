# Case 3. Cache 조회의 트랜잭션 경계 분리와 Pending Cache 보완

> 기준일: 2026-03-13
> 비교축: `e4d083e8^ -> main`

## 요약

Case 3은 권한 조회 경로의 커넥션 점유 시간을 줄이고,
비동기 생성 직후 조회 race를 Pending Cache로 완화한 사례다.

핵심은 `idle in transaction` 세션 감소와
프로젝트 생성 직후 즉시 GET `200` 확인이다.

## 문제

1. 캐시 미스 구간에서 권한 검증과 메인 트랜잭션이 겹치며 커넥션 점유 시간이 길어졌다.
2. 생성 직후 조회에서는 캐시/반영 타이밍 차이로 즉시 조회 race가 발생할 수 있었다.

## 해결

1. `ProjectOwnershipPersistenceAdapter.isOwner`에서 Pending Redis 확인을 트랜잭션 밖으로 이동했다.
2. DB ownership 검증은 짧은 `@Transactional(readOnly=true)` 경로로 분리했다.
3. `unless = "#result == false"` 조건으로 false 결과 캐싱을 막았다.
4. 프로젝트 생성 직후 Pending Cache를 적재해 즉시 조회 race를 완화했다.

## 결과

- `pg_stat_activity` 기준 `idle in transaction` 세션 감소
- After 즉시 GET `200` 확인
- Redis Pending key와 TTL 확인
- 권한 조회 경로의 세션 안정성 개선

## 사용한 증거

1. `pg_stat_activity` before/after 캡처
2. Grafana HikariCP / DB 패널 before/after 캡처
3. 생성 직후 즉시 GET `200` 응답 캡처
4. Redis Pending key 캡처

## 핵심 파일

### Before

- `before/case3-k6-read-1000-before.png`
- `before/case3-pg_stat_idle_transaction-before.png`
- `before/case3-pg_stat_state_count-before.png`
- `before/case3-Grafana-HikariCP-before.png`
- `before/case3-Grafana-db-before.png`

### After

- `after/case3-k6-read-1000-after.png`
- `after/case3-pg_stat_idle_transaction-after.png`
- `after/case3-response-200-after.png`
- `after/case3-redis-pending-key-after.png`
- `after/case3-Grafana-HikariCP-after.png`
- `after/case3-Grafana-db-after.png`

## 해석

Case 3의 공개 claim은
`idle in transaction` 완화와 `생성 직후 조회 race` 완화다.
즉, 권한 오류율 같은 강한 퍼센트 KPI보다
세션 안정화와 즉시 조회 정상화에 초점을 맞춰 설명한다.
