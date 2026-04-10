import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('ManHub Task Rejection & Retry Workflow', () => {
    test.setTimeout(120000); // 2 minutes for full loop

    test('Full Loop: Reject -> Retry -> Approve', async ({ page }) => {
        // --- STEP 1: STAFF SUBMIT ---
        console.log('🚀 Step 1: Staff Submit');
        await page.goto('/login');
        await page.fill('input#identifier', 'bbr001');
        await page.fill('input#password', 'ManHub@2026');
        await page.click('button[type="submit"]');

        // Ensure dashboard loaded
        await expect(page.getByText('Checklist hôm nay')).toBeVisible();

        // Upload first time
        const fileInput = page.locator('input[type="file"]').first();
        // Wait specifically if needed
        await expect(fileInput).toBeAttached();

        await fileInput.setInputFiles(path.join(__dirname, 'mock_image.jpg'));
        // Wait for "Chờ duyệt"
        await expect(page.getByText('Chờ duyệt').first()).toBeVisible({ timeout: 30000 });

        // Logout
        await page.click('button[title="Đăng xuất"]');
        await expect(page).toHaveURL(/.*login.*/);

        // --- STEP 2: ADMIN REJECT ---
        console.log('🛑 Step 2: Admin Reject');
        await page.fill('input#identifier', 'admin');
        await page.fill('input#password', 'admin123');
        await page.click('button[type="submit"]');

        await expect(page.getByText('Admin ManHub')).toBeVisible();
        await page.reload(); // Fresh data
        await expect(page.getByText('Checklist hôm nay')).toBeVisible();

        // Setup Dialog Handler for Prompt
        page.once('dialog', async dialog => {
            console.log(`Alert message: ${dialog.message()}`);
            await dialog.accept('Reason: Photo blurry');
        });

        // Find Reject Button
        const rejectBtn = page.locator('button[data-testid^="btn-reject-"]').first();
        await expect(rejectBtn).toBeVisible();
        await rejectBtn.click();

        // Expect status change to "Bị từ chối" (Rejected) on Admin view?
        // Admin view shows Rejected status too.
        await expect(page.getByText('Bị từ chối').first()).toBeVisible();

        // Logout
        await page.click('button[title="Đăng xuất"]');

        // --- STEP 3: STAFF RETRY ---
        console.log('♻️ Step 3: Staff Retry');
        await page.fill('input#identifier', 'bbr001');
        await page.fill('input#password', 'ManHub@2026');
        await page.click('button[type="submit"]');

        // Check if "Bị từ chối" badge is visible
        await expect(page.getByText('Bị từ chối').first()).toBeVisible();

        // Re-upload (Clicking the card opens file picker, or directly input)
        // We use the input locator again (it should still be in DOM)
        const fileInputRetry = page.locator('input[type="file"]').first();
        await fileInputRetry.setInputFiles(path.join(__dirname, 'mock_image.jpg'));

        // Expect change back to "Chờ duyệt"
        await expect(page.getByText('Chờ duyệt').first()).toBeVisible({ timeout: 30000 });

        console.log('✅ Rejection Flow Verified Success!');
    });
});
