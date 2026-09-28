import assert from 'node:assert/strict'
import test from 'node:test'
import { buildNotificationJobs } from '../src/utils/notificationJobs.js'
import { getDaysRemaining, getExpiryDate } from '../src/utils/storageDeadline.js'

const MILK = {
  id: 'food-milk',
  name: '우유',
  icon: '🥛',
  startDate: '2026-01-01',
}

const BEFORE_LABEL_DATE = Date.parse('2025-12-31T00:00:00+09:00')

function buildJobs(overrides = {}) {
  return buildNotificationJobs({
    foods: [MILK],
    storageDays: 7,
    notificationTimes: [],
    now: BEFORE_LABEL_DATE,
    ...overrides,
  })
}

test('keeps food through the end of the seventh day', () => {
  assert.equal(getExpiryDate('2026-01-01', 7), '2026-01-08')
  assert.equal(getDaysRemaining('2026-01-01', '2026-01-08', 7), 0)
  assert.equal(getDaysRemaining('2026-01-01', '2026-01-09', 7), -1)
})

test('schedules notifications in Korea time and chronological order', () => {
  const jobs = buildJobs({
    notificationTimes: [
      { id: 'same-day', daysBefore: 0, dayHour: 21 },
      { id: 'day-before', daysBefore: 1, dayHour: 22 },
    ],
  })

  assert.deepEqual(
    jobs.map(({ notificationId, scheduledAt }) => ({
      notificationId,
      scheduledAt: new Date(scheduledAt).toISOString(),
    })),
    [
      {
        notificationId: 'day-before',
        scheduledAt: '2026-01-07T13:00:00.000Z',
      },
      {
        notificationId: 'same-day',
        scheduledAt: '2026-01-08T12:00:00.000Z',
      },
    ],
  )
  assert.equal(jobs[0].body, '우유의 보관 기한이 1일 남았어요.')
  assert.equal(jobs[1].body, '우유의 보관 기한이 오늘까지예요.')
})

test('regenerates the schedule when storage days change', () => {
  const notificationTimes = [
    { id: 'same-day', daysBefore: 0, dayHour: 22 },
  ]
  const sevenDayJob = buildJobs({ notificationTimes })[0]
  const twoDayJob = buildJobs({ storageDays: 2, notificationTimes })[0]

  assert.equal(
    new Date(sevenDayJob.scheduledAt).toISOString(),
    '2026-01-08T13:00:00.000Z',
  )
  assert.equal(
    new Date(twoDayJob.scheduledAt).toISOString(),
    '2026-01-03T13:00:00.000Z',
  )
  assert.notEqual(sevenDayJob.id, twoDayJob.id)
})

test('excludes notification times that have already passed', () => {
  const jobs = buildJobs({
    notificationTimes: [
      { id: 'past', daysBefore: 0, dayHour: 21 },
      { id: 'future', daysBefore: 0, dayHour: 22 },
    ],
    now: Date.parse('2026-01-08T21:30:00+09:00'),
  })

  assert.deepEqual(jobs.map(({ notificationId }) => notificationId), ['future'])
})

test('removes deleted foods from the regenerated schedule', () => {
  const yogurt = {
    id: 'food-yogurt',
    name: '요거트',
    icon: '🥣',
    startDate: '2026-01-01',
  }
  const notificationTimes = [
    { id: 'same-day', daysBefore: 0, dayHour: 22 },
  ]
  const beforeDelete = buildJobs({
    foods: [MILK, yogurt],
    notificationTimes,
  })
  const afterDelete = buildJobs({
    foods: [yogurt],
    notificationTimes,
  })

  assert.deepEqual(
    beforeDelete.map(({ body }) => body),
    ['우유 외 1개의 보관 기한을 확인해 주세요.'],
  )
  assert.deepEqual(
    afterDelete.map(({ body }) => body),
    ['요거트의 보관 기한이 오늘까지예요.'],
  )
})

test('groups foods scheduled for the same time into one notification', () => {
  const foods = Array.from({ length: 10 }, (_, index) => ({
    id: `food-${index}`,
    name: index === 0 ? '우유' : `음식 ${index + 1}`,
    icon: index === 0 ? '🥛' : '🫙',
    startDate: '2026-01-01',
  }))

  const jobs = buildJobs({
    foods,
    notificationTimes: [
      { id: 'same-day', daysBefore: 0, dayHour: 22 },
    ],
  })

  assert.equal(jobs.length, 1)
  assert.equal(jobs[0].body, '우유 외 9개의 보관 기한을 확인해 주세요.')
  assert.match(jobs[0].id, new RegExp(`^group:${jobs[0].scheduledAt}:[a-z0-9]+$`))
})
