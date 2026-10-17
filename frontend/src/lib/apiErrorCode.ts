/** Machine-readable error code from a backend error envelope (`errors[0].code`), if any. */
export function apiErrorCode(err: unknown): string | undefined {
  const data = (err as { data?: { errors?: Array<{ code?: string } | null> | null } })?.data
  const first = data?.errors?.[0]
  return first?.code ?? undefined
}

/** HTTP status from an RTK Query error, if any. */
export function apiErrorStatus(err: unknown): number | undefined {
  const status = (err as { status?: unknown })?.status
  return typeof status === 'number' ? status : undefined
}
