import { test, expect } from '@playwright/test';

test.describe('New Features E2E', () => {

    // =================================================================
    // TEST 1: Inventory Management
    // Source: src/components/InventoryManagement.tsx
    // - Heading (line 242): <h2>Quản lý Tồn kho</h2>
    // - Add button (line 245-246): "Thêm sản phẩm" (admin only)
    // - Name input placeholder (line 425): "VD: Sáp vuốt tóc..."
    // - View toggle buttons (line 269-274): "Sản phẩm" | "Lịch sử"
    // - Item card class (line 321): bg-[#0f1c2e]/60 border rounded-2xl
    // - "Dùng" button (line 356-358): action='use', text=" Dùng"
    // - Stock modal title (line 485-487): ACTION_LABELS[use].label = "Sử dụng" + item name
    // - Stock confirm button (line 521): text="Xác nhận"
    // =================================================================
    test('Inventory Management: Add and Use Item', async ({ page }) => {
        test.setTimeout(90000);

        // Login as admin
        await page.goto('/login');
        await page.fill('input#identifier', 'admin');
        await page.fill('input#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/');
        await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });

        // Navigate to Inventory via nav button
        await page.getByRole('button', { name: /Tồn kho/i }).click();

        // Heading is "Quản lý Tồn kho" (h2), NOT "QUẢN LÝ TỒN KHO"
        await expect(page.getByRole('heading', { name: /Quản lý Tồn kho/i })).toBeVisible({ timeout: 15000 });

        // --- ADD NEW ITEM ---
        const itemName = `E2E Test ${Date.now()}`;
        await page.getByRole('button', { name: /Thêm sản phẩm/i }).click();

        // Modal title is "📦 Thêm sản phẩm"
        const addModal = page.locator('div.fixed').filter({ hasText: /Thêm sản phẩm/ });
        await expect(addModal).toBeVisible({ timeout: 5000 });

        // Name input placeholder: "VD: Sáp vuốt tóc..."
        await addModal.locator('input[placeholder="VD: Sáp vuốt tóc..."]').fill(itemName);

        // Initial quantity input - "Số lượng ban đầu" label (only for new items)
        await addModal.locator('input[type="number"]').first().fill('50');

        // Save button text: "Thêm sản phẩm" (when not editing)
        await addModal.getByRole('button', { name: /^Thêm sản phẩm$/ }).click();
        await expect(addModal).not.toBeVisible({ timeout: 10000 });

        // Verify item appears in list
        await expect(page.getByText(itemName)).toBeVisible({ timeout: 10000 });

        // --- USE ITEM ---
        // Item card is a div with classes including "border" and "rounded-2xl"
        // Find the specific item's card, then click its "Dùng" button
        const itemCard = page.locator('div.rounded-2xl').filter({ hasText: itemName }).first();
        await expect(itemCard).toBeVisible({ timeout: 5000 });
        await itemCard.getByRole('button', { name: /Dùng/i }).click();

        // Stock modal title: "Sử dụng: {itemName}"
        // (ACTION_LABELS['use'].label = 'Sử dụng')
        const useModal = page.locator('div.fixed').filter({ hasText: /Sử dụng/ });
        await expect(useModal).toBeVisible({ timeout: 5000 });

        // The number input is the only number input in this modal
        await useModal.locator('input[type="number"]').fill('3');
        await useModal.getByRole('button', { name: /Xác nhận/ }).click();
        await expect(useModal).not.toBeVisible({ timeout: 10000 });

        // Verify item still visible after use (quantity decreased)
        await expect(page.getByText(itemName)).toBeVisible({ timeout: 10000 });

        console.log('✅ Inventory Management verified!');
    });

    // =================================================================
    // TEST 2: Barber Task Board
    // Source: src/components/BarberTaskBoard.tsx
    // - Heading (line 215): "Nhiệm vụ hôm nay" (when date = today)
    // - Create button (line 225-231): "Đăng ký việc" (for non-admin)
    // - Modal title (line 395): "✋ Đăng ký việc" (non-admin)
    // - Title input placeholder (line 407): "VD: Dọn kho, xếp hàng hóa..."
    // - Submit button text (line 470): "Đăng ký" (non-admin) / "Giao việc" (admin)
    // =================================================================
    test('Barber Task Board: Register Task', async ({ page }) => {
        test.setTimeout(60000);

        // Login as barber
        await page.goto('/login');
        await page.fill('input#identifier', 'bbr001');
        await page.fill('input#password', 'ManHub@2026');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/');
        await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });

        // Navigate to Tasks
        await page.getByRole('button', { name: /Nhiệm vụ/i }).click();

        // Heading: "Nhiệm vụ hôm nay" (line 215)
        await expect(page.getByRole('heading', { name: /Nhiệm vụ hôm nay/i })).toBeVisible({ timeout: 10000 });

        // Open create modal - button text is "Đăng ký việc" for non-admin (line 230)
        await page.getByRole('button', { name: /Đăng ký việc/i }).click();

        // Modal title: "✋ Đăng ký việc" (line 395)
        const regModal = page.locator('div.fixed').filter({ hasText: /Đăng ký việc/ });
        await expect(regModal).toBeVisible({ timeout: 5000 });

        // Title input placeholder: "VD: Dọn kho, xếp hàng hóa..." (line 407)
        const taskTitle = `E2E Task ${Date.now()}`;
        await regModal.locator('input[placeholder="VD: Dọn kho, xếp hàng hóa..."]').fill(taskTitle);

        // Time input (line 442-447)
        await regModal.locator('input[type="time"]').fill('20:30');

        // Submit button text: "Đăng ký" for non-admin (line 470)
        await regModal.getByRole('button', { name: /^Đăng ký$/ }).click();
        await expect(regModal).not.toBeVisible({ timeout: 10000 });

        // Verify task appears in the list
        await expect(page.getByText(taskTitle).first()).toBeVisible({ timeout: 10000 });

        console.log('✅ Barber Task Board verified!');
    });

    // =================================================================
    // TEST 3: Dashboard & Operations
    // =================================================================
    test('Dashboard & Operations: History and Service Logs', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/login');
        await page.fill('input#identifier', 'admin');
        await page.fill('input#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/');
        await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });

        // 1. Checklist view
        await page.getByRole('button', { name: /Checklist/i }).click();
        await expect(page.getByText(/Checklist hôm nay|Lịch sử:/i)).toBeVisible({ timeout: 10000 });

        // 2. Operations / Sảnh view
        await page.getByRole('button', { name: /Sảnh|Sơ đồ/i }).click();
        await expect(page.getByText('QUẢN LÝ SẢNH').first()).toBeVisible({ timeout: 10000 });

        // Scroll to bottom to find history section
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await expect(page.getByText(/Lịch sử phục vụ/i)).toBeVisible({ timeout: 10000 });

        console.log('✅ Operations Logs verified!');
    });

});
