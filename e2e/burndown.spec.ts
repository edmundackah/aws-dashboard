import { test, expect } from './test-fixtures';
import type { Page } from '@playwright/test';

// Mock burndown API data (new shape: planned and actual per service type)
const mockBurndownData = {
  data: {
    dev: [
      { date: "2024-01-01", ts: 1704067200000, spaActual: 150, msActual: 200, spaPlanned: 160, msPlanned: 210, combinedActual: 350, combinedPlanned: 370 },
      { date: "2024-02-01", ts: 1706745600000, spaActual: 120, msActual: 180, spaPlanned: 150, msPlanned: 200, combinedActual: 300, combinedPlanned: 350 },
      { date: "2024-03-01", ts: 1709251200000, spaActual: 80,  msActual: 120, spaPlanned: 120, msPlanned: 180, combinedActual: 200, combinedPlanned: 300 },
      { date: "2024-04-01", ts: 1711929600000, spaActual: 50,  msActual: 80,  spaPlanned: 90,  msPlanned: 150, combinedActual: 130, combinedPlanned: 240 },
      { date: "2024-05-01", ts: 1714521600000, spaActual: 20,  msActual: 40,  spaPlanned: 60,  msPlanned: 120, combinedActual: 60,  combinedPlanned: 180 },
      { date: "2024-06-01", ts: 1717200000000, spaActual: 0,   msActual: 0,   spaPlanned: 30,  msPlanned: 60,  combinedActual: 0,   combinedPlanned: 90 }
    ],
    sit: [
      { date: "2024-01-01", ts: 1704067200000, spaActual: 140, msActual: 190, spaPlanned: 150, msPlanned: 200, combinedActual: 330, combinedPlanned: 350 },
      { date: "2024-06-01", ts: 1717200000000, spaActual: 0,   msActual: 0,   spaPlanned: 20,  msPlanned: 50,  combinedActual: 0,   combinedPlanned: 70 }
    ],
    uat: [
      { date: "2024-01-01", ts: 1704067200000, spaActual: 130, msActual: 180, spaPlanned: 140, msPlanned: 190, combinedActual: 310, combinedPlanned: 330 },
      { date: "2024-06-01", ts: 1717200000000, spaActual: 0,   msActual: 0,   spaPlanned: 10,  msPlanned: 20,  combinedActual: 0,   combinedPlanned: 30 }
    ],
    nft: [
      { date: "2024-01-01", ts: 1704067200000, spaActual: 120, msActual: 170, spaPlanned: 130, msPlanned: 180, combinedActual: 290, combinedPlanned: 310 },
      { date: "2024-06-01", ts: 1717200000000, spaActual: 0,   msActual: 0,   spaPlanned: 5,   msPlanned: 10,  combinedActual: 0,   combinedPlanned: 15 }
    ]
  },
  targets: { dev: "2024-06-01", sit: "2024-06-01", uat: "2024-06-01", nft: "2024-06-01" }
};

test.describe('Burndown Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the burndown API endpoint - use a wildcard pattern to catch any URL
    await page.route('**/burndown-data', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockBurndownData) })
    );

    // Navigate to burndown page
    await page.goto('/burndown');
    await page.waitForLoadState('networkidle');
  });

  test('should display the burndown page with correct title', async ({ page }) => {
    await expect(page).toHaveTitle("AWS Migration Tracker");
    // Check that we're on the burndown page by looking for environment label
    await expect(page.getByText(/dev/i).first()).toBeVisible();
  });

  test('should display the status explainer button', async ({ page }) => {
    const statusButton = page.getByRole('button', { name: /status & planned vs actual/i });
    await expect(statusButton).toBeVisible();
  });

  test('should open status explainer popover on desktop', async ({ page }) => {
    const statusButton = page.getByRole('button', { name: /status & planned vs actual/i });
    await statusButton.click();
    const popover = page.locator('[role="dialog"], [data-slot="popover-content"], .radix-popover-content');
    await expect(popover.first()).toBeVisible();
    await expect(page.getByText(/completed/i)).toBeVisible();
    await expect(page.getByText(/on track/i)).toBeVisible();
    await expect(page.getByText(/at risk/i)).toBeVisible();
    await expect(page.getByText(/target missed/i)).toBeVisible();
  });

  test('should display environment summary cards', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 15000 });
    const envCards = page.locator('[data-slot="card"]').first();
    await expect(envCards).toBeVisible();
    await expect(page.getByText(/dev/i)).toBeVisible();
    await expect(page.getByText(/sit/i)).toBeVisible();
    await expect(page.getByText(/uat/i)).toBeVisible();
    await expect(page.getByText(/nft/i)).toBeVisible();
    await expect(page.getByText(/target:/i)).toBeVisible();
  });

  test('should display progress bars in environment cards', async ({ page }) => {
    await page.waitForSelector('[role="progressbar"]', { timeout: 15000 });
    const progressBars = page.locator('[role="progressbar"]');
    expect(await progressBars.count()).toBeGreaterThan(0);
  });

  test('should display burndown chart cards', async ({ page }) => {
    await page.waitForSelector('.recharts-wrapper', { timeout: 15000 });
    const charts = page.locator('.recharts-wrapper');
    expect(await charts.count()).toBeGreaterThan(0);
  });

  test('should display charts with SVG elements', async ({ page }) => {
    await page.waitForSelector('svg', { timeout: 15000 });
    const chartSvgs = page.locator('svg');
    expect(await chartSvgs.count()).toBeGreaterThan(0);
  });

  test('should display chart tooltips on hover', async ({ page }) => {
    await page.waitForSelector('.recharts-wrapper', { timeout: 15000 });
    const chartArea = page.locator('.recharts-wrapper').first();
    const box = await chartArea.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200);
      const tooltip = page.locator('.recharts-tooltip-wrapper');
      expect(await tooltip.count()).toBeGreaterThan(0);
    }
  });

  test('should display correct status badges', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 15000 });
    const statusBadges = page.locator('[class*="badge"], [data-slot="badge"]');
    expect(await statusBadges.count()).toBeGreaterThan(0);
  });

  test('should handle responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText(/dev/i).first()).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should display correct environment data', async ({ page }) => {
    await page.waitForSelector('[data-slot="card"]', { timeout: 15000 });
    const envNames = ['DEV', 'SIT', 'UAT', 'NFT'];
    for (const envName of envNames) {
      await expect(page.getByText(envName, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText(/target:/i)).toBeVisible();
  });

  test('should handle navigation from burndown page', async ({ page }) => {
    await page.getByText(/^Overview$/i).click();
    await page.waitForLoadState('networkidle');
    await page.getByText(/^Burndown$/i).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/dev/i).first()).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    await page.route('**/burndown-data', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal Server Error' }) }));
    await page.reload();
    await expect(page.getByText(/Failed to load burndown data/i)).toBeVisible();
  });

  test('should handle empty data gracefully', async ({ page }) => {
    await page.route('**/burndown-data', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {}, targets: {} }) }));
    await page.reload();
    await expect(page.getByText(/No burndown data available/i)).toBeVisible();
  });
});
