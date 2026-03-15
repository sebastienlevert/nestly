import { test, expect } from '@playwright/test';

/**
 * Comprehensive UI Validation Test Suite
 * This test suite validates all core UI functionality and should be kept in sync
 * with new features as they're added.
 *
 * NOTE: This app uses HashRouter, so all URLs use /#/ prefix.
 */

test.describe('UI Validation Suite', () => {

  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    
    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
    
    await page.screenshot({ path: 'test-screenshots/homepage.png', fullPage: true });
  });

  test.describe('Page Navigation', () => {
    const pages = [
      { name: 'Calendar', url: '/#/calendar' },
      { name: 'Photos', url: '/#/photos' },
      { name: 'Meals', url: '/#/meals' },
      { name: 'Tasks', url: '/#/tasks' },
      { name: 'Settings', url: '/#/settings' },
      { name: 'Adventures', url: '/#/adventures' },
      { name: 'Love Board', url: '/#/love-board' },
      { name: 'Memories', url: '/#/memories' },
      { name: 'Fun Night', url: '/#/fun-night' },
    ];

    for (const testPage of pages) {
      test(`${testPage.name} page renders correctly`, async ({ page }) => {
        await page.goto(testPage.url);
        await page.waitForLoadState('networkidle');

        const root = page.locator('#root');
        await expect(root).not.toBeEmpty();

        await page.screenshot({ 
          path: `test-screenshots/${testPage.name.toLowerCase().replace(' ', '-')}.png`, 
          fullPage: true 
        });
      });
    }
  });

  test.describe('Touch Target Requirements', () => {
    test('All buttons meet 44x44px minimum', async ({ page }) => {
      await page.goto('/#/');
      await page.waitForLoadState('networkidle');

      const buttons = await page.locator('button:visible').all();
      
      for (const button of buttons) {
        const box = await button.boundingBox();
        
        if (box && box.width > 0 && box.height > 0) {
          const text = await button.textContent();
          
          expect(box.width, `Button "${text?.trim()}" width should be >= 44px`).toBeGreaterThanOrEqual(44);
          expect(box.height, `Button "${text?.trim()}" height should be >= 44px`).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('Tablet viewport (1280x800)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/#/calendar');
      await page.waitForLoadState('networkidle');

      const root = page.locator('#root');
      await expect(root).not.toBeEmpty();

      await page.screenshot({ path: 'test-screenshots/tablet-view.png', fullPage: true });
    });

    test('Desktop viewport (1920x1080)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/#/calendar');
      await page.waitForLoadState('networkidle');

      const root = page.locator('#root');
      await expect(root).not.toBeEmpty();

      await page.screenshot({ path: 'test-screenshots/desktop-view.png', fullPage: true });
    });
  });

  test('No critical console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' &&
          !msg.text().includes('Wake Lock') &&
          !msg.text().includes('Failed to fetch') &&
          !msg.text().includes('Failed to generate') &&
          !msg.text().includes('MSAL') &&
          !msg.text().includes('Cross-Origin') &&
          !msg.text().includes('openai.azure.com') &&
          !msg.text().includes('daily spark')) {
        errors.push(msg.text());
      }
    });

    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(errors, 'Should have no critical console errors').toHaveLength(0);
  });
});
