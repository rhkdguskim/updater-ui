# FR-05 System Configuration Management PRD

## 1. 개요

시스템 테넌트 설정을 **조회 및 수정**하는 기능을 제공한다.
수많은 설정 키(Key)들을 **논리적 그룹으로 분류**하여 운영자가 직관적으로 설정을 관리할 수 있도록 한다.

---

## 2. UI Route

| Route | 기능 |
|-------|------|
| `/system/config` | System Configuration 조회 및 편집 |

---

## 3. API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/rest/v1/system/configs` | 시스템 설정 조회 |
| PUT | `/rest/v1/system/configs` | 시스템 설정 일괄 수정 |
| PUT | `/rest/v1/system/configs/{key}` | 개별 설정 수정 |

---

## 4. 권한

| Role | 권한 |
|------|------|
| Admin | 조회 및 **수정** ✅ |
| Operator | 접근 불가 ❌ |

---

## 5. UI 구성 (Logical Groups)

설정 키들을 단순 리스트가 아닌, 아래와 같은 논리적 그룹(Card 또는 Section)으로 나누어 표시한다.

### 5.1 Polling & Connection
*   `pollingTime`: 디바이스 폴링 주기
*   `pollingOverdueTime`: 오프라인(Overdue) 판정 기준 시간

### 5.2 Authentication & Security
*   `authentication.targettoken.enabled`: Target Token 인증 사용 여부
*   `authentication.gatewaytoken.enabled`: Gateway Token 인증 사용 여부
*   `authentication.certificate.enabled`: 인증서 기반 인증 사용 여부

### 5.3 Rollout Policy
*   `rollout.approval.enabled`: Rollout 승인 프로세스 강제 여부
*   `rollout.autostart.enabled`: 자동 시작 여부

### 5.4 Repository Maintenance
*   `repository.actions.autoclose.enabled`: 완료된 Action 자동 정리
*   `repository.actions.retention.days`: 이력 보관 기간

---

## 6. 구현 체크리스트

### Phase 1 (View)
- [x] Configuration 페이지 구현
- [x] Admin 권한 체크

### Phase 2 (Edit & Grouping)
- [ ] **Grouping UI 구현:** 설정 키들을 카테고리별로 그룹화하여 카드 형태로 표시
- [ ] **Edit Mode:** 각 설정 값을 수정할 수 있는 Input/Switch 컴포넌트 적용
- [ ] **Validation:** 숫자/Boolean 등 타입에 맞는 입력 검증
- [ ] **Save Action:** 변경된 설정 저장 (`PUT` API 연동)

---

## 7. Acceptance Criteria

- [ ] 단순 리스트가 아닌 **그룹화된 UI**로 표시되어야 한다.
- [ ] Admin은 설정을 변경하고 저장할 수 있어야 한다.
- [ ] 저장 성공 시 토스트 메시지를 표시하고, 실패 시 원인을 안내해야 한다.
- [ ] 잘못된 타입의 값(예: 숫자에 문자 입력)은 입력 단계에서 차단해야 한다.
