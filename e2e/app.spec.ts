import { test, expect, Page } from '@playwright/test';

/**
 * Basic smoke tests for the Nestly application
 */

/** Navigate to a page using the sidebar drawer. */
async function navigateViaSidebar(page: Page, linkName: RegExp) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  const sidebar = page.locator('aside');
  await sidebar.waitFor({ state: 'visible' });
  await sidebar.getByRole('link', { name: linkName }).click();
  await page.waitForLoadState('networkidle');
}

test.describe('Nestly App', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Nestly/i);
  });

  test('should display the header', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should show sidebar navigation links', async ({ page }) => {
    await page.goto('/');

    // Open sidebar via hamburger menu
    await page.getByRole('button', { name: 'Open menu' }).click();
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible' });

    // Verify key navigation links are present
    await expect(sidebar.getByRole('link', { name: /calendar/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /tasks/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /meals/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /settings/i })).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/sidebar-open.png', fullPage: true });
  });

  test('should navigate to Settings page via sidebar', async ({ page }) => {
    await page.goto('/');

    await navigateViaSidebar(page, /settings/i);

    await expect(page).toHaveURL(/#\/settings/);

    await page.screenshot({ path: 'e2e/screenshots/settings-page.png', fullPage: true });
  });
});

/**
 * Visual regression tests for key UI components
 */
test.describe('Visual Regression', () => {
  test('should match homepage snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should match tablet layout', async ({ page, viewport }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(viewport?.width).toBeGreaterThanOrEqual(1024);
    await expect(page).toHaveScreenshot('tablet-view.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

/**
 * Touch interaction tests for tablet optimization
 */
test.describe('Touch Interactions', () => {
  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/');

    // Open sidebar to expose navigation links
    await page.getByRole('button', { name: 'Open menu' }).click();
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible' });

    // Get all navigation links in the sidebar
    const navLinks = sidebar.getByRole('link');
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
