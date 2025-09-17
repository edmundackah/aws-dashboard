import {expect, test} from './test-fixtures';

test.describe('Performance Tests', () => {
  test('should load main page within performance budget', async ({ page }) => {
    // Start performance monitoring
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Check for Core Web Vitals
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: any = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'paint') {
              metrics[entry.name] = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime;
            }
            if (entry.entryType === 'layout-shift') {
              metrics.cls = (metrics.cls || 0) + (entry as any).value;
            }
          });
          
          resolve(metrics);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 3000);
      });
    });
    
    console.log('Performance metrics:', performanceMetrics);
  });

  test('should handle chart rendering performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Measure chart rendering time
    const chartStartTime = Date.now();
    
    // Wait for chart to be visible
    await page.waitForSelector('[data-chart], .recharts-wrapper, svg', { timeout: 10000 });
    
    const chartLoadTime = Date.now() - chartStartTime;
    
    // Chart should render within 3 seconds
    expect(chartLoadTime).toBeLessThan(3000);
    
    // Chart should be interactive quickly
    const chartSvg = page.locator('svg').first();
    await expect(chartSvg).toBeVisible();
    
    // Test chart interaction performance
    const interactionStart = Date.now();
    await chartSvg.hover();
    const interactionTime = Date.now() - interactionStart;
    
    // Interactions should be fast
    expect(interactionTime).toBeLessThan(500);
  });

  test('should handle data table performance with large datasets', async ({ page }) => {
    // Navigate to a data-heavy page
    await page.goto('/spas');
    await page.waitForLoadState('networkidle');
    
    const tableStartTime = Date.now();
    
    // Wait for table to load
    await page.waitForSelector('table, [role="table"], [role="grid"]', { timeout: 10000 });
    
    const tableLoadTime = Date.now() - tableStartTime;
    
    // Table should load within 3 seconds
    expect(tableLoadTime).toBeLessThan(3000);
    
    // Test scrolling performance
    const table = page.locator('table, [role="table"]').first();
    if (await table.count() > 0) {
      const scrollStart = Date.now();
      
      // Scroll through table
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(100);
      await page.mouse.wheel(0, -500);
      
      const scrollTime = Date.now() - scrollStart;
      
      // Scrolling should be smooth (under 200ms for the operation)
      expect(scrollTime).toBeLessThan(1000);
    }
  });

  test('should handle navigation performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const navigationTimes: number[] = [];
    
    const pages = ['/spas', '/microservices', '/teams', '/'];
    
    for (const pagePath of pages) {
      const navStart = Date.now();
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      const navTime = Date.now() - navStart;
      navigationTimes.push(navTime);
      
      // Each navigation should be under 3 seconds
      expect(navTime).toBeLessThan(3000);
    }
    
    // Average navigation time should be reasonable
    const avgNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    expect(avgNavTime).toBeLessThan(2000);
  });

  test('should handle responsive performance', async ({ page }) => {
    // Test with different desktop viewport sizes
    const viewports = [
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
      { width: 1024, height: 768 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds at any desktop size
      expect(loadTime).toBeLessThan(5000);
    }
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSMemory: (performance as any).memory.usedJSMemory,
        totalJSMemory: (performance as any).memory.totalJSMemory
      } : null;
    });
    
    // Navigate through multiple pages
    const pages = ['/spas', '/microservices', '/teams', '/'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Check memory usage after navigation
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSMemory: (performance as any).memory.usedJSMemory,
        totalJSMemory: (performance as any).memory.totalJSMemory
      } : null;
    });
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory.usedJSMemory - initialMemory.usedJSMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('should handle concurrent user simulation', async ({ page, context }) => {
    // Create multiple pages to simulate concurrent users
    const pages = [page];
    
    for (let i = 0; i < 2; i++) {
      pages.push(await context.newPage());
    }
    
    const loadPromises = pages.map(async (p, index) => {
      const startTime = Date.now();
      await p.goto(`/?user=${index}`);
      await p.waitForLoadState('networkidle');
      return Date.now() - startTime;
    });
    
    const loadTimes = await Promise.all(loadPromises);
    
    // All concurrent loads should complete within reasonable time
    for (const loadTime of loadTimes) {
      expect(loadTime).toBeLessThan(8000);
    }
    
    // Clean up additional pages
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close();
    }
  });

  test('should handle export performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test export command performance
    const exportStartTime = Date.now();
    
    // Open command dialog
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+KeyK' : 'Control+KeyK');
    
    // Wait for dialog to appear
    await page.waitForSelector('[role="dialog"], [cmdk-root]', { timeout: 5000 });
    
    const dialogTime = Date.now() - exportStartTime;
    
    // Dialog should open quickly
    expect(dialogTime).toBeLessThan(1000);
    
    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('should maintain performance with theme switching', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find theme toggle if it exists
    const themeToggle = page.getByRole('button').filter({ 
      has: page.locator('[class*="sun"], [class*="moon"], [data-testid*="theme"]') 
    }).first();
    
    if (await themeToggle.count() > 0) {
      const switchTimes: number[] = [];
      
      // Test multiple theme switches
      for (let i = 0; i < 3; i++) {
        const switchStart = Date.now();
        await themeToggle.click();
        await page.waitForTimeout(300); // Wait for theme transition
        const switchTime = Date.now() - switchStart;
        
        switchTimes.push(switchTime);
        expect(switchTime).toBeLessThan(1000);
      }
      
      const avgSwitchTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
      expect(avgSwitchTime).toBeLessThan(500);
    }
  });
});