#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'

const COMPOSE_FILE = '../docker-compose.yml'
const READY_TIMEOUT_MS = 120_000
const POLL_INTERVAL_MS = 1_000

const SKIP_DOCKER = process.env.SKIP_DOCKER === '1'
const KEEP_DOCKER = process.env.KEEP_DOCKER === '1'
const SKIP_MIGRATIONS = process.env.SKIP_MIGRATIONS === '1'

const TEST_ENV = {
  db_user: 'testuser',
  db_password: 'testpassword',
  db_host: 'localhost',
  db_port: '5433',
  db_name: 'rojgarai_test',
  test_db_user: 'testuser',
  test_db_password: 'testpassword',
  test_db_host: 'localhost',
  test_db_port: '5433',
  test_db_name: 'rojgarai_test',
  redis_url: 'redis://localhost:6380/0',
  qdrant_url: 'http://localhost:6335',
  test_qdrant_url: 'http://localhost:6335',
  environment: 'test',
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitUntil(label, check, timeoutMs = READY_TIMEOUT_MS) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await check()) {
      console.log(`[e2e]   ok ${label}`)
      return
    }
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error(`[e2e] Timeout waiting for ${label} after ${timeoutMs}ms`)
}

function checkPostgres() {
  return (
    spawnSync(
      'docker',
      ['exec', 'rojgarai-postgres-test', 'pg_isready', '-U', 'testuser', '-d', 'rojgarai_test'],
      { stdio: 'ignore' },
    ).status === 0
  )
}

function checkRedis() {
  const r = spawnSync('docker', ['exec', 'rojgarai-redis-test', 'redis-cli', 'ping'], {
    encoding: 'utf8',
  })
  return r.status === 0 && r.stdout.trim() === 'PONG'
}

async function checkQdrant() {
  try {
    const res = await fetch('http://localhost:6335/readyz', {
      signal: AbortSignal.timeout(2_000),
    })
    return res.ok
  } catch {
    return false
  }
}

function dockerUp() {
  console.log('[e2e] docker compose up -d ...')
  const r = spawnSync('docker', ['compose', '-f', COMPOSE_FILE, 'up', '-d'], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error('docker compose up failed (is Docker running?)')
}

function dockerDown() {
  if (KEEP_DOCKER) {
    console.log('[e2e] KEEP_DOCKER=1 — leaving containers running')
    return
  }
  console.log('[e2e] docker compose down ...')
  spawnSync('docker', ['compose', '-f', COMPOSE_FILE, 'down'], { stdio: 'inherit' })
}

function runMigrations() {
  console.log('[e2e] alembic upgrade head ...')
  const r = spawnSync('uv', ['run', 'alembic', 'upgrade', 'head'], {
    stdio: 'inherit',
    cwd: '../backend',
    env: { ...process.env, ...TEST_ENV },
  })
  if (r.status !== 0) throw new Error(`alembic upgrade failed (exit ${r.status})`)
}

function seedUsers() {
  console.log('[e2e] seeding deterministic users ...')
  const r = spawnSync('uv', ['run', 'python', 'scripts/seed_e2e.py'], {
    stdio: 'inherit',
    cwd: '../backend',
    env: { ...process.env, ...TEST_ENV },
  })
  if (r.status !== 0) throw new Error(`seed_e2e failed (exit ${r.status})`)
}

function runPlaywright() {
  return new Promise((resolve) => {
    const args = ['playwright', 'test', ...process.argv.slice(2)]
    const child = spawn('npx', args, {
      stdio: 'inherit',
      env: { ...process.env, ...TEST_ENV },
    })
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

async function main() {
  let code = 1
  try {
    if (!SKIP_DOCKER) {
      dockerUp()
      console.log('[e2e] waiting for test stack readiness ...')
      await waitUntil('postgres-test', checkPostgres)
      await waitUntil('redis-test', checkRedis)
      await waitUntil('qdrant-test', checkQdrant)
    } else {
      console.log('[e2e] SKIP_DOCKER=1 — skipping compose')
    }

    if (!SKIP_MIGRATIONS) {
      runMigrations()
      if (process.env.SKIP_SEED !== '1') seedUsers()
    }

    code = await runPlaywright()
  } catch (err) {
    console.error('[e2e]', err instanceof Error ? err.message : err)
    code = 1
  } finally {
    if (!SKIP_DOCKER) dockerDown()
  }
  process.exit(code)
}

main()
