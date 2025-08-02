import { test, expect } from './test-fixtures';
import type { Page } from '@playwright/test';

test.describe('Dashboard - Main Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display the main dashboard with all key elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle("AWS Migration Tracker");
    
    // Check header elements
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByText(/AWS Dashboard/i).first()).toBeVisible();
    
    // Check navigation sidebar
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /spas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /microservices/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /teams/i })).toBeVisible();
    
    // Check main content area
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should display dashboard statistics cards', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid*="stat"], .card', { timeout: 10000 });
    
    // Check for statistics cards - look for card elements
    const cards = page.locator('.card, [role="region"]');
    await expect(cards.first()).toBeVisible();
    
    // Look for numeric values (statistics)
    const numbers = page.locator('text=/\\d+/');
    await expect(numbers.first()).toBeVisible();
    
    // Check for percentage indicators
    const percentages = page.locator('text=/%/');
    if (await percentages.count() > 0) {
      await expect(percentages.first()).toBeVisible();
    }
  });

  test('should display the team progress chart', async ({ page }) => {
    // Wait for chart to load
    await page.waitForSelector('[data-chart], .recharts-wrapper, svg', { timeout: 15000 });
    
    // Check for chart container
    const chartContainer = page.locator('[data-chart], .recharts-wrapper').first();
    await expect(chartContainer).toBeVisible();
    
    // Check for SVG chart elements
    const chartSvg = page.locator('svg').first();
    await expect(chartSvg).toBeVisible();
    
    // Check for chart title
    await expect(page.getByText(/team progress/i)).toBeVisible();
    
    // Check for chart legend
    const legend = page.locator('[class*="legend"], [role="img"]');
    if (await legend.count() > 0) {
      await expect(legend.first()).toBeVisible();
    }
  });

  test('should have working theme toggle', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.getByRole('button').filter({ 
      has: page.locator('[class*="sun"], [class*="moon"], [data-testid*="theme"]') 
    }).first();
    
    if (await themeToggle.count() > 0) {
      // Get initial theme state
      const initialBodyClass = await page.locator('body').getAttribute('class');
      
      // Click theme toggle
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
      
      // Check if theme changed
      const newBodyClass = await page.locator('body').getAttribute('class');
      expect(newBodyClass).not.toBe(initialBodyClass);
    }
  });

  test('should have working navigation', async ({ page }) => {
    // Test navigation to SPAs page
    await page.getByRole('link', { name: /spas/i }).click();
    await expect(page).toHaveURL(/.*spas.*/);
    await expect(page.getByText(/spa/i)).toBeVisible();
    
    // Navigate back to overview
    await page.getByRole('link', { name: /overview/i }).click();
    await expect(page).toHaveURL(/.*(?:\/|dashboard)$/);
    
    // Test navigation to microservices
    await page.getByRole('link', { name: /microservices/i }).click();
    await expect(page).toHaveURL(/.*microservices.*/);
    
    // Test navigation to teams
    await page.getByRole('link', { name: /teams/i }).click();
    await expect(page).toHaveURL(/.*teams.*/);
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Navigate to a fresh page and check for loading indicators
    await page.reload();
    
    // The page should not show error states
    const errorElements = page.locator('text=/error|failed|not found/i');
    const errorCount = await errorElements.count();
    expect(errorCount).toBe(0);
    
    // Check that content eventually loads
    await page.waitForSelector('[data-chart], .card, [role="main"]', { timeout: 15000 });
  });
});