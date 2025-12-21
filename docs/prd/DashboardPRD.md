# FR-01 Dashboard Functional Specification

## 1. 개요 (Overview)
운영자가 시스템의 **전체 상태를 한눈에 파악**할 수 있는 대시보드를 제공한다.
빠른 상태 인지를 위해 **핵심 지표(KPI)** 와 **실시간 상태 차트**를 배치한다.

## 2. 주요 기능 (Features)

### 2.1 KPI Cards (핵심 지표)
상단에 배치하여 즉각적인 현황 파악을 돕는다. 각 카드는 **Skeleton Loading**과 **에러 상태**를 독립적으로 관리하며, 클릭 시 해당 영역 상세 화면으로 이동한다.

1. **Total / Online / Offline Targets**
   - 전일 대비 증감(%)을 함께 노출.
   - Offline 비율이 Threshold(기본 5%)를 초과하면 붉은색 강조 및 툴팁.
2. **Recent Deployment Success Rate (24h)**
   - `Finished / (Finished + Error)` × 100.
   - 80% 미만 시 경고 배지.
3. **Target Type Coverage**
   - 각 Target Type별 등록 장비 수 및 최신 Distribution 설치율.
   - 최하위 Type(설치율 낮음)을 자동으로 강조.
4. **Critical Tag Compliance**
   - `prod`, `security` 등 중요한 Tag 조합을 기준으로 최신 Distribution 설치율을 계산.
   - 정책 미준수 장비 수를 표시하고 Drill-down 링크 제공.
5. **Rollout Status Summary**
   - Ready / Running / Waiting for Approval / Error 상태별 카운트.
   - Waiting for Approval > 0이면 빠른 승인 CTA 제공.

### 2.2 Device Status Chart (도넛 차트)
*   Online vs Offline 비율을 시각화.
*   **Library**: `Recharts` (Pie/Donut)
*   **Color**: Online(Green/Primary), Offline(Red/Grey)

### 2.3 Action Funnel & Delay Monitor
*   **Action Funnel**: `Pending → Running → Finished/Error/Waiting` 흐름을 퍼널 차트로 시각화.
*   **지연 Action 리스트**:
  - 특정 임계(예: Pending 10분 이상, Running 30분 이상) 초과 Action을 표 형태로 노출.
  - 각 Row에 Target / Distribution / ForceType / 경과 시간 노출.
  - 상태 클릭 시 `/actions/{id}`로 이동.
*   **Forced vs Soft 비율**: 지난 7일 강제 전환 비율을 미니 도넛으로 표시.

### 2.4 Rollout Pipeline 위젯
*   Deploy Group 진행률 Heatmap (`/rollouts/{id}/deploygroups`).
*   승인 대기 목록: `waiting_for_approval` Rollout 리스트 + 승인 CTA.
*   상태 전환 히스토리(최근 5개 Rollout의 Status 타임라인) 추가.

### 2.5 Distribution Readiness 보드
*   Distribution Set Type별 필수/선택 모듈 충족 여부를 표로 표현.
*   Tag(stable/beta) 필터를 제공하여 “운영 배포 가능” DS만 빠르게 찾을 수 있게 한다.
*   최신 업로드 아티팩트 크기/해시 요약, 미검증 DS 경고 배지.

## 3. 데이터 패칭 전략 (Data Strategy)
* **Polling**:
  - Target/Action KPI: 10초.
  - Rollout/Distribution 지표: 30초 (또는 사용자가 새로고침 버튼으로 즉시 갱신).
  - 지연 Action 리스트: 15초.
* **Batch Fetch**: Target Type/Tag 커버리지는 `GET /targets`에 `groupBy` 옵션이 없으므로, React Query에서 Promise.all로 Target Type·Tag 목록을 받아오고, FIQL 쿼리(예: `targettype.key=={key}`)로 count만 요청(`limit=1`). 결과는 메모이제이션하여 과도한 호출을 방지한다.
* **Derived Metrics**: Action Funnel, Forced 비율, 지연 시간 등은 클라이언트에서 계산하되, 계산에 필요한 raw 데이터(예: status timestamps)는 100건 단위로만 요청하여 성능을 유지한다.
* **Error Handling**: 지표별 독립 에러 카드. 중요 카드(Offline 비율, Rollout Waiting)는 실패 시 재시도 버튼과 상세 로그 버튼 제공.

## 4. UI/UX 요구사항
*   **Layout**: `Ant Design` Grid System (Responsive).
*   **Skeleton**: 데이터 로딩 중 카드별 Skeleton + shimmer animation.
*   **Responsiveness**: Mobile 환경에서는 KPI 카드를 세로로 적체(Stacking).
*   **Drill-down**: 모든 카드/차트 클릭 시 해당 기능 화면으로 이동 (예: Rollout 승인 카드 → `/rollouts` 필터 pre-set).
*   **경고 색상 규칙**:
  - Amber: 지연 임계치에 근접 or Success Rate < 90%.
  - Red: 지연 임계치 초과, Success Rate < 80%, Offline 비율 > 임계치.
*   **Tooltips & Legend**: 퍼널·Heatmap 등 복잡한 차트는 툴팁에 실제 수치/비율 표시, Legend 클릭으로 시리즈 토글 가능.

## 5. API Reference
| Metric | API Endpoint | Query Param / Logic |
| :--- | :--- | :--- |
| **Total Count** | `GET /rest/v1/targets` | `limit=1` & take `total` metadata |
| **Online** | `GET /rest/v1/targets` | `q=pollStatus.overdue==false` & take `total` |
| **Offline** | `GET /rest/v1/targets` | `q=pollStatus.overdue==true` & take `total` |
| **Action Success / Funnel** | `GET /rest/v1/actions` | `q=createdAt>=now-24h` + `status` 분류 |
| **Action Status Timeline** | `GET /rest/v1/actions/{actionId}/status` | SLA 계산용 timestamps |
| **Target Type Coverage** | `GET /rest/v1/targettypes` + `GET /rest/v1/targets?q=targettype.key=={key}` | 각 Type 별 count |
| **Target Tag Coverage** | `GET /rest/v1/targettags` + `GET /rest/v1/targets?q=tags.id=={id}` | Tag 별 count |
| **Distribution Set Readiness** | `GET /rest/v1/distributionsets`, `GET /rest/v1/distributionsettypes`, `GET /rest/v1/distributionsettags` | Type/Tag 조합, mandatory module 여부 |
| **Rollout Status & Groups** | `GET /rest/v1/rollouts`, `GET /rest/v1/rollouts/{id}/deploygroups` | 상태별 count, group progress |

## 6. 권한 (Authorization)
*   **Admin/Operator**: 모두 조회 가능 (Read-only).

## 7. Acceptance Criteria
1. KPI 카드 각 항목이 지정된 API의 `total` 값과 일치하고, 오류 발생 시 카드 단위로 에러 상태 및 재시도 버튼을 노출한다.
2. Action 퍼널은 24시간 이내 Action 상태 분포를 정확히 반영하며, 퍼널 단계 클릭 시 `/actions` 화면으로 이동해 해당 상태 필터를 적용한다.
3. 지연 Action 리스트는 정의된 지연 임계 조건을 적용하여 정렬되고, 각 행의 “View” 버튼을 통해 Action 상세 페이지로 이동할 수 있다.
4. Rollout 승인 카드에 항목이 존재할 경우 “Approve” CTA가 노출되고, 클릭 시 `/rollouts`에서 `waiting_for_approval` 필터가 적용된다.
5. Distribution Readiness 보드에서 필수 모듈이 누락된 DS는 빨간색 경고 배지와 함께 표시된다.
