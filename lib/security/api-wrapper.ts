import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit, RateLimitOptions } from './rate-limit'
import { validateAndSanitizeInput } from './validation'
import { auditSecurity } from './audit-log'
import { z } from 'zod'

export interface ApiHandlerOptions {
  requireAuth?: boolean
  requiredRole?: string[]
  rateLimit?: RateLimitOptions
  validateInput?: z.ZodSchema
  auditAction?: string
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
    locations: string[]
  }
  validatedData?: any
}

// Enhanced API wrapper with security features
export function withSecurity(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
) {
  return async function secureHandler(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Rate limiting
      if (options.rateLimit) {
        const rateLimitResult = await rateLimit(request, options.rateLimit)
        if (!rateLimitResult.success) {
          // Audit rate limit exceeded
          await auditSecurity.rateLimitExceeded(
            request.nextUrl.pathname,
            undefined,
            request
          )
          
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded',
              retryAfter: rateLimitResult.retryAfter 
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
                'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
              }
            }
          )
        }
      }

      // 2. Authentication check
      let user: AuthenticatedRequest['user'] | undefined
      if (options.requireAuth) {
        const token = await getToken({ req: request })
        
        if (!token) {
          await auditSecurity.unauthorizedAccess(
            request.nextUrl.pathname,
            undefined,
            request
          )
          
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        }

        user = {
          id: token.id as string,
          email: token.email as string,
          role: token.role as string,
          locations: token.locations as string[] || [],
        }

        // 3. Role-based authorization
        if (options.requiredRole && options.requiredRole.length > 0) {
          if (!options.requiredRole.includes(user.role)) {
            await auditSecurity.unauthorizedAccess(
              request.nextUrl.pathname,
              user.id,
              request
            )
            
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            )
          }
        }
      }

      // 4. Input validation and sanitization
      let validatedData: any
      if (options.validateInput && request.method !== 'GET') {
        try {
          const body = await request.json()
          const validation = validateAndSanitizeInput(options.validateInput, body)
          
          if (!validation.success) {
            return NextResponse.json(
              { 
                error: 'Invalid input',
                details: validation.errors 
              },
              { status: 400 }
            )
          }
          
          validatedData = validation.data
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid JSON payload' },
            { status: 400 }
          )
        }
      }

      // 5. Create authenticated request object
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user
      authenticatedRequest.validatedData = validatedData

      // 6. Execute the handler
      const response = await handler(authenticatedRequest)

      // 7. Add security headers to response
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-XSS-Protection', '1; mode=block')

      return response

    } catch (error) {
      console.error('API handler error:', error)
      
      // Audit the error
      if (options.auditAction) {
        await auditSecurity.suspiciousActivity(
          `API error in ${request.nextUrl.pathname}: ${error}`,
          (request as AuthenticatedRequest).user?.id,
          request
        )
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Convenience wrappers for common patterns
export const withAuth = (
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: Omit<ApiHandlerOptions, 'requireAuth'> = {}
) => withSecurity(handler, { ...options, requireAuth: true })

export const withAdminAuth = (
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: Omit<ApiHandlerOptions, 'requireAuth' | 'requiredRole'> = {}
) => withSecurity(handler, { 
  ...options, 
  requireAuth: true, 
  requiredRole: ['ADMIN'] 
})

export const withStaffAuth = (
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: Omit<ApiHandlerOptions, 'requireAuth' | 'requiredRole'> = {}
) => withSecurity(handler, { 
  ...options, 
  requireAuth: true, 
  requiredRole: ['ADMIN', 'STAFF'] 
})

// Rate limit presets
export const rateLimits = {
  strict: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 requests per 15 minutes
  moderate: { windowMs: 15 * 60 * 1000, maxRequests: 50 }, // 50 requests per 15 minutes
  lenient: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 login attempts per 15 minutes
}

// Example usage:
/*
// app/api/users/route.ts
import { withAdminAuth, rateLimits } from '@/lib/security/api-wrapper'
import { userCreationSchema } from '@/lib/security/validation'

export const GET = withAdminAuth(async (req) => {
  // Handler logic here
  return NextResponse.json({ users: [] })
}, {
  rateLimit: rateLimits.moderate,
  auditAction: 'VIEW_USERS'
})

export const POST = withAdminAuth(async (req) => {
  const userData = req.validatedData
  // Create user logic here
  return NextResponse.json({ user: userData })
}, {
  rateLimit: rateLimits.strict,
  validateInput: userCreationSchema,
  auditAction: 'CREATE_USER'
})
*/

// CORS helper for API routes
export function corsHeaders(origin?: string) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://your-domain.com',
    // Add your production domains
  ]

  const isAllowedOrigin = origin && allowedOrigins.includes(origin)

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}

// Handle CORS preflight requests
export function handleCors(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin')
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(origin),
    })
  }
  return null
}

// Error response helper
export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

// Success response helper
export function successResponse(
  data: any,
  status: number = 200,
  message?: string
) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}
