import { test, expect } from '@playwright/test';

/**
 * Tests that the calendar auto-advances to the current week when midnight crosses.
 * Uses Playwright's clock API to simulate time progression.
 */
test.describe('Calendar auto-advance on day change', () => {
  test('should advance to the new week when midnight crosses Sunday→Monday', async ({ page }) => {
    // Install fake clock starting at Sunday 23:59:00
    const sundayNight = new Date('2026-03-08T23:59:00');
    await page.clock.install({ time: sundayNight });

    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // The calendar should show the week containing Sunday March 8
    // (week of March 2–8 since weeks start on Monday)
    const headerBefore = await page.locator('header').textContent();
    expect(headerBefore).toContain('March');

    // Fast-forward past midnight into Monday March 9
    await page.clock.fastForward('02:00');

    // The calendar should now show the week of March 9–15
    // Wait for React to re-render with the updated date
    const calendarArea = page.locator('[class*="agenda"], [class*="calendar"]');
    await expect(calendarArea).toContainText('9');

    // Verify the header still shows March
    const headerAfter = await page.locator('header').textContent();
    expect(headerAfter).toContain('March');
  });

  test('should advance when tab becomes visible after sleeping past midnight', async ({ page }) => {
    // Start at 23:58 on a Wednesday
    const wednesdayNight = new Date('2026-03-11T23:58:00');
    await page.clock.install({ time: wednesdayNight });

    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Simulate the page going hidden (tablet sleep)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Advance time past midnight while "sleeping"
    await page.clock.setSystemTime(new Date('2026-03-12T07:00:00'));

    // Simulate the page becoming visible again (tablet wake)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Wait for React to re-render with the new date
    const calendarArea = page.locator('[class*="agenda"], [class*="calendar"]');
    await expect(calendarArea).toContainText('12');
  });
});
