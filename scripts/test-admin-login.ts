import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login functionality...')
    
    // Test 1: Check if admin user exists
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
    console.log(`   Active: ${adminUser.isActive}`)
    console.log(`   ID: ${adminUser.id}`)
    
    // Test 2: Verify password
    const passwordTest = await bcrypt.compare('admin123', adminUser.password)
    console.log(`\n🔐 Password test (admin123): ${passwordTest ? '✅ CORRECT' : '❌ INCORRECT'}`)
    
    if (!passwordTest) {
      console.log('❌ Password is incorrect!')
      return
    }
    
    // Test 3: Check if user is active
    if (!adminUser.isActive) {
      console.log('❌ User account is inactive!')
      return
    }
    
    // Test 4: Check staff profile
    if (adminUser.staffProfile) {
      console.log('\n👤 Staff Profile:')
      console.log(`   Name: ${adminUser.staffProfile.name}`)
      console.log(`   Job Role: ${adminUser.staffProfile.jobRole}`)
      console.log(`   Status: ${adminUser.staffProfile.status}`)
    } else {
      console.log('\n⚠️ No staff profile found')
    }
    
    // Test 5: Simulate authentication success
    console.log('\n🎉 Login simulation successful!')
    console.log('📋 Authentication would return:')
    console.log(JSON.stringify({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      name: adminUser.staffProfile?.name || 'Admin User',
      isActive: adminUser.isActive
    }, null, 2))
    
    console.log('\n🎯 Login credentials:')
    console.log('Email: admin@vanityhub.com')
    console.log('Password: admin123')
    console.log('\n✅ Admin login should work correctly!')
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminLogin() 