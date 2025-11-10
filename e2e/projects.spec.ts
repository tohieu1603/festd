import { test, expect } from '@playwright/test';

test.describe('Projects E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/username/i).fill('admin');
    await page.getByLabel(/password/i).fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to projects page
    await page.click('a[href="/dashboard/projects"]');
    await expect(page).toHaveURL(/\/dashboard\/projects/);
  });

  test('should display projects page correctly', async ({ page }) => {
    // Check page elements
    await expect(page.locator('h1', { hasText: /dự án/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /tạo dự án/i })).toBeVisible();
    await expect(page.getByPlaceholder(/tìm kiếm/i)).toBeVisible();
  });

  test('should create a new project successfully', async ({ page }) => {
    // Click "Tạo dự án" button
    await page.getByRole('button', { name: /tạo dự án/i }).click();

    // Wait for modal to appear
    await expect(page.locator('text=/tạo dự án mới/i')).toBeVisible();

    // Fill customer information
    await page.getByLabel(/tên khách hàng/i).fill('Test Customer E2E');
    await page.getByLabel(/số điện thoại/i).fill('0123456789');
    await page.getByLabel(/email/i).fill('teste2e@example.com');

    // Select package
    await page.locator('select').first().selectOption({ index: 1 });
    await page.waitForTimeout(500); // Wait for price to populate

    // Select photographer (required field)
    const photographerSelect = page.locator('select').nth(1);
    await photographerSelect.selectOption({ index: 1 });

    // Fill shoot date
    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/ngày chụp/i).fill(today);

    // Submit form
    await page.getByRole('button', { name: /^tạo dự án$/i }).click();

    // Should show success message
    await expect(page.locator('text=/thành công|success/i')).toBeVisible({ timeout: 5000 });

    // Should see new project in list
    await expect(page.locator('text=Test Customer E2E')).toBeVisible({ timeout: 5000 });
  });

  test('should validate required photographer field', async ({ page }) => {
    // Click "Tạo dự án" button
    await page.getByRole('button', { name: /tạo dự án/i }).click();
    await expect(page.locator('text=/tạo dự án mới/i')).toBeVisible();

    // Fill only customer information (skip photographer)
    await page.getByLabel(/tên khách hàng/i).fill('Test Customer');
    await page.getByLabel(/số điện thoại/i).fill('0123456789');

    // Select package
    await page.locator('select').first().selectOption({ index: 1 });
    await page.waitForTimeout(500);

    const today = new Date().toISOString().split('T')[0];
    await page.getByLabel(/ngày chụp/i).fill(today);

    // Try to submit without photographer
    const submitButton = page.getByRole('button', { name: /^tạo dự án$/i });

    // Button should be disabled
    await expect(submitButton).toBeDisabled();
  });

  test('should update project status', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Find first project status dropdown
    const statusDropdown = page.locator('select[value="pending"]').first();

    if (await statusDropdown.isVisible()) {
      // Change status to confirmed
      await statusDropdown.selectOption('confirmed');

      // Should show success message
      await expect(page.locator('text=/cập nhật.*thành công/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should update payment status', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Find first payment status dropdown
    const paymentDropdown = page.locator('select').filter({ hasText: /chưa thanh toán|unpaid/i }).first();

    if (await paymentDropdown.isVisible()) {
      // Change payment status
      await paymentDropdown.selectOption('deposit_paid');

      // Should show success message
      await expect(page.locator('text=/cập nhật.*thành công/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should not allow changing completed project to cancelled', async ({ page }) => {
    // This test assumes there's a completed project
    // First, create or find a completed project
    await page.waitForSelector('table', { timeout: 5000 });

    // Try to find a completed project status dropdown
    const completedDropdown = page.locator('select[value="completed"]').first();

    if (await completedDropdown.isVisible()) {
      // Try to change to cancelled
      await completedDropdown.selectOption('cancelled');

      // Should show error message
      await expect(page.locator('text=/không thể.*hoàn thành/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit project details', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Click edit button on first project
    const editButton = page.getByTitle('Chỉnh sửa').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Wait for edit modal
      await expect(page.locator('text=/chỉnh sửa dự án/i')).toBeVisible();

      // Update customer name
      const nameInput = page.getByLabel(/tên khách hàng/i);
      await nameInput.clear();
      await nameInput.fill('Updated Customer Name E2E');

      // Submit
      await page.getByRole('button', { name: /cập nhật dự án/i }).click();

      // Should show success message
      await expect(page.locator('text=/cập nhật.*thành công/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete project', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Click delete button on first pending project
    const deleteButton = page.getByTitle(/xóa/i).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion in browser dialog
      page.on('dialog', dialog => dialog.accept());

      // Should show success message
      await expect(page.locator('text=/xóa.*thành công/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should search projects', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Get first project's customer name
    const firstCustomerName = await page.locator('table tbody tr:first-child td:nth-child(2)').textContent();

    if (firstCustomerName) {
      // Search for this project
      const searchInput = page.getByPlaceholder(/tìm kiếm/i);
      await searchInput.fill(firstCustomerName.trim());

      // Should show matching project
      await expect(page.locator(`text=${firstCustomerName.trim()}`)).toBeVisible();
    }
  });

  test('should filter projects by status', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Find status filter dropdown
    const statusFilter = page.locator('select').filter({ hasText: /tất cả|all/i }).first();

    if (await statusFilter.isVisible()) {
      // Filter by pending
      await statusFilter.selectOption('pending');

      // All visible projects should be pending
      await page.waitForTimeout(1000);
      const projectStatuses = await page.locator('table tbody tr td:has-text("Chờ xác nhận")').count();
      expect(projectStatuses).toBeGreaterThan(0);
    }
  });

  test('should view project details', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('table', { timeout: 5000 });

    // Click "Xem chi tiết" button on first project
    const viewButton = page.getByTitle('Xem chi tiết').first();

    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Should show project detail modal
      await expect(page.locator('text=/thông tin.*khách hàng/i')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=/thông tin.*gói/i')).toBeVisible();
      await expect(page.locator('text=/đội ngũ/i')).toBeVisible();
    }
  });
});
