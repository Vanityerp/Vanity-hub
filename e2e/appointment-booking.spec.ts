import { test, expect } from '@playwright/test'

test.describe('Appointment Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the booking page
    await page.goto('/booking')
  })

  test('client can book an appointment', async ({ page }) => {
    // Fill out booking form
    await page.fill('[data-testid="client-name"], input[placeholder*="name" i]', 'John Doe')
    await page.fill('[data-testid="client-email"], input[type="email"]', 'john@example.com')
    await page.fill('[data-testid="client-phone"], input[type="tel"]', '(555) 123-4567')
    
    // Select service
    const serviceSelect = page.locator('[data-testid="service-select"], select').first()
    if (await serviceSelect.isVisible()) {
      await serviceSelect.selectOption({ label: /haircut/i })
    } else {
      // Try clicking on a service card if dropdown is not available
      await page.click('text=Haircut').first()
    }
    
    // Select staff
    const staffSelect = page.locator('[data-testid="staff-select"], select').first()
    if (await staffSelect.isVisible()) {
      await staffSelect.selectOption({ index: 1 })
    } else {
      // Try clicking on a staff card
      await page.click('[data-testid="staff-card"]').first()
    }
    
    // Select date (tomorrow)
    const dateInput = page.locator('[data-testid="date-picker"], input[type="date"]').first()
    if (await dateInput.isVisible()) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await dateInput.fill(tomorrow.toISOString().split('T')[0])
    } else {
      // Try clicking on date picker
      await page.click('[data-testid="date-picker-trigger"]')
      await page.click('[data-testid="date-tomorrow"]')
    }
    
    // Select time
    const timeSelect = page.locator('[data-testid="time-select"], select').first()
    if (await timeSelect.isVisible()) {
      await timeSelect.selectOption('10:00')
    } else {
      // Try clicking on a time slot
      await page.click('[data-testid="time-10am"], text=10:00').first()
    }
    
    // Add notes
    await page.fill('[data-testid="notes"], textarea', 'Test booking from E2E test')
    
    // Submit booking
    await page.click('[data-testid="book-appointment"], button[type="submit"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"], text=success')).toBeVisible({ timeout: 10000 })
    
    // Check for booking reference
    const bookingRef = page.locator('[data-testid="booking-reference"]')
    if (await bookingRef.isVisible()) {
      await expect(bookingRef).toContainText(/VH-\d+/)
    }
  })

  test('validates required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('[data-testid="book-appointment"], button[type="submit"]')
    
    // Check for validation errors
    const errorMessages = page.locator('.error, [role="alert"], .text-red-500')
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 })
  })

  test('shows available time slots', async ({ page }) => {
    // Fill basic info first
    await page.fill('[data-testid="client-name"], input[placeholder*="name" i]', 'Test User')
    
    // Select service and staff
    const serviceSelect = page.locator('[data-testid="service-select"], select').first()
    if (await serviceSelect.isVisible()) {
      await serviceSelect.selectOption({ index: 1 })
    }
    
    const staffSelect = page.locator('[data-testid="staff-select"], select').first()
    if (await staffSelect.isVisible()) {
      await staffSelect.selectOption({ index: 1 })
    }
    
    // Select date
    const dateInput = page.locator('[data-testid="date-picker"], input[type="date"]').first()
    if (await dateInput.isVisible()) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await dateInput.fill(tomorrow.toISOString().split('T')[0])
    }
    
    // Check that time slots are displayed
    const timeSlots = page.locator('[data-testid*="time"], .time-slot')
    await expect(timeSlots.first()).toBeVisible({ timeout: 5000 })
  })

  test('handles service selection', async ({ page }) => {
    // Check that services are available
    const serviceOptions = page.locator('[data-testid="service-select"] option, .service-card')
    await expect(serviceOptions.first()).toBeVisible({ timeout: 5000 })
    
    // Select a service and verify price is displayed
    const serviceSelect = page.locator('[data-testid="service-select"], select').first()
    if (await serviceSelect.isVisible()) {
      await serviceSelect.selectOption({ index: 1 })
      
      // Check if price is displayed
      const priceDisplay = page.locator('[data-testid="service-price"], .price')
      if (await priceDisplay.isVisible()) {
        await expect(priceDisplay).toContainText(/\$|\d+/)
      }
    }
  })

  test('mobile responsive booking form', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices')
    }
    
    // Check that form is properly displayed on mobile
    const bookingForm = page.locator('[data-testid="booking-form"], form')
    await expect(bookingForm).toBeVisible()
    
    // Check that form fields are accessible
    const nameInput = page.locator('[data-testid="client-name"], input[placeholder*="name" i]')
    await expect(nameInput).toBeVisible()
    
    // Test touch interactions
    await nameInput.tap()
    await nameInput.fill('Mobile Test User')
    
    // Verify form can be scrolled if needed
    const submitButton = page.locator('[data-testid="book-appointment"], button[type="submit"]')
    await submitButton.scrollIntoViewIfNeeded()
    await expect(submitButton).toBeVisible()
  })

  test('handles booking conflicts', async ({ page }) => {
    // Fill out form with a potentially conflicting time
    await page.fill('[data-testid="client-name"], input[placeholder*="name" i]', 'Conflict Test')
    await page.fill('[data-testid="client-email"], input[type="email"]', 'conflict@example.com')
    
    // Select service and staff
    const serviceSelect = page.locator('[data-testid="service-select"], select').first()
    if (await serviceSelect.isVisible()) {
      await serviceSelect.selectOption({ index: 1 })
    }
    
    const staffSelect = page.locator('[data-testid="staff-select"], select').first()
    if (await staffSelect.isVisible()) {
      await staffSelect.selectOption({ index: 1 })
    }
    
    // Try to book at a time that might be taken
    const timeSelect = page.locator('[data-testid="time-select"], select').first()
    if (await timeSelect.isVisible()) {
      await timeSelect.selectOption('10:00')
    }
    
    await page.click('[data-testid="book-appointment"], button[type="submit"]')
    
    // Either success or conflict message should appear
    const result = page.locator('[data-testid="success-message"], [data-testid="error-message"], .success, .error')
    await expect(result.first()).toBeVisible({ timeout: 10000 })
  })

  test('booking form accessibility', async ({ page }) => {
    // Check form labels and accessibility
    const nameInput = page.locator('[data-testid="client-name"], input[placeholder*="name" i]')
    await expect(nameInput).toBeVisible()
    
    // Test keyboard navigation
    await nameInput.focus()
    await page.keyboard.press('Tab')
    
    // Check that focus moves to next field
    const emailInput = page.locator('[data-testid="client-email"], input[type="email"]')
    await expect(emailInput).toBeFocused()
    
    // Test form submission with Enter key
    await nameInput.fill('Keyboard Test')
    await emailInput.fill('keyboard@example.com')
    await page.keyboard.press('Enter')
    
    // Form should either submit or show validation errors
    const feedback = page.locator('.error, .success, [role="alert"]')
    await expect(feedback.first()).toBeVisible({ timeout: 5000 })
  })
})
