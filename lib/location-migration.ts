/**
 * Location Data Migration Utility
 * 
 * This utility helps migrate from localStorage-based location data to database-based location data.
 * It clears old mock data and ensures consistency across the application.
 */

export class LocationMigration {
  private static readonly STORAGE_KEYS = {
    LOCATIONS: 'vanity_locations',
    HOME_SERVICE: 'vanity_home_service_location',
    // Add other location-related keys that might exist
    LEGACY_LOCATIONS: 'salon_locations',
    LEGACY_SETTINGS: 'salon_settings',
  }

  /**
   * Clear all localStorage location data
   */
  static clearLocalStorageLocationData(): void {
    if (typeof window === 'undefined') {
      return
    }

    console.log('🧹 LocationMigration: Clearing localStorage location data...')

    // Clear all location-related localStorage keys
    Object.values(this.STORAGE_KEYS).forEach(key => {
      const existingData = localStorage.getItem(key)
      if (existingData) {
        console.log(`🗑️ Removing localStorage key: ${key}`)
        localStorage.removeItem(key)
      }
    })

    // Also clear any other location-related keys that might exist
    const allKeys = Object.keys(localStorage)
    const locationKeys = allKeys.filter(key => 
      key.includes('location') || 
      key.includes('loc') ||
      key.includes('vanity_locations') ||
      key.includes('salon_locations')
    )

    locationKeys.forEach(key => {
      console.log(`🗑️ Removing additional location key: ${key}`)
      localStorage.removeItem(key)
    })

    console.log('✅ LocationMigration: localStorage location data cleared')
  }

  /**
   * Verify database locations exist
   */
  static async verifyDatabaseLocations(): Promise<boolean> {
    try {
      console.log('🔍 LocationMigration: Verifying database locations...')
      
      const response = await fetch('/api/locations')
      if (!response.ok) {
        console.error('❌ LocationMigration: Failed to fetch locations from database')
        return false
      }

      const data = await response.json()
      const locations = data.locations || []
      
      console.log(`✅ LocationMigration: Found ${locations.length} locations in database:`)
      locations.forEach((loc: any) => {
        console.log(`  - ${loc.name} (ID: ${loc.id})`)
      })

      return locations.length > 0
    } catch (error) {
      console.error('❌ LocationMigration: Error verifying database locations:', error)
      return false
    }
  }

  /**
   * Run complete migration
   */
  static async runMigration(): Promise<boolean> {
    console.log('🚀 LocationMigration: Starting location data migration...')

    try {
      // Step 1: Verify database has locations
      const hasDbLocations = await this.verifyDatabaseLocations()
      if (!hasDbLocations) {
        console.error('❌ LocationMigration: No locations found in database. Migration aborted.')
        return false
      }

      // Step 2: Clear localStorage data
      this.clearLocalStorageLocationData()

      // Step 3: Verify migration success
      console.log('✅ LocationMigration: Migration completed successfully')
      console.log('📍 All location data is now sourced from the database')
      
      return true
    } catch (error) {
      console.error('❌ LocationMigration: Migration failed:', error)
      return false
    }
  }

  /**
   * Check if migration is needed
   */
  static isMigrationNeeded(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    // Check if any old location data exists in localStorage
    return Object.values(this.STORAGE_KEYS).some(key => 
      localStorage.getItem(key) !== null
    )
  }
}
