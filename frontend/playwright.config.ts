import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PORT ?? 3000)
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`
const BACKEND_PORT = Number(process.env.BACKEND_PORT ?? 8000)
const BACKEND_URL = process.env.BACKEND_URL ?? `http://localhost:${BACKEND_PORT}`
const SKIP_BACKEND = process.env.SKIP_BACKEND === '1'

// Backend env overrides: point at docker-compose test stack so cloud DBs
// stay untouched during E2E. Matches ports in ../docker-compose.yml.
const backendTestEnv = {
  environment: 'test',
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
} as const

const backendServer = {
  command: `uv run fastapi dev main.py --port ${BACKEND_PORT}`,
  url: `${BACKEND_URL}/health`,
  cwd: '../backend',
  reuseExistingServer: !process.env.CI,
  timeout: 180_000,
  stdout: 'pipe' as const,
  stderr: 'pipe' as const,
  env: backendTestEnv,
}

const frontendServer = {
  command: 'npm run dev',
  url: BASE_URL,
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
}

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/global-*.ts', '**/run-e2e.mjs'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {
      'x-e2e-test': '1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: SKIP_BACKEND ? [frontendServer] : [backendServer, frontendServer],
})
