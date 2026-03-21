import type { NextRequest } from 'next/server'

import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime'
import { LangGraphHttpAgent } from '@ag-ui/langgraph'

export const runtime = 'nodejs'

const serviceAdapter = new ExperimentalEmptyAdapter()

function getBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL
}

export const POST = async (req: NextRequest) => {
  const backendBaseUrl = getBackendBaseUrl()

  if (!backendBaseUrl) {
    return new Response('NEXT_PUBLIC_API_URL is not configured.', { status: 500 })
  }

  const authorization = req.headers.get('authorization')
  const cookie = req.headers.get('cookie')

  const runtimeInstance = new CopilotRuntime({
    agents: {
      recruiter_chat: new LangGraphHttpAgent({
        url: `${backendBaseUrl}/copilotkit`,
        headers: {
          ...(authorization ? { Authorization: authorization } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      }),
    },
  })

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: runtimeInstance,
    serviceAdapter,
    endpoint: '/api/copilotkit',
  })

  return handleRequest(req)
}
