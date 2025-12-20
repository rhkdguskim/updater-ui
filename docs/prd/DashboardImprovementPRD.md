# FR-01 Dashboard Improvement PRD (Operational Intelligence)

## 1. 개요 (Overview)

기존의 정적인 대시보드를 **"운영 인텔리전스(Operational Intelligence) 보드"**로 업그레이드한다.
단순한 현황 조회(Monitoring)를 넘어, **위기 감지(Risk Detection), 추세 분석(Trend Analysis), 의사결정 지원(Decision Support)**이 가능한 시각화 도구를 제공하는 것을 목표로 한다.

---

## 2. 목표 (Goals)

1.  **시인성 강화 (Visibility):** 추세(Trend)와 상태(Status)를 색상과 아이콘으로 직관적으로 전달한다.
2.  **위기 감지 (Risk Detection):** 실패 급증, 장기 미접속 등 이상 징후를 즉시 파악할 수 있게 한다.
3.  **데이터 해석 (Interpretation):** 단순 숫자가 아닌, 버전 분포나 롤아웃 진행 속도 같은 "의미 있는 정보"를 제공한다.

---

## 3. 상세 기능 요구사항 (Functional Requirements)

### FR-01-1 Smart KPI Cards (추세 지표)

기존 단순 카운트 카드를 **Trend Indicator**가 포함된 스마트 카드로 교체한다.

*   **UI 구성:**
    *   **Main Value:** 현재 값 (예: 1,250)
    *   **Trend Badge:** 전일 대비 증감률 (예: `▲ 5.2%`, `▼ 1.2%`)
    *   **Sparkline (Optional):** 최근 24시간 추이 미니 그래프
    *   **Status Color:**
        *   정상: Default / Green
        *   주의: Yellow / Orange (성공률 90% 미만 등)
        *   위험: Red (성공률 80% 미만, 오프라인 급증 등)

*   **대상 지표:**
    1.  **Total Targets:** 전일 대비 등록 기기 증감
    2.  **Online Rate:** 온라인 기기 비율 및 전일 대비 변화
    3.  **Success Rate:** 최근 24시간 배포 성공률 및 변화
    4.  **Error Rate:** 최근 24시간 발생 에러 수

### FR-01-2 Failure Analysis Widget (실패 분석)

최근 발생한 에러를 분석하여 집중적인 문제가 있는지 시각화한다.

*   **Visualization:** **Stacked Bar Chart** 또는 **Heatmap**
*   **Dimensions:**
    *   X축: 시간 (최근 24시간, 1시간 단위)
    *   Y축: 에러 건수
    *   Stack: Error Code 또는 Action Status
*   **Insight Text:** "최근 1시간 동안 'Timeout' 에러가 급증했습니다." (조건부 노출)

### FR-01-3 Version Fragmentation Map (버전 분포)

전체 기기들의 펌웨어/SW 버전 파편화 현황을 보여준다.

*   **Visualization:** **Treemap** (트리맵)
*   **Logic:**
    *   영역 크기: 해당 버전을 설치한 기기 수
    *   색상: 버전의 최신성 (최신=Green, 구형=Gray/Yellow)
*   **Interaction:** 영역 클릭 시 해당 버전을 가진 Target List로 필터링 이동 (`/targets?q=installed.name==v1.0`)

### FR-01-4 Active Rollout Monitor (실시간 롤아웃)

현재 진행 중인(Running) 롤아웃 중 가장 중요한 1~2개를 카드 형태로 요약 표시한다.

*   **UI 구성:**
    *   **Title:** Rollout Name
    *   **Progress Bar:** 전체 진행률 (Target 수 기준)
    *   **Step Indicator:** 현재 진행 중인 Group 단계 (예: Group 2/4 Running)
    *   **Stats:** Success / Error / Pending 카운트 (미니 바 차트)

---

## 4. UI/UX 가이드라인

### 4.1 Color Palette (Semantic)
*   **Success:** `#52c41a` (Green)
*   **Warning:** `#faad14` (Yellow/Orange)
*   **Error:** `#ff4d4f` (Red)
*   **Info/Action:** `#1890ff` (Blue)
*   **Offline/Inactive:** `#bfbfbf` (Gray)

### 4.2 Accessibility
*   색상만으로 상태를 구분하지 않고, **아이콘(Icon)과 텍스트(Label)**를 병행 표기한다.
*   차트에는 툴팁(Tooltip)을 제공하여 정확한 수치를 확인할 수 있게 한다.

---

## 5. 구현 계획 (Implementation Plan)

### Phase 1: KPI & Layout 구조 개편
1.  **`Dashboard.tsx` 리팩토링:** Grid 레이아웃 재조정 (AntD `Row`/`Col` 활용).
2.  **`KPICard` 컴포넌트 개발:** Trend, Icon, Color 처리가 가능한 재사용 컴포넌트 생성.
3.  **데이터 가공 로직 추가:** 전일 대비 증감률 계산 로직 (Mock 데이터 또는 과거 데이터 비교 로직) 구현.

### Phase 2: 고급 차트 도입 (Recharts 활용)
1.  **`FailureChart` 개발:** 시간대별 에러 추이 스택 바 차트 구현.
2.  **`VersionTreemap` 개발:** `useGetTargets` 데이터 집계(`lodash` 활용) 후 Treemap 렌더링.
3.  **반응형 처리:** 모바일/태블릿 화면에서의 차트 리사이징 대응.

### Phase 3: Rollout 연동
1.  **`ActiveRolloutCard` 개발:** `useGetRollouts({ q: 'status==running' })` 훅을 사용하여 데이터 바인딩.
2.  **Progress Visualizer:** 롤아웃 그룹별 진행 상황을 보여주는 미니 인디케이터 구현.

---

## 6. Acceptance Criteria

- [ ] KPI 카드에 전일 대비 증감(Trend)이 표시되어야 한다. (데이터 없을 시 '-' 표시)
- [ ] 버전 분포 차트(Treemap)에서 버전을 클릭하면 해당 필터가 적용된 Target List로 이동해야 한다.
- [ ] 실행 중인 롤아웃이 있을 경우, 대시보드 상단 또는 주요 위치에 진행 상황이 표시되어야 한다.
- [ ] 모든 차트는 데이터 로딩 중 Skeleton 처리가 되어야 하며, 에러 시 재시도 버튼을 제공해야 한다.
