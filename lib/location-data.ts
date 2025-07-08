/**
 * DEPRECATED: This file has been replaced with database-driven location management.
 *
 * Location data is now stored in the database and accessed via:
 * - API: /api/locations
 * - Provider: useLocations() hook
 * - Database: Prisma Location model
 *
 * The required locations are seeded via:
 * - API: /api/seed-locations
 * - Script: scripts/seed-locations.ts
 *
 * Required locations:
 * 1. D-ring road
 * 2. Muaither
 * 3. Medinat Khalifa
 * 4. Home service
 * 5. Online store
 */

// This file is kept for reference only - all location data now comes from database
export const locations: any[] = []

console.warn('⚠️ lib/location-data.ts is deprecated. Use useLocations() hook instead.')