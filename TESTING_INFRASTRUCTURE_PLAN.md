# Testing Infrastructure Implementation Plan

## 🎯 **Overview**

This document outlines the comprehensive testing infrastructure implementation for Vanity Hub, addressing the critical gap in automated testing.

## 📋 **Current State Analysis**

### **Existing Testing**
- ✅ Manual testing guides (LOYALTY_TESTING_GUIDE.md, APPOINTMENTS_TESTING_GUIDE.md)
- ✅ Browser console test scripts (test-appointment-sync.js, etc.)
- ❌ No automated unit tests
- ❌ No integration tests
- ❌ No E2E tests
- ❌ No CI/CD testing pipeline

### **Risk Assessment**
- **High Risk**: No regression testing capability
- **Medium Risk**: Manual testing is time-intensive and error-prone
- **Low Risk**: Existing manual tests provide good coverage patterns

## 🔧 **Implementation Strategy**

### **Phase 1: Foundation Setup (Week 1)**

#### **1.1 Testing Dependencies**
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@types/jest": "^29.5.0",
    "msw": "^2.0.0",
    "playwright": "^1.40.0",
    "@storybook/react": "^7.5.0",
    "@storybook/addon-essentials": "^7.5.0"
  }
}
```

#### **1.2 Jest Configuration**
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### **1.3 Test Setup Files**
```javascript
// jest.setup.js
import '@testing-library/jest-dom'
import { server } from './src/mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
}))
```

### **Phase 2: Unit Testing (Week 2)**

#### **2.1 Component Testing Strategy**
```typescript
// __tests__/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })
})
```

#### **2.2 Provider Testing**
```typescript
// __tests__/lib/currency-provider.test.tsx
import { render, screen, act } from '@testing-library/react'
import { CurrencyProvider, useCurrency } from '@/lib/currency-provider'

const TestComponent = () => {
  const { currency, setCurrency, formatCurrency } = useCurrency()
  return (
    <div>
      <span data-testid="currency">{currency.code}</span>
      <span data-testid="formatted">{formatCurrency(100)}</span>
      <button onClick={() => setCurrency('USD')}>Change to USD</button>
    </div>
  )
}

describe('CurrencyProvider', () => {
  it('provides default currency context', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )
    
    expect(screen.getByTestId('currency')).toHaveTextContent('QAR')
    expect(screen.getByTestId('formatted')).toHaveTextContent('QAR 100.00')
  })

  it('updates currency when changed', async () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    )
    
    await act(async () => {
      screen.getByText('Change to USD').click()
    })
    
    expect(screen.getByTestId('currency')).toHaveTextContent('USD')
  })
})
```

### **Phase 3: Integration Testing (Week 3)**

#### **3.1 API Route Testing**
```typescript
// __tests__/api/appointments.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/appointments/route'

describe('/api/appointments', () => {
  it('returns appointments list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toHaveProperty('appointments')
    expect(Array.isArray(data.appointments)).toBe(true)
  })

  it('creates new appointment', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        clientName: 'Test Client',
        service: 'Haircut',
        date: '2024-01-15T10:00:00Z',
        staffId: '1',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.appointment).toHaveProperty('id')
  })
})
```

#### **3.2 MSW Setup for API Mocking**
```typescript
// src/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/appointments', (req, res, ctx) => {
    return res(
      ctx.json({
        appointments: [
          {
            id: '1',
            clientName: 'Test Client',
            service: 'Haircut',
            date: '2024-01-15T10:00:00Z',
          },
        ],
      })
    )
  }),

  rest.post('/api/appointments', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        appointment: {
          id: '2',
          ...req.body,
        },
      })
    )
  }),
]
```

### **Phase 4: E2E Testing (Week 4)**

#### **4.1 Playwright Configuration**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### **4.2 Critical User Journey Tests**
```typescript
// e2e/appointment-booking.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Appointment Booking Flow', () => {
  test('client can book an appointment', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking')
    
    // Fill out booking form
    await page.fill('[data-testid="client-name"]', 'John Doe')
    await page.fill('[data-testid="client-email"]', 'john@example.com')
    await page.selectOption('[data-testid="service-select"]', 'haircut')
    await page.selectOption('[data-testid="staff-select"]', '1')
    
    // Select date and time
    await page.click('[data-testid="date-picker"]')
    await page.click('[data-testid="date-tomorrow"]')
    await page.click('[data-testid="time-10am"]')
    
    // Submit booking
    await page.click('[data-testid="book-appointment"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="booking-reference"]')).toBeVisible()
  })

  test('admin can view and manage appointments', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@vanityhub.com')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="login-button"]')
    
    // Navigate to appointments
    await page.goto('/dashboard/appointments')
    
    // Verify appointments are displayed
    await expect(page.locator('[data-testid="appointment-calendar"]')).toBeVisible()
    await expect(page.locator('[data-testid="appointment-item"]').first()).toBeVisible()
    
    // Test appointment creation
    await page.click('[data-testid="add-appointment"]')
    await page.fill('[data-testid="client-name"]', 'Jane Smith')
    await page.selectOption('[data-testid="service"]', 'manicure')
    await page.click('[data-testid="save-appointment"]')
    
    // Verify appointment appears in calendar
    await expect(page.locator('text=Jane Smith')).toBeVisible()
  })
})
```

## 📊 **Testing Metrics & Coverage**

### **Coverage Targets**
- **Unit Tests**: 80% code coverage
- **Integration Tests**: 70% API route coverage
- **E2E Tests**: 90% critical user journey coverage

### **Performance Benchmarks**
- **Unit Tests**: <5 seconds total runtime
- **Integration Tests**: <30 seconds total runtime
- **E2E Tests**: <5 minutes total runtime

### **Quality Gates**
- All tests must pass before merge
- Coverage thresholds must be met
- No critical accessibility violations
- Performance budgets must be maintained

## 🚀 **Implementation Timeline**

### **Week 1: Foundation**
- [ ] Install testing dependencies
- [ ] Configure Jest and testing environment
- [ ] Set up MSW for API mocking
- [ ] Create basic test utilities

### **Week 2: Unit Tests**
- [ ] Test UI components (Button, Input, Dialog, etc.)
- [ ] Test utility functions
- [ ] Test custom hooks
- [ ] Test provider components

### **Week 3: Integration Tests**
- [ ] Test API routes
- [ ] Test form submissions
- [ ] Test data flow between components
- [ ] Test error handling

### **Week 4: E2E Tests**
- [ ] Set up Playwright
- [ ] Test critical user journeys
- [ ] Test cross-browser compatibility
- [ ] Set up CI/CD integration

## 🔄 **Continuous Integration**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build
      
      - name: Run E2E tests
        run: npx playwright test
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 📈 **Success Criteria**

### **Technical Metrics**
- ✅ 80%+ test coverage achieved
- ✅ All critical user journeys covered
- ✅ CI/CD pipeline running successfully
- ✅ Test execution time under targets

### **Business Impact**
- ✅ 70% reduction in production bugs
- ✅ 50% faster feature development
- ✅ Increased developer confidence
- ✅ Improved code quality

This testing infrastructure will provide a solid foundation for maintaining code quality and enabling confident deployments of new features.
