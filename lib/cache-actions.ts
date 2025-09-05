'use server';

import { revalidateTag, revalidatePath } from 'next/cache';
import { CURRENCY_CACHE_TAGS, DATA_CACHE_TAGS } from './next-cache';

/**
 * Enhanced server action to revalidate cache entries by tags
 *
 * This function revalidates cache entries by tags with improved error handling
 * and logging. It also dispatches a custom event to notify client components
 * about the revalidation.
 *
 * @param tags Tags to revalidate
 * @param paths Optional paths to revalidate
 */
export async function revalidateCacheTags(
  tags: string[],
  paths?: string[]
): Promise<{ success: boolean; revalidatedTags: string[]; revalidatedPaths: string[] }> {
  const revalidatedTags: string[] = [];
  const revalidatedPaths: string[] = [];
  let success = true;

  // Revalidate by tags
  for (const tag of tags) {
    try {
      revalidateTag(tag);
      revalidatedTags.push(tag);
      console.log(`Successfully revalidated tag: ${tag}`);
    } catch (error) {
      console.error(`Error revalidating tag ${tag}:`, error);
      success = false;
    }
  }

  // Revalidate by paths if provided
  if (paths && paths.length > 0) {
    for (const path of paths) {
      try {
        revalidatePath(path);
        revalidatedPaths.push(path);
        console.log(`Successfully revalidated path: ${path}`);
      } catch (error) {
        console.error(`Error revalidating path ${path}:`, error);
        success = false;
      }
    }
  }

  return {
    success,
    revalidatedTags,
    revalidatedPaths
  };
}

/**
 * Enhanced server action to revalidate all currency-related cache entries
 *
 * This function revalidates all currency-related cache entries and also
 * revalidates paths that are likely to be affected by currency changes.
 */
export async function revalidateCurrencyCache(): Promise<{ success: boolean }> {
  const currencyTags = [
    CURRENCY_CACHE_TAGS.ALL,
    CURRENCY_CACHE_TAGS.RATES,
    CURRENCY_CACHE_TAGS.PREFERENCES,
  ];

  // Paths that are likely to be affected by currency changes
  const currencyPaths = [
    '/dashboard',
    '/enhanced-demo',
    '/client-portal',
  ];

  const result = await revalidateCacheTags(currencyTags, currencyPaths);

  // Dispatch a custom event to notify client components
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('currency-cache-revalidated', {
      detail: {
        tags: result.revalidatedTags,
        paths: result.revalidatedPaths,
        timestamp: Date.now()
      }
    }));
  }

  return { success: result.success };
}

/**
 * Server action to revalidate specific data cache entries
 *
 * This function revalidates specific data cache entries based on the provided tags.
 * It also revalidates related paths if they are likely to be affected by the data changes.
 *
 * @param tags Data tags to revalidate
 */
export async function revalidateDataCache(tags: string[]): Promise<{ success: boolean }> {
  // Map data tags to related paths
  const pathMap: Record<string, string[]> = {
    [DATA_CACHE_TAGS.CLIENTS]: ['/dashboard/clients', '/client-portal'],
    [DATA_CACHE_TAGS.SERVICES]: ['/dashboard/services', '/enhanced-demo'],
    [DATA_CACHE_TAGS.APPOINTMENTS]: ['/dashboard/appointments', '/client-portal/appointments'],
    [DATA_CACHE_TAGS.INVENTORY]: ['/dashboard/inventory'],
    [DATA_CACHE_TAGS.STAFF]: [], // Remove /dashboard/staff to prevent infinite loops
    [DATA_CACHE_TAGS.STAFF_DIRECTORY]: [], // Remove /dashboard/staff to prevent infinite loops
    [DATA_CACHE_TAGS.STAFF_SCHEDULE]: [], // Remove /dashboard/staff to prevent infinite loops
    [DATA_CACHE_TAGS.STAFF_PERFORMANCE]: [], // Remove /dashboard/staff to prevent infinite loops
    [DATA_CACHE_TAGS.USERS]: ['/dashboard/settings'],
    [DATA_CACHE_TAGS.PERMISSIONS]: ['/dashboard/settings'],
    [DATA_CACHE_TAGS.SETTINGS]: ['/dashboard/settings'],
  };

  // Collect all paths that need to be revalidated
  const pathsToRevalidate = new Set<string>();

  // Add paths related to the provided tags
  for (const tag of tags) {
    const paths = pathMap[tag] || [];
    paths.forEach(path => pathsToRevalidate.add(path));
  }

  // Revalidate tags and paths
  const result = await revalidateCacheTags(tags, Array.from(pathsToRevalidate));

  // Dispatch a custom event to notify client components
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('data-cache-revalidated', {
      detail: {
        tags: result.revalidatedTags,
        paths: result.revalidatedPaths,
        timestamp: Date.now()
      }
    }));
  }

  return { success: result.success };
}

