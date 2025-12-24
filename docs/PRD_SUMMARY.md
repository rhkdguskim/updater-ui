# Updater UI - PRD 통합 요약서

> 모든 PRD 문서의 핵심 내용을 정리한 통합 문서입니다.

---

## 📁 PRD 문서 목록

| 문서 | 설명 | 상태 |
|-----|------|:----:|
| [DashboardImprovementPRD](./prd/DashboardImprovementPRD.md) | 운영 대시보드, KPI, 실시간 모니터링 | ✅ |
| [TargetManagementPRD](./prd/TargetManagementPRD.md) | 타겟 CRUD, 배포 할당, Type/Tag 관리 | ✅ |
| [DistributionManagementPRD](./prd/DistributionManagementPRD.md) | SW 모듈, 배포 세트, 아티팩트 | ✅ |
| [ActionManagementPRD](./prd/ActionManagementPRD.md) | 액션 추적, 제어, 상태 이력 | ✅ |
| [RolloutManagementPRD](./prd/RolloutManagementPRD.md) | 대규모 배포 생성, 제어, 모니터링 | 🔄 |
| [JobManagementPRD](./prd/JobManagementPRD.md) | Action/Rollout 통합 관리 뷰 | ✅ |
| [SystemConfigurationPRD](./prd/SystemConfigurationPRD.md) | 시스템 설정 조회/수정 | 🔄 |
| [AdminAuthPRD](./prd/AdminAuthPRD.md) | 인증, 권한 관리 | ✅ |
| [SoftwareModuleUXPRD](./prd/SoftwareModuleUXPRD.md) | SW 모듈 UX 개선 | ⏳ |
| [TargetTagsFiltersPRD](./prd/TargetTagsFiltersPRD.md) | Tag/Filter 기능 | ✅ |
| [TargetState](./prd/TargetState.md) | Target 상태 정의 (비즈니스) | 📖 |

---

## 🎯 프로젝트 목표

hawkBit 서버를 **수정하지 않고(Headless)** Management API만으로 동작하는 **운영 친화적 Web UI** 제공

---

## 👥 사용자 역할

| Role | 계정 | 권한 |
|------|------|------|
| **Admin** | `mirero / mirero-0203` | 전체 제어 (Forced Assign, Config, Rollout 제어) |
| **Operator** | `admin / admin` | 조회 + Soft Assign |

---

## 🏗️ 기능 요약

### 1. Dashboard

- **KPI Cards**: Availability, Success Rate, Pending Actions, Critical Errors
- **Charts**: Failure Analysis, Active Rollout Monitor, Version Fragmentation
- **Live Ticker**: 실시간 이벤트 로그
- **Polling**: 10~30초 주기

### 2. Target Management

| 기능 | Admin | Operator |
|-----|:-----:|:--------:|
| 조회 | ✅ | ✅ |
| 생성/수정/삭제 | ✅ | ❌ |
| Soft Assign | ✅ | ✅ |
| Forced Assign | ✅ | ❌ |
| Type/Tag 관리 | ✅ | ❌ |

**주요 개념**:

- **Target Type**: 디바이스 종류 (1:1, 필수)
- **Target Tag**: 라벨/속성 (N:M, 선택)

### 3. Distribution Management

- **Software Module**: 개별 패키지 (OS, App, Firmware)
- **Distribution Set**: 배포 단위 (Module 집합)
- **Artifact Upload**: Drag & Drop, Progress 표시
- **Advanced Builder**: DS + Module 일괄 생성

### 4. Action Management

| 상태 | 설명 |
|-----|------|
| `pending` | 대기 중 |
| `running` | 실행 중 |
| `finished` | 완료 |
| `error` | 오류 |
| `wait_for_confirmation` | 승인 대기 |

**제어 (Admin Only)**: Cancel, Force, Confirm/Deny

### 5. Rollout Management

| 상태 | 다음 액션 |
|-----|----------|
| `ready` | Start |
| `running` | Pause |
| `paused` | Resume |
| `waiting_for_approval` | Approve/Deny |
| `error` | Retry |

**Creation Wizard**: 5단계 (기본정보 → DS 선택 → Target Filter → Groups → Review)

### 6. Job Management

Action과 Rollout을 **트리 구조**로 통합 관리

- Job Tree Panel (좌측)
- Job Dashboard (KPI + 지연 경고)
- Activity Log

### 7. System Configuration (Admin Only)

| 그룹 | 설정 예시 |
|-----|----------|
| Polling | `pollingTime`, `pollingOverdueTime` |
| Security | `targettoken.enabled`, `gatewaytoken.enabled` |
| Rollout | `approval.enabled`, `autostart.enabled` |

---

## 🔗 API 엔드포인트 요약

| 도메인 | 주요 API |
|-------|---------|
| Target | `/rest/v1/targets`, `/targettypes`, `/targettags` |
| Distribution | `/rest/v1/distributionsets`, `/softwaremodules` |
| Action | `/rest/v1/actions`, `/targets/{id}/actions/{aid}` |
| Rollout | `/rest/v1/rollouts`, `/rollouts/{id}/deploygroups` |
| System | `/rest/v1/system/configs` |
| Auth | `/rest/v1/userinfo` |

---

## 🔒 공통 정의

### 검색 쿼리

- **FIQL** 기반 (`q` 파라미터)
- 예: `name==*device*;status==online`

### Online/Offline 판정

- Online: `pollStatus.overdue == false`
- Offline: `pollStatus.overdue == true`

### 에러 정책

| 코드 | 처리 |
|-----|------|
| 401 | 로그인 화면 이동 |
| 403 | 버튼 숨김 + 안내 |
| 409 | 새로고침 후 재시도 |
| 429 | Backoff 후 재시도 |

---

## 📚 관련 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 시스템 아키텍처 다이어그램
- [TECH.md](./TECH.md) - 기술 스택 상세
- [RollOutConcept.md](./RollOutConcept.md) - Rollout 비즈니스 정의
- [api-spec/API.md](./api-spec/API.md) - API 클라이언트 가이드
