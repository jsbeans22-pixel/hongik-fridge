CREATE TABLE IF NOT EXISTS notification_dead_letters (
  id TEXT PRIMARY KEY,
  queue_message_id TEXT NOT NULL UNIQUE,
  device_id TEXT,
  job_id TEXT,
  notification_version TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  failed_at INTEGER NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_dead_letters_failed_at
  ON notification_dead_letters(failed_at);
