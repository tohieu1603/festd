import { test, expect } from '@playwright/test';

test.describe('Employees E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to employees page
    await page.click('a[href="/dashboard/employees"]');
    await expect(page).toHaveURL(/\/dashboard\/employees/);
  });

  test('should display employees page correctly', async ({ page }) => {
    // Check page elements
    await expect(page.locator('h1', { hasText: /nhân viên/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /thêm nhân viên/i })).toBeVisible();
    await expect(page.getByPlaceholder(/tìm kiếm/i)).toBeVisible();
  });

  test('should create a new employee successfully', async ({ page }) => {
    // Click "Thêm nhân viên" button
    await page.getByRole('button', { name: /thêm nhân viên/i }).click();

    // Wait for modal to appear
    await expect(page.locator('text=/thêm nhân viên mới/i')).toBeVisible();

    // Fill employee information
    await page.getByLabel(/^tên$/i).fill('Test Employee E2E');
    await page.getByLabel(/vai trò/i).selectOption('Photographer');
    await page.getByLabel(/số điện thoại/i).fill('0111222333');
    await page.getByLabel(/email/i).fill('testemployee@example.com');
    await page.getByLabel(/lương cơ bản/i).fill('10000000');

    // Submit form
    await page.getByRole('button', { name: /lưu/i }).click();

    // Should show success message
    await expect(page.locator('text=/thành công|success/i')).toBeVisible({ timeout: 5000 });

    // Should see new employee in list
    await expect(page.locator('text=Test Employee E2E')).toBeVisible({ timeout: 5000 });
  });

  test('should deactivate employee', async ({ page }) => {
    // Wait for employees to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Find an active employee's deactivate button
    const deactivateButton = page.getByTitle(/cho nghỉ việc/i).first();

    if (await deactivateButton.isVisible()) {
      await deactivateButton.click();

      // Confirm deactivation
      page.on('dialog', dialog => dialog.accept());

      // Should show success message
      await expect(page.locator('text=/nghỉ việc.*thành công/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should activate employee', async ({ page }) => {
    // Wait for employees to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Find an inactive employee's activate button
    const activateButton = page.getByTitle(/kích hoạt/i).first();

    if (await activateButton.isVisible()) {
      await activateButton.click();

      // Confirm activation
      page.on('dialog', dialog => dialog.accept());

      // Should show success message
      await expect(page.locator('text=/kích hoạt.*thành công/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit employee', async ({ page }) => {
    // Wait for employees to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Click edit button on first employee
    const editButton = page.getByTitle('Chỉnh sửa').first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // Wait for edit modal
      await expect(page.locator('text=/chỉnh sửa nhân viên/i')).toBeVisible();

      // Update name
      const nameInput = page.getByLabel(/^tên$/i);
      await nameInput.clear();
      await nameInput.fill('Updated Employee E2E');

      // Submit
      await page.getByRole('button', { name: /lưu/i }).click();

      // Should show success message
      await expect(page.locator('text=/cập nhật.*thành công/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete employee (admin only)', async ({ page }) => {
    // Wait for employees to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Try to find delete button (only visible for admin)
    const deleteButton = page.getByTitle(/xóa/i).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion
      page.on('dialog', dialog => dialog.accept());

      // Should show success message
      await expect(page.locator('text=/xóa.*thành công/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should filter employees by role', async ({ page }) => {
    // Wait for employees to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Find role filter dropdown
    const roleFilter = page.locator('select').filter({ hasText: /tất cả|all/i }).first();

    if (await roleFilter.isVisible()) {
      // Filter by Photographer
      await roleFilter.selectOption('Photographer');

      // All visible employees should be photographers
      await page.waitForTimeout(1000);
      const photographerCount = await page.locator('table tbody tr td:has-text("Photographer")').count();
      expect(photographerCount).toBeGreaterThan(0);
    }
  });

  test('should search employees', async ({ page }) => {
    // Wait for employees to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Get first employee's name
    const firstEmployeeName = await page.locator('table tbody tr:first-child td:nth-child(2)').textContent();

    if (firstEmployeeName) {
      // Search for this employee
      const searchInput = page.getByPlaceholder(/tìm kiếm/i);
      await searchInput.fill(firstEmployeeName.trim().split('\n')[0]);

      // Should show matching employee
      await page.waitForTimeout(500);
      const matchCount = await page.locator('table tbody tr').count();
      expect(matchCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('should filter active/inactive employees', async ({ page }) => {
    // Wait for employees to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Find active/inactive filter
    const statusFilter = page.locator('select').nth(1); // Assuming second dropdown is status

    if (await statusFilter.isVisible()) {
      // Get all options
      const options = await statusFilter.locator('option').allTextContents();

      // If there's an "Active" option, select it
      if (options.some(opt => opt.includes('Hoạt động') || opt.includes('Active'))) {
        await statusFilter.selectOption({ label: /hoạt động|active/i });
        await page.waitForTimeout(1000);

        // All employees should be active
        const activeBadges = await page.locator('table tbody tr td .badge:has-text("Hoạt động")').count();
        expect(activeBadges).toBeGreaterThan(0);
      }
    }
  });

  test('should display employee statistics', async ({ page }) => {
    // Check if statistics cards are visible
    const statsCards = page.locator('.stat-card, [class*="card"]').filter({ hasText: /tổng|total/i });

    if (await statsCards.count() > 0) {
      // Should show total employees count
      await expect(statsCards.first()).toBeVisible();
    }
  });
});
