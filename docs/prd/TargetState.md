# Target State 비즈니스 정의서
> IoT 디바이스(Target)의 프로비저닝 상태 관리 기준

---

## 1. 문서 목적

본 문서는 Rollout Management 웹 애플리케이션에서  
**Target(디바이스)의 상태(Target State)** 를 일관되게 관리하기 위한  
비즈니스 규칙과 상태 전이 기준을 정의한다.

본 문서는 다음을 목적으로 한다.

- Target 상태에 대한 **단일 기준(Source of Truth)** 제공
- 백엔드 상태 머신 구현 기준 제공
- 프론트엔드 UI 상태 표현 및 제어 기준 명확화
- Rollout / Deployment Group 로직과의 관계 정리

---

## 2. Target State의 비즈니스 의미

### 2.1 Target이란

Target은 소프트웨어 업데이트 대상이 되는 **물리적 또는 논리적 디바이스**를 의미한다.

Target은 다음 두 주체에 의해 상태가 변경된다.

- **Update Server**
  - 업데이트 시작
  - Distribution Set 할당
- **Target Controller (Device Agent)**
  - 상태 보고 (Heartbeat)
  - 설치 진행/완료/실패 보고

---

### 2.2 Target State의 역할

Target State는 **현재 시점에서 해당 디바이스의 프로비저닝 상태를 요약 표현**한다.

즉, Target State는:
- “지금 이 디바이스는 안전한가?”
- “Rollout이 정상적으로 진행 중인가?”
- “운영자 개입이 필요한가?”

에 대한 **즉각적인 판단 지표**이다.

---

## 3. Target State 정의

### 3.1 상태 목록

| State | 설명 |
|---|---|
| UNKNOWN | 디바이스로부터 아직 어떤 상태 보고도 수신되지 않은 상태 |
| REGISTERED | 서버에는 등록되었으나 Distribution Set이 할당되지 않은 상태 |
| PENDING | Distribution Set이 할당되었으나 설치 완료가 아직 확인되지 않은 상태 |
| IN_SYNC | 할당된 Distribution Set이 정상적으로 설치 완료된 상태 |
| ERROR | Distribution Set 설치가 실패한 상태 |

---

### 3.2 상태별 비즈니스 의미

#### UNKNOWN
- UI 또는 API로 Target이 생성되었으나
- 디바이스로부터 아직 **첫 상태 보고(Heartbeat)** 를 받지 못한 상태
- **사전 등록(Pre-commissioned) 상태**

👉 운영 관점:
- 실제 디바이스 연결 여부 불확실
- Rollout 대상에 포함 시 주의 필요

---

#### REGISTERED
- 디바이스가 Update Server에 정상 등록됨
- 아직 Distribution Set이 할당되지 않음
- **Plug-and-Play 디바이스의 시작 상태**

👉 운영 관점:
- 정상 접속 가능
- 업데이트 대기 상태

---

#### PENDING
- Distribution Set이 할당됨
- 설치가 시작되었거나, 아직 완료 보고를 받지 못함

👉 운영 관점:
- Rollout 진행 중
- 장시간 지속 시 문제 가능성 있음

---

#### IN_SYNC
- 할당된 Distribution Set이 정상 설치 완료됨
- 서버와 디바이스 상태가 일치

👉 운영 관점:
- 안정 상태
- Rollout 성공 지표

---

#### ERROR
- 설치 실패 보고를 수신함
- 디바이스가 정상 상태가 아님

👉 운영 관점:
- 즉시 확인 필요
- Rollout 실패율 계산에 포함됨
- Emergency Stop 판단 근거

---

## 4. Target State 전이 규칙

### 4.1 상태 전이의 원칙

- Target State는 **명시적 이벤트**에 의해서만 변경된다.
- 임의 변경 또는 직접 수정은 허용하지 않는다.
- 모든 전이는 **서버 이벤트 또는 디바이스 피드백**에 의해 발생한다.

---

### 4.2 주요 상태 전이 흐름

```text
UNKNOWN
  ↓ (first heartbeat)
REGISTERED
  ↓ (Distribution Set assigned)
PENDING
  ↓ (installation success)
IN_SYNC
  ↓ (new Distribution Set assigned)
PENDING
PENDING
  ↓ (installation failure)
ERROR
4.3 상태 전이 트리거
이벤트	상태 변화
Target 생성(UI/API)	→ UNKNOWN
디바이스 최초 접속	UNKNOWN → REGISTERED
Distribution Set 할당	REGISTERED / IN_SYNC → PENDING
설치 성공 보고	PENDING → IN_SYNC
설치 실패 보고	PENDING → ERROR
5. Rollout Management와의 관계
5.1 Rollout 관점에서의 Target State
Rollout은 Target State를 직접 변경하지 않는다.
Rollout은 Action 생성을 통해 상태 변화를 유도한다.
실제 상태 변경은 디바이스 피드백으로 확정된다.
5.2 Rollout 성공/실패 계산 기준
Target State	Rollout 계산
IN_SYNC	성공
ERROR	실패
PENDING	진행 중
UNKNOWN / REGISTERED	미시작 또는 비정상
6. 웹 애플리케이션 UI 설계 기준
6.1 상태 표시 원칙
모든 Target은 반드시 하나의 State를 가진다.
색상, 아이콘, 라벨은 상태에 따라 일관되게 표시한다.
예시:
IN_SYNC → 녹색 / Success
PENDING → 파란색 / In Progress
ERROR → 빨간색 / Failed
UNKNOWN → 회색 / Unknown
6.2 사용자 액션 제한 기준
State	허용 액션
UNKNOWN	상태 확인, 삭제
REGISTERED	Distribution Set 할당
PENDING	강제 중단(옵션)
IN_SYNC	재배포, Rollout 포함
ERROR	재시도, 분석
7. 백엔드 구현 가이드
7.1 상태 머신 권장 구조
Target State는 Enum 기반 상태 머신으로 관리
모든 상태 전이는 검증 로직을 통과해야 함
Target
 ├─ id
 ├─ state
 ├─ lastReportedAt
 ├─ assignedDistributionSet
7.2 설계 원칙 요약
Target State는 “결과 상태”이지 “명령 상태”가 아님
서버는 요청하고, 디바이스가 확정한다
상태 변경은 항상 이벤트 기반으로 기록되어야 함
8. 비즈니스 핵심 요약
Target State는
디바이스 업데이트의 현재 신뢰도를 나타내는
가장 작은 단위의 운영 지표이다.
모든 Rollout, Monitoring, Emergency Control은