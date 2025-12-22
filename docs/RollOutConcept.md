# Rollout Management 비즈니스 정의서
> 대규모 IoT 소프트웨어 업데이트를 위한 웹 기반 Rollout 관리 시스템

---

## 1. 문서 목적

본 문서는 대규모 IoT 환경에서 소프트웨어 업데이트를 **안전하고 통제 가능하게 수행**하기 위한  
Rollout Management 웹 애플리케이션의 **비즈니스 요구사항과 핵심 개념**을 정의한다.

본 정의서는 다음을 목표로 한다.

- 웹 애플리케이션 개발 시 **공통 비즈니스 기준 제공**
- 기획 / 개발 / QA / 운영 간 **용어 및 책임 정렬**
- 도메인 모델, 상태 전이, 핵심 정책을 **코드로 옮길 수 있는 수준**으로 명확화

---

## 2. 비즈니스 배경 (Business Background)

### 2.1 문제 정의

대규모 IoT 환경에서는 다음과 같은 문제가 반복적으로 발생한다.

- 수십만~수백만 디바이스 대상 동시 업데이트
- 업데이트 실패 시 장애가 빠르게 확산
- 배포 중단 또는 롤백이 어려움
- 진행 상황 및 실패 원인 파악이 어려움

단순 OTA(Over-The-Air) 업데이트 방식은 이러한 문제를 해결할 수 없다.

---

### 2.2 해결 방향

Rollout Management는 소프트웨어 업데이트를 단순 배포가 아닌  
**통제된 변경 관리(Change Management)** 프로세스로 다룬다.

핵심 개념은 다음과 같다.

- 점진적 배포 (Gradual Rollout)
- 실시간 상태 모니터링
- 실패 확산 방지(Emergency Control)
- 명시적 승인 및 책임 구조

---

## 3. 핵심 비즈니스 개념 정의

### 3.1 Rollout

Rollout은 특정 소프트웨어(Distribution Set)를  
정의된 대상(Target)에 단계적으로 배포하는 **최상위 비즈니스 단위**이다.

#### 주요 책임
- 배포 대상 정의
- 배포 정책(성공/실패 기준) 정의
- 배포 그룹 실행 제어
- 전체 배포 상태 관리

---

### 3.2 Target

Target은 소프트웨어 업데이트 대상이 되는 디바이스를 의미한다.

- Rollout 생성 시 직접 선택하지 않고 **Filter 조건**으로 선택한다.
- Rollout 시작 시점에 대상 목록이 확정된다.

---

### 3.3 Distribution Set

Distribution Set은 디바이스에 설치될 소프트웨어 묶음이다.

- 펌웨어, 애플리케이션, 설정 파일 등의 집합
- Rollout 단위로 하나 이상이 할당될 수 있음 (Multi-Assignment 활성 시)

---

### 3.4 Deployment Group

Deployment Group은 Rollout에 포함된 Target을  
자동으로 분할한 **실행 단위 그룹**이다.

- Rollout 생성 시 지정한 그룹 수에 따라 자동 생성
- 순차(Cascading) 실행됨
- 각 그룹의 결과가 다음 그룹 실행 여부에 영향을 줌

---

## 4. Rollout 생명주기 (Lifecycle)

### 4.1 Rollout 상태 정의

| 상태 | 설명 |
|---|---|
| CREATED | Rollout이 생성됨 |
| WAITING_FOR_APPROVAL | 승인 대기 상태 (옵션) |
| RUNNING | 배포 진행 중 |
| STOPPED | 수동 또는 비상 중단 |
| FINISHED | 모든 그룹이 정상 종료 |

---

### 4.2 상태 전이 규칙

- 승인 기능이 활성화된 경우:
  - CREATED → WAITING_FOR_APPROVAL → RUNNING
- 승인 기능이 비활성화된 경우:
  - CREATED → RUNNING
- 실패 임계치 초과 시:
  - RUNNING → STOPPED
- 모든 그룹 정상 완료 시:
  - RUNNING → FINISHED

---

## 5. Cascading Deployment 정책

### 5.1 개요

Rollout은 Deployment Group 단위로 **순차 실행(Cascading)** 된다.

각 그룹은 이전 그룹의 실행 결과에 따라 실행 여부가 결정된다.

---

### 5.2 성공 조건 (Success Threshold)

- 현재 그룹에서 **성공한 Target 비율**
- 지정된 성공 비율 이상일 경우 다음 그룹 실행

예:
- 성공 기준: 95%
- 대상 100대 중 95대 이상 성공 시 통과

---

### 5.3 실패 조건 (Error Threshold)

- 실패 수 또는 실패 비율 기준
- 기준 초과 시 **전체 Rollout 즉시 중단**

예:
- 실패 허용 비율: 5%
- 실패 6대 발생 시 Emergency Stop

---

### 5.4 Emergency Shutdown

Emergency Shutdown 발생 시:

- 현재 및 이후 모든 Deployment Group 실행 중단
- Rollout 상태는 STOPPED로 변경
- 운영자에게 즉시 알림 제공

---

## 6. Approval Workflow (선택 기능)

### 6.1 개요

Rollout 승인 기능은 **운영 리스크를 줄이기 위한 옵션 기능**이다.

- 설정으로 활성화/비활성화 가능
- 활성화 시 Rollout은 반드시 승인 후 실행 가능

---

### 6.2 승인 프로세스

1. Rollout 생성 또는 수정
2. 승인 대기 상태로 전환
3. 권한 있는 사용자 검토
4. 승인 시 실행 가능 상태로 전환

---

## 7. Monitoring & Reporting

### 7.1 Rollout 모니터링

웹 애플리케이션은 다음 정보를 제공해야 한다.

- Rollout 전체 진행률
- Deployment Group별 상태
- 성공 / 실패 / 진행 중 Target 수
- 현재 실행 중인 그룹

---

### 7.2 Reporting 목적

- 배포 안정성 평가
- 장애 원인 분석
- 향후 Rollout 정책 개선

---

## 8. Multi-Assignments (Beta)

### 8.1 개념

Multi-Assignment 기능은 하나의 Target에  
여러 Distribution Set을 **동시에 할당**할 수 있도록 한다.

---

### 8.2 Action Weight

- 각 배포 Action에는 0~1000 사이의 Weight가 존재
- 높은 Weight일수록 우선순위가 높음
- 디바이스는 가장 높은 Weight의 Action을 우선 수행

---

### 8.3 주의사항

- 본 기능은 베타 상태
- 활성화 후 비활성화 불가
- 통계 및 상태 정보는 마지막 설치 기준으로 표시됨

---

## 9. 웹 애플리케이션 설계 관점 요약

### 9.1 핵심 화면 도메인

- Rollout 목록 / 상세
- Rollout 생성 / 수정
- Approval 대기 목록
- Deployment Group 진행 화면
- Emergency Stop 제어 UI

---

### 9.2 설계 원칙

- Rollout은 시스템의 최상위 관리 단위
- 모든 실행 로직은 상태(State) 기반으로 제어
- 실패는 즉시 격리하고 확산을 차단해야 함
- UI는 항상 **현재 상태 기준으로만 행동 가능**

---

## 10. 비즈니스 핵심 요약

> Rollout Management는  
> 대규모 IoT 소프트웨어 업데이트를  
> **자동화된 배포가 아닌, 통제 가능한 비즈니스 프로세스**로 관리하기 위한 시스템이다.

