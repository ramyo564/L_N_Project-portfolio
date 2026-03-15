import { diagrams } from './diagrams.js';

export const templateConfig = {
    system: {
        documentTitle: 'Yohan | Life Navigation Problem Solving Portfolio',
        systemName: 'LIFE_NAVIGATION_PROBLEM_SOLVING_V.1.0'
    },

    hero: {
        sectionId: 'upgrade-todo-problem-solving',
        panelTitle: 'LIFE_NAVIGATION_PROBLEM_SOLVING_OVERVIEW',
        panelUid: 'ID: LIFE-NAV-PS-00',
        diagramId: 'upgrade-todo-problem-overview',
        headline: '500VU 기준 핵심 성능 개선',
        headlineItems: [
            'WRITE p95: 1.9s -> 126ms',
            'READ p95: 975ms -> 141ms',
            'READ RPS: 972 -> 3680',
            'WRITE RPS: 373 -> 916'
        ],
        summaryRows: [
            {
                label: '문제',
                value: '고부하에서 인증/권한 쿼리, 메시지 발행 블로킹, 캐시·트랜잭션 경계 이슈가 동시에 병목으로 작동'
            },
            {
                label: '해결',
                value: '병목을 6개 케이스로 분해해 인증 중복조회 제거, 비동기 발행 분리, DB 경로 튜닝을 순차 적용'
            },
            {
                label: '결과',
                value: '대표 요청 권한 게이트 3->1, http_req_failed.rate 0.93%->0%, 읽기/쓰기 RPS 대폭 개선을 k6·Grafana·로그로 교차 검증'
            }
        ],
        kpiCards: [
            { label: 'AUTH GATE QUERY', value: '3 -> 1', delta: '-67%' },
            { label: 'FAILED RATE (1000VU)', value: '0.93% -> 0%', delta: '-100%' },
            { label: 'WRITE p95 (500VU)', value: '1.9s -> 126ms', delta: '-93%' },
            { label: 'READ p95 (500VU)', value: '975ms -> 141ms', delta: '-86%' }
        ],
        diagramNote: '세부 코드 경로와 증거 체인은 아래 CODE_EVIDENCE_MAP에서 확인 가능합니다.',
        k6ButtonLabel: '500VU BEFORE/CURRENT 증거 보기',
        metrics: [
            {
                label: '요약',
                value: 'Life Navigation 백엔드 성능 개선 사례를 문제→원인→해결→결과 흐름으로 재구성했습니다.'
            },
            {
                label: '검증',
                value: 'Problem Solving 6건 + Code Path + Commit Trail + k6/Grafana Evidence'
            },
            {
                label: '핵심 지표',
                value: '대표 단일 요청 기본 권한 게이트 3 -> 1',
                kind: 'metric'
            },
            {
                label: '핵심 지표',
                value: 'http_req_failed.rate 0.93% -> 0%, p95 488ms -> 124ms',
                kind: 'metric'
            },
            {
                label: '핵심 지표',
                value: 'read p95 975ms -> 141ms, read RPS 972 -> 3680, write RPS 373 -> 916',
                kind: 'metric'
            }
        ],
        k6Overview: {
            modalTitle: 'K6_TEST_ENVIRONMENT_OVERVIEW',
            profile: '2m@100, 3m@200, 5m@300, 10m@400, 5m@500, 5m@300, 2m@0',
            maxVu: 500,
            hardware: [
                { label: 'CPU', value: 'AMD Ryzen 7 5800U (8C/16T)' },
                { label: 'RAM', value: '32GB' },
                { label: 'OS', value: 'Ubuntu 22.04 LTS' },
                { label: 'Storage', value: 'NVMe SSD (PCIe 3.0)' }
            ],
            measurementProtocol: [
                '동일 profile(500VU)에서 before/current를 각각 3회 반복 측정하고 중앙값 기준으로 비교.',
                '결과 수집은 k6 summary, Grafana 패널 타임스탬프, API 로그를 함께 교차 검증.',
                '지표 정의: p95(지연 상위 5% 경계), RPS(초당 처리량), 에러율(요청 실패 비율).'
            ],
            resultInterpretation: [
                'WRITE p95 1.9s -> 126ms: 체감 지연이 크게 줄어 고부하 구간의 응답 안정성이 향상.',
                'READ p95 975ms -> 141ms: 권한/조회 경로 병목 완화로 tail latency가 낮아짐.',
                'READ RPS 972 -> 3680, WRITE RPS 373 -> 916: 동일 VU에서 처리량 한계가 확장됨.'
            ],
            dbRowEstimation: [
                'WRITE setup: TOTAL_USERS=1000 기준 회원가입 row 생성(유저/인증 row).',
                'WRITE iteration: 1 project + 2 tasks + 6 subtasks = 9 rows 생성 시도/iteration.',
                'WRITE net row: SHOULD_DELETE_PROJECT=true 이므로 project/task/subtask 잔존 row는 거의 0.',
                'WRITE rough total(current 916 RPS 기준): 요청 6개/iteration 가정 시 약 294k iteration, 약 2.6M rows 생성 후 삭제.',
                'READ setup: user 1000명 × (project 1 + task 3 + subtask 9) = 약 13,000 rows(+회원 row).',
                'READ run: 조회 전용 루프라 row 증가는 거의 없음.'
            ],
            comparisons: [
                {
                    id: 'write',
                    title: 'WRITE_TEST (VU 500) · BEFORE vs CURRENT',
                    beforeLabel: 'BEFORE',
                    currentLabel: 'CURRENT',
                    beforeImage: './k6-500-result/write_500-before.png',
                    currentImage: './k6-500-result/write_500-current.png',
                    beforeAlt: 'k6 write test before result',
                    currentAlt: 'k6 write test current result'
                },
                {
                    id: 'read',
                    title: 'READ_TEST (VU 500) · BEFORE vs CURRENT',
                    beforeLabel: 'BEFORE',
                    currentLabel: 'CURRENT',
                    beforeImage: './k6-500-result/read_500-before.png',
                    currentImage: './k6-500-result/read_500-current.png',
                    beforeAlt: 'k6 read test before result',
                    currentAlt: 'k6 read test current result'
                }
            ],
            links: [
                { label: 'OPEN_K6_README', href: './k6/README.md' }
            ]
        }
    },

    topPanels: [
        {
            sectionId: 'upgrade-todo-code-evidence',
            panelTitle: 'CODE_EVIDENCE_MAP',
            panelUid: 'ID: LIFE-NAV-PS-01',
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
            panelUid: 'ID: LIFE-NAV-PS-01A',
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
            panelUid: 'ID: LIFE-NAV-PS-01B',
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
            panelUid: 'ID: LIFE-NAV-PS-01C',
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
        { label: 'OVERVIEW', target: '#upgrade-todo-problem-solving' },
        { label: 'CASES', target: '#upgrade-todo-cases', caseMenu: true },
        { label: 'CODE_EVIDENCE', target: '#upgrade-todo-code-evidence' },
        { label: 'SKILL_SET', target: '#upgrade-todo-skill-set' },
        { label: 'CONTACT', target: '#contact' }
    ],

    skills: {
        sectionId: 'upgrade-todo-skill-set',
        panelTitle: 'SKILL_SET',
        panelUid: 'ID: LIFE-NAV-STACK',
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
            title: 'LIFE_NAVIGATION_TROUBLESHOOTING_CASES',
            navLabel: 'CASES',
            sectionLead: '대표 3건을 먼저 보고, 필요할 때 전체 Case 1~6을 확장해 깊게 읽을 수 있도록 구성했습니다.',
            recruiterBrief: {
                kicker: 'RECRUITER_QUICK_BRIEF',
                title: '1분 요약으로 먼저 보는 핵심 변화',
                cases: [
                    {
                        id: 'Case 1',
                        anchorId: 'upgrade-todo-case-1',
                        title: 'UUIDv7 merge 제거와 회원가입 트랜잭션 안정화',
                        problem: 'UUID 사전할당 경로에서 불필요한 SELECT+INSERT와 락 대기가 누적',
                        action: 'Persistable isNew + Outbox 비동기 분리로 저장/후속처리 결합 해소',
                        impact: 'merge 경로 제거, 회원가입 응답을 202 Accepted + X-User-Id 흐름으로 전환'
                    },
                    {
                        id: 'Case 2',
                        anchorId: 'upgrade-todo-case-2',
                        title: '인증/권한 경로 최적화 (3→1)',
                        problem: 'JWT 인증/권한 검증에서 사용자·소유권 조회가 반복',
                        action: 'JWT Claims + AOP 단일 권한게이트로 검증 경로 수렴',
                        impact: '대표 단일 요청 기본 게이트 3 -> 1, JWT Claims + AOP 게이트'
                    },
                    {
                        id: 'Case 3',
                        anchorId: 'upgrade-todo-case-3',
                        title: '조회 트랜잭션 경량화',
                        problem: '@Cacheable 경로가 트랜잭션을 길게 점유해 idle in transaction 발생',
                        action: '읽기 전용 경계 분리와 cache hit 우선 경로로 조회 플로우 정리',
                        impact: '커넥션 점유 시간 단축, 조회 경로 응답 변동성 완화'
                    },
                    {
                        id: 'Case 4',
                        anchorId: 'upgrade-todo-case-4',
                        title: 'VT/Redis 설정 조합 재검증 및 closure',
                        problem: '초기 C3/C4 완화 근거만으로는 최신 브랜치 complete 판정을 내리기 어려웠음',
                        action: '2026-03-13 재수집 + 2026-03-14 vt/redis 2x2 matrix + 코드 경로 검증으로 closure 증거 체인 고정',
                        impact: '2x2 재검증 4개 케이스에서 서버 기본 응답 정상, 오류 로그 미검출, 실패율 거의 0으로 수렴'
                    },
                    {
                        id: 'Case 5',
                        anchorId: 'upgrade-todo-case-5',
                        title: '비동기 메시징 고도화 (발행 블로킹 제거)',
                        problem: '요청 스레드가 RabbitMQ 동기 발행 대기를 직접 부담',
                        action: 'Async publisher + 전용 executor로 발행 경로 분리',
                        impact: 'http_req_failed.rate 0.93% -> 0%, p95 488ms -> 124ms'
                    },
                    {
                        id: 'Case 6',
                        anchorId: 'upgrade-todo-case-6',
                        title: '통합 성능 최적화 (배치/캐시/트랜잭션)',
                        problem: '배치 캐시/트랜잭션 경계가 분산되어 처리량이 제한',
                        action: '배치 단위 트랜잭션과 캐시 경계를 재정렬해 lock/flush 비용 감소',
                        impact: '고부하 구간 처리량 증대 및 tail latency 안정화'
                    }
                ]
            },
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
                            businessImpact: '회원가입 트랜잭션 병목 해소로 서비스 첫 진입 지면의 이탈을 방지하고 전환율을 방어했습니다.',
                            overview: '사전 UUID 할당 환경에서 `save -> merge(SELECT+INSERT)`로 이어지던 병목을\nPersistable `isNew()`와 Outbox 비동기 분리로 정리한 케이스입니다.',
                            recruiterSummary: [
                                '회원가입에서 간헐적으로 느려지던 원인을 저장과 후속 처리 결합 구조에서 확인했습니다.',
                                '핵심 저장과 후속 이벤트 처리를 분리해 실패 전파를 줄이고 응답을 안정화했습니다.',
                                'merge 경로를 제거하고 회원가입 응답을 202 Accepted + X-User-Id 흐름으로 전환했습니다.'
                            ],
                            role: 'Auth/User 저장 경계 재설계, Outbox 발행 안정화, 단건 트랜잭션 분리',
                            stackSummary: 'Persistable, UUIDv7, OutboxEventAuthProcessor, RabbitMQ',
                            cause: '1) 사전 UUID 할당 엔티티가 merge 경로로 진입해 불필요한 SELECT와 락 대기가 누적되었습니다.\n2) Auth/User 생성을 한 트랜잭션에 묶어 후속 실패가 전체 롤백으로 번지는 결합이 있었습니다.',
                            problem: '1) 사전할당 UUID 엔티티 저장에서 merge 경로가 타며 SELECT+INSERT가 동반되었습니다.\n2) Auth/User 생성이 한 흐름에 묶여 락 대기와 결합도 문제가 커졌습니다.\n3) 배치 발행 중 한 건 실패 시 전체 롤백 위험이 있었습니다.',
                            solution: '1) `AuthUserEntity`, `UserEntity`에 Persistable `isNew()`를 적용해 INSERT 중심 경로로 전환했습니다.\n2) 도메인 이벤트를 Outbox 테이블에 저장하고 Publisher가 비동기로 전달하도록 분리했습니다.\n3) `OutboxEventAuthProcessor.processOne`에 `REQUIRES_NEW`를 적용해 이벤트 단건 격리 처리로 변경했습니다.\n4) Outbox payload를 text 컬럼으로 고정하고 error_message 절삭 처리로 poison pill 루프를 차단했습니다.',
                            result: '1) `merge(SELECT+INSERT)`를 제거하고 회원가입 응답을 `202 Accepted + X-User-Id` 기반 비동기 등록 흐름으로 전환했습니다.\n2) 회원가입 핵심 트랜잭션과 후속 사용자 생성이 분리되어 응답성과 안정성이 개선되었습니다.',
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
                                    missingBeforeReason: 'Before 단계는 동기식 JVM 이벤트 흐름이므로 Queue 패널은 After에서만 제시합니다.'
                                },
                                {
                                    label: 'RabbitMQ Queue After User',
                                    src: './case1/after/case1-rabbitmq-queue-after-user.png',
                                    pairKey: 'rabbitmq queue user',
                                    missingBeforeReason: 'Before 단계는 동기식 JVM 이벤트 흐름이므로 Queue 패널은 After에서만 제시합니다.'
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
                                { label: 'PERFORMANCE_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-1-path' }
                            ]
                        },
                        {
                            mermaidId: 'case-auth-nplus1-collapse',
                            anchorId: 'upgrade-todo-case-2',
                            title: 'Case 2. JWT Claims + AOP 권한게이트로 인증 N+1 경로 축소',
                            subtitle: '2025-11 · 인증 필터와 프로젝트 접근 검증 최적화',
                            overview: '요청마다 반복되던 auth_user 조회와 project 검증 쿼리를\nJWT Claims 기반 인증 + 단일 권한게이트로 정리한 케이스입니다.',
                            recruiterSummary: [
                                '인증 성공 이후에도 같은 사용자/권한 정보를 반복 조회해 응답이 느려지는 문제가 있었습니다.',
                                '검증 경로를 한 곳으로 모아 중복 확인을 제거하고 요청당 기본 비용을 낮췄습니다.',
                                '대표 단일 요청 기본 권한 게이트를 3 -> 1로 줄였습니다.'
                            ],
                            role: 'JwtAuthenticationFilter 최적화, @CheckProjectAccess 경계 정리, ownership 쿼리 단일화',
                            stackSummary: 'JwtAuthenticationFilter, ProjectAccessAspect, ProjectOwnershipPersistenceAdapter',
                            cause: '1) JWT 인증 요청마다 사용자 재조회가 발생해 요청당 기본 쿼리 비용이 누적됐습니다.\n2) 프로젝트 접근 검증이 핸들러마다 중복 호출되어 읽기 경로 부하가 커졌습니다.',
                            problem: '1) JWT 인증 요청마다 DB에서 사용자 정보를 재조회해 auth_user 반복 쿼리가 누적되었습니다.\n2) project 접근 검증에서 소유권/활성 상태 확인이 요청 경로마다 중복 실행되었습니다.\n3) 고부하 테스트에서 인증 경로가 쿼리 부하를 키우는 병목으로 작동했습니다.',
                            solution: '1) `JwtAuthenticationFilter`에서 `jwtProvider.getClaimsFromAccessToken` 기반으로 userId/email을 바로 추출했습니다.\n2) `AuthTokenCachePort`를 적용해 토큰 캐시 HIT 시 JWT 파싱도 생략하도록 구성했습니다.\n3) 컨트롤러에 `@CheckProjectAccess`를 적용하고 `ProjectAccessAspect`에서 선행 검증하도록 통일했습니다.\n4) ownership 검증은 `isOwnerAndActive` 경로로 수렴시켜 중복 검증 비용을 줄였습니다.',
                            result: '1) 대표 단일 요청 기본 권한 게이트를 `3 -> 1`로 줄였습니다.\n2) JWT Claims + AOP 구조로 인증/권한 검증의 경계가 명확해져 고부하 시 응답 안정성이 개선되었습니다.',
                            businessImpact: '대표 단일 요청의 권한 검증 게이트를 3단계에서 1단계로 축소하여, 고부하 환경에서도 안정적인 응답 속도를 유지했습니다.',
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
                                { label: 'PERFORMANCE_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-2-path' }
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
                            result: '1) `idle in transaction` 세션과 커넥션 점유 시간이 줄어들었습니다.\n2) 권한 조회 경로의 커넥션 점유 시간이 짧아져 부하 시 세션 안정성이 개선되었습니다.',
                            businessImpact: 'DB 커넥션 점유 시간을 단축하고 세션 안정성을 확보하여, 트래픽이 몰리는 상황에서도 리소스 고갈을 방지했습니다.',
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
                                    missingBeforeReason: '즉시 조회 비교는 After 200 확인을 중심으로 제시합니다. Before 403은 보조 신호입니다.'
                                },
                                {
                                    label: 'Redis Pending Key After',
                                    src: './case3/after/case3-redis-pending-key-after.png',
                                    pairKey: 'redis pending key',
                                    missingBeforeReason: 'Pending key 전략은 After에서 도입되어 After evidence only입니다.'
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
                                { label: 'PERFORMANCE_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-3-path' }
                            ]
                        },
                        {
                            mermaidId: 'case-project-pending-cache',
                            anchorId: 'upgrade-todo-case-4',
                            title: 'Case 4. C3/C4 완화축 식별에서 2x2 재검증 complete closure까지',
                            subtitle: '2026-03-13 ~ 2026-03-14 · mitigation -> hold -> complete',
                            overview: 'Case4는 단일 before/after가 아니라 3단계로 닫은 케이스입니다.\nPhase A(C3/C4)에서 완화축을 식별하고, Phase B(fail/control)에서 회복과 잔존 리스크를 분리했으며,\nPhase C(2x2 matrix + code path)에서 최신 브랜치 complete 판정으로 종료했습니다.',
                            role: '매트릭스 실험 설계, fail/control 재수집, evidence hub 정리, closure 판정 기준 고정',
                            stackSummary: 'Virtual Threads, Lettuce shareNativeConnection, Docker Compose matrix run, k6, Spring logs',
                            cause: '1) C3/C4 완화 근거만으로는 최신 브랜치 complete를 단정하기 어려웠습니다.\n2) 수집 경로 혼선과 토글 반영 착시로 같은 이슈를 서로 다른 문맥으로 해석할 위험이 있었습니다.\n3) 사용자 지표 회복과 내부 예외 소거를 동시에 충족하는 closure gate가 필요했습니다.',
                            problem: '1) 2026-03-13 재수집 시점에는 사용자 경로 회복과 내부 Redis 예외 잔존이 공존했습니다.\n2) before/after 서사만으로는 C3/C4 완화와 latest-branch complete를 한 문장으로 설명하기 어려웠습니다.\n3) Case4를 장기 문맥에서도 같은 판정으로 재생성할 수 있는 단일 허브가 필요했습니다.',
                            solution: '1) Phase A: C3/C4 matrix에서 완화축을 식별했습니다.\n2) Phase B: 같은 스크립트로 fail/control 재수집해 "회복 yes, complete hold"를 분리했습니다.\n3) Phase C: 2026-03-14 vt/redis 2x2 matrix로 최신 브랜치 재검증을 수행했습니다.\n4) 최종 판정 기준을 "실패율 요약, 체크 성공률, 오류 로그 미검출, 헬스체크 정상 응답"으로 고정하고 case4 hub 문서에 판정을 고정했습니다.',
                            result: '1) Phase A(C3 -> C4): `method_error_count 524 -> 0`, `http_req_failed.rate 1.06% -> 0%`, `req/s 442.77 -> 804.68`로 완화축을 식별했습니다.\n2) Phase C(2x2 matrix): 4개 케이스 모두 서버 기본 응답 정상(health 200), 오류 시그니처 로그 미검출, 부하 실패율이 거의 0으로 수렴했습니다.\n3) 과거 장애 시그니처(`@Async CacheEvictionListener` 축)의 재검출이 없어 최신 브랜치 기준 Case4를 complete로 종료했습니다.',
                            businessImpact: '장애 원인을 단계별 검증하고 판정 기준을 명확히 하여, 리스크 재발을 원천 차단하고 시스템 신뢰도를 입증했습니다.',
                            evidenceImages: [
                                {
                                    label: 'Phase A Matrix Before (2026-03-13)',
                                    src: './case4/before/case4-phase-a-matrix-before-2026-03-13.svg',
                                    alt: 'case4 phase a c3 c4 matrix summary before',
                                    pairKey: 'matrix timeline'
                                },
                                {
                                    label: 'Phase C Matrix After (2026-03-14)',
                                    src: './case4/after/case4-phase-c-matrix-after-2026-03-14.svg',
                                    alt: 'case4 phase c vt redis 2x2 matrix summary after',
                                    pairKey: 'matrix timeline'
                                }
                            ],
                            extraEvidenceImages: [
                                {
                                    label: 'Phase B Fail/Control Before (2026-03-13)',
                                    src: './case4/before/case4-phase-b-fail-control-before-2026-03-13.svg',
                                    pairKey: 'phase-b-vs-phase-c'
                                },
                                {
                                    label: 'Phase C Code/Path After (2026-03-14)',
                                    src: './case4/after/case4-phase-c-codepath-after-2026-03-14.svg',
                                    pairKey: 'phase-b-vs-phase-c'
                                },
                                {
                                    label: 'Phase C Web Dashboard After (VT=true, redis=true)',
                                    src: './case4/after/web-dashboard-img/after-vt-true-redis-true.png',
                                    pairKey: 'phase-c-web-dashboard-vt-true-redis-true',
                                    missingBeforeReason: '웹 대시보드는 보조증거라 after-only로 제시합니다. 최종 판정은 실패율 요약표, 체크 성공률, 오류 로그 미검출, 헬스체크 200을 함께 확인해 내렸습니다.'
                                },
                                {
                                    label: 'Phase C Web Dashboard After (VT=true, redis=false)',
                                    src: './case4/after/web-dashboard-img/after-vt-true-redis-false.png',
                                    pairKey: 'phase-c-web-dashboard-vt-true-redis-false',
                                    missingBeforeReason: '웹 대시보드는 보조증거라 after-only로 제시합니다. 최종 판정은 실패율 요약표, 체크 성공률, 오류 로그 미검출, 헬스체크 200을 함께 확인해 내렸습니다.'
                                },
                                {
                                    label: 'Phase C Web Dashboard After (VT=false, redis=true)',
                                    src: './case4/after/web-dashboard-img/after-vt-false-redis-true.png',
                                    pairKey: 'phase-c-web-dashboard-vt-false-redis-true',
                                    missingBeforeReason: '웹 대시보드는 보조증거라 after-only로 제시합니다. 최종 판정은 실패율 요약표, 체크 성공률, 오류 로그 미검출, 헬스체크 200을 함께 확인해 내렸습니다.'
                                },
                                {
                                    label: 'Phase C Web Dashboard After (VT=false, redis=false)',
                                    src: './case4/after/web-dashboard-img/after-vt-false-redis-false.png',
                                    pairKey: 'phase-c-web-dashboard-vt-false-redis-false',
                                    missingBeforeReason: '웹 대시보드는 보조증거라 after-only로 제시합니다. 최종 판정은 실패율 요약표, 체크 성공률, 오류 로그 미검출, 헬스체크 200을 함께 확인해 내렸습니다.'
                                },
                                {
                                    label: 'C3 Raw k6 Before',
                                    src: './case4/before/c3/c3-k6.png',
                                    pairKey: 'raw c3-c4 k6',
                                    missingAfterReason: '원본 C3/C4 캡처는 2026-03-13 matrix 아카이브로 유지합니다. 최신 closure는 Phase C summary와 hub 문서를 기준으로 판정합니다.'
                                },
                                {
                                    label: 'C4 Raw k6 Before',
                                    src: './case4/before/c4/c4-k6.png',
                                    pairKey: 'raw c3-c4 k6',
                                    missingAfterReason: '원본 C3/C4 캡처는 2026-03-13 matrix 아카이브로 유지합니다. 최신 closure는 Phase C summary와 hub 문서를 기준으로 판정합니다.'
                                },
                                {
                                    label: 'C3 Redis Raw Before',
                                    src: './case4/before/c3/c3-redis.png',
                                    pairKey: 'raw c3-c4 redis',
                                    missingAfterReason: '2026-03-14 최종 판정은 패널 이미지보다 실패율 요약, 체크 성공률, 오류 로그 미검출, 헬스체크 200 여부를 우선 기준으로 사용했습니다.'
                                },
                                {
                                    label: 'C4 Redis Raw Before',
                                    src: './case4/before/c4/c4-redis.png',
                                    pairKey: 'raw c3-c4 redis',
                                    missingAfterReason: '2026-03-14 최종 판정은 패널 이미지보다 실패율 요약, 체크 성공률, 오류 로그 미검출, 헬스체크 200 여부를 우선 기준으로 사용했습니다.'
                                }
                            ],
                            skills: ['Config Matrix Testing', 'Root Cause Validation', 'Evidence Hub Curation', 'Closure Gate Design'],
                            highlights: [
                                'Phase A/B/C timeline keeps mitigation and complete verdict separated by date',
                                '최종 판정 기준은 실패율, 체크 성공률, 오류 로그 미검출, 헬스체크 정상 응답의 동시 충족',
                                '@Async CacheEvictionListener failure axis is no longer observed on latest branch path',
                                'Case4 claim is bounded to latest-branch verification, not a universal future guarantee'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_4', href: './case4/CASE-4.md' },
                                { label: 'EVIDENCE_MANIFEST', href: './case4/case4-evidence-manifest.md' },
                                { label: 'PERFORMANCE_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-4-path' }
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
                            subtitle: '2025-12 · 1000VU write raw summary 기준 안정화',
                            overview: 'API 스레드에서 직접 `convertAndSend`를 수행하던 구조를\n전용 executor 비동기 발행으로 분리해 request failure와 p95를 낮춘 케이스입니다.',
                            recruiterSummary: [
                                '요청 처리 중 메시지 발행 대기를 함께 수행해 고부하에서 request failure와 지연이 늘어나는 문제가 있었습니다.',
                                '메시지 발행을 전용 비동기 경로로 분리해 API 응답 경로를 가볍게 만들었습니다.',
                                '1000VU write raw summary 기준 http_req_failed.rate 0.93% -> 0%, p95 488ms -> 124ms로 사용자 체감 지연을 줄였습니다.'
                            ],
                            role: 'AsyncMessagePublishingDecorator 설계, Producer Adapter 전환, Executor 정책 분리',
                            stackSummary: 'AsyncMessagePublishingDecorator, AsyncConfig, RabbitMQ producer adapters',
                            cause: '1) API 요청 스레드가 `convertAndSend` 동기 발행 대기를 직접 떠안아 request failure와 응답 지연이 증가했습니다.\n2) 고VU 구간에서 채널 경합이 응답 지연으로 즉시 전파되는 구조였습니다.',
                            problem: '1) 요청 스레드가 Rabbit 채널 경합 대기를 직접 겪으며 응답 지연이 발생했습니다.\n2) 1000VU 이상에서 request failure가 누적되고 오류 응답이 증가했습니다.\n3) 메시지 발행 병목이 API 처리량 저하로 직접 전파되었습니다.',
                            solution: '1) `AsyncMessagePublishingDecorator.executeAsync`로 발행 작업을 분리했습니다.\n2) `AsyncConfig.rabbitPublisherExecutor`에서 발행 전용 executor 타입과 pool-size를 분리 설정했습니다.\n3) Project Task SubTask producer adapter를 동기 호출에서 async decorator 호출로 변경했습니다.\n4) semaphore 기반 동시 발행 제한으로 채널 풀 고갈 리스크를 제어했습니다.',
                            result: '1) 1000VU 쓰기 테스트 raw summary 기준 `http_req_failed.rate 0.93% -> 0%`를 확인했습니다.\n2) p95 지연이 `488ms -> 124ms`로 단축되었습니다.',
                            businessImpact: '메시지 발행 지연이 API 응답 병목으로 이어지던 구조를 끊어내어 1000VU 부하에서도 실패율 0%로 사용자 경험을 방어했습니다.',
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
                                { label: 'PERFORMANCE_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-5-path' }
                            ]
                        },
                        {
                            mermaidId: 'case-integrated-performance-tuning',
                            anchorId: 'upgrade-todo-case-6',
                            title: 'Case 6. 배치 캐시 트랜잭션 구조 통합 최적화로 처리량 증대',
                            subtitle: '2025-12 · 500VU baseline 개선 + 1000VU 재촬영 증거',
                            overview: '단일 튜닝이 아닌 저장 경로 배치 인덱스 캐시 트랜잭션 경계를 함께 조정해\n실측 RPS와 p95를 동시에 개선한 케이스입니다.',
                            role: 'insertWithPosition 원자화, 부분 인덱스 적용, cache eviction 타이밍 조정, 부하 검증',
                            stackSummary: 'Task Project SubTask repository, Flyway index migration, k6 performance test',
                            cause: '1) 쓰기 경로에서 위치 계산과 INSERT가 분리되어 경쟁 구간이 커졌습니다.\n2) 조회 경로는 인덱스/캐시 경계가 흔들리면 큐 적체와 지연이 함께 증가했습니다.',
                            problem: '1) 위치 계산 SELECT + INSERT 분리와 캐시 경합으로 쓰기 경로에서 병목이 발생했습니다.\n2) 상태 조회 쿼리에서 status partial index(V7) 부재 구간이 고부하 지연을 키웠습니다.\n3) 캐시 무효화/트랜잭션 순서가 어긋나면 일관성과 처리량을 동시에 잃는 문제가 있었습니다.',
                            solution: '1) Project Task SubTask 생성에 `insertWithPosition` 네이티브 경로를 적용해 경쟁 구간을 축소했습니다.\n2) Flyway 마이그레이션에 ownership/status/outbox partial index를 추가했습니다.\n3) 캐시 무효화는 after commit 기준으로 통일해 데이터 정합성과 재조회 비용을 안정화했습니다.\n4) k6 시나리오로 읽기 쓰기 각각의 RPS/p95를 반복 측정해 튜닝 효과를 검증했습니다.',
                            result: '1) 500VU baseline summary 기준 읽기 RPS `972 -> 3680`, 쓰기 RPS `373 -> 916`으로 향상되었습니다.\n2) 같은 baseline에서 읽기 p95 `975ms -> 141ms`, 쓰기 p95 `1.9s -> 126ms`로 단축되었습니다.\n3) 카드 상단 k6 이미지는 1000VU 재촬영 증거이며, 대표 수치는 500VU baseline summary를 사용합니다.',
                            businessImpact: '배치, 인덱스, 캐시 무효화 시점을 통합 튜닝하여 읽기/쓰기 처리량(RPS)을 각각 최대 279%, 146% 증대시켰습니다.',
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
                                    missingBeforeReason: 'Before commit은 V7 status partial index 도입 전 시점이라 status index 패널은 After에서만 제시합니다.'
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
                                { label: 'PERFORMANCE_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-6-path' }
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
        panelUid: 'ID: LIFE-NAV-COMMS',
        description: 'Life Navigation 포트폴리오 관련 문의 및 전체 문서는 아래 경로로 확인 가능합니다.',
        actions: [
            { label: 'EMAIL', href: 'mailto:yohan032yohan@gmail.com' },
            { label: 'LIFE_NAVIGATION_REPO', href: 'https://github.com/ramyo564/L_N_Project' },
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
