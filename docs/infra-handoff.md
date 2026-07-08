# AntiADHD 인프라 협업 전달 문서

이 문서는 AntiADHD 프로젝트의 현재 애플리케이션 구조, Docker 구성, Kubernetes 배포 준비 상태를 인프라 작업자 또는 인프라 담당 GPT에게 전달하기 위한 문서입니다.

## 프로젝트 위치

```text
D:\AntiADHD
```

## 현재 프로젝트 구조

```text
AntiADHD/
  backend/
    Dockerfile
    .dockerignore
    pom.xml
    src/
      main/
        java/com/antiadhd/
          ai/
          auth/
          category/
          common/
          config/
          focus/
          goal/
          review/
          routine/
          schedule/
          tag/
          user/
        resources/
          application.yml
      test/

  mobile-app/
    src/
      features/
        ai/
        auth/
        categories/
        focus/
        goals/
        productivity/
        reviews/
        routines/
        schedules/
        settings/
        tags/
      navigation/
      shared/
      types/

  frontend/
    이전 웹 프론트 잔여 폴더

  k8s/
    base/
    local/
    prod/

  docker-compose.yml
  .env.example
  .gitignore
  README.md
```

## 애플리케이션 구조

### Frontend

현재 프론트엔드는 React Native + Expo 기반 모바일 앱입니다.

```text
mobile-app/
  src/
    features/
    navigation/
    shared/
    types/
```

주요 기술:

- React Native
- Expo
- TypeScript
- React Navigation
- Axios

### Backend

백엔드는 Spring Boot + PostgreSQL 기반 REST API입니다.

```text
backend/src/main/java/com/antiadhd/
  ai/
  auth/
  category/
  common/
  config/
  focus/
  goal/
  review/
  routine/
  schedule/
  tag/
  user/
```

주요 기술:

- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data JPA
- PostgreSQL
- Spring Boot Actuator

주요 특징:

- REST API 기반
- JWT 인증
- 사용자별 데이터 격리
- Stateless 구조
- 환경변수 기반 설정
- `/actuator/health` 제공
- Docker 컨테이너 실행 가능

## Docker 구성

### 파일 위치

```text
docker-compose.yml
backend/Dockerfile
backend/.dockerignore
```

### Docker Compose 서비스

```text
postgres
backend
```

### Backend Dockerfile 특징

현재 `backend/Dockerfile`은 다음 구조입니다.

- 멀티 스테이지 빌드
- Maven build stage 사용
- Eclipse Temurin 17 JRE Alpine runtime 사용
- Spring Boot layered jar 추출
- `JarLauncher` 실행
- `JAVA_OPTS` 환경변수 지원
- non-root `app` 사용자로 실행

### Backend .dockerignore

`backend/.dockerignore`에서 다음 파일을 빌드 컨텍스트에서 제외합니다.

```text
target/
build/
out/
src/test/
.idea/
.vscode/
.env
.env.*
*.log
```

### Docker Compose 주요 환경변수

```env
POSTGRES_DB=antiadhd
POSTGRES_USER=antiadhd
POSTGRES_PASSWORD=antiadhd
POSTGRES_PORT=5432

BACKEND_PORT=8080
SPRING_PROFILES_ACTIVE=local
JPA_DDL_AUTO=update
JAVA_OPTS=-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport

JWT_SECRET=replace-with-at-least-32-characters-secret
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=http://localhost:19006,http://localhost:8081,http://localhost:8082,http://127.0.0.1:19006,http://127.0.0.1:8081,http://127.0.0.1:8082
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

### Docker 검증 상태

로컬에서 다음 항목을 확인했습니다.

```text
docker compose build backend 성공
docker compose up -d backend 성공
http://localhost:8080/actuator/health -> UP
backend 컨테이너 non-root app 사용자 실행 확인
```

현재 이미지 예시:

```text
antiadhd-backend:local
```

## Kubernetes 구성

### 기준

- 온프레미스 k3s 기준
- Ingress Controller는 k3s 기본 Traefik 기준
- 표준 Kubernetes `Ingress` 리소스 사용
- 개발용 내부 도메인: `api.antiadhd.local`
- 이미지 저장소 기준: GitHub Container Registry
- 이미지 예시: `ghcr.io/YOUR_GITHUB_ID/antiadhd-backend:0.1.0`
- kustomize 사용
- 실제 Secret 값은 Git에 넣지 않음
- Secret은 `.example.yaml`만 제공

### Kubernetes 폴더 구조

```text
k8s/
  base/
    namespace.yaml
    backend-deployment.yaml
    backend-service.yaml
    backend-ingress.yaml
    backend-configmap.yaml
    backend-secret.example.yaml
    kustomization.yaml

  local/
    kustomization.yaml
    postgres-deployment.yaml
    postgres-service.yaml
    postgres-secret.example.yaml

  prod/
    kustomization.yaml
```

## k8s/base

공통 리소스를 정의합니다.

```text
namespace.yaml
backend-deployment.yaml
backend-service.yaml
backend-ingress.yaml
backend-configmap.yaml
backend-secret.example.yaml
kustomization.yaml
```

### Namespace

```text
antiadhd
```

### Backend Deployment

```text
name: antiadhd-backend
image: ghcr.io/YOUR_GITHUB_ID/antiadhd-backend:0.1.0
containerPort: 8080
```

Probe:

```text
livenessProbe: /actuator/health
readinessProbe: /actuator/health
```

### Backend Service

```text
name: antiadhd-backend
type: ClusterIP
port: 8080
```

### Backend Ingress

```text
name: antiadhd-backend
ingressClassName: traefik
host: api.antiadhd.local
path: /
service: antiadhd-backend:8080
```

### Backend ConfigMap

```text
name: antiadhd-backend-config
```

주요 값:

```env
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://external-postgres.example.local:5432/antiadhd
JPA_DDL_AUTO=validate
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=http://api.antiadhd.local,https://api.antiadhd.local
JAVA_OPTS=-XX:MaxRAMPercentage=75.0 -XX:+UseContainerSupport
```

### Backend Secret

예시 파일:

```text
k8s/base/backend-secret.example.yaml
```

실제 Secret 이름:

```text
antiadhd-backend-secret
```

필요 키:

```text
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
JWT_SECRET
```

## k8s/local

local 환경은 Backend와 PostgreSQL을 Kubernetes 내부에 함께 배포합니다.

리소스:

```text
local/kustomization.yaml
local/postgres-deployment.yaml
local/postgres-service.yaml
local/postgres-secret.example.yaml
```

Local Backend 설정:

```env
SPRING_PROFILES_ACTIVE=local
SPRING_DATASOURCE_URL=jdbc:postgresql://antiadhd-postgres:5432/antiadhd
JPA_DDL_AUTO=update
```

PostgreSQL:

```text
Deployment name: antiadhd-postgres
Service name: antiadhd-postgres
Image: postgres:16-alpine
Port: 5432
Volume: emptyDir
```

주의:

```text
local PostgreSQL은 emptyDir 사용이라 Pod 삭제 시 데이터가 사라질 수 있습니다.
개발용 구조입니다.
```

PostgreSQL Secret 예시:

```text
k8s/local/postgres-secret.example.yaml
```

실제 Secret 이름:

```text
antiadhd-postgres-secret
```

필요 키:

```text
POSTGRES_USER
POSTGRES_PASSWORD
```

### local 배포 명령

```bash
kubectl apply -f k8s/base/namespace.yaml

kubectl create secret generic antiadhd-postgres-secret \
  -n antiadhd \
  --from-literal=POSTGRES_USER=antiadhd \
  --from-literal=POSTGRES_PASSWORD=change-me

kubectl create secret generic antiadhd-backend-secret \
  -n antiadhd \
  --from-literal=SPRING_DATASOURCE_USERNAME=antiadhd \
  --from-literal=SPRING_DATASOURCE_PASSWORD=change-me \
  --from-literal=JWT_SECRET=replace-with-at-least-32-characters-secret

kubectl apply -k k8s/local
```

## k8s/prod

prod 환경은 Backend만 배포하고 PostgreSQL은 외부 PostgreSQL을 사용합니다.

리소스:

```text
prod/kustomization.yaml
```

Prod Backend 설정:

```env
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:postgresql://external-postgres.example.local:5432/antiadhd
JPA_DDL_AUTO=validate
CORS_ALLOWED_ORIGINS=https://api.antiadhd.local
```

Prod Secret 생성:

```bash
kubectl create secret generic antiadhd-backend-secret \
  -n antiadhd \
  --from-literal=SPRING_DATASOURCE_USERNAME=prod-db-user \
  --from-literal=SPRING_DATASOURCE_PASSWORD=prod-db-password \
  --from-literal=JWT_SECRET=replace-with-prod-random-secret
```

Prod 배포:

```bash
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -k k8s/prod
```

## hosts 설정

개발용 내부 도메인:

```text
api.antiadhd.local
```

Windows hosts 파일:

```text
C:\Windows\System32\drivers\etc\hosts
```

예시:

```text
192.168.0.20 api.antiadhd.local
```

macOS/Linux:

```bash
sudo vi /etc/hosts
```

Health check:

```bash
curl http://api.antiadhd.local/actuator/health
```

## 확인 명령어

```bash
kubectl get pods -n antiadhd
kubectl get svc -n antiadhd
kubectl get ingress -n antiadhd
kubectl describe pod -n antiadhd
kubectl logs -n antiadhd deployment/antiadhd-backend
```

## 현재 검증 상태

로컬에서 확인 완료:

```text
kubectl kustomize k8s/local 성공
kubectl kustomize k8s/prod 성공
```

현재 로컬 PC에서는 kubeconfig 인증이 없어 아래 명령은 실패했습니다.

```bash
kubectl apply --dry-run=client -k k8s/local
kubectl apply --dry-run=client -k k8s/prod
```

실패 이유:

```text
the server has asked for the client to provide credentials
```

즉, manifest 렌더링은 정상이고 실제 apply 검증은 k3s 클러스터 인증 설정 후 진행해야 합니다.

## 현재 Git 상태

아직 커밋 전 변경사항이 있습니다.

```text
 M .env.example
 M .gitignore
 M README.md
 M backend/Dockerfile
 M docker-compose.yml
?? backend/.dockerignore
?? k8s/
?? docs/infra-handoff.md
```

## 인프라 담당자가 이어서 보면 좋은 포인트

1. k3s 클러스터에서 Traefik이 기본 활성화되어 있는지 확인
2. `api.antiadhd.local`이 k3s 노드 IP로 해석되도록 hosts 또는 내부 DNS 설정
3. GHCR 이미지 pull 권한 확인
4. private GHCR이면 `imagePullSecret` 추가 필요
5. local PostgreSQL은 `emptyDir`이므로 개발용만 적합
6. prod PostgreSQL 주소와 계정 Secret 필요
7. prod에서는 `JPA_DDL_AUTO=validate` 기준이라 스키마 마이그레이션 전략 필요
8. TLS가 필요하면 Traefik Ingress TLS 설정 추가 필요
9. 운영에서는 Secret을 `kubectl create secret`, SealedSecret, ExternalSecret 계열로 관리하는 것이 좋음
10. 현재 manifest는 기본 배포 구조이며 PVC, HPA, TLS, imagePullSecret은 다음 단계에서 추가 가능
