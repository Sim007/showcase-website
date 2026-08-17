import { test, expect } from '@playwright/test';

// Regressietest voor de swimlanes: scenario 01 heeft 2 pipelines
// (payment/order) die elk als eigen horizontale rij over alle
// omgevingskolommen lopen, zodat bv. alle 'Order'-stappen altijd op
// dezelfde hoogte beginnen. Er is geen apart 'Keten'-milieu — de
// deelsysteem-onafhankelijke stappen (#28/#29) vormen hun eigen swimlane,
// direct onder de order-swimlane.

test('graph shows one swimlane per deelsysteem, aligned across every omgeving column', async ({ page }) => {
  await page.goto('/scenario/01');
  await expect(page.locator('.graph-row-header')).toBeVisible();
  await expect(page.locator('.col-head')).toHaveText(['Pipeline', 'Code', 'CI', 'Test', 'Acceptatie']);

  const laneLabels = await page.locator('.lane-label h5').allTextContents();
  expect(laneLabels).toEqual(['Payment', 'Order', 'Order + Payment']);

  await expect(page.locator('.swimlane.ds-keten')).toBeVisible();
  await expect(page.locator('.swimlane.ds-keten').getByText('omgeving compleet?')).toBeVisible();
});

test('deelsystemen-banner shows both subsystems at a glance, both ticked', async ({ page }) => {
  await page.goto('/scenario/01');
  const banner = page.locator('.deelsystemen-banner');
  await expect(banner.locator('.ds-pill')).toHaveText(['Payment', 'Order']);
  // Default is "alles in beeld" — beide vakjes staan aan zonder dat je klikt.
  await expect(banner.getByRole('checkbox', { name: 'Payment' })).toBeChecked();
  await expect(banner.getByRole('checkbox', { name: 'Order' })).toBeChecked();
});

test('een deelsysteem uitvinken verbergt die swimlane, opnieuw aanvinken toont hem weer', async ({ page }) => {
  await page.goto('/scenario/01');
  const paymentPill = page.locator('.deelsystemen-banner .ds-pill', { hasText: 'Payment' });
  const paymentVakje = paymentPill.getByRole('checkbox');

  await expect(page.locator('.swimlane.ds-payment')).toBeVisible();

  await paymentVakje.uncheck();
  await expect(page.locator('.swimlane.ds-payment')).toHaveCount(0);
  await expect(page.locator('.swimlane.ds-order')).toBeVisible();
  await expect(paymentPill).toHaveClass(/ds-pill-off/);

  await paymentVakje.check();
  await expect(page.locator('.swimlane.ds-payment')).toBeVisible();
  await expect(paymentPill).not.toHaveClass(/ds-pill-off/);
});

test('rapport-knop leidt naar een losse rapportpagina met Deelsysteem-kolom', async ({ page }) => {
  await page.goto('/scenario/01');
  await expect(page.locator('.report-table')).toHaveCount(0);

  await page.getByRole('link', { name: 'Rapport' }).click();
  await expect(page).toHaveURL(/\/scenario\/01\/rapport$/);

  const table = page.locator('.report-table');
  await expect(table).toBeVisible();
  await expect(table.locator('th', { hasText: 'Deelsysteem' })).toBeVisible();

  const firstRow = table.locator('tbody tr').first();
  await expect(firstRow.locator('td.deelsysteem')).toHaveText('Payment');

  await page.getByRole('link', { name: /scenario 01/ }).click();
  await expect(page).toHaveURL(/\/scenario\/01$/);
});
