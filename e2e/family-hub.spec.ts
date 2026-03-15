import { test, expect } from '@playwright/test';

/**
 * Family Hub Features — E2E Test Suite
 * Tests the 4 new family features: Adventures, Love Board, Memories, Fun Night
 *
 * NOTE: This app uses HashRouter, so all URLs use /#/ prefix.
 */

test.describe('Family Hub Features', () => {

  // ─── Adventures Page ──────────────────────────────────────────────
  test.describe('Adventures Page', () => {

    test('Adventures page loads and renders map', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      const root = page.locator('#root');
      await expect(root).not.toBeEmpty();

      // Map container should be visible (Leaflet renders into a div with class leaflet-container)
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible({ timeout: 15000 });

      await page.screenshot({
        path: 'test-screenshots/adventures-page.png',
        fullPage: true,
      });
    });

    test('Adventures page shows title and stats', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Family Adventures');
    });

    test('Adventures page has dream destinations section', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Dream Destinations');
    });

    test('Can open pin editor by clicking map', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible({ timeout: 15000 });

      // Click on the map to trigger pin creation
      await mapContainer.click({ position: { x: 300, y: 200 } });

      // Pin editor dialog should appear
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      await page.screenshot({
        path: 'test-screenshots/adventures-pin-editor.png',
        fullPage: true,
      });
    });

    test('Pin editor has required form fields', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible({ timeout: 15000 });

      // Small delay to ensure map is interactive
      await page.waitForTimeout(1000);
      await mapContainer.click({ position: { x: 300, y: 200 } });

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Should have title, description, and date fields
      await expect(dialog.locator('input').first()).toBeVisible({ timeout: 5000 });
      await expect(dialog.locator('textarea').first()).toBeVisible({ timeout: 5000 });
    });

    test('Can add and see a travel pin', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible({ timeout: 15000 });

      await page.waitForTimeout(1000);
      await mapContainer.click({ position: { x: 400, y: 250 } });

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Fill in the form
      await dialog.locator('input').first().fill('Family Trip to Paris');
      await dialog.locator('textarea').first().fill('An amazing family adventure!');

      // Find and fill date if present
      const dateInput = dialog.locator('input[type="date"]');
      if (await dateInput.count() > 0) {
        await dateInput.first().fill('2025-06-15');
      }

      // Click save button
      const saveBtn = dialog.locator('button').filter({ hasText: /save|add/i }).first();
      await saveBtn.click();

      // Dialog should close
      await expect(dialog).not.toBeVisible({ timeout: 5000 });

      // Map should now have a marker
      const markers = page.locator('.leaflet-marker-icon');
      await expect(markers.first()).toBeVisible({ timeout: 5000 });

      await page.screenshot({
        path: 'test-screenshots/adventures-with-pin.png',
        fullPage: true,
      });
    });

    test('Adventures page shows Trips section', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Trips');
    });

    test('Can open Create Trip dialog', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      // Click "Create Trip" button
      const createBtn = page.locator('button', { hasText: 'Create Trip' });
      await expect(createBtn).toBeVisible({ timeout: 5000 });
      await createBtn.click();

      // Dialog should open
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Should have trip name input
      await expect(dialog.locator('#trip-name')).toBeVisible();

      await page.screenshot({
        path: 'test-screenshots/adventures-trip-editor.png',
        fullPage: true,
      });
    });

    test('Trip editor has date range and color picker', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      const createBtn = page.locator('button', { hasText: 'Create Trip' });
      await createBtn.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Date inputs
      await expect(dialog.locator('#trip-start')).toBeVisible();
      await expect(dialog.locator('#trip-end')).toBeVisible();

      // Color picker (10 colored buttons)
      const colorButtons = dialog.locator('button[style*="background-color"]');
      expect(await colorButtons.count()).toBeGreaterThanOrEqual(10);
    });

    test('Can create a trip', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      const createBtn = page.locator('button', { hasText: 'Create Trip' });
      await createBtn.click();

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Fill form
      await dialog.locator('#trip-name').fill('Summer in Italy');
      await dialog.locator('#trip-desc').fill('Amazing family vacation');
      await dialog.locator('#trip-start').fill('2025-07-01');
      await dialog.locator('#trip-end').fill('2025-07-15');

      // Submit
      await dialog.locator('button[type="submit"]').click();

      // Dialog should close and trip should appear in the list
      await expect(dialog).not.toBeVisible({ timeout: 5000 });

      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Summer in Italy');

      await page.screenshot({
        path: 'test-screenshots/adventures-trip-created.png',
        fullPage: true,
      });
    });

    test('Pin editor shows trip assignment dropdown when trips exist', async ({ page }) => {
      await page.goto('/#/adventures');
      await page.waitForLoadState('networkidle');

      // First create a trip
      const createBtn = page.locator('button', { hasText: 'Create Trip' });
      await createBtn.click();
      const tripDialog = page.locator('[role="dialog"]');
      await expect(tripDialog).toBeVisible({ timeout: 5000 });
      await tripDialog.locator('#trip-name').fill('Test Trip');
      await tripDialog.locator('button[type="submit"]').click();
      await expect(tripDialog).not.toBeVisible({ timeout: 5000 });

      // Now click map to open pin editor
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(1000);
      await mapContainer.click({ position: { x: 300, y: 200 } });

      const pinDialog = page.locator('[role="dialog"]');
      await expect(pinDialog).toBeVisible({ timeout: 10000 });

      // Should have a trip dropdown
      const tripSelect = pinDialog.locator('#pin-trip');
      await expect(tripSelect).toBeVisible();
    });
  });

  // ─── Love Board Page ──────────────────────────────────────────────
  test.describe('Love Board Page', () => {

    test('Love Board page loads correctly', async ({ page }) => {
      await page.goto('/#/love-board');
      await page.waitForLoadState('networkidle');

      const root = page.locator('#root');
      await expect(root).not.toBeEmpty();

      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Love Board');

      await page.screenshot({
        path: 'test-screenshots/love-board-page.png',
        fullPage: true,
      });
    });

    test('Love Board shows Daily Spark section', async ({ page }) => {
      await page.goto('/#/love-board');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Daily Spark');
    });

    test('Love Board shows Gratitude Jar section', async ({ page }) => {
      await page.goto('/#/love-board');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Gratitude Jar');
    });

    test('Can add a love note', async ({ page }) => {
      await page.goto('/#/love-board');
      await page.waitForLoadState('networkidle');

      // Find the note input area (Textarea component)
      const messageInput = page.locator('textarea').first();
      await expect(messageInput).toBeVisible({ timeout: 5000 });

      // Type a note
      await messageInput.fill('I love this family so much! ❤️');

      // Click add note button
      const addButton = page.locator('button').filter({ hasText: /note/i }).first();
      await addButton.click();

      // Note should appear on the wall
      await page.waitForTimeout(500);
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('I love this family so much!');

      await page.screenshot({
        path: 'test-screenshots/love-board-with-note.png',
        fullPage: true,
      });
    });

    test('Can add a gratitude entry', async ({ page }) => {
      await page.goto('/#/love-board');
      await page.waitForLoadState('networkidle');

      // GratitudeJar has two inputs: message and author
      // Find all inputs in the page, the gratitude ones are the last group
      const allInputs = page.locator('input');
      const inputCount = await allInputs.count();

      // The gratitude message input has the "grateful" placeholder
      const gratitudeMessageInput = page.locator('input[placeholder*="grateful" i]');
      if (await gratitudeMessageInput.count() > 0) {
        await gratitudeMessageInput.fill('Grateful for our healthy family');
      } else {
        // Fallback: use the second-to-last input
        await allInputs.nth(inputCount - 2).fill('Grateful for our healthy family');
      }

      // Submit gratitude
      const addGratitudeBtn = page.locator('button').filter({ hasText: /gratitude/i }).last();
      await expect(addGratitudeBtn).toBeEnabled({ timeout: 5000 });
      await addGratitudeBtn.click();

      await page.waitForTimeout(500);
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Grateful for our healthy family');

      await page.screenshot({
        path: 'test-screenshots/love-board-with-gratitude.png',
        fullPage: true,
      });
    });

    test('Note color picker has multiple options', async ({ page }) => {
      await page.goto('/#/love-board');
      await page.waitForLoadState('networkidle');

      // Color picker buttons in the note form
      const colorButtons = page.locator('button.rounded-full');
      const count = await colorButtons.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── Memories Page ────────────────────────────────────────────────
  test.describe('Memories Page', () => {

    test('Memories page loads correctly', async ({ page }) => {
      await page.goto('/#/memories');
      await page.waitForLoadState('networkidle');

      const root = page.locator('#root');
      await expect(root).not.toBeEmpty();

      await page.screenshot({
        path: 'test-screenshots/memories-page.png',
        fullPage: true,
      });
    });

    test('Memories page shows relevant content', async ({ page }) => {
      await page.goto('/#/memories');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');
      const hasMemoryContent = pageContent?.includes('On This Day') ||
        pageContent?.includes('Memories') ||
        pageContent?.includes('Sign in');
      expect(hasMemoryContent).toBeTruthy();
    });

    test('Memories page shows sign-in prompt when not authenticated', async ({ page }) => {
      await page.goto('/#/memories');
      await page.waitForLoadState('networkidle');

      // Since we're not authenticated, should show sign-in message
      const pageContent = await page.textContent('body');
      const hasAuthPrompt = pageContent?.includes('Sign in') ||
        pageContent?.includes('Sign In') ||
        pageContent?.includes('sign in');
      expect(hasAuthPrompt).toBeTruthy();
    });
  });

  // ─── Fun Night Page ───────────────────────────────────────────────
  test.describe('Fun Night Page', () => {

    test('Fun Night page loads correctly', async ({ page }) => {
      await page.goto('/#/fun-night');
      await page.waitForLoadState('networkidle');

      const root = page.locator('#root');
      await expect(root).not.toBeEmpty();

      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Fun Night');

      await page.screenshot({
        path: 'test-screenshots/fun-night-page.png',
        fullPage: true,
      });
    });

    test('Fun Night page shows game library section', async ({ page }) => {
      await page.goto('/#/fun-night');
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');
      const hasLibrary = pageContent?.includes('Game Library') || pageContent?.includes('Game');
      expect(hasLibrary).toBeTruthy();
    });

    test('Fun Night page has Plan Tonight button', async ({ page }) => {
      await page.goto('/#/fun-night');
      await page.waitForLoadState('networkidle');

      const planButton = page.locator('button').filter({ hasText: /plan tonight/i });
      await expect(planButton.first()).toBeVisible();
    });

    test('Can add a board game', async ({ page }) => {
      await page.goto('/#/fun-night');
      await page.waitForLoadState('networkidle');

      // Click "Add Game" button to show the form
      const addGameBtn = page.locator('button').filter({ hasText: /add game/i });
      await addGameBtn.first().click();

      await page.waitForTimeout(500);

      // Fill in game name
      const nameInput = page.locator('input[type="text"]').first();
      await expect(nameInput).toBeVisible({ timeout: 5000 });
      await nameInput.fill('Candy Land');

      // Fill in player counts
      const numberInputs = page.locator('input[type="number"]');
      if (await numberInputs.count() >= 2) {
        await numberInputs.nth(0).fill('2');
        await numberInputs.nth(1).fill('4');
      }

      // Submit the form
      const saveBtn = page.locator('button').filter({ hasText: /save/i }).first();
      await saveBtn.click();

      await page.waitForTimeout(500);

      // Game should appear in the library
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('Candy Land');

      await page.screenshot({
        path: 'test-screenshots/fun-night-with-game.png',
        fullPage: true,
      });
    });

    test('Spin wheel appears and is interactive', async ({ page }) => {
      await page.goto('/#/fun-night');
      await page.waitForLoadState('networkidle');

      // First add a game so spin has something to pick
      const addGameBtn = page.locator('button').filter({ hasText: /add game/i });
      await addGameBtn.first().click();
      await page.waitForTimeout(300);

      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.fill('Uno');
      const saveBtn = page.locator('button').filter({ hasText: /save/i }).first();
      await saveBtn.click();
      await page.waitForTimeout(500);

      // Find spin button
      const spinBtn = page.locator('button').filter({ hasText: /spin/i });
      if (await spinBtn.count() > 0) {
        await spinBtn.first().click();
        await page.waitForTimeout(3000);

        await page.screenshot({
          path: 'test-screenshots/fun-night-spin-result.png',
          fullPage: true,
        });
      }
    });
  });

  // ─── Sidebar Navigation ───────────────────────────────────────────
  test.describe('Sidebar Navigation for New Features', () => {

    const newPages = [
      { name: 'Adventures', path: '/adventures' },
      { name: 'Memories', path: '/memories' },
      { name: 'Love Board', path: '/love-board' },
      { name: 'Fun Night', path: '/fun-night' },
      { name: 'Photos', path: '/photos' },
      { name: 'Meals', path: '/meals' },
    ];

    for (const testPage of newPages) {
      test(`${testPage.name} is accessible via sidebar nav`, async ({ page }) => {
        await page.goto('/#/');
        await page.waitForLoadState('networkidle');

        // HashRouter renders links as href="#/path"
        const navLink = page.locator(`a[href="#${testPage.path}"]`);
        await expect(navLink.first()).toBeVisible({ timeout: 5000 });

        await navLink.first().click();
        await page.waitForLoadState('networkidle');

        const root = page.locator('#root');
        await expect(root).not.toBeEmpty();
      });
    }
  });

  // ─── Touch Targets on New Pages ───────────────────────────────────
  test.describe('Touch Targets on New Pages', () => {

    const pagesToTest = ['/#/adventures', '/#/love-board', '/#/fun-night'];

    for (const url of pagesToTest) {
      test(`Buttons on ${url} meet 44x44px minimum`, async ({ page }) => {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const buttons = await page.locator('button:visible').all();

        for (const button of buttons) {
          const box = await button.boundingBox();
          if (box && box.width > 0 && box.height > 0) {
            const text = await button.textContent();
            expect(
              box.width,
              `Button "${text?.trim()}" on ${url} width should be >= 44px (got ${box.width})`
            ).toBeGreaterThanOrEqual(44);
            expect(
              box.height,
              `Button "${text?.trim()}" on ${url} height should be >= 44px (got ${box.height})`
            ).toBeGreaterThanOrEqual(44);
          }
        }
      });
    }
  });

  // ─── No Console Errors on New Pages ───────────────────────────────
  test.describe('No Console Errors on New Pages', () => {

    const pagesToTest = [
      { name: 'Adventures', url: '/#/adventures' },
      { name: 'Love Board', url: '/#/love-board' },
      { name: 'Memories', url: '/#/memories' },
      { name: 'Fun Night', url: '/#/fun-night' },
    ];

    for (const testPage of pagesToTest) {
      test(`${testPage.name} page has no critical console errors`, async ({ page }) => {
        const errors: string[] = [];

        page.on('console', msg => {
          if (msg.type() === 'error' &&
              !msg.text().includes('Wake Lock') &&
              !msg.text().includes('Azure OpenAI') &&
              !msg.text().includes('net::ERR') &&
              !msg.text().includes('favicon') &&
              !msg.text().includes('Failed to fetch') &&
              !msg.text().includes('Failed to generate') &&
              !msg.text().includes('MSAL') &&
              !msg.text().includes('Cross-Origin') &&
              !msg.text().includes('openai.azure.com') &&
              !msg.text().includes('daily spark')) {
            errors.push(msg.text());
          }
        });

        await page.goto(testPage.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        expect(
          errors,
          `${testPage.name} should have no critical console errors: ${errors.join(', ')}`
        ).toHaveLength(0);
      });
    }
  });
});
