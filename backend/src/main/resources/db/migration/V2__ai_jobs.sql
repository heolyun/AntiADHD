CREATE TABLE ai_jobs (
    id UUID PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_type VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL,
    goal VARCHAR(1000) NOT NULL,
    deadline DATE,
    available_minutes INTEGER,
    result_json TEXT,
    provider_response_id VARCHAR(120),
    model VARCHAR(80),
    failure_code VARCHAR(80),
    failure_message VARCHAR(1000),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    claimed_at TIMESTAMP(6) WITH TIME ZONE,
    started_at TIMESTAMP(6) WITH TIME ZONE,
    completed_at TIMESTAMP(6) WITH TIME ZONE,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_ai_jobs_type CHECK (job_type IN ('TASK_BREAKDOWN')),
    CONSTRAINT chk_ai_jobs_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    CONSTRAINT chk_ai_jobs_available_minutes CHECK (
        available_minutes IS NULL OR available_minutes BETWEEN 5 AND 480
    ),
    CONSTRAINT chk_ai_jobs_attempt_count CHECK (attempt_count >= 0),
    CONSTRAINT fk_ai_jobs_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_ai_jobs_user_created ON ai_jobs (user_id, created_at DESC);
CREATE INDEX idx_ai_jobs_queue ON ai_jobs (status, next_attempt_at, created_at);
