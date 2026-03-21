import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL
}

export async function GET(
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

  const response = await fetch(`${backendBaseUrl}/recruiter-chat/sessions/${sessionId}/history`, {
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
}
