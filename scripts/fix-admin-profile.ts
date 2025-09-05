import { prisma } from '../lib/prisma'

async function fixAdminProfile() {
  try {
    console.log('🔧 Fixing admin user profile...')
    
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@vanityhub.com' },
      include: {
        staffProfile: true
      }
    })
    
    if (!adminUser) {
      console.log('❌ Admin user not found!')
      return
    }
    
    console.log('✅ Admin user found:')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Role: ${adminUser.role}`)
    console.log(`   ID: ${adminUser.id}`)
    
    // Check if staff profile exists
    if (adminUser.staffProfile) {
      console.log('✅ Staff profile already exists:')
      console.log(`   Name: ${adminUser.staffProfile.name}`)
      console.log(`   Job Role: ${adminUser.staffProfile.jobRole}`)
      console.log(`   Status: ${adminUser.staffProfile.status}`)
    } else {
      console.log('❌ No staff profile found. Creating one...')
      
      // Create staff profile for admin
      const staffProfile = await prisma.staffMember.create({
        data: {
          userId: adminUser.id,
          name: 'Admin User',
          phone: '+974 1234 5678',
          jobRole: 'super_admin',
          status: 'ACTIVE',
          employeeNumber: 'ADMIN001'
        }
      })
      
      console.log('✅ Staff profile created:')
      console.log(`   Name: ${staffProfile.name}`)
      console.log(`   Job Role: ${staffProfile.jobRole}`)
      console.log(`   Status: ${staffProfile.status}`)
      console.log(`   Employee Number: ${staffProfile.employeeNumber}`)
    }
    
    // Get all active locations
    const locations = await prisma.location.findMany({
      where: { isActive: true }
    })
    
    console.log(`\n📍 Found ${locations.length} active locations`)
    
    // Check if admin is assigned to locations
    if (adminUser.staffProfile) {
      const existingAssignments = await prisma.staffLocation.findMany({
        where: {
          staffId: adminUser.staffProfile.id,
          isActive: true
        },
        include: {
          location: true
        }
      })
      
      if (existingAssignments.length === 0) {
        console.log('🔧 Assigning admin to all locations...')
        
        // Assign admin to all locations
        for (const location of locations) {
          await prisma.staffLocation.create({
            data: {
              staffId: adminUser.staffProfile.id,
              locationId: location.id,
              isActive: true
            }
          })
          console.log(`   ✅ Assigned to: ${location.name}`)
        }
      } else {
        console.log('✅ Admin already assigned to locations:')
        existingAssignments.forEach(assignment => {
          console.log(`   - ${assignment.location.name}`)
        })
      }
    } else {
      console.log('⚠️ Cannot assign locations - no staff profile found')
    }
    
    console.log('\n🎉 Admin profile fix completed!')
    console.log('📱 Login credentials:')
    console.log('   Email: admin@vanityhub.com')
    console.log('   Password: admin123')
    console.log('\n✅ Admin should now be able to login successfully!')
    
  } catch (error) {
    console.error('❌ Error fixing admin profile:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAdminProfile() 