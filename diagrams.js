export const diagrams = {
    'architecture': `
            graph LR
            subgraph Client [Client]
                Browser[Web Browser]
            end

            subgraph Edge [Edge Layer]
                CDN[Cloudflare]
                LB[Nginx LB]
            end

            subgraph Spring [Spring Backend]
                API[Task API]
                AUTH[Auth Verify]
                WORKER[Task Worker Listener]
                EVICT[Cache Eviction Listener]
            end

            subgraph AI [FastAPI AI Service]
                FAPI[Analyze and Feedback API]
                ANALYSIS[AnalysisService]
                RECO[RecommendationEngine]
            end

            subgraph Data [Data Layer]
                PGB_API[PgBouncer API]
                PGB_WORKER[PgBouncer Worker]
                PG[(PostgreSQL)]
                REDIS[(Redis)]
                MQ((RabbitMQ todo.exchange))
                QDRANT[(Qdrant)]
                LLM[External LLM API]
            end

            subgraph Obs [Observability]
                OTEL[OpenTelemetry]
                PROM[Prometheus / Loki]
                GRAFANA[Grafana]
            end

            Browser -->|HTTPS| CDN
            CDN --> LB
            LB -->|/api| API
            LB -->|/api/v1/ai| FAPI

            API --> AUTH
            API --> REDIS
            API --> MQ
            API --> PGB_API
            PGB_API --> PG

            MQ -->|task events| WORKER
            WORKER --> PGB_WORKER
            PGB_WORKER --> PG
            WORKER --> EVICT
            EVICT --> REDIS

            FAPI -->|verify access token| AUTH
            FAPI --> ANALYSIS
            ANALYSIS --> REDIS
            ANALYSIS --> RECO
            RECO --> QDRANT
            RECO --> LLM
            FAPI -->|create selected tasks| API

            API -.->|Traces/Metrics| OTEL
            WORKER -.->|Traces/Metrics| OTEL
            FAPI -.->|Traces/Metrics| OTEL
            OTEL -.-> PROM
            PROM -.-> GRAFANA

            classDef default fill:#161b22,stroke:#30363d,color:#c9d1d9
            classDef accent fill:#161b22,stroke:#58a6ff,color:#58a6ff
            classDef obs fill:#161b22,stroke:#238636,color:#c9d1d9
            class Browser,API,FAPI,WORKER accent
            class OTEL,PROM,GRAFANA obs
        `,

    'case-d-ai-orchestration': `
            flowchart LR
            User[User / Browser] --> A0

            subgraph AI [FastAPI AI Service]
                A0[AI Orchestrator]
                A1[Failure analysis]
                A2[Recommendation]
                A3[Feedback / Rerequest]
            end

            subgraph CORE [Spring Core Service]
                T1[Task API]
                T2[Domain / Auth]
            end

            REDIS[(Redis session / latest / quota / history)]
            LLM[LLM API]

            A0 --> REDIS
            A0 --> LLM
            A0 -->|selected plan| T1
            T1 --> T2

            classDef default fill:#161b22,stroke:#30363d,color:#c9d1d9
            classDef accent fill:#161b22,stroke:#58a6ff,color:#58a6ff
            classDef state fill:#161b22,stroke:#f0883e,color:#f0f6fc
            class User,A0,A1,A2,A3,T1 accent
            class REDIS state
        `,

    'upgrade-todo-problem-overview': `
        graph LR
        Resume[Resume Life Navigation Section] --> SelectOne[Select One Bottleneck]
        SelectOne --> Trace[Trace Code Path]
        Trace --> Identity[UUID Persistable Outbox]
        Trace --> Authz[JWT Claims and Access Gate]
        Trace --> CacheFlow[Cache Transaction Boundary]
        Trace --> PendingFlow[Pending Cache Lifecycle]
        Trace --> RabbitFlow[Rabbit Async Publisher]
        Trace --> PerfFlow[Integrated Performance Tuning]
        Identity --> Problem[Problem]
        Authz --> Problem
        CacheFlow --> Problem
        PendingFlow --> Problem
        RabbitFlow --> Problem
        PerfFlow --> Problem
        Problem --> Cause[Root Cause]
        Cause --> Fix[Fix Process]
        Fix --> Result[Result]

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class Resume,SelectOne,Trace,Problem,Cause b
        class Identity,Authz,CacheFlow,PendingFlow,RabbitFlow,PerfFlow,Fix o
        class Result g
    `,

    'upgrade-todo-code-evidence-overview': `
        graph TB
        Root[Life Navigation Code Evidence Map]
        Root --> Identity[IDENTITY AUTH]
        Root --> Cache[CACHE ASYNC GAP]
        Root --> Messaging[MESSAGING PERFORMANCE]

        Identity --> IdentityNote[Persistable Outbox JWT Access Gate]
        Cache --> CacheNote[Ownership Cache Boundary Pending TTL]
        Messaging --> MessagingNote[Async Publisher Atomic Insert Index Tuning]

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class Root,Identity,Cache,Messaging b
        class IdentityNote,CacheNote o
        class MessagingNote g
    `,

    'upgrade-todo-code-evidence-identity': `
        graph TB
        Root[Identity and Auth Evidence]

        Root --> Persistable[Persistable Insert Path]
        Persistable --> AuthEntity[AuthUserEntity isNew]
        Persistable --> UserEntity[UserEntity isNew]

        Root --> Outbox[Outbox Delivery Chain]
        Outbox --> OutboxSave[OutboxAuthAdapter save]
        Outbox --> OutboxPoll[OutboxEventAuthPublisher]
        Outbox --> OutboxProcess[OutboxEventAuthProcessor]

        Root --> Access[JWT and Access Gate]
        Access --> JwtFilter[JwtAuthenticationFilter claims]
        Access --> JwtProvider[JwtProvider token claims]
        Access --> AccessAspect[ProjectAccessAspect check]

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class Root,Persistable,Outbox,Access b
        class AuthEntity,UserEntity,OutboxSave,OutboxPoll,JwtFilter,JwtProvider o
        class OutboxProcess,AccessAspect g
    `,

    'upgrade-todo-code-evidence-cache': `
        graph TB
        Root[Cache and Async Gap Evidence]

        Root --> Ownership[Ownership Boundary]
        Ownership --> OwnershipEntry[ProjectOwnershipPersistenceAdapter isOwner]
        Ownership --> OwnershipDb[checkOwnershipInDb readOnly cacheable]
        Ownership --> OwnershipRepo[isOwnerAndActive repository predicate]

        Root --> Pending[Pending Cache Lifecycle]
        Pending --> CommandSvc[ProjectCommandService savePendingProject]
        Pending --> PendingAdapter[RedisProjectPendingCacheAdapter]
        Pending --> PendingKey[ProjectCacheKeys pending ttl 600]

        Root --> Stability[Connection Stability]
        Stability --> CacheRule[unless result false]
        Stability --> ProxyPath[self injection for AOP proxy]
        Stability --> DocRef[hikaricp connection leak doc]

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class Root,Ownership,Pending,Stability b
        class OwnershipEntry,OwnershipDb,CommandSvc,PendingAdapter,CacheRule,ProxyPath o
        class OwnershipRepo,PendingKey,DocRef g
    `,

    'upgrade-todo-code-evidence-messaging': `
        graph TB
        Root[Messaging and Performance Evidence]

        Root --> AsyncPub[Async Rabbit Publish]
        AsyncPub --> Decorator[AsyncMessagePublishingDecorator]
        AsyncPub --> Executor[AsyncConfig rabbitPublisherExecutor]
        AsyncPub --> ProducerAdapters[Project Task SubTask producer adapters]

        Root --> Throughput[Throughput Path]
        Throughput --> ProjectInsert[Project insertWithPosition]
        Throughput --> TaskInsert[Task insertWithPosition]
        Throughput --> SubTaskInsert[SubTask insertWithPosition]

        Root --> IndexTuning[Index and Queue Tuning]
        IndexTuning --> V2[V2 add indexes and outbox pending index]
        IndexTuning --> V6[V6 ownership partial index]
        IndexTuning --> V7[V7 pending and done status indexes]

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class Root,AsyncPub,Throughput,IndexTuning b
        class Decorator,Executor,ProducerAdapters,ProjectInsert,TaskInsert,SubTaskInsert o
        class V2,V6,V7 g
    `,

    'case-uuid-outbox-decoupling': `
        graph LR
        subgraph BeforeBlock [BEFORE Merge Path and Coupled Transaction]
            direction TB
            B1[Registration Request] --> B2[Auth and User in One Flow]
            B2 --> B3[Assigned UUID Save]
            B3 --> B4[JPA merge path select then insert]
            B4 --> B5[Lock Wait and Coupling Risk]
        end

        subgraph AfterBlock [AFTER Persistable and Outbox Split]
            direction TB
            A1[Registration Event]
            A1 --> A2[AuthUserEntity isNew true]
            A2 --> A3[Direct Auth Insert]
            A3 --> A4[Save AuthCreatedEvent in Outbox]
            A4 --> A5[OutboxEventAuthPublisher pulls pending batch]
            A5 --> A6[OutboxEventAuthProcessor processOne REQUIRES_NEW]
            A6 --> A7[Rabbit Publish]
            A7 --> A8[UserCreationEventHandler creates User]
        end

        BeforeBlock --> AfterBlock

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class B1,B2,B3,B4,B5 o
        class A1,A2,A3,A4,A5,A6 b
        class A7,A8 g
    `,

    'case-auth-nplus1-collapse': `
        graph LR
        subgraph BeforeBlock [BEFORE Repeated Auth and Access Queries]
            direction TB
            B1[API Request] --> B2[Jwt filter loadUserByUsername]
            B2 --> B3[auth_user query each request]
            B3 --> B4[ProjectAccessVerifier]
            B4 --> B5[isOwner query]
            B4 --> B6[isProjectActive query]
            B5 --> B7[Query count grows]
            B6 --> B7
        end

        subgraph AfterBlock [AFTER Claims and Single Gate]
            direction TB
            A1[API Request] --> A2[JwtAuthenticationFilter]
            A2 --> A3[Extract subject and email from claims]
            A3 --> A4[Auth token cache hit path]
            A4 --> A5[Set SecurityContext]
            A5 --> A6[@CheckProjectAccess via Aspect]
            A6 --> A7[ProjectOwnership isOwnerAndActive]
            A7 --> A8[Ownership cache and single predicate]
            A8 --> A9[21 to 3 query target]
        end

        BeforeBlock --> AfterBlock

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class B1,B2,B3,B4,B5,B6,B7 o
        class A1,A2,A3,A4,A5,A6,A7 b
        class A8,A9 g
    `,

    'case-cache-transaction-boundary': `
        graph LR
        subgraph BeforeBlock [BEFORE Idle In Transaction Risk]
            direction TB
            B1[Request] --> B2[AOP access check]
            B2 --> B3[Cache miss path]
            B3 --> B4[DB ownership query]
            B4 --> B5[Redis cache save while connection held]
            B5 --> B6[idle in transaction and pool pressure]
        end

        subgraph AfterBlock [AFTER Redis First and Short readOnly DB Tx]
            direction TB
            A1[Request] --> A2[isOwner entry]
            A2 --> A3[Pending Redis check no transaction]
            A3 --> A4[checkOwnershipInDb]
            A4 --> A5[readOnly transaction]
            A5 --> A6[Cacheable with unless result false]
            A6 --> A7[Fast connection release and stable pool]
        end

        BeforeBlock --> AfterBlock

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class B1,B2,B3,B4,B5,B6 o
        class A1,A2,A3,A4,A5,A6 b
        class A7 g
    `,

    'case-project-pending-cache': `
        graph LR
        subgraph BeforeBlock [BEFORE Async Gap and False Cache Poison]
            direction TB
            B1[Create project request]
            B1 --> B2[202 accepted returned]
            B2 --> B3[consumer has not committed project yet]
            B3 --> B4[immediate task request]
            B4 --> B5[ownership check returns false]
            B5 --> B6[false cached and repeated 403]
        end

        subgraph AfterBlock [AFTER Pending Cache Lifecycle]
            direction TB
            A1[Create project request]
            A1 --> A2[ProjectCommandService savePendingProject]
            A2 --> A3[publish create event]
            A3 --> A4[ownership check reads pending key first]
            A4 --> A5[allow immediate access during async window]
            A5 --> A6[consumer commits project data]
            A6 --> A7[pending ttl window closes naturally]
        end

        BeforeBlock --> AfterBlock

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class B1,B2,B3,B4,B5,B6 o
        class A1,A2,A3,A4,A5,A6 b
        class A7 g
    `,

    'case-rabbit-async-publisher': `
        graph LR
        subgraph BeforeBlock [BEFORE Sync Publish Blocking API Thread]
            direction TB
            B1[HTTP request thread] --> B2[rabbitTemplate convertAndSend]
            B2 --> B3[channel contention wait]
            B3 --> B4[timeout and high p95]
        end

        subgraph AfterBlock [AFTER Async Publisher Isolation]
            direction TB
            A1[HTTP request thread] --> A2[AsyncMessagePublishingDecorator executeAsync]
            A2 --> A3[rabbitPublisherExecutor]
            A3 --> A4[Semaphore limits concurrent publishes]
            A4 --> A5[convertAndSend on worker thread]
            A5 --> A6[API response path stays fast]
            A6 --> A7[timeout 15 percent to 0 and p95 500 to 50]
        end

        BeforeBlock --> AfterBlock

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class B1,B2,B3,B4 o
        class A1,A2,A3,A4,A5 b
        class A6,A7 g
    `,

    'case-integrated-performance-tuning': `
        graph TB
        Start[k6 load bottleneck observed]
        Start --> P1[Persistable insert path and outbox separation]
        P1 --> P2[insertWithPosition atomic create for project task subtask]
        P2 --> P3[Flyway indexes for ownership pending done and outbox]
        P3 --> P4[Cache and transaction order tuning after commit eviction]
        P4 --> P5[Pending cache and async gap protection]
        P5 --> ResultRead[Read RPS 972 to 3680 and p95 975ms to 141ms]
        P5 --> ResultWrite[Write RPS 373 to 916 and p95 1.9s to 126ms]

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class Start,P1,P2,P3,P4,P5 b
        class ResultRead,ResultWrite g
    `,

    'case-integrated-ramp-up-tuning': `
        graph TB
        subgraph Discovery["병목 발견 (1000VU Ramp-up)"]
            Start[Virtual Threads 1000VU k6 Test] --> B1[API Thread Blocking Bottleneck]
            B1 --> B2[Redis & RabbitMQ Sync Publish Delay]
            B1 --> B3[Non-atomic Save Path Contention]
        end

        subgraph Resolution["통합 최적화 (Resolution)"]
            B2 --> A1[Grafana Matrix Testing & Monitoring]
            A1 --> A2[RabbitMQ Async Publisher Decorator]
            
            B3 --> A3[insertWithPosition Native Query]
            A3 --> A4[Flyway Partial Index Migration]
        end

        subgraph Impact["결과 (Impact)"]
            A2 --> R1[Failed Rate 0% & p95 488ms -> 124ms]
            A4 --> R2[Read RPS +279% & Write RPS +145%]
        end

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class Start,A1,A2,A3,A4 b
        class B1,B2,B3 o
        class R1,R2 g
    `,
    'case-b-database-optimization': `
        graph TB
        subgraph Integrated_Before ["BEFORE: Inefficient Resource Management"]
            direction TB
            B1[Client Request] --> B2[Registration Flow]
            B2 --> B3["JPA merge (SELECT + INSERT)"]
            B3 --> B4[Monolithic Transaction holds DB Connection]
            
            B5[Cache Miss Search] --> B6["@Cacheable inside @Transactional"]
            B6 --> B7[Redis I/O + DB Query during same Tx]
            B7 --> B8[HikariCP Exhaustion / Idle in Tx]
        end

        subgraph Integrated_After ["AFTER: Optimized JPA & Connection Lifecycle"]
            direction TB
            A1[Client Request] --> A2[AuthUserEntity Persistable isNew]
            A2 --> A3[Direct INSERT path / Selective Outbox Save]
            A3 --> A4[Domain Tx Release -> Async Outbox Processing]
            
            A5[Cache Miss Search] --> A6["Pending Cache Check (No Tx)"]
            A6 --> A7["checkOwnershipInDb (readOnly Tx)"]
            A7 --> A8[Fast Connection Release / Stable Pool]
        end

        Integrated_Before -.->|Optimization Strategy| Integrated_After

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class B1,B2,B3,B4,B5,B6,B7,B8 o
        class A1,A2,A3,A4,A5,A6,A7 b
        class A8 g
    `,
    'case-c-auth-optimization': `
        graph TB
        subgraph Integrated_Before ["BEFORE: Coupled & Redundant Auth"]
            direction TB
            B1[Client Request] --> B2[JwtFilter: loadUserByUsername]
            B2 --> B3["Query: auth_user (1st)"]
            B3 --> B4[Controller Handler]
            B4 --> B5[ProjectAccessService: isOwner]
            B5 --> B6["Query: project (2nd)"]
            B5 --> B7["Query: project_active (3rd)"]
            
            B8[Social Login] --> B9[Tight Coupling with Vendor API]
        end

        subgraph Integrated_After ["AFTER: Unified Gate & OAuth2 Strategy"]
            direction TB
            A1[Client Request] --> A2["JwtFilter: Extract userId from Claims"]
            A2 --> A3[Bypass auth_user Query]
            A3 --> A4["@CheckProjectAccess (AOP Gate)"]
            A4 --> A5["Single Query: isOwnerAndActive (1st)"]
            
            A6[Social Login] --> A7["OAuth2UserInfo Interface (DIP)"]
            A7 --> A8[Google/Kakao/Naver Strategy]
            A8 --> A9[Decoupled Domain Logic]
        end

        Integrated_Before -.->|Optimization & Abstraction| Integrated_After

        classDef b fill:#161b22,stroke:#58a6ff,color:#c9d1d9
        classDef o fill:#161b22,stroke:#d29922,color:#c9d1d9
        classDef g fill:#161b22,stroke:#238636,color:#c9d1d9
        class B1,B2,B3,B4,B5,B6,B7,B8,B9 o
        class A1,A2,A3,A4,A5,A6,A7,A8 b
        class A9 g
    `
};
