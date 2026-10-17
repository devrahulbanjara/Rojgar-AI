import { expect, test } from '@playwright/test'

test.describe('Public smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Rojgar AI/i)
  })

  test('login page renders required fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i).first()).toBeVisible()
  })

  test('signup page renders', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('form')).toBeVisible()
  })

  test('forgot-password page renders', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('not-found page renders for unknown route', async ({ page }) => {
    const response = await page.goto('/definitely-not-a-real-page-xyz')
    expect(response?.status()).toBe(404)
    await expect(page.getByText(/couldn'?t find/i)).toBeVisible()
  })
})

test.describe('Auth validation', () => {
  test('login rejects malformed email', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('not-an-email')
    await page
      .getByLabel(/password/i)
      .first()
      .fill('Aa1aaaaa')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page.locator('text=/valid email|invalid/i').first()).toBeVisible({ timeout: 3000 })
  })

  test('signup blocks weak password', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
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
    ).toBeVisible({ timeout: 3000 })
  })
})
