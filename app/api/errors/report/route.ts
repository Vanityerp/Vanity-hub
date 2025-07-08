import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-wrapper'
import { validateAndSanitizeInput } from '@/lib/security/validation'
import { logger } from '@/lib/error-handling/logger'
import { z } from 'zod'

// Error report schema
const errorReportSchema = z.object({
  message: z.string().min(1).max(1000),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  errorId: z.string().optional(),
  timestamp: z.string().datetime(),
  level: z.enum(['component', 'page', 'critical']).default('component'),
  url: z.string().url(),
  userAgent: z.string().max(500),
  context: z.record(z.any()).optional(),
  fingerprint: z.string().optional(),
})

// Client error report schema (for frontend errors)
const clientErrorSchema = z.object({
  message: z.string().min(1).max(1000),
  filename: z.string().optional(),
  lineno: z.number().optional(),
  colno: z.number().optional(),
  error: z.object({
    name: z.string().optional(),
    message: z.string().optional(),
    stack: z.string().optional(),
  }).optional(),
  url: z.string().url(),
  userAgent: z.string().max(500),
  timestamp: z.string().datetime(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
})

export const POST = withSecurity(async (request) => {
  try {
    const body = await request.json()
    
    // Determine if this is a client-side error or server-side error report
    const isClientError = 'filename' in body || 'lineno' in body
    
    if (isClientError) {
      // Handle client-side JavaScript errors
      const validation = validateAndSanitizeInput(clientErrorSchema, body)
      
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid error report format', details: validation.errors },
          { status: 400 }
        )
      }

      const errorData = validation.data

      // Log client-side error
      logger.error('Client-side error reported', undefined, {
        userId: errorData.userId,
        sessionId: errorData.sessionId,
        url: errorData.url,
        userAgent: errorData.userAgent,
        metadata: {
          type: 'client_error',
          filename: errorData.filename,
          lineno: errorData.lineno,
          colno: errorData.colno,
          errorName: errorData.error?.name,
          errorMessage: errorData.error?.message,
          errorStack: errorData.error?.stack,
          timestamp: errorData.timestamp,
        }
      })

      // Store in database for analysis
      // await prisma.errorReport.create({
      //   data: {
      //     type: 'CLIENT_ERROR',
      //     message: errorData.message,
      //     stack: errorData.error?.stack,
      //     url: errorData.url,
      //     userAgent: errorData.userAgent,
      //     userId: errorData.userId,
      //     metadata: {
      //       filename: errorData.filename,
      //       lineno: errorData.lineno,
      //       colno: errorData.colno,
      //       errorName: errorData.error?.name,
      //     },
      //     createdAt: new Date(errorData.timestamp),
      //   }
      // })

    } else {
      // Handle server-side error reports (from error boundaries)
      const validation = validateAndSanitizeInput(errorReportSchema, body)
      
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid error report format', details: validation.errors },
          { status: 400 }
        )
      }

      const errorData = validation.data

      // Log server-side error
      logger.error('Error boundary reported error', undefined, {
        userId: request.user?.id,
        url: errorData.url,
        userAgent: errorData.userAgent,
        metadata: {
          type: 'error_boundary',
          errorId: errorData.errorId,
          level: errorData.level,
          componentStack: errorData.componentStack,
          context: errorData.context,
          fingerprint: errorData.fingerprint,
          timestamp: errorData.timestamp,
        }
      })

      // Store in database for analysis
      // await prisma.errorReport.create({
      //   data: {
      //     type: 'ERROR_BOUNDARY',
      //     message: errorData.message,
      //     stack: errorData.stack,
      //     url: errorData.url,
      //     userAgent: errorData.userAgent,
      //     userId: request.user?.id,
      //     errorId: errorData.errorId,
      //     level: errorData.level.toUpperCase(),
      //     metadata: {
      //       componentStack: errorData.componentStack,
      //       context: errorData.context,
      //       fingerprint: errorData.fingerprint,
      //     },
      //     createdAt: new Date(errorData.timestamp),
      //   }
      // })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Error report received' 
    })

  } catch (error) {
    logger.error('Failed to process error report', error as Error, {
      userId: request.user?.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    )
  }
}, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 error reports per minute
    message: 'Too many error reports. Please slow down.',
  }
})

// Handle client-side error reporting via GET (for simple cases)
export const GET = withSecurity(async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    
    const message = searchParams.get('message')
    const url = searchParams.get('url')
    const line = searchParams.get('line')
    const col = searchParams.get('col')
    const filename = searchParams.get('filename')

    if (!message || !url) {
      return NextResponse.json(
        { error: 'Missing required parameters: message, url' },
        { status: 400 }
      )
    }

    // Log simple client error
    logger.error('Client error (GET)', undefined, {
      userId: request.user?.id,
      url,
      userAgent: request.headers.get('user-agent') || undefined,
      metadata: {
        type: 'client_error_get',
        message,
        filename,
        line: line ? parseInt(line) : undefined,
        col: col ? parseInt(col) : undefined,
        timestamp: new Date().toISOString(),
      }
    })

    // Return 1x1 transparent pixel for tracking
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

  } catch (error) {
    logger.error('Failed to process GET error report', error as Error)
    
    // Still return pixel to avoid breaking client
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    })
  }
}, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 GET error reports per minute
  }
})
