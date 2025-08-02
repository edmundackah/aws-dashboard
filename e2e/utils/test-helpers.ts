import { Page, Locator, expect } from '@playwright/test';

/**
 * Common test utilities and helpers for AWS Dashboard E2E tests
 */

export class TestHelpers {
  constructor(public page: Page) {}

  /**
   * Wait for the dashboard to be fully loaded with data
   */
  async waitForDashboardLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    
    // Wait for charts or main content to be visible
    await this.page.waitForSelector(
      '[data-chart], .recharts-wrapper, [role="main"]', 
      { timeout: 15000 }
    );
  }

  /**
   * Open the command dialog using keyboard shortcut
   */
  async openCommandDialog(): Promise<Locator> {
    const isMac = process.platform === 'darwin';
    await this.page.keyboard.press(isMac ? 'Meta+KeyK' : 'Control+KeyK');
    
    const dialog = this.page.locator('[role="dialog"], [cmdk-root]');
    await expect(dialog.first()).toBeVisible({ timeout: 5000 });
    
    return dialog.first();
  }

  /**
   * Close any open dialogs or modals
   */
  async closeDialog(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate to a specific page and wait for it to load
   */
  async navigateToPage(pageName: 'overview' | 'spas' | 'microservices' | 'teams'): Promise<void> {
    const linkText = pageName === 'overview' ? /overview/i : new RegExp(pageName, 'i');
    await this.page.getByRole('link', { name: linkText }).click();
    await this.waitForDashboardLoad();
  }

  /**
   * Check if an element exists without throwing
   */
  async elementExists(selector: string): Promise<boolean> {
    return await this.page.locator(selector).count() > 0;
  }

  /**
   * Get chart container if it exists
   */
  async getChart(): Promise<Locator | null> {
    const chart = this.page.locator('[data-chart], .recharts-wrapper').first();
    return await chart.count() > 0 ? chart : null;
  }

  /**
   * Get data table if it exists
   */
  async getDataTable(): Promise<Locator | null> {
    const table = this.page.locator('table, [role="table"], [role="grid"]').first();
    return await table.count() > 0 ? table : null;
  }

  /**
   * Test responsive behavior at different desktop viewport sizes
   */
  async testDesktopResponsive(): Promise<void> {
    const desktopViewports = [
      { width: 1024, height: 768, name: 'Small Desktop' },
      { width: 1280, height: 720, name: 'Standard Desktop' },
      { width: 1920, height: 1080, name: 'Large Desktop' }
    ];
    
    for (const viewport of desktopViewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500);
      
      // Verify basic elements are still visible
      await expect(this.page.getByRole('navigation')).toBeVisible();
      await expect(this.page.getByRole('main')).toBeVisible();
      
      console.log(`✓ Layout responsive at ${viewport.name} (${viewport.width}x${viewport.height})`);
    }
  }

  /**
   * Verify chart accessibility
   */
  async checkChartAccessibility(chart: Locator): Promise<void> {
    const svg = chart.locator('svg');
    
    // Check for accessibility attributes
    const ariaLabel = await svg.getAttribute('aria-label');
    const role = await svg.getAttribute('role');
    const ariaDescribedBy = await svg.getAttribute('aria-describedby');
    
    // Chart should have some form of accessibility
    const hasAccessibility = ariaLabel || role === 'img' || ariaDescribedBy;
    
    if (!hasAccessibility) {
      // Check if wrapped in accessible container
      const accessibleParent = this.page.locator('[aria-label], [role="img"]').filter({
        has: svg
      });
      
      const hasAccessibleParent = await accessibleParent.count() > 0;
      expect(hasAccessibleParent || hasAccessibility).toBe(true);
    }
  }

  /**
   * Verify data table accessibility
   */
  async checkTableAccessibility(table: Locator): Promise<void> {
    // Check for table headers
    const headers = table.locator('th, [role="columnheader"]');
    const headerCount = await headers.count();
    
    if (headerCount > 0) {
      // Headers should have text content
      const firstHeader = headers.first();
      const headerText = await firstHeader.textContent();
      expect(headerText).toBeTruthy();
    }
    
    // Check for table caption or aria-label
    const caption = table.locator('caption');
    const ariaLabel = await table.getAttribute('aria-label');
    const ariaLabelledBy = await table.getAttribute('aria-labelledby');
    
    const hasLabel = await caption.count() > 0 || ariaLabel || ariaLabelledBy;
    if (!hasLabel) {
      console.warn('Table may benefit from accessible labeling');
    }
  }

  /**
   * Test keyboard navigation through interactive elements
   */
  async testKeyboardNavigation(maxTabs: number = 10): Promise<number> {
    let focusableElements = 0;
    
    for (let i = 0; i < maxTabs; i++) {
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(100);
      
      const focused = this.page.locator(':focus');
      if (await focused.count() > 0) {
        const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
        const role = await focused.getAttribute('role');
        
        // Count interactive elements
        const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
        const interactiveRoles = ['button', 'link', 'tab', 'menuitem'];
        
        if (interactiveTags.includes(tagName) || 
            (role && interactiveRoles.includes(role)) ||
            await focused.evaluate(el => el.hasAttribute('tabindex'))) {
          focusableElements++;
        }
      }
    }
    
    return focusableElements;
  }

  /**
   * Test mouse interactions for desktop testing
   */
  async testMouseInteractions(): Promise<void> {
    // Test mouse scrolling
    await this.page.mouse.wheel(0, 300);
    await this.page.waitForTimeout(300);
    
    // Test chart mouse interactions
    const chart = await this.getChart();
    if (chart) {
      const chartBox = await chart.boundingBox();
      if (chartBox) {
        await this.page.mouse.move(
          chartBox.x + chartBox.width / 2, 
          chartBox.y + chartBox.height / 2
        );
        await this.page.waitForTimeout(300);
      }
    }
  }

  /**
   * Check for console errors during test execution
   */
  async monitorConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    this.page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    return errors;
  }

  /**
   * Wait for any loading states to complete
   */
  async waitForLoadingComplete(): Promise<void> {
    // Wait for common loading indicators to disappear
    const loadingSelectors = [
      '.loading',
      '[data-loading="true"]',
      '.spinner',
      '.skeleton'
    ];
    
    for (const selector of loadingSelectors) {
      const loader = this.page.locator(selector);
      if (await loader.count() > 0) {
        await expect(loader).not.toBeVisible({ timeout: 10000 });
      }
    }
  }

  /**
   * Verify theme switching functionality
   */
  async testThemeToggle(): Promise<boolean> {
    const themeToggle = this.page.getByRole('button').filter({ 
      has: this.page.locator('[class*="sun"], [class*="moon"], [data-testid*="theme"]') 
    }).first();
    
    if (await themeToggle.count() === 0) {
      return false;
    }
    
    // Get initial theme state
    const initialBodyClass = await this.page.locator('body').getAttribute('class');
    
    // Toggle theme
    await themeToggle.click();
    await this.page.waitForTimeout(500);
    
    // Verify theme changed
    const newBodyClass = await this.page.locator('body').getAttribute('class');
    return newBodyClass !== initialBodyClass;
  }

  /**
   * Test export functionality
   */
  async testExportFunctionality(exportType: 'all' | 'spa' | 'microservices' | 'teams'): Promise<boolean> {
    try {
      const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 });
      
      const dialog = await this.openCommandDialog();
      
      // Look for export option
      const exportPattern = exportType === 'all' 
        ? /export all/i 
        : new RegExp(`export.*${exportType}`, 'i');
      
      const exportOption = this.page.getByText(exportPattern).first();
      
      if (await exportOption.count() === 0) {
        await this.closeDialog();
        return false;
      }
      
      await exportOption.click();
      
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      
      // Verify file is CSV
      expect(filename).toMatch(/\.csv$/);
      
      return true;
    } catch (error) {
      console.log(`Export test failed for ${exportType}:`, error);
      return false;
    }
  }
}

/**
 * Common test data and constants
 */
export const TEST_CONSTANTS = {
  VIEWPORTS: {
    DESKTOP_SMALL: { width: 1024, height: 768, name: 'Small Desktop' },
    DESKTOP: { width: 1280, height: 720, name: 'Desktop' },
    DESKTOP_LARGE: { width: 1920, height: 1080, name: 'Desktop Large' }
  },
  
  TIMEOUTS: {
    FAST: 1000,
    NORMAL: 5000,
    SLOW: 10000,
    VERY_SLOW: 15000
  },
  
  PERFORMANCE_BUDGETS: {
    PAGE_LOAD: 5000,
    CHART_RENDER: 3000,
    NAVIGATION: 2000
  },
  
  SELECTORS: {
    CHART: '[data-chart], .recharts-wrapper',
    TABLE: 'table, [role="table"], [role="grid"]',
    NAVIGATION: '[role="navigation"], .sidebar, nav',
    DIALOG: '[role="dialog"], [cmdk-root]',
    MAIN_CONTENT: '[role="main"]'
  }
};

/**
 * Utility functions for test assertions
 */
export const TestAssertions = {
  /**
   * Assert element is within viewport
   */
  async isInViewport(page: Page, element: Locator): Promise<boolean> {
    const box = await element.boundingBox();
    if (!box) return false;
    
    const viewport = page.viewportSize();
    if (!viewport) return false;
    
    return box.x >= 0 && 
           box.y >= 0 && 
           box.x + box.width <= viewport.width && 
           box.y + box.height <= viewport.height;
  },
  
  /**
   * Assert color contrast meets accessibility standards
   */
  async hasGoodContrast(element: Locator): Promise<boolean> {
    // This is a simplified check - in practice you'd use a more sophisticated algorithm
    const styles = await element.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor
      };
    });
    
    // Basic check for transparent or similar colors
    return styles.color !== styles.backgroundColor && 
           styles.color !== 'rgba(0, 0, 0, 0)' &&
           styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
  }
};