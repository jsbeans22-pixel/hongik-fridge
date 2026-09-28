import { MAX_REQUEST_BYTES } from './constants.js'

export class HttpError extends Error {
  constructor(status, message, headers = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.headers = headers
  }
}

export function json(data, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  })
}

export async function readJson(request) {
  if (!request.body) throw new HttpError(400, '요청 본문이 필요합니다.')

  const reader = request.body.getReader()
  const chunks = []
  let size = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    size += value.byteLength
    if (size > MAX_REQUEST_BYTES) {
      await reader.cancel()
      throw new HttpError(413, '요청 본문이 너무 큽니다.')
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    throw new HttpError(400, '올바른 JSON 형식이 아닙니다.')
  }
}

function allowedOrigins(env) {
  return new Set(
    String(env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
}

export function getCorsHeaders(request, env) {
  const origin = request.headers.get('origin')
  if (!origin || !allowedOrigins(env).has(origin)) return {}

  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

export function assertAllowedOrigin(request, env) {
  const origin = request.headers.get('origin')
  if (origin && !allowedOrigins(env).has(origin)) {
    throw new HttpError(403, '허용되지 않은 출처입니다.')
  }
}

export function handleError(error, headers = {}) {
  if (error instanceof HttpError) {
    return json(
      { ok: false, error: error.message },
      { status: error.status, headers: { ...headers, ...error.headers } },
    )
  }

  console.error(JSON.stringify({
    event: 'request_error',
    message: error instanceof Error ? error.message : String(error),
  }))

  return json(
    { ok: false, error: '서버에서 요청을 처리하지 못했습니다.' },
    { status: 500, headers },
  )
}
