ALTER TABLE notification_jobs
  ADD COLUMN dispatched_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_notification_jobs_queue_dispatch
  ON notification_jobs(status, scheduled_at, dispatched_at);
