# Case B. 트랜잭션 경계 분리와 영속성(JPA) 튜닝을 통한 DB 커넥션 안정화

> 기준일: 2026-03-25
> 비교축: `Before (Wasteful Connection/JPA Merge) -> After (Optimized Session/Persistable)`

## 요약 (REVIEWER SUMMARY)

- **UUIDv7 엔티티의 JPA `merge`(SELECT+INSERT) 병목을 `Persistable` 구현과 비동기 Outbox 패턴으로 해결해 쓰기 지연을 방지했습니다.**
- **캐시 조회 중 발생하는 `Idle in transaction` 문제를 해결하기 위해, 트랜잭션 경계를 엄격히 분리하고 Redis Pending Cache를 도입했습니다.**
- **불필요한 DB 커넥션 점유 시간을 대폭 줄여, 고부하 환경에서도 커넥션 풀(HikariCP) 고갈 없이 안정적인 세션 관리 능력을 확보했습니다.**

## TECH DETAIL
- **JPA Ecosystem**: Spring Data JPA (Hibernate 6.x), Persistable, Persistence Context Management
- **Architecture Patterns**: Outbox Pattern, Transactional Messaging
- **Infrastructure**: Redis Cache Aside, HikariCP Tuning, PostgreSQL pg_stat_activity analysis

## 문제 (PROBLEM)
트래픽 유입 시, UUIDv7 엔티티의 JPA merge로 인한 불필요한 SELECT 쿼리 발생과, 트랜잭션 내부에서 Redis I/O가 결합되면서 DB 커넥션 반환이 지연되는(Idle in transaction) 병목 현상이 발견되었습니다. 이로 인해 HikariCP 커넥션 풀이 빠르게 고갈될 위험이 있었습니다.

1. **UUIDv7 merge 병목**: 애플리케이션 레벨에서 UUIDv7을 생성하여 엔티티에 세팅할 경우, JPA는 이를 이미 존재하는 엔티티로 판단하여 `persist()`가 아닌 `merge()`를 시도합니다. 이 과정에서 불필요한 `SELECT` 쿼리가 선행되고, 영속성 컨텍스트가 엔티티 상태를 비교하는 비용과 락 대기가 발생했습니다.
2. **트랜잭션 내 Redis I/O 결합 (Idle in transaction)**: `@Cacheable`이 적용된 조회 로직이 메인 트랜잭션 내에 묶여 있을 때, 캐시 미스로 인해 Redis와 통신하는 동안에도 DB 커넥션을 붙잡고 있는 현상이 발생했습니다. 이는 커넥션 풀 고갈의 직접적인 원인이 되었습니다.

## 해결 (ACTION)
엔지니어링 관점에서 영속성 컨텍스트의 라이프사이클을 제어하고 트랜잭션 범위를 최소화하는 방향으로 튜닝을 진행했습니다.

1. **INSERT 전용 경로 강제 (`Persistable`)**: `AuthUserEntity` 등에 `Persistable` 인터페이스를 구현하고 `isNew()` 로직을 오버라이딩했습니다. 이를 통해 사전 할당된 UUID가 있더라도 JPA가 `merge`가 아닌 `persist`를 즉시 수행하도록 강제하여 불필요한 `SELECT` 쿼리를 제거하고 쓰기 지연 성능을 확보했습니다.
2. **트랜잭션 경계 분리와 Pending Cache 도입**: 
   - 조회 로직에서 캐시 미스 시 발생하는 트랜잭션 결합을 끊어내기 위해 `readOnly` 경계 설정을 적용했습니다.
   - Redis Pending Cache를 도입하여, 동일 데이터에 대한 동시 조회 요청 시 여러 스레드가 동시에 DB 커넥션을 점유하지 않도록 제어해 커넥션 점유 시간을 최소화했습니다.
3. **Outbox 비동기 분리**: 쓰기 트랜잭션 내에서 외부 메시징 발행을 직접 수행하지 않고, Outbox 패턴을 적용해 도메인 트랜잭션의 무게를 경량화했습니다.

## 결과 (IMPACT)
읽기/쓰기 양방향에서 트랜잭션이 DB 커넥션을 물고 있는 시간을 대폭 단축하여, 고부하 환경에서도 커넥션 풀(HikariCP) 고갈 없이 안정적인 세션 관리와 동시 처리 능력을 확보했습니다.

- **데이터 소모형 튜닝**: `merge` 경로 제거로 쓰기 쿼리 수를 절반으로 줄여 회원가입 응답 안정성을 확보했습니다.
- **리소스 가용성 대폭 향상**: `Idle in transaction` 세션 수를 획기적으로 감소시켜, 동일한 커넥션 풀 환경에서도 처리 가능한 동시 요청 수를 비약적으로 늘렸습니다.
- **인프라 신뢰성**: 고부하 상황에서 발생하던 커넥션 부족 경고와 서스펜딩 현상을 원천 차단했습니다.

## 핵심 파일
- `Identity Core`: `AuthUserEntity` (Persistable isNew), `UserEntity`
- `Outbox Flow`: `OutboxEventAuthProcessor` (REQUIRES_NEW isolation)
- `Cache Guard`: `ProjectOwnershipPersistenceAdapter` (readOnly boundary)
