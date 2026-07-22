ALTER TABLE users
    ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

-- Early development environments allowed Hibernate to create foreign keys, so
-- their generated names differ from the explicit names used by a clean Flyway
-- install. Remove the targeted relationships by table pair rather than name.
DO $$
DECLARE
    foreign_key RECORD;
BEGIN
    FOR foreign_key IN
        SELECT conrelid::regclass AS table_name, conname
        FROM pg_constraint
        WHERE contype = 'f'
          AND connamespace = 'public'::regnamespace
          AND (
              (conrelid IN (
                  'categories'::regclass,
                  'tags'::regclass,
                  'schedules'::regclass,
                  'focus_sessions'::regclass,
                  'goals'::regclass,
                  'routines'::regclass,
                  'daily_reviews'::regclass,
                  'ai_jobs'::regclass,
                  'inbox_items'::regclass
              ) AND confrelid = 'users'::regclass)
              OR (conrelid = 'schedules'::regclass AND confrelid = 'categories'::regclass)
              OR (conrelid = 'schedule_tags'::regclass AND confrelid IN ('schedules'::regclass, 'tags'::regclass))
          )
    LOOP
        EXECUTE format(
            'ALTER TABLE %s DROP CONSTRAINT %I',
            foreign_key.table_name,
            foreign_key.conname
        );
    END LOOP;
END $$;

ALTER TABLE categories ADD CONSTRAINT fk_categories_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE tags ADD CONSTRAINT fk_tags_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE schedules ADD CONSTRAINT fk_schedules_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE schedules ADD CONSTRAINT fk_schedules_category
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL;

ALTER TABLE schedule_tags ADD CONSTRAINT fk_schedule_tags_schedule
    FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE;

ALTER TABLE schedule_tags ADD CONSTRAINT fk_schedule_tags_tag
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE;

ALTER TABLE focus_sessions ADD CONSTRAINT fk_focus_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE goals ADD CONSTRAINT fk_goals_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE routines ADD CONSTRAINT fk_routines_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE daily_reviews ADD CONSTRAINT fk_daily_reviews_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE ai_jobs ADD CONSTRAINT fk_ai_jobs_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE inbox_items ADD CONSTRAINT fk_inbox_items_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
