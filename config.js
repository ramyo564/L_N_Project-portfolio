import { diagrams } from './diagrams.js';

export const templateConfig = {
    system: {
        documentTitle: 'Yohan | Upgrade Todo Problem Solving Portfolio',
        systemName: 'UPGRADE_TODO_PROBLEM_SOLVING_V.1.0'
    },

    hero: {
        sectionId: 'upgrade-todo-problem-solving',
        panelTitle: 'UPGRADE_TODO_PROBLEM_SOLVING_OVERVIEW',
        panelUid: 'ID: UPGRADE-TODO-PS-00',
        diagramId: 'upgrade-todo-problem-overview',
        metrics: [
            {
                label: '요약',
                value: 'Upgrade Todo 항목을 문제→원인→해결→결과 흐름으로 재구성했습니다.'
            },
            {
                label: '검증',
                value: 'Case Study 6건 + Code Path + Commit Trail + k6/Grafana Evidence'
            },
            {
                label: '핵심 지표',
                value: '인증/권한 쿼리 21 -> 3',
                kind: 'metric'
            },
            {
                label: '핵심 지표',
                value: 'timeout 15% -> 0%, p95 500ms -> 50ms',
                kind: 'metric'
            },
            {
                label: '핵심 지표',
                value: 'read RPS 972 -> 3680, write RPS 373 -> 916',
                kind: 'metric'
            }
        ]
    },

    topPanels: [
        {
            sectionId: 'upgrade-todo-code-evidence',
            panelTitle: 'CODE_EVIDENCE_MAP',
            panelUid: 'ID: UPGRADE-TODO-PS-01',
            diagramId: 'upgrade-todo-code-evidence-overview',
            panelClass: 'code-evidence-summary-panel',
            navLabel: 'CODE_EVIDENCE',
            metrics: [
                '영역 1: IDENTITY_AUTH - UUIDv7 Persistable, Outbox 저장/발행/처리, JWT Claims 인증 경계',
                '영역 2: CACHE_ASYNC_GAP - ownership readOnly cache 경계, pending cache TTL 600, false cache 차단',
                '영역 3: MESSAGING_PERFORMANCE - async publisher, producer adapters, insertWithPosition + index 튜닝'
            ]
        },
        {
            sectionId: 'upgrade-todo-code-evidence-identity',
            panelTitle: 'IDENTITY_AUTH',
            panelUid: 'ID: UPGRADE-TODO-PS-01A',
            diagramId: 'upgrade-todo-code-evidence-identity',
            panelClass: 'code-evidence-split-panel',
            metrics: [
                'Identity Core: AuthUserEntity, UserEntity, Persistable isNew',
                'Outbox Flow: OutboxAuthAdapter, OutboxEventAuthPublisher, OutboxEventAuthProcessor',
                'Auth Gate: JwtAuthenticationFilter, JwtProvider, ProjectAccessAspect'
            ]
        },
        {
            sectionId: 'upgrade-todo-code-evidence-cache',
            panelTitle: 'CACHE_ASYNC_GAP',
            panelUid: 'ID: UPGRADE-TODO-PS-01B',
            diagramId: 'upgrade-todo-code-evidence-cache',
            panelClass: 'code-evidence-split-panel',
            metrics: [
                'Ownership Boundary: ProjectOwnershipPersistenceAdapter readOnly + cache',
                'Pending Cache: ProjectCommandService + RedisProjectPendingCacheAdapter + ProjectCacheKeys',
                'Cache Guard: unless result false and self-injection proxy path'
            ]
        },
        {
            sectionId: 'upgrade-todo-code-evidence-messaging',
            panelTitle: 'MESSAGING_PERFORMANCE',
            panelUid: 'ID: UPGRADE-TODO-PS-01C',
            diagramId: 'upgrade-todo-code-evidence-messaging',
            panelClass: 'code-evidence-split-panel',
            metrics: [
                'Async Publish: AsyncMessagePublishingDecorator + rabbitPublisherExecutor',
                'Producer Adapters: Project Task SubTask convertAndSend async path',
                'Performance Path: insertWithPosition + Flyway index migrations V2 V6 V7'
            ]
        }
    ],

    navigation: [
        { label: 'UPGRADE_TODO_PROBLEM_SOLVING_OVERVIEW', target: '#upgrade-todo-problem-solving' },
        { label: 'CASES', target: '#upgrade-todo-cases', caseMenu: true },
        { label: 'CODE_EVIDENCE', target: '#upgrade-todo-code-evidence' },
        { label: 'SKILL_SET', target: '#upgrade-todo-skill-set' },
        { label: 'CONTACT', target: '#contact' }
    ],

    skills: {
        sectionId: 'upgrade-todo-skill-set',
        panelTitle: 'SKILL_SET',
        panelUid: 'ID: UPGRADE-TODO-STACK',
        items: [
            { title: 'BACKEND CORE', stack: 'Java 21, Spring Boot 3.5, JPA, PostgreSQL, Flyway' },
            { title: 'MESSAGING', stack: 'RabbitMQ, Outbox Pattern, Async Decorator, Worker Split' },
            { title: 'CACHE', stack: 'Redis, Cache Aside, Pending Cache, Transaction Boundary' },
            { title: 'SECURITY', stack: 'JWT Claims, Spring Security, AOP Project Access Gate' },
            { title: 'PERFORMANCE', stack: 'k6, Query Reduction, Atomic Insert, Index Tuning' },
            { title: 'OPS', stack: 'Docker Compose, API Worker Role Split, Monitoring Stack' }
        ]
    },

    serviceSections: [
        {
            id: 'upgrade-todo-cases',
            title: 'UPGRADE_TODO_TROUBLESHOOTING_CASES',
            navLabel: 'CASES',
            theme: 'blue',
            cardVisualHeight: '300px',
            cardClass: 'problem-case-card',
            groups: [
                {
                    title: 'IDENTITY / AUTHORIZATION',
                    desc: 'UUID 저장 전략, Outbox 분리, JWT 기반 권한 검증 경로 축소',
                    cards: [
                        {
                            mermaidId: 'case-uuid-outbox-decoupling',
                            anchorId: 'upgrade-todo-case-1',
                            title: 'Case 1. UUIDv7 merge 경로 제거와 Outbox 분리로 회원가입 트랜잭션 안정화',
                            subtitle: '2025-09 ~ 2025-10 · Auth User 생성 경로 리팩터링',
                            overview: '사전 UUID 할당 환경에서 `save -> merge(SELECT+INSERT)`로 이어지던 병목을\nPersistable `isNew()`와 Outbox 비동기 분리로 정리한 케이스입니다.',
                            role: 'Auth/User 저장 경계 재설계, Outbox 발행 안정화, 단건 트랜잭션 분리',
                            stackSummary: 'Persistable, UUIDv7, OutboxEventAuthProcessor, RabbitMQ',
                            cause: '1) 사전 UUID 할당 엔티티가 merge 경로로 진입해 불필요한 SELECT와 락 대기가 누적되었습니다.\n2) Auth/User 생성을 한 트랜잭션에 묶어 후속 실패가 전체 롤백으로 번지는 결합이 있었습니다.',
                            problem: '1) 사전할당 UUID 엔티티 저장에서 merge 경로가 타며 SELECT+INSERT가 동반되었습니다.\n2) Auth/User 생성이 한 흐름에 묶여 락 대기와 결합도 문제가 커졌습니다.\n3) 배치 발행 중 한 건 실패 시 전체 롤백 위험이 있었습니다.',
                            solution: '1) `AuthUserEntity`, `UserEntity`에 Persistable `isNew()`를 적용해 INSERT 중심 경로로 전환했습니다.\n2) 도메인 이벤트를 Outbox 테이블에 저장하고 Publisher가 비동기로 전달하도록 분리했습니다.\n3) `OutboxEventAuthProcessor.processOne`에 `REQUIRES_NEW`를 적용해 이벤트 단건 격리 처리로 변경했습니다.\n4) Outbox payload를 text 컬럼으로 고정하고 error_message 절삭 처리로 poison pill 루프를 차단했습니다.',
                            result: '1) 이력서 기준 락 대기 재현율 0%를 달성했습니다.\n2) 회원가입 핵심 트랜잭션과 후속 사용자 생성이 분리되어 응답성과 안정성이 개선되었습니다.',
                            evidenceImages: [
                                {
                                    label: 'k6 Write 50 Before',
                                    src: './case1/before/case1-k6-write-50-before.png',
                                    alt: 'k6 write before case1'
                                },
                                {
                                    label: 'k6 Write 500 After',
                                    src: './case1/after/case1-k6-write-500-after.png',
                                    alt: 'k6 write after case1'
                                }
                            ],
                            extraEvidenceImages: [
                                { label: 'Signup Before (200)', src: './case1/before/case1-signup-response-before.png' },
                                { label: 'Signup After (202)', src: './case1/after/case1-signup-response-after.png' },
                                { label: 'Hibernate Before', src: './case1/before/case1-hibernate-before.png' },
                                { label: 'Hibernate After', src: './case1/after/case1-hibernate-after.png' },
                                { label: 'Outbox Table Before', src: './case1/before/case1-outbox-table-before.png' },
                                { label: 'Outbox Table After', src: './case1/after/case1-outbox-table-after.png' },
                                {
                                    label: 'RabbitMQ Queue After Auth',
                                    src: './case1/after/case1-rabbitmq-queue-after-auth.png',
                                    pairKey: 'rabbitmq queue auth',
                                    missingBeforeReason: 'Before 구간은 요청 경로가 동기식이라 RabbitMQ Queue 캡처가 존재하지 않습니다.'
                                },
                                {
                                    label: 'RabbitMQ Queue After User',
                                    src: './case1/after/case1-rabbitmq-queue-after-user.png',
                                    pairKey: 'rabbitmq queue user',
                                    missingBeforeReason: 'Before 구간은 요청 경로가 동기식이라 RabbitMQ Queue 캡처가 존재하지 않습니다.'
                                }
                            ],
                            skills: ['Persistable', 'Outbox Pattern', 'Transaction Isolation', 'UUIDv7'],
                            highlights: [
                                'Persistable isNew forces insert path even with pre-assigned UUID',
                                'Outbox save happens in domain transaction and publish is decoupled',
                                'processOne uses REQUIRES_NEW to isolate failure per event',
                                'text payload and error truncation prevent outbox poison loop'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_1', href: './case1/CASE-1.md' },
                                { label: 'TECH_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-1-path' }
                            ]
                        },
                        {
                            mermaidId: 'case-auth-nplus1-collapse',
                            anchorId: 'upgrade-todo-case-2',
                            title: 'Case 2. JWT Claims + AOP 권한게이트로 인증 N+1 경로 축소',
                            subtitle: '2025-11 · 인증 필터와 프로젝트 접근 검증 최적화',
                            overview: '요청마다 반복되던 auth_user 조회와 project 검증 쿼리를\nJWT Claims 기반 인증 + 단일 권한게이트로 정리한 케이스입니다.',
                            role: 'JwtAuthenticationFilter 최적화, @CheckProjectAccess 경계 정리, ownership 쿼리 단일화',
                            stackSummary: 'JwtAuthenticationFilter, ProjectAccessAspect, ProjectOwnershipPersistenceAdapter',
                            cause: '1) JWT 인증 요청마다 사용자 재조회가 발생해 요청당 기본 쿼리 비용이 누적됐습니다.\n2) 프로젝트 접근 검증이 핸들러마다 중복 호출되어 읽기 경로 부하가 커졌습니다.',
                            problem: '1) JWT 인증 요청마다 DB에서 사용자 정보를 재조회해 auth_user 반복 쿼리가 누적되었습니다.\n2) project 접근 검증에서 소유권/활성 상태 확인이 요청 경로마다 중복 실행되었습니다.\n3) 고부하 테스트에서 인증 경로가 쿼리 부하를 키우는 병목으로 작동했습니다.',
                            solution: '1) `JwtAuthenticationFilter`에서 `jwtProvider.getClaimsFromAccessToken` 기반으로 userId/email을 바로 추출했습니다.\n2) `AuthTokenCachePort`를 적용해 토큰 캐시 HIT 시 JWT 파싱도 생략하도록 구성했습니다.\n3) 컨트롤러에 `@CheckProjectAccess`를 적용하고 `ProjectAccessAspect`에서 선행 검증하도록 통일했습니다.\n4) ownership 검증은 `isOwnerAndActive` 경로로 수렴시켜 중복 검증 비용을 줄였습니다.',
                            result: '1) 이력서 기준 인증 경로 쿼리 수를 21 -> 3으로 축소했습니다.\n2) 인증/권한 검증의 경계가 명확해져 고부하 시 응답 안정성이 개선되었습니다.',
                            evidenceImages: [
                                {
                                    label: 'k6 Read 1000 Before',
                                    src: './case2/before/case2-k6-read-1000-before.png',
                                    alt: 'k6 read before case2'
                                },
                                {
                                    label: 'k6 Read 1000 After',
                                    src: './case2/after/case2-k6-read-1000-after.png',
                                    alt: 'k6 read after case2'
                                }
                            ],
                            extraEvidenceImages: [
                                { label: 'Hibernate Queries Before', src: './case2/before/case2-hibernate-queries-before.png' },
                                { label: 'Hibernate Queries After', src: './case2/after/case2-hibernate-queries-after.png' },
                                { label: 'Redis Empty Before', src: './case2/before/case2-redis-empty-before.png', pairKey: 'redis auth token' },
                                { label: 'Redis Key After', src: './case2/after/case2-redis-key-after.png', pairKey: 'redis auth token' },
                                { label: 'Grafana Slow Query Before', src: './case2/before/case2-grafana-slowQuery-before.png' },
                                { label: 'Grafana Slow Query After', src: './case2/after/case2-grafana-slowQuery-after.png' },
                                { label: 'Grafana Postgres Before', src: './case2/before/case2-grafana-postgres-before.png' },
                                { label: 'Grafana Postgres After', src: './case2/after/case2-grafana-postgres-after.png' }
                            ],
                            skills: ['JWT Claims', 'AOP Authorization', 'Query Reduction', 'Security Optimization'],
                            highlights: [
                                'JWT claims supply principal without per-request auth_user lookup',
                                'Auth token cache avoids repeated parsing and context rebuild',
                                'AOP CheckProjectAccess centralizes authorization gate',
                                'Ownership validation converges to one repository predicate'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_2', href: './case2/CASE-2.md' },
                                { label: 'TECH_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-2-path' }
                            ]
                        }
                    ]
                },
                {
                    title: 'CACHE / CONSISTENCY',
                    desc: '트랜잭션 경계 명확화와 비동기 간극 대응',
                    cards: [
                        {
                            mermaidId: 'case-cache-transaction-boundary',
                            anchorId: 'upgrade-todo-case-3',
                            title: 'Case 3. @Cacheable 조회의 idle in transaction 제거',
                            subtitle: '2025-11 ~ 2025-12 · 권한 조회 경로 커넥션 점유 시간 단축',
                            overview: '캐시 미스 구간에서 트랜잭션 경계가 길어지며 커넥션이 지연 반환되던 문제를\nreadOnly 트랜잭션과 Redis 선조회 분리로 완화한 케이스입니다.',
                            role: 'ownership 조회 경로 분해, self-injection 기반 readOnly + cache 적용, 캐시 조건 정리',
                            stackSummary: 'ProjectOwnershipPersistenceAdapter, Spring Cache, Redis Pending Cache, HikariCP',
                            cause: '1) 캐시 미스 시 권한 검증과 메인 트랜잭션이 겹쳐 커넥션 점유 시간이 길어졌습니다.\n2) false 결과 캐싱으로 일시 오류가 재사용되는 poisoning 위험이 존재했습니다.',
                            problem: '1) `@Cacheable` 조회 경로에서 캐시 미스 시 DB 커넥션 점유가 길어졌습니다.\n2) AOP 권한 검증과 메인 트랜잭션이 겹치며 커넥션 풀 고갈과 idle in transaction이 발생했습니다.\n3) false 결과까지 캐싱되면서 일시 오류가 재사용되는 문제도 있었습니다.',
                            solution: '1) `ProjectOwnershipPersistenceAdapter.isOwner`에서 Pending Redis 확인을 트랜잭션 밖으로 이동했습니다.\n2) DB 검증은 `checkOwnershipInDb`로 분리하고 `@Transactional(readOnly=true)` + `@Cacheable`을 적용했습니다.\n3) `unless = "#result == false"` 조건으로 실패 결과 캐싱을 차단했습니다.\n4) self-injection 방식으로 내부 호출에서도 AOP 어노테이션이 실제 적용되게 정리했습니다.',
                            result: '1) 이력서 기준 커넥션 누수 재현율 0%를 유지했습니다.\n2) 권한 조회 경로의 커넥션 점유 시간이 짧아져 부하 시 세션 안정성이 개선되었습니다.',
                            evidenceImages: [
                                {
                                    label: 'k6 Read 1000 Before',
                                    src: './case3/before/case3-k6-read-1000-before.png',
                                    alt: 'k6 read before case3'
                                },
                                {
                                    label: 'k6 Read 1000 After',
                                    src: './case3/after/case3-k6-read-1000-after.png',
                                    alt: 'k6 read after case3'
                                }
                            ],
                            extraEvidenceImages: [
                                { label: 'pg_stat idle in tx Before', src: './case3/before/case3-pg_stat_idle_transaction-before.png' },
                                { label: 'pg_stat idle in tx After', src: './case3/after/case3-pg_stat_idle_transaction-after.png' },
                                {
                                    label: 'Response 200 After',
                                    src: './case3/after/case3-response-200-after.png',
                                    pairKey: 'response status check',
                                    missingBeforeReason: 'Before 403 재현은 타이밍 의존으로 반복 재현이 어려워 N/A로 처리했습니다.'
                                },
                                {
                                    label: 'Redis Pending Key After',
                                    src: './case3/after/case3-redis-pending-key-after.png',
                                    pairKey: 'redis pending key',
                                    missingBeforeReason: 'Before 단계에는 pending key 전략을 적용하지 않아 대응 이미지가 없습니다.'
                                },
                                { label: 'Grafana HikariCP Before', src: './case3/before/case3-Grafana-HikariCP-before.png' },
                                { label: 'Grafana HikariCP After', src: './case3/after/case3-Grafana-HikariCP-after.png' },
                                { label: 'Grafana DB Before', src: './case3/before/case3-Grafana-db-before.png' },
                                { label: 'Grafana DB After', src: './case3/after/case3-Grafana-db-after.png' }
                            ],
                            skills: ['Cache Boundary', 'HikariCP', 'readOnly Tx', 'AOP Proxy Pattern'],
                            highlights: [
                                'Pending Redis check runs without DB transaction scope',
                                'DB ownership check runs in short readOnly transaction only',
                                'false ownership result is excluded from cache poisoning',
                                'self-injection keeps transactional and cache annotations effective'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_3', href: './case3/CASE-3.md' },
                                { label: 'TECH_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-3-path' }
                            ]
                        },
                        {
                            mermaidId: 'case-project-pending-cache',
                            anchorId: 'upgrade-todo-case-4',
                            title: 'Case 4. 비동기 생성 Async Gap을 Pending Cache 라이프사이클로 보완',
                            subtitle: '2025-12 ~ 2026-01 · Project 생성 직후 권한 오류 제거',
                            overview: '202 Accepted 비동기 생성 구조에서 생성 직후 조회가 먼저 실행되며 발생하던\n403 Race Condition을 Pending Cache 전략으로 해소한 케이스입니다.',
                            role: 'ProjectCommandService 흐름 설계, Pending TTL 정책 반영, ownership 검증 연계',
                            stackSummary: 'ProjectCommandService, RedisProjectPendingCacheAdapter, ProjectCacheKeys',
                            cause: '1) 비동기 생성 구조 특성상 DB 반영 전 조회가 먼저 도착해 403 레이스가 반복되었습니다.\n2) 짧은 pending TTL이 큐 지연 구간을 버티지 못해 정상 요청이 권한 실패로 분류됐습니다.',
                            problem: '1) 프로젝트 생성은 큐에 적재 후 비동기 저장되므로 즉시 조회 시점에 DB가 비어있을 수 있었습니다.\n2) 초기 false 결과가 캐시에 남으면 정상 저장 후에도 권한 오류가 반복되었습니다.\n3) 큐 지연 구간에서 짧은 TTL은 pending 보호 장치를 조기 만료시켰습니다.',
                            solution: '1) `ProjectCommandService.createProject`에서 메시지 발행 전 `savePendingProject`를 먼저 호출했습니다.\n2) `RedisProjectPendingCacheAdapter`는 `project:pending:{id}` 키를 사용자 ID와 함께 저장하도록 구성했습니다.\n3) `ProjectCacheKeys.PENDING_PROJECT_TTL_SECONDS`를 600초로 유지해 고부하 지연 구간을 커버했습니다.\n4) ownership 검증에서 pending 키를 우선 확인해 생성 직후 접근을 허용했습니다.',
                            result: '1) 이력서 기준 생성 직후 권한 오류율 5% -> 0%를 달성했습니다.\n2) 202 즉시응답 UX를 유지하면서도 생성 직후 접근 일관성을 확보했습니다.',
                            evidenceImages: [
                                {
                                    label: 'C3 Matrix (Before)',
                                    src: './case4/before/c3/c3-k6.png',
                                    alt: 'case4 c3 matrix k6 evidence'
                                },
                                {
                                    label: 'C4 Matrix (Control)',
                                    src: './case4/before/c4/c4-k6.png',
                                    alt: 'case4 c4 matrix k6 evidence'
                                }
                            ],
                            extraEvidenceImages: [
                                {
                                    label: 'C3 RabbitMQ',
                                    src: './case4/before/c3/c3-rmq.png',
                                    missingAfterReason: 'Case4는 C3/C4 before 매트릭스로 원인 비교를 수행한 케이스라 after 짝이 없습니다.'
                                },
                                {
                                    label: 'C3 Redis',
                                    src: './case4/before/c3/c3-redis.png',
                                    missingAfterReason: 'Case4는 C3/C4 before 매트릭스로 원인 비교를 수행한 케이스라 after 짝이 없습니다.'
                                },
                                {
                                    label: 'C3 Postgres',
                                    src: './case4/before/c3/c3-postgres.png',
                                    missingAfterReason: 'Case4는 C3/C4 before 매트릭스로 원인 비교를 수행한 케이스라 after 짝이 없습니다.'
                                },
                                {
                                    label: 'C3 RabbitMQ Web',
                                    src: './case4/before/c3/c3-rmq-web.png',
                                    missingAfterReason: 'Case4는 C3/C4 before 매트릭스로 원인 비교를 수행한 케이스라 after 짝이 없습니다.'
                                },
                                {
                                    label: 'C4 RabbitMQ',
                                    src: './case4/before/c4/c4-rmq.png',
                                    missingAfterReason: 'Case4는 C3/C4 before 매트릭스로 원인 비교를 수행한 케이스라 after 짝이 없습니다.'
                                },
                                {
                                    label: 'C4 Redis',
                                    src: './case4/before/c4/c4-redis.png',
                                    missingAfterReason: 'Case4는 C3/C4 before 매트릭스로 원인 비교를 수행한 케이스라 after 짝이 없습니다.'
                                },
                                {
                                    label: 'C4 Postgres',
                                    src: './case4/before/c4/c4-postgres.png',
                                    missingAfterReason: 'Case4는 C3/C4 before 매트릭스로 원인 비교를 수행한 케이스라 after 짝이 없습니다.'
                                },
                                {
                                    label: 'C4 RabbitMQ Web',
                                    src: './case4/before/c4/c4-rmq-web.png',
                                    missingAfterReason: 'Case4는 C3/C4 before 매트릭스로 원인 비교를 수행한 케이스라 after 짝이 없습니다.'
                                }
                            ],
                            skills: ['Async Consistency', 'Pending Cache', 'Race Condition Control', 'Redis TTL Strategy'],
                            highlights: [
                                'Pending key is written before Rabbit publish to bridge async gap',
                                'Ownership check reads pending cache before DB fallback',
                                'TTL 600 seconds protects delayed queue consumption windows',
                                'Immediate post-create access succeeds without waiting DB flush'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_4', href: './case4/CASE-4.md' },
                                { label: 'TECH_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-4-path' }
                            ]
                        }
                    ]
                },
                {
                    title: 'MESSAGING / PERFORMANCE',
                    desc: 'Rabbit 발행 지연 제거와 통합 성능 튜닝',
                    cards: [
                        {
                            mermaidId: 'case-rabbit-async-publisher',
                            anchorId: 'upgrade-todo-case-5',
                            title: 'Case 5. RabbitMQ 동기 발행 블로킹을 비동기 데코레이터로 분리',
                            subtitle: '2025-12 · 1000VU timeout 구간 안정화',
                            overview: 'API 스레드에서 직접 `convertAndSend`를 수행하던 구조를\n전용 executor 비동기 발행으로 분리해 타임아웃을 줄인 케이스입니다.',
                            role: 'AsyncMessagePublishingDecorator 설계, Producer Adapter 전환, Executor 정책 분리',
                            stackSummary: 'AsyncMessagePublishingDecorator, AsyncConfig, RabbitMQ producer adapters',
                            cause: '1) API 요청 스레드가 `convertAndSend` 동기 발행 대기를 직접 떠안아 timeout이 증가했습니다.\n2) 고VU 구간에서 채널 경합이 응답 지연으로 즉시 전파되는 구조였습니다.',
                            problem: '1) 요청 스레드가 Rabbit 채널 경합 대기를 직접 겪으며 응답 지연이 발생했습니다.\n2) 1000VU 이상에서 request timeout이 누적되고 오류 응답이 증가했습니다.\n3) 메시지 발행 병목이 API 처리량 저하로 직접 전파되었습니다.',
                            solution: '1) `AsyncMessagePublishingDecorator.executeAsync`로 발행 작업을 분리했습니다.\n2) `AsyncConfig.rabbitPublisherExecutor`에서 발행 전용 executor 타입과 pool-size를 분리 설정했습니다.\n3) Project Task SubTask producer adapter를 동기 호출에서 async decorator 호출로 변경했습니다.\n4) semaphore 기반 동시 발행 제한으로 채널 풀 고갈 리스크를 제어했습니다.',
                            result: '1) 이력서 기준 timeout 에러율 15% -> 0%를 달성했습니다.\n2) p95 지연이 500ms -> 50ms로 단축되었습니다.',
                            evidenceImages: [
                                {
                                    label: 'k6 Write 1000 Before',
                                    src: './case5/before/case5-k6-write-1000-before.png',
                                    alt: 'k6 write before case5'
                                },
                                {
                                    label: 'k6 Write 1000 After',
                                    src: './case5/after/case5-k6-write-1000-after.png',
                                    alt: 'k6 write after case5'
                                }
                            ],
                            extraEvidenceImages: [
                                { label: 'Publishing Thread Before', src: './case5/before/case5-thread-http-nio-before.png' },
                                { label: 'Publishing Thread After', src: './case5/after/case5-thread-rabbit-publisher-after.png' },
                                { label: 'Grafana Channels Before', src: './case5/before/case5-grafana-channels-before.png' },
                                { label: 'Grafana Channels After', src: './case5/after/case5-grafana-channels-after.png' },
                                { label: 'Grafana HTTP Percentiles Before', src: './case5/before/case5-grafana-http-response-time-percentiles-before.png' },
                                { label: 'Grafana HTTP Percentiles After', src: './case5/after/case5-grafana-http-response-time-percentiles-after.png' },
                                { label: 'Grafana RabbitMQ Message Processing Before', src: './case5/before/case5-grafana-rabbitmq-message-processing-before.png' },
                                { label: 'Grafana RabbitMQ Message Processing After', src: './case5/after/case5-grafana-rabbitmq-message-processing-after.png' },
                                { label: 'RabbitMQ Web Channels Before', src: './case5/before/case5-rmq-web-channels-before.png' },
                                { label: 'RabbitMQ Web Channels After', src: './case5/after/case5-rmq-web-channels-after.png' }
                            ],
                            skills: ['RabbitMQ', 'Async Messaging', 'Executor Tuning', 'Latency Reduction'],
                            highlights: [
                                'API request thread no longer blocks on convertAndSend call',
                                'Dedicated publisher executor isolates messaging contention',
                                'Semaphore limits concurrent publishes and protects channel pool',
                                'Producer adapters share one async publish pattern'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_5', href: './case5/CASE-5.md' },
                                { label: 'TECH_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-5-path' }
                            ]
                        },
                        {
                            mermaidId: 'case-integrated-performance-tuning',
                            anchorId: 'upgrade-todo-case-6',
                            title: 'Case 6. 배치 캐시 트랜잭션 구조 통합 최적화로 처리량 증대',
                            subtitle: '2025-12 · 1000VU 읽기/쓰기 성능 통합 개선',
                            overview: '단일 튜닝이 아닌 저장 경로 배치 인덱스 캐시 트랜잭션 경계를 함께 조정해\n실측 RPS와 p95를 동시에 개선한 케이스입니다.',
                            role: 'insertWithPosition 원자화, 부분 인덱스 적용, cache eviction 타이밍 조정, 부하 검증',
                            stackSummary: 'Task Project SubTask repository, Flyway index migration, k6 performance test',
                            cause: '1) 쓰기 경로에서 위치 계산과 INSERT가 분리되어 경쟁 구간이 커졌습니다.\n2) 조회 경로는 인덱스/캐시 경계가 흔들리면 큐 적체와 지연이 함께 증가했습니다.',
                            problem: '1) 위치 계산 SELECT + INSERT 분리와 캐시 경합으로 쓰기 경로에서 병목이 발생했습니다.\n2) 상태 조회 쿼리에서 status partial index(V7) 부재 구간이 고부하 지연을 키웠습니다.\n3) 캐시 무효화/트랜잭션 순서가 어긋나면 일관성과 처리량을 동시에 잃는 문제가 있었습니다.',
                            solution: '1) Project Task SubTask 생성에 `insertWithPosition` 네이티브 경로를 적용해 경쟁 구간을 축소했습니다.\n2) Flyway 마이그레이션에 ownership/status/outbox partial index를 추가했습니다.\n3) 캐시 무효화는 after commit 기준으로 통일해 데이터 정합성과 재조회 비용을 안정화했습니다.\n4) k6 시나리오로 읽기 쓰기 각각의 RPS/p95를 반복 측정해 튜닝 효과를 검증했습니다.',
                            result: '1) 이력서 기준 읽기 RPS 972 -> 3680, 쓰기 RPS 373 -> 916으로 향상되었습니다.\n2) 읽기 p95 975ms -> 141ms, 쓰기 p95 1.9s -> 126ms로 단축되었습니다.',
                            evidenceImages: [
                                {
                                    label: 'k6 Read 1000 Before',
                                    src: './case6/before/case6-k6-read-1000-before.png',
                                    alt: 'k6 read 1000 before case6 tuning'
                                },
                                {
                                    label: 'k6 Read 1000 After',
                                    src: './case6/after/case6-k6-read-1000-after.png',
                                    alt: 'k6 read 1000 after case6 tuning'
                                },
                                {
                                    label: 'k6 Write 1000 Before',
                                    src: './case6/before/case6-k6-write-1000-before.png',
                                    alt: 'k6 write 1000 before case6 tuning'
                                },
                                {
                                    label: 'k6 Write 1000 After',
                                    src: './case6/after/case6-k6-write-1000-after.png',
                                    alt: 'k6 write 1000 after case6 tuning'
                                }
                            ],
                            extraEvidenceImages: [
                                {
                                    label: 'Hibernate Separate Before',
                                    src: './case6/before/case6-hibernate-separate-before.png',
                                    pairKey: 'hibernate insert path'
                                },
                                {
                                    label: 'Hibernate Atomic After',
                                    src: './case6/after/case6-hibernate-atomic-after.png',
                                    pairKey: 'hibernate insert path'
                                },
                                { label: 'EXPLAIN Before 1', src: './case6/before/case6-explain-before-1.png' },
                                { label: 'EXPLAIN Before 2', src: './case6/before/case6-explain-before-2.png' },
                                { label: 'EXPLAIN Before 3', src: './case6/before/case6-explain-before-3.png' },
                                { label: 'EXPLAIN After 1', src: './case6/after/case6-explain-after-1.png' },
                                { label: 'EXPLAIN After 2', src: './case6/after/case6-explain-after-2.png' },
                                { label: 'EXPLAIN After 3', src: './case6/after/case6-explain-after-3.png' },
                                { label: 'pg_indexes Active Before', src: './case6/before/case6-pg-indexes-active-before.png' },
                                { label: 'pg_indexes Active After', src: './case6/after/case6-pg-indexes-active-after.png' },
                                {
                                    label: 'pg_indexes Status After',
                                    src: './case6/after/case6-pg-indexes-status-after.png',
                                    pairKey: 'pg indexes status',
                                    missingBeforeReason: 'Before 시점은 V7 status partial index 미적용 구간이라 status 인덱스 결과가 N/A입니다.'
                                },
                                { label: 'Grafana Read Response Before', src: './case6/before/case6-grafana-read-response-time-before.png' },
                                { label: 'Grafana Read Response After', src: './case6/after/case6-grafana-read-response-time-after.png' },
                                { label: 'Grafana Write Response Before', src: './case6/before/case6-grafana-write-response-time-before.png' },
                                { label: 'Grafana Write Response After', src: './case6/after/case6-grafana-write-response-time-after.png' }
                            ],
                            skills: ['Load Testing', 'Index Tuning', 'Atomic Insert', 'Cache and Tx Order'],
                            highlights: [
                                'insertWithPosition removes select then insert race pattern',
                                'Flyway partial indexes accelerate ownership and status lookups',
                                'after-commit cache eviction keeps consistency under write load',
                                'k6 metrics were used as acceptance gate for each tuning round'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_6', href: './case6/CASE-6.md' },
                                { label: 'TECH_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-6-path' }
                            ]
                        }
                    ]
                }
            ]
        }
    ],

    contact: {
        sectionId: 'contact',
        panelTitle: 'CONTACT',
        panelUid: 'ID: UPGRADE-TODO-COMMS',
        description: 'Upgrade Todo 포트폴리오 관련 문의 및 전체 문서는 아래 경로로 확인 가능합니다.',
        actions: [
            { label: 'EMAIL', href: 'mailto:yohan032yohan@gmail.com' },
            { label: 'L_N_PROJECT_REPO', href: 'https://github.com/ramyo564/L_N_Project' },
            { label: 'EVIDENCE_DOCS', href: './evidence/upgrade_todo/index.html' }
        ]
    },

    mermaid: {
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'Inter',
        flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'linear'
        }
    },

    diagrams
};
