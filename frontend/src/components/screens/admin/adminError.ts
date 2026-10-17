import { parseApiError } from '@/lib/apiError'

/** The server's message for a failed staff action, or a plain fallback. */
export function adminError(error: unknown): string {
  return parseApiError(error, {}, "That didn't work. Try again.").message
}
