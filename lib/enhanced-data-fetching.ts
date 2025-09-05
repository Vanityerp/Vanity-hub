// Enhanced Data Fetching Service with Redis Caching
import { cache } from 'react'
import { redisCache, CACHE_CONFIGS } from './redis-cache'
import { DATA_CACHE_TAGS } from './next-cache'

/**
 * Enhanced data fetching wrapper with Redis caching
 */
export function createCachedDataFetcher<T extends (...args: any[]) => Promise<any>>(
  fetchFunction: T,
  cacheKey: string,
  options: {
    tags?: string[]
    fallbackToMemory?: boolean
    skipCache?: boolean
  } = {}
): T {
  const { tags = [], fallbackToMemory = true, skipCache = false } = options

  return (async (...args: Parameters<T>) => {
    // Generate cache key with arguments
    const fullCacheKey = `${cacheKey}:${JSON.stringify(args)}`
    
    // Skip cache if requested
    if (skipCache) {
      return await fetchFunction(...args)
    }

    // Try to get from Redis cache first
    const cacheConfig = CACHE_CONFIGS[cacheKey] || CACHE_CONFIGS.services
    const cached = await redisCache.get<Awaited<ReturnType<T>>>(fullCacheKey)
    
    if (cached !== null) {
      console.log(`Cache hit for ${fullCacheKey}`)
      return cached
    }

    console.log(`Cache miss for ${fullCacheKey}, fetching data...`)
    
    // Fetch fresh data
    const data = await fetchFunction(...args)
    
    // Cache the result
    await redisCache.set(fullCacheKey, data, cacheConfig)
    
    return data
  }) as T
}

/**
 * Enhanced clients fetching with Redis caching
 */
export const fetchClientsEnhanced = createCachedDataFetcher(
  async (locationId?: number) => {
    const url = locationId
      ? `/api/clients?locationId=${locationId}`
      : '/api/clients'

    const response = await fetch(url, {
      next: {
        tags: [DATA_CACHE_TAGS.CLIENTS],
        revalidate: 60 * 5 // 5 minutes fallback
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.statusText}`)
    }

    const data = await response.json()
    return data.clients
  },
  'clients',
  { tags: [DATA_CACHE_TAGS.CLIENTS] }
)

/**
 * Enhanced services fetching with Redis caching
 */
export const fetchServicesEnhanced = createCachedDataFetcher(
  async (locationId?: number) => {
    const url = locationId
      ? `/api/services?locationId=${locationId}`
      : '/api/services'

    const response = await fetch(url, {
      next: {
        tags: [DATA_CACHE_TAGS.SERVICES],
        revalidate: 60 * 10 // 10 minutes fallback
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.statusText}`)
    }

    const data = await response.json()
    return data.services
  },
  'services',
  { tags: [DATA_CACHE_TAGS.SERVICES] }
)

/**
 * Enhanced appointments fetching with Redis caching
 */
export const fetchAppointmentsEnhanced = createCachedDataFetcher(
  async (locationId?: number, date?: string) => {
    let url = '/api/appointments'
    const params = new URLSearchParams()
    
    if (locationId) params.append('locationId', locationId.toString())
    if (date) params.append('date', date)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      next: {
        tags: [DATA_CACHE_TAGS.APPOINTMENTS],
        revalidate: 60 * 2 // 2 minutes fallback
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.statusText}`)
    }

    const data = await response.json()
    return data.appointments
  },
  'appointments',
  { tags: [DATA_CACHE_TAGS.APPOINTMENTS] }
)

/**
 * Enhanced staff fetching with Redis caching
 */
export const fetchStaffEnhanced = createCachedDataFetcher(
  async (locationId?: number) => {
    const url = locationId
      ? `/api/staff?locationId=${locationId}`
      : '/api/staff'

    const response = await fetch(url, {
      next: {
        tags: [DATA_CACHE_TAGS.STAFF],
        revalidate: 60 * 15 // 15 minutes fallback
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch staff: ${response.statusText}`)
    }

    const data = await response.json()
    return data.staff
  },
  'staff',
  { tags: [DATA_CACHE_TAGS.STAFF] }
)

/**
 * Enhanced inventory fetching with Redis caching
 */
export const fetchInventoryEnhanced = createCachedDataFetcher(
  async (locationId: number) => {
    const response = await fetch(`/api/inventory?locationId=${locationId}`, {
      next: {
        tags: [DATA_CACHE_TAGS.INVENTORY],
        revalidate: 60 * 3 // 3 minutes fallback
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.statusText}`)
    }

    const data = await response.json()
    return data.inventory
  },
  'inventory',
  { tags: [DATA_CACHE_TAGS.INVENTORY] }
)

/**
 * Enhanced products fetching with Redis caching
 */
export const fetchProductsEnhanced = createCachedDataFetcher(
  async (locationId?: number, category?: string) => {
    let url = '/api/products'
    const params = new URLSearchParams()
    
    if (locationId) params.append('locationId', locationId.toString())
    if (category) params.append('category', category)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      next: {
        tags: [DATA_CACHE_TAGS.PRODUCTS],
        revalidate: 60 * 30 // 30 minutes fallback
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`)
    }

    const data = await response.json()
    return data.products
  },
  'products',
  { tags: [DATA_CACHE_TAGS.PRODUCTS] }
)

/**
 * Enhanced analytics fetching with Redis caching
 */
export const fetchAnalyticsEnhanced = createCachedDataFetcher(
  async (locationId?: number, dateRange?: { start: string; end: string }) => {
    let url = '/api/analytics'
    const params = new URLSearchParams()
    
    if (locationId) params.append('locationId', locationId.toString())
    if (dateRange) {
      params.append('startDate', dateRange.start)
      params.append('endDate', dateRange.end)
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      next: {
        tags: [DATA_CACHE_TAGS.ANALYTICS],
        revalidate: 60 * 10 // 10 minutes fallback
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`)
    }

    const data = await response.json()
    return data.analytics
  },
  'analytics',
  { tags: [DATA_CACHE_TAGS.ANALYTICS] }
)

/**
 * Enhanced transactions fetching with Redis caching
 */
export const fetchTransactionsEnhanced = createCachedDataFetcher(
  async (locationId?: number, limit?: number) => {
    let url = '/api/transactions'
    const params = new URLSearchParams()
    
    if (locationId) params.append('locationId', locationId.toString())
    if (limit) params.append('limit', limit.toString())
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      next: {
        tags: [DATA_CACHE_TAGS.TRANSACTIONS],
        revalidate: 60 * 5 // 5 minutes fallback
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.statusText}`)
    }

    const data = await response.json()
    return data.transactions
  },
  'transactions',
  { tags: [DATA_CACHE_TAGS.TRANSACTIONS] }
)

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate all client-related cache
   */
  async invalidateClients() {
    await redisCache.deletePattern('clients')
    console.log('Invalidated clients cache')
  },

  /**
   * Invalidate all service-related cache
   */
  async invalidateServices() {
    await redisCache.deletePattern('services')
    console.log('Invalidated services cache')
  },

  /**
   * Invalidate all appointment-related cache
   */
  async invalidateAppointments() {
    await redisCache.deletePattern('appointments')
    console.log('Invalidated appointments cache')
  },

  /**
   * Invalidate all staff-related cache
   */
  async invalidateStaff() {
    await redisCache.deletePattern('staff')
    console.log('Invalidated staff cache')
  },

  /**
   * Invalidate all inventory-related cache
   */
  async invalidateInventory() {
    await redisCache.deletePattern('inventory')
    console.log('Invalidated inventory cache')
  },

  /**
   * Invalidate all cache
   */
  async invalidateAll() {
    await redisCache.clear()
    console.log('Invalidated all cache')
  }
}

/**
 * Cache warming functions for frequently accessed data
 */
export const cacheWarming = {
  /**
   * Warm up cache with essential data
   */
  async warmEssentialData() {
    console.log('Starting cache warming...')
    
    try {
      // Warm up services (most frequently accessed)
      await fetchServicesEnhanced()
      
      // Warm up staff data
      await fetchStaffEnhanced()
      
      // Warm up clients
      await fetchClientsEnhanced()
      
      console.log('Cache warming completed successfully')
    } catch (error) {
      console.error('Cache warming failed:', error)
    }
  },

  /**
   * Warm up location-specific data
   */
  async warmLocationData(locationId: number) {
    console.log(`Warming cache for location ${locationId}...`)
    
    try {
      await Promise.all([
        fetchServicesEnhanced(locationId),
        fetchStaffEnhanced(locationId),
        fetchClientsEnhanced(locationId),
        fetchInventoryEnhanced(locationId),
        fetchProductsEnhanced(locationId)
      ])
      
      console.log(`Cache warming completed for location ${locationId}`)
    } catch (error) {
      console.error(`Cache warming failed for location ${locationId}:`, error)
    }
  }
}
