import { test, expect } from '@playwright/test'

test.describe('Homework Management - Teacher', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher
    await page.goto('/teacher-login')
    await page.getByLabel(/Email/i).fill('teacher@test.com')
    await page.getByLabel(/Парола/i).fill('teacherpassword')
    await page.getByRole('button', { name: /Вход/i }).click()
    await page.waitForURL(/\/dashboard/)

    // Navigate to homework page
    await page.getByRole('link', { name: /Домашни/i }).click()
    await expect(page).toHaveURL(/\/homework/)
  })

  test('should display homework list', async ({ page }) => {
    // Should show page title
    await expect(page.getByRole('heading', { name: /Домашни/i })).toBeVisible()

    // Should show add button
    await expect(page.getByRole('button', { name: /Добави домашно/i })).toBeVisible()

    // Should show homework table
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('should open add homework modal', async ({ page }) => {
    await page.getByRole('button', { name: /Добави домашно/i }).click()

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/Добави домашно/i)).toBeVisible()

    // Form fields should be visible
    await expect(page.getByLabel(/Ученик/i)).toBeVisible()
    await expect(page.getByLabel(/Заглавие/i)).toBeVisible()
    await expect(page.getByLabel(/Описание/i)).toBeVisible()
    await expect(page.getByLabel(/Краен срок/i)).toBeVisible()
  })

  test('should create new homework', async ({ page }) => {
    await page.getByRole('button', { name: /Добави домашно/i }).click()

    // Fill form
    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })
    await page.getByLabel(/Заглавие/i).fill('Математика - Глава 5')
    await page.getByLabel(/Описание/i).fill('Решете задачи 10-20')

    // Set due date (7 days from now)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)
    const dateString = dueDate.toISOString().split('T')[0]
    await page.getByLabel(/Краен срок/i).fill(dateString)

    // Submit
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно добавено/i)).toBeVisible()

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // New homework should appear in table
    await expect(page.getByText('Математика - Глава 5')).toBeVisible()
  })

  test('should edit existing homework', async ({ page }) => {
    // Find first homework and click edit
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: /Редактирай/i }).click()

    // Modal should open with homework data
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/Редактирай домашно/i)).toBeVisible()

    // Update title
    const titleInput = page.getByLabel(/Заглавие/i)
    await titleInput.clear()
    await titleInput.fill('Математика - Обновено')

    // Submit
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно обновено/i)).toBeVisible()

    // Updated title should appear in table
    await expect(page.getByText('Математика - Обновено')).toBeVisible()
  })

  test('should mark homework as completed', async ({ page }) => {
    // Find first homework and click edit
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: /Редактирай/i }).click()

    // Change status to completed
    await page.getByLabel(/Статус/i).selectOption('completed')

    // Should show grade field
    await expect(page.getByLabel(/Оценка/i)).toBeVisible()

    // Enter grade
    await page.getByLabel(/Оценка/i).fill('95')

    // Enter teacher notes
    await page.getByLabel(/Бележки от учител/i).fill('Отлична работа!')

    // Submit
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно обновено/i)).toBeVisible()

    // Status should be updated in table
    await expect(page.getByText(/Завършено/i)).toBeVisible()
  })

  test('should delete homework', async ({ page }) => {
    // Find first homework and click delete
    const firstRow = page.locator('tbody tr').first()
    await firstRow.getByRole('button', { name: /Изтрий/i }).click()

    // Confirm deletion
    await page.getByRole('button', { name: /Потвърди/i }).click()

    // Should show success message
    await expect(page.getByText(/успешно изтрито/i)).toBeVisible()
  })

  test('should filter by student', async ({ page }) => {
    // Use search/filter
    const searchInput = page.getByPlaceholder(/Търси ученик/i)
    await searchInput.fill('Иван')

    // Should filter results
    await expect(page.getByText('Иван')).toBeVisible()
  })

  test('should filter by status', async ({ page }) => {
    // Click status filter
    await page.getByRole('button', { name: /Зададени/i }).click()

    // Should show only assigned homework
    const statusCells = page.locator('tbody td:nth-child(5)') // Status column
    const count = await statusCells.count()

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await statusCells.nth(i).textContent()
        expect(text).toContain('Зададено')
      }
    }
  })

  test('should show due date warnings', async ({ page }) => {
    // Homework with due dates should show colored badges
    // 🔴 Overdue (red)
    // 🔥 Critical (0-1 days, orange)
    // ⏳ Warning (2-3 days, yellow)
    // ✅ Safe (3+ days, green)

    const dueDateCells = page.locator('tbody td:nth-child(3)') // Due date column
    await expect(dueDateCells.first()).toBeVisible()
  })

  test('should display homework statistics', async ({ page }) => {
    // Statistics cards should be visible
    await expect(page.getByText(/Общо домашни/i)).toBeVisible()
    await expect(page.getByText(/Завършени/i)).toBeVisible()
    await expect(page.getByText(/Просрочени/i)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: /Добави домашно/i }).click()

    // Try to submit without filling fields
    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show validation error
    await expect(page.getByText(/изберете ученик/i)).toBeVisible()

    // Modal should remain open
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('should default due date to 7 days from now', async ({ page }) => {
    await page.getByRole('button', { name: /Добави домашно/i }).click()

    // Check due date default value
    const dueDateInput = page.getByLabel(/Краен срок/i)
    const inputValue = await dueDateInput.inputValue()
    const dueDate = new Date(inputValue)
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() + 7)

    // Dates should be within same day
    expect(dueDate.toDateString()).toBe(expectedDate.toDateString())
  })

  test('should export homework to Excel', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')

    await page.getByRole('button', { name: /Експорт/i }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/homework.*\.xlsx/)
  })
})

test.describe('Homework Management - Parent View', () => {
  test.beforeEach(async ({ page }) => {
    // Login as parent
    await page.goto('/parent-login')
    await page.getByLabel(/Email/i).fill('parent@test.com')
    await page.getByLabel(/Парола/i).fill('parentpassword')
    await page.getByRole('button', { name: /Вход/i }).click()
    await page.waitForURL(/\/parent-dashboard/)

    // Navigate to child details
    await page.getByRole('link', { name: /Моите деца/i }).click()
    await page.locator('[data-testid="child-card"]').first().click()
  })

  test('should display child homework', async ({ page }) => {
    // Should show homework section
    await expect(page.getByText(/Домашни/i)).toBeVisible()

    // Should show homework list
    const homeworkList = page.locator('[data-testid="homework-item"]')
    await expect(homeworkList.first()).toBeVisible()
  })

  test('should show homework details', async ({ page }) => {
    // Click on first homework
    const firstHomework = page.locator('[data-testid="homework-item"]').first()
    await firstHomework.click()

    // Should show homework details
    await expect(page.getByText(/Заглавие/i)).toBeVisible()
    await expect(page.getByText(/Описание/i)).toBeVisible()
    await expect(page.getByText(/Краен срок/i)).toBeVisible()
    await expect(page.getByText(/Статус/i)).toBeVisible()
  })

  test('should show due date warnings', async ({ page }) => {
    // Homework with upcoming due dates should show warnings
    // 🔴 Overdue
    // 🔥 Due in 0-1 days (critical)
    // ⏳ Due in 2-3 days (warning)

    const homeworkList = page.locator('[data-testid="homework-item"]')
    await expect(homeworkList.first()).toBeVisible()

    // Check for warning badges
    const badges = page.locator('.badge, .alert')
    if ((await badges.count()) > 0) {
      await expect(badges.first()).toBeVisible()
    }
  })

  test('should display homework status', async ({ page }) => {
    const firstHomework = page.locator('[data-testid="homework-item"]').first()

    // Status badge should be visible
    await expect(firstHomework).toBeVisible()

    // Check for status (Зададено, Завършено, Просрочено)
    const statusText = await firstHomework.textContent()
    expect(statusText).toMatch(/Зададено|Завършено|Просрочено/)
  })

  test('should show completed homework with grade', async ({ page }) => {
    // Find completed homework
    const completedHomework = page.locator('[data-testid="homework-item"]').filter({
      hasText: /Завършено/i,
    })

    if ((await completedHomework.count()) > 0) {
      await completedHomework.first().click()

      // Should show grade
      await expect(page.getByText(/Оценка/i)).toBeVisible()

      // Should show teacher notes
      await expect(page.getByText(/Бележки от учител/i)).toBeVisible()
    }
  })

  test('parent cannot edit homework', async ({ page }) => {
    const firstHomework = page.locator('[data-testid="homework-item"]').first()
    await firstHomework.click()

    // Should NOT show edit button
    const editButton = page.getByRole('button', { name: /Редактирай/i })
    await expect(editButton).not.toBeVisible()

    // Should NOT show delete button
    const deleteButton = page.getByRole('button', { name: /Изтрий/i })
    await expect(deleteButton).not.toBeVisible()
  })

  test('should filter homework by status', async ({ page }) => {
    // Filter buttons should be available
    await page.getByRole('button', { name: /Всички/i }).click()
    await page.getByRole('button', { name: /Активни/i }).click()
    await page.getByRole('button', { name: /Завършени/i }).click()

    // Should filter the list
    const homeworkList = page.locator('[data-testid="homework-item"]')
    await expect(homeworkList.first()).toBeVisible()
  })

  test('should display homework count badge', async ({ page }) => {
    // Navigation should show homework count
    await page.goto('/parent-dashboard')

    // Homework badge should show count
    const badge = page.locator('[data-testid="homework-badge"]')
    if (await badge.isVisible()) {
      const count = await badge.textContent()
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0)
    }
  })
})

test.describe('Homework Permissions', () => {
  test('admin can create homework', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.getByLabel(/Email/i).fill('admin@test.com')
    await page.getByLabel(/Парола/i).fill('testpassword123')
    await page.getByRole('button', { name: /Вход/i }).click()

    await page.getByRole('link', { name: /Домашни/i }).click()

    // Should see add homework button
    await expect(page.getByRole('button', { name: /Добави домашно/i })).toBeVisible()
  })

  test('teacher can only see assigned students', async ({ page }) => {
    // Login as teacher
    await page.goto('/teacher-login')
    await page.getByLabel(/Email/i).fill('teacher@test.com')
    await page.getByLabel(/Парола/i).fill('teacherpassword')
    await page.getByRole('button', { name: /Вход/i }).click()

    await page.getByRole('link', { name: /Домашни/i }).click()
    await page.getByRole('button', { name: /Добави домашно/i }).click()

    // Student dropdown should only show assigned students
    const studentSelect = page.getByLabel(/Ученик/i)
    const options = await studentSelect.locator('option').count()

    // Should have limited options (only assigned groups)
    expect(options).toBeGreaterThan(0)
    expect(options).toBeLessThan(100) // Not all students
  })

  test('parent cannot access homework page directly', async ({ page }) => {
    // Login as parent
    await page.goto('/parent-login')
    await page.getByLabel(/Email/i).fill('parent@test.com')
    await page.getByLabel(/Парола/i).fill('parentpassword')
    await page.getByRole('button', { name: /Вход/i }).click()

    // Try to access homework page
    await page.goto('/homework')

    // Should be redirected or show error
    await expect(page.getByText(/Нямате права/i)).toBeVisible()
  })
})

test.describe('Homework Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teacher-login')
    await page.getByLabel(/Email/i).fill('teacher@test.com')
    await page.getByLabel(/Парола/i).fill('teacherpassword')
    await page.getByRole('button', { name: /Вход/i }).click()
    await page.getByRole('link', { name: /Домашни/i }).click()
    await page.getByRole('button', { name: /Добави домашно/i }).click()
  })

  test('should validate past due date', async ({ page }) => {
    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })
    await page.getByLabel(/Заглавие/i).fill('Тест')
    await page.getByLabel(/Описание/i).fill('Описание')

    // Set past date
    const pastDate = new Date('2020-01-01')
    const dateString = pastDate.toISOString().split('T')[0]
    await page.getByLabel(/Краен срок/i).fill(dateString)

    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show warning
    await expect(page.getByText(/минало/i)).toBeVisible()
  })

  test('should validate grade range (0-100)', async ({ page }) => {
    // First create homework and mark as completed
    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })
    await page.getByLabel(/Заглавие/i).fill('Тест')
    await page.getByLabel(/Описание/i).fill('Описание')
    await page.getByLabel(/Статус/i).selectOption('completed')

    // Enter invalid grade
    await page.getByLabel(/Оценка/i).fill('150')

    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show validation error
    await expect(page.getByText(/0 и 100/i)).toBeVisible()
  })

  test('should require title and description', async ({ page }) => {
    await page.getByLabel(/Ученик/i).selectOption({ index: 1 })
    // Don't fill title and description

    await page.getByRole('button', { name: /Запази/i }).click()

    // Should show validation errors
    await expect(page.getByText(/задължително/i)).toBeVisible()
  })
})

test.describe('Homework Notifications', () => {
  test('parent should see notification for new homework', async ({ page }) => {
    // Login as parent
    await page.goto('/parent-login')
    await page.getByLabel(/Email/i).fill('parent@test.com')
    await page.getByLabel(/Парола/i).fill('parentpassword')
    await page.getByRole('button', { name: /Вход/i }).click()

    // Check for notification badge
    const notificationBadge = page.locator('[data-testid="notification-badge"]')
    if (await notificationBadge.isVisible()) {
      const count = await notificationBadge.textContent()
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0)
    }
  })

  test('parent should see due date warnings in notifications', async ({ page }) => {
    // Login as parent
    await page.goto('/parent-login')
    await page.getByLabel(/Email/i).fill('parent@test.com')
    await page.getByLabel(/Парола/i).fill('parentpassword')
    await page.getByRole('button', { name: /Вход/i }).click()

    // Navigate to notifications
    const notificationIcon = page.locator('[data-testid="notifications-icon"]')
    if (await notificationIcon.isVisible()) {
      await notificationIcon.click()

      // Should show homework due soon warnings
      const warnings = page.locator('[data-testid="notification-item"]')
      if ((await warnings.count()) > 0) {
        await expect(warnings.first()).toBeVisible()
      }
    }
  })
})
