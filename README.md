# AntiADHD Time Blocking

React Native(Expo) 모바일 앱과 Spring Boot 백엔드로 구성한 개인 일정관리/Time Blocking 서비스입니다. 현재는 로컬 개발과 Docker Compose 실행을 목표로 하며, 향후 온프레미스 Kubernetes 환경으로 이전하기 쉬운 구조를 우선합니다.

## Architecture

```text
React Native App
  -> Spring Boot REST API
  -> PostgreSQL

Future runtime:
React Native App
  -> Spring Boot API
  -> Kubernetes
  -> PostgreSQL
```

## Project Structure

```text
AntiADHD/
  mobile-app/
    App.tsx
    src/
      features/
        auth/
          api/
          context/
          dto/
          screens/
        schedules/
          api/
          components/
          dto/
          hooks/
          screens/
        settings/
          screens/
      navigation/
      shared/
        api/
        components/
        constants/
        hooks/
        utils/
      types/

  backend/
    Dockerfile
    src/main/java/com/antiadhd/
      auth/
      config/
      schedule/
      user/
    src/main/resources/application.yml

  docker-compose.yml
  .env.example
```

## Features

- Signup
- Login with JWT
- Logout
- Today schedules
- Weekly schedule
- Monthly calendar
- Schedule detail
- Schedule create/edit/delete
- Schedule completion toggle
- Repeat type storage: `NONE`, `DAILY`, `WEEKLY`, `MONTHLY`

Repeat schedules are stored as a type only. Automatic recurring schedule generation is intentionally left for a later service-layer extension.

## Mobile App

### Stack

- React Native
- Expo
- TypeScript
- React Navigation
- Axios
- AsyncStorage

### Run Expo

```bash
cd mobile-app
cp .env.example .env
npm install
npm run start
```

Set the API URL in `mobile-app/.env`.

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

When using a physical device with Expo Go, replace `localhost` with your PC LAN IP.

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.10:8080/api
```

For Android Emulator, use:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8080/api
```

## Backend

### Stack

- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data JPA
- PostgreSQL
- Spring Boot Actuator

### Run Spring Boot Locally

Java 17, Maven, and PostgreSQL are required.

```bash
cd backend
mvn spring-boot:run
```

Required environment variables:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/antiadhd
SPRING_DATASOURCE_USERNAME=antiadhd
SPRING_DATASOURCE_PASSWORD=antiadhd
JWT_SECRET=replace-with-at-least-32-characters-secret
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=http://localhost:19006,http://localhost:8081
```

Health check:

```text
GET /actuator/health
```

## Docker Compose

React Native is not containerized. Docker Compose runs PostgreSQL and the backend API only.

```bash
cp .env.example .env
docker compose up --build
```

Services:

- PostgreSQL: `localhost:5432`
- Backend API: `http://localhost:8080/api`
- Health: `http://localhost:8080/actuator/health`

## Environment Variables

Root `.env` for Docker Compose:

```env
POSTGRES_DB=antiadhd
POSTGRES_USER=antiadhd
POSTGRES_PASSWORD=antiadhd
POSTGRES_PORT=5432

BACKEND_PORT=8080

JWT_SECRET=replace-with-at-least-32-characters-secret
JWT_EXPIRATION_MS=86400000
CORS_ALLOWED_ORIGINS=http://localhost:19006,http://localhost:8081
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

Backend variables:

| Name | Description |
| --- | --- |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL username |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |
| `JPA_DDL_AUTO` | Hibernate schema mode. MVP default is `update` |
| `JWT_SECRET` | JWT signing secret. Required |
| `JWT_EXPIRATION_MS` | JWT expiration in milliseconds |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins |

Mobile variables:

| Name | Description |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Spring Boot API base URL used by Axios |

## REST API

Schedule APIs require:

```text
Authorization: Bearer <token>
```

### Auth

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/signup` | Signup |
| POST | `/api/auth/login` | Login and issue JWT |

### Schedules

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/schedules` | Create schedule |
| GET | `/api/schedules?from=2026-07-01T00:00:00&to=2026-08-01T00:00:00` | List schedules by range |
| GET | `/api/schedules/{id}` | Get schedule detail |
| PUT | `/api/schedules/{id}` | Update schedule |
| PATCH | `/api/schedules/{id}/complete` | Toggle completion |
| DELETE | `/api/schedules/{id}` | Delete schedule |
| GET | `/api/schedules/today?date=2026-07-02` | Today schedules |
| GET | `/api/schedules/week?date=2026-07-02` | Weekly schedules |
| GET | `/api/schedules/month?year=2026&month=7` | Monthly schedules |

### Health

| Method | Path | Description |
| --- | --- | --- |
| GET | `/actuator/health` | Application health for Docker/Kubernetes probes |

## Kubernetes Readiness

No Kubernetes YAML is included yet. The application is structured for a later on-prem Kubernetes deployment:

- Spring Boot backend is stateless.
- DB credentials and JWT secret are environment variables.
- `application.yml` does not contain hard-coded secrets.
- Docker image can be built from `backend/Dockerfile`.
- `/actuator/health` is available for readiness/liveness probes.
- Config can be supplied later through Kubernetes `ConfigMap` and `Secret`.
- AWS SDK, AWS auth, cloud-specific scripts, and cloud service dependencies are intentionally excluded.

