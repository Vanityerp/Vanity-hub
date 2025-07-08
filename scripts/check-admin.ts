import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    console.log('🔍 Checking database connection...')
    
    // Test database connection
    const userCount = await prisma.user.count()
    console.log(`📊 Total users in database: ${userCount}`)
    
    // Check admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@vanityhub.com' },
      include: {
        staffProfile: true
      }
    })
    
    if (!adminUser) {
      console.log('❌ Admin user not found!')
      
      // Create admin user
      console.log('🔄 Creating admin user...')
      const adminPassword = await bcrypt.hash('admin123', 10)
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@vanityhub.com',
          password: adminPassword,
          role: 'ADMIN',
          isActive: true
        }
      })
      console.log('✅ Admin user created:', newAdmin.id)
      return
    }
    
    console.log('✅ Admin user found!')
    console.log('📧 Email:', adminUser.email)
    console.log('🔑 Role:', adminUser.role)
    console.log('✅ Active:', adminUser.isActive)
    console.log('👤 ID:', adminUser.id)
    
    // Test password
    const passwordTest = await bcrypt.compare('admin123', adminUser.password)
    console.log('🔐 Password test (admin123):', passwordTest ? '✅ CORRECT' : '❌ INCORRECT')
    
    if (!passwordTest) {
      console.log('🔄 Updating admin password...')
      const newPassword = await bcrypt.hash('admin123', 10)
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { password: newPassword }
      })
      console.log('✅ Password updated!')
    }
    
    // Check if user is active
    if (!adminUser.isActive) {
      console.log('🔄 Activating admin user...')
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { isActive: true }
      })
      console.log('✅ Admin user activated!')
    }
    
    console.log('\n🎯 Login credentials:')
    console.log('Email: admin@vanityhub.com')
    console.log('Password: admin123')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
