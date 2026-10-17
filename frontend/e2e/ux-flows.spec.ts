import { type Page, expect, test } from '@playwright/test'

import { SEED, loginAs } from './helpers'

// Flow regression tests for the shortest-path changes. They need the seeded
// demo data (backend/seed_data.py); tests skip when it is absent.
const DEMO_PASSWORD = 'Password@123'
const DEMO_CANDIDATE = 'aakriti.shrestha@gmail.com'
const DEMO_RECRUITER = 'priya.maharjan@f1soft.com'

/** Counts user clicks so step budgets are asserted, not just eyeballed. */
async function trackClicks(page: Page) {
  await page.evaluate(() => {
    ;(window as unknown as { __clicks: number }).__clicks = 0
    document.addEventListener(
      'click',
      () => (window as unknown as { __clicks: number }).__clicks++,
      true,
    )
  })
  return () => page.evaluate(() => (window as unknown as { __clicks: number }).__clicks)
}

test.describe('Shortest-path flows', () => {
  test('login ignores a backslash open-redirect in ?next', async ({ page }) => {
    await page.goto('/login?next=%2F%5Cevil.com')
    await loginAs(page, SEED.candidateEmail)
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/(candidate|onboarding)/, {
      timeout: 15_000,
    })
  })

  test('candidate applies to a job in two clicks', async ({ page }) => {
    await loginAs(page, DEMO_CANDIDATE, DEMO_PASSWORD)
    await page.waitForURL(/\/candidate/, { timeout: 15_000 }).catch(() => null)
    test.skip(!page.url().includes('/candidate'), 'seeded demo candidate not available')

    await page.goto('/candidate/jobs')
    const applyButton = page.getByRole('button', { name: /^Apply$/ }).first()
    await applyButton.waitFor({ timeout: 15_000 }).catch(() => null)
    test.skip(!(await applyButton.isVisible()), 'no open job left to apply to')

    const clicks = await trackClicks(page)
    await applyButton.click()
    await page.getByRole('button', { name: 'Submit application' }).click()
    await expect(page.getByText(/application submitted/i)).toBeVisible({ timeout: 15_000 })
    expect(await clicks()).toBe(2)
  })

  test('recruiter shortlists from the row in one click', async ({ page }) => {
    await loginAs(page, DEMO_RECRUITER, DEMO_PASSWORD)
    await page.waitForURL(/\/recruiter/, { timeout: 15_000 }).catch(() => null)
    test.skip(!page.url().includes('/recruiter'), 'seeded demo recruiter not available')

    await page.goto('/recruiter/jobs?filter=active')
    const firstJob = page.locator('[role="button"][tabindex="0"]').filter({ hasText: /Engineer/ })
    await firstJob
      .first()
      .waitFor({ timeout: 15_000 })
      .catch(() => null)
    test.skip((await firstJob.count()) === 0, 'no jobs for the demo company')
    await firstJob.first().click()

    const shortlistButtons = page.getByRole('button', { name: /^Shortlist (?!\d)/ })
    await page.getByRole('tab', { name: /Applied/ }).waitFor({ timeout: 15_000 })
    await shortlistButtons
      .first()
      .waitFor({ timeout: 10_000 })
      .catch(() => null)
    const before = await shortlistButtons.count()
    test.skip(before === 0, 'no candidates waiting in Applied')

    const clicks = await trackClicks(page)
    await shortlistButtons.first().click()
    await expect(shortlistButtons).toHaveCount(before - 1, { timeout: 10_000 })
    expect(await clicks()).toBe(1)
  })
})
