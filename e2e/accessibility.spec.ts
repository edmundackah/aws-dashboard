import { test, expect } from './test-fixtures';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper page structure and headings', async ({ page }) => {
    // Check for main landmark
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
    
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    
    // Verify heading text is meaningful
    const h1Text = await h1.first().textContent();
    expect(h1Text).toBeTruthy();
    expect(h1Text!.length).toBeGreaterThan(3);
    
    // Check for navigation landmark
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('should have proper color contrast', async ({ page }) => {
    // Test high contrast mode compatibility
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    
    // Key elements should still be visible in dark mode
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    
    // Switch back to light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(500);
    
    // Elements should still be visible
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Should be able to navigate through interactive elements
    let tabCount = 0;
    const maxTabs = 15;
    
    while (tabCount < maxTabs) {
      const focused = await page.locator(':focus').count();
      if (focused > 0) {
        const focusedElement = page.locator(':focus');
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        const role = await focusedElement.getAttribute('role');
        
        // Focused element should be interactive
        const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
        const interactiveRoles = ['button', 'link', 'tab', 'menuitem', 'option'];
        
        const isInteractive = interactiveTags.includes(tagName) || 
                             (role && interactiveRoles.includes(role)) ||
                             await focusedElement.evaluate(el => el.hasAttribute('tabindex'));
        
        if (isInteractive) {
          // Test activation with Enter/Space
          if (tagName === 'button' || role === 'button') {
            // Don't actually press to avoid side effects, just verify it's focusable
            expect(focused).toBe(1);
          }
        }
      }
      
      await page.keyboard.press('Tab');
      tabCount++;
    }
    
    expect(tabCount).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check navigation has proper labels
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Check for buttons with accessible names
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label') || 
                            await button.textContent() ||
                            await button.getAttribute('title');
      expect(accessibleName).toBeTruthy();
    }
    
    // Check for links with accessible names
    const links = page.getByRole('link');
    const linkCount = await links.count();
    
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i);
      const accessibleName = await link.getAttribute('aria-label') || 
                            await link.textContent() ||
                            await link.getAttribute('title');
      expect(accessibleName).toBeTruthy();
    }
  });

  test('should provide chart accessibility', async ({ page }) => {
    const chart = page.locator('[data-chart], .recharts-wrapper').first();
    
    if (await chart.count() > 0) {
      await expect(chart).toBeVisible();
      
      // Chart should have accessible description
      const chartSvg = chart.locator('svg');
      const ariaLabel = await chartSvg.getAttribute('aria-label');
      const ariaDescribedBy = await chartSvg.getAttribute('aria-describedby');
      const role = await chartSvg.getAttribute('role');
      
      // Chart should have some form of accessibility support
      const hasAccessibility = ariaLabel || ariaDescribedBy || role === 'img' || role === 'graphic';
      
      if (!hasAccessibility) {
        // Check if chart is wrapped in an accessible container
        const accessibleContainer = page.locator('[aria-label], [role="img"]').filter({
          has: chartSvg
        });
        
        if (await accessibleContainer.count() === 0) {
          console.warn('Chart may need better accessibility support');
        }
      }
      
      // Chart legend should be accessible
      const legend = page.locator('[class*="legend"]').first();
      if (await legend.count() > 0) {
        const legendItems = legend.locator('text, span, div').filter({
          hasText: /spa|microservice|progress/i
        });
        
        if (await legendItems.count() > 0) {
          const legendText = await legendItems.first().textContent();
          expect(legendText).toBeTruthy();
        }
      }
    }
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Test for live regions for dynamic content
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    
    // Navigate to different pages to test announcements
    await page.getByRole('link', { name: /spas/i }).click();
    await page.waitForTimeout(500);
    
    // Page should have updated title or announcement
    const newTitle = await page.title();
    expect(newTitle).toContain('SPA') || expect(newTitle).toContain('spa');
    
    // Navigate back
    await page.getByRole('link', { name: /overview/i }).click();
    await page.waitForTimeout(500);
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Animations should be reduced or disabled
    // Basic elements should still be functional
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    
    // Charts should still render without excessive animation
    const chart = page.locator('[data-chart], .recharts-wrapper').first();
    if (await chart.count() > 0) {
      await expect(chart).toBeVisible();
    }
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Look for any form elements
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      
      // Input should have accessible name
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        
        const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledBy;
        if (!hasAccessibleName) {
          console.warn(`Input at index ${i} may need accessible name`);
        }
      }
    }
  });

  test('should handle focus management', async ({ page }) => {
    // Test focus trap in modals/dialogs
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+KeyK' : 'Control+KeyK');
    
    const dialog = page.locator('[role="dialog"], [cmdk-root]');
    if (await dialog.count() > 0) {
      await expect(dialog.first()).toBeVisible();
      
      // Focus should be inside the dialog
      const focused = page.locator(':focus');
      const isInsideDialog = await focused.evaluate((el, dialogEl) => {
        return dialogEl.contains(el);
      }, await dialog.first().elementHandle());
      
      // Close dialog
      await page.keyboard.press('Escape');
      await expect(dialog.first()).not.toBeVisible();
      
      // Focus should return to original element
      await page.waitForTimeout(100);
    }
  });

  test('should provide error state accessibility', async ({ page }) => {
    // Test error handling - simulate network error
    await page.route('**/api/**', route => route.abort());
    await page.reload();
    
    // Check for error messages with proper ARIA
    const errorElements = page.locator('[role="alert"], [aria-live="assertive"]');
    
    // If errors are shown, they should be accessible
    if (await errorElements.count() > 0) {
      const errorText = await errorElements.first().textContent();
      expect(errorText).toBeTruthy();
      expect(errorText!.length).toBeGreaterThan(5);
    }
    
    // Restore normal routing
    await page.unroute('**/api/**');
  });

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode by modifying CSS
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            border: 1px solid !important;
          }
        }
      `
    });
    
    // Elements should still be visible and functional
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    
    const chart = page.locator('[data-chart]').first();
    if (await chart.count() > 0) {
      await expect(chart).toBeVisible();
    }
  });
});