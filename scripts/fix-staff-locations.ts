#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function fixStaffLocations() {
  console.log('🔧 Fixing staff location assignments...')
  
  const [staff, locations] = await Promise.all([
    prisma.staffMember.findMany({ where: { status: 'ACTIVE' } }),
    prisma.location.findMany({ where: { isActive: true } })
  ])
  
  console.log(`Found ${staff.length} staff members and ${locations.length} locations`)
  
  let created = 0
  
  for (const staffMember of staff) {
    for (const location of locations) {
      try {
        await prisma.staffLocation.create({
          data: {
            staffId: staffMember.id,
            locationId: location.id,
            isActive: true
          }
        })
        console.log(`✅ Assigned ${staffMember.name} to ${location.name}`)
        created++
      } catch (error) {
        console.log(`⚠️ Assignment already exists: ${staffMember.name} -> ${location.name}`)
      }
    }
  }
  
  await prisma.$disconnect()
  console.log(`✅ Staff location assignments completed! Created ${created} assignments.`)
}

fixStaffLocations().catch(console.error)
