import { test, expect } from '@playwright/test';

test('landing page lists showcases and links werkt-tiles through to their pipeline', async ({ page }) => {
  await page.goto('/');

  const werktTile = page.getByRole('link', { name: /Hoofdstuk 01/ });
  await expect(werktTile).toBeVisible();

  await werktTile.click();
  await expect(page).toHaveURL(/\/hoofdstuk\/01$/);
  await expect(page.getByRole('heading', { name: /Hoofdstuk 01/ })).toBeVisible();
});

test('a binnenkort tile is not clickable', async ({ page }) => {
  await page.goto('/');

  const binnenkortTile = page.locator('.tile[data-clickable="false"]').first();
  await expect(binnenkortTile).toBeVisible();
  await expect(binnenkortTile).not.toHaveAttribute('href', /.+/);
});
