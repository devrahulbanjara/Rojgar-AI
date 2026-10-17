import { LIVE_DATA_UNAVAILABLE_MESSAGE } from '@/lib/backendConnection'

export function getRecruiterChatBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL
}

function buildUnavailablePayload() {
  return {
    success: false,
    message: LIVE_DATA_UNAVAILABLE_MESSAGE,
    data: null,
    errors: null,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: null,
    },
  }
}

export function recruiterChatUnavailableResponse() {
  return Response.json(buildUnavailablePayload(), { status: 502 })
}

export function recruiterChatMisconfiguredResponse() {
  return Response.json(buildUnavailablePayload(), { status: 500 })
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Session ids are interpolated into backend URLs; accept only UUIDs. */
export function isValidSessionId(sessionId: string): boolean {
  return UUID_PATTERN.test(sessionId)
}

export function invalidSessionIdResponse() {
  return Response.json(
    { ...buildUnavailablePayload(), message: 'Invalid chat session id.' },
    { status: 400 },
  )
}
