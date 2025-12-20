# 기능 명세 (Functional Specifications)

## 1. Dashboard
- 전체 Target 수
- Online / Offline 상태
- 최근 배포 성공률
- 배포 상태 차트

## 2. Target Management
### List
- RSQL 검색
- 페이징 / 정렬
- 상태 아이콘

### Detail
- Attributes
- Installed Modules
- Action History

### Action
- 등록 / 수정 / 삭제
- Distribution Set 할당

## 3. Distribution & Artifacts
- Software Module 관리
- Distribution Set 버전 관리
- Artifact Drag & Drop 업로드

## 4. Deployment (Assignment)
- Direct Assign
- Action ID 기반 상태 추적
- **상태 전이**: `Pending` → `Running` → `Finished` / `Error`

# 3. 비기능 요구사항 (Non-Functional Requirements)

| 항목 | 요구사항 |
| :--- | :--- |
| **성능** | Server Paging 필수 |
| **보안** | 최소 권한 원칙 |
| **신뢰성** | 409 / 429 재시도 UX |
| **확장성** | Target 수만 단위 대응 |
| **운영** | 환경변수 기반 설정 |
