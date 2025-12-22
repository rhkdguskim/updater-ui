# 오프라인 배포 가이드 (Offline Deployment Guide)

## 개요

인터넷 연결 없이 HawkBit Updater UI를 설치하는 방법입니다.

## 사전 요구사항

- Docker 및 Docker Compose 설치
- 온라인 머신에서 이미지를 미리 내보내기

---

## 1단계: 온라인 머신에서 이미지 내보내기

### Windows

```cmd
cd updater-ui
scripts\save-images.bat
```

### Linux/macOS

```bash
cd updater-ui
chmod +x scripts/save-images.sh
./scripts/save-images.sh
```

이 명령은 `docker-images/` 폴더에 모든 Docker 이미지를 `.tar` 파일로 내보냅니다.

---

## 2단계: 오프라인 머신으로 파일 복사

다음 파일/폴더를 복사하세요:

```
updater-ui/
├── docker-images/          # 내보낸 이미지 파일들
│   ├── updater-ui_latest.tar
│   ├── hawkbit_hawkbit-update-server_latest.tar
│   ├── postgres_15-alpine.tar
│   └── nginx_alpine.tar
├── docker/
│   ├── nginx.conf
│   └── nginx-gateway.conf
├── docker-compose.yml
└── scripts/
    └── load-images.bat (또는 .sh)
```

---

## 3단계: 오프라인 머신에서 이미지 로드

### Windows

```cmd
cd updater-ui
scripts\load-images.bat
```

### Linux/macOS

```bash
cd updater-ui
chmod +x scripts/load-images.sh
./scripts/load-images.sh
```

---

## 4단계: 서비스 실행

```bash
docker compose up -d
```

---

## 접속 정보

| 서비스 | URL | 설명 |
|--------|-----|------|
| Updater UI | <http://localhost:9100> | 메인 UI |
| HawkBit API | <http://localhost:9100/rest/v1> | Management API |

---

## 문제 해결

### 이미지 로드 실패

```bash
# 개별 이미지 직접 로드
docker load -i docker-images/updater-ui_latest.tar
```

### 컨테이너 상태 확인

```bash
docker compose ps
docker compose logs -f
```

### 재시작

```bash
docker compose down
docker compose up -d
```
