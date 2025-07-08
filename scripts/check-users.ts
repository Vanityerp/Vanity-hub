import { prisma } from '../lib/prisma'

async function checkUsers() {
  try {
    console.log("🔍 Checking users in database...")
    
    const users = await prisma.user.findMany({
      orderBy: {
        email: 'asc'
      }
    })
    
    console.log(`📊 Total users in database: ${users.length}`)
    
    if (users.length > 0) {
      console.log("\n👥 Users found:")
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (${user.id})`)
        console.log(`     Name: ${user.name}`)
        console.log(`     Role: ${user.role}`)
        console.log(`     Locations: ${JSON.stringify(user.locations)}`)
        console.log(`     Active: ${user.isActive}`)
        console.log(`     Created: ${user.createdAt}`)
        console.log("")
      })
    } else {
      console.log("❌ No users found in database!")
      console.log("💡 You may need to create an admin user.")
    }
    
  } catch (error) {
    console.error("❌ Error checking users:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
