# AntiADHD

React Native Expo 앱과 Spring Boot API로 구성한 개인 일정관리/타임블록 기반 AI 생산성 관리 플랫폼 MVP입니다.

현재 AI 기능은 실제 외부 API를 호출하지 않고, 추후 OpenAI 등 모델 연동을 붙일 수 있도록 API 경계와 서비스 구조만 준비했습니다.

```text
React Native App
  -> Spring Boot REST API
  -> PostgreSQL
```

향후 운영 목표는 온프레미스 Kubernetes 환경입니다.

```text
React Native App
  -> Spring Boot API
  -> Kubernetes
  -> PostgreSQL
```

## 기술 스택

- Frontend: React Native, Expo, TypeScript, React Navigation, Axios
- Backend: Spring Boot, Spring Security, JWT, Spring Data JPA, Actuator
- Database: PostgreSQL
- Local Runtime: Docker Compose

## 프로젝트 구조

```text
AntiADHD/
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

  backend/
    src/main/java/com/antiadhd/
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

  docker-compose.yml
  .env.example
```

## 실행 방법

### Backend + PostgreSQL

```bash
cp .env.example .env
docker compose up --build
```

Health check:

```text
GET http://localhost:8080/actuator/health
```

### Expo App

```bash
cd mobile-app
cp .env.example .env
npm install
npm run start
```

웹으로 확인:

```bash
npm run web
```

Expo Go에서 실제 기기로 테스트할 때는 `mobile-app/.env`의 API 주소를 PC의 LAN IP로 변경합니다.

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8080/api
```

## 환경변수

Root `.env`:

```env
POSTGRES_DB=antiadhd
POSTGRES_USER=antiadhd
POSTGRES_PASSWORD=antiadhd
POSTGRES_PORT=5432

BACKEND_PORT=8080

JWT_SECRET=replace-with-at-least-32-characters-secret
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=http://localhost:19006,http://localhost:8081,http://localhost:8082,http://127.0.0.1:19006,http://127.0.0.1:8081,http://127.0.0.1:8082
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

Backend:

| 변수 | 설명 |
| --- | --- |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | DB 사용자 |
| `SPRING_DATASOURCE_PASSWORD` | DB 비밀번호 |
| `JPA_DDL_AUTO` | Hibernate 스키마 모드. 로컬 기본값은 `update` |
| `JWT_SECRET` | JWT 서명 키 |
| `JWT_EXPIRATION_MS` | JWT 만료 시간 |
| `CORS_ALLOWED_ORIGINS` | 허용할 Origin 목록 |

Mobile:

| 변수 | 설명 |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Axios가 호출할 Spring Boot API 주소 |

## 주요 기능

- 회원가입, 로그인, 로그아웃
- JWT 인증, 내 정보 조회
- 일정 생성, 조회, 수정, 삭제
- 일정 완료 체크
- 오늘/주간/월간 일정 조회
- 월간 캘린더 첫 화면 표시 및 저장된 일정 표시
- 일정 색상, 반복 타입 저장
- 카테고리/태그 관리
- 루틴 관리
- 목표 관리
- Focus Mode
- Daily Review
- AI 추천 placeholder 구조

모든 사용자 데이터는 로그인한 사용자 기준으로만 조회, 수정, 삭제됩니다.

## 모바일 화면

- Splash
- 로그인
- 회원가입
- 월간 캘린더
- 오늘 일정
- 주간 일정
- 일정 상세/등록/수정
- 생산성 대시보드
- 카테고리/태그 관리
- 루틴 관리
- 목표 관리
- Focus Mode
- Daily Review
- 설정

## API 목록

일정, 카테고리, 태그, 루틴, 목표, Focus, Review, AI API는 JWT 인증이 필요합니다.

```text
Authorization: Bearer <token>
```

### Auth / User

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 및 JWT 발급 |
| GET | `/api/users/me` | 내 정보 조회 |

### Schedules

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/schedules` | 일정 생성 |
| GET | `/api/schedules` | 기간 일정 조회 |
| GET | `/api/schedules/{id}` | 일정 상세 |
| PUT | `/api/schedules/{id}` | 일정 수정 |
| PATCH | `/api/schedules/{id}/complete` | 완료 상태 변경 |
| DELETE | `/api/schedules/{id}` | 일정 삭제 |
| GET | `/api/schedules/today?date=2026-07-03` | 오늘 일정 |
| GET | `/api/schedules/week?date=2026-07-03` | 주간 일정 |
| GET | `/api/schedules/month?year=2026&month=7` | 월간 일정 |

일정 요청에는 `categoryId`, `tagIds`를 선택적으로 포함할 수 있습니다.

### Categories / Tags

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/categories` | 카테고리 목록 |
| POST | `/api/categories` | 카테고리 생성 |
| PUT | `/api/categories/{id}` | 카테고리 수정 |
| DELETE | `/api/categories/{id}` | 카테고리 삭제 |
| GET | `/api/tags` | 태그 목록 |
| POST | `/api/tags` | 태그 생성 |
| PUT | `/api/tags/{id}` | 태그 수정 |
| DELETE | `/api/tags/{id}` | 태그 삭제 |

### Routines

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/routines` | 루틴 목록 |
| POST | `/api/routines` | 루틴 생성 |
| PUT | `/api/routines/{id}` | 루틴 수정 |
| DELETE | `/api/routines/{id}` | 루틴 삭제 |

### Goals

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/goals` | 목표 목록 |
| POST | `/api/goals` | 목표 생성 |
| PUT | `/api/goals/{id}` | 목표 수정 |
| DELETE | `/api/goals/{id}` | 목표 삭제 |

### Focus Mode

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/focus-sessions` | Focus 세션 목록 |
| POST | `/api/focus-sessions` | Focus 세션 생성 |
| PUT | `/api/focus-sessions/{id}` | Focus 세션 수정 |
| PATCH | `/api/focus-sessions/{id}/complete` | Focus 세션 완료 |
| DELETE | `/api/focus-sessions/{id}` | Focus 세션 삭제 |

### Daily Review

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/daily-reviews` | 회고 목록 |
| GET | `/api/daily-reviews/by-date?date=2026-07-03` | 날짜별 회고 |
| POST | `/api/daily-reviews` | 회고 생성 |
| PUT | `/api/daily-reviews/{id}` | 회고 수정 |
| DELETE | `/api/daily-reviews/{id}` | 회고 삭제 |

### AI

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/ai/suggestions` | AI 추천 placeholder |

현재 AI API는 외부 모델 API를 호출하지 않습니다.

### Health

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/actuator/health` | Kubernetes liveness/readiness probe용 health check |

## Kubernetes 배포 예정 사항

현재 Kubernetes YAML은 포함하지 않습니다. 대신 다음 조건을 고려해 구성했습니다.

- Spring Boot API는 stateless 구조
- DB/JWT/CORS 설정은 환경변수 기반
- 민감정보를 `application.yml`에 하드코딩하지 않음
- `backend/Dockerfile`로 이미지 빌드 가능
- `/actuator/health` 제공
- 추후 ConfigMap, Secret, Deployment, Service, Ingress로 이전 가능
- AWS SDK, AWS 인증, 클라우드 전용 코드는 포함하지 않음
