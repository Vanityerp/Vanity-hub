import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"

// Security headers configuration
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
}

// Add security headers to response
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

// Check for suspicious patterns
function detectSuspiciousActivity(req: NextRequest): boolean {
  const { pathname, searchParams } = req.nextUrl
  const userAgent = req.headers.get('user-agent') || ''

  // Check for common attack patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /data:text\/html/i,  // Data URI XSS
  ]

  // Check pathname and search params
  const fullUrl = pathname + searchParams.toString()
  if (suspiciousPatterns.some(pattern => pattern.test(fullUrl))) {
    return true
  }

  // Check for bot-like behavior (but allow legitimate crawlers)
  const maliciousBotPatterns = [
    /curl|wget|python-requests|php/i,
    /nikto|sqlmap|nmap|masscan/i,
  ]

  if (maliciousBotPatterns.some(pattern => pattern.test(userAgent))) {
    return true
  }

  return false
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Create response
    let response = NextResponse.next()

    // Add security headers
    response = addSecurityHeaders(response)

    // Detect suspicious activity
    if (detectSuspiciousActivity(req)) {
      // Log suspicious activity (simplified for now)
      console.warn('Suspicious activity detected:', {
        pathname,
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      })
    }

    // Role-based routing after successful authentication
    if (pathname === '/dashboard' && token?.role) {
      const role = token.role as string

      // Redirect staff and receptionists to appointments page
      if (role === 'STAFF' || role === 'RECEPTIONIST') {
        const appointmentsUrl = new URL('/dashboard/appointments', req.url)
        return NextResponse.redirect(appointmentsUrl)
      }
    }

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow all API routes (they handle their own auth if needed)
        if (pathname.startsWith('/api')) {
          return true
        }

        // Allow login page
        if (pathname.startsWith('/login')) {
          return true
        }

        // Allow public pages
        if (pathname === '/' || pathname.startsWith('/client-portal') || pathname.startsWith('/booking')) {
          return true
        }

        // For dashboard routes, require authentication
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }

        // Default: allow access
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images).*)',
  ],
}
