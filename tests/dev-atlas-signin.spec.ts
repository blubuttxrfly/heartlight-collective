import { test, expect } from '@playwright/test';

test('Atlas dev sign-in 111111111 / sovereign42', async ({ page }) => {
  await page.goto('http://127.0.0.1:5173/sign-in');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText('Welcome Back')).toBeVisible();

  await page.getByRole('button', { name: /Dev: Fill Atlas/ }).click();

  const cesInput = page.getByPlaceholder(/111111111/);
  const ppInput = page.locator('input[type="password"]').first();
  await expect(cesInput).toHaveValue('111111111');
  await expect(ppInput).toHaveValue('sovereign42');

  await page.getByRole('button', { name: /Enter Co-Creation Space/ }).click();

  await page.waitForURL('**/edit-profile', { timeout: 5000 });
  const session = await page.evaluate(() => localStorage.getItem('hlc_session_v2'));
  expect(session).toContain('111111111');
  expect(session).toContain('Atlas');
});
