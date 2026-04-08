import type { NextRequest } from 'next/server'

import {
  getRecruiterChatBackendBaseUrl,
  recruiterChatMisconfiguredResponse,
  recruiterChatUnavailableResponse,
} from '../../routeUtils'

export const runtime = 'nodejs'

export async function DELETE(
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

  try {
    const response = await fetch(`${backendBaseUrl}/recruiter-chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        ...(authorization ? { Authorization: authorization } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      credentials: 'include',
    })

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
