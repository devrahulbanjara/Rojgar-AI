import type { NextRequest } from 'next/server'

import {
  getRecruiterChatBackendBaseUrl,
  recruiterChatMisconfiguredResponse,
  recruiterChatUnavailableResponse,
} from '../../../../routeUtils'

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
  const authorization = req.headers.get('authorization')
  const cookie = req.headers.get('cookie')
  const body = await req.text()

  try {
    const response = await fetch(
      `${backendBaseUrl}/recruiter-chat/sessions/${sessionId}/messages/stream`,
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

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'text/event-stream',
        'Cache-Control': response.headers.get('cache-control') ?? 'no-cache',
        Connection: response.headers.get('connection') ?? 'keep-alive',
      },
    })
  } catch {
    return recruiterChatUnavailableResponse()
  }
}
