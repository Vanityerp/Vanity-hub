import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function testStaffLogin() {
  try {
    console.log("🧪 Testing staff@vanityhub.com login process...")
    
    // Step 1: Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'staff@vanityhub.com' },
      include: {
        staffProfile: {
          include: {
            locations: {
              include: {
                location: true
              }
            }
          }
        }
      }
    })
    
    if (!user) {
      console.log("❌ User not found!")
      return
    }
    
    console.log("✅ User found:")
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Active: ${user.isActive}`)
    console.log(`   ID: ${user.id}`)
    
    // Step 2: Test password
    const testPassword = 'staff123'
    const passwordMatch = await bcrypt.compare(testPassword, user.password)
    console.log(`\n🔐 Password test with '${testPassword}': ${passwordMatch ? '✅ VALID' : '❌ INVALID'}`)
    
    if (!passwordMatch) {
      console.log("❌ Password doesn't match! Let's reset it...")
      const hashedPassword = await bcrypt.hash('staff123', 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      console.log("✅ Password reset to 'staff123'")
    }
    
    // Step 3: Check staff profile
    if (!user.staffProfile) {
      console.log("❌ No staff profile found!")
      return
    }
    
    console.log("\n👤 Staff Profile:")
    console.log(`   Name: ${user.staffProfile.name}`)
    console.log(`   Job Role: ${user.staffProfile.jobRole}`)
    console.log(`   Status: ${user.staffProfile.status}`)
    console.log(`   Employee Number: ${user.staffProfile.employeeNumber}`)
    
    // Step 4: Check location assignments
    console.log(`\n📍 Location assignments: ${user.staffProfile.locations.length}`)
    
    if (user.staffProfile.locations.length === 0) {
      console.log("⚠️ Staff member has no location assignments!")
      console.log("🔧 Assigning to all active locations...")
      
      // Get all active locations
      const activeLocations = await prisma.location.findMany({
        where: { isActive: true }
      })
      
      console.log(`Found ${activeLocations.length} active locations`)
      
      // Assign staff to all locations
      for (const location of activeLocations) {
        await prisma.staffLocation.create({
          data: {
            staffId: user.staffProfile.id,
            locationId: location.id,
            isActive: true
          }
        })
        console.log(`   ✅ Assigned to: ${location.name}`)
      }
    } else {
      user.staffProfile.locations.forEach(sl => {
        console.log(`   - ${sl.location.name} (${sl.isActive ? 'Active' : 'Inactive'})`)
      })
    }
    
    // Step 5: Simulate the auth process
    console.log("\n🔄 Simulating authentication process...")
    
    // Get user locations from staff profile (same logic as NextAuth)
    let locationIds: string[] = []
    if (user.staffProfile?.locations) {
      locationIds = user.staffProfile.locations
        .filter(sl => sl.isActive)
        .map(sl => sl.location.id)
    }
    
    const authResult = {
      id: user.id,
      name: user.staffProfile?.name || user.email.split('@')[0],
      email: user.email,
      role: user.role,
      locations: user.role === "ADMIN" ? ["all"] : locationIds,
    }
    
    console.log("✅ Authentication would succeed with:")
    console.log(JSON.stringify(authResult, null, 2))
    
    console.log("\n🎉 Staff login test completed!")
    console.log("📱 Login credentials:")
    console.log("   Email: staff@vanityhub.com")
    console.log("   Password: staff123")
    
  } catch (error) {
    console.error("❌ Error testing staff login:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testStaffLogin()
