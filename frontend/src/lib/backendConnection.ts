const CONNECTION_RELATED_STATUSES = new Set([502, 503, 504])

export const LIVE_DATA_UNAVAILABLE_MESSAGE =
  'Live data is temporarily unavailable. Please try again in a moment.'

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error && error.message) return error.message

  if (error && typeof error === 'object') {
    const errorRecord = error as {
      message?: unknown
      data?: { message?: unknown }
    }

    if (typeof errorRecord.message === 'string') return errorRecord.message
    if (typeof errorRecord.data?.message === 'string') return errorRecord.data.message
  }

  return undefined
}

export function isBackendConnectionStatus(status: number | string | undefined): boolean {
  return (
    status === 'FETCH_ERROR' ||
    status === 'TIMEOUT_ERROR' ||
    (typeof status === 'number' && CONNECTION_RELATED_STATUSES.has(status))
  )
}

export function isBackendConnectionIssue(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number | string }).status
    if (isBackendConnectionStatus(status)) return true
  }

  const message = getErrorMessage(error)?.toLowerCase()
  if (!message) return false

  return (
    message.includes('live data is temporarily unavailable') ||
    message.includes('unable to reach') ||
    message.includes('failed to fetch') ||
    message.includes('load failed') ||
    message.includes('networkerror') ||
    message.includes('status 502') ||
    message.includes('status 503') ||
    message.includes('status 504')
  )
}
