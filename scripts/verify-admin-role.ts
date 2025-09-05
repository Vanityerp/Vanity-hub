import { prisma } from '../lib/prisma'

async function verifyAdminRole() {
  try {
    console.log("🔍 Verifying admin@vanityhub.com user role...")
    
    // Get the admin@vanityhub.com user with staff profile
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@vanityhub.com'
      },
      include: {
        staffProfile: true
      }
    })
    
    if (!adminUser) {
      console.log("❌ admin@vanityhub.com user not found!")
      return
    }
    
    console.log("📋 User Details:")
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log(`   Status: ${adminUser.isActive ? 'Active' : 'Inactive'}`)
    console.log(`   Created: ${adminUser.createdAt}`)
    console.log(`   Updated: ${adminUser.updatedAt}`)
    
    if (adminUser.staffProfile) {
      console.log("\n📋 Staff Profile Details:")
      console.log(`   Name: ${adminUser.staffProfile.name}`)
      console.log(`   Job Role: ${adminUser.staffProfile.jobRole}`)
      console.log(`   Status: ${adminUser.staffProfile.status}`)
      console.log(`   Employee Number: ${adminUser.staffProfile.employeeNumber || 'Not set'}`)
    } else {
      console.log("\n⚠️ No staff profile found for this user")
    }
    
    // Verify admin permissions
    if (adminUser.role === 'ADMIN') {
      console.log("\n✅ VERIFICATION PASSED: User has ADMIN role")
    } else {
      console.log(`\n❌ VERIFICATION FAILED: User role is ${adminUser.role}, expected ADMIN`)
    }
    
    if (adminUser.isActive) {
      console.log("✅ VERIFICATION PASSED: User account is active")
    } else {
      console.log("❌ VERIFICATION FAILED: User account is inactive")
    }
    
    console.log("\n🎉 Verification completed!")
    
  } catch (error) {
    console.error("❌ Error verifying admin role:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
verifyAdminRole()
