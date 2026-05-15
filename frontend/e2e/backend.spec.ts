import { expect, test } from '@playwright/test'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000'

test.describe('Backend smoke', () => {
  test.skip(process.env.SKIP_BACKEND === '1', 'Backend disabled via SKIP_BACKEND=1')

  test('GET /health returns 200 + healthy db', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/health`)
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.data?.status ?? body.status).toBe('healthy')
  })

  test('GET / returns FastAPI root', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/`)
    expect([200, 404]).toContain(res.status())
  })

  test('login rejects bogus creds via backend', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/auth/login`, {
      data: { email: 'nope@nowhere.test', password: 'WrongPass123' },
      failOnStatusCode: false,
    })
    expect([400, 401, 422]).toContain(res.status())
  })
})
