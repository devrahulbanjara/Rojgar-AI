import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL
}

function upstreamUnavailableResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unable to reach backend service.'

  return Response.json(
    {
      success: false,
      message: `Recruiter chat backend is unavailable: ${message}`,
      data: null,
      errors: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: null,
      },
    },
    { status: 502 },
  )
}

export async function GET(req: NextRequest) {
  const backendBaseUrl = getBackendBaseUrl()

  if (!backendBaseUrl) {
    return new Response('NEXT_PUBLIC_API_URL is not configured.', { status: 500 })
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
  } catch (error) {
    return upstreamUnavailableResponse(error)
  }
}

export async function POST(req: NextRequest) {
  const backendBaseUrl = getBackendBaseUrl()

  if (!backendBaseUrl) {
    return new Response('NEXT_PUBLIC_API_URL is not configured.', { status: 500 })
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
  } catch (error) {
    return upstreamUnavailableResponse(error)
  }
}
