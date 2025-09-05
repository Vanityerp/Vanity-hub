# Vanity Hub API Documentation

## 🎯 **Overview**

This document provides comprehensive documentation for the Vanity Hub API. The API follows RESTful principles and includes authentication, rate limiting, caching, and comprehensive error handling.

## 🔗 **Base URL**
```
Production: https://vanity-hub.com/api
Development: http://localhost:3000/api
```

## 🔐 **Authentication**

### **Authentication Methods**
- **Session-based**: NextAuth.js sessions for web application
- **API Keys**: For external integrations (future implementation)
- **JWT Tokens**: For mobile applications (future implementation)

### **Authentication Headers**
```http
# Session-based (automatic with cookies)
Cookie: next-auth.session-token=...

# API Key (future)
Authorization: Bearer your-api-key

# JWT Token (future)
Authorization: Bearer your-jwt-token
```

### **User Roles**
- **Client**: Limited access to own data and booking
- **Staff**: Access to appointments, clients, and services
- **Manager**: Full location management access
- **Admin**: System-wide administrative access

## 📊 **Rate Limiting**

### **Rate Limits by Endpoint**
```
Authentication: 5 requests per 15 minutes
General API: 100 requests per 15 minutes (Basic)
General API: 500 requests per 15 minutes (Premium)
General API: 2000 requests per 15 minutes (Enterprise)
File Upload: 20 requests per hour
Reports: 10 requests per 5 minutes
```

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Tier: premium
Retry-After: 60
```

## 🏢 **Core Entities**

### **Client**
```typescript
interface Client {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  dateOfBirth?: string
  notes?: string
  preferredLocation?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences?: {
    communicationMethod: 'email' | 'phone' | 'sms'
    marketingOptIn: boolean
    reminderPreference: 'none' | '24h' | '2h' | '30m'
  }
  createdAt: string
  updatedAt: string
}
```

### **Appointment**
```typescript
interface Appointment {
  id: string
  clientId: string
  serviceId: string
  staffId: string
  locationId: string
  date: string
  duration: number
  notes?: string
  price?: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  reminderSent: boolean
  cancellationReason?: string
  rescheduleCount: number
  createdAt: string
  updatedAt: string
}
```

### **Service**
```typescript
interface Service {
  id: string
  name: string
  description?: string
  categoryId: string
  duration: number
  price: number
  locations: string[]
  isActive: boolean
  requirements?: string[]
  contraindications?: string[]
  aftercareInstructions?: string
  bookingBuffer: number
  maxAdvanceBooking: number
  cancellationPolicy?: {
    allowCancellation: boolean
    minimumNotice: number
    cancellationFee: number
  }
  createdAt: string
  updatedAt: string
}
```

## 📋 **API Endpoints**

### **Clients API**

#### **GET /api/clients**
Get list of clients with filtering and pagination.

**Query Parameters:**
```typescript
{
  page?: number          // Page number (default: 1)
  limit?: number         // Items per page (default: 20, max: 100)
  search?: string        // Search by name, email, or phone
  locationId?: string    // Filter by preferred location
  sortBy?: string        // Sort field (default: 'createdAt')
  sortOrder?: 'asc' | 'desc'  // Sort order (default: 'desc')
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    clients: Client[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }
}
```

**Example:**
```bash
curl -X GET "https://vanity-hub.com/api/clients?page=1&limit=10&search=john" \
  -H "Cookie: next-auth.session-token=..."
```

#### **POST /api/clients**
Create a new client.

**Request Body:**
```typescript
{
  firstName: string
  lastName: string
  email?: string
  phone: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  dateOfBirth?: string
  notes?: string
  preferredLocation?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  preferences?: {
    communicationMethod: 'email' | 'phone' | 'sms'
    marketingOptIn: boolean
    reminderPreference: 'none' | '24h' | '2h' | '30m'
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: Client
}
```

**Example:**
```bash
curl -X POST "https://vanity-hub.com/api/clients" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }'
```

#### **GET /api/clients/[id]**
Get a specific client by ID.

**Response:**
```typescript
{
  success: true,
  data: Client
}
```

#### **PUT /api/clients/[id]**
Update a specific client.

**Request Body:** Same as POST (partial updates allowed)

**Response:**
```typescript
{
  success: true,
  data: Client
}
```

#### **DELETE /api/clients/[id]**
Delete a specific client.

**Response:**
```typescript
{
  success: true,
  message: "Client deleted successfully"
}
```

### **Appointments API**

#### **GET /api/appointments**
Get list of appointments with filtering.

**Query Parameters:**
```typescript
{
  page?: number
  limit?: number
  clientId?: string
  staffId?: string
  locationId?: string
  date?: string          // ISO date string
  dateFrom?: string      // Start date for range
  dateTo?: string        // End date for range
  status?: AppointmentStatus
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    appointments: Appointment[],
    pagination: PaginationInfo
  }
}
```

#### **POST /api/appointments**
Create a new appointment.

**Request Body:**
```typescript
{
  clientId: string
  serviceId: string
  staffId: string
  locationId: string
  date: string           // ISO datetime string
  duration: number       // Minutes
  notes?: string
  price?: number
}
```

**Response:**
```typescript
{
  success: true,
  data: Appointment
}
```

#### **PUT /api/appointments/[id]**
Update an appointment.

**Request Body:** Same as POST (partial updates allowed)

#### **DELETE /api/appointments/[id]**
Cancel an appointment.

**Request Body:**
```typescript
{
  cancellationReason: string
}
```

### **Services API**

#### **GET /api/services**
Get list of services.

**Query Parameters:**
```typescript
{
  page?: number
  limit?: number
  locationId?: string
  categoryId?: string
  isActive?: boolean
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

#### **POST /api/services**
Create a new service (Admin/Manager only).

**Request Body:**
```typescript
{
  name: string
  description?: string
  categoryId: string
  duration: number
  price: number
  locations: string[]
  isActive?: boolean
  requirements?: string[]
  contraindications?: string[]
  aftercareInstructions?: string
  bookingBuffer?: number
  maxAdvanceBooking?: number
  cancellationPolicy?: {
    allowCancellation: boolean
    minimumNotice: number
    cancellationFee: number
  }
}
```

### **Staff API**

#### **GET /api/staff**
Get list of staff members.

**Query Parameters:**
```typescript
{
  page?: number
  limit?: number
  locationId?: string
  role?: 'STAFF' | 'MANAGER' | 'ADMIN'
  isActive?: boolean
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

#### **POST /api/staff**
Create a new staff member (Admin/Manager only).

### **Inventory API**

#### **GET /api/inventory**
Get inventory data by location.

**Query Parameters:**
```typescript
{
  locationId: string
  productId?: string
  lowStock?: boolean     // Filter items below minimum stock
  page?: number
  limit?: number
}
```

#### **POST /api/inventory/transfer**
Transfer stock between locations.

**Request Body:**
```typescript
{
  fromLocationId: string
  toLocationId: string
  productId: string
  quantity: number
  reason?: string
}
```

### **Analytics API**

#### **GET /api/analytics/revenue**
Get revenue analytics.

**Query Parameters:**
```typescript
{
  locationId?: string
  startDate: string
  endDate: string
  groupBy?: 'day' | 'week' | 'month'
}
```

#### **GET /api/analytics/appointments**
Get appointment analytics.

#### **GET /api/analytics/clients**
Get client analytics.

## 🚨 **Error Handling**

### **Error Response Format**
```typescript
{
  success: false,
  error: string,
  details?: any,
  code?: string,
  timestamp: string
}
```

### **HTTP Status Codes**
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate resource)
- **422**: Unprocessable Entity (business logic error)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

### **Error Examples**
```typescript
// Validation Error (400)
{
  success: false,
  error: "Validation failed",
  details: [
    {
      field: "email",
      message: "Invalid email format",
      code: "INVALID_FORMAT"
    }
  ],
  timestamp: "2024-01-01T12:00:00Z"
}

// Authentication Error (401)
{
  success: false,
  error: "Authentication required",
  code: "AUTH_REQUIRED",
  timestamp: "2024-01-01T12:00:00Z"
}

// Rate Limit Error (429)
{
  success: false,
  error: "Rate limit exceeded",
  details: {
    limit: 100,
    remaining: 0,
    resetTime: 1640995200
  },
  code: "RATE_LIMIT_EXCEEDED",
  timestamp: "2024-01-01T12:00:00Z"
}
```

## 📝 **Request/Response Examples**

### **Create Client Example**
```bash
# Request
curl -X POST "https://vanity-hub.com/api/clients" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+1987654321",
    "preferences": {
      "communicationMethod": "email",
      "marketingOptIn": true,
      "reminderPreference": "24h"
    }
  }'

# Response
{
  "success": true,
  "data": {
    "id": "client_123",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phone": "+1987654321",
    "preferences": {
      "communicationMethod": "email",
      "marketingOptIn": true,
      "reminderPreference": "24h"
    },
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

### **Book Appointment Example**
```bash
# Request
curl -X POST "https://vanity-hub.com/api/appointments" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "clientId": "client_123",
    "serviceId": "service_456",
    "staffId": "staff_789",
    "locationId": "location_001",
    "date": "2024-01-15T14:00:00Z",
    "duration": 60,
    "notes": "First time client"
  }'

# Response
{
  "success": true,
  "data": {
    "id": "appointment_abc",
    "clientId": "client_123",
    "serviceId": "service_456",
    "staffId": "staff_789",
    "locationId": "location_001",
    "date": "2024-01-15T14:00:00Z",
    "duration": 60,
    "notes": "First time client",
    "status": "scheduled",
    "reminderSent": false,
    "rescheduleCount": 0,
    "createdAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

## 🔄 **Webhooks** (Future Implementation)

### **Webhook Events**
- `client.created`
- `client.updated`
- `appointment.created`
- `appointment.updated`
- `appointment.cancelled`
- `payment.completed`
- `inventory.low_stock`

### **Webhook Payload Format**
```typescript
{
  event: string,
  data: any,
  timestamp: string,
  signature: string
}
```

## 📚 **SDKs and Libraries**

### **JavaScript/TypeScript SDK** (Future)
```typescript
import { VanityHubAPI } from '@vanity-hub/sdk'

const api = new VanityHubAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://vanity-hub.com/api'
})

// Create client
const client = await api.clients.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com'
})

// Book appointment
const appointment = await api.appointments.create({
  clientId: client.id,
  serviceId: 'service_123',
  date: '2024-01-15T14:00:00Z'
})
```

---

**Last Updated**: 2025-06-27  
**API Version**: v1  
**Next Review**: 2025-07-27
