/**
 * Portfolio Cases Data Source
 * 수정과 편집이 매우 편리하도록 핵심 결론, 메트릭, 이미지 경로만 직관적으로 정의한 데이터 모듈입니다.
 */
export const portfolioCases = [
    {
        number: '01',
        category: 'CONCURRENCY & MESSAGING',
        period: '2025.12 – 2026.03',
        shortTitle: 'RabbitMQ 비동기 분리',
        highlightMetric: '0.00% Error (p95 -75%)',
        title: 'RabbitMQ 비동기 분리 및 1,000VU 램프업 통합 성능 최적화',
        summary: '가상 스레드 환경에서 요청 스레드의 동기 발행 블로킹을 전용 executor 비동기 데코레이터로 분리하고, 원자적 INSERT 및 인덱스를 튜닝했습니다. 피크 1,000VU 램프업 환경에서 실패율 0.93%를 0.00% 무손실로 완결하고 p95 지연을 488ms에서 124ms로 75% 단축했습니다.',
        metrics: [
            { label: 'FAILED RATE', value: '0.93% → 0.00%', highlight: true },
            { label: 'WRITE p95', value: '488ms → 124ms (-75%)' },
            { label: 'WRITE RPS', value: '373 → 916 (+145%)' }
        ],
        evidence: [
            {
                tag: 'BEFORE',
                title: '요청 스레드 RabbitMQ 동기 발행 블로킹 (실패율 0.93%)',
                src: './case5/before/case5-k6-write-1000-before.png',
                alt: 'k6 write 1000 before test'
            },
            {
                tag: 'AFTER',
                title: '비동기 데코레이터 분리 후 무손실 완결 (0.00% Error)',
                src: './case6/after/case6-k6-write-1000-after.png',
                alt: 'k6 write 1000 after test'
            }
        ],
        detailLink: './case-detail.html?case=1',
        detailLinkLabel: 'Case 01 상세 분석 리포트 읽기 ↗'
    },
    {
        number: '02',
        category: 'DATABASE & PERSISTENCE',
        period: '2025.09 – 2025.12',
        shortTitle: 'JPA & DB 커넥션 안정화',
        highlightMetric: 'Idle in Tx 제거 (단일 INSERT)',
        title: '트랜잭션 경계 분리와 JPA 튜닝을 통한 DB 커넥션 안정화',
        summary: '사전 할당된 UUIDv7 엔티티의 JPA merge(SELECT+INSERT) 병목을 Persistable.isNew()로 제거하고, 조회 트랜잭션과 Redis I/O를 분리하여 고부하 환경에서 DB 커넥션 풀(HikariCP) 고갈과 Idle in transaction 장애를 원천 차단했습니다.',
        metrics: [
            { label: 'DB CONNECTION HOLD', value: 'Idle in Tx 제거', highlight: true },
            { label: 'JPA QUERY PATH', value: 'SELECT+INSERT → 단일 INSERT' },
            { label: 'SESSION STABILITY', value: 'HikariCP 고갈 0건' }
        ],
        evidence: [
            {
                tag: 'BEFORE',
                title: 'merge 경로에서 불필요한 SELECT+INSERT 중복 발생',
                src: './case1/before/case1-hibernate-before.png',
                alt: 'Hibernate SQL Before'
            },
            {
                tag: 'AFTER',
                title: 'Persistable.isNew() 적용 후 순수 단일 INSERT 경로 확립',
                src: './case1/after/case1-hibernate-after.png',
                alt: 'Hibernate SQL After'
            }
        ],
        detailLink: './case-detail.html?case=2',
        detailLinkLabel: 'Case 02 상세 분석 리포트 읽기 ↗'
    },
    {
        number: '03',
        category: 'SECURITY & DOMAIN DECOUPLING',
        period: '2025.09 – 2025.11',
        shortTitle: '단일 권한 게이트 & DIP',
        highlightMetric: 'Auth Query 3→1회 (-67%)',
        title: '단일 권한 게이트 구축 및 소셜 로그인 인터페이스 추상화',
        summary: '반복되던 AuthUser DB 조회와 Project 권한 검증 쿼리를 JWT Claims 기반 인증과 AOP 선행 검증 단일 게이트로 통합하여 쿼리 횟수를 3회에서 1회로 축소했습니다. 또한 OAuth2 공급자를 DIP 원칙으로 추상화하여 도메인 결합도를 낮췄습니다.',
        metrics: [
            { label: 'AUTH QUERY', value: '3회 → 1회 (-67%)', highlight: true },
            { label: 'ARCHITECTURE', value: 'AOP Unified Gate' },
            { label: 'EXTENSIBILITY', value: 'OAuth2 DIP Strategy' }
        ],
        evidence: [
            {
                tag: 'BEFORE',
                title: '요청마다 도메인과 결합된 중복 인증 쿼리 구조 (3x DB Call)',
                src: './case-C/before_arch.png',
                alt: 'Coupled & Redundant Auth Architecture'
            },
            {
                tag: 'AFTER',
                title: 'JWT Claims + AOP 단일 게이트 및 OAuth2 추상화 통합 구조',
                src: './case-C/after_arch.png',
                alt: 'Unified Gate & OAuth2 Strategy Architecture'
            }
        ],
        detailLink: './case-detail.html?case=3',
        detailLinkLabel: 'Case 03 상세 분석 리포트 읽기 ↗'
    },
    {
        number: '04',
        category: 'AI ORCHESTRATION & ISOLATION',
        period: '2026.01 – 2026.03',
        shortTitle: 'FastAPI AI 파이프라인 격리',
        highlightMetric: 'LLM 지연 전파 0% 격리',
        title: 'FastAPI AI 파이프라인 구축 및 서비스 장애 전파 격리',
        summary: '실패한 TODO 분석·추천·피드백 AI 흐름이 메인 코어 트랜잭션에 미치는 지연을 차단하기 위해 FastAPI AI 서비스와 Spring 코어를 분리했습니다. Redis 상태 저장소를 도입하여 브라우저 종료 후에도 세션 복구가 가능한 비동기 Handoff를 완성했습니다.',
        metrics: [
            { label: 'FAULT ISOLATION', value: 'LLM 지연 전파 0%', highlight: true },
            { label: 'SESSION CONTROL', value: 'Redis Stateful Pointer' },
            { label: 'ARCHITECTURE', value: 'FastAPI + Spring Loose Coupling' }
        ],
        evidence: [
            {
                tag: 'BEFORE',
                title: '단일 요청 흐름에 묶여 LLM 지연이 전파되는 결합 구조',
                src: './case-D/before/case-d-architecture-before.svg',
                alt: 'Coupled AI Architecture'
            },
            {
                tag: 'AFTER',
                title: 'FastAPI AI 격리 및 Redis 상태 기반 비동기 Handoff 구조',
                src: './case-D/after/case-d-architecture-after.svg',
                alt: 'Separated AI Boundary Architecture'
            }
        ],
        detailLink: './case-detail.html?case=4',
        detailLinkLabel: 'Case 04 상세 분석 리포트 읽기 ↗'
    }
];
