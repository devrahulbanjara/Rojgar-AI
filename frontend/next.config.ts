import type { NextConfig } from 'next'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

import { existsSync, readFileSync } from 'node:fs'

function readEnvValue(filePath: string, key: string): string | undefined {
  if (!existsSync(filePath)) return undefined

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const currentKey = trimmed.slice(0, separatorIndex).trim()
    if (currentKey !== key) continue

    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    return rawValue.replace(/^['"]|['"]$/g, '')
  }

  return undefined
}

/**
 * A production deploy without a public backend URL silently ships a site that
 * calls http://localhost:8000 from every visitor's browser (0 jobs, permanent
 * "Connection lost"). Fail the build instead. Enforced on Vercel production
 * builds, or anywhere with REQUIRE_PUBLIC_BACKEND_URL=1; local builds only warn.
 */
function assertPublicBackendUrl() {
  const url =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? readEnvValue('.env.local', 'NEXT_PUBLIC_BACKEND_URL')
  const problem = !url
    ? 'NEXT_PUBLIC_BACKEND_URL is not set'
    : /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url)
      ? `NEXT_PUBLIC_BACKEND_URL points at a local address (${url})`
      : null
  if (!problem) return

  const enforce =
    process.env.VERCEL_ENV === 'production' || process.env.REQUIRE_PUBLIC_BACKEND_URL === '1'
  if (enforce) throw new Error(`Refusing to build for production: ${problem}.`)
  console.warn(
    `[next.config] Warning: ${problem}. Fine for local builds, fatal on Vercel production.`,
  )
}

const backendOrigin = (() => {
  try {
    const url =
      process.env.NEXT_PUBLIC_BACKEND_URL ?? readEnvValue('.env.local', 'NEXT_PUBLIC_BACKEND_URL')
    return url ? new URL(url).origin : ''
  } catch {
    return ''
  }
})()

// Report-only first: enforce once the report stream is clean in production.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${backendOrigin}`.trim(),
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) assertPublicBackendUrl()
  return nextConfig
}
