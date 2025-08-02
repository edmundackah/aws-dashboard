import { test as setup, expect } from './test-fixtures';

const authFile = 'playwright/.auth/user.json';

setup('setup - check application health', async ({ page }) => {
  // Navigate to the main page
  await page.goto('/');
  
  // Wait for the page to load and verify basic elements are present
  await expect(page).toHaveTitle("AWS Migration Tracker");
  
  // Verify navigation elements are present
  await expect(page.getByRole('navigation')).toBeVisible();
  
  // Verify main content is loaded
  await expect(page.getByText(/overview/i)).toBeVisible();
  
  // Check that the application is fully hydrated (no loading states)
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Application health check passed');
});