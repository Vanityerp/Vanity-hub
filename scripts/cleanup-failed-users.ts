#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function cleanupFailedUsers() {
  console.log('🧹 Cleaning up failed user accounts...')

  try {
    // Find users with STAFF role that don't have corresponding staff members
    const orphanedUsers = await prisma.user.findMany({
      where: {
        role: 'STAFF',
        staffProfile: null
      }
    })

    console.log(`Found ${orphanedUsers.length} orphaned user accounts`)

    // Delete orphaned users
    for (const user of orphanedUsers) {
      await prisma.user.delete({
        where: { id: user.id }
      })
      console.log(`   ✅ Deleted orphaned user: ${user.email}`)
    }

    console.log('✅ Cleanup completed!')

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupFailedUsers().catch(console.error)
