# E2E Testing with Playwright

This directory contains comprehensive end-to-end tests for the AWS Dashboard application using Playwright.

## Test Structure

### Test Files

- **`setup.setup.ts`** - Application health checks and setup
- **`dashboard.spec.ts`** - Main dashboard page functionality
- **`charts.spec.ts`** - Bar chart functionality and interactions
- **`export.spec.ts`** - CSV export functionality
- **`accessibility.spec.ts`** - Accessibility compliance tests
- **`pages.spec.ts`** - Individual page navigation and content
- **`performance.spec.ts`** - Performance and load time tests

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Test Commands

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Browser Support

Tests run on desktop Chrome only for streamlined validation:

#### Desktop
- **Chrome** (1280x720) - Primary testing environment

## Test Categories

### 🏠 **Dashboard Tests**
- Page structure and navigation
- Statistics cards display
- Team progress chart rendering
- Theme toggle functionality
- Loading state handling

### 📊 **Chart Tests**
- Bar chart structure and colors
- Chart view toggle (counts vs progress)
- Legend display with color indicators
- Tooltip interactions
- Responsive chart dimensions
- Accessibility compliance

### 📥 **Export Tests**
- Command dialog keyboard shortcuts
- CSV download functionality
- File format validation
- Environment column structure
- Data accuracy verification

### ♿ **Accessibility Tests**
- ARIA labels and roles
- Keyboard navigation
- Color contrast compliance
- Screen reader compatibility
- Focus management
- High contrast mode support

### 📄 **Page Tests**
- SPAs page functionality
- Microservices page content
- Teams page statistics
- Navigation state management
- Error state handling

### ⚡ **Performance Tests**
- Page load times
- Chart rendering performance
- Data table responsiveness
- Memory usage monitoring
- Concurrent user simulation

## Configuration

### Environment Variables

```bash
# Base URL for testing (default: http://localhost:3001)
BASE_URL=http://localhost:3001

# CI environment detection
CI=true
```

### Test Data

Tests are designed to work with:
- Mock data from WireMock (`/wiremock`)
- Live API endpoints
- Empty data states

## Best Practices

### Writing Tests

1. **Use Descriptive Names**
   ```typescript
   test('should display chart with proper blue-green color scheme', async ({ page }) => {
   ```

2. **Wait for Stability**
   ```typescript
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('[data-testid="chart"]', { timeout: 10000 });
   ```

3. **Test Real User Scenarios**
   ```typescript
   // Good: Test actual user workflow
   await page.getByRole('button', { name: 'Export SPAs' }).click();
   
   // Avoid: Testing implementation details
   await page.locator('.export-btn-spa').click();
   ```

4. **Handle Different States**
   ```typescript
   // Test both success and error states
   if (await exportButton.count() > 0) {
     // Test export functionality
   } else {
     console.log('Export feature not available - testing graceful degradation');
   }
   ```

### Debugging Tests

1. **Run with Debug Mode**
   ```bash
   npm run test:e2e:debug
   ```

2. **Use Screenshots**
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

3. **Check Browser Console**
   ```typescript
   page.on('console', msg => console.log('PAGE LOG:', msg.text()));
   ```

## CI/CD Integration

Tests are configured for CI environments with:
- Retry logic for flaky tests
- Parallel execution control
- Artifact collection (screenshots, videos)
- JUnit XML reporting

### GitHub Actions Example

```yaml
- name: Run Playwright tests
  run: npm run test:e2e
  
- uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Maintenance

### Updating Tests

When adding new features:

1. Add corresponding test coverage
2. Update selectors if UI changes
3. Maintain accessibility compliance
4. Test mobile responsiveness

### Performance Budgets

Current performance targets for desktop Chrome:
- **Page Load**: < 5 seconds
- **Chart Rendering**: < 3 seconds
- **Navigation**: < 2 seconds average

## Troubleshooting

### Common Issues

1. **Timeouts**
   - Increase timeout for slow-loading elements
   - Check network conditions
   - Verify application is running

2. **Element Not Found**
   - Update selectors for UI changes
   - Check if element exists conditionally
   - Verify test environment setup

3. **Flaky Tests**
   - Add proper waits
   - Handle race conditions
   - Test with different timing

### Getting Help

- Check Playwright documentation: https://playwright.dev/docs
- Review test patterns in existing files
- Run tests locally before committing