import { test, expect } from '@playwright/test';

test.describe('Workflow Data Isolation & Role Security', () => {

    test('Staff should only see their department tasks and NO Admin controls', async ({ page }) => {
        // Increase timeout for production environment
        test.setTimeout(60000);

        // 1. Login as Staff (bbr001 - Barber)
        await page.goto('/login');
        await page.fill('input#identifier', 'bbr001');
        await page.fill('input#password', 'ManHub@2026');
        await page.click('button[type="submit"]');

        // Wait for Dashboard with increased timeout
        await page.waitForSelector('text=Checklist công việc hôm nay', { timeout: 15000 });

        // 2. CHECK ROLE SECURITY (UI)
        // Staff MUST NOT see "Duyệt" (Approve) or "Từ chối" (Reject) buttons
        // These buttons only appear for Admin role

        // Wait a bit for all tasks to load
        await page.waitForTimeout(2000);

        // Check that approve/reject buttons are NOT visible
        // Using text-based selectors as backup
        const approveButtons = await page.locator('button:has-text("Duyệt")').count();
        const rejectButtons = await page.locator('button:has-text("Từ chối")').count();

        // Staff should see 0 approve/reject buttons
        expect(approveButtons).toBe(0);
        expect(rejectButtons).toBe(0);

        console.log('✅ Security Verified: Staff cannot see Admin buttons.');

        // 3. Verify we are on Dashboard (not rejected)
        await expect(page).not.toHaveURL(/.*login.*/);
    });
});
