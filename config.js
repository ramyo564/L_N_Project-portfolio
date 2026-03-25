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
        diagramId: 'architecture',
        headline: '성능 병목 재현 및 단계적 아키텍처 튜닝을 통한 고부하 처리 역량 입증',
        headlineItems: [
            'Reliability: http_req_failed 0.93% → 0% (Failed Rate Zero)',
            'Throughput: Read RPS 279%↑, Write RPS 145%↑ 달성',
            'Latency: Write p95 1.9s → 126ms (15배 개선)',
            'Baseline: 500VU 고부하 환경 실측 증거 기반'
        ],
        summaryRows: [
            {
                label: '문제',
                value: '비즈니스 로직 확장 시 고부하에서 인증/권한 쿼리, 메시지 발행 블로킹 등 복합적 병목 발생'
            },
            {
                label: '해결',
                value: '병목을 6개 케이스로 분해: Spring Hexagonal 구조를 활용한 비동기 발행 분리 및 DB 경로 튜닝'
            },
            {
                label: '결과',
                value: '500VU 고부하 환경에서 Failed Rate 0% 및 주요 지표 15배 개선, 코드 단위의 기술적 근거 확보'
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
            sectionLead: 'Case 1~6을 1분 요약페이지와 아키텍처, 깃허브 페이지로 구성했습니다',
            recruiterBrief: {
                kicker: 'QUICK_BRIEF',
                title: '1분 요약으로 먼저 보는 핵심 변화',
                actions: [
                    { label: 'ARCHITECTURE_PAGE', href: 'https://ramyo564.github.io/L_N_Project/', variant: 'primary' },
                    { label: 'GITHUB_REPO', href: 'https://github.com/ramyo564/L_N_Project', variant: 'secondary' }
                ],
                cases: [
                    {
                        id: 'Case B',
                        anchorId: 'upgrade-todo-case-B',
                        title: '트랜잭션 분리와 JPA 튜닝을 통한 커넥션 안정화',
                        problem: 'JPA merge(SELECT+INSERT)와 Redis I/O 결합으로 인한 Idle in transaction 및 커넥션 풀 고갈 위험',
                        action: 'Persistable isNew() INSERT 경로 강제 및 조회 트랜잭션/캐시 경계 분리로 커넥션 점유 시간 최소화',
                        impact: '읽기/쓰기 양방향 트랜잭션 점유 시간 단축으로 고부하 환경 세션 안정성 및 동시 처리 능력 확보'
                    },
                    {
                        id: 'Case 1',
                        anchorId: 'upgrade-todo-case-1',
                        title: 'UUIDv7 merge 제거와 회원가입 트랜잭션 안정화',
                        problem: 'UUID 사전할당 경로에서 불필요한 SELECT+INSERT와 락 대기가 누적',
                        action: 'Persistable isNew + Outbox 비동기 분리로 저장/후속처리 결합 해소',
                        impact: 'merge 경로 제거, 회원가입 응답을 202 Accepted + X-User-Id 흐름으로 전환'
                    },
                    {
                        id: 'Case C',
                        anchorId: 'upgrade-todo-case-C',
                        title: '인증/권한 게이트 단일화 및 OAuth2 추상화',
                        problem: '인증 N+1 쿼리 병목(3회→1회) 및 소셜 로그인 채널 확장에 따른 도메인 결합도 증가',
                        action: 'JWT Claims 기반 인증 필터 최적화, AOP 선행 검증 도입 및 OAuth2 인터페이스 기반 추상화 설계',
                        impact: '권한 게이트 단축으로 응답성 확보 및 신규 소셜 채널 추가 시 코드 수정 없는 확장성(OCP) 실현'
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
                        title: 'Virtual Threads 환경 최적화 및 신뢰성 검증',
                        problem: '신규 기술 도입 초기, 특정 설정 조합에서 발생하는 미세 병목 현상 식별 필요',
                        action: '설정 조합별 비교 테스트 및 2x2 매트릭스 교차 검증 수행',
                        impact: '에러율 0% 달성 및 최신 브랜치 기반의 시스템 무결성 최종 확정'
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
                    },
                    {
                        id: 'Case A',
                        anchorId: 'upgrade-todo-case-A',
                        title: '대용량 트래픽 램프업(Ramp-up) 부하 테스트 기반 통합 성능 최적화',
                        problem: '가상 스레드 환경에서 1000VU 램프업 테스트 시, DB가 아닌 Redis와 RabbitMQ 동기 발행 대기, 저장 경로의 원자성 부족으로 응답 실패(0.93%) 및 지연 발생',
                        action: '가상 스레드 매트릭스 검증, 전용 executor 기반 비동기 분리, 인덱스 및 원자적 쿼리 통합 튜닝 적용',
                        impact: '실패율 0% 달성, p95 488ms→124ms 단축, 읽기 +279% 및 쓰기 +145% RPS 향상'
                    },
                    {
                        id: 'Architecture',
                        title: '시스템 전체 아키텍처 및 설계 의도',
                        problem: '프로젝트의 전체적인 서비스 구조와 레이어별 설계 의도를 파악하기 위해 아키텍처 페이지로 이동합니다.',
                        action: '아키텍처 대시보드 버튼 클릭',
                        impact: '전체 컴포넌트 간의 통신 흐름과 기술 결정 근거를 시각화하여 확인 가능',
                        links: [
                            { label: 'ARCHITECTURE_PAGE_OPEN', href: 'https://ramyo564.github.io/L_N_Project/' }
                        ]
                    },
                    {
                        id: 'Git repo',
                        title: '기술 상세 구현 및 코드 베이스',
                        problem: '실제 구현된 코드와 상세 기술 문서를 확인하기 위해 깃허브 레포지토리로 이동합니다.',
                        action: '깃허브 레포지토리 버튼 클릭',
                        impact: '전체 소스 코드와 커밋 히스토리, 기술 Wiki 확인 가능',
                        links: [
                            { label: 'GITHUB_REPO_OPEN', href: 'https://github.com/ramyo564/L_N_Project' }
                        ]
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
                            mermaidId: 'case-c-auth-optimization',
                            hideReviewDiagram: true,
                            anchorId: 'upgrade-todo-case-C',
                            title: 'Case C. 단일 권한 게이트 구축 및 소셜 로그인 통합을 통한 인증 아키텍처 최적화',
                            subtitle: '2025.09 ~ 2025.11 · 도메인 결합도 완화 및 인증 쿼리 병목 해소',
                            businessImpact: '대표 단일 요청의 권한 검증 게이트를 3단계에서 1단계로 축소하여 고부하 환경에서도 지연 없는 응답을 보장하고, 확장성 높은 다중 소셜 로그인 아키텍처를 완성했습니다.',
                            overview: 'JWT Claims 기반 인증과 AOP 권한 게이트를 통합하고, OAuth2 인터페이스 기반 추상화로 다중 소셜 로그인 확장성을 확보한 케이스입니다.',
                            recruiterSummary: [
                                '불필요하게 반복되던 권한 검증 로직을 JWT Claims와 AOP 기반의 단일 게이트로 통합하여 쿼리 횟수를 3회에서 1회로 줄였습니다.',
                                'DI(의존성 주입) 및 DIP(의존성 역전 원칙)를 적용해 Google, Kakao, Naver 등 다중 소셜 로그인 구조를 추상화하여 도메인 결합도를 낮췄습니다.',
                                '외부 벤더사의 변경이나 추가에도 핵심 비즈니스 로직이 영향받지 않는 유연하고 확장성 높은 인증 아키텍처를 확립했습니다.'
                            ],
                            role: '인증 필터 최적화, AOP 권한 게이트 설계, OAuth2 공급자 추상화 및 DI 구조 구현',
                            stackSummary: 'Spring Security, JWT Claims, AOP, OAuth2, DI/DIP Architecture',
                            cause: '1) JWT 인증 시마다 발생하는 사용자 재조회와 중복된 권한 검증 쿼리가 성능 병목을 유발.\n2) 소셜 로그인 채널 확장 시 도메인 로직과 외부 벤더 API 간의 강한 결합 발생.',
                            problem: '모든 핵심 API 요청마다 AuthUser 조회 및 Project 검증 쿼리가 중복 발생(총 3회)하여 DB 부하를 가중시켰고, 소셜 로그인 벤더사마다 다른 응답 규격이 도메인 코드를 복잡하게 제작했습니다.',
                            solution: '첫째, JWT Claims에서 직접 식별자를 추출하고 AOP 선행 검증을 도입해 인증 쿼리를 3회에서 1회로 최적화했습니다. 둘째, OAuth2UserInfo 인터페이스 기반 추상화를 통해 Google/Kakao/Naver 등 다중 채널을 전략 패턴으로 통합 관리하여 계층 간 결합을 해소했습니다.',
                            result: '권한 게이트 단축으로 고부하 테스트 시 인증 병목을 제거했으며, OCP를 준수하는 확장 가능한 소셜 로그인 아키텍처를 구축해 신규 채널 추가 비용을 최소화했습니다.',
                            evidenceImages: [
                                {
                                    label: 'BEFORE: Coupled & Redundant Auth',
                                    src: './case-C/before_arch.png',
                                    pairKey: '[아키텍처 최적화] 권한 검증 및 소셜 로그인 통합 전/후 구조도 비교'
                                },
                                {
                                    label: 'AFTER: Unified Gate & OAuth2 Strategy',
                                    src: './case-C/after_arch.png',
                                    pairKey: '[아키텍처 최적화] 권한 검증 및 소셜 로그인 통합 전/후 구조도 비교'
                                }
                            ],
                            extraEvidenceImages: [
                                { label: 'Before: Redundant Auth Queries (3x)', src: './case2/before/case2-hibernate-queries-before.png', pairKey: '[인증 쿼리 최적화] API 호출 시 발생하는 Hibernate 쿼리 횟수 감소' },
                                { label: 'After: Optimized Unified Query (1x)', src: './case2/after/case2-hibernate-queries-after.png', pairKey: '[인증 쿼리 최적화] API 호출 시 발생하는 Hibernate 쿼리 횟수 감소' },
                                { label: 'Before: Auth Bottleneck (Slow Response)', src: './case2/before/case2-grafana-slowQuery-before.png', pairKey: '[최종 임팩트] 권한 게이트 단축으로 인한 인증 병목 제거 및 응답 시간 안정화' },
                                { label: 'After: Stabilized Response Time', src: './case2/after/case2-grafana-slowQuery-after.png', pairKey: '[최종 임팩트] 권한 게이트 단축으로 인한 인증 병목 제거 및 응답 시간 안정화' }
                            ],
                            skills: ['JWT Claims', 'AOP Authorization', 'OAuth2/OIDC', 'DIP Design', 'Structural Optimization'],
                            highlights: [
                                'JWT claims supply principal without per-request auth_user lookup',
                                'AOP @CheckProjectAccess centralizes authorization gate',
                                'DIP-based OAuth2UserInfo interface decouples vendor specifics',
                                'Unified gate achieves 3:1 reduction in per-request database calls'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_C', href: './case-C/CASE-C.md' },
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
                            mermaidId: 'case-b-database-optimization',
                            anchorId: 'upgrade-todo-case-B',
                            title: 'Case B. 트랜잭션 경계 분리와 영속성(JPA) 튜닝을 통한 DB 커넥션 안정화',
                            subtitle: '2025.09 ~ 2025.12 · 데이터베이스 세션 효율화 및 커넥션 풀 고갈 방지',
                            businessImpact: '대용량 트래픽 상황에서도 DB 커넥션 풀 고갈을 원천 차단하고, 회원가입 및 조회 트랜잭션의 병목을 해소하여 서비스 다운타임을 방지했습니다.',
                            overview: 'UUIDv7 엔티티의 JPA merge 제거와 조회 트랜잭션 경량화를 통합하여 DB 리소스 사용률을 최적화한 케이스입니다.',
                            recruiterSummary: [
                                'UUIDv7 엔티티의 JPA merge(SELECT+INSERT) 병목을 Persistable 구현과 비동기 Outbox 패턴으로 해결해 쓰기 지연을 방지했습니다.',
                                '캐시 조회 중 발생하는 Idle in transaction 문제를 해결하기 위해, 트랜잭션 경계를 엄격히 분리하고 Redis Pending Cache를 도입했습니다.',
                                '불필요한 DB 커넥션 점유 시간을 대폭 줄여, 고부하 환경에서도 커넥션 풀(HikariCP) 고갈 없이 안정적인 세션 관리 능력을 확보했습니다.'
                            ],
                            role: 'JPA 영속성 컨텍스트 동작 제어, 트랜잭션 경계 설계, Redis Pending Cache 시스템 도입',
                            stackSummary: 'Spring Data JPA (Hibernate), Persistable, Outbox Pattern, Redis Cache, HikariCP',
                            cause: '1) UUID 사전 할당 시 JPA merge 로직에 따른 불필요한 SELECT 발생 및 락 대기 누적.\n2) 캐시 미스 시 조회 트랜잭션이 DB 커넥션을 점유(Idle in Tx)하여 커넥션 풀 고갈 유발.',
                            problem: '트래픽 유입 시, UUIDv7 엔티티의 JPA merge로 인한 불필요한 SELECT 쿼리 발생과, 트랜잭션 내부에서 Redis I/O가 결합되면서 DB 커넥션 반환이 지연되는(Idle in transaction) 병목 현상이 발견되었습니다. 이로 인해 HikariCP 커넥션 풀이 빠르게 고갈될 위험이 있었습니다.',
                            solution: '첫째, Persistable.isNew()를 구현해 사전 할당된 UUID의 INSERT 전용 경로를 강제하여 쓰기 지연을 없앴습니다. \n둘째, 조회 로직에서 캐시 미스 시 발생하는 트랜잭션 결합을 끊어내고, readOnly 경계 설정 및 Redis Pending Cache를 도입해 커넥션 점유 시간을 최소화했습니다.',
                            result: '읽기/쓰기 양방향에서 트랜잭션이 DB 커넥션을 물고 있는 시간을 대폭 단축하여, 고부하 환경에서도 커넥션 풀(HikariCP) 고갈 없이 안정적인 세션 관리와 동시 처리 능력을 확보했습니다.',
                            evidenceImages: [
                                {
                                    label: 'Before: JPA merge(SELECT+INSERT)로 인한 비효율 발생',
                                    src: './case1/before/case1-hibernate-before.png',
                                    pairKey: 'case-b-jpa-outbox'
                                },
                                {
                                    label: 'After: Persistable 구현으로 INSERT 전용 경로 강제',
                                    src: './case1/after/case1-hibernate-after.png',
                                    pairKey: 'case-b-jpa-outbox'
                                }
                            ],
                            extraEvidenceImages: [
                                {
                                    label: 'Before: Redis I/O 및 트랜잭션 결합으로 인한 Idle in transaction',
                                    src: './case3/before/case3-pg_stat_idle_transaction-before.png',
                                    phase: 'before',
                                    pairKey: 'case-b-connection'
                                },
                                {
                                    label: 'After: 트랜잭션 경계 분리 및 Redis Pending Cache 도입 후 안정화',
                                    src: './case3/after/case3-pg_stat_idle_transaction-after.png',
                                    phase: 'after',
                                    pairKey: 'case-b-connection'
                                }
                            ],
                            skills: ['Spring Data JPA', 'Persistable', 'Outbox Pattern', 'HikariCP Tuning', 'Redis Cache aside'],
                            highlights: [
                                'Persistable isNew forces insert path even with pre-assigned UUID',
                                'readOnly transaction boundary prevents unnecessary DB connection hold',
                                'Redis Pending Cache prevents concurrent DB access during cache misses',
                                'Outbox pattern decouples write transactions from messaging latency'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_B', href: './case-B/CASE-B.md' },
                                { label: 'PERFORMANCE_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-1-path' }
                            ]
                        },
                        {
                            mermaidId: 'case-cache-transaction-boundary',
                            anchorId: 'upgrade-todo-case-3',
                            title: 'Case 3. 데이터베이스 커넥션 점유 최적화로 동시 처리 능력 향상',
                            subtitle: '2025-11 ~ 2025-12 · DB 리소스 효율화',
                            overview: '부하가 몰릴 때 데이터베이스 연결을 불필요하게 오래 붙잡고 있는 병목을 해결하여 서버의 동시 요청 처리량을 방어한 케이스입니다.',
                            recruiterSummary: [
                                '캐시 미스 시 발생하는 과도한 DB 연결 점유를 포착하여 서버 다운타임 리스크를 사전에 차단했습니다.',
                                '트랜잭션 경계를 정교하게 분리하여 꼭 필요한 순간에만 DB 자원을 사용하도록 개선했습니다.',
                                '고부하 상황에서도 커넥션 풀 고갈 없이 안정적으로 서비스를 유지할 수 있는 기반을 마련했습니다.'
                            ],
                            role: 'ownership 조회 경로 분해, self-injection 기반 readOnly + cache 적용, 캐시 조건 정리',
                            stackSummary: 'ProjectOwnershipPersistenceAdapter, Spring Cache, Redis Pending Cache, HikariCP',
                            cause: '1) 캐시 미스 시 권한 검증과 메인 트랜잭션이 겹쳐 커넥션 점유 시간이 길어졌습니다.\n2) false 결과 캐싱으로 일시 오류가 재사용되는 poisoning 위험이 존재했습니다.',
                            problem: '1) @Cacheable 조회 경로에서 캐시 미스 시 DB 커넥션 점유가 길어졌습니다.\n2) AOP 권한 검증과 메인 트랜잭션이 겹치며 커넥션 풀 고갈과 idle in transaction이 발생했습니다.',
                            solution: '1) ProjectOwnershipPersistenceAdapter.isOwner에서 Pending Redis 확인을 트랜잭션 밖으로 이동했습니다.\n2) DB 검증은 checkOwnershipInDb로 분리하고 @Transactional(readOnly=true) + @Cacheable을 적용했습니다.\n3) unless = "#result == false" 조건으로 실패 결과 캐싱을 차단하고, self-injection으로 AOP를 활성화했습니다.',
                            result: '1) idle in transaction 세션과 커넥션 점유 시간이 줄어들었습니다.\n2) 권한 조회 경로의 커넥션 점유 시간이 짧아져 부하 시 세션 안정성이 개선되었습니다.',
                            businessImpact: 'DB 리소스 효율화 및 세션 안정성 확보로 트래픽 급증 시의 서비스 다운타임을 방지했습니다.',
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
                            title: 'Case 4. 신규 기술(Virtual Threads) 도입에 따른 시스템 무결성 최종 검증',
                            subtitle: '2026-03 · 고부하 환경 신뢰성 보장',
                            overview: '가상 스레드와 같은 신규 기술 도입 시 발생할 수 있는 잠재적 장애 요소를 모든 설정 조합 테스트를 통해 완벽히 제거한 케이스입니다.',
                            recruiterSummary: [
                                '부하 테스트 중 에러율 1.06%를 포착, 정밀 튜닝을 통해 어떤 부하 상황에서도 에러 0건을 유지하도록 개선했습니다.',
                                '단순한 수치 개선을 넘어, 발생 가능한 모든 설정 시나리오(Matrix)를 검증하여 시스템 안정성을 100% 입증했습니다.',
                                '최신 기술 도입에 따른 성능 향상과 운영 안정성이라는 두 마리 토끼를 모두 잡았습니다.'
                            ],
                            role: '매트릭스 실험 설계, fail/control 재수집, evidence hub 정리, closure 판정 기준 고정',
                            stackSummary: 'Virtual Threads, Lettuce shareNativeConnection, Docker Compose matrix run, k6, Spring logs',
                            cause: '1) 신기술 도입 초기, 특정 부하 구간에서 가상 스레드와 인프라 설정 간의 불일치로 인한 예외가 발생했습니다.\n2) 단순히 에러가 안 나는 것을 넘어, ' + '왜' + ' 안 나는지에 대한 체계적인 실험적 근거가 필요했습니다.',
                            problem: '1) 고부하 환경에서 간헐적으로 발생하는 에러의 원인이 애플리케이션 로직인지 인프라 설정인지 모호한 상황이었습니다.\n2) 성능 향상 수치에만 의존하여 종료하기에는 운영 리스크가 남아있었습니다.',
                            solution: '1) 가상 스레드 사용 여부와 Redis 연결 방식 등의 변수를 조합한 2x2 실험 매트릭스를 설계했습니다.\n2) 각 조합별 부하 테스트를 수행하고, 로그 시그니처 분석을 통해 최적의 안정화 지점을 도출했습니다.',
                            result: '1) 에러율을 1.06%에서 0%로 완전히 제거하고 처리량을 81% 향상시켰습니다.\n2) 모든 설정 조합에서 시스템 무결성을 확인하여 최신 브랜치를 ' + '완전한 안정 상태' + '로 확정(Closure)했습니다.',
                            businessImpact: '신규 기술 도입 시의 기술적 불확실성을 체계적인 검증 프로세스로 해소하여, 장애 없는 고성능 서비스를 구현했습니다.',
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
                            title: 'Case 6. 배치·인덱스·캐시 통합 최적화로 처리량 대폭 증대',
                            subtitle: '2025-12 · 500VU baseline 성능 개선 증명',
                            overview: '단일 요소 튜닝을 넘어, 저장 경로 원자화·인덱스 최적화·캐시 무효화 시점을 통합 조정하여\n실측 처리량(RPS)과 지연 시간을 동시에 개선한 최종 최적화 케이스입니다.\n\n처리량을 대폭 개선한 시점에서 임계치를 확인하기 위해 1000VU 고부하 실험을 진행, 최종적으로 초기 실험 단계인 500VU 상태(Before)와 현재 최적화 상태(After) 를 비교하여 폭발적 처리량 향상 ➡️ 500VU BEFORE/CURRENT 보기 버튼으로 확인가능',
                            recruiterSummary: [
                                '500VU 고부하 환경에서 읽기 RPS를 972에서 3,680으로 279%↑ 향상시키는 성과를 냈습니다.',
                                '쓰기 처리량 또한 RPS 373에서 916으로 145%↑ 증대시켜 시스템 수용 한계를 확장했습니다.',
                                '인덱스 튜닝과 트랜잭션 경계 정렬을 통해 p95 지연 시간을 최대 15배 단축하고 안정화했습니다.'
                            ],
                            role: 'insertWithPosition 원자화, 부분 인덱스 적용, cache eviction 타이밍 조정, 부하 검증',
                            stackSummary: 'Task Project SubTask repository, Flyway index migration, k6 performance test',
                            cause: '1) 쓰기 경로에서 위치 계산과 INSERT가 분리되어 경쟁 구간이 커졌습니다.\n2) 조회 경로는 인덱스/캐시 경계가 흔들리면 큐 적체와 지연이 함께 증가했습니다.',
                            problem: '1) 위치 계산 SELECT + INSERT 분리와 캐시 경합으로 쓰기 경로에서 병목이 발생했습니다.\n2) 상태 조회 쿼리에서 status partial index 부재 구간이 고부하 지연을 키웠습니다.',
                            solution: '1) 생성 경로에 insertWithPosition 네이티브 쿼리를 적용해 경쟁 구간을 축소했습니다.\n2) Flyway 마이그레이션에 ownership/status partial index를 추가했습니다.\n3) 캐시 무효화 시점을 after-commit으로 통일해 정합성과 성능을 모두 확보했습니다.',
                            result: '1) 500VU baseline 기준 읽기 RPS 279%, 쓰기 RPS 145% 향상을 달성했습니다.\n2) 읽기 p95 141ms, 쓰기 p95 126ms로 지연 시간을 대폭 단축했습니다.',
                            businessImpact: '통합 튜닝을 통해 인프라 증설 없이도 기존 대비 2~3배 이상의 트래픽을 수용할 수 있는 고성능 아키텍처를 완성했습니다.',
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
                                { label: '500VU BEFORE/CURRENT 보기', href: '#k6-overview' },
                                { label: 'PERFORMANCE_EVIDENCE', href: './evidence/upgrade_todo/index.html#case-6-path' }
                            ]
                        },
                        {
                            mermaidId: 'case-integrated-ramp-up-tuning',
                            anchorId: 'upgrade-todo-case-A',
                            title: 'Case A. 대용량 트래픽 램프업(Ramp-up) 부하 테스트 기반 병목 추적 및 통합 성능 최적화',
                            subtitle: '2025-12 ~ 2026-03 (진행 중) · 대규모 부하 성능 검증 및 아키텍처 한계 돌파',
                            businessImpact: '인프라 증설 없이 고부하(1000VU) 환경에서 실패율 0%를 달성하고, 기존 대비 2~3배 이상의 폭발적인 트래픽을 수용할 수 있는 고성능 아키텍처를 완성했습니다.',
                            overview: '가상 스레드 도입 후 1000VU Ramp-up 부하 테스트를 통해 Redis와 RabbitMQ 동기 발행 구간의 스레드 블로킹을 식별하고, 비동기 처리 및 인덱스 튜닝으로 성능 한계를 돌파한 통합 최적화 사례입니다.',
                            recruiterSummary: [
                                '10분간 1000명의 유저가 점진 유입되는(Ramp-up) k6 부하 테스트로 DB가 아닌 Redis 및 RabbitMQ 구간의 API 스레드 블로킹 병목(failed rate 0.93%)을 추적했습니다.',
                                'RabbitMQ 동기 발행을 비동기 데코레이터로 분리하고, 원자적 쿼리(InsertWithPosition)와 인덱스 최적화를 통합 적용했습니다.',
                                'http_req_failed.rate를 0%로 낮추고 p95 응답 지연을 1/4 수준으로 단축했으며, 읽기/쓰기 처리량을 2~3배 이상 확장했습니다.'
                            ],
                            role: '1000VU 부하 테스트 설계 및 병목 추적, RabbitMQ 비동기 데코레이터 구현, DB 인덱스 및 원자적 쿼리 통합 튜닝',
                            stackSummary: 'Virtual Threads, RabbitMQ (Async Publisher), Flyway index migration, k6, Grafana',
                            cause: 'Virtual Threads(가상 스레드) 도입 후 시스템 한계점을 명확히 파악하기 위해 부하 테스트를 진행한 결과, DB가 아닌 Redis 및 RabbitMQ 동기 발행(convertAndSend) 구간과 저장 경로의 원자성 부족이 주요 한계로 드러났습니다.',
                            problem: '1000VU 점진 유입 부하 시, DB 커넥션은 안정적이었으나 오히려 Redis 호출 구간과 요청 스레드가 RabbitMQ 동기 발행 대기를 직접 부담하는 과정에서 API 스레드 블로킹이 발생했습니다. 여기에 저장 경로의 경쟁(원자성 부족)이 겹치면서 응답 지연과 실패(failed rate 0.93%)가 발생하는 쓰기 성능 한계가 발견되었습니다.',
                            solution: '가상 스레드 사용 여부와 인프라 설정 조합의 매트릭스 실험을 진행하고, Grafana 모니터링 지표를 분석하여 안정화 지점을 철저히 검증했습니다.\n\nRabbitMQ 동기 발행을 전용 executor 기반 비동기 데코레이터로 분리하여 API 응답 경로의 블로킹을 근본적으로 해소했습니다.\n\n원자성을 보장하는 insertWithPosition 네이티브 쿼리와 Flyway 인덱스 최적화를 통합 적용해 병목을 제거했습니다.',
                            result: '통합 튜닝의 결과로 http.req failed.rate 0.93% -> 0% 개선 및 p95 응답 지연을 488ms에서 124ms로 단축했습니다. 또한 500VU Baseline 대비 읽기 RPS +279% (972 -> 3,680), 쓰기 RPS +145% (373 -> 916) 대폭 향상을 달성했습니다.',
                            evidenceImages: [
                                {
                                    label: '[성과] 1000VU Ramp-up 부하 테스트 (RPS 2~3배 향상)',
                                    src: './case6/before/case6-k6-write-1000-before.png',
                                    alt: '1000VU Ramp-up baseline k6 graph showing 0.93% failure rate',
                                    pairKey: 'impact-ramp-up'
                                },
                                {
                                    label: 'After: 1000VU (실패율 0%, 안정적인 그래프)',
                                    src: './case6/after/case6-k6-write-1000-after.png',
                                    alt: '1000VU Ramp-up after tuning k6 graph showing 0% failure rate',
                                    pairKey: 'impact-ramp-up'
                                }
                            ],
                            extraEvidenceImages: [
                                {
                                    label: '[병목 추적] 가상 스레드 매트릭스 및 RMQ 블로킹 식별',
                                    src: './case4/after/case4-phase-c-matrix-after-2026-03-14.svg',
                                    phase: 'before',
                                    pairKey: 'investigation-bottleneck'
                                },
                                {
                                    label: '원인: RabbitMQ 동기 발행으로 인한 API 스레드 블로킹',
                                    src: './case5/before/case5-grafana-rabbitmq-message-processing-before.png',
                                    phase: 'after',
                                    pairKey: 'investigation-bottleneck'
                                },
                                {
                                    label: '[DB 최적화 전/후] 원자적 쿼리 및 부분 인덱스 도입',
                                    src: './case6/before/case6-grafana-write-response-time-before.png',
                                    pairKey: 'resolution-db-tuning'
                                },
                                {
                                    label: 'After: 쓰기 지연 시간 바닥에 밀착 및 안정화',
                                    src: './case6/after/case6-grafana-write-response-time-after.png',
                                    pairKey: 'resolution-db-tuning'
                                }
                            ],
                            skills: ['1000VU Ramp-up', 'Matrix Testing', 'Bottleneck Tracing', 'Integrated Optimization'],
                            highlights: [
                                'Ramp-up test identified hidden thread blocking beyond DB capacity',
                                '2x2 Matrix eliminated VT as the primary cause of failures',
                                'Async decorator resolved RabbitMQ channel contention blocking',
                                'Integrated tuning achieved 0% error rate at peak 1000VU load'
                            ],
                            links: [
                                { label: 'EVIDENCE_CASE_A', href: './case-A/CASE-A.md' },
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
            { label: 'ARCHITECTURE_DEEP_DIVE', href: 'https://ramyo564.github.io/L_N_Project/', variant: 'primary' },
            { label: 'PORTFOLIO_HUB', href: 'https://ramyo564.github.io/Portfolio/', variant: 'ghost' },
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
