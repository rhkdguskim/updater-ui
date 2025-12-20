# FR-08 Rollout Management PRD

## 1. 개요

Rollout을 통한 대규모 배포의 **생성, 제어, 모니터링** 기능을 제공한다.
운영자는 Wizard를 통해 안전하게 배포 캠페인을 생성하고, 진행 상황에 따라 일시정지하거나 강제 시작할 수 있다.

---

## 2. UI Routes

| Route | 기능 |
|-------|------|
| `/rollouts` | Rollout 목록 |
| `/rollouts/create` | **Rollout 생성 마법사 (Wizard)** |
| `/rollouts/:id` | Rollout 상세 (Groups 포함) |

---

## 3. API 엔드포인트

### 3.1 조회
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/rest/v1/rollouts` | Rollout 목록 |
| GET | `/rest/v1/rollouts/{rolloutId}` | Rollout 상세 |
| GET | `/rest/v1/rollouts/{rolloutId}/deploygroups` | Deploy Groups |
| GET | `/rest/v1/rollouts/{rolloutId}/deploygroups/{groupId}` | Group 상세 |
| GET | `/rest/v1/rollouts/{rolloutId}/deploygroups/{groupId}/targets` | Group Targets |

### 3.2 제어 (Admin)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/rest/v1/rollouts/{rolloutId}/start` | 시작 |
| POST | `/rest/v1/rollouts/{rolloutId}/pause` | 일시정지 |
| POST | `/rest/v1/rollouts/{rolloutId}/resume` | 재개 |
| POST | `/rest/v1/rollouts/{rolloutId}/retry` | 재시도 |
| POST | `/rest/v1/rollouts/{rolloutId}/approve` | 승인 |
| POST | `/rest/v1/rollouts/{rolloutId}/deny` | 거부 |
| DELETE | `/rest/v1/rollouts/{rolloutId}` | 삭제 |

### 3.3 생성 (Admin)
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/rest/v1/rollouts` | Rollout 생성 |

---

## 4. 상세 기능 요구사항

### FR-08-1 Rollout Creation Wizard

**UI Flow:**
1.  **Step 1: 기본 정보 (Basic Info)**
    *   Name (필수)
    *   Description (옵션)
2.  **Step 2: 배포 세트 선택 (Distribution Set)**
    *   Distribution Set 목록 조회 및 선택
    *   선택된 DS 정보 요약 표시
3.  **Step 3: 타겟 필터 (Target Filter)**
    *   전체 타겟 또는 필터 조건(FIQL) 입력
    *   예상 대상 수(Total Targets) 미리보기
4.  **Step 4: 그룹 및 트리거 (Groups & Triggers)**
    *   그룹 수 설정 (예: 3개 그룹)
    *   각 그룹별 비중(%) 또는 수량 설정
    *   **Trigger Condition** 설정:
        *   Success Threshold (%)
        *   Error Threshold (%)
5.  **Step 5: 검토 및 생성 (Review & Create)**
    *   설정 요약 확인
    *   '생성 후 자동 시작' 옵션

### FR-08-2 Rollout Control

*   **Start**: `ready` 상태인 Rollout 시작
*   **Pause**: `running` 상태인 Rollout 일시정지 (긴급 중단)
*   **Resume**: `paused` 상태인 Rollout 재개
*   **Retry**: `error` 상태인 Rollout 재시도
*   **Delete**: Rollout 삭제 (Soft Delete 지원 여부 확인 필요)

---

## 5. Rollout 상태

| Status | 설명 |
|--------|------|
| `creating` | 생성 중 |
| `ready` | 준비 완료 (시작 가능) |
| `starting` | 시작 중 |
| `running` | 실행 중 |
| `paused` | 일시정지 |
| `finished` | 완료 |
| `error` | 오류 |
| `waiting_for_approval` | 승인 대기 |

---

## 6. 권한

| Role | 권한 |
|------|------|
| Admin | 조회 + 생성 + 제어 (Start/Pause/Resume/Retry/Delete) |
| Operator | 조회만 가능 |

---

## 7. 구현 체크리스트

### Phase 1 (MVP)
- [x] Rollout List 페이지
- [x] Rollout Detail 페이지
- [x] Deploy Groups 표시
- [x] 진행률 표시

### Phase 2 (Control - Basic)
- [x] Start Rollout
- [x] Pause / Resume
- [x] Approve / Deny

### Phase 3 (Creation & Advanced Control)
- [ ] Rollout Creation Wizard 구현
- [ ] Distribution Set Selector 구현
- [ ] Target Filter Preview 구현
- [ ] Rollout Control Action (Retry, Delete) 추가 구현

---

## 8. Acceptance Criteria

- [x] Rollout List Server Paging
- [x] 상태별 색상 구분
- [x] Group 진행률 Progress Bar
- [x] Admin만 제어 버튼 표시
- [ ] Wizard의 각 단계에서 유효성 검사가 수행되어야 한다.
- [ ] 그룹의 총합은 타겟 전체 수와 일치해야 한다 (자동 계산).
- [ ] Rollout 생성 후 상세 페이지로 이동해야 한다.

