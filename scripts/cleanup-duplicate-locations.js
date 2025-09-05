#!/usr/bin/env node

/**
 * Script to clean up duplicate locations in the database
 * 
 * This script identifies and removes duplicate locations that have the same name
 * but different IDs, keeping the location with the longer/more complex ID
 * (which appears to be the original database-generated ID).
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDuplicateLocations() {
  console.log('🔄 Starting duplicate location cleanup...')
  
  try {
    // Fetch all locations
    const allLocations = await prisma.location.findMany({
      orderBy: { createdAt: 'asc' }
    })
    
    console.log(`📊 Found ${allLocations.length} total locations`)
    
    // Group locations by name (case-insensitive)
    const locationGroups = {}
    
    allLocations.forEach(location => {
      const normalizedName = location.name.toLowerCase().trim()
      if (!locationGroups[normalizedName]) {
        locationGroups[normalizedName] = []
      }
      locationGroups[normalizedName].push(location)
    })
    
    // Find duplicates
    const duplicateGroups = Object.entries(locationGroups).filter(([name, locations]) => locations.length > 1)
    
    console.log(`🔍 Found ${duplicateGroups.length} groups with duplicates:`)
    
    const locationsToDelete = []
    
    for (const [normalizedName, locations] of duplicateGroups) {
      console.log(`\n📍 Group: "${normalizedName}" (${locations.length} locations)`)
      
      // Sort by creation date (keep the oldest) and by ID length (keep the longer ID)
      locations.sort((a, b) => {
        // First, sort by creation date (oldest first)
        const dateComparison = new Date(a.createdAt) - new Date(b.createdAt)
        if (dateComparison !== 0) return dateComparison
        
        // If same creation date, prefer longer ID (database-generated IDs are longer)
        return b.id.length - a.id.length
      })
      
      const locationToKeep = locations[0]
      const locationsToRemove = locations.slice(1)
      
      console.log(`  ✅ Keeping: ${locationToKeep.id} (${locationToKeep.name}) - Created: ${locationToKeep.createdAt}`)
      
      for (const locationToRemove of locationsToRemove) {
        console.log(`  ❌ Will delete: ${locationToRemove.id} (${locationToRemove.name}) - Created: ${locationToRemove.createdAt}`)
        locationsToDelete.push(locationToRemove)
      }
    }
    
    if (locationsToDelete.length === 0) {
      console.log('\n✅ No duplicate locations found to delete.')
      return
    }
    
    console.log(`\n🗑️  Will delete ${locationsToDelete.length} duplicate locations:`)
    locationsToDelete.forEach(location => {
      console.log(`  - ${location.id}: ${location.name}`)
    })
    
    // Ask for confirmation (in a real script, you might want to add readline for interactive confirmation)
    console.log('\n⚠️  This will permanently delete the duplicate locations from the database.')
    console.log('💡 Make sure to backup your database before running this script.')
    
    // For safety, let's do a dry run first
    const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--confirm')
    
    if (isDryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made.')
      console.log('💡 To actually delete duplicates, run with --confirm flag')
      return
    }
    
    // Delete duplicates
    console.log('\n🗑️  Deleting duplicate locations...')
    
    for (const location of locationsToDelete) {
      try {
        await prisma.location.delete({
          where: { id: location.id }
        })
        console.log(`  ✅ Deleted: ${location.id} (${location.name})`)
      } catch (error) {
        console.error(`  ❌ Failed to delete ${location.id}: ${error.message}`)
      }
    }
    
    console.log('\n✅ Duplicate location cleanup completed!')
    
    // Verify the cleanup
    const remainingLocations = await prisma.location.findMany()
    console.log(`📊 Remaining locations: ${remainingLocations.length}`)
    
    // Check for any remaining duplicates
    const remainingGroups = {}
    remainingLocations.forEach(location => {
      const normalizedName = location.name.toLowerCase().trim()
      if (!remainingGroups[normalizedName]) {
        remainingGroups[normalizedName] = []
      }
      remainingGroups[normalizedName].push(location)
    })
    
    const remainingDuplicates = Object.entries(remainingGroups).filter(([name, locations]) => locations.length > 1)
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ No duplicate locations remaining!')
    } else {
      console.log(`⚠️  Still found ${remainingDuplicates.length} groups with duplicates:`)
      remainingDuplicates.forEach(([name, locations]) => {
        console.log(`  - "${name}": ${locations.length} locations`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupDuplicateLocations()
  .then(() => {
    console.log('\n🎉 Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
