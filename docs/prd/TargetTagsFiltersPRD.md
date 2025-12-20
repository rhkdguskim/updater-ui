# FR-06 Target Tags & FR-07 Saved Filters PRD

## 1. 개요

Target에 관련된 Tag와 저장된 Filter를 조회하고 활용하는 기능.

---

## 2. FR-06 Target Tags (Read-only)

### 기능
- Tag 목록 조회
- Target Detail에 Tags 표시
- TargetList에서 Tag 기반 필터

### API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/rest/v1/targettags` | Tag 목록 |
| GET | `/rest/v1/targets/{id}/tags` | Target의 Tags |

---

## 3. FR-07 Saved Target Filters (Read-only)

### 기능
- 저장된 FIQL Filter 목록 조회
- TargetList에서 Filter 선택 시 적용

### API
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/rest/v1/targetfilters` | Filter 목록 |

---

## 4. 구현 체크리스트

### FR-06 Target Tags
- [x] Tag 목록 조회
- [x] TargetList Tag 필터 추가
- [ ] TargetDetail Tags 표시 (기존 구현됨)

### FR-07 Saved Filters
- [x] Filter 목록 조회
- [x] TargetList Filter 선택기 추가

---

## 5. Acceptance Criteria

- [x] Tag/Filter Read-only 조회
- [x] 선택된 필터로 Target 검색
- [ ] Target Detail에 Tags 표시 (기존 구현됨)
