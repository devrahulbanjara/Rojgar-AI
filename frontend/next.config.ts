import type { NextConfig } from 'next'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

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

const backendEnvPath = path.resolve(process.cwd(), '../backend/.env')
const s3BucketName = process.env.S3_BUCKET_NAME ?? readEnvValue(backendEnvPath, 'S3_BUCKET_NAME')
const awsRegion =
  process.env.AWS_REGION ?? readEnvValue(backendEnvPath, 'AWS_REGION') ?? 'us-east-1'

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  {
    protocol: 'https',
    hostname: 'lh3.googleusercontent.com',
    port: '',
    pathname: '/**',
    search: '',
  },
  {
    protocol: 'https',
    hostname: 'api.dicebear.com',
    port: '',
    pathname: '/9.x/**',
    search: '',
  },
  {
    protocol: 'https',
    hostname: 'stories.freepiklabs.com',
    port: '',
    pathname: '/storage/**',
    search: '',
  },
]

if (s3BucketName) {
  remotePatterns.push({
    protocol: 'https',
    hostname: `${s3BucketName}.s3.${awsRegion}.amazonaws.com`,
    port: '',
    pathname: '/**',
    search: '',
  })

  remotePatterns.push({
    protocol: 'https',
    hostname: 's3.amazonaws.com',
    port: '',
    pathname: `/${s3BucketName}/**`,
    search: '',
  })
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

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
}

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) assertPublicBackendUrl()
  return nextConfig
}
