ALTER TABLE routines
    ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 30;

ALTER TABLE routines
    ADD CONSTRAINT chk_routines_duration_minutes CHECK (duration_minutes BETWEEN 1 AND 480);

ALTER TABLE schedules
    ADD COLUMN routine_id BIGINT,
    ADD COLUMN routine_date DATE;

ALTER TABLE schedules
    ADD CONSTRAINT fk_schedules_routine FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE SET NULL;

ALTER TABLE schedules
    ADD CONSTRAINT uk_schedules_routine_date UNIQUE (routine_id, routine_date);

CREATE INDEX idx_schedules_routine ON schedules (routine_id);
