# Error Handling Guide

This document outlines the comprehensive error handling system implemented in Vanity Hub.

## 🎯 **Overview**

Vanity Hub implements a multi-layered error handling approach:

1. **Client-Side Error Boundaries** - React error boundaries for graceful UI failures
2. **Global JavaScript Error Handling** - Automatic capture of unhandled errors
3. **API Error Handling** - Structured error responses with proper HTTP status codes
4. **Logging System** - Comprehensive error logging with categorization
5. **User-Friendly Error Messages** - Clear, actionable error messages for users

## 🛡️ **Error Boundary System**

### **React Error Boundaries**

```typescript
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/error-boundary'

// Page-level error boundary
<PageErrorBoundary>
  <YourPageComponent />
</PageErrorBoundary>

// Component-level error boundary
<ComponentErrorBoundary>
  <YourComponent />
</ComponentErrorBoundary>
```

### **Error Boundary Features**

- **Automatic Error Capture**: Catches React component errors
- **User-Friendly UI**: Shows helpful error messages instead of white screen
- **Retry Mechanism**: Allows users to retry failed operations
- **Error Reporting**: Automatically reports errors to monitoring system
- **Context Preservation**: Maintains application state when possible

## 📊 **Error Classification**

### **Error Categories**

```typescript
enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION', 
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  USER_INPUT = 'USER_INPUT',
}
```

### **Error Severity Levels**

- **DEBUG** (0): Development information
- **INFO** (1): General information
- **WARN** (2): Warning conditions
- **ERROR** (3): Error conditions
- **CRITICAL** (4): Critical conditions requiring immediate attention

## 🔧 **Custom Error Classes**

### **Authentication Errors**

```typescript
// Invalid credentials
throw new InvalidCredentialsError({ email: 'user@example.com' })

// Expired token
throw new TokenExpiredError({ tokenId: 'abc123' })

// Inactive account
throw new AccountInactiveError({ userId: 'user123' })
```

### **Validation Errors**

```typescript
// General validation error
throw new ValidationError('Invalid input', ['email: required', 'password: too short'])

// Specific field error
throw new InvalidInputError('email', 'invalid-email@')

// Required field error
throw new RequiredFieldError('password')
```

### **Business Logic Errors**

```typescript
// Insufficient stock
throw new InsufficientStockError('Shampoo', 5, 2)

// Appointment conflict
throw new AppointmentConflictError('Alice Johnson', '2024-01-15 10:00')

// Payment processing error
throw new PaymentProcessingError('Card declined')
```

## 🌐 **API Error Handling**

### **Secure API Wrapper**

```typescript
import { withAuth, rateLimits } from '@/lib/security/api-wrapper'
import { clientCreationSchema } from '@/lib/security/validation'

export const POST = withAuth(async (req) => {
  try {
    const clientData = req.validatedData
    
    // Business logic here
    const client = await createClient(clientData)
    
    return NextResponse.json({ client })
  } catch (error) {
    // Error is automatically logged and formatted
    throw error
  }
}, {
  rateLimit: rateLimits.moderate,
  validateInput: clientCreationSchema,
  auditAction: 'CREATE_CLIENT'
})
```

### **Error Response Format**

```json
{
  "error": {
    "message": "Validation failed",
    "code": "ValidationError",
    "statusCode": 400,
    "category": "VALIDATION",
    "errorId": "err_1234567890_abc123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "errors": ["email: required", "password: too short"]
  }
}
```

## 📝 **Logging System**

### **Logger Usage**

```typescript
import { logger } from '@/lib/error-handling/logger'

// Basic logging
logger.info('User logged in', { userId: 'user123' })
logger.warn('Low stock detected', { productId: 'prod456', stock: 2 })
logger.error('Database connection failed', error, { operation: 'user_create' })

// Category-specific logging
logger.authError('Invalid login attempt', error, { email: 'user@example.com' })
logger.databaseError('Query failed', error, { table: 'users', operation: 'SELECT' })
logger.securityError('Suspicious activity detected', error, { ip: '192.168.1.1' })
```

### **Performance Monitoring**

```typescript
// Time operations
logger.time('database_query')
const result = await database.query()
logger.timeEnd('database_query')

// API request logging
logger.logApiRequest('POST', '/api/users', 201, 150, { userId: 'user123' })

// Database operation logging
logger.logDatabaseOperation('INSERT', 'users', 45, undefined, { userId: 'user123' })
```

## 🚨 **Client-Side Error Handling**

### **Automatic Error Capture**

The system automatically captures:
- JavaScript runtime errors
- Unhandled promise rejections
- React component errors
- Network request failures

### **Manual Error Reporting**

```typescript
import { reportError } from '@/lib/error-handling/client-error-handler'

try {
  // Your code here
} catch (error) {
  reportError(error, { 
    component: 'UserProfile',
    action: 'updateProfile',
    userId: 'user123'
  })
}
```

## 🔍 **Error Monitoring & Alerting**

### **Error Tracking**

- **Error ID Generation**: Unique IDs for tracking specific errors
- **Error Fingerprinting**: Group similar errors together
- **Context Preservation**: Capture relevant context for debugging
- **User Session Tracking**: Link errors to user sessions

### **Alert Thresholds**

- **Critical Errors**: Immediate notification
- **High Error Rate**: Alert when error rate exceeds threshold
- **New Error Types**: Alert on previously unseen errors
- **Performance Degradation**: Alert on slow response times

## 🛠️ **Development Guidelines**

### **Error Handling Best Practices**

1. **Use Specific Error Types**
   ```typescript
   // Good
   throw new RecordNotFoundError('User', userId)
   
   // Bad
   throw new Error('User not found')
   ```

2. **Provide Context**
   ```typescript
   // Good
   logger.error('Failed to create appointment', error, {
     clientId,
     staffId,
     dateTime,
     operation: 'appointment_create'
   })
   
   // Bad
   console.error('Error:', error)
   ```

3. **Handle Errors Gracefully**
   ```typescript
   // Good
   try {
     await riskyOperation()
   } catch (error) {
     logger.error('Operation failed', error)
     showUserFriendlyMessage('Unable to complete operation. Please try again.')
     return fallbackValue
   }
   
   // Bad
   await riskyOperation() // Unhandled error crashes app
   ```

### **Testing Error Scenarios**

```typescript
// Test error boundaries
it('should handle component errors gracefully', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }
  
  render(
    <ComponentErrorBoundary>
      <ThrowError />
    </ComponentErrorBoundary>
  )
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
})

// Test API error handling
it('should handle validation errors', async () => {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ email: 'invalid' })
  })
  
  expect(response.status).toBe(400)
  const data = await response.json()
  expect(data.error.category).toBe('VALIDATION')
})
```

## 📈 **Error Analytics**

### **Key Metrics**

- **Error Rate**: Percentage of requests resulting in errors
- **Error Distribution**: Breakdown by category and severity
- **User Impact**: Number of users affected by errors
- **Resolution Time**: Time to identify and fix errors

### **Error Dashboards**

- **Real-time Error Monitoring**: Live error feed
- **Error Trends**: Historical error patterns
- **Performance Impact**: Error correlation with performance
- **User Experience**: Error impact on user journeys

## 🔧 **Configuration**

### **Environment Variables**

```env
# Logging Configuration
LOG_LEVEL=INFO
ENABLE_ERROR_REPORTING=true
ERROR_REPORTING_ENDPOINT=/api/errors/report

# Error Monitoring
SENTRY_DSN=your-sentry-dsn
ERROR_SAMPLING_RATE=0.1

# Alert Configuration
ALERT_EMAIL=admin@vanityhub.com
ALERT_WEBHOOK=https://hooks.slack.com/...
```

### **Error Handling Settings**

```typescript
// Configure error boundaries
const errorBoundaryConfig = {
  showDetails: process.env.NODE_ENV === 'development',
  maxRetries: 3,
  fallbackComponent: CustomErrorFallback,
  onError: (error, errorInfo) => {
    // Custom error handling logic
  }
}
```

## 🚀 **Production Deployment**

### **Pre-deployment Checklist**

- [ ] Error boundaries implemented on all pages
- [ ] API error handling tested
- [ ] Error monitoring configured
- [ ] Alert notifications set up
- [ ] Error logging verified
- [ ] Performance impact assessed

### **Monitoring Setup**

1. **Configure Error Tracking Service** (Sentry, LogRocket, etc.)
2. **Set Up Alert Notifications** (Email, Slack, SMS)
3. **Create Error Dashboards** (Grafana, DataDog, etc.)
4. **Establish Response Procedures** (On-call rotation, escalation)

## 📞 **Incident Response**

### **Error Response Workflow**

1. **Detection**: Automated alerts or user reports
2. **Triage**: Assess severity and impact
3. **Investigation**: Analyze logs and error context
4. **Resolution**: Fix root cause
5. **Communication**: Update stakeholders
6. **Post-mortem**: Document lessons learned

### **Emergency Contacts**

- **Development Team**: dev@vanityhub.com
- **System Administrator**: admin@vanityhub.com
- **On-call Engineer**: +974-XXXX-XXXX
