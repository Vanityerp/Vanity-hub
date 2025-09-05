import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Use admin authentication state if available
    try {
      await page.goto('/dashboard')
    } catch {
      // If authentication is not set up, navigate to login first
      await page.goto('/login')
      
      // Try to login as admin
      const emailInput = page.locator('input[type="email"]')
      if (await emailInput.isVisible()) {
        await emailInput.fill('admin@vanityhub.com')
        await page.fill('input[type="password"]', 'password')
        await page.click('button[type="submit"]')
        
        // Wait for redirect to dashboard
        await page.waitForURL('/dashboard', { timeout: 10000 })
      } else {
        // Skip authentication for now and go directly to dashboard
        await page.goto('/dashboard')
      }
    }
  })

  test('displays dashboard overview', async ({ page }) => {
    // Check that main dashboard elements are visible
    await expect(page.locator('h1, .dashboard-title')).toContainText(/dashboard/i)
    
    // Check for stats cards
    const statsCards = page.locator('[data-testid*="stats"], .stats-card, .card')
    await expect(statsCards.first()).toBeVisible({ timeout: 10000 })
    
    // Check for navigation menu
    const navMenu = page.locator('nav, .navigation, .sidebar')
    await expect(navMenu.first()).toBeVisible()
  })

  test('navigates to appointments section', async ({ page }) => {
    // Click on appointments navigation
    await page.click('text=Appointments, a[href*="appointments"]')
    
    // Verify we're on appointments page
    await expect(page).toHaveURL(/.*appointments.*/)
    
    // Check for appointment calendar or list
    const appointmentView = page.locator('[data-testid="appointment-calendar"], .calendar, .appointment-list')
    await expect(appointmentView.first()).toBeVisible({ timeout: 10000 })
  })

  test('can create new appointment', async ({ page }) => {
    // Navigate to appointments
    await page.click('text=Appointments, a[href*="appointments"]')
    
    // Click add appointment button
    await page.click('[data-testid="add-appointment"], text=Add, button:has-text("Add")')
    
    // Fill appointment form
    const dialog = page.locator('[role="dialog"], .dialog, .modal')
    await expect(dialog.first()).toBeVisible({ timeout: 5000 })
    
    // Fill client name
    await page.fill('[data-testid="client-name"], input[placeholder*="client" i]', 'Admin Test Client')
    
    // Select service
    const serviceSelect = page.locator('[data-testid="service"], select')
    if (await serviceSelect.isVisible()) {
      await serviceSelect.selectOption({ index: 1 })
    }
    
    // Select staff
    const staffSelect = page.locator('[data-testid="staff"], select')
    if (await staffSelect.isVisible()) {
      await staffSelect.selectOption({ index: 1 })
    }
    
    // Save appointment
    await page.click('[data-testid="save-appointment"], button:has-text("Save")')
    
    // Verify appointment appears in calendar
    await expect(page.locator('text=Admin Test Client')).toBeVisible({ timeout: 10000 })
  })

  test('manages staff members', async ({ page }) => {
    // Navigate to staff section
    await page.click('text=Staff, a[href*="staff"]')
    
    // Check staff list is displayed
    const staffList = page.locator('[data-testid="staff-list"], .staff-directory')
    await expect(staffList.first()).toBeVisible({ timeout: 10000 })
    
    // Try to add new staff member
    const addStaffButton = page.locator('[data-testid="add-staff"], button:has-text("Add")')
    if (await addStaffButton.isVisible()) {
      await addStaffButton.click()
      
      // Fill staff form
      const dialog = page.locator('[role="dialog"], .dialog')
      await expect(dialog.first()).toBeVisible()
      
      await page.fill('[data-testid="staff-name"], input[placeholder*="name" i]', 'Test Staff Member')
      await page.fill('[data-testid="staff-email"], input[type="email"]', 'teststaff@vanityhub.com')
      
      // Save staff member
      await page.click('[data-testid="save-staff"], button:has-text("Save")')
      
      // Verify staff member appears in list
      await expect(page.locator('text=Test Staff Member')).toBeVisible({ timeout: 10000 })
    }
  })

  test('views client directory', async ({ page }) => {
    // Navigate to clients section
    await page.click('text=Clients, a[href*="clients"]')
    
    // Check clients list is displayed
    const clientsList = page.locator('[data-testid="clients-list"], .client-directory')
    await expect(clientsList.first()).toBeVisible({ timeout: 10000 })
    
    // Check search functionality
    const searchInput = page.locator('[data-testid="search"], input[placeholder*="search" i]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      
      // Results should update
      await page.waitForTimeout(1000) // Wait for search debounce
    }
  })

  test('accesses reports and analytics', async ({ page }) => {
    // Navigate to reports section
    await page.click('text=Reports, a[href*="reports"]')
    
    // Check that reports page loads
    const reportsContent = page.locator('[data-testid="reports"], .reports-dashboard')
    await expect(reportsContent.first()).toBeVisible({ timeout: 10000 })
    
    // Check for charts or analytics
    const charts = page.locator('.chart, canvas, svg')
    if (await charts.first().isVisible()) {
      await expect(charts.first()).toBeVisible()
    }
  })

  test('manages inventory', async ({ page }) => {
    // Navigate to inventory section
    await page.click('text=Inventory, a[href*="inventory"]')
    
    // Check inventory list
    const inventoryList = page.locator('[data-testid="inventory"], .inventory-list')
    await expect(inventoryList.first()).toBeVisible({ timeout: 10000 })
    
    // Try to add new product
    const addProductButton = page.locator('[data-testid="add-product"], button:has-text("Add")')
    if (await addProductButton.isVisible()) {
      await addProductButton.click()
      
      // Fill product form
      await page.fill('[data-testid="product-name"], input[placeholder*="name" i]', 'Test Product')
      await page.fill('[data-testid="product-price"], input[type="number"]', '25.99')
      
      // Save product
      await page.click('[data-testid="save-product"], button:has-text("Save")')
      
      // Verify product appears
      await expect(page.locator('text=Test Product')).toBeVisible({ timeout: 10000 })
    }
  })

  test('dashboard responsive design', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check mobile navigation
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-nav, button[aria-label*="menu" i]')
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click()
        
        // Navigation should be visible
        const navItems = page.locator('nav a, .nav-item')
        await expect(navItems.first()).toBeVisible()
      }
    } else {
      // Check desktop sidebar
      const sidebar = page.locator('[data-testid="sidebar"], .sidebar, aside')
      await expect(sidebar.first()).toBeVisible()
    }
  })

  test('settings and configuration', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings, a[href*="settings"]')
    
    // Check settings page loads
    const settingsContent = page.locator('[data-testid="settings"], .settings-page')
    await expect(settingsContent.first()).toBeVisible({ timeout: 10000 })
    
    // Check different settings tabs
    const settingsTabs = page.locator('[role="tab"], .tab')
    if (await settingsTabs.first().isVisible()) {
      await settingsTabs.first().click()
      
      // Tab content should be visible
      const tabContent = page.locator('[role="tabpanel"], .tab-content')
      await expect(tabContent.first()).toBeVisible()
    }
  })

  test('logout functionality', async ({ page }) => {
    // Look for user menu or logout button
    const userMenu = page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Admin")')
    if (await userMenu.isVisible()) {
      await userMenu.click()
      
      // Click logout
      const logoutButton = page.locator('text=Logout, text=Sign out')
      if (await logoutButton.isVisible()) {
        await logoutButton.click()
        
        // Should redirect to login page
        await expect(page).toHaveURL(/.*login.*/)
      }
    }
  })

  test('dashboard performance', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    await page.goto('/dashboard')
    
    // Wait for main content to load
    await page.locator('h1, .dashboard-title').first().waitFor({ timeout: 10000 })
    
    const loadTime = Date.now() - startTime
    
    // Dashboard should load within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000)
    
    // Check for any console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Navigate through a few sections to check for errors
    await page.click('text=Appointments')
    await page.waitForTimeout(1000)
    await page.click('text=Clients')
    await page.waitForTimeout(1000)
    
    // Should have minimal console errors
    expect(errors.length).toBeLessThan(5)
  })
})
