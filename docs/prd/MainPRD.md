## 1. 목표

운영자가 **대규모 Target 및 배포(Rollout)** 를
기존 hawkBit 기본 UI 없이도 **직관적·안정적으로 운영**할 수 있는
**Custom Web UI**를 제공한다.

본 UI는 hawkBit 서버를 **수정하지 않고(headless)**
Management API를 통해서만 동작한다.

---

## 2. 사용자 (Personas & Authentication)

### 인증 방식 (OpenAPI 기반)

* hawkBit은 **사용자 관리 API를 제공하지 않음**
* 인증은 **HTTP Basic Authentication** 기반
* 로그인 검증 방식:

  * `Authorization: Basic base64(id:password)`
  * `GET /rest/v1/userinfo`

    * 200 → 로그인 성공
    * 401 → 로그인 실패

### 초기 계정 정책 (UI 내부 정책)

| UI Role  | Credential             | 설명    |
| -------- | ---------------------- | ----- |
| Admin    | `mirero / mirero-0203` | 전체 권한 |
| Operator | `admin / admin`        | 제한 권한 |

> ⚠️ 서버 권한과 UI Role은 **1:1 매핑되지 않으며**,
> UI는 내부 정책으로 Role을 관리한다.

---

### Admin

* Repository 관리 (Software Module / Distribution Set)
* System Configuration 조회
* Forced Assignment 수행
* Action 강제 전환 / 취소 / 승인

### Operator

* Target 조회 및 상태 모니터링
* 배포(Assignment) 수행
* Action 진행 상태 및 오류 확인

---

## 3. MVP 범위

### 포함 (In Scope)

* Dashboard
* Target Management
* Distribution / Artifact 관리
* Direct Assignment
* Action 상태 추적
* **System Configuration (Management)**
* **Rollout 생성 및 제어 (Creation & Control)**
* Tag / Filter 조회 기능

### 제외 (Out of Scope, Phase 2+)

* Device(DDI) 직접 제어 UI
* Auto-Assignment Rule 편집 UI
* Maintenance Window / Confirmation Flow 전체 편집
* 사용자/권한 서버 관리 UI

---

## 4. 공통 정의 (Definitions)

### D-01 검색(Query) 언어

* 모든 목록 검색은 **FIQL** 기반 (`q` 파라미터)
* RSQL 용어 사용 ❌

---

### D-02 Online / Offline 판정

* Online: `pollStatus.overdue == false`
* Offline: `pollStatus.overdue == true`

---

### D-03 최근 배포 성공률

* 기간: 최근 24시간
* 성공: `status == finished`
* 실패: `status == error`
* 데이터 소스: `/rest/v1/actions`

---

### D-04 공통 에러 정책

* 401 → 로그인 화면
* 403 → 버튼 숨김 + 안내
* 409 → 새로고침 후 재시도
* 429 → 1초 이상 Backoff 후 재시도

---

## 5. 기능 요구사항 (Functional Requirements)

---

## FR-01 Dashboard

### 기능

* 전체 Target 수
* Online / Offline 집계
* 최근 배포 성공률
* Action 상태 차트

### 데이터 소스

* `/rest/v1/targets`
* `/rest/v1/actions`

### Acceptance Criteria

* [x] 카드/차트 독립 로딩
* [x] 실패 시 Skeleton UI
* [x] 10초 Polling + Backoff
* [x] 권한 없는 사용자 접근 불가

---

## FR-02 Target Management

### FR-02-1 Target List

* FIQL 검색
* Paging / Sorting
* 상태 아이콘

**UI Route**: `/targets`

**API**

* `GET /rest/v1/targets`

**AC**

* [x] Server Paging 필수
* [x] 필터 변경 시 offset 초기화
* [x] 403 시 버튼 숨김

---

### FR-02-2 Target Detail

* Attributes
* Metadata (Read-only)
* Installed Distribution Sets
* Action History

**UI Route**: `/targets/:id`

**API**

* `GET /rest/v1/targets/{targetId}`
* `GET /rest/v1/targets/{targetId}/attributes`
* `GET /rest/v1/targets/{targetId}/installedDS`
* `GET /rest/v1/targets/{targetId}/assignedDS`
* `GET /rest/v1/targets/{targetId}/actions`
* `GET /rest/v1/targets/{targetId}/metadata`
* `GET /rest/v1/targets/{targetId}/tags`

**AC**

* [x] 탭 Lazy Load
* [x] Action 클릭 시 상세 이동
* [x] 404 안전 복귀

---

### FR-02-3 Target CRUD / Assign

* Create / Update / Delete
* Distribution Set Assign

**UI Routes**: `/targets/new`, `/targets/:id/edit`

**API**

* `POST /rest/v1/targets`
* `PUT /rest/v1/targets/{targetId}`
* `DELETE /rest/v1/targets/{targetId}`
* `POST /rest/v1/targets/{targetId}/assignedDS`

**AC**

* [x] 삭제 Confirm
* [x] 409 재시도 UX
* [x] Assign 권한 체크

---

## FR-03 Distribution & Artifacts

### FR-03-1 Software Module

* CRUD
* Type 조회(Read-only)

**API**

* `/softwaremodules`

---

### FR-03-2 Distribution Set

* CRUD
* Assigned SM 관리
* Type / Tag 조회(Read-only)

**API**

* `/distributionsets`
* `/assignedSM`

---

### FR-03-3 Artifact Upload

* Drag & Drop
* Progress / Retry

**API**

* `/softwaremodules/{id}/artifacts`

---

## FR-04 Deployment & Action Control

### 기능

* Direct Assign
* Action 상태 추적
* Action Control (Admin)

  * Soft → Forced
  * Cancel
  * Confirm / Deny

### 상태

* Pending → Running → Finished / Error

### API

* `/assignedDS`
* `/actions`
* `/actions/{id}`
* `/actions/{id}/status`

---

## FR-05 System Configuration Management

### 목적

* 시스템 정책 확인 및 수정

### API

* `GET /rest/v1/system/configs`
* `PUT /rest/v1/system/configs`

### AC

* [ ] Edit Capability
* [x] Admin 전용
* [x] 실패 시 에러 표시

---

## FR-06 Target Tags (Read-only)

* Tag 목록 조회
* Target Detail 표시
* Tag 기반 필터

---

## FR-07 Saved Target Filters (Read-only)

* 저장된 FIQL Filter 목록
* Target List 적용

---

## FR-08 Rollout Monitoring (Read-only)

* Rollout 목록
* Rollout 상세
* Deploy Group 진행률

**API**

* `/rest/v1/rollouts`
* `/deploygroups`

---

## 6. 비기능 요구사항

| 항목  | 요구사항          |
| --- | ------------- |
| 성능  | Server Paging |
| 보안  | 최소 권한         |
| 신뢰성 | 409 / 429 대응  |
| 확장성 | Target 수만 단위  |
| 운영  | 환경변수 설정       |

---