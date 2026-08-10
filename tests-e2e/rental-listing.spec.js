const { test, expect } = require('@playwright/test');

test.describe('Rental listing UI', () => {
  test('lists all three available units', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.unit-card')).toHaveCount(3);
    await expect(page.getByText('Harbourview Studio', {exact: true})).toBeVisible();
    await expect(page.getByText('The Birchwood Townhouse', {exact: true})).toBeVisible();
  });

  test('lets a visitor send a booking inquiry and see a confirmation', async ({ page }) => {
    await page.goto('/');

    // Unit id 2 is the "Maple Street 1-Bedroom" listing (see server.js UNITS).
    await page.getByLabel('Unit').selectOption('2');
    await page.getByLabel('Name').fill('Playwright Renter');
    await page.getByLabel('Email').fill('renter@example.com');
    await page.getByLabel('Message (optional)').fill('Is the unit pet friendly?');
    await page.getByRole('button', { name: 'Send inquiry' }).click();

    await expect(page.getByText("Thanks — your inquiry has been sent")).toBeVisible();

    // Form should reset after a successful submission.
    await expect(page.getByLabel('Name')).toHaveValue('');
  });

  test('shows a validation error when required fields are missing', async ({ page }) => {
    await page.goto('/');

    // Bypass the browser's own "required" validation so we can assert on
    // the server's own error message instead of the native browser prompt.
    await page.evaluate(() => {
      document.getElementById('email').removeAttribute('required');
    });

    await page.getByLabel('Name').fill('No Email');
    await page.getByRole('button', { name: 'Send inquiry' }).click();

    await expect(page.locator('#form-error')).toHaveText('name and email are required');
  });
});
