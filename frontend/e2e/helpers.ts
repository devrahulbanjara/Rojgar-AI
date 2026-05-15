import { type Page, expect } from '@playwright/test'

export const SEED = {
  candidateEmail: 'e2e.candidate@test.dev',
  candidateFreshEmail: 'e2e.candidate.fresh@test.dev',
  recruiterEmail: 'e2e.recruiter@test.dev',
  password: 'Password123',
}

export async function loginAs(page: Page, email: string, password = SEED.password) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page
    .getByLabel(/password/i)
    .first()
    .fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
}

export async function expectLoggedInAsCandidate(page: Page) {
  await expect(page).toHaveURL(/\/candidate/, { timeout: 10_000 })
}

export async function expectLoggedInAsRecruiter(page: Page) {
  await expect(page).toHaveURL(/\/recruiter/, { timeout: 10_000 })
}
