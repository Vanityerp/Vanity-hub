#!/usr/bin/env tsx

/**
 * Test script to verify location integration functionality
 * 
 * This script tests:
 * 1. Service-location relationships
 * 2. Staff-location assignments
 * 3. Data consistency
 * 4. API endpoints
 */

import { prisma } from '../lib/prisma'

async function testLocationIntegration() {
  console.log('🧪 Testing Location Integration...\n')

  try {
    // Test 1: Check if locations exist
    console.log('1️⃣ Testing location data...')
    const locations = await prisma.location.findMany({
      where: { isActive: true }
    })
    console.log(`   ✅ Found ${locations.length} active locations:`)
    locations.forEach(loc => console.log(`      - ${loc.name} (${loc.id})`))

    if (locations.length === 0) {
      console.log('   ❌ No locations found! Please seed locations first.')
      return
    }

    // Test 2: Check service-location relationships
    console.log('\n2️⃣ Testing service-location relationships...')
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      }
    })

    console.log(`   ✅ Found ${services.length} active services`)
    
    let servicesWithoutLocations = 0
    let totalRelationships = 0

    services.forEach(service => {
      const locationCount = service.locations.length
      totalRelationships += locationCount
      
      if (locationCount === 0) {
        servicesWithoutLocations++
        console.log(`   ⚠️  Service "${service.name}" has no location assignments`)
      } else {
        console.log(`   ✅ Service "${service.name}" assigned to ${locationCount} locations`)
      }
    })

    const expectedRelationships = services.length * locations.length
    const completionPercentage = expectedRelationships > 0 
      ? Math.round((totalRelationships / expectedRelationships) * 100)
      : 0

    console.log(`   📊 Service-Location Integration: ${completionPercentage}% complete`)
    console.log(`   📊 ${totalRelationships}/${expectedRelationships} relationships exist`)

    if (servicesWithoutLocations > 0) {
      console.log(`   ⚠️  ${servicesWithoutLocations} services need location assignments`)
    }

    // Test 3: Check staff-location assignments
    console.log('\n3️⃣ Testing staff-location assignments...')
    const staff = await prisma.staffMember.findMany({
      where: { status: 'ACTIVE' },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      }
    })

    console.log(`   ✅ Found ${staff.length} active staff members`)
    
    let staffWithoutLocations = 0
    let totalAssignments = 0

    staff.forEach(staffMember => {
      const assignmentCount = staffMember.locations.length
      totalAssignments += assignmentCount
      
      if (assignmentCount === 0) {
        staffWithoutLocations++
        console.log(`   ⚠️  Staff "${staffMember.name}" has no location assignments`)
      } else {
        console.log(`   ✅ Staff "${staffMember.name}" assigned to ${assignmentCount} locations`)
      }
    })

    console.log(`   📊 ${totalAssignments} total staff-location assignments`)

    if (staffWithoutLocations > 0) {
      console.log(`   ⚠️  ${staffWithoutLocations} staff members need location assignments`)
    }

    // Test 4: Check for orphaned relationships
    console.log('\n4️⃣ Testing for orphaned relationships...')
    
    const orphanedServiceLocations = await prisma.locationService.findMany({
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

    const orphanedStaffLocations = await prisma.staffLocation.findMany({
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

    if (orphanedServiceLocations.length > 0) {
      console.log(`   ⚠️  Found ${orphanedServiceLocations.length} orphaned service-location relationships`)
    } else {
      console.log(`   ✅ No orphaned service-location relationships found`)
    }

    if (orphanedStaffLocations.length > 0) {
      console.log(`   ⚠️  Found ${orphanedStaffLocations.length} orphaned staff-location assignments`)
    } else {
      console.log(`   ✅ No orphaned staff-location assignments found`)
    }

    // Test 5: Summary and recommendations
    console.log('\n5️⃣ Summary and Recommendations...')
    
    const issues = []
    const recommendations = []

    if (servicesWithoutLocations > 0) {
      issues.push(`${servicesWithoutLocations} services without location assignments`)
      recommendations.push('Run: POST /api/sync-service-locations to auto-assign services to all locations')
    }

    if (staffWithoutLocations > 0) {
      issues.push(`${staffWithoutLocations} staff without location assignments`)
      recommendations.push('Run: POST /api/sync-staff-locations with mode=auto to auto-assign staff')
    }

    if (orphanedServiceLocations.length > 0) {
      issues.push(`${orphanedServiceLocations.length} orphaned service-location relationships`)
      recommendations.push('Clean up inactive relationships in the database')
    }

    if (orphanedStaffLocations.length > 0) {
      issues.push(`${orphanedStaffLocations.length} orphaned staff-location assignments`)
      recommendations.push('Clean up inactive assignments in the database')
    }

    if (issues.length === 0) {
      console.log('   🎉 All location integration tests passed!')
      console.log('   ✅ Your location integration is properly configured')
    } else {
      console.log('   ⚠️  Issues found:')
      issues.forEach(issue => console.log(`      - ${issue}`))
      console.log('\n   💡 Recommendations:')
      recommendations.forEach(rec => console.log(`      - ${rec}`))
    }

    console.log('\n🏁 Location integration test completed!')

  } catch (error) {
    console.error('❌ Error during location integration test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testLocationIntegration().catch(console.error)
