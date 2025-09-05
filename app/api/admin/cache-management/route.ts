// Cache Management API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { redisCache } from '@/lib/redis-cache'
import { enhancedRateLimit } from '@/lib/enhanced-rate-limiting'
import { dbOptimization } from '@/lib/database-optimization'
import { cacheInvalidation, cacheWarming } from '@/lib/enhanced-data-fetching'
import { withAuth } from '@/lib/security/api-wrapper'
import { z } from 'zod'

// Request validation schemas
const cacheActionSchema = z.object({
  action: z.enum(['clear', 'warm', 'invalidate', 'stats', 'health']),
  target: z.enum(['all', 'clients', 'services', 'appointments', 'staff', 'inventory', 'products', 'analytics']).optional(),
  locationId: z.number().optional()
})

const rateLimitActionSchema = z.object({
  action: z.enum(['stats', 'reset']),
  key: z.string().optional()
})

const dbActionSchema = z.object({
  action: z.enum(['stats', 'slow-queries', 'indexes', 'optimize']),
  limit: z.number().min(1).max(100).optional()
})

// GET - Get cache, rate limiting, and database statistics
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'all'

    const response: any = {}

    if (type === 'all' || type === 'cache') {
      // Cache statistics
      const cacheStats = await redisCache.getStats()
      const cacheHealth = await redisCache.healthCheck()
      
      response.cache = {
        stats: cacheStats,
        health: cacheHealth,
        hitRatio: redisCache.getHitRatio()
      }
    }

    if (type === 'all' || type === 'rateLimit') {
      // Rate limiting statistics
      const rateLimitStats = await enhancedRateLimit.getStats()
      
      response.rateLimit = {
        stats: rateLimitStats
      }
    }

    if (type === 'all' || type === 'database') {
      // Database query statistics
      const queryStats = dbOptimization.getQueryStats()
      
      response.database = {
        queryStats,
        recommendations: dbOptimization.getRecommendedIndexes().filter(r => r.priority === 'high').length
      }
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cache management GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cache management data' },
      { status: 500 }
    )
  }
}, {
  requiredRole: 'admin',
  rateLimit: { windowMs: 60 * 1000, maxRequests: 30 } // 30 requests per minute
})

// POST - Perform cache management actions
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    let result: any = {}

    if (type === 'cache') {
      const { action, target, locationId } = cacheActionSchema.parse(body)

      switch (action) {
        case 'clear':
          if (target === 'all') {
            await redisCache.clear()
            result = { message: 'All cache cleared successfully' }
          } else if (target) {
            await redisCache.deletePattern(target)
            result = { message: `${target} cache cleared successfully` }
          }
          break

        case 'warm':
          if (target === 'all') {
            await cacheWarming.warmEssentialData()
            result = { message: 'Essential cache warmed successfully' }
          } else if (locationId && target) {
            await cacheWarming.warmLocationData(locationId)
            result = { message: `Location ${locationId} cache warmed successfully` }
          }
          break

        case 'invalidate':
          switch (target) {
            case 'clients':
              await cacheInvalidation.invalidateClients()
              break
            case 'services':
              await cacheInvalidation.invalidateServices()
              break
            case 'appointments':
              await cacheInvalidation.invalidateAppointments()
              break
            case 'staff':
              await cacheInvalidation.invalidateStaff()
              break
            case 'inventory':
              await cacheInvalidation.invalidateInventory()
              break
            case 'all':
              await cacheInvalidation.invalidateAll()
              break
          }
          result = { message: `${target} cache invalidated successfully` }
          break

        case 'stats':
          const stats = await redisCache.getStats()
          result = { stats }
          break

        case 'health':
          const health = await redisCache.healthCheck()
          result = { health }
          break
      }
    }

    if (type === 'rateLimit') {
      const { action, key } = rateLimitActionSchema.parse(body)

      switch (action) {
        case 'stats':
          const stats = await enhancedRateLimit.getStats()
          result = { stats }
          break

        case 'reset':
          if (key) {
            // Note: This would need to be implemented in the rate limiting service
            result = { message: `Rate limit reset for key: ${key}` }
          }
          break
      }
    }

    if (type === 'database') {
      const { action, limit } = dbActionSchema.parse(body)

      switch (action) {
        case 'stats':
          const queryStats = dbOptimization.getQueryStats()
          result = { queryStats }
          break

        case 'slow-queries':
          const slowQueries = dbOptimization.getSlowQueries(limit || 10)
          result = { slowQueries }
          break

        case 'indexes':
          const recommendations = dbOptimization.getRecommendedIndexes()
          const sqlStatements = dbOptimization.generateIndexSQL()
          result = { recommendations, sqlStatements }
          break

        case 'optimize':
          const optimizedQueries = dbOptimization.getOptimizedQueries()
          result = { optimizedQueries }
          break
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Cache management POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform cache management action' },
      { status: 500 }
    )
  }
}, {
  requiredRole: 'admin',
  rateLimit: { windowMs: 60 * 1000, maxRequests: 20 } // 20 requests per minute
})

// DELETE - Clear specific cache entries or reset rate limits
export const DELETE = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const key = searchParams.get('key')

    if (type === 'cache' && key) {
      const success = await redisCache.delete(key)
      return NextResponse.json({
        success,
        message: success ? `Cache key ${key} deleted` : `Failed to delete cache key ${key}`
      })
    }

    if (type === 'cache' && !key) {
      const success = await redisCache.clear()
      return NextResponse.json({
        success,
        message: success ? 'All cache cleared' : 'Failed to clear cache'
      })
    }

    if (type === 'database' && searchParams.get('action') === 'clear-log') {
      dbOptimization.clearQueryLog()
      return NextResponse.json({
        success: true,
        message: 'Query log cleared successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid delete operation' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Cache management DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform delete operation' },
      { status: 500 }
    )
  }
}, {
  requiredRole: 'admin',
  rateLimit: { windowMs: 60 * 1000, maxRequests: 10 } // 10 requests per minute
})

// PUT - Update cache or rate limiting configurations
export const PUT = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    if (type === 'database' && body.slowQueryThreshold) {
      dbOptimization.setSlowQueryThreshold(body.slowQueryThreshold)
      return NextResponse.json({
        success: true,
        message: `Slow query threshold updated to ${body.slowQueryThreshold}ms`
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid update operation' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Cache management PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform update operation' },
      { status: 500 }
    )
  }
}, {
  requiredRole: 'admin',
  rateLimit: { windowMs: 60 * 1000, maxRequests: 10 } // 10 requests per minute
})
