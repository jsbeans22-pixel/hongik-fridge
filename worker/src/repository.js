const JOB_INSERT_CHUNK_SIZE = 9

function createSubscriptionStatements(db, deviceId, subscription, now) {
  return [
    db.prepare(`
      DELETE FROM push_subscriptions
      WHERE device_id = ? AND endpoint <> ?
    `).bind(deviceId, subscription.endpoint),
    db.prepare(`
      INSERT INTO push_subscriptions (
        endpoint, device_id, expiration_time, p256dh, auth, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        device_id = excluded.device_id,
        expiration_time = excluded.expiration_time,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        updated_at = excluded.updated_at
    `).bind(
      subscription.endpoint,
      deviceId,
      subscription.expirationTime,
      subscription.keys.p256dh,
      subscription.keys.auth,
      now,
      now,
    ),
  ]
}

function createEnabledDeviceStatement(db, deviceId, notificationVersion, now) {
  return db.prepare(`
    INSERT INTO devices (
      id, created_at, updated_at, notifications_enabled, notification_version
    )
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET
      updated_at = excluded.updated_at,
      notifications_enabled = 1,
      notification_version = excluded.notification_version
  `).bind(deviceId, now, now, notificationVersion)
}

function createJobReplacement(db, deviceId, jobs, notificationVersion, now) {
  const futureJobs = jobs.filter(({ scheduledAt }) => scheduledAt > now)
  const statements = [
    db.prepare('DELETE FROM notification_jobs WHERE device_id = ?').bind(deviceId),
  ]

  for (let index = 0; index < futureJobs.length; index += JOB_INSERT_CHUNK_SIZE) {
    const chunk = futureJobs.slice(index, index + JOB_INSERT_CHUNK_SIZE)
    const placeholders = chunk
      .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)")
      .join(', ')
    const bindings = chunk.flatMap((job) => [
      deviceId,
      job.id,
      job.foodId,
      job.notificationId,
      job.scheduledAt,
      job.title,
      job.body,
      job.url,
      notificationVersion,
      now,
      now,
    ])

    statements.push(db.prepare(`
      INSERT INTO notification_jobs (
        device_id, id, food_id, notification_id, scheduled_at,
        title, body, url, notification_version,
        status, attempts, created_at, updated_at
      ) VALUES ${placeholders}
    `).bind(...bindings))
  }

  return { savedCount: futureJobs.length, statements }
}

export async function saveSubscription(db, deviceId, subscription, now) {
  await db.batch([
    db.prepare(`
      INSERT INTO devices (
        id, created_at, updated_at, notifications_enabled, notification_version
      )
      VALUES (?, ?, ?, 0, '')
      ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at
    `).bind(deviceId, now, now),
    ...createSubscriptionStatements(db, deviceId, subscription, now),
  ])
}

export async function removeSubscription(db, deviceId, endpoint) {
  await db.prepare(`
    DELETE FROM push_subscriptions
    WHERE device_id = ? AND endpoint = ?
  `).bind(deviceId, endpoint).run()

  const remaining = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM push_subscriptions
    WHERE device_id = ?
  `).bind(deviceId).first()

  if (Number(remaining?.count ?? 0) === 0) {
    const now = Date.now()
    await db.batch([
      db.prepare(`
        UPDATE devices
        SET notifications_enabled = 0,
            notification_version = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(crypto.randomUUID(), now, deviceId),
      db.prepare('DELETE FROM notification_jobs WHERE device_id = ?')
        .bind(deviceId),
    ])
  }
}

export async function replaceJobs(db, deviceId, jobs, now) {
  const notificationVersion = crypto.randomUUID()
  const replacement = createJobReplacement(
    db,
    deviceId,
    jobs,
    notificationVersion,
    now,
  )

  await db.batch([
    createEnabledDeviceStatement(db, deviceId, notificationVersion, now),
    ...replacement.statements,
  ])
  return replacement.savedCount
}

export async function syncNotificationState(
  db,
  deviceId,
  subscription,
  jobs,
  now,
) {
  const notificationVersion = crypto.randomUUID()
  const replacement = createJobReplacement(
    db,
    deviceId,
    jobs,
    notificationVersion,
    now,
  )

  await db.batch([
    createEnabledDeviceStatement(db, deviceId, notificationVersion, now),
    ...createSubscriptionStatements(db, deviceId, subscription, now),
    ...replacement.statements,
  ])
  return replacement.savedCount
}

export async function disableNotifications(db, deviceId, now) {
  const notificationVersion = crypto.randomUUID()

  await db.batch([
    db.prepare(`
      INSERT INTO devices (
        id, created_at, updated_at, notifications_enabled, notification_version
      )
      VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(id) DO UPDATE SET
        updated_at = excluded.updated_at,
        notifications_enabled = 0,
        notification_version = excluded.notification_version
    `).bind(deviceId, now, now, notificationVersion),
    db.prepare('DELETE FROM notification_jobs WHERE device_id = ?')
      .bind(deviceId),
    db.prepare('DELETE FROM push_subscriptions WHERE device_id = ?')
      .bind(deviceId),
  ])
}

export function removeJobs(db, deviceId) {
  return db.prepare('DELETE FROM notification_jobs WHERE device_id = ?')
    .bind(deviceId)
    .run()
}

export async function recoverStaleClaims(db, now, claimTimeoutMs, maxAttempts) {
  await db.prepare(`
    UPDATE notification_jobs
    SET
      status = CASE WHEN attempts >= ? THEN 'failed' ELSE 'pending' END,
      claimed_at = NULL,
      dispatched_at = NULL,
      updated_at = ?,
      last_error = CASE
        WHEN attempts >= ? THEN '발송 처리 시간이 초과되었습니다.'
        ELSE last_error
      END
    WHERE status = 'processing' AND claimed_at < ?
  `).bind(maxAttempts, now, maxAttempts, now - claimTimeoutMs).run()
}

export async function getDueJobs(db, now, limit, redispatchBefore = now) {
  const result = await db.prepare(`
    SELECT
      jobs.device_id AS deviceId,
      jobs.id,
      jobs.food_id AS foodId,
      jobs.notification_id AS notificationId,
      jobs.scheduled_at AS scheduledAt,
      jobs.title,
      jobs.body,
      jobs.url,
      jobs.attempts,
      jobs.notification_version AS notificationVersion
    FROM notification_jobs AS jobs
    INNER JOIN devices
      ON devices.id = jobs.device_id
      AND devices.notifications_enabled = 1
      AND devices.notification_version = jobs.notification_version
    WHERE jobs.status = 'pending'
      AND jobs.scheduled_at <= ?
      AND (jobs.dispatched_at IS NULL OR jobs.dispatched_at < ?)
    ORDER BY jobs.scheduled_at ASC
    LIMIT ?
  `).bind(now, redispatchBefore, limit).all()

  return result.results ?? []
}

export async function getJobForDelivery(
  db,
  deviceId,
  id,
  notificationVersion,
) {
  return db.prepare(`
    SELECT
      jobs.device_id AS deviceId,
      jobs.id,
      jobs.food_id AS foodId,
      jobs.notification_id AS notificationId,
      jobs.scheduled_at AS scheduledAt,
      jobs.title,
      jobs.body,
      jobs.url,
      jobs.attempts,
      jobs.notification_version AS notificationVersion
    FROM notification_jobs AS jobs
    INNER JOIN devices
      ON devices.id = jobs.device_id
      AND devices.notifications_enabled = 1
      AND devices.notification_version = jobs.notification_version
    WHERE jobs.device_id = ?
      AND jobs.id = ?
      AND jobs.notification_version = ?
      AND jobs.status = 'pending'
    LIMIT 1
  `).bind(deviceId, id, notificationVersion).first()
}

export async function markJobsDispatched(db, jobs, now) {
  const chunks = []
  for (let index = 0; index < jobs.length; index += 32) {
    chunks.push(jobs.slice(index, index + 32))
  }

  if (chunks.length === 0) return

  await db.batch(chunks.map((chunk) => {
    const conditions = chunk
      .map(() => '(device_id = ? AND id = ? AND notification_version = ?)')
      .join(' OR ')
    const bindings = chunk.flatMap((job) => [
      job.deviceId,
      job.id,
      job.notificationVersion,
    ])

    return db.prepare(`
      UPDATE notification_jobs
      SET dispatched_at = ?, updated_at = ?
      WHERE status = 'pending' AND (${conditions})
    `).bind(now, now, ...bindings)
  }))
}

export async function isJobDeliverable(db, deviceId, id, notificationVersion) {
  const row = await db.prepare(`
    SELECT 1 AS deliverable
    FROM notification_jobs AS jobs
    INNER JOIN devices
      ON devices.id = jobs.device_id
      AND devices.notifications_enabled = 1
      AND devices.notification_version = jobs.notification_version
    WHERE jobs.device_id = ?
      AND jobs.id = ?
      AND jobs.notification_version = ?
      AND jobs.status = 'processing'
    LIMIT 1
  `).bind(deviceId, id, notificationVersion).first()

  return row?.deliverable === 1
}

export async function claimJob(db, deviceId, id, notificationVersion, now) {
  const result = await db.prepare(`
    UPDATE notification_jobs
    SET status = 'processing', attempts = attempts + 1, claimed_at = ?, updated_at = ?
    WHERE device_id = ?
      AND id = ?
      AND notification_version = ?
      AND status = 'pending'
  `).bind(now, now, deviceId, id, notificationVersion).run()

  return Number(result.meta?.changes ?? 0) === 1
}

export async function getSubscriptions(db, deviceId) {
  const result = await db.prepare(`
    SELECT endpoint, expiration_time AS expirationTime, p256dh, auth
    FROM push_subscriptions
    WHERE device_id = ?
  `).bind(deviceId).all()

  return (result.results ?? []).map((row) => ({
    endpoint: row.endpoint,
    expirationTime: row.expirationTime,
    keys: { p256dh: row.p256dh, auth: row.auth },
  }))
}

export function removeSubscriptionByEndpoint(db, endpoint) {
  return db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')
    .bind(endpoint)
    .run()
}

export function markJobSent(db, deviceId, id, notificationVersion, now) {
  return db.prepare(`
    UPDATE notification_jobs
    SET status = 'sent', sent_at = ?, claimed_at = NULL, updated_at = ?, last_error = NULL
    WHERE device_id = ?
      AND id = ?
      AND notification_version = ?
      AND status = 'processing'
  `).bind(now, now, deviceId, id, notificationVersion).run()
}

export function markJobFailed(
  db,
  deviceId,
  id,
  notificationVersion,
  now,
  message,
  shouldRetry,
) {
  return db.prepare(`
    UPDATE notification_jobs
    SET status = ?,
        claimed_at = NULL,
        dispatched_at = CASE WHEN ? THEN ? ELSE dispatched_at END,
        updated_at = ?,
        last_error = ?
    WHERE device_id = ?
      AND id = ?
      AND notification_version = ?
      AND status = 'processing'
  `).bind(
    shouldRetry ? 'pending' : 'failed',
    shouldRetry ? 1 : 0,
    now,
    now,
    message.slice(0, 500),
    deviceId,
    id,
    notificationVersion,
  ).run()
}

export function releaseJobForRetry(
  db,
  deviceId,
  id,
  notificationVersion,
  now,
  message,
) {
  return db.prepare(`
    UPDATE notification_jobs
    SET status = 'pending',
        claimed_at = NULL,
        dispatched_at = ?,
        updated_at = ?,
        last_error = ?
    WHERE device_id = ?
      AND id = ?
      AND notification_version = ?
      AND status = 'processing'
  `).bind(
    now,
    now,
    message.slice(0, 500),
    deviceId,
    id,
    notificationVersion,
  ).run()
}

export function deleteOldJobs(db, before) {
  return db.prepare(`
    DELETE FROM notification_jobs
    WHERE status IN ('sent', 'failed') AND updated_at < ?
  `).bind(before).run()
}

export async function recordDeadLetters(db, deadLetters) {
  if (deadLetters.length === 0) return

  await db.batch(deadLetters.map((deadLetter) => db.prepare(`
    INSERT OR IGNORE INTO notification_dead_letters (
      id, queue_message_id, device_id, job_id, notification_version,
      attempts, failed_at, payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    deadLetter.id,
    deadLetter.queueMessageId,
    deadLetter.deviceId,
    deadLetter.jobId,
    deadLetter.notificationVersion,
    deadLetter.attempts,
    deadLetter.failedAt,
    deadLetter.payload,
  )))
}

export async function getNotificationHealth(db, now) {
  const since = now - (24 * 60 * 60 * 1000)
  const overdueBefore = now - (2 * 60 * 1000)

  const [deadLetters, failedJobs, overdueJobs] = await db.batch([
    db.prepare(`
      SELECT COUNT(*) AS count, MAX(failed_at) AS lastFailureAt
      FROM notification_dead_letters
      WHERE failed_at >= ?
    `).bind(since),
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM notification_jobs
      WHERE status = 'failed' AND updated_at >= ?
    `).bind(since),
    db.prepare(`
      SELECT COUNT(*) AS count, MIN(scheduled_at) AS oldestScheduledAt
      FROM notification_jobs
      WHERE status = 'pending' AND scheduled_at < ?
    `).bind(overdueBefore),
  ])

  return {
    deadLetters24h: Number(deadLetters.results?.[0]?.count ?? 0),
    lastDeadLetterAt: deadLetters.results?.[0]?.lastFailureAt ?? null,
    failedJobs24h: Number(failedJobs.results?.[0]?.count ?? 0),
    overdueJobs: Number(overdueJobs.results?.[0]?.count ?? 0),
    oldestOverdueAt: overdueJobs.results?.[0]?.oldestScheduledAt ?? null,
  }
}
