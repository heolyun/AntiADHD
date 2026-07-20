# AI 작업 분해 운영 설계

## 목적

사용자가 큰 목표를 입력하면 즉시 실행할 수 있는 작은 단계로 분해한다. HTTP 요청 안에서 OpenAI 응답을 기다리지 않고 작업을 DB 큐에 접수하므로, 모델 응답이 느리거나 일시적으로 실패해도 API 서버의 요청 처리와 배포 안정성을 분리할 수 있다.

```text
Mobile -> Backend API -> ai_jobs(PostgreSQL)
                          |
                          v
                    AI Worker -> OpenAI Responses API
                          |
                          v
                    ai_jobs 결과 저장
```

PostgreSQL 큐는 현재 사용자 규모에서 별도 Redis/RabbitMQ 운영 부담 없이 영속성과 재시도를 제공한다. 작업량이 커져 다중 큐, 복잡한 라우팅, 초당 대량 처리가 필요해지면 RabbitMQ나 Kafka로 교체하는 것이 다음 단계다.

## API 계약

모든 API는 JWT가 필요하며 사용자는 자기 작업만 조회할 수 있다.

### 작업 접수

```http
POST /api/ai/task-breakdowns
Authorization: Bearer <token>
Content-Type: application/json

{
  "goal": "Kubernetes 포트폴리오 README 완성하기",
  "deadline": "2026-07-25",
  "availableMinutes": 90
}
```

응답은 작업 완료가 아닌 접수 완료를 뜻하는 `202 Accepted`다.

```json
{
  "jobId": "3d25e1aa-2ebf-48c1-a175-c27ead07f839",
  "status": "PENDING"
}
```

### 작업 조회

```http
GET /api/ai/jobs/{jobId}
Authorization: Bearer <token>
```

상태는 `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` 중 하나다. 모바일은 2초 간격으로 조회하되 완료나 실패 상태에서 중단한다. 장기적으로 푸시 알림이나 SSE를 붙이면 폴링을 줄일 수 있다.

## DB와 동시성

- Flyway `V2__ai_jobs.sql`이 작업, 결과, 재시도 횟수와 제공자 응답 ID를 저장한다.
- 워커는 PostgreSQL의 `FOR UPDATE SKIP LOCKED` 방식으로 하나의 작업만 선점한다.
- OpenAI 네트워크 호출 중에는 DB 트랜잭션 잠금을 유지하지 않는다.
- 일시적 네트워크 오류, 408/409/429/5xx는 최대 3회 재시도한다.
- 처리 도중 Pod가 종료된 작업은 stale timeout 이후 다시 큐로 돌린다.

이 구조는 워커 replica를 늘려도 같은 작업을 동시에 가져가는 것을 막는다. 다만 외부 API 호출과 DB 저장 사이의 완전한 exactly-once는 아니므로, 제공자 요청 ID와 작업 ID를 관찰 정보로 보존한다.

## Kubernetes 운영

- `antiadhd-backend`: 요청 검증과 작업 접수/조회만 담당한다.
- `antiadhd-ai-worker`: 같은 이미지를 사용하지만 `AI_WORKER_ENABLED=true`로 큐 처리만 활성화한다.
- `antiadhd-openai-secret`: 워커 Deployment에만 주입한다. API Pod에는 OpenAI 키를 주지 않아 노출 범위를 줄인다.
- Prometheus는 대기 작업 수, 완료/재시도/실패 수, 처리 시간을 수집한다.
- Grafana `AntiADHD Overview`에서 큐와 처리 결과를 확인한다.

키는 Git에 커밋하지 않는다. 클러스터에서 수동 관리하는 현재 방식은 단일 홈 서버에는 충분하지만, GitHub Actions가 클러스터를 새로 구축해야 하는 단계에서는 SOPS/Sealed Secrets 또는 외부 비밀 관리 도구를 도입한다.

## 모바일 구현 지침

1. 목표, 마감일, 사용 가능 시간을 입력한다.
2. POST 결과의 `jobId`를 화면 상태에 저장한다.
3. GET을 주기적으로 호출하고 `PENDING/PROCESSING` 동안 로딩 상태를 보여준다.
4. `COMPLETED`이면 단계별 예상 시간과 에너지 수준을 편집 가능한 목록으로 보여준다.
5. 사용자가 확인한 단계만 일정으로 저장한다. AI 결과를 자동으로 일정에 쓰지 않아 사용자 통제와 잘못된 생성 결과의 영향을 제한한다.

## 다음 확장

- 결과 단계 선택 후 일정 일괄 생성 API
- 사용자 피드백(채택/수정/거절) 저장
- 일정 충돌을 고려한 AI 재배치
- 토큰/비용/모델별 성공률 계측
- 작업 취소, 보존 기간과 개인정보 삭제 정책
