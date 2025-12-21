# DDI Device Simulator

Eclipse hawkBit DDI (Direct Device Integration) API 기반 디바이스 시뮬레이터 CLI

## 설치

```bash
cd tools/ddi-simulator
npm install
```

## 명령어

| 명령어 | 설명 |
|--------|------|
| `simulate` | TargetToken으로 시뮬레이션 시작 |
| `register` | Device 등록 후 자동 시뮬레이션 시작 |
| `multi` | 여러 디바이스 동시 시뮬레이션 |
| `poll` | 단일 폴링 수행 |
| `send-config` | 디바이스 속성 전송 |

## 사용 예시

### 1. 기존 Device로 시뮬레이션 (TargetToken 필요)
```bash
npx tsx src/cli/index.ts simulate \
  --url http://localhost:8081 \
  --controller-id Device \
  --target-token 96e701a2aac12af8117172294741a05f \
  --verbose
```

### 2. Device 등록 + 자동 시뮬레이션 (권장)
```bash
npx tsx src/cli/index.ts register \
  --url http://localhost:8081 \
  --mgmt-url http://localhost:5173 \
  --controller-id my-device-001 \
  --username admin --password admin \
  --verbose
```

### 3. 멀티 클라이언트 (부하 테스트)
```bash
# 100개 디바이스 동시 시뮬레이션
npx tsx src/cli/index.ts multi \
  --url http://localhost:8081 \
  --mgmt-url http://localhost:5173 \
  --prefix sim-device \
  --count 100 \
  --username admin --password admin
```

> **Note**: `--mgmt-url`은 Vite 프록시(`localhost:5173`)를 사용해야 CORS 문제가 없습니다.
> 디바이스가 이미 존재하면 자동으로 재사용합니다.

## 사전 요구사항

hawkBit 서버에서 **Target Token 인증** 활성화 필요:
```properties
hawkbit.server.ddi.security.authentication.targettoken.enabled=true
```

## 빌드

```bash
npm run build
```
