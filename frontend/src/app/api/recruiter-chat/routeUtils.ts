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
