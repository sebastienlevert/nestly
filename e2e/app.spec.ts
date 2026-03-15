import { test, expect } from '@playwright/test';

// Console error filter — ignore expected errors in test environment
const EXPECTED_ERROR_PATTERNS = [
  /Wake Lock/i,
  /Azure.*OpenAI/i,
  /CORS/i,
  /net::ERR/i,
  /favicon/i,
  /Failed to fetch/i,
  /Failed to generate/i,
  /MSAL/i,
  /Cross-Origin/i,
  /openai\.azure\.com/i,
  /daily spark/i,
];

function isExpectedError(msg: string): boolean {
  return EXPECTED_ERROR_PATTERNS.some(p => p.test(msg));
}

/**
 * Basic smoke tests for Family Planner application
 */
test.describe('Family Planner App', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // App should render the root element
    await expect(page.locator('#root')).toBeVisible();
  });

  test('should display sidebar navigation on desktop', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Desktop sidebar should be visible (viewport is 1280x720 = lg+)
    const sidebar = page.locator('aside >> nth=0');
    await expect(sidebar).toBeVisible();
  });

  test('should navigate via sidebar links', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Click Settings nav link in sidebar
    await page.locator('aside a[href*="settings"]').first().click();
    await page.waitForTimeout(300);

    // Should navigate to settings
    await expect(page).toHaveURL(/settings/);
  });

  test('should show hamburger menu on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Mobile header with hamburger should be visible
    const hamburger = page.locator('button[aria-label="Open menu"]');
    await expect(hamburger).toBeVisible();
  });

  test('should open mobile drawer on hamburger click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Click hamburger
    await page.locator('button[aria-label="Open menu"]').click();
    await page.waitForTimeout(300);

    // Drawer should slide in — check for a visible nav link inside it
    const drawerLink = page.locator('aside.fixed a[href*="settings"]');
    await expect(drawerLink).toBeVisible();
  });

  test('should navigate and close drawer on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Open drawer
    await page.locator('button[aria-label="Open menu"]').click();
    await page.waitForTimeout(300);

    // Click Adventures link
    await page.locator('aside.fixed a[href*="adventures"]').click();
    await page.waitForTimeout(500);

    // Should navigate
    await expect(page).toHaveURL(/adventures/);
  });

  test('should close drawer via close button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Open drawer
    await page.locator('button[aria-label="Open menu"]').click();
    await page.waitForTimeout(300);

    // Click the close button
    await page.locator('button[aria-label="Close menu"]').click();
    await page.waitForTimeout(400);

    // The backdrop overlay should be gone after drawer closes
    await expect(page.locator('div.fixed.inset-0.z-40')).toHaveCount(0);
  });
});

/**
 * Touch interaction tests
 */
test.describe('Touch Interactions', () => {
  test('should have touch-friendly nav links on desktop', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Check sidebar nav links meet 44px touch target
    const navLinks = page.locator('aside a.touch-target');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      if (await link.isVisible()) {
        const box = await link.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('should have touch-friendly hamburger on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    const hamburger = page.locator('button[aria-label="Open menu"]');
    const box = await hamburger.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('should have touch-friendly drawer links on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Open drawer
    await page.locator('button[aria-label="Open menu"]').click();
    await page.waitForTimeout(300);

    const drawerLinks = page.locator('aside.fixed a.touch-target');
    const count = await drawerLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = drawerLinks.nth(i);
      if (await link.isVisible()) {
        const box = await link.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

/**
 * No critical console errors
 */
test.describe('Console Errors', () => {
  test('should not have unexpected console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) {
        errors.push(msg.text());
      }
    });

    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(errors).toEqual([]);
  });
});
