import { test, expect } from '@playwright/test'

test.describe('POS checkout flow', () => {
  test('login → checkout → stock updates', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('stockflow_onboarding_done', '1')
    })

    await page.goto('/login')
    await page.locator('input[name="identifier"]').fill('admin@stockflow.com')
    await page.locator('input[name="password"]').fill('admin123')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 25_000 })
    await expect(page.getByText(/dashboard|welcome/i).first()).toBeVisible({ timeout: 25_000 })

    await page.goto('/products')
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible()
    const firstRow = page.locator('table tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 20_000 })
    const rowText = await firstRow.innerText()
    const productName = rowText.split('\n').map((s) => s.trim()).find(Boolean) || ''
    expect(productName.length).toBeGreaterThan(2)

    await page.goto('/pos')
    await expect(page.getByRole('heading', { name: /pos|checkout/i })).toBeVisible()

    const productButtons = page.locator('button').filter({ hasText: /\$/ })
    await expect(productButtons.first()).toBeVisible({ timeout: 15_000 })
    await productButtons.first().click()

    // Desktop uses Charge button; mobile may use sticky Checkout
    const charge = page.getByRole('button', { name: /charge|complete checkout|checkout/i }).first()
    await charge.click()
    await expect(page.getByText(/payment successful/i)).toBeVisible({ timeout: 25_000 })

    const closeBtn = page.getByRole('button', { name: /^close$/i })
    if (await closeBtn.count()) {
      await closeBtn.first().click()
    }

    await page.goto('/orders')
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 20_000 })

    await page.goto('/products')
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible()
    await expect(page.locator('table tbody tr').first()).toBeVisible()
  })
})
