import { expect, test } from '@playwright/test'

import { SEED, expectLoggedInAsCandidate, loginAs } from './helpers'

test.describe('Auth flow (real backend)', () => {
  test('seeded candidate logs in → lands on /candidate', async ({ page }) => {
    await loginAs(page, SEED.candidateEmail)
    await expectLoggedInAsCandidate(page)
  })

  test('wrong password rejected with API error', async ({ page }) => {
    await loginAs(page, SEED.candidateEmail, 'WrongPass999')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('text=/invalid|incorrect|wrong|failed/i').first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test('email normalization — mixed case logs in as lowercase', async ({ page }) => {
    const mixed = SEED.candidateEmail.toUpperCase()
    await loginAs(page, mixed)
    await expectLoggedInAsCandidate(page)
  })

  test('duplicate signup blocked', async ({ request }) => {
    const res = await request.post('http://localhost:8000/auth/signup', {
      data: {
        full_name: 'Dup',
        email: SEED.candidateEmail,
        password: SEED.password,
        primary_role: 'candidate',
      },
      failOnStatusCode: false,
    })
    expect([400, 409, 422]).toContain(res.status())
  })

  test('logout clears session — re-visiting candidate area redirects to login', async ({
    page,
    context,
  }) => {
    await loginAs(page, SEED.candidateEmail)
    await expectLoggedInAsCandidate(page)
    await context.clearCookies()
    await page.goto('/candidate')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
