ALTER TABLE users
    ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE categories DROP CONSTRAINT fk_categories_user;
ALTER TABLE categories ADD CONSTRAINT fk_categories_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE tags DROP CONSTRAINT fk_tags_user;
ALTER TABLE tags ADD CONSTRAINT fk_tags_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE schedules DROP CONSTRAINT fk_schedules_user;
ALTER TABLE schedules ADD CONSTRAINT fk_schedules_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE schedules DROP CONSTRAINT fk_schedules_category;
ALTER TABLE schedules ADD CONSTRAINT fk_schedules_category
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL;

ALTER TABLE schedule_tags DROP CONSTRAINT fk_schedule_tags_schedule;
ALTER TABLE schedule_tags ADD CONSTRAINT fk_schedule_tags_schedule
    FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE CASCADE;

ALTER TABLE schedule_tags DROP CONSTRAINT fk_schedule_tags_tag;
ALTER TABLE schedule_tags ADD CONSTRAINT fk_schedule_tags_tag
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE;

ALTER TABLE focus_sessions DROP CONSTRAINT fk_focus_sessions_user;
ALTER TABLE focus_sessions ADD CONSTRAINT fk_focus_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE goals DROP CONSTRAINT fk_goals_user;
ALTER TABLE goals ADD CONSTRAINT fk_goals_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE routines DROP CONSTRAINT fk_routines_user;
ALTER TABLE routines ADD CONSTRAINT fk_routines_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE daily_reviews DROP CONSTRAINT fk_daily_reviews_user;
ALTER TABLE daily_reviews ADD CONSTRAINT fk_daily_reviews_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE ai_jobs DROP CONSTRAINT fk_ai_jobs_user;
ALTER TABLE ai_jobs ADD CONSTRAINT fk_ai_jobs_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE inbox_items DROP CONSTRAINT fk_inbox_items_user;
ALTER TABLE inbox_items ADD CONSTRAINT fk_inbox_items_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
