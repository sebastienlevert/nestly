import { test, expect } from '@playwright/test';

// Console error filter
const EXPECTED_ERROR_PATTERNS = [
  /Wake Lock/i, /Azure.*OpenAI/i, /CORS/i, /net::ERR/i, /favicon/i,
  /Failed to fetch/i, /Failed to generate/i, /MSAL/i, /Cross-Origin/i,
  /openai\.azure\.com/i, /daily spark/i,
];
function isExpectedError(msg: string): boolean {
  return EXPECTED_ERROR_PATTERNS.some(p => p.test(msg));
}

const MOBILE_VIEWPORT = { width: 375, height: 812 };

const PAGES = [
  { name: 'Calendar', path: '/#/calendar' },
  { name: 'Tasks', path: '/#/tasks' },
  { name: 'Adventures', path: '/#/adventures' },
  { name: 'Memories', path: '/#/memories' },
  { name: 'Love Board', path: '/#/love-board' },
  { name: 'Fun Night', path: '/#/fun-night' },
  { name: 'Photos', path: '/#/photos' },
  { name: 'Meals', path: '/#/meals' },
  { name: 'Settings', path: '/#/settings' },
];

test.describe('Mobile Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test('hamburger menu is visible on mobile', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('button[aria-label="Open menu"]')).toBeVisible();
  });

  test('desktop sidebar is hidden on mobile', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // The desktop aside has class "hidden lg:flex" — it should not be visible
    const desktopSidebar = page.locator('aside >> nth=0');
    await expect(desktopSidebar).toBeHidden();
  });

  test('drawer opens and shows all nav items', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    await page.locator('button[aria-label="Open menu"]').click();
    await page.waitForTimeout(400);

    // All nav items should be visible in the drawer
    for (const pg of PAGES) {
      const link = page.locator(`aside.fixed a[href*="${pg.path.replace('/#', '')}"]`);
      await expect(link).toBeVisible();
    }
  });

  test('drawer closes on close button', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    await page.locator('button[aria-label="Open menu"]').click();
    await page.waitForTimeout(300);

    // Backdrop should be visible
    const backdrop = page.locator('div.fixed.inset-0.z-40');
    await expect(backdrop).toHaveCount(1);

    await page.locator('button[aria-label="Close menu"]').click();
    await page.waitForTimeout(400);

    // Backdrop should be removed
    await expect(backdrop).toHaveCount(0);
  });

  for (const pg of PAGES) {
    test(`can navigate to ${pg.name} via mobile drawer`, async ({ page }) => {
      await page.goto('/#/calendar');
      await page.waitForLoadState('networkidle');

      // Open drawer
      await page.locator('button[aria-label="Open menu"]').click();
      await page.waitForTimeout(300);

      // Click the nav link
      const href = pg.path.replace('/#', '');
      await page.locator(`aside.fixed a[href*="${href}"]`).click();
      await page.waitForTimeout(500);

      // Should navigate
      await expect(page).toHaveURL(new RegExp(href.replace('/', '')));

      // Page content should render
      await expect(page.locator('#root')).toBeVisible();
    });
  }

  test('all pages render without overflow on mobile', async ({ page }) => {
    for (const pg of PAGES) {
      await page.goto(pg.path);
      await page.waitForLoadState('networkidle');

      // Check no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
    }
  });

  test('no critical console errors on mobile', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !isExpectedError(msg.text())) {
        errors.push(msg.text());
      }
    });

    for (const pg of PAGES) {
      await page.goto(pg.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    expect(errors).toEqual([]);
  });

  test('hamburger button meets touch target size', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    const box = await page.locator('button[aria-label="Open menu"]').boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('mobile header shows page title', async ({ page }) => {
    await page.goto('/#/adventures');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).toBeVisible();
    // Should contain a page title
    await expect(header).toContainText(/.+/);
  });

  test('takes mobile screenshots for visual reference', async ({ page }) => {
    const screenshotPages = ['/#/calendar', '/#/adventures', '/#/love-board', '/#/fun-night'];

    for (const path of screenshotPages) {
      const name = path.replace('/#/', '');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `test-screenshots/mobile-${name}.png`,
        fullPage: true,
      });
    }

    // Open drawer and screenshot
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');
    await page.locator('button[aria-label="Open menu"]').click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: 'test-screenshots/mobile-drawer-open.png',
      fullPage: true,
    });
  });
});
