import { expect, test } from '@playwright/test'

import { SEED, loginAs } from './helpers'

test.describe('Route guards', () => {
  test('old /candidate URLs go to My applications (sign-in when signed out)', async ({ page }) => {
    await page.goto('/candidate/jobs')
    await expect(page).toHaveURL(/\/(me\/applications|signin)/, { timeout: 10_000 })
  })

  test('unauth visiting /recruiter redirects to /login', async ({ page }) => {
    await page.goto('/recruiter')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('unauth visiting /recruiter/jobs redirects to /login', async ({ page }) => {
    await page.goto('/recruiter/jobs')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('candidate cannot reach recruiter routes', async ({ page }) => {
    await loginAs(page, SEED.candidateEmail)
    await expect(page).toHaveURL(/\/me\/applications/, { timeout: 10_000 })
    await page.goto('/recruiter/jobs')
    await expect(page).not.toHaveURL(/\/recruiter\/jobs/, { timeout: 10_000 })
  })
})
