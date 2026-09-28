# 홍익냉장고 알림 백엔드

회원가입 없이 사용하는 홍익냉장고 PWA의 Web Push 백엔드입니다.

- 운영 API: `https://hongik-fridge-api.hongikfridge.workers.dev`
- 실행 환경: Cloudflare Workers
- 저장소: Cloudflare D1
- 발송 대기열: Cloudflare Queues
- 스케줄 실행: Cron Trigger, 매분
- 푸시 규격: Web Push + VAPID

## 알림 처리 흐름

1. 프론트엔드가 푸시 구독과 전체 알림 일정을 `PUT /api/notification-state`로 동기화합니다.
2. 서버는 구독·일정을 하나의 D1 배치로 교체하고 새 `notificationVersion`을 발급합니다.
3. Cron Trigger가 매분 발송 시각이 지난 작업을 기본 Queue에 넣습니다.
4. Queue Consumer가 작업의 버전과 활성 상태를 다시 확인한 뒤 푸시를 발송합니다.
5. 일시적인 푸시 오류는 지수 백오프로 재시도합니다.
6. 재시도 한도를 초과한 메시지는 DLQ로 이동해 D1과 Workers Logs에 기록됩니다.

사용자가 알림을 끄거나 시간을 변경하면 `notificationVersion`이 바뀝니다. 이전 버전의 Queue 메시지는 새 작업을 점유하거나 완료·실패 처리할 수 없습니다.

## API

### 상태 조회

- `GET /health` — Worker 기본 상태
- `GET /api/vapid-public-key` — 공개 VAPID 키
- `GET /api/notification-health` — 최근 24시간 DLQ·발송 실패 및 지연 작업 요약

`GET /api/notification-health`는 최근 24시간 DLQ 기록이 있거나 2분 이상 지연된 대기 작업이 있으면 `503`을 반환합니다. 정상일 때 응답 예시는 다음과 같습니다.

```json
{
  "ok": true,
  "deadLetters24h": 0,
  "lastDeadLetterAt": null,
  "failedJobs24h": 0,
  "overdueJobs": 0,
  "oldestOverdueAt": null
}
```

### 알림 동기화

- `PUT /api/notification-state` — 푸시 구독과 전체 알림 일정을 하나의 요청으로 교체
- `DELETE /api/notifications` — 기기의 구독과 예약 알림을 모두 삭제하고 알림 비활성화

다음 API는 이전 프론트엔드와의 호환성을 위해 유지합니다.

- `POST /api/subscriptions`
- `DELETE /api/subscriptions`
- `PUT /api/jobs`
- `DELETE /api/jobs`

변경 API에는 IP와 기기 ID 기준 Cloudflare Rate Limiting이 적용됩니다.

- IP: 분당 300회
- 기기 ID: 분당 30회
- 초과 응답: `429 Too Many Requests`, `Retry-After: 60`

## Queue와 DLQ

- 기본 Queue: `hongik-fridge-notifications`
- DLQ: `hongik-fridge-notifications-dlq`
- 기본 Queue 재시도: 최대 3회
- DLQ D1 기록 재시도: 5분 간격, 최대 20회

DLQ Consumer는 메시지를 `notification_dead_letters`에 기록한 뒤에만 확인 처리합니다. Queue 메시지 ID에 고유 제약이 있어 동일 메시지가 다시 전달돼도 중복 저장되지 않습니다.

DLQ가 발생하면 Workers Logs에 다음 이벤트가 오류 수준으로 기록됩니다.

```json
{
  "event": "notification_dead_letter",
  "queue": "hongik-fridge-notifications-dlq",
  "recorded": 1,
  "failedAt": 0
}
```

## 로컬 개발

```bash
npm install
cp .dev.vars.example .dev.vars
npx web-push generate-vapid-keys
npm run db:migrate:local
npm run dev
```

`.dev.vars`에 다음 값을 설정합니다. 이 파일은 Git에 포함하지 않습니다.

```text
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:...
```

검증 명령:

```bash
npm test
npm run deploy:check
```

## 배포

```bash
npx wrangler login
npm run db:migrate:remote
npm run deploy
```

최초 환경에서는 VAPID 비밀 값을 등록해야 합니다.

```bash
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_SUBJECT
```

D1, Cron Trigger, Queue Producer와 두 Queue Consumer 설정은 `wrangler.jsonc`에서 관리합니다. 운영 프론트엔드 주소를 변경하면 `ALLOWED_ORIGINS`도 함께 갱신해야 합니다.
