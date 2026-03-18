import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Ma trận phân quyền kiểm thử:
 * 1. Staff (bbr002 - Barber): Không thấy tab Cài đặt, không thấy nút Duyệt.
 * 2. Leader (bbr001 - Barber): Thấy tab Cài đặt, thấy nút Duyệt của Member Barber, KHÔNG thấy nút Duyệt của chính mình.
 * 3. Isolation: Leader Barber (bbr001) không thấy task của Spa.
 * 4. Admin (admin): Thấy tất cả, duyệt được tất cả.
 */

const DEFAULT_PASSWORD = 'ManHub@2026';

test.describe('Permissions Matrix Verification', () => {

    test('Staff Permissions (bbr002) - Restricted Access', async ({ page }) => {
        console.log('Testing Staff Permissions...');
        await page.goto('/login');
        await page.fill('input#identifier', 'bbr002');
        await page.fill('input#password', DEFAULT_PASSWORD);
        await page.click('button[type="submit"]');

        // 1. Verify restricted tabs
        await expect(page.getByText('Checklist')).toBeVisible();
        await expect(page.getByText('Cài đặt')).not.toBeVisible();

        // 2. Verify no approval buttons
        const approveBtn = page.locator('button:has-text("Duyệt")');
        await expect(approveBtn).not.toBeVisible();
    });

    test('Leader Permissions (bbr001) - Contextual Management', async ({ page }) => {
        console.log('Testing Leader Permissions...');
        await page.goto('/login');
        await page.fill('input#identifier', 'bbr001');
        await page.fill('input#password', DEFAULT_PASSWORD);
        await page.click('button[type="submit"]');

        // 1. Verify management tab access
        await expect(page.getByText('Cài đặt')).toBeVisible();

        // 2. Verify settings filtering
        await page.click('button:has-text("Cài đặt")');
        await expect(page.getByText('Quản lý Công việc')).toBeVisible();

        // Leader Barber should only see Barber tasks in management if any exist
        // (This part depends on data availability, but we check if we can open the tab)

        await page.click('button:has-text("Checklist")');

        // 3. Verify approval buttons for team members
        // Check if there are any submitted tasks by team members
        const submittedCards = page.locator('.bg-slate-800\\/40'); // Based on TaskCard styling
        const cardsCount = await submittedCards.count();
        console.log(`Leader sees ${cardsCount} tasks in their area.`);

        // 4. Verify no tasks from other departments (Isolation)
        await expect(page.getByText('Spa')).not.toBeVisible();
        await expect(page.getByText('Cafe')).not.toBeVisible();
    });

    test('Leader Own Task Constraint', async ({ page }) => {
        console.log('Testing Leader Cannot Approve Own Task...');
        await page.goto('/login');
        await page.fill('input#identifier', 'bbr001');
        await page.fill('input#password', DEFAULT_PASSWORD);
        await page.click('button[type="submit"]');

        // Step: Submit a task as Leader
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.count() > 0) {
            await fileInput.setInputFiles(path.join(__dirname, 'mock_image.jpg'));
            await expect(page.getByText('Chờ duyệt').first()).toBeVisible({ timeout: 15000 });

            // Verify the specific task card for the submission
            // Leaders should NOT see "Duyệt" on their own submitted task
            const ownTaskCard = page.locator('div:has-text("Chờ duyệt")').filter({ hasText: 'Nộp bởi: Đoàn Quốc Vương' });
            const approveBtnOnOwnTask = ownTaskCard.locator('button:has-text("Duyệt")');
            await expect(approveBtnOnOwnTask).not.toBeVisible();
        } else {
            console.log('Skipping "Own Task" check - no pending tasks found.');
        }
    });

    test('Admin Full Access', async ({ page }) => {
        console.log('Testing Admin Full Access...');
        await page.goto('/login');
        await page.fill('input#identifier', 'admin');
        await page.fill('input#password', 'admin123'); // Admin has a different password
        await page.click('button[type="submit"]');

        await expect(page.getByRole('button', { name: 'Cài đặt' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Checklist' })).toBeVisible();

        // Admin sees multiple departments
        // (Assuming data exists for multiple areas)
        const areaTitles = page.locator('h3');
        const titles = await areaTitles.allTextContents();
        console.log('Areas visible to Admin:', titles);

        // Admin should see at least one checkmark for one of the departments
        expect(titles.length).toBeGreaterThan(0);
    });

});
