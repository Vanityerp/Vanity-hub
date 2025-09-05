import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    
    // Check if the application is responding
    const title = await page.title()
    console.log(`✅ Application is ready. Title: ${title}`)
    
    // Set up test data if needed
    await setupTestData(page)
    
    // Create authentication state for admin user
    await setupAdminAuth(page)
    
    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestData(page: any) {
  console.log('📊 Setting up test data...')
  
  // Clear any existing test data
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  
  // Set up mock data in localStorage for consistent testing
  await page.evaluate(() => {
    const testAppointments = [
      {
        id: 'test-apt-1',
        bookingReference: 'VH-TEST-001',
        clientId: 'test-client-1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        staffId: 'test-staff-1',
        staffName: 'Test Staff',
        service: 'Test Service',
        serviceId: 'test-service-1',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        duration: 60,
        location: 'loc1',
        price: 75,
        status: 'confirmed',
        notes: 'Test appointment for E2E testing',
      }
    ]
    
    const testServices = [
      {
        id: 'test-service-1',
        name: 'Test Service',
        description: 'Test service for E2E testing',
        duration: 60,
        price: 75,
        category: 'Test',
        isActive: true,
      }
    ]
    
    const testStaff = [
      {
        id: 'test-staff-1',
        name: 'Test Staff',
        email: 'staff@test.com',
        phone: '(555) 123-4567',
        role: 'stylist',
        locations: ['loc1'],
        status: 'Active',
        homeService: false,
      }
    ]
    
    const testClients = [
      {
        id: 'test-client-1',
        name: 'Test Client',
        email: 'test@example.com',
        phone: '(555) 987-6543',
        preferences: 'Test preferences',
        notes: 'Test client for E2E testing',
      }
    ]
    
    localStorage.setItem('appointments', JSON.stringify(testAppointments))
    localStorage.setItem('services', JSON.stringify(testServices))
    localStorage.setItem('staff', JSON.stringify(testStaff))
    localStorage.setItem('clients', JSON.stringify(testClients))
  })
  
  console.log('✅ Test data setup completed')
}

async function setupAdminAuth(page: any) {
  console.log('🔐 Setting up admin authentication...')
  
  try {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill in admin credentials
    await page.fill('[data-testid="email"], input[type="email"]', 'admin@vanityhub.com')
    await page.fill('[data-testid="password"], input[type="password"]', 'password')
    
    // Submit login form
    await page.click('[data-testid="login-button"], button[type="submit"]')
    
    // Wait for successful login (redirect to dashboard)
    await page.waitForURL('/dashboard', { timeout: 10000 })
    
    // Save authentication state
    await page.context().storageState({ path: 'e2e/auth/admin-auth.json' })
    
    console.log('✅ Admin authentication setup completed')
  } catch (error) {
    console.log('⚠️ Admin authentication setup failed (this is expected if login is not implemented yet)')
    
    // Create a mock authentication state
    await page.evaluate(() => {
      localStorage.setItem('auth-user', JSON.stringify({
        id: 'admin-1',
        email: 'admin@vanityhub.com',
        role: 'admin',
        name: 'Admin User',
      }))
    })
    
    await page.context().storageState({ path: 'e2e/auth/admin-auth.json' })
  }
}

export default globalSetup
