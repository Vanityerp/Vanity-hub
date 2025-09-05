'use client';

/**
 * DEPRECATED: This file is no longer needed as staff data is fetched directly from the database API
 * Components should use the /api/staff endpoint directly or use React Query/SWR for caching
 */

export async function syncStaffFromAPI(): Promise<boolean> {
  console.warn('syncStaffFromAPI is deprecated. Use /api/staff endpoint directly.');
  return true;
}

/**
 * DEPRECATED: Initialize staff data sync on app startup
 */
export function initializeStaffSync(): void {
  console.warn('initializeStaffSync is deprecated. Use /api/staff endpoint directly.');
}
