// Client and server compatible cache utilities
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

/**
 * Next.js 15 Enhanced Caching Utility
 *
 * This utility provides a wrapper around Next.js 15's unstable_cache with improved
 * tag-based revalidation and error handling.
 */

type CacheOptions = {
  /** Cache tags for revalidation */
  tags?: string[];
  /** Cache revalidation time in seconds */
  revalidate?: number;
  /** Cache key prefix */
  keyPrefix?: string;
};

/**
 * Creates a cached function with improved tag-based revalidation
 *
 * @param fn The function to cache
 * @param options Cache options including tags and revalidation time
 * @returns A cached version of the function
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions = {}
): T {
  const {
    tags = [],
    revalidate = 60, // Default to 1 minute
    keyPrefix = 'vanity-hub'
  } = options;

  // Add standard tags based on function name
  const fnName = fn.name || 'anonymous';

  // Add function name to tags for better debugging and revalidation
  const allTags = [...tags, `function:${fnName}`];

  // Create the cached function using Next.js unstable_cache for server components
  // and React's cache as a fallback for client components
  if (typeof unstable_cache === 'function') {
    // Server-side caching with unstable_cache
    const cachedFn = unstable_cache(
      async (...args: Parameters<T>) => {
        try {
          return await fn(...args);
        } catch (error) {
          console.error(`Error in cached function ${fnName}:`, error);
          throw error;
        }
      },
      // Generate a stable cache key based on function name and arguments
      `${keyPrefix}:${fnName}`,
      {
        tags: allTags,
        revalidate: revalidate
      }
    );

    // Return the cached function with the same signature as the original
    return ((...args: Parameters<T>) => cachedFn(...args)) as T;
  } else {
    // Client-side fallback using React's cache
    const cachedFn = cache(
      async (...args: Parameters<T>) => {
        try {
          return await fn(...args);
        } catch (error) {
          console.error(`Error in cached function ${fnName}:`, error);
          throw error;
        }
      }
    );

    // Return the cached function with the same signature as the original
    return ((...args: Parameters<T>) => cachedFn(...args)) as T;
  }
}

/**
 * Currency-specific cache tags
 */
export const CURRENCY_CACHE_TAGS = {
  ALL: 'currency:all',
  RATES: 'currency:rates',
  PREFERENCES: 'currency:preferences',
};

/**
 * Data-specific cache tags
 */
export const DATA_CACHE_TAGS = {
  CLIENTS: 'data:clients',
  SERVICES: 'data:services',
  APPOINTMENTS: 'data:appointments',
  INVENTORY: 'data:inventory',
  STAFF: 'data:staff',
  STAFF_DIRECTORY: 'data:staff:directory',
  STAFF_SCHEDULE: 'data:staff:schedule',
  STAFF_PERFORMANCE: 'data:staff:performance',
  USERS: 'data:users',
  PERMISSIONS: 'data:permissions',
  SETTINGS: 'data:settings',
};
