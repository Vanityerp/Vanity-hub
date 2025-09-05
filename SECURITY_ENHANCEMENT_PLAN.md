# Security Enhancement Implementation Plan

## 🎯 **Overview**

This document outlines comprehensive security enhancements for Vanity Hub, addressing authentication, authorization, data protection, and compliance requirements.

## 🔍 **Current Security Assessment**

### **Existing Security Features**
- ✅ Basic NextAuth.js setup
- ✅ Mock authentication system
- ✅ Basic role-based access (admin, staff, client)
- ✅ HTTPS configuration ready
- ❌ No password hashing
- ❌ No session security
- ❌ No input validation
- ❌ No rate limiting
- ❌ No audit logging

### **Security Risks Identified**
- **Critical**: Plain text password storage
- **High**: No session management
- **High**: No input sanitization
- **Medium**: No rate limiting
- **Medium**: No audit trails
- **Low**: Missing security headers

## 🔐 **Implementation Strategy**

### **Phase 1: Authentication & Session Security (Week 1)**

#### **1.1 Enhanced NextAuth Configuration**
```typescript
// lib/auth.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)
          
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              staffProfile: true,
              clientProfile: true,
            }
          })

          if (!user || !user.isActive) {
            return null
          }

          const isValidPassword = await bcrypt.compare(password, user.password)
          if (!isValidPassword) {
            // Log failed login attempt
            await prisma.auditLog.create({
              data: {
                action: 'LOGIN_FAILED',
                userId: user.id,
                details: { email, reason: 'Invalid password' },
                ipAddress: credentials.ipAddress,
                userAgent: credentials.userAgent,
              }
            })
            return null
          }

          // Log successful login
          await prisma.auditLog.create({
            data: {
              action: 'LOGIN_SUCCESS',
              userId: user.id,
              details: { email },
              ipAddress: credentials.ipAddress,
              userAgent: credentials.userAgent,
            }
          })

          return {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.staffProfile?.name || user.clientProfile?.name,
            image: user.staffProfile?.avatar,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  events: {
    async signOut({ token }) {
      if (token?.userId) {
        await prisma.auditLog.create({
          data: {
            action: 'LOGOUT',
            userId: token.userId as string,
            details: {},
          }
        })
      }
    }
  }
}

export default NextAuth(authOptions)
```

#### **1.2 Password Security**
```typescript
// lib/auth/password.ts
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export async function hashPassword(password: string): Promise<string> {
  passwordSchema.parse(password)
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export function generateSecurePassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one character from each required category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
```

### **Phase 2: Authorization & Permissions (Week 2)**

#### **2.1 Role-Based Access Control**
```typescript
// lib/auth/permissions.ts
export enum Permission {
  // Appointment permissions
  VIEW_APPOINTMENTS = 'view_appointments',
  CREATE_APPOINTMENTS = 'create_appointments',
  EDIT_APPOINTMENTS = 'edit_appointments',
  DELETE_APPOINTMENTS = 'delete_appointments',
  
  // Client permissions
  VIEW_CLIENTS = 'view_clients',
  CREATE_CLIENTS = 'create_clients',
  EDIT_CLIENTS = 'edit_clients',
  DELETE_CLIENTS = 'delete_clients',
  
  // Staff permissions
  VIEW_STAFF = 'view_staff',
  CREATE_STAFF = 'create_staff',
  EDIT_STAFF = 'edit_staff',
  DELETE_STAFF = 'delete_staff',
  
  // Financial permissions
  VIEW_REPORTS = 'view_reports',
  VIEW_FINANCIAL = 'view_financial',
  MANAGE_INVENTORY = 'manage_inventory',
  PROCESS_PAYMENTS = 'process_payments',
  
  // System permissions
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_LOCATIONS = 'manage_locations',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
}

export const ROLE_PERMISSIONS = {
  ADMIN: [
    ...Object.values(Permission)
  ],
  MANAGER: [
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.EDIT_APPOINTMENTS,
    Permission.VIEW_CLIENTS,
    Permission.CREATE_CLIENTS,
    Permission.EDIT_CLIENTS,
    Permission.VIEW_STAFF,
    Permission.CREATE_STAFF,
    Permission.EDIT_STAFF,
    Permission.VIEW_REPORTS,
    Permission.VIEW_FINANCIAL,
    Permission.MANAGE_INVENTORY,
    Permission.PROCESS_PAYMENTS,
  ],
  STAFF: [
    Permission.VIEW_APPOINTMENTS,
    Permission.CREATE_APPOINTMENTS,
    Permission.EDIT_APPOINTMENTS,
    Permission.VIEW_CLIENTS,
    Permission.CREATE_CLIENTS,
    Permission.EDIT_CLIENTS,
  ],
  CLIENT: [
    Permission.VIEW_APPOINTMENTS, // Own appointments only
  ]
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]
  return rolePermissions?.includes(permission) || false
}

export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        throw new Error('Unauthorized: No session')
      }
      
      if (!hasPermission(session.user.role, permission)) {
        throw new Error(`Unauthorized: Missing permission ${permission}`)
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}
```

#### **2.2 API Route Protection**
```typescript
// lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { Permission, hasPermission } from './permissions'

export function withAuth(handler: Function, requiredPermission?: Permission) {
  return async function (request: NextRequest) {
    try {
      const token = await getToken({ req: request })
      
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized: No token' },
          { status: 401 }
        )
      }
      
      if (requiredPermission && !hasPermission(token.role as string, requiredPermission)) {
        return NextResponse.json(
          { error: `Unauthorized: Missing permission ${requiredPermission}` },
          { status: 403 }
        )
      }
      
      // Add user context to request
      request.user = {
        id: token.userId as string,
        role: token.role as string,
        email: token.email as string,
      }
      
      return await handler(request)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Usage in API routes
// app/api/staff/route.ts
import { withAuth } from '@/lib/auth/middleware'
import { Permission } from '@/lib/auth/permissions'

export const GET = withAuth(async function(request: NextRequest) {
  // Handler logic here
}, Permission.VIEW_STAFF)
```

### **Phase 3: Input Validation & Sanitization (Week 3)**

#### **3.1 Comprehensive Validation Schemas**
```typescript
// lib/validations/index.ts
import { z } from 'zod'

// Common validation patterns
export const emailSchema = z.string().email().toLowerCase()
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number')
export const nameSchema = z.string().min(2).max(100).trim()
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// User validation
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema.optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF', 'CLIENT']),
})

// Appointment validation
export const createAppointmentSchema = z.object({
  clientId: z.string().cuid(),
  staffId: z.string().cuid(),
  locationId: z.string().cuid(),
  serviceIds: z.array(z.string().cuid()).min(1),
  date: z.string().datetime(),
  notes: z.string().max(500).optional(),
})

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const parsed = schema.parse(data)
  
  // Recursively sanitize string fields
  function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeInput(obj)
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value)
      }
      return sanitized
    }
    return obj
  }
  
  return sanitizeObject(parsed)
}
```

#### **3.2 Rate Limiting**
```typescript
// lib/security/rate-limit.ts
import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(config: RateLimitConfig) {
  return function (request: NextRequest) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const key = `${ip}:${request.nextUrl.pathname}`
    const now = Date.now()
    
    const record = rateLimitStore.get(key)
    
    if (!record || now > record.resetTime) {
      // Reset or create new record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return { allowed: true, remaining: config.maxRequests - 1 }
    }
    
    if (record.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        message: config.message || 'Too many requests'
      }
    }
    
    record.count++
    return {
      allowed: true,
      remaining: config.maxRequests - record.count
    }
  }
}

// Usage
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later'
})

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
})
```

### **Phase 4: Security Headers & Monitoring (Week 4)**

#### **4.1 Security Headers Middleware**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

#### **4.2 Audit Logging System**
```typescript
// lib/security/audit.ts
import { prisma } from '../prisma'

export enum AuditAction {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
  UPDATE_APPOINTMENT = 'UPDATE_APPOINTMENT',
  DELETE_APPOINTMENT = 'DELETE_APPOINTMENT',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  VIEW_SENSITIVE_DATA = 'VIEW_SENSITIVE_DATA',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

interface AuditLogData {
  action: AuditAction
  userId?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        userId: data.userId,
        resourceId: data.resourceId,
        details: data.details || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

export function auditLog(action: AuditAction) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const request = args.find(arg => arg?.headers) // Find request object
      const result = await originalMethod.apply(this, args)
      
      // Log the action
      await createAuditLog({
        action,
        userId: request?.user?.id,
        details: { method: propertyKey, args: args.length },
        ipAddress: request?.ip,
        userAgent: request?.headers?.get('user-agent'),
      })
      
      return result
    }
    
    return descriptor
  }
}
```

## 🔒 **Security Checklist**

### **Authentication & Authorization**
- [ ] Strong password requirements implemented
- [ ] Password hashing with bcrypt (12+ rounds)
- [ ] Session management with secure tokens
- [ ] Role-based access control
- [ ] Permission-based API protection
- [ ] Multi-factor authentication ready

### **Data Protection**
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Sensitive data encryption
- [ ] Secure file uploads

### **Infrastructure Security**
- [ ] HTTPS enforcement
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] API versioning and documentation
- [ ] Error handling without information leakage
- [ ] Audit logging system

### **Compliance & Monitoring**
- [ ] GDPR compliance measures
- [ ] Data retention policies
- [ ] Security incident response plan
- [ ] Regular security audits
- [ ] Vulnerability scanning
- [ ] Performance monitoring

## 📊 **Security Metrics**

### **Key Performance Indicators**
- **Authentication Success Rate**: >99%
- **Failed Login Attempts**: <1% of total attempts
- **API Response Time**: <200ms average
- **Security Incidents**: 0 critical incidents
- **Compliance Score**: 100% for applicable standards

### **Monitoring Alerts**
- Multiple failed login attempts
- Unusual API usage patterns
- Permission escalation attempts
- Data access anomalies
- System performance degradation

## 🚀 **Implementation Timeline**

### **Week 1: Authentication**
- [ ] Implement password hashing
- [ ] Configure NextAuth.js
- [ ] Set up session management
- [ ] Create login/logout flows

### **Week 2: Authorization**
- [ ] Implement RBAC system
- [ ] Create permission middleware
- [ ] Protect API routes
- [ ] Test access controls

### **Week 3: Input Security**
- [ ] Add input validation
- [ ] Implement sanitization
- [ ] Configure rate limiting
- [ ] Test security measures

### **Week 4: Monitoring**
- [ ] Add security headers
- [ ] Implement audit logging
- [ ] Set up monitoring
- [ ] Security testing

This comprehensive security enhancement will transform Vanity Hub into a secure, enterprise-ready application with robust protection against common security threats.
