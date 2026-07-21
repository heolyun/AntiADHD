ALTER TABLE ai_jobs ADD COLUMN audio_path VARCHAR(500);

ALTER TABLE ai_jobs DROP CONSTRAINT chk_ai_jobs_type;
ALTER TABLE ai_jobs ADD CONSTRAINT chk_ai_jobs_type
    CHECK (job_type IN ('TASK_BREAKDOWN', 'VOICE_COMMAND'));
