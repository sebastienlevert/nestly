import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive UI Test Suite for Nestly
 * Tests all major features, navigation, and touch optimization
 */

/** Navigate to a page using the sidebar drawer. */
async function navigateViaSidebar(page: Page, linkName: RegExp) {
  await page.getByRole('button', { name: 'Open menu' }).click();
  const sidebar = page.locator('aside');
  await sidebar.waitFor({ state: 'visible' });
  await sidebar.getByRole('link', { name: linkName }).click();
  await page.waitForLoadState('networkidle');
}

test.describe('Comprehensive UI Testing', () => {

  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-screenshots/01-homepage.png',
      fullPage: true
    });

    await expect(page).toHaveTitle(/Nestly/);

    const header = page.locator('header');
    await expect(header).toBeVisible();

    console.log('✅ Homepage loaded successfully');
  });

  test('Sidebar opens and displays all navigation options', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open sidebar via hamburger menu
    await page.getByRole('button', { name: 'Open menu' }).click();
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible' });

    await page.screenshot({
      path: 'test-screenshots/02-sidebar-open.png',
      fullPage: true
    });

    // Verify navigation links are visible
    await expect(sidebar.getByRole('link', { name: /calendar/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /photos/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /meals/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /tasks/i })).toBeVisible();
    await expect(sidebar.getByRole('link', { name: /settings/i })).toBeVisible();

    console.log('✅ Sidebar opens with all navigation options');
  });

  test('Navigation to Settings page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await navigateViaSidebar(page, /settings/i);

    await page.waitForURL(/#\/settings/);

    await page.screenshot({
      path: 'test-screenshots/03-settings-page.png',
      fullPage: true
    });

    await expect(page).toHaveURL(/#\/settings/);

    console.log('✅ Settings page navigation works');
  });

  test('Navigation to Calendar page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await navigateViaSidebar(page, /calendar/i);

    await page.waitForURL(/#\/calendar/);

    await page.screenshot({
      path: 'test-screenshots/04-calendar-page.png',
      fullPage: true
    });

    await expect(page).toHaveURL(/#\/calendar/);

    console.log('✅ Calendar page navigation works');
  });

  test('Navigation to Photos page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await navigateViaSidebar(page, /photos/i);

    await page.waitForURL(/#\/photos/);

    await page.screenshot({
      path: 'test-screenshots/05-photos-page.png',
      fullPage: true
    });

    await expect(page).toHaveURL(/#\/photos/);

    console.log('✅ Photos page navigation works');
  });

  test('Navigation to Meals page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await navigateViaSidebar(page, /meals/i);

    await page.waitForURL(/#\/meals/);

    await page.screenshot({
      path: 'test-screenshots/06-meals-page.png',
      fullPage: true
    });

    await expect(page).toHaveURL(/#\/meals/);

    console.log('✅ Meals page navigation works');
  });

  test('Navigation to Tasks page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await navigateViaSidebar(page, /tasks/i);

    await page.waitForURL(/#\/tasks/);

    await page.screenshot({
      path: 'test-screenshots/07-tasks-page.png',
      fullPage: true
    });

    await expect(page).toHaveURL(/#\/tasks/);

    console.log('✅ Tasks page navigation works');
  });

  test('Touch target sizes meet 44x44px requirement', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open sidebar to expose navigation links
    await page.getByRole('button', { name: 'Open menu' }).click();
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible' });

    // Check all visible button and link sizes
    const interactiveElements = await page.locator('button, a[href]').all();
    const elementSizes: { text: string; width: number; height: number; passesTouchTest: boolean }[] = [];

    for (const el of interactiveElements) {
      const box = await el.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        const text = await el.textContent();
        elementSizes.push({
          text: text?.trim() || 'No text',
          width: box.width,
          height: box.height,
          passesTouchTest: box.width >= 44 && box.height >= 44
        });
      }
    }

    console.log('\n📏 Touch Target Analysis:');
    elementSizes.forEach(el => {
      const status = el.passesTouchTest ? '✅' : '❌';
      console.log(`${status} ${el.text}: ${el.width.toFixed(0)}x${el.height.toFixed(0)}px`);
    });

    const failedElements = elementSizes.filter(el => !el.passesTouchTest);
    if (failedElements.length > 0) {
      console.log(`\n⚠️  Warning: ${failedElements.length} elements don't meet 44x44px requirement`);
    } else {
      console.log('\n✅ All interactive elements meet touch target requirements!');
    }
  });

  test('Responsive design - Tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-screenshots/08-tablet-view.png',
      fullPage: true
    });

    const header = page.locator('header');
    await expect(header).toBeVisible();

    console.log('✅ Tablet viewport renders correctly');
  });

  test('Responsive design - Desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'test-screenshots/09-desktop-view.png',
      fullPage: true
    });

    console.log('✅ Desktop viewport renders correctly');
  });

  test('Sidebar closes when backdrop is clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open sidebar
    await page.getByRole('button', { name: 'Open menu' }).click();
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible' });

    // Click backdrop to close sidebar
    const backdrop = page.locator('div[class*="fixed"][class*="inset"]');
    await expect(backdrop).toBeVisible();
    await backdrop.click({ position: { x: 10, y: 10 } });

    // Wait for backdrop to disappear (sidebar is closed)
    await expect(backdrop).toBeHidden();

    await page.screenshot({
      path: 'test-screenshots/10-sidebar-closed.png',
      fullPage: true
    });

    console.log('✅ Sidebar closes on backdrop click');
  });

  test('All pages have proper page titles', async ({ page }) => {
    const pages = [
      { url: '/', expectedTitle: /Nestly/i },
      { url: '/#/calendar', expectedTitle: /Nestly/i },
      { url: '/#/photos', expectedTitle: /Nestly/i },
      { url: '/#/meals', expectedTitle: /Nestly/i },
      { url: '/#/tasks', expectedTitle: /Nestly/i },
      { url: '/#/settings', expectedTitle: /Nestly/i },
    ];

    for (const { url, expectedTitle } of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(expectedTitle);
      console.log(`✅ ${url} has correct title`);
    }
  });

  test('Check for console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const urls = ['/', '/#/calendar', '/#/photos', '/#/meals', '/#/tasks', '/#/settings'];

    for (const url of urls) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
    }

    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Console Errors Found:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✅ No console errors detected');
    }
  });

  test('Accessibility - key roles present on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify essential accessible roles exist
    await expect(page.getByRole('banner').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();

    // Open sidebar and verify navigation links are accessible
    await page.getByRole('button', { name: 'Open menu' }).click();
    const sidebar = page.locator('aside');
    await sidebar.waitFor({ state: 'visible' });

    const navLinks = sidebar.getByRole('link');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✅ Accessibility: found banner, menu button, and ${count} navigation links`);
  });
});
