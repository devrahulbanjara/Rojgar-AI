import { expect, test } from '@playwright/test'

test.describe('Form validation guards', () => {
  test('login: malformed email blocked client-side', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('not-an-email')
    await page
      .getByLabel(/password/i)
      .first()
      .fill('Password123')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page.locator('text=/valid email|invalid/i').first()).toBeVisible({
      timeout: 3_000,
    })
  })

  test('signup: weak password blocked client-side', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill('Tester X')
    await page.getByLabel(/work email/i).fill('weakpw.test@test.dev')
    await page.getByLabel(/^password$/i).fill('weak')
    await page.getByLabel(/company name/i).fill('Weak Password Co')
    await expect(page.getByLabel('Password rules')).toBeVisible()
    await page.getByRole('button', { name: /^create account$/i }).click()
    await expect(page.getByText('Use a stronger password.')).toBeVisible({ timeout: 3_000 })
  })

  test('signup: company name required', async ({ page }) => {
    await page.goto('/signup')
    await page.getByLabel(/full name/i).fill('Tester Y')
    await page.getByLabel(/work email/i).fill('nocompany.test@test.dev')
    await page.getByLabel(/^password$/i).fill('Password123')
    await page.getByRole('button', { name: /^create account$/i }).click()
    await expect(page.getByText('Enter your company name.')).toBeVisible({ timeout: 3_000 })
  })

  test('signup: invite link locks the company', async ({ page }) => {
    await page.goto('/signup?join=Acme%20Labs')
    await expect(page.getByRole('heading', { name: 'Join Acme Labs' })).toBeVisible()
    await expect(page.getByLabel(/company name/i)).toHaveAttribute('readonly', '')
    await expect(page.getByRole('button', { name: /ask to join acme labs/i })).toBeVisible()
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
})
