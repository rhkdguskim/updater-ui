# UI Architecture & Component Design Guidelines
## Ant Design 기반 React 엔터프라이즈 프론트엔드

---

## 0. Scope

본 문서는 Ant Design(AntD)을 UI 프레임워크로 사용하는  
React 엔터프라이즈 애플리케이션의 **UI 아키텍처, 컴포넌트 설계, 레이아웃 규칙**을 정의한다.

본 문서는 다음 범위를 포함한다.

- UI 일관성을 위한 구조적 제약
- 컴포넌트 책임 분리 기준
- 레이아웃 및 spacing 통제 방식
- height / width / size 표준
- 페이지 구성 규칙
- 코드 리뷰 및 품질 게이트 기준

---

## 1. Design Philosophy

### 1.1 UI 일관성은 구현자의 선택이 아니다

- UI 품질은 개인의 감각이 아니라 **시스템 설계의 결과물**이다.
- 스타일 결정은 분산되지 않고 **중앙화**되어야 한다.
- 페이지 개발자는 UI를 “설계”하지 않고 **조립**만 수행한다.

---

### 1.2 Ant Design은 Base Layer이다

- Ant Design의 기본 컴포넌트, spacing, typography, interaction을 신뢰한다.
- AntD 위에 별도의 스타일 시스템을 중첩하지 않는다.
- 커스터마이징은 Theme Token 및 Wrapper 컴포넌트 레벨에서만 허용한다.

---

## 2. UI Layer Responsibility Model

UI는 다음 계층으로 분리한다.

Page
└── Pattern Components
└── UI Components (AntD Wrapper)
└── Ant Design Base Components

### 2.1 Page
- 비즈니스 맥락을 조합
- 스타일 정의 금지
- 레이아웃 제어 금지

### 2.2 Pattern Components
- 엔터프라이즈 UI 일관성의 핵심 레이어
- spacing / alignment / layout 규칙을 캡슐화
- 페이지는 반드시 Pattern을 통해서만 UI를 구성한다

### 2.3 UI Components
- Ant Design 컴포넌트의 제한된 API Wrapper
- size / variant / behavior만 노출
- 스타일 결정권 없음

---

## 3. Styling Governance Rules

### 3.1 허용

- Ant Design Theme Token
- Ant Design Layout / Grid / Space
- 사내 공통 UI / Pattern 컴포넌트

### 3.2 금지

- inline style을 통한 margin / padding / size 조절
- raw px 값 직접 사용
- AntD 내부 DOM 구조 override
- Page 레벨에서 CSS 작성
- 컴포넌트 간 개별 margin 부여

---

## 4. Design Token Policy

### 4.1 Spacing Scale

모든 간격은 아래 scale만 사용한다.

| Token | Value |
|------|------|
| xs   | 8px  |
| sm   | 12px |
| md   | 16px |
| lg   | 24px |
| xl   | 32px |

규칙:
- spacing은 **의미 단위(token)** 로만 표현한다.
- 임의 값(px) 사용 금지.
- spacing은 레이아웃 컴포넌트에서만 적용한다.

---

### 4.2 Size System

Ant Design의 size system을 그대로 사용한다.

| Size   | Height |
|--------|--------|
| small  | 24px   |
| middle | 32px   |
| large  | 40px   |

규칙:
- 같은 Row에 배치된 컴포넌트는 동일 size 사용
- 기본 size는 `middle`
- size 혼합은 명시적 디자인 요구가 있을 경우에만 허용

---

## 5. Layout Rules

### 5.1 Margin Ownership Rule

- 개별 컴포넌트는 margin을 소유하지 않는다.
- spacing은 오직 레이아웃 컴포넌트의 책임이다.

❌ 금지
```tsx
<Button style={{ marginRight: 12 }} />
⭕ 허용
<Space size="middle">
  <Button />
  <Button />
</Space>
5.2 Approved Layout Components
목적	컴포넌트
수직 배치	Space (vertical)
수평 배치	Space
그리드	Row / Col
페이지 래핑	Layout / Content
6. Mandatory Pattern Components
페이지에서는 Ant Design 컴포넌트를 직접 조합하지 않는다.
아래 Pattern 컴포넌트 사용은 의무 사항이다.
6.1 PageLayout
역할:
페이지 최대 폭
좌우 padding
상/하 기본 여백
<PageLayout>
  {children}
</PageLayout>
6.2 PageHeader
역할:
페이지 타이틀
설명 영역
액션 버튼 정렬
<PageHeader
  title="User Management"
  actions={<Button type="primary">Create</Button>}
/>
규칙:
헤더 레이아웃은 PageHeader 외부에서 수정 금지
6.3 FilterBar
역할:
검색 / 필터 / 정렬 UI 집합
동일 height / alignment 보장
<FilterBar>
  <Input.Search size="middle" />
  <Select size="middle" />
</FilterBar>
6.4 FormSection
역할:
폼 섹션 구조화
섹션 간 spacing 통제
label / field alignment 표준화
<FormSection title="Basic Information">
  <Form.Item />
</FormSection>
6.5 DataView
역할:
데이터 상태 관리 추상화
loading / empty / error / success 표준화
<DataView
  loading={loading}
  data={data}
  render={() => <Table />}
/>
7. Table & Form Constraints
7.1 Table
row height는 AntD 기본값 사용
column width는 필요 최소한으로만 지정
cell padding override 금지
7.2 Form
Form.Item spacing은 기본값 유지
label width 변경은 FormSection 레벨에서만 허용
8. Responsive Strategy
Ant Design Grid breakpoint만 사용
media query 직접 작성 금지
반응형 처리는 Pattern Component 레벨에서 수행
9. Code Review Quality Gate
다음 항목 중 하나라도 위반 시 리뷰 반려한다.
raw px 값 사용
inline style 사용
margin 직접 사용
size 혼합
Pattern 컴포넌트 미사용
Page 레벨 스타일 정의
10. Enforcement
본 문서는 권장 사항이 아닌 강제 규칙이다.
기능이 정상 동작하더라도
본 규칙을 위반한 코드는 병합하지 않는다.

UI 일관성은 기술 부채가 아닌 아키텍처 책임이다.