import { test, expect } from '@playwright/test';

test.describe('Authentication Security Tests', () => {

    test('TC-AUTH-003: Verify Login Fails with Incorrect Credentials', async ({ page }) => {
        await page.goto('/login');

        // Attempt login with wrong password
        await page.fill('input#identifier', 'bbr001');
        await page.fill('input#password', 'WrongPassword!!!');
        await page.click('button[type="submit"]');

        // Check for error message
        // Based on UI logs, the error usually appears in an alert component or text
        await expect(page.getByText('Mã nhân viên hoặc mật khẩu không đúng')).toBeVisible({ timeout: 5000 });

        // Verify URL stays on login
        await expect(page).toHaveURL(/.*login.*/);
    });

    test('TC-AUTH-005: Verify Protected Route Redirection', async ({ page }) => {
        // Clear cookies/storage to ensure unauthorized state
        await page.context().clearCookies();

        // Try to access Dashboard directly
        await page.goto('/');

        // Should be redirected to /login
        await expect(page).toHaveURL(/.*login.*/);

        // Also checks headers/response if possible, but URL check is sufficient for E2E
    });

});
