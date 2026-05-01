import type { NextConfig } from 'next'

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

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
}

export default nextConfig
