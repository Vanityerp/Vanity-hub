// Enhanced Rate Limiting System for Vanity Hub
import { NextRequest, NextResponse } from 'next/server'
import { redisCache } from './redis-cache'

// Rate limiting configuration interface
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (request: NextRequest) => string
  onLimitReached?: (request: NextRequest) => void
  tier?: 'basic' | 'premium' | 'enterprise' // User tier for different limits
  endpoint?: string // Specific endpoint identifier
}

// Rate limiting result interface
interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
  tier?: string
}

// Rate limiting tiers with different limits
const RATE_LIMIT_TIERS = {
  basic: {
    api: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 auth attempts per 15 minutes
    upload: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 uploads per hour
  },
  premium: {
    api: { windowMs: 15 * 60 * 1000, maxRequests: 500 }, // 500 requests per 15 minutes
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 auth attempts per 15 minutes
    upload: { windowMs: 60 * 60 * 1000, maxRequests: 50 }, // 50 uploads per hour
  },
  enterprise: {
    api: { windowMs: 15 * 60 * 1000, maxRequests: 2000 }, // 2000 requests per 15 minutes
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 20 }, // 20 auth attempts per 15 minutes
    upload: { windowMs: 60 * 60 * 1000, maxRequests: 200 }, // 200 uploads per hour
  }
}

// Endpoint-specific rate limits
const ENDPOINT_LIMITS = {
  '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  '/api/auth/register': { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  '/api/appointments': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute
  '/api/clients': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute
  '/api/staff': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute
  '/api/inventory': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
  '/api/transactions': { windowMs: 60 * 1000, maxRequests: 50 }, // 50 per minute
  '/api/upload': { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 per hour
  '/api/reports': { windowMs: 5 * 60 * 1000, maxRequests: 10 }, // 10 per 5 minutes
}

class EnhancedRateLimitService {
  private fallbackStore = new Map<string, { count: number; resetTime: number; requests: number[] }>()

  /**
   * Get client IP address with multiple fallbacks
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (forwarded) return forwarded.split(',')[0].trim()
    if (realIP) return realIP
    if (remoteAddr) return remoteAddr
    
    return 'unknown'
  }

  /**
   * Generate rate limit key
   */
  private generateKey(request: NextRequest, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request)
    }

    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent')?.substring(0, 50) || 'unknown'
    const endpoint = config.endpoint || request.nextUrl.pathname
    
    return `rate_limit:${ip}:${endpoint}:${userAgent}`
  }

  /**
   * Get user tier from request (could be from JWT, API key, etc.)
   */
  private getUserTier(request: NextRequest): 'basic' | 'premium' | 'enterprise' {
    // In a real implementation, this would extract tier from JWT token or API key
    const authHeader = request.headers.get('authorization')
    const apiKey = request.headers.get('x-api-key')
    
    // Mock implementation - in production, decode JWT or lookup API key
    if (apiKey?.includes('enterprise')) return 'enterprise'
    if (apiKey?.includes('premium')) return 'premium'
    
    return 'basic'
  }

  /**
   * Enhanced rate limiting with Redis support and sliding window
   */
  async checkRateLimit(request: NextRequest, config: RateLimitConfig): Promise<RateLimitResult> {
    const key = this.generateKey(request, config)
    const now = Date.now()
    const windowStart = now - config.windowMs
    const tier = config.tier || this.getUserTier(request)

    // Get tier-specific limits if not explicitly provided
    const endpoint = config.endpoint || request.nextUrl.pathname
    let finalConfig = config

    if (!config.maxRequests && ENDPOINT_LIMITS[endpoint]) {
      finalConfig = { ...config, ...ENDPOINT_LIMITS[endpoint] }
    } else if (!config.maxRequests) {
      const tierLimits = RATE_LIMIT_TIERS[tier]?.api || RATE_LIMIT_TIERS.basic.api
      finalConfig = { ...config, ...tierLimits }
    }

    try {
      // Try Redis first
      const result = await this.redisRateLimit(key, now, windowStart, finalConfig, tier)
      if (result) return result

      // Fallback to memory store
      return this.memoryRateLimit(key, now, windowStart, finalConfig, tier)
    } catch (error) {
      console.error('Rate limiting error:', error)
      // On error, allow the request to proceed
      return {
        success: true,
        limit: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests - 1,
        resetTime: now + finalConfig.windowMs,
        tier
      }
    }
  }

  /**
   * Redis-based sliding window rate limiting
   */
  private async redisRateLimit(
    key: string,
    now: number,
    windowStart: number,
    config: RateLimitConfig,
    tier: string
  ): Promise<RateLimitResult | null> {
    try {
      // Use Redis sorted sets for sliding window
      const redis = (redisCache as any).redis
      if (!redis) return null

      // Remove expired entries
      await redis.zremrangebyscore(key, 0, windowStart)
      
      // Count current requests in window
      const currentCount = await redis.zcard(key)
      
      if (currentCount >= config.maxRequests) {
        // Get the oldest request time to calculate retry after
        const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES')
        const retryAfter = oldestRequest.length > 0 
          ? Math.ceil((parseInt(oldestRequest[1]) + config.windowMs - now) / 1000)
          : Math.ceil(config.windowMs / 1000)

        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: now + config.windowMs,
          retryAfter,
          tier
        }
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`)
      await redis.expire(key, Math.ceil(config.windowMs / 1000))

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - currentCount - 1,
        resetTime: now + config.windowMs,
        tier
      }
    } catch (error) {
      console.error('Redis rate limiting error:', error)
      return null
    }
  }

  /**
   * Memory-based sliding window rate limiting
   */
  private memoryRateLimit(
    key: string,
    now: number,
    windowStart: number,
    config: RateLimitConfig,
    tier: string
  ): RateLimitResult {
    let entry = this.fallbackStore.get(key)
    
    if (!entry) {
      entry = { count: 0, resetTime: now + config.windowMs, requests: [] }
      this.fallbackStore.set(key, entry)
    }

    // Clean up old requests (sliding window)
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart)
    
    if (entry.requests.length >= config.maxRequests) {
      const oldestRequest = Math.min(...entry.requests)
      const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000)

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: oldestRequest + config.windowMs,
        retryAfter,
        tier
      }
    }

    // Add current request
    entry.requests.push(now)
    entry.count = entry.requests.length

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.requests.length,
      resetTime: now + config.windowMs,
      tier
    }
  }

  /**
   * Create rate limiting middleware
   */
  createMiddleware(config: RateLimitConfig) {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkRateLimit(request, config)

      if (!result.success) {
        const response = NextResponse.json(
          {
            error: config.message || 'Too many requests',
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            retryAfter: result.retryAfter,
            tier: result.tier
          },
          { status: 429 }
        )

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', result.limit.toString())
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
        response.headers.set('X-RateLimit-Tier', result.tier || 'basic')
        
        if (result.retryAfter) {
          response.headers.set('Retry-After', result.retryAfter.toString())
        }

        // Call onLimitReached callback if provided
        if (config.onLimitReached) {
          config.onLimitReached(request)
        }

        return response
      }

      return null // Allow request to proceed
    }
  }

  /**
   * Get rate limit status for a request
   */
  async getStatus(request: NextRequest, config: RateLimitConfig): Promise<RateLimitResult> {
    return await this.checkRateLimit(request, config)
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(request: NextRequest, config: RateLimitConfig): Promise<boolean> {
    const key = this.generateKey(request, config)
    
    try {
      const redis = (redisCache as any).redis
      if (redis) {
        await redis.del(key)
      } else {
        this.fallbackStore.delete(key)
      }
      return true
    } catch (error) {
      console.error('Rate limit reset error:', error)
      return false
    }
  }

  /**
   * Get rate limiting statistics
   */
  async getStats(): Promise<{
    totalKeys: number
    memoryUsage: number
    redisAvailable: boolean
  }> {
    try {
      const redis = (redisCache as any).redis
      if (redis) {
        const keys = await redis.keys('rate_limit:*')
        const info = await redis.info('memory')
        const memoryMatch = info.match(/used_memory:(\d+)/)
        
        return {
          totalKeys: keys.length,
          memoryUsage: memoryMatch ? parseInt(memoryMatch[1]) : 0,
          redisAvailable: true
        }
      } else {
        return {
          totalKeys: this.fallbackStore.size,
          memoryUsage: JSON.stringify([...this.fallbackStore.entries()]).length,
          redisAvailable: false
        }
      }
    } catch (error) {
      console.error('Rate limit stats error:', error)
      return {
        totalKeys: 0,
        memoryUsage: 0,
        redisAvailable: false
      }
    }
  }
}

// Export singleton instance
export const enhancedRateLimit = new EnhancedRateLimitService()

// Export predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  strict: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  moderate: { windowMs: 15 * 60 * 1000, maxRequests: 50 },
  lenient: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  upload: { windowMs: 60 * 60 * 1000, maxRequests: 20 },
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  reports: { windowMs: 5 * 60 * 1000, maxRequests: 10 },
}

// Export rate limiting decorators for API routes
export function withRateLimit(config: RateLimitConfig) {
  return function (handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
      const rateLimitResponse = await enhancedRateLimit.createMiddleware(config)(request)
      
      if (rateLimitResponse) {
        return rateLimitResponse
      }
      
      return handler(request, ...args)
    }
  }
}
