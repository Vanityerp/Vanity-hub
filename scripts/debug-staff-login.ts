import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function debugStaffLogin() {
  try {
    console.log("🔍 Debugging staff@vanityhub.com login issue...")
    
    // Check if the user exists
    const staffUser = await prisma.user.findFirst({
      where: {
        email: 'staff@vanityhub.com'
      },
      include: {
        staffProfile: true
      }
    })
    
    if (!staffUser) {
      console.log("❌ staff@vanityhub.com user not found!")
      console.log("🔧 Creating staff@vanityhub.com user...")
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('staff123', 12)
      
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          email: 'staff@vanityhub.com',
          password: hashedPassword,
          role: 'STAFF',
          isActive: true
        }
      })
      
      console.log(`✅ Created user: ${newUser.email}`)
      console.log(`✅ User ID: ${newUser.id}`)
      console.log(`✅ Role: ${newUser.role}`)
      console.log(`✅ Active: ${newUser.isActive}`)
      
      // Create staff profile
      const staffProfile = await prisma.staffMember.create({
        data: {
          userId: newUser.id,
          name: 'Staff User',
          phone: '+974 1234 5678',
          jobRole: 'stylist',
          status: 'ACTIVE',
          employeeNumber: '9200'
        }
      })
      
      console.log(`✅ Created staff profile: ${staffProfile.name}`)
      console.log(`✅ Job role: ${staffProfile.jobRole}`)
      console.log(`✅ Employee number: ${staffProfile.employeeNumber}`)
      
    } else {
      console.log("📋 Found staff@vanityhub.com user:")
      console.log(`   Email: ${staffUser.email}`)
      console.log(`   Role: ${staffUser.role}`)
      console.log(`   Active: ${staffUser.isActive}`)
      console.log(`   ID: ${staffUser.id}`)
      console.log(`   Created: ${staffUser.createdAt}`)
      console.log(`   Updated: ${staffUser.updatedAt}`)
      
      if (staffUser.staffProfile) {
        console.log("\n📋 Staff Profile:")
        console.log(`   Name: ${staffUser.staffProfile.name}`)
        console.log(`   Job Role: ${staffUser.staffProfile.jobRole}`)
        console.log(`   Status: ${staffUser.staffProfile.status}`)
        console.log(`   Employee Number: ${staffUser.staffProfile.employeeNumber || 'Not set'}`)
      } else {
        console.log("\n⚠️ No staff profile found for this user")
        console.log("🔧 Creating staff profile...")
        
        const staffProfile = await prisma.staffMember.create({
          data: {
            userId: staffUser.id,
            name: 'Staff User',
            phone: '+974 1234 5678',
            jobRole: 'stylist',
            status: 'ACTIVE',
            employeeNumber: '9200'
          }
        })
        
        console.log(`✅ Created staff profile: ${staffProfile.name}`)
      }
      
      // Check password (try to verify with common passwords)
      const commonPasswords = ['staff123', 'password', '123456', 'staff']
      let passwordFound = false
      
      for (const testPassword of commonPasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, staffUser.password)
          if (isValid) {
            console.log(`✅ Password verified: ${testPassword}`)
            passwordFound = true
            break
          }
        } catch (error) {
          // Continue to next password
        }
      }
      
      if (!passwordFound) {
        console.log("⚠️ Could not verify password with common passwords")
        console.log("🔧 Resetting password to 'staff123'...")
        
        const hashedPassword = await bcrypt.hash('staff123', 12)
        await prisma.user.update({
          where: { id: staffUser.id },
          data: { password: hashedPassword }
        })
        
        console.log("✅ Password reset to 'staff123'")
      }
      
      // Ensure user is active
      if (!staffUser.isActive) {
        console.log("🔧 Activating user account...")
        await prisma.user.update({
          where: { id: staffUser.id },
          data: { isActive: true }
        })
        console.log("✅ User account activated")
      }
    }
    
    console.log("\n🎉 Staff login debug completed!")
    console.log("📱 Login credentials:")
    console.log("   Email: staff@vanityhub.com")
    console.log("   Password: staff123")
    
  } catch (error) {
    console.error("❌ Error debugging staff login:", error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
debugStaffLogin()
