# AntiADHD Planner

개인 일정관리와 타임블록을 위한 MVP 웹 서비스입니다. 프론트엔드는 React + Vite, 백엔드는 Spring Boot, DB는 PostgreSQL 기준으로 분리했습니다.

## 프로젝트 구조

```text
AntiADHD/
  backend/        Spring Boot API, JWT 인증, 일정 CRUD
  frontend/       React + Vite 반응형 웹 앱
  docker-compose.yml
  .env.example
```

## 주요 기능

- 회원가입, 로그인, JWT 인증
- 일정 생성, 조회, 수정, 삭제
- 일정 완료 체크
- 오늘/주간/월간 일정 조회
- 일정 색상 지정
- 반복 타입 저장: `NONE`, `DAILY`, `WEEKLY`, `MONTHLY`

반복 일정은 현재 타입만 저장합니다. 실제 반복 일정 자동 생성은 이후 별도 서비스 로직으로 확장할 수 있도록 enum과 저장 구조를 먼저 잡았습니다.

## 실행 방법

### Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- PostgreSQL: localhost:5432

### 로컬 개발

백엔드는 Java 17과 Maven이 필요합니다.

```bash
cd backend
mvn spring-boot:run
```

프론트엔드는 Node.js와 npm이 필요합니다.

```bash
cd frontend
npm install
npm run dev
```

PostgreSQL은 로컬 또는 Docker로 실행하고, 아래 환경변수를 맞춰주세요.

## 환경변수 예시

```env
POSTGRES_DB=antiadhd
POSTGRES_USER=antiadhd
POSTGRES_PASSWORD=antiadhd
POSTGRES_PORT=5432

BACKEND_PORT=8080
FRONTEND_PORT=5173

SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/antiadhd
SPRING_DATASOURCE_USERNAME=antiadhd
SPRING_DATASOURCE_PASSWORD=antiadhd
JPA_DDL_AUTO=update

JWT_SECRET=replace-with-at-least-32-characters-secret
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
VITE_API_BASE_URL=http://localhost:8080/api
```

AWS 배포 시에는 DB 접속 정보, JWT secret, CORS origin, 프론트 API URL을 서비스별 환경변수로 주입하면 됩니다.

## API 목록

모든 일정 API는 `Authorization: Bearer <token>` 헤더가 필요합니다.

### Auth

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 및 JWT 발급 |

회원가입 요청:

```json
{
  "email": "user@example.com",
  "name": "사용자",
  "password": "password123"
}
```

로그인 응답:

```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "사용자"
  }
}
```

### Schedules

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/schedules` | 일정 생성 |
| GET | `/api/schedules?from=2026-07-01T00:00:00&to=2026-08-01T00:00:00` | 범위 일정 조회 |
| GET | `/api/schedules/{id}` | 일정 단건 조회 |
| PUT | `/api/schedules/{id}` | 일정 수정 |
| PATCH | `/api/schedules/{id}/complete` | 완료 상태 변경 |
| DELETE | `/api/schedules/{id}` | 일정 삭제 |
| GET | `/api/schedules/today?date=2026-07-02` | 오늘 일정 조회 |
| GET | `/api/schedules/week?date=2026-07-02` | 주간 일정 조회 |
| GET | `/api/schedules/month?year=2026&month=7` | 월간 일정 조회 |

일정 생성/수정 요청:

```json
{
  "title": "집중 작업",
  "description": "알림 없이 50분 진행",
  "startAt": "2026-07-02T09:00:00",
  "endAt": "2026-07-02T10:00:00",
  "color": "#2563eb",
  "repeatType": "NONE"
}
```

완료 체크 요청:

```json
{
  "completed": true
}
```

## DB 설계

JPA `ddl-auto=update` 기준으로 초기 MVP 테이블을 생성합니다.

- `users`: 사용자 계정, 이메일 unique, BCrypt 비밀번호
- `schedules`: 사용자별 일정, 시작/종료 시간, 색상, 완료 여부, 반복 타입
- 주요 인덱스: `user_id + start_at`, `user_id + end_at`

운영 배포 단계에서는 Flyway 또는 Liquibase로 마이그레이션을 고정하는 것을 권장합니다.

