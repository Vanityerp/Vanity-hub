"use client"

/**
 * Data Cache Service
 *
 * This service provides a caching mechanism for data fetching operations.
 * It helps reduce redundant localStorage access and improves performance.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
}

class DataCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private expiryTime: number = 5 * 60 * 1000 // 5 minutes default expiry
  private initialized: boolean = false

  /**
   * Initialize the cache service
   */
  initialize(expiryTimeMs: number = 5 * 60 * 1000) {
    if (this.initialized) return

    this.expiryTime = expiryTimeMs
    this.initialized = true
  }

  /**
   * Get data from cache or fetch it if not available
   * Performance optimized version with:
   * - Promise caching to prevent duplicate fetches
   * - Improved error handling
   * - Memory usage optimizations
   */
  async getData<T>(
    key: string,
    fetchFn: () => Promise<T> | T,
    options: {
      forceRefresh?: boolean,
      expiryTimeMs?: number
    } = {}
  ): Promise<T> {
    const { forceRefresh = false, expiryTimeMs = this.expiryTime } = options

    // Initialize if not already done
    if (!this.initialized) {
      this.initialize()
    }

    // Check if we have a valid cache entry
    const entry = this.cache.get(key)
    const now = Date.now()

    // Return cached data if it's still valid and we're not forcing a refresh
    if (!forceRefresh && entry && (now - entry.timestamp) < expiryTimeMs) {
      return entry.data
    }

    // Check if we already have a pending fetch for this key
    const pendingFetchKey = `pending:${key}`
    const pendingFetch = this.cache.get(pendingFetchKey) as { data: Promise<T> } | undefined

    if (pendingFetch) {
      // Return the pending fetch promise to avoid duplicate fetches
      return pendingFetch.data
    }

    // Create a new fetch promise
    const fetchPromise = (async () => {
      try {
        // Fetch fresh data
        const data = await fetchFn()

        // Update cache with the fresh data
        this.cache.set(key, {
          data,
          timestamp: now
        })

        // Remove the pending fetch entry
        this.cache.delete(pendingFetchKey)

        return data
      } catch (error) {
        // Remove the pending fetch entry
        this.cache.delete(pendingFetchKey)

        // If fetch fails but we have cached data, return it even if expired
        if (entry) {
          // Mark the entry as recently accessed to prevent it from being garbage collected
          this.cache.set(key, {
            data: entry.data,
            timestamp: entry.timestamp
          })

          return entry.data
        }

        // Otherwise, rethrow the error
        throw error
      }
    })()

    // Store the pending fetch promise in the cache
    this.cache.set(pendingFetchKey, {
      data: fetchPromise,
      timestamp: now
    })

    return fetchPromise
  }

  /**
   * Get data from localStorage with caching
   * Performance optimized version with:
   * - Improved error handling
   * - Type checking for arrays
   * - Memory usage optimizations
   */
  getFromLocalStorage<T>(
    key: string,
    defaultValue: T,
    options: {
      forceRefresh?: boolean,
      expiryTimeMs?: number
    } = {}
  ): T {
    // Create a cache key for this localStorage item
    const cacheKey = `localStorage:${key}`

    try {
      // For better performance, use a synchronous approach first
      // Check if we have a valid cache entry before using the async getData method
      const entry = this.cache.get(cacheKey)
      const now = Date.now()
      const { forceRefresh = false, expiryTimeMs = this.expiryTime } = options

      // Return cached data if it's still valid and we're not forcing a refresh
      if (!forceRefresh && entry && (now - entry.timestamp) < expiryTimeMs) {
        return entry.data as T
      }

      // If we don't have a valid cache entry, use the async getData method
      return this.getData<T>(
        cacheKey,
        () => {
          if (typeof window === 'undefined') return defaultValue

          try {
            // Use a more efficient approach to check if the key exists
            if (!Object.prototype.hasOwnProperty.call(localStorage, key)) {
              return defaultValue
            }

            const storedValue = localStorage.getItem(key)
            if (!storedValue) return defaultValue

            try {
              const parsedValue = JSON.parse(storedValue)

              // Validate the parsed value based on the expected type
              if (Array.isArray(defaultValue) && !Array.isArray(parsedValue)) {
                console.warn(`Expected array for ${key} but got ${typeof parsedValue}`)
                return defaultValue
              }

              // For objects, ensure we have a valid object
              if (typeof defaultValue === 'object' && defaultValue !== null &&
                  (typeof parsedValue !== 'object' || parsedValue === null)) {
                console.warn(`Expected object for ${key} but got ${typeof parsedValue}`)
                return defaultValue
              }

              return parsedValue as T
            } catch (error) {
              console.error(`Error parsing JSON from localStorage for key ${key}:`, error)
              return defaultValue
            }
          } catch (error) {
            console.error(`Error accessing localStorage for key ${key}:`, error)
            return defaultValue
          }
        },
        options
      )
    } catch (error) {
      console.error(`Error in getFromLocalStorage for key ${key}:`, error)
      return defaultValue
    }
  }

  /**
   * Save data to localStorage and update cache
   * Performance optimized version with:
   * - Debounced writes to reduce disk I/O
   * - Improved error handling
   * - Memory usage optimizations
   */
  saveToLocalStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return

    // Use a static property to track pending writes
    if (!this._pendingWrites) {
      this._pendingWrites = new Map()
    }

    // Clear any existing timeout for this key
    if (this._pendingWrites.has(key)) {
      clearTimeout(this._pendingWrites.get(key))
    }

    // Schedule the write with a short debounce
    const timeoutId = setTimeout(() => {
      try {
        // Special handling for services to ensure no invalid locations
        if (key === 'vanity_services' && Array.isArray(data)) {
          // Fix any services with invalid locations (loc4)
          const fixedServices = (data as any[]).map(service => {
            if (service && Array.isArray(service.locations)) {
              service.locations = service.locations.map((loc: string) =>
                loc === 'loc4' ? 'home' : loc
              );
            }
            return service;
          });

          // Stringify the data once to avoid doing it twice
          const jsonData = JSON.stringify(fixedServices)

          // Update localStorage
          localStorage.setItem(key, jsonData)

          // Update cache
          this.cache.set(`localStorage:${key}`, {
            data: fixedServices,
            timestamp: Date.now()
          })
        } else {
          // Stringify the data once to avoid doing it twice
          const jsonData = JSON.stringify(data)

          // Update localStorage
          localStorage.setItem(key, jsonData)

          // Update cache
          this.cache.set(`localStorage:${key}`, {
            data,
            timestamp: Date.now()
          })
        }

        // Remove from pending writes
        this._pendingWrites.delete(key)
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error)
        // Remove from pending writes even if there's an error
        this._pendingWrites.delete(key)
      }
    }, 100) // 100ms debounce

    // Store the timeout ID
    this._pendingWrites.set(key, timeoutId)
  }

  // Property to track pending writes
  private _pendingWrites?: Map<string, NodeJS.Timeout>

  /**
   * Clear a specific cache entry
   */
  clearCache(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clearAllCache(): void {
    this.cache.clear()
  }
}

// Create a singleton instance
export const dataCache = new DataCacheService()
