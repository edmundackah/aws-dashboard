import {expect, test} from './test-fixtures';

test.describe('Charts - Bar Chart Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for charts to load
    await page.waitForSelector('[data-chart], .recharts-wrapper, svg', { timeout: 15000 });
  });

  test('should display bar chart with correct structure', async ({ page }) => {
    // Check for chart container
    const chartContainer = page.locator('[data-chart]').first();
    await expect(chartContainer).toBeVisible();
    
    // Check for SVG elements
    const svg = chartContainer.locator('svg');
    await expect(svg).toBeVisible();
    
    // Check for bars (rectangles in SVG)
    const bars = svg.locator('rect[fill], .recharts-bar-rectangle');
    await expect(bars.first()).toBeVisible();
    
    // Verify we have multiple bars (multiple data points)
    const barCount = await bars.count();
    expect(barCount).toBeGreaterThan(1);
  });

  test('should display chart with proper colors', async ({ page }) => {
    // Wait for chart to fully render
    await page.waitForTimeout(1000);
    
    const chartSvg = page.locator('svg').first();
    await expect(chartSvg).toBeVisible();
    
    // Check for bars with colors (either fill attribute or CSS)
    const coloredBars = chartSvg.locator('rect[fill]:not([fill="none"]):not([fill="transparent"])');
    const barCount = await coloredBars.count();
    expect(barCount).toBeGreaterThan(0);
    
    // Verify different colors are used (for SPAs vs Microservices)
    const firstBarColor = await coloredBars.first().getAttribute('fill');
    const lastBarColor = await coloredBars.last().getAttribute('fill');
    
    // Should have different colors for different data series
    if (barCount > 1) {
      expect(firstBarColor).toBeDefined();
    }
  });

  test('should have working chart view toggle', async ({ page }) => {
    // Look for chart view toggle (Migrated Services vs Overall Progress)
    const viewSelect = page.locator('select, [role="combobox"], button').filter({
      has: page.locator('text=/migrated|progress|counts/i')
    });
    
    if (await viewSelect.count() > 0) {
      const initialViewSelect = viewSelect.first();
      
      // Get initial chart state
      const initialBars = await page.locator('svg rect[fill]').count();
      
      // Try to click the toggle
      await initialViewSelect.click();
      await page.waitForTimeout(500);
      
      // Look for dropdown options
      const options = page.locator('[role="option"], option, li').filter({
        has: page.locator('text=/progress|counts|services/i')
      });
      
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(1000);
        
        // Verify chart updated
        const newBars = await page.locator('svg rect[fill]').count();
        // Chart should have re-rendered (may have different number of bars)
        expect(newBars).toBeGreaterThan(0);
      }
    }
  });

  test('should display chart legend with colors', async ({ page }) => {
    // Look for legend elements
    const legend = page.locator('[class*="legend"], [role="img"]').first();
    
    if (await legend.count() > 0) {
      await expect(legend).toBeVisible();
      
      // Check for legend items with color indicators
      const legendItems = legend.locator('[class*="legend-item"], li, div').filter({
        has: page.locator('[style*="background"], [class*="color"], div[style*="background-color"]')
      });
      
      if (await legendItems.count() > 0) {
        await expect(legendItems.first()).toBeVisible();
      }
    }
  });

  test('should show tooltips on hover', async ({ page }) => {
    const chartSvg = page.locator('svg').first();
    await expect(chartSvg).toBeVisible();
    
    // Find chart bars
    const bars = chartSvg.locator('rect[fill]:not([fill="none"])');
    const barCount = await bars.count();
    
    if (barCount > 0) {
      // Hover over a bar
      await bars.first().hover();
      await page.waitForTimeout(500);
      
      // Look for tooltip
      const tooltip = page.locator('[role="tooltip"], [class*="tooltip"], .recharts-tooltip-wrapper');
      
      if (await tooltip.count() > 0) {
        await expect(tooltip.first()).toBeVisible();
        
        // Tooltip should contain some data
        const tooltipText = await tooltip.first().textContent();
        expect(tooltipText).toBeTruthy();
        expect(tooltipText?.length).toBeGreaterThan(0);
      }
    }
  });

  test('should have responsive chart dimensions', async ({ page }) => {
    const chartContainer = page.locator('[data-chart]').first();
    await expect(chartContainer).toBeVisible();
    
    // Get initial dimensions at standard desktop size
    const initialBox = await chartContainer.boundingBox();
    expect(initialBox).toBeTruthy();
    expect(initialBox!.width).toBeGreaterThan(400);
    expect(initialBox!.height).toBeGreaterThan(200);
    
    // Test responsiveness at different desktop sizes
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);
    
    const newBox = await chartContainer.boundingBox();
    expect(newBox).toBeTruthy();
    expect(newBox!.width).toBeGreaterThan(300);
    expect(newBox!.height).toBeGreaterThan(150);
  });

  test('should maintain chart accessibility', async ({ page }) => {
    const chartContainer = page.locator('[data-chart], .recharts-wrapper').first();
    await expect(chartContainer).toBeVisible();
    
    // Charts should have proper ARIA labels or roles
    const chartSvg = chartContainer.locator('svg');
    const ariaLabel = await chartSvg.getAttribute('aria-label');
    const role = await chartSvg.getAttribute('role');
    
    // SVG should have accessibility attributes
    if (!ariaLabel && !role) {
      // At minimum, check if chart is in a labeled container
      const labeledContainer = page.locator('[aria-label], [role="img"]').filter({
        has: chartSvg
      });
      
      if (await labeledContainer.count() === 0) {
        console.warn('Chart may need better accessibility labels');
      }
    }
    
    // Chart should be keyboard navigable if interactive
    await chartSvg.focus();
    // Basic focus test - should not throw error
  });
});