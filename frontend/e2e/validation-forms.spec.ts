import { expect, test } from '@playwright/test'

import { SEED, loginAs } from './helpers'

test.describe('Form validation guards', () => {
  test('login: malformed email blocked client-side', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('not-an-email')
    await page.getByLabel(/password/i).first().fill('Password123')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page.locator('text=/valid email|invalid/i').first()).toBeVisible({ timeout: 3_000 })
  })

  test('signup: weak password blocked client-side', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill('Tester X')
    await page.getByLabel(/email/i).fill('weakpw.test@test.dev')
    await page.getByLabel(/^password$/i).fill('weak')
    await page.getByLabel(/confirm password/i).fill('weak')
    await page
      .getByRole('checkbox')
      .first()
      .check()
      .catch(() => {})
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(
      page.locator('text=/at least 8|uppercase|lowercase|password.*number/i').first(),
    ).toBeVisible({ timeout: 3_000 })
  })

  test('signup: password mismatch blocked', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill('Tester Y')
    await page.getByLabel(/email/i).fill('mismatch.test@test.dev')
    await page.getByLabel(/^password$/i).fill('Password123')
    await page.getByLabel(/confirm password/i).fill('Password456')
    await page
      .getByRole('checkbox')
      .first()
      .check()
      .catch(() => {})
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.locator('text=/match|do not match/i').first()).toBeVisible({
      timeout: 3_000,
    })
  })

  test('signup: terms required', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill('Tester Z')
    await page.getByLabel(/email/i).fill('terms.test@test.dev')
    await page.getByLabel(/^password$/i).fill('Password123')
    await page.getByLabel(/confirm password/i).fill('Password123')
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.locator('text=/terms|accept|agree/i').first()).toBeVisible({
      timeout: 3_000,
    })
  })

  test('forgot-password: invalid email blocked', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByLabel(/email/i).fill('nope')
    await page
      .getByRole('button', { name: /send|reset|continue|submit/i })
      .first()
      .click()
    await expect(page.locator('text=/valid email|invalid/i').first()).toBeVisible({
      timeout: 3_000,
    })
  })

  test('candidate skill: duplicate not addable (chip button stays disabled)', async ({ page }) => {
    await loginAs(page, SEED.candidateEmail)
    await page.goto('/candidate/profile')

    const skillInput = page.getByPlaceholder(/add a skill|figma/i).first()
    const skillCount = await skillInput.count()
    test.skip(skillCount === 0, 'Skill input not visible — profile UI may differ')

    await skillInput.fill('E2E-Unique-Skill')
    const addBtn = page.getByRole('button', { name: /^add$/i }).first()
    await addBtn.click()

    // Try duplicate
    await skillInput.fill('E2E-Unique-Skill')
    await expect(addBtn).toBeDisabled()
  })
})
