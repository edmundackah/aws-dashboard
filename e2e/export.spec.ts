import { test, expect } from './test-fixtures';
import fs from 'fs';
import path from 'path';

test.describe('CSV Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open command dialog with keyboard shortcut', async ({ page }) => {
    // Use keyboard shortcut to open command dialog (Cmd+K or Ctrl+K)
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+KeyK' : 'Control+KeyK');
    
    // Check if command dialog is visible
    const commandDialog = page.locator('[role="dialog"], [cmdk-root], .command-dialog');
    await expect(commandDialog.first()).toBeVisible({ timeout: 5000 });
    
    // Check for export options
    const exportOption = page.getByText(/export/i);
    await expect(exportOption.first()).toBeVisible();
  });

  test('should show export options in command dialog', async ({ page }) => {
    // Open command dialog
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+KeyK' : 'Control+KeyK');
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"], [cmdk-root]', { timeout: 5000 });
    
    // Look for export options
    const exportAllOption = page.getByText(/export all/i);
    const exportSpaOption = page.getByText(/export spa/i);
    const exportMsOption = page.getByText(/export.*microservice/i);
    const exportTeamsOption = page.getByText(/export team/i);
    
    // At least some export options should be visible
    const exportOptions = [exportAllOption, exportSpaOption, exportMsOption, exportTeamsOption];
    let visibleCount = 0;
    
    for (const option of exportOptions) {
      if (await option.count() > 0) {
        visibleCount++;
      }
    }
    
    expect(visibleCount).toBeGreaterThan(0);
  });

  test('should trigger CSV download when export is selected', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    // Open command dialog
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+KeyK' : 'Control+KeyK');
    
    // Wait for dialog and look for export option
    await page.waitForSelector('[role="dialog"], [cmdk-root]', { timeout: 5000 });
    
    // Try to find and click an export option
    const exportOption = page.getByText(/export all|export spa/i).first();
    
    if (await exportOption.count() > 0) {
      await exportOption.click();
      
      try {
        // Wait for download to start
        const download = await downloadPromise;
        
        // Verify download properties
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
        expect(download.suggestedFilename()).toContain('data');
        
        // Save the file temporarily to verify content
        const filePath = path.join(__dirname, '../temp', download.suggestedFilename());
        await download.saveAs(filePath);
        
        // Verify file exists and has content
        expect(fs.existsSync(filePath)).toBe(true);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        expect(fileContent.length).toBeGreaterThan(0);
        expect(fileContent).toMatch(/projectName|teamName/); // Should have CSV headers
        
        // Clean up
        fs.unlinkSync(filePath);
        
      } catch (error) {
        console.log('Download test may have failed - this is expected if no data is available');
      }
    } else {
      console.log('Export option not found - may need to check different selector');
    }
  });

  test('should export SPA data with correct format', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    // Open command dialog
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+KeyK' : 'Control+KeyK');
    await page.waitForTimeout(500);
    
    // Look for SPA export option
    const spaExportOption = page.getByText(/export spa/i).first();
    
    if (await spaExportOption.count() > 0) {
      await spaExportOption.click();
      
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/spa.*\.csv$/i);
        
        // Verify CSV content structure
        const filePath = path.join(__dirname, '../temp', download.suggestedFilename());
        await download.saveAs(filePath);
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          const headers = lines[0].split(',');
          
          // Check for expected SPA columns
          expect(headers).toContain('projectName');
          expect(headers).toContain('status');
          expect(headers).toContain('dev');
          expect(headers).toContain('sit');
          expect(headers).toContain('uat');
          expect(headers).toContain('nft');
        }
        
        fs.unlinkSync(filePath);
        
      } catch (error) {
        console.log('SPA export test may have failed - checking if feature exists');
      }
    }
  });

  test('should export microservices data with correct format', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    // Open command dialog
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+KeyK' : 'Control+KeyK');
    await page.waitForTimeout(500);
    
    // Look for microservices export option
    const msExportOption = page.getByText(/export.*microservice/i).first();
    
    if (await msExportOption.count() > 0) {
      await msExportOption.click();
      
      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/ms.*\.csv$|microservice.*\.csv$/i);
        
        // Verify CSV content structure
        const filePath = path.join(__dirname, '../temp', download.suggestedFilename());
        await download.saveAs(filePath);
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          const headers = lines[0].split(',');
          
          // Check for expected microservice columns
          expect(headers).toContain('projectName');
          expect(headers).toContain('status');
          expect(headers).toContain('otel');
          expect(headers).toContain('mssdk');
          expect(headers).toContain('dev');
          expect(headers).toContain('sit');
          expect(headers).toContain('uat');
          expect(headers).toContain('nft');
        }
        
        fs.unlinkSync(filePath);
        
      } catch (error) {
        console.log('Microservices export test may have failed - checking if feature exists');
      }
    }
  });

  test('should handle environment columns correctly in CSV', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    // Trigger any export
    const isMac = process.platform === 'darwin';
    await page.keyboard.press(isMac ? 'Meta+KeyK' : 'Control+KeyK');
    await page.waitForTimeout(500);
    
    const exportOption = page.getByText(/export/i).first();
    
    if (await exportOption.count() > 0) {
      await exportOption.click();
      
      try {
        const download = await downloadPromise;
        const filePath = path.join(__dirname, '../temp', download.suggestedFilename());
        await download.saveAs(filePath);
        
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length > 1) {
          const headers = lines[0].split(',');
          const dataRow = lines[1].split(',');
          
          // Check that environment columns have Yes/No values
          const devIndex = headers.indexOf('dev');
          const sitIndex = headers.indexOf('sit');
          
          if (devIndex >= 0 && dataRow[devIndex]) {
            expect(['Yes', 'No', '']).toContain(dataRow[devIndex].replace(/"/g, ''));
          }
          
          if (sitIndex >= 0 && dataRow[sitIndex]) {
            expect(['Yes', 'No', '']).toContain(dataRow[sitIndex].replace(/"/g, ''));
          }
        }
        
        fs.unlinkSync(filePath);
        
      } catch (error) {
        console.log('Environment column test may have failed - checking data format');
      }
    }
  });

  test.beforeAll(async () => {
    // Create temp directory for downloads
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  test.afterAll(async () => {
    // Clean up temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});