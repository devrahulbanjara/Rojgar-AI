import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = ['/', '/login', '/signup', '/forgot-password']

for (const path of PAGES) {
  test(`a11y — ${path} has no critical axe violations`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()

    const critical = results.violations.filter((v) => v.impact === 'critical')
    const serious = results.violations.filter((v) => v.impact === 'serious')

    if (serious.length > 0) {
      console.warn(
        `[a11y ${path}] non-blocking serious issues:`,
        serious.map((v) => `${v.id} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`).join(', '),
      )
    }

    if (critical.length > 0) {
      console.error(
        `[a11y ${path}] critical violations:`,
        JSON.stringify(
          critical.map((v) => ({ id: v.id, nodes: v.nodes.length, help: v.help })),
          null,
          2,
        ),
      )
    }
    expect(critical).toEqual([])
  })
}

test('skip-to-content link appears on first Tab', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.locator('.skip-to-content')
  await expect(skip).toBeFocused()
})
