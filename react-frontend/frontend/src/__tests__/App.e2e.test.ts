// Exemplo de teste E2E para React usando Playwright
import { test, expect } from '@playwright/test';
test('homepage tem título Shipping', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page).toHaveTitle(/shipping/i);
});
