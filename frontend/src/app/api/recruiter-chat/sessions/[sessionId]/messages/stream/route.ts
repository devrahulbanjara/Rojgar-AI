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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const backendBaseUrl = getBackendBaseUrl()

  if (!backendBaseUrl) {
    return new Response('NEXT_PUBLIC_API_URL is not configured.', { status: 500 })
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
        'Content-Type': response.headers.get('content-type') ?? 'application/x-ndjson',
        'Cache-Control': response.headers.get('cache-control') ?? 'no-cache, no-transform',
      },
    })
  } catch (error) {
    return upstreamUnavailableResponse(error)
  }
}
