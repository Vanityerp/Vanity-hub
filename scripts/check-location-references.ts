#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'

async function checkLocationReferences() {
  console.log('🔍 Checking what references old location IDs...')

  try {
    // Define the old location IDs we want to remove
    const oldLocationIds = [
      'cmbupu3c100016n5m1xj4fth6', // D-ring road
      'cmbupu3ek00026n5mjjdhy6ax', // Muaither
      'cmbupu3ge00036n5mnchbjgc3', // Medinat Khalifa
      'cmbupu3iq00046n5mmzsbpctb', // Home service
      'cmbupu3m700056n5msbzny08g'  // Online store
    ]

    console.log('🎯 Checking references for old location IDs:')
    oldLocationIds.forEach(id => console.log(`   - ${id}`))

    // 1. Check ProductLocation table
    const productLocations = await prisma.productLocation.findMany({
      where: { locationId: { in: oldLocationIds } },
      include: {
        product: { select: { name: true } },
        location: { select: { name: true } }
      }
    })

    console.log(`\n📦 ProductLocation references: ${productLocations.length}`)
    if (productLocations.length > 0) {
      productLocations.forEach(pl => {
        console.log(`   - Product: ${pl.product.name}, Location: ${pl.location.name} (${pl.locationId}), Stock: ${pl.stock}`)
      })
    }

    // 2. Check if there are any other tables that might reference locations
    // Let's check the schema to see what other tables have location references

    // Check for any appointments
    const appointments = await prisma.appointment.findMany({
      where: { locationId: { in: oldLocationIds } },
      select: { id: true, locationId: true, clientId: true }
    })

    console.log(`\n📅 Appointment references: ${appointments.length}`)
    if (appointments.length > 0) {
      appointments.slice(0, 5).forEach(apt => {
        console.log(`   - Appointment: ${apt.id}, Client: ${apt.clientId}, Location: ${apt.locationId}`)
      })
      if (appointments.length > 5) {
        console.log(`   ... and ${appointments.length - 5} more`)
      }
    }

    // Check for any transactions
    const transactions = await prisma.transaction.findMany({
      where: { locationId: { in: oldLocationIds } },
      select: { id: true, locationId: true, userId: true, amount: true }
    })

    console.log(`\n💰 Transaction references: ${transactions.length}`)
    if (transactions.length > 0) {
      transactions.slice(0, 5).forEach(tx => {
        console.log(`   - Transaction: ${tx.id}, User: ${tx.userId}, Location: ${tx.locationId}, Amount: ${tx.amount}`)
      })
      if (transactions.length > 5) {
        console.log(`   ... and ${transactions.length - 5} more`)
      }
    }

    // Summary
    const totalReferences = productLocations.length + appointments.length + transactions.length
    console.log(`\n📊 SUMMARY:`)
    console.log(`   📦 ProductLocation: ${productLocations.length}`)
    console.log(`   📅 Appointments: ${appointments.length}`)
    console.log(`   💰 Transactions: ${transactions.length}`)
    console.log(`   🔢 Total references: ${totalReferences}`)

    if (totalReferences === 0) {
      console.log(`\n✅ No references found! Old locations can be safely deleted.`)
    } else {
      console.log(`\n⚠️ Found ${totalReferences} references that need to be cleaned up first.`)
    }

  } catch (error) {
    console.error('❌ Error checking location references:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
checkLocationReferences()
