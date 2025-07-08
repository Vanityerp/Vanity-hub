"use client"

import { useEffect, useState } from "react"
import { LocationMigration } from "@/lib/location-migration"

/**
 * Component that runs location data migration on app startup
 * This ensures old localStorage data is cleared and database is used as source of truth
 */
export function LocationMigrationRunner() {
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'running' | 'completed' | 'failed'>('pending')

  useEffect(() => {
    async function runMigration() {
      // Only run migration if needed
      if (!LocationMigration.isMigrationNeeded()) {
        console.log('📍 LocationMigration: No migration needed')
        setMigrationStatus('completed')
        return
      }

      console.log('🚀 LocationMigration: Starting migration...')
      setMigrationStatus('running')

      try {
        const success = await LocationMigration.runMigration()
        if (success) {
          console.log('✅ LocationMigration: Migration completed successfully')
          setMigrationStatus('completed')
        } else {
          console.error('❌ LocationMigration: Migration failed')
          setMigrationStatus('failed')
        }
      } catch (error) {
        console.error('❌ LocationMigration: Migration error:', error)
        setMigrationStatus('failed')
      }
    }

    // Run migration after a short delay to ensure app is initialized
    const timer = setTimeout(runMigration, 1000)
    return () => clearTimeout(timer)
  }, [])

  // This component doesn't render anything visible
  // It just runs the migration in the background
  return null
}
