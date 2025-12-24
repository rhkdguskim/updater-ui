# Updater UI - 전체 아키텍처 설계도

## 1. 시스템 개요

**Updater UI**는 Eclipse HawkBit을 위한 **Headless Management UI**입니다.  
HawkBit 서버를 수정하지 않고 Management API(`/rest/v1`)를 통해 직접 통신하는 React SPA입니다.

---

## 2. 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "🌐 Client Layer"
        User["👤 Admin / Operator<br/>(Web Browser)"]
    end

    subgraph "🖥️ Frontend Layer"
        SPA["⚛️ React SPA<br/>Updater UI<br/>(Vite + TypeScript)"]
    end

    subgraph "🔀 Gateway Layer"
        NGINX["🔷 Nginx Gateway<br/>Port: 9100<br/>(Reverse Proxy)"]
    end

    subgraph "⚙️ Backend Layer"
        HawkBit["🦅 Eclipse HawkBit<br/>Update Server<br/>(Spring Boot)"]
    end

    subgraph "💾 Data Layer"
        PostgreSQL[("🐘 PostgreSQL 15<br/>Database")]
        ArtifactStorage["📦 Artifact Storage<br/>(Volume: hawkbit-data)"]
    end

    subgraph "📱 Device Layer"
        IoT1["📱 IoT Device 1"]
        IoT2["📱 IoT Device 2"]
        IoTN["📱 IoT Device N"]
    end

    User -->|HTTPS| SPA
    SPA -->|REST API| NGINX
    NGINX -->|"/rest/v1/*"| HawkBit
    NGINX -->|"Static Files"| SPA
    HawkBit <-->|JPA/JDBC| PostgreSQL
    HawkBit -->|File I/O| ArtifactStorage
    HawkBit <-->|DDI API| IoT1
    HawkBit <-->|DDI API| IoT2
    HawkBit <-->|DDI API| IoTN

    style User fill:#e1f5fe
    style SPA fill:#fff3e0
    style NGINX fill:#f3e5f5
    style HawkBit fill:#e8f5e9
    style PostgreSQL fill:#fce4ec
    style ArtifactStorage fill:#fff8e1
    style IoT1 fill:#e0f2f1
    style IoT2 fill:#e0f2f1
    style IoTN fill:#e0f2f1
```

---

## 3. 기술 스택 구성도

```mermaid
graph LR
    subgraph "Frontend Tech Stack"
        direction TB
        subgraph "Core"
            React["⚛️ React 19"]
            TypeScript["📘 TypeScript 5"]
            Vite["⚡ Vite 7"]
        end
        
        subgraph "UI & Styling"
            AntD["🐜 Ant Design 6"]
            Styled["💅 Styled Components"]
            ReactIcons["🎨 React Icons"]
        end
        
        subgraph "State Management"
            TanStack["🔄 TanStack Query v5<br/>(Server State)"]
            Zustand["🐻 Zustand v5<br/>(Client State)"]
        end
        
        subgraph "API & Utils"
            Axios["📡 Axios<br/>(HTTP Client)"]
            Orval["🔧 Orval<br/>(Code Gen)"]
            DayJS["📅 Day.js"]
            i18next["🌍 i18next"]
        end

        React --> TypeScript
        TypeScript --> Vite
        AntD --> Styled
        TanStack --> Axios
        Orval --> Axios
    end

    subgraph "Backend Tech Stack"
        direction TB
        HawkBit["🦅 HawkBit Server"]
        SpringBoot["🌱 Spring Boot"]
        PostgreSQL[("🐘 PostgreSQL 15")]
        
        HawkBit --> SpringBoot
        SpringBoot --> PostgreSQL
    end

    subgraph "Infrastructure"
        direction TB
        Docker["🐳 Docker"]
        Nginx["🔷 Nginx"]
        
        Docker --> Nginx
    end

    style React fill:#61dafb
    style TypeScript fill:#3178c6
    style Vite fill:#646cff
    style AntD fill:#0170fe
    style TanStack fill:#ff4154
    style Zustand fill:#443e38
    style HawkBit fill:#2ea44f
    style PostgreSQL fill:#336791
```

---

## 4. 통신 플로우 다이어그램

### 4.1 API 통신 플로우

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Browser as 🌐 Browser
    participant React as ⚛️ React SPA
    participant Axios as 📡 Axios Instance
    participant Nginx as 🔷 Nginx Gateway
    participant HawkBit as 🦅 HawkBit Server
    participant DB as 🐘 PostgreSQL

    User->>Browser: 페이지 접근
    Browser->>React: SPA 로드
    
    Note over React,Axios: 인증 헤더 주입
    React->>Axios: API 요청
    Axios->>Axios: Basic Auth Header 추가
    Axios->>Nginx: REST API 호출<br/>/rest/v1/*
    Nginx->>HawkBit: 프록시 전달
    HawkBit->>DB: 데이터 조회/저장
    DB-->>HawkBit: 결과 반환
    HawkBit-->>Nginx: JSON Response
    Nginx-->>Axios: Response
    
    alt 성공 (200)
        Axios-->>React: 데이터 반환
        React->>React: TanStack Query 캐시 업데이트
        React-->>Browser: UI 렌더링
    else 인증 실패 (401)
        Axios->>React: 에러 처리
        React->>Browser: 로그인 페이지 리다이렉트
    else 권한 부족 (403)
        Axios->>React: 에러 처리
        React->>Browser: 접근 불가 메시지 표시
    end
```

### 4.2 Polling 기반 실시간 업데이트

```mermaid
sequenceDiagram
    participant React as ⚛️ React SPA
    participant TQ as 🔄 TanStack Query
    participant HawkBit as 🦅 HawkBit Server

    loop 10초 주기 (Target List)
        TQ->>HawkBit: GET /rest/v1/targets
        HawkBit-->>TQ: Target 목록
        TQ->>React: 캐시 업데이트 & 리렌더링
    end

    loop 3초 주기 (Action 진행 중)
        TQ->>HawkBit: GET /rest/v1/actions/{id}/status
        HawkBit-->>TQ: Action 상태
        TQ->>React: 진행률 업데이트
    end

    Note over React,HawkBit: WebSocket 미지원으로 Polling 전략 사용
```

---

## 5. 데이터 플로우 (RSQL/FIQL)

```mermaid
flowchart LR
    subgraph "📱 UI Layer"
        Filter["🔍 Filter UI<br/>(검색, 필터)"]
        State["📝 Filter State<br/>{name: 'bot', status: 'online'}"]
    end

    subgraph "🔧 Utility Layer"
        FIQL["⚙️ FIQL Builder<br/>fiql.ts"]
    end

    subgraph "📡 API Layer"
        Query["🔗 RSQL Query<br/>q=name=='bot';status=='online'"]
        API["📨 API Request<br/>/rest/v1/targets?q=..."]
    end

    subgraph "🦅 Server Layer"
        HawkBit["HawkBit<br/>Server-side Filtering"]
    end

    Filter --> State
    State --> FIQL
    FIQL --> Query
    Query --> API
    API --> HawkBit

    style Filter fill:#e3f2fd
    style FIQL fill:#fff3e0
    style Query fill:#f1f8e9
```

---

## 6. 인프라 구성도 (Docker Compose)

```mermaid
graph TB
    subgraph "Docker Network: updater-network"
        subgraph "Gateway Container"
            Nginx["🔷 nginx:alpine<br/>updater-gateway<br/>Port: 9100:80"]
        end

        subgraph "Frontend Container"
            UI["⚛️ updater-ui:latest<br/>React SPA"]
        end

        subgraph "Backend Container"
            HawkBit["🦅 hawkbit/hawkbit-update-server<br/>Spring Boot Application<br/>Port: 8080 (internal)"]
        end

        subgraph "Database Container"
            PostgreSQL["🐘 postgres:15-alpine<br/>hawkbit-postgres<br/>Port: 5432 (internal)"]
        end

        Nginx -->|"Static Files"| UI
        Nginx -->|"/rest/v1/*"| HawkBit
        HawkBit -->|"JDBC"| PostgreSQL
    end

    subgraph "Volumes"
        V1["📁 hawkbit-data<br/>/opt/hawkbit/data"]
        V2["📁 postgres-data<br/>/var/lib/postgresql/data"]
    end

    HawkBit -.->|mount| V1
    PostgreSQL -.->|mount| V2

    External["🌐 External Access<br/>:9100"] --> Nginx

    style Nginx fill:#f3e5f5
    style UI fill:#fff3e0
    style HawkBit fill:#e8f5e9
    style PostgreSQL fill:#fce4ec
    style V1 fill:#fff8e1
    style V2 fill:#fff8e1
```

---

## 7. 프로젝트 구조도

```mermaid
graph TB
    subgraph "src/"
        subgraph "api/"
            Generated["📁 generated/<br/>(Orval 자동 생성)"]
            AxiosInstance["📄 axios-instance.ts<br/>(Interceptor & Auth)"]
        end

        subgraph "features/"
            Auth["🔐 auth/"]
            Dashboard["📊 dashboard/"]
            Targets["🎯 targets/"]
            Distributions["📦 distributions/"]
            Rollouts["🚀 rollouts/"]
            Actions["⚡ actions/"]
        end

        subgraph "stores/"
            AuthStore["🔑 useAuthStore"]
            ThemeStore["🎨 useThemeStore"]
            LangStore["🌍 useLanguageStore"]
        end

        subgraph "i18n/"
            Ko["🇰🇷 ko/"]
            En["🇺🇸 en/"]
        end

        Components["🧩 components/"]
        Hooks["🪝 hooks/"]
        Theme["🎨 theme/"]
        Utils["🔧 utils/"]
    end

    style Generated fill:#e8f5e9
    style Auth fill:#e3f2fd
    style Dashboard fill:#fff3e0
    style Targets fill:#fce4ec
```

---

## 8. Rollout 배포 플로우

```mermaid
stateDiagram-v2
    [*] --> CREATED: Rollout 생성
    
    CREATED --> WAITING_FOR_APPROVAL: 승인 기능 활성화
    CREATED --> RUNNING: 승인 기능 비활성화
    
    WAITING_FOR_APPROVAL --> RUNNING: 승인 완료
    WAITING_FOR_APPROVAL --> [*]: 거부
    
    RUNNING --> STOPPED: 수동 중단 / 실패 임계치 초과
    RUNNING --> FINISHED: 모든 그룹 완료
    
    STOPPED --> [*]
    FINISHED --> [*]

    note right of RUNNING
        Cascading 실행:
        Group 1 → Group 2 → ... → Group N
        각 그룹 성공률 기준으로 다음 그룹 진행
    end note
```

---

## 9. 핵심 API 엔드포인트

| 도메인 | API 엔드포인트 | 설명 |
|:---|:---|:---|
| **Target** | `GET /rest/v1/targets` | Target 목록 조회 |
| | `GET /rest/v1/targets/{id}` | Target 상세 조회 |
| | `POST /rest/v1/targets/{id}/assignedDS` | Distribution Set 할당 |
| **Distribution** | `GET /rest/v1/distributionsets` | Distribution Set 목록 |
| | `GET /rest/v1/softwaremodules` | Software Module 목록 |
| **Rollout** | `GET /rest/v1/rollouts` | Rollout 목록 조회 |
| | `GET /rest/v1/rollouts/{id}/deploygroups` | Deploy Group 조회 |
| **Action** | `GET /rest/v1/actions` | Action 목록 조회 |
| | `GET /rest/v1/actions/{id}/status` | Action 상태 조회 |
| **System** | `GET /rest/v1/system/configs` | 시스템 설정 조회 |

---

## 10. 환경별 설정

| 환경 | 설명 | 설정 위치 |
|:---|:---|:---|
| **개발** | Vite Dev Proxy | `vite.config.ts` |
| **프로덕션** | Nginx Reverse Proxy | `docker/nginx-gateway.conf` |
| **인증** | Basic Auth | `src/api/axios-instance.ts` |
| **API 생성** | Orval | `orval.config.ts` |
