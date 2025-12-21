# FR-09 Job Management Functional Specification

## 1. 개요
Action과 Rollout을 단일 Job 영역에서 운영·추적할 수 있는 통합 UI를 제공한다. Job Tree를 통해 모든 배포 작업을 계층적으로 살펴보고, Action CRUD 및 Rollout 제어를 한 화면에서 수행하여 운영 흐름을 단순화한다.

## 2. Job 모델
| 구분 | 설명 |
| --- | --- |
| Job | Action과 Rollout을 포괄하는 논리적 그룹. 실제 hawkBit API에는 Job 엔티티가 없으므로, 프런트엔드에서 Action/Rollout을 트리 구조로 묶어 표현한다. |
| Action Node | 단일 Target + Distribution Set 할당 상태를 나타내는 노드. |
| Rollout Node | Target 필터 기반 캠페인을 나타내는 노드. Deploy Group을 자식 노드로 노출할 수 있다. |

## 3. 주요 기능
### 3.1 Job Tree Panel
- 좌측 패널에 Job 트리 표시:
  - 루트: “Jobs”.
  - 1차 레벨: Action, Rollout 카테고리.
  - 2차 레벨: 개별 Action 또는 Rollout 항목 (상태 아이콘, Tag, Target/필터 정보).
  - Rollout 하위에 Deploy Group 노드를 선택적으로 노출.
- 기능:
  - 검색/필터: 상태, 이름, Tag, 기간 등으로 노드 필터링.
  - 상태 배지: Pending/Running/Error/Waiting 등 색상 표시.
  - 드릴다운: 노드 클릭 시 우측 상세 패널 변경.

### 3.2 Job Dashboard
- 상단 KPI:
  - Open Actions, Running Rollouts, Waiting-for-Approval Rollouts, Failed Jobs.
- 최근 이벤트 타임라인: Action/ Rollout 상태 변화를 시간순으로 보여준다.
- 지연 Job 경고 리스트: Pending/Paused 상태가 일정 시간 이상 지속된 항목.

### 3.3 Action Management (CRUD)
- **Action 목록**
  - Table 컬럼: ID, Target, Distribution Set, Status, ForceType, Last Update.
  - 필터: Target ID, Status, ForceType, 생성일, Tag.
  - Bulk 선택/작업(캔슬 등) 옵션.
- **Action 생성(UI)**
  - Form:
    - Target 선택 (AutoComplete + 멀티 선택 옵션 필요 여부 확인).
    - Distribution Set 선택.
    - ForceType (soft/forced/download-only).
    - Description/Remark(선택).
  - Validation:
    - Target/Distribution 호환성 체크.
    - 필수 필드 확인.
  - Submit 시 `POST /rest/v1/targets/{targetId}/assignedDS`.
- **Action 상세**
  - Status, ForceType, Rollout 연관 여부, Linked Distribution, Timestamps.
  - Status Timeline (`GET /rest/v1/actions/{actionId}/status`).
  - Control 버튼:
    - Force (Admin): `PUT /rest/v1/targets/{targetId}/actions/{actionId}`.
    - Cancel: `DELETE /rest/v1/targets/{targetId}/actions/{actionId}`.
    - Confirm/Deny (wait_for_confirmation): `PUT /rest/v1/targets/{targetId}/actions/{actionId}/confirmation`.
- **Action 편집**
  - ForceType 변경, Remark 업데이트 등 허용 범위 정의 (Admin만).
- **Action 삭제**
  - Cancel과 동일 API, Confirm Modal 필요.

### 3.4 Rollout Management
- Rollout 목록/상세는 기존 UI를 Job 컨텍스트에서 재사용.
- **Rollout 생성**
  - Target Filter, Distribution Set, Deploy Group 설정 등 wizard 단계를 유지.
  - Job 트리에서 “새 Rollout” 버튼으로 진입.
  - 생성 시 필수 필드(`targetFilterQuery`, success/error threshold) 검증.
- **Rollout 상세**
  - Deploy Group 진행률, Target 분포, 승인 정보.
  - 제어 버튼: Start, Pause, Resume, Approve, Deny, Retry.
  - Action 리스트: 해당 Rollout에서 생성된 Action 미리보기.

### 3.5 Activity Log & Notifications
- Job 전반에 대한 이벤트 로그(생성, 상태 변경, 승인, 실패).
- @mention 또는 Tag 기반 구독 알림 **UI 힌트**만 제공하며, 실제 이메일/웹훅 전송은 범위에서 제외. (토스트, 배지, 인앱 알림까지만 지원)
- Log 필터: 엔터티 종류(Action/Rollout), 상태, 시간.

## 4. UI/UX 요구사항
- 레이아웃:
  - 좌측: Job Tree (Collapsible).
  - 우측: Tab형 상세 패널 (Overview / Details / Timeline / Logs).
- Responsiveness: Mobile에서는 트리 접고 상세만 표시.
- 상태 색상:
  - Green: Completed/Finished, Blue: Running, Amber: Pending/Waiting, Red: Error.
- 액션 버튼:
  - 권한별 표시 (Admin vs Operator).
- Empty/Error 상태:
  - 트리: “No Jobs found” 메시지 + 새 Job 생성 CTA.
  - 상세: 데이터 실패 시 Retry 버튼.

## 5. 데이터 패칭 전략
- Job Tree 데이터: `GET /rest/v1/actions`, `GET /rest/v1/rollouts`를 병렬 요청 후 클라이언트에서 트리 구조 생성.
- Saved Segment(가상 Job) 정의는 로컬 스토리지/클라이언트 상태로만 관리하고, 서버와의 동기화 계획은 없다.
- Polling:
  - Actions: 10초(상태 반영).
  - Rollouts: 15~30초.
- Lazy Loading:
  - Deploy Group 세부정보는 Rollout 노드 확장 시 `GET /rest/v1/rollouts/{id}/deploygroups` 호출.
  - Action 상세는 선택 시 `GET /rest/v1/actions/{id}` + Status Timeline 호출.
- 데이터 캐싱: React Query 사용, 노드별 `queryKey`.
- Error Handling: 트리/상세 독립 에러 처리.

## 6. 구현 현황
- [x] Job Management 메인 페이지 및 레이아웃 구성
- [x] Job Tree 컴포넌트 구현 (Action/Rollout 계층 구조)
- [x] Job Dashboard KPI 및 지연 Job 리스트 구현
- [x] Action 상세 정보 및 상태 관리 기능 (Cancel, Confirmation)
- [x] Rollout 상세 정보 및 제어 기능 (Start, Pause, Resume 등)
- [x] 실시간 상태 업데이트 (Polling 적용)
- [x] 국제화 지원 (English, Korean)

## 7. 권한
| 기능 | Admin | Operator |
| --- | --- | --- |
| Job Tree 조회 | ✅ | ✅ |
| Job Dashboard | ✅ | ✅ |
| Action 조회 | ✅ | ✅ |
| Action 생성 | ✅ | 제한(권한 정책 정의) |
| Action Force/Cancel | ✅ | ❌ (또는 제한적으로 허용) |
| Rollout 생성/제어 | ✅ | ❌ (Operator는 조회/요청만) |
| Rollout 승인/거부 | ✅ | ❌ |
| Activity Log 조회 | ✅ | ✅ |

## 8. API Reference
| 목적 | Method | Endpoint |
| --- | --- | --- |
| List Actions | GET | `/rest/v1/actions` |
| Action Detail | GET | `/rest/v1/actions/{actionId}` |
| Action Status Timeline | GET | `/rest/v1/actions/{actionId}/status` |
| Create Action (Assign DS) | POST | `/rest/v1/targets/{targetId}/assignedDS` |
| Force Action | PUT | `/rest/v1/targets/{targetId}/actions/{actionId}` |
| Cancel Action | DELETE | `/rest/v1/targets/{targetId}/actions/{actionId}` |
| Confirm/Deny Action | PUT | `/rest/v1/targets/{targetId}/actions/{actionId}/confirmation` |
| List Rollouts | GET | `/rest/v1/rollouts` |
| Rollout Detail | GET | `/rest/v1/rollouts/{rolloutId}` |
| Create Rollout | POST | `/rest/v1/rollouts` |
| Start/Pause/Resume Rollout | POST | `/rest/v1/rollouts/{id}/start|pause|resume` |
| Approve/Deny Rollout | POST | `/rest/v1/rollouts/{id}/approve|deny` |
| Deploy Groups | GET | `/rest/v1/rollouts/{id}/deploygroups` |
| System Config(필요 시) | GET | `/rest/v1/system/configs` |

## 8. Acceptance Criteria
1. Job Tree는 Action/Rollout API의 데이터를 기반으로 정확히 렌더링되고, 상태 변경 시 실시간으로 색상/아이콘이 갱신된다.
2. 노드 클릭 시 우측 상세 패널이 해당 Action 혹은 Rollout 정보로 변경되며, 404/403 등 에러 시 명확한 경고를 표시한다.
3. Action 생성 폼은 Target/Distribution 호환성 검증과 필수 필드 검증을 수행하며, 성공 시 트리/리스트에 새 Action이 즉시 반영된다.
4. Action Force/Cancel/Confirm 버튼은 해당 API 호출 후 상태와 타임라인을 즉시 갱신한다.
5. Rollout 생성/제어(Wizard, Start/Pause/Approve 등)는 성공/실패 메시지를 제공하고, Job Tree에 새로운 Rollout 노드가 자동 추가된다.
6. Activity Log 탭은 Action/Rollout 상태 변경 이력을 시간순으로 표시하며, 필터링/검색이 가능하다.
7. Operator 권한 사용자에게는 Action/ Rollout 제어 버튼이 숨겨지거나 비활성화된다.
