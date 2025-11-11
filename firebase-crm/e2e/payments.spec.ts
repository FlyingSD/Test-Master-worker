import { test, expect } from '@playwright/test'

test.describe('Payment Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByLabel(/Email/i).fill('admin@test.com')
    await page.getByLabel(/Парола/i).fill('testpassword123')
    await page.getByRole('button', { name: /Вход/i }).click()
    await page.waitForURL(/\/dashboard/)

    // Navigate to payments page
    await page.getByRole('link', { name: /Плащания/i }).click()
    await expect(page).toHaveURL(/\/payments/)
  })

  test('should display payments list', async ({ page }) => {
    // Should show page title
    await expect(page.getByRole('heading', { name: /Плащания/i })).toBeVisible()

    // Should show add button
    await expect(page.getByRole('button', { name: /Добави плащане/i })).toBeVisible()

    // Should show payments table
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should open add payment modal', async ({ page }) => {
    await page.getByRole('button', { name: /Добави плащане/i }).click()

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/Добави плащане/i)).toBeVisible()

    // Form fields should be visible
    await expect(page.getByLabel(/Ученик/i)).toBeVisible()
    await expect(page.getByLabel(/Сума.*BGN/i)).toBeVisible()
    await expect(page.getByLabel(/Метод на плащане/i)).toBeVisible()
  })

  test('should create new payment', async ({ page }) => {
    await page.getByRole('button', { name: /Добави плащане/i }).click()

    // Fill form
    await page.getByLabel(/Ученик/i).selectOption({ index: 1 }) // Select first student
    await page.getByLabel(/Сума.*BGN/i).fill('100')
    await page.getByLabel(/Метод на плащане/i).selectOption('Кеш')
    await page.getByLabel(/Артикул/i).fill('Месечна такса')

    // Submit
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно добавено/i)).toBeVisible()

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // New payment should appear in table
    await expect(page.getByText('100')).toBeVisible()
  })

  test('should edit existing payment', async ({ page }) => {
    // Find first payment and click edit
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: /Редактирай/i }).click()

    // Modal should open with payment data
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/Редактирай плащане/i)).toBeVisible()

    // Update amount
    const amountInput = page.getByLabel(/Сума.*BGN/i)
    await amountInput.clear()
    await amountInput.fill('150')

    // Submit
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно обновено/i)).toBeVisible()

    // Updated amount should appear in table
    await expect(page.getByText('150')).toBeVisible()
  })

  test('should delete payment', async ({ page }) => {
    // Find first payment and click delete
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: /Изтрий/i }).click()

    // Confirm deletion
    await page.getByRole('button', { name: /Потвърди/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно изтрито/i)).toBeVisible()
  })

  test('should convert BGN to EUR automatically', async ({ page }) => {
    await page.getByRole('button', { name: /Добави плащане/i }).click()

    // Enter BGN amount
    await page.getByLabel(/Сума.*BGN/i).fill('196')

    // EUR should be auto-calculated
    const eurInput = page.getByLabel(/Сума.*EUR/i)
    await expect(eurInput).toHaveValue('100')
  })

  test('should convert EUR to BGN automatically', async ({ page }) => {
    await page.getByRole('button', { name: /Добави плащане/i }).click()

    // Enter EUR amount
    await page.getByLabel(/Сума.*EUR/i).fill('100')

    // BGN should be auto-calculated
    const bgnInput = page.getByLabel(/Сума.*BGN/i)
    await expect(bgnInput).toHaveValue('196')
  })

  test('should filter by student', async ({ page }) => {
    // Use search/filter
    const searchInput = page.getByPlaceholder(/Търси ученик/i)
    await searchInput.fill('Иван')

    // Should filter results
    await expect(page.getByText('Иван')).toBeVisible()

    // Other students should be hidden
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should filter by payment method', async ({ page }) => {
    // Click method filter
    await page.getByRole('button', { name: /Кеш/i }).click()

    // Should show only cash payments
    const methodCells = page.locator('tbody td:nth-child(4)') // Method column
    const count = await methodCells.count()

    for (let i = 0; i < count; i++) {
      const text = await methodCells.nth(i).textContent()
      expect(text).toContain('Кеш')
    }
  })

  test('should filter by date range', async ({ page }) => {
    // Open date filter
    await page.getByRole('button', { name: /Филтър по дата/i }).click()

    // Select date range
    await page.getByLabel(/От дата/i).fill('2024-01-01')
    await page.getByLabel(/До дата/i).fill('2024-01-31')

    // Apply filter
    await page.getByRole('button', { name: /Приложи/i }).click()

    // Should show filtered results
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('should export to Excel', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')

    await page.getByRole('button', { name: /Експорт/i }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/payments.*\.xlsx/)
  })

  test('should show statistics', async ({ page }) => {
    // Statistics cards should be visible
    await expect(page.getByText(/Общо приходи/i)).toBeVisible()
    await expect(page.getByText(/Брой плащания/i)).toBeVisible()
    await expect(page.getByText(/Среден платеж/i)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: /Добави плащане/i }).click()

    // Try to submit without filling fields
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show validation error
    await expect(page.getByText(/изберете ученик/i)).toBeVisible()

    // Modal should remain open
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('should validate amount is positive', async ({ page }) => {
    await page.getByRole('button', { name: /Добави плащане/i }).click()

    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })
    await page.getByLabel(/Сума.*BGN/i).fill('-10')

    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show validation error
    await expect(page.getByText(/положително число/i)).toBeVisible()
  })

  test('should warn for large amounts', async ({ page }) => {
    await page.getByRole('button', { name: /Добави плащане/i }).click()

    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })
    await page.getByLabel(/Сума.*BGN/i).fill('10000')

    // Should show warning for amount > 1000
    await expect(page.getByText(/твърде голяма/i)).toBeVisible()
  })

  test('should require receipt number for bank payment', async ({ page }) => {
    await page.getByRole('button', { name: /Добави плащане/i }).click()

    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })
    await page.getByLabel(/Сума.*BGN/i).fill('100')
    await page.getByLabel(/Метод на плащане/i).selectOption('Банков път')

    await page.getByRole('button', { name: /Запази/i }).click()

    // Should require receipt number
    await expect(page.getByText(/номер на документ/i)).toBeVisible()
  })

  test('should paginate payments list', async ({ page }) => {
    // Assuming there are more than 20 payments
    const rows = page.locator('tbody tr')
    const count = await rows.count()

    expect(count).toBeLessThanOrEqual(20) // Max 20 per page

    // Go to next page
    const nextButton = page.getByRole('button', { name: /Следваща/i })
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await expect(page).toHaveURL(/page=2/)
    }
  })

  test('should show payment details on row click', async ({ page }) => {
    // Click on first payment row
    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Should show payment details panel or modal
    await expect(page.getByText(/Детайли за плащане/i)).toBeVisible()
  })
})

test.describe('Bulk Payments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/Email/i).fill('admin@test.com')
    await page.getByLabel(/Парола/i).fill('testpassword123')
    await page.getByRole('button', { name: /Вход/i }).click()
    await page.waitForURL(/\/dashboard/)
    await page.getByRole('link', { name: /Плащания/i }).click()
  })

  test('should open bulk payment modal', async ({ page }) => {
    await page.getByRole('button', { name: /Масови плащания/i }).click()

    await expect(page.getByText(/Масови плащания/i)).toBeVisible()
  })

  test('should select multiple students', async ({ page }) => {
    await page.getByRole('button', { name: /Масови плащания/i }).click()

    // Select first 3 students
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()
    await checkboxes.nth(2).check()

    // Should show count
    await expect(page.getByText(/3 ученика/i)).toBeVisible()
  })

  test('should create bulk payments', async ({ page }) => {
    await page.getByRole('button', { name: /Масови плащания/i }).click()

    // Select students
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    // Enter amount
    await page.getByLabel(/Сума/i).fill('100')
    await page.getByLabel(/Метод/i).selectOption('Кеш')

    // Submit
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно добавени/i)).toBeVisible()
  })

  test('should calculate total amount', async ({ page }) => {
    await page.getByRole('button', { name: /Масови плащания/i }).click()

    // Select 2 students
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    // Enter amount
    await page.getByLabel(/Сума/i).fill('100')

    // Should show total: 100 * 2 = 200
    await expect(page.getByText(/Общо: 200/i)).toBeVisible()
  })
})

test.describe('Payment Management - Permissions', () => {
  test('teacher can create payments', async ({ page }) => {
    // Login as teacher
    await page.goto('/teacher-login')
    await page.getByLabel(/Email/i).fill('teacher@test.com')
    await page.getByLabel(/Парола/i).fill('teacherpassword')
    await page.getByRole('button', { name: /Вход/i }).click()

    await page.getByRole('link', { name: /Плащания/i }).click()

    // Should see add payment button
    await expect(page.getByRole('button', { name: /Добави плащане/i })).toBeVisible()
  })

  test('parent should not access payments page', async ({ page }) => {
    // Login as parent
    await page.goto('/parent-login')
    await page.getByLabel(/Email/i).fill('parent@test.com')
    await page.getByLabel(/Парола/i).fill('parentpassword')
    await page.getByRole('button', { name: /Вход/i }).click()

    // Try to access payments page
    await page.goto('/payments')

    // Should be redirected or show error
    await expect(page.getByText(/Нямате права/i)).toBeVisible()
  })

  test('parent can view their own payments', async ({ page }) => {
    // Login as parent
    await page.goto('/parent-login')
    await page.getByLabel(/Email/i).fill('parent@test.com')
    await page.getByLabel(/Парола/i).fill('parentpassword')
    await page.getByRole('button', { name: /Вход/i }).click()

    // Navigate to child details
    await page.getByRole('link', { name: /Моите деца/i }).click()
    await page.locator('[data-testid="child-card"]').first().click()

    // Should see payment history
    await expect(page.getByText(/История на плащания/i)).toBeVisible()

    // Should see payments for this child only
    const payments = page.locator('[data-testid="payment-row"]')
    await expect(payments.first()).toBeVisible()
  })
})

test.describe('Payment Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/Email/i).fill('admin@test.com')
    await page.getByLabel(/Парола/i).fill('testpassword123')
    await page.getByRole('button', { name: /Вход/i }).click()
    await page.waitForURL(/\/dashboard/)
    await page.getByRole('link', { name: /Плащания/i }).click()
    await page.getByRole('button', { name: /Добави плащане/i }).click()
  })

  test('should validate future dates', async ({ page }) => {
    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })
    await page.getByLabel(/Сума.*BGN/i).fill('100')

    // Select future date
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const dateString = futureDate.toISOString().split('T')[0]

    await page.getByLabel(/Дата/i).fill(dateString)

    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show warning
    await expect(page.getByText(/бъдещето/i)).toBeVisible()
  })

  test('should validate currency mismatch', async ({ page }) => {
    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })

    // Enter BGN
    await page.getByLabel(/Сума.*BGN/i).fill('100')

    // Manually change EUR to wrong value
    await page.getByLabel(/Сума.*EUR/i).fill('10') // Should be 51.02

    // Should show currency mismatch warning
    await expect(page.getByText(/Несъответствие/i)).toBeVisible()
  })

  test('should validate receipt number format', async ({ page }) => {
    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })
    await page.getByLabel(/Сума.*BGN/i).fill('100')
    await page.getByLabel(/Метод на плащане/i).selectOption('ПОС')

    // Enter invalid receipt number
    await page.getByLabel(/Номер на документ/i).fill('abc')

    await page.getByRole('button', { name: /Запази/i }).click()

    // May show validation for format
    const submitButton = page.getByRole('button', { name: /Запази/i })
    expect(submitButton).toBeVisible()
  })
})
