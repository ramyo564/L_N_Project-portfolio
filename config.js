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
            sectionLead: '핵심 성능 개선 및 아키텍처 최적화 사례를 1분 요약과 상세 증거로 구성했습니다.',
            recruiterBrief: {
                kicker: 'QUICK_BRIEF',
                title: '1분 요약으로 먼저 보는 핵심 변화',
                actions: [
                    { label: 'ARCHITECTURE_PAGE', href: 'https://ramyo564.github.io/L_N_Project/', variant: 'primary' },
                    { label: 'GITHUB_REPO', href: 'https://github.com/ramyo564/L_N_Project', variant: 'secondary' }
                ],
                cases: [
                    {
                        id: 'Case A',
                        anchorId: 'upgrade-todo-case-A',
                        title: '램프업(Ramp-up) 부하 테스트 기반 통합 성능 최적화',
                        problem: '가상 스레드 환경에서 1000VU 테스트 시 Redis/RabbitMQ 동기 발행 대기로 인한 응답 실패(0.93%) 및 지연 발생',
                        action: '가상 스레드 매트릭스 검증, 전용 executor 기반 비동기 분리, 인덱스 및 원자적 쿼리 통합 튜닝 적용',
                        impact: '실전 부하 환경에서 실패율 0% 달성 및 주요 지표 대폭 향상'
                    },
                    {
                        id: 'Case B',
                        anchorId: 'upgrade-todo-case-B',
                        title: '트랜잭션 분리와 JPA 튜닝을 통한 커넥션 안정화',
                        problem: 'JPA merge(SELECT+INSERT)와 Redis I/O 결합으로 인한 Idle in transaction 및 커넥션 풀 고갈 위험',
                        action: 'Persistable isNew() INSERT 경로 강제 및 조회 트랜잭션/캐시 경계 분리로 커넥션 점유 시간 최소화',
                        impact: '커넥션 점유 시간 단축으로 고부하 환경 동시 처리 능력 확보'
                    },
                    {
                        id: 'Case C',
                        anchorId: 'upgrade-todo-case-C',
                        title: '인증/권한 게이트 단일화 및 OAuth2 추상화',
                        problem: '인증 N+1 쿼리 병목(3회→1회) 및 소셜 로그인 채널 확장에 따른 도메인 결합도 증가',
                        action: 'JWT Claims 기반 인증 필터 최적화, AOP 선행 검증 도입 및 OAuth2 인터페이스 기반 추상화 설계',
                        impact: '권한 게이트 단축으로 응답성 확보 및 확장성(OCP) 실현'
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
                    title: 'CORE PERFORMANCE & ARCHITECTURE CASES',
                    desc: '대규모 부하 안정성 확보, DB 커넥션 최적화 및 확장 가능한 인증 시스템 설계',
                    cards: [
                        {
                            mermaidId: 'case-integrated-ramp-up-tuning',
                            anchorId: 'upgrade-todo-case-A',
                            title: 'Case A. 대용량 트래픽 램프업(Ramp-up) 부하 테스트 기반 통합 성능 최적화',
                            subtitle: '2025-12 ~ 2026-03 · 대규모 부하 성능 검증 및 아키텍처 한계 돌파',
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
                        },
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
                            result: '읽기/쓰기 양방향에서 트랜잭션이 DB 커넥션을 물고 있는 시간을 대폭 단축하여, 고부하 환경에서도 커넥션 풀(HikariCP) 고갈 없이 안정적인 세션 관리와 동시 처리 능력 확보했습니다.',
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

/**
 * LEGACY TROUBLESHOOTING CASES (Hidden from UI but preserved for reference)
 */
export const legacyCases = [
    {
        id: 'Case 1',
        title: 'UUIDv7 merge 경로 제거와 Outbox 분리로 회원가입 트랜잭션 안정화',
        mermaidId: 'case-uuid-outbox-decoupling',
        anchorId: 'upgrade-todo-case-1',
        subtitle: '2025-09 ~ 2025-10 · Auth User 생성 경로 리팩터링',
        businessImpact: '회원가입 트랜잭션 병목 해소로 서비스 첫 진입 지면의 이탈을 방지하고 전환율을 방어했습니다.',
        overview: '사전 UUID 할당 환경에서 `save -> merge(SELECT+INSERT)`로 이어지던 병목을 Persistable `isNew()`와 Outbox 비동기 분리로 정리한 케이스입니다.',
        skills: ['Persistable', 'Outbox Pattern', 'Transaction Isolation', 'UUIDv7'],
        links: [
            { label: 'EVIDENCE_CASE_1', href: './case1/CASE-1.md' }
        ]
    },
    {
        id: 'Case 3',
        title: '데이터베이스 커넥션 점유 최적화로 동시 처리 능력 향상',
        mermaidId: 'case-cache-transaction-boundary',
        anchorId: 'upgrade-todo-case-3',
        subtitle: '2025-11 ~ 2025-12 · DB 리소스 효율화',
        overview: '부하가 몰릴 때 데이터베이스 연결을 불필요하게 오래 붙잡고 있는 병목을 해결하여 서버의 동시 요청 처리량을 방어한 케이스입니다.',
        skills: ['Cache Boundary', 'HikariCP', 'readOnly Tx', 'AOP Proxy Pattern'],
        links: [
            { label: 'EVIDENCE_CASE_3', href: './case3/CASE-3.md' }
        ]
    },
    {
        id: 'Case 4',
        title: '신규 기술(Virtual Threads) 도입에 따른 시스템 무결성 최종 검증',
        mermaidId: 'case-project-pending-cache',
        anchorId: 'upgrade-todo-case-4',
        subtitle: '2026-03 · 고부하 환경 신뢰성 보장',
        overview: '가상 스레드와 같은 신규 기술 도입 시 발생할 수 있는 잠재적 장애 요소를 모든 설정 조합 테스트를 통해 완벽히 제거한 케이스입니다.',
        skills: ['Config Matrix Testing', 'Root Cause Validation', 'Evidence Hub Curation', 'Closure Gate Design'],
        links: [
            { label: 'EVIDENCE_CASE_4', href: './case4/CASE-4.md' }
        ]
    },
    {
        id: 'Case 5',
        title: 'RabbitMQ 동기 발행 블로킹을 비동기 데코레이터로 분리',
        mermaidId: 'case-rabbit-async-publisher',
        anchorId: 'upgrade-todo-case-5',
        subtitle: '2025-12 · 1000VU write raw summary 기준 안정화',
        overview: 'API 스레드에서 직접 `convertAndSend`를 수행하던 구조를 전용 executor 비동기 발행으로 분리한 케이스입니다.',
        skills: ['RabbitMQ', 'Async Messaging', 'Executor Tuning', 'Latency Reduction'],
        links: [
            { label: 'EVIDENCE_CASE_5', href: './case5/CASE-5.md' }
        ]
    },
    {
        title: 'Legacy Case 6. 배치·인덱스·캐시 통합 최적화로 처리량 대폭 증대',
        mermaidId: 'case-integrated-performance-tuning',
        anchorId: 'upgrade-todo-case-6',
        subtitle: '2025-12 · 500VU baseline 성능 개선 증명',
        overview: '단일 요소 튜닝을 넘어, 저장 경로 원자화·인덱스 최적화·캐시 무효화 시점을 통합 조정하여 실측 처리량을 대폭 향상시킨 최종 최적화 케이스입니다.',
        skills: ['Load Testing', 'Index Tuning', 'Atomic Insert', 'Cache and Tx Order'],
        links: [
            { label: 'EVIDENCE_CASE_6', href: './case6/CASE-6.md' }
        ]
    }
];
