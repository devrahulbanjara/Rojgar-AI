import type { NextRequest } from 'next/server'

import {
  getRecruiterChatBackendBaseUrl,
  recruiterChatMisconfiguredResponse,
  recruiterChatUnavailableResponse,
} from '../routeUtils'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const backendBaseUrl = getRecruiterChatBackendBaseUrl()

  if (!backendBaseUrl) {
    return recruiterChatMisconfiguredResponse()
  }

  const authorization = req.headers.get('authorization')
  const cookie = req.headers.get('cookie')

  try {
    const response = await fetch(`${backendBaseUrl}/recruiter-chat/sessions`, {
      method: 'GET',
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

export async function POST(req: NextRequest) {
  const backendBaseUrl = getRecruiterChatBackendBaseUrl()

  if (!backendBaseUrl) {
    return recruiterChatMisconfiguredResponse()
  }

  const authorization = req.headers.get('authorization')
  const cookie = req.headers.get('cookie')

  try {
    const response = await fetch(`${backendBaseUrl}/recruiter-chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({}),
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
