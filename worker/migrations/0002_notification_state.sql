ALTER TABLE devices
  ADD COLUMN notifications_enabled INTEGER NOT NULL DEFAULT 1
  CHECK (notifications_enabled IN (0, 1));

ALTER TABLE devices
  ADD COLUMN notification_version TEXT NOT NULL DEFAULT '';

ALTER TABLE notification_jobs
  ADD COLUMN notification_version TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_notification_jobs_delivery_state
  ON notification_jobs(device_id, notification_version, status);
