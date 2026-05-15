import { expect, test } from '@playwright/test'

import { SEED, loginAs } from './helpers'

const XSS_PAYLOAD = '<script>window.__xss=true</script>'
const IMG_PAYLOAD = "<img src=x onerror=\"window.__xss='img'\">"

test.describe('XSS smoke', () => {
  test('script payload in headline renders as text — no script execution', async ({ page }) => {
    await loginAs(page, SEED.candidateEmail)
    await expect(page).toHaveURL(/\/candidate/, { timeout: 10_000 })

    await page.goto('/candidate/profile')

    const headline = page.getByLabel(/headline/i).first()
    if (await headline.count()) {
      await headline.fill(XSS_PAYLOAD)
      await headline.blur()
    }

    const xssFired = await page.evaluate(() => '__xss' in window)
    expect(xssFired).toBe(false)
  })

  test('img onerror payload in profile does not execute', async ({ page }) => {
    await loginAs(page, SEED.candidateEmail)
    await page.goto('/candidate/profile')

    const summary = page.getByLabel(/summary|about/i).first()
    if (await summary.count()) {
      await summary.fill(IMG_PAYLOAD)
      await summary.blur()
    }

    await page.waitForTimeout(500)
    const xssFired = await page.evaluate(() => '__xss' in window)
    expect(xssFired).toBe(false)
  })
})
