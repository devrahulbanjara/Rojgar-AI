import type { NextRequest } from 'next/server'

import {
  getRecruiterChatBackendBaseUrl,
  invalidSessionIdResponse,
  isValidSessionId,
  recruiterChatMisconfiguredResponse,
  recruiterChatUnavailableResponse,
} from '../../../routeUtils'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const backendBaseUrl = getRecruiterChatBackendBaseUrl()

  if (!backendBaseUrl) {
    return recruiterChatMisconfiguredResponse()
  }

  const { sessionId } = await params
  if (!isValidSessionId(sessionId)) return invalidSessionIdResponse()
  const authorization = req.headers.get('authorization')
  const cookie = req.headers.get('cookie')
  const body = await req.text()

  try {
    const response = await fetch(
      `${backendBaseUrl}/recruiter-chat/sessions/${encodeURIComponent(sessionId)}/confirm-job-selection`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authorization ? { Authorization: authorization } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
        credentials: 'include',
        body,
      },
    )

    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch {
    return recruiterChatUnavailableResponse()
  }
}
