import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user...')

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@vanityhub.com' }
    })

    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists')
      console.log('📧 Email:', existingAdmin.email)
      console.log('🔑 Password: admin123')
      return
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@vanityhub.com',
        password: adminPassword,
        role: 'ADMIN',
        isActive: true
      }
    })

    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@vanityhub.com')
    console.log('🔑 Password: admin123')
    console.log('👤 User ID:', admin.id)

    // Create a test staff user
    const staffPassword = await bcrypt.hash('staff123', 10)
    const staff = await prisma.user.create({
      data: {
        email: 'staff@vanityhub.com',
        password: staffPassword,
        role: 'STAFF',
        isActive: true
      }
    })

    console.log('✅ Staff user created successfully!')
    console.log('📧 Email: staff@vanityhub.com')
    console.log('🔑 Password: staff123')
    console.log('👤 User ID:', staff.id)

  } catch (error) {
    console.error('❌ Error creating users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
