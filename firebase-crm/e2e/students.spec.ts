import { test, expect } from '@playwright/test'

test.describe('Student Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByLabel(/Email/i).fill('admin@test.com')
    await page.getByLabel(/Парола/i).fill('testpassword123')
    await page.getByRole('button', { name: /Вход/i }).click()
    await page.waitForURL(/\/dashboard/)

    // Navigate to students page
    await page.getByRole('link', { name: /Ученици/i }).click()
    await expect(page).toHaveURL(/\/students/)
  })

  test('should display students list', async ({ page }) => {
    // Should show page title
    await expect(page.getByRole('heading', { name: /Ученици/i })).toBeVisible()

    // Should show add button
    await expect(page.getByRole('button', { name: /Добави ученик/i })).toBeVisible()

    // Should show students table
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should open add student modal', async ({ page }) => {
    await page.getByRole('button', { name: /Добави ученик/i }).click()

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/Добави ученик/i)).toBeVisible()

    // Form fields should be visible
    await expect(page.getByLabel(/Име и фамилия/i)).toBeVisible()
    await expect(page.getByLabel(/Група/i)).toBeVisible()
    await expect(page.getByLabel(/Месечна такса/i)).toBeVisible()
  })

  test('should create new student', async ({ page }) => {
    await page.getByRole('button', { name: /Добави ученик/i }).click()

    // Fill form
    await page.getByLabel(/Име и фамилия/i).fill('Иван Петров')
    await page.getByLabel(/Група/i).selectOption('Група 1')
    await page.getByLabel(/Месечна такса.*BGN/i).fill('100')
    await page.getByLabel(/Тип обучение/i).selectOption('Абакус')

    // Submit
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно добавен/i)).toBeVisible()

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // New student should appear in table
    await expect(page.getByText('Иван Петров')).toBeVisible()
  })

  test('should edit existing student', async ({ page }) => {
    // Find first student and click edit
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: /Редактирай/i }).click()

    // Modal should open with student data
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/Редактирай ученик/i)).toBeVisible()

    // Update name
    const nameInput = page.getByLabel(/Име и фамилия/i)
    await nameInput.clear()
    await nameInput.fill('Мария Георгиева')

    // Submit
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно обновен/i)).toBeVisible()

    // Updated name should appear in table
    await expect(page.getByText('Мария Георгиева')).toBeVisible()
  })

  test('should delete student', async ({ page }) => {
    // Find first student and click delete
    const firstRow = page.locator('tbody tr').first()
    const studentName = await firstRow.locator('td').first().textContent()

    await firstRow.getByRole('button', { name: /Изтрий/i }).click()

    // Confirm deletion
    await page.getByRole('button', { name: /Потвърди/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно изтрит/i)).toBeVisible()

    // Student should be removed from table
    if (studentName) {
      await expect(page.getByText(studentName)).not.toBeVisible()
    }
  })

  test('should search students', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Търси/i)
    await searchInput.fill('Иван')

    // Should filter results
    await expect(page.getByText('Иван')).toBeVisible()

    // Other students should be hidden
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    expect(count).toBeLessThanOrEqual(5) // Assuming there are less than 5 Ivans
  })

  test('should filter by group', async ({ page }) => {
    // Click group filter
    await page.getByRole('button', { name: /Група 1/i }).click()

    // Should show only students from Група 1
    const groupCells = page.locator('tbody td:nth-child(2)') // Group column
    const count = await groupCells.count()

    for (let i = 0; i < count; i++) {
      const text = await groupCells.nth(i).textContent()
      expect(text).toContain('Група 1')
    }
  })

  test('should filter by status', async ({ page }) => {
    // Click status filter
    await page.getByRole('button', { name: /Активни/i }).click()

    // Should show only active students
    const statusCells = page.locator('tbody td:nth-child(5)') // Status column
    const count = await statusCells.count()

    for (let i = 0; i < count; i++) {
      const element = statusCells.nth(i)
      await expect(element).toContainText(/Активен/i)
    }
  })

  test('should export to Excel', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')

    await page.getByRole('button', { name: /Експорт/i }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/students.*\.xlsx/)
  })

  test('should import from CSV', async ({ page }) => {
    await page.getByRole('button', { name: /Импорт/i }).click()

    // Modal should open
    await expect(page.getByText(/Импорт от CSV/i)).toBeVisible()

    // Upload CSV file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'students.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Име,Група,Такса\nТест Ученик,Група 1,100'),
    })

    // Submit
    await page.getByRole('button', { name: /Импортирай/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно импортирани/i)).toBeVisible()
  })

  test('should show QR code for student', async ({ page }) => {
    // Open edit modal for first student
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: /Редактирай/i }).click()

    // Click QR code button
    await page.getByRole('button', { name: /QR код/i }).click()

    // QR code should be visible
    await expect(page.getByAltText(/QR код/i)).toBeVisible()
  })

  test('should download QR code', async ({ page }) => {
    // Open edit modal for first student
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: /Редактирай/i }).click()

    // Click QR code button
    await page.getByRole('button', { name: /QR код/i }).click()

    // Download QR code
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /Изтегли/i }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/.*\.png/)
  })

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: /Добави ученик/i }).click()

    // Try to submit without filling fields
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show validation errors
    await expect(page.getByText(/задължително/i)).toBeVisible()

    // Modal should remain open
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('should convert BGN to EUR automatically', async ({ page }) => {
    await page.getByRole('button', { name: /Добави ученик/i }).click()

    // Enter BGN amount
    await page.getByLabel(/Месечна такса.*BGN/i).fill('196')

    // EUR should be auto-calculated
    const eurInput = page.getByLabel(/Месечна такса.*EUR/i)
    await expect(eurInput).toHaveValue('100')
  })

  test('should paginate students list', async ({ page }) => {
    // Assuming there are more than 20 students
    const rows = page.locator('tbody tr')
    const count = await rows.count()

    expect(count).toBeLessThanOrEqual(20) // Max 20 per page

    // Go to next page
    await page.getByRole('button', { name: /Следваща/i }).click()

    // Should show different students
    await expect(page).toHaveURL(/page=2/)
  })

  test('should show student details on row click', async ({ page }) => {
    // Click on first student row
    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()

    // Should show student details panel or modal
    await expect(page.getByText(/Детайли за ученик/i)).toBeVisible()
  })
})

test.describe('Student Management - Permissions', () => {
  test('teacher should only see assigned groups', async ({ page }) => {
    // Login as teacher
    await page.goto('/teacher-login')
    await page.getByLabel(/Email/i).fill('teacher@test.com')
    await page.getByLabel(/Парола/i).fill('teacherpassword')
    await page.getByRole('button', { name: /Вход/i }).click()

    await page.getByRole('link', { name: /Ученици/i }).click()

    // Should only see students from assigned groups
    const groupCells = page.locator('tbody td:nth-child(2)')
    const count = await groupCells.count()

    for (let i = 0; i < count; i++) {
      const text = await groupCells.nth(i).textContent()
      // Assuming teacher is assigned to Група 1
      expect(text).toContain('Група 1')
    }
  })

  test('parent should not access students page', async ({ page }) => {
    // Login as parent
    await page.goto('/parent-login')
    await page.getByLabel(/Email/i).fill('parent@test.com')
    await page.getByLabel(/Парола/i).fill('parentpassword')
    await page.getByRole('button', { name: /Вход/i }).click()

    // Try to access students page
    await page.goto('/students')

    // Should be redirected or show error
    await expect(page.getByText(/Нямате права/i)).toBeVisible()
  })
})
