#!/usr/bin/env tsx

/**
 * Direct database sync script for location relationships
 * 
 * This script:
 * 1. Ensures all services are linked to all locations
 * 2. Ensures all staff are assigned to appropriate locations
 * 3. Fixes any missing relationships
 */

import { prisma } from '../lib/prisma'

async function syncServiceLocations() {
  console.log('🔄 Syncing service-location relationships...')

  // Get all active services and locations
  const [services, locations] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      include: {
        locations: true
      }
    }),
    prisma.location.findMany({
      where: { isActive: true }
    })
  ])

  console.log(`Found ${services.length} services and ${locations.length} locations`)

  let createdRelationships = 0
  let skippedRelationships = 0

  // For each service, ensure it's linked to all locations
  for (const service of services) {
    const existingLocationIds = service.locations.map(sl => sl.locationId)
    
    for (const location of locations) {
      // Check if relationship already exists
      if (!existingLocationIds.includes(location.id)) {
        try {
          await prisma.locationService.create({
            data: {
              serviceId: service.id,
              locationId: location.id,
              price: service.price, // Use service's base price
              isActive: true
            }
          })
          createdRelationships++
          console.log(`✅ Created: ${service.name} -> ${location.name}`)
        } catch (error) {
          // Relationship might already exist due to race conditions
          console.log(`⚠️ Skipped: ${service.name} -> ${location.name} (already exists)`)
          skippedRelationships++
        }
      } else {
        skippedRelationships++
      }
    }
  }

  console.log(`✅ Service sync complete: ${createdRelationships} created, ${skippedRelationships} skipped`)
  return { createdRelationships, skippedRelationships }
}

async function syncStaffLocations() {
  console.log('\n🔄 Syncing staff-location assignments...')

  // Get all active staff and locations
  const [staff, locations] = await Promise.all([
    prisma.staffMember.findMany({
      where: { status: 'ACTIVE' },
      include: {
        locations: true
      }
    }),
    prisma.location.findMany({
      where: { isActive: true }
    })
  ])

  console.log(`Found ${staff.length} staff members and ${locations.length} locations`)

  let createdAssignments = 0
  let skippedAssignments = 0

  // For each staff member, ensure they have location assignments
  for (const staffMember of staff) {
    const existingLocationIds = staffMember.locations.map(sl => sl.locationId)
    
    // If staff has no locations, assign to all locations
    if (existingLocationIds.length === 0) {
      for (const location of locations) {
        try {
          await prisma.staffLocation.create({
            data: {
              staffId: staffMember.id,
              locationId: location.id,
              isActive: true
            }
          })
          createdAssignments++
          console.log(`✅ Assigned: ${staffMember.name} -> ${location.name}`)
        } catch (error) {
          console.log(`⚠️ Skipped: ${staffMember.name} -> ${location.name} (already exists)`)
          skippedAssignments++
        }
      }
    } else {
      skippedAssignments += existingLocationIds.length
      console.log(`✅ ${staffMember.name} already has ${existingLocationIds.length} location assignments`)
    }
  }

  console.log(`✅ Staff sync complete: ${createdAssignments} created, ${skippedAssignments} skipped`)
  return { createdAssignments, skippedAssignments }
}

async function cleanupOrphanedRelationships() {
  console.log('\n🧹 Cleaning up orphaned relationships...')

  // Clean up service-location relationships where service or location is inactive
  const orphanedServiceLocations = await prisma.locationService.deleteMany({
    where: {
      OR: [
        {
          service: {
            isActive: false
          }
        },
        {
          location: {
            isActive: false
          }
        }
      ]
    }
  })

  // Clean up staff-location assignments where staff is inactive or location is inactive
  const orphanedStaffLocations = await prisma.staffLocation.deleteMany({
    where: {
      OR: [
        {
          staff: {
            status: 'INACTIVE'
          }
        },
        {
          location: {
            isActive: false
          }
        }
      ]
    }
  })

  console.log(`✅ Cleanup complete: ${orphanedServiceLocations.count} service relationships, ${orphanedStaffLocations.count} staff assignments removed`)
  return { 
    serviceRelationshipsRemoved: orphanedServiceLocations.count,
    staffAssignmentsRemoved: orphanedStaffLocations.count
  }
}

async function generateReport() {
  console.log('\n📊 Generating final report...')

  const [
    totalServices,
    totalLocations,
    totalServiceRelationships,
    totalStaff,
    totalStaffAssignments,
    servicesWithoutLocations,
    staffWithoutLocations
  ] = await Promise.all([
    prisma.service.count({ where: { isActive: true } }),
    prisma.location.count({ where: { isActive: true } }),
    prisma.locationService.count({ where: { isActive: true } }),
    prisma.staffMember.count({ where: { status: 'ACTIVE' } }),
    prisma.staffLocation.count({ where: { isActive: true } }),
    prisma.service.count({
      where: {
        isActive: true,
        locations: {
          none: {}
        }
      }
    }),
    prisma.staffMember.count({
      where: {
        status: 'ACTIVE',
        locations: {
          none: {}
        }
      }
    })
  ])

  const expectedServiceRelationships = totalServices * totalLocations
  const serviceCompletionPercentage = expectedServiceRelationships > 0 
    ? Math.round((totalServiceRelationships / expectedServiceRelationships) * 100)
    : 0

  console.log('\n📈 Final Statistics:')
  console.log(`   Services: ${totalServices}`)
  console.log(`   Locations: ${totalLocations}`)
  console.log(`   Service-Location Relationships: ${totalServiceRelationships}/${expectedServiceRelationships} (${serviceCompletionPercentage}%)`)
  console.log(`   Staff Members: ${totalStaff}`)
  console.log(`   Staff-Location Assignments: ${totalStaffAssignments}`)
  console.log(`   Services without locations: ${servicesWithoutLocations}`)
  console.log(`   Staff without locations: ${staffWithoutLocations}`)

  if (serviceCompletionPercentage === 100 && servicesWithoutLocations === 0 && staffWithoutLocations === 0) {
    console.log('\n🎉 Perfect! All location relationships are properly configured!')
  } else {
    console.log('\n⚠️ Some issues remain. Consider running the sync again or checking for data inconsistencies.')
  }
}

async function main() {
  console.log('🚀 Starting Location Relationship Sync...\n')

  try {
    // Step 1: Sync service-location relationships
    const serviceResults = await syncServiceLocations()

    // Step 2: Sync staff-location assignments
    const staffResults = await syncStaffLocations()

    // Step 3: Clean up orphaned relationships
    const cleanupResults = await cleanupOrphanedRelationships()

    // Step 4: Generate final report
    await generateReport()

    console.log('\n✅ Location relationship sync completed successfully!')
    console.log('\nSummary:')
    console.log(`   Service relationships created: ${serviceResults.createdRelationships}`)
    console.log(`   Staff assignments created: ${staffResults.createdAssignments}`)
    console.log(`   Orphaned relationships cleaned: ${cleanupResults.serviceRelationshipsRemoved + cleanupResults.staffAssignmentsRemoved}`)

  } catch (error) {
    console.error('❌ Error during sync:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the sync
main().catch(console.error)
