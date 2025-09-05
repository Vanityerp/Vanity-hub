#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function clearAllStaffData() {
  console.log('🧹 Clearing all existing staff data...')
  
  try {
    // Get all staff members first
    const existingStaff = await prisma.staffMember.findMany({
      include: {
        user: true
      }
    })
    
    console.log(`Found ${existingStaff.length} staff members to remove`)
    
    // Delete all staff-related data in the correct order
    console.log('🗑️ Deleting staff locations...')
    await prisma.staffLocation.deleteMany({})
    
    console.log('🗑️ Deleting staff services...')
    await prisma.staffService.deleteMany({})
    
    console.log('🗑️ Deleting staff schedules...')
    await prisma.staffSchedule.deleteMany({})
    
    console.log('🗑️ Deleting appointments...')
    await prisma.appointment.deleteMany({})
    
    console.log('🗑️ Deleting staff members...')
    await prisma.staffMember.deleteMany({})
    
    // Delete associated user accounts for staff
    console.log('🗑️ Deleting staff user accounts...')
    for (const staff of existingStaff) {
      try {
        await prisma.user.delete({
          where: { id: staff.userId }
        })
        console.log(`   ✅ Deleted user account for ${staff.name}`)
      } catch (error) {
        console.log(`   ⚠️ Could not delete user account for ${staff.name}: ${error}`)
      }
    }
    
    console.log('✅ All staff data cleared successfully!')
    
    // Verify cleanup
    const remainingStaff = await prisma.staffMember.count()
    const remainingStaffLocations = await prisma.staffLocation.count()
    const remainingStaffServices = await prisma.staffService.count()
    const remainingAppointments = await prisma.appointment.count()
    
    console.log('\n📊 Cleanup verification:')
    console.log(`   Staff members: ${remainingStaff}`)
    console.log(`   Staff locations: ${remainingStaffLocations}`)
    console.log(`   Staff services: ${remainingStaffServices}`)
    console.log(`   Appointments: ${remainingAppointments}`)
    
    if (remainingStaff === 0 && remainingStaffLocations === 0 && remainingStaffServices === 0 && remainingAppointments === 0) {
      console.log('🎉 Perfect! All staff data has been completely removed.')
    } else {
      console.log('⚠️ Some data may still remain. Please check manually.')
    }
    
  } catch (error) {
    console.error('❌ Error clearing staff data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllStaffData().catch(console.error)
