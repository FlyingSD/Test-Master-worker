import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Svetlinki CRM/)

    // Should show login form
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Парола/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Вход/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('invalid@test.com')
    await page.getByLabel(/Парола/i).fill('wrongpassword')

    await page.getByRole('button', { name: /Вход/i }).click()

    // Should show error message
    await expect(page.getByText(/Грешен email или парола/i)).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Fill login form
    await page.getByLabel(/Email/i).fill('admin@test.com')
    await page.getByLabel(/Парола/i).fill('testpassword123')

    await page.getByRole('button', { name: /Вход/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/i)

    // Should show user menu
    await expect(page.getByText(/Dashboard/i)).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel(/Email/i).fill('admin@test.com')
    await page.getByLabel(/Парола/i).fill('testpassword123')
    await page.getByRole('button', { name: /Вход/i }).click()

    await page.waitForURL(/\/dashboard/)

    // Logout
    await page.getByRole('button', { name: /Изход/i }).click()

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/students')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should remember me functionality', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('admin@test.com')
    await page.getByLabel(/Парола/i).fill('testpassword123')

    // Check "Remember me"
    await page.getByLabel(/Запомни ме/i).check()

    await page.getByRole('button', { name: /Вход/i }).click()

    await page.waitForURL(/\/dashboard/)

    // Refresh page
    await page.reload()

    // Should still be logged in
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /Вход/i }).click()

    // Should show validation messages
    await expect(page.getByText(/Email е задължителен/i)).toBeVisible()
    await expect(page.getByText(/Парола е задължителна/i)).toBeVisible()
  })

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('not-an-email')
    await page.getByLabel(/Парола/i).fill('password123')

    await page.getByRole('button', { name: /Вход/i }).click()

    await expect(page.getByText(/Невалиден email/i)).toBeVisible()
  })

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: /Забравена парола/i }).click()

    await expect(page).toHaveURL(/\/forgot-password/)
    await expect(page.getByText(/Възстанови парола/i)).toBeVisible()
  })

  test('should navigate to register page for parents', async ({ page }) => {
    await page.getByRole('link', { name: /Регистрация за родители/i }).click()

    await expect(page).toHaveURL(/\/parent-register/)
    await expect(page.getByText(/Регистрация/i)).toBeVisible()
  })
})

test.describe('Admin Login', () => {
  test('should access admin panel with admin credentials', async ({ page }) => {
    await page.goto('/admin-login')

    await page.getByLabel(/Email/i).fill('admin@test.com')
    await page.getByLabel(/Парола/i).fill('adminpassword')

    await page.getByRole('button', { name: /Вход/i }).click()

    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByText(/Admin Panel/i)).toBeVisible()
  })

  test('should deny access to non-admin users', async ({ page }) => {
    await page.goto('/admin-login')

    await page.getByLabel(/Email/i).fill('teacher@test.com')
    await page.getByLabel(/Парола/i).fill('teacherpassword')

    await page.getByRole('button', { name: /Вход/i }).click()

    await expect(page.getByText(/Нямате права/i)).toBeVisible()
  })
})

test.describe('Teacher Login', () => {
  test('should access teacher pages with teacher credentials', async ({ page }) => {
    await page.goto('/teacher-login')

    await page.getByLabel(/Email/i).fill('teacher@test.com')
    await page.getByLabel(/Парола/i).fill('teacherpassword')

    await page.getByRole('button', { name: /Вход/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)

    // Teachers should NOT see admin menu
    await expect(page.getByRole('link', { name: /Admin Panel/i })).not.toBeVisible()
  })
})

test.describe('Parent Login', () => {
  test('should access parent portal with parent credentials', async ({ page }) => {
    await page.goto('/parent-login')

    await page.getByLabel(/Email/i).fill('parent@test.com')
    await page.getByLabel(/Парола/i).fill('parentpassword')

    await page.getByRole('button', { name: /Вход/i }).click()

    await expect(page).toHaveURL(/\/parent-dashboard/)
    await expect(page.getByText(/Моите деца/i)).toBeVisible()
  })

  test('parent should only see their own children', async ({ page }) => {
    await page.goto('/parent-login')

    await page.getByLabel(/Email/i).fill('parent@test.com')
    await page.getByLabel(/Парола/i).fill('parentpassword')

    await page.getByRole('button', { name: /Вход/i }).click()

    await page.waitForURL(/\/parent-dashboard/)

    // Navigate to children page
    await page.getByRole('link', { name: /Моите деца/i }).click()

    // Should only see linked children
    const children = page.locator('[data-testid="child-card"]')
    await expect(children).toHaveCount(1) // Assuming parent has 1 child
  })
})
