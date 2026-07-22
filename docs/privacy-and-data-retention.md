# Privacy and data retention

AtiADHD is currently a private home-lab beta. This document records the data
boundaries that must remain true as features are added.

## Stored data

- Account: name, email, BCrypt password hash, login refresh-token hashes
- Productivity data: schedules, categories, tags, routines, goals, focus sessions,
  inbox items, and daily reviews
- AI jobs: the submitted goal or recognized command, processing status, result,
  model identifier, and provider response identifier
- Operations: server logs, aggregate metrics, and sanitized mobile crash messages

Raw passwords, JWTs, OpenAI API keys, and raw refresh tokens must never be logged.

## Voice recordings

Voice audio is stored on the private voice-job PVC only while transcription is
pending. The worker deletes the file after successful or terminal processing.
Deletion failures are logged for operational cleanup. Audio is not included in
PostgreSQL backups.

## Mobile error reports

Unexpected render failures may be sent to `/api/client-errors`. Reports contain
only a fixed context, platform, app version, user numeric ID on the server, and a
message limited to 500 characters. Bearer tokens, OpenAI-style keys, email
addresses, and control characters are redacted. The message is written to server
logs but is never used as a Prometheus label.

## Account deletion

`DELETE /api/users/me` requires the current password. It deletes the account and
all associated application rows through database foreign-key cascades. Existing
access tokens stop working because the user no longer exists. Backups may retain
deleted rows until the configured 14-day backup retention window expires.

## Operational retention

- PostgreSQL backups: 14 days on the k3s backup PVC
- Prometheus metrics: 7 days, limited to 6 GB
- Alertmanager data: 120 hours
- Application logs: node runtime retention; do not treat logs as durable storage

Before public distribution, expose this policy in the application, document an
operator contact, and add an explicit export request process.
