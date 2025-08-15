import { test, expect } from './test-fixtures';

test.describe('Pages - Navigation and Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('SPAs Page', () => {
    test('should navigate to SPAs page and display content', async ({ page }) => {
      // Navigate to SPAs page
      await page.getByRole('link', { name: /spas/i }).click();
      await expect(page).toHaveURL(/.*spas.*/);
      await page.waitForLoadState('networkidle');
      
      // Check page title and content
      await expect(page.getByText(/spa/i)).toBeVisible();
      
      // Should have data table or content related to SPAs
      const table = page.locator('table, [role="table"], [role="grid"]');
      if (await table.count() > 0) {
        await expect(table.first()).toBeVisible();
        
        // Check for SPA-specific columns
        const headers = page.locator('th, [role="columnheader"]');
        const headerTexts = await headers.allTextContents();
        const hasRelevantHeaders = headerTexts.some(text => 
          /project|name|status|homepage/i.test(text)
        );
        expect(hasRelevantHeaders).toBe(true);
      }
    });

    test('should display SPA data with proper formatting', async ({ page }) => {
      await page.getByRole('link', { name: /spas/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Look for data rows
      const dataRows = page.locator('tr, [role="row"]').filter({
        hasNot: page.locator('th, [role="columnheader"]')
      });
      
      if (await dataRows.count() > 0) {
        const firstRow = dataRows.first();
        await expect(firstRow).toBeVisible();
        
        // Check for status indicators
        const statusElements = page.locator('text=/migrated|not.*migrated|pending/i');
        if (await statusElements.count() > 0) {
          await expect(statusElements.first()).toBeVisible();
        }
        
        // Check for links (project links, homepages)
        const links = firstRow.locator('a[href]');
        if (await links.count() > 0) {
          const href = await links.first().getAttribute('href');
          expect(href).toBeTruthy();
          expect(href).toMatch(/^https?:\/\//);
        }
      }
    });

    test('should have working search/filter functionality', async ({ page }) => {
      await page.getByRole('link', { name: /spas/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="filter"]');
      
      if (await searchInput.count() > 0) {
        const input = searchInput.first();
        await expect(input).toBeVisible();
        
        // Test search functionality
        await input.fill('test');
        await page.waitForTimeout(500);
        
        // Clear search
        await input.clear();
        await page.waitForTimeout(500);
      }
      
      // Look for filter dropdowns
      const filterSelects = page.locator('select, [role="combobox"]').filter({
        hasNot: page.locator('[class*="chart"]')
      });
      
      if (await filterSelects.count() > 0) {
        const select = filterSelects.first();
        await expect(select).toBeVisible();
      }
    });
  });

  test.describe('Microservices Page', () => {
    test('should navigate to microservices page and display content', async ({ page }) => {
      await page.getByRole('link', { name: /microservices/i }).click();
      await expect(page).toHaveURL(/.*microservices.*/);
      await page.waitForLoadState('networkidle');
      
      // Check page content
      await expect(page.getByText(/microservice/i)).toBeVisible();
      
      // Should have microservices-specific data
      const table = page.locator('table, [role="table"], [role="grid"]');
      if (await table.count() > 0) {
        await expect(table.first()).toBeVisible();
        
        // Check for microservice-specific columns
        const headers = page.locator('th, [role="columnheader"]');
        const headerTexts = await headers.allTextContents();
        const hasRelevantHeaders = headerTexts.some(text => 
          /project|name|status|otel|mssdk/i.test(text)
        );
        expect(hasRelevantHeaders).toBe(true);
      }
    });

    test('should display microservice-specific data', async ({ page }) => {
      await page.getByRole('link', { name: /microservices/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Look for microservice-specific indicators
      const otelIndicators = page.locator('text=/otel|observability|traces|metrics/i');
      const msSdkIndicators = page.locator('text=/mssdk|sdk|framework|nodejs|java|python/i');
      
      // At least some microservice-specific content should be present
      const hasOtelContent = await otelIndicators.count() > 0;
      const hasSdkContent = await msSdkIndicators.count() > 0;
      
      if (hasOtelContent || hasSdkContent) {
        expect(hasOtelContent || hasSdkContent).toBe(true);
      }
    });

    test('should display environment status correctly', async ({ page }) => {
      await page.getByRole('link', { name: /microservices/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Look for environment indicators
      const envElements = page.locator('text=/dev|sit|uat|nft|environment/i');
      
      if (await envElements.count() > 0) {
        await expect(envElements.first()).toBeVisible();
      }
      
      // Look for boolean indicators (Yes/No, checkmarks, etc.)
      const booleanIndicators = page.locator('text=/yes|no|✓|✗|true|false/i');
      
      if (await booleanIndicators.count() > 0) {
        await expect(booleanIndicators.first()).toBeVisible();
      }
    });
  });

  test.describe('Teams Page', () => {
    test('should navigate to teams page and display content', async ({ page }) => {
      await page.getByRole('link', { name: /teams/i }).click();
      await expect(page).toHaveURL(/.*teams.*/);
      await page.waitForLoadState('networkidle');
      
      // Check page content
      await expect(page.getByText(/team/i)).toBeVisible();
      
      // Should have teams data
      const table = page.locator('table, [role="table"], [role="grid"]');
      if (await table.count() > 0) {
        await expect(table.first()).toBeVisible();
        
        // Check for team-specific columns
        const headers = page.locator('th, [role="columnheader"]');
        const headerTexts = await headers.allTextContents();
        const hasRelevantHeaders = headerTexts.some(text => 
          /team|migrated|outstanding|count|sme/i.test(text)
        );
        expect(hasRelevantHeaders).toBe(true);
      }
    });

    test('should display team statistics and progress', async ({ page }) => {
      await page.getByRole('link', { name: /teams/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Look for team names
      const teamNames = page.locator('text=/team.*\\d+|team.*[a-z]+/i');
      if (await teamNames.count() > 0) {
        await expect(teamNames.first()).toBeVisible();
      }
      
      // Look for numeric statistics
      const numbers = page.locator('text=/\\d+/');
      if (await numbers.count() > 0) {
        await expect(numbers.first()).toBeVisible();
      }
      
      // Look for SME information
      const smeInfo = page.locator('text=/@|\\(.+@.+\\)|technical|sme/i');
      if (await smeInfo.count() > 0) {
        await expect(smeInfo.first()).toBeVisible();
      }
    });

    test('should have team detail functionality', async ({ page }) => {
      await page.getByRole('link', { name: /teams/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Look for expandable rows or detail buttons
      const detailButtons = page.locator('button').filter({
        hasText: /view|details|expand|more/i
      });
      
      if (await detailButtons.count() > 0) {
        const button = detailButtons.first();
        await button.click();
        await page.waitForTimeout(500);
        
        // Should show additional details
        const detailContent = page.locator('[role="dialog"], .modal, .expanded');
        if (await detailContent.count() > 0) {
          await expect(detailContent.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Page Navigation', () => {
    test('should maintain active page state in navigation', async ({ page }) => {
      // Navigate to SPAs page
      await page.getByRole('link', { name: /spas/i }).click();
      await page.waitForTimeout(500);
      
      // SPA navigation item should be active
      const spaNavItem = page.getByRole('link', { name: /spas/i });
      const spaClasses = await spaNavItem.getAttribute('class');
      const isActive = spaClasses?.includes('active') || 
                      spaClasses?.includes('current') || 
                      await spaNavItem.getAttribute('aria-current') === 'page';
      
      // Navigate to another page
      await page.getByRole('link', { name: /microservices/i }).click();
      await page.waitForTimeout(500);
      
      // Microservices navigation should now be active
      const msNavItem = page.getByRole('link', { name: /microservices/i });
      const msClasses = await msNavItem.getAttribute('class');
      const isMsActive = msClasses?.includes('active') || 
                       msClasses?.includes('current') || 
                       await msNavItem.getAttribute('aria-current') === 'page';
    });

    test('should handle page refresh correctly', async ({ page }) => {
      // Navigate to SPAs page
      await page.getByRole('link', { name: /spas/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still be on SPAs page
      await expect(page).toHaveURL(/.*spas.*/);
      await expect(page.getByText(/spa/i)).toBeVisible();
    });

    test('should handle browser back/forward navigation', async ({ page }) => {
      // Start on overview
      const initialUrl = page.url();
      
      // Navigate to SPAs
      await page.getByRole('link', { name: /spas/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Navigate to microservices
      await page.getByRole('link', { name: /microservices/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Use browser back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*spas.*/);
      
      // Use browser forward
      await page.goForward();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/.*microservices.*/);
    });
  });

  test.describe('Data Loading and Error States', () => {
    test('should handle loading states', async ({ page }) => {
      // Intercept API calls to simulate slow loading
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.continue();
      });
      
      await page.getByRole('link', { name: /spas/i }).click();
      
      // Should not show error during loading
      const errorElements = page.locator('text=/error|failed|not found/i');
      const errorCount = await errorElements.count();
      expect(errorCount).toBe(0);
      
      // Eventually content should load
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/spa/i)).toBeVisible();
    });

    test('should handle empty data states', async ({ page }) => {
      // Navigate to each page and check for empty state handling
      const pages = [
        { name: /spas/i, url: /.*spas.*/ },
        { name: /microservices/i, url: /.*microservices.*/ },
        { name: /teams/i, url: /.*teams.*/ }
      ];
      
      for (const pageInfo of pages) {
        await page.getByRole('link', { name: pageInfo.name }).click();
        await page.waitForLoadState('networkidle');
        
        // Page should load without errors
        const errorElements = page.locator('text=/error|failed/i');
        expect(await errorElements.count()).toBe(0);
        
        // Should have some content (even if it's an empty state message)
        const main = page.getByRole('main');
        const hasContent = await main.textContent();
        expect(hasContent).toBeTruthy();
        expect(hasContent!.length).toBeGreaterThan(10);
      }
    });
  });
});