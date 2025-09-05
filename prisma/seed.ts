import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { realServiceData } from './real-services-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user (or get existing one)
  const adminPassword = await bcrypt.hash('admin123', 10)
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@vanityhub.com' }
  })

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@vanityhub.com',
        password: adminPassword,
        role: 'ADMIN',
      },
    })
    console.log('✅ Created admin user')
  } else {
    console.log('ℹ️ Admin user already exists')
  }

  // Create the 5 specific locations
  console.log('🏢 Creating 5 salon locations...')

  const dRingLocation = await prisma.location.create({
    data: {
      name: 'D-ring road',
      address: 'D-Ring Road, Doha',
      city: 'Doha',
      state: 'Doha',
      zipCode: '12345',
      country: 'Qatar',
      phone: '+974 1234 5678',
      email: 'dring@vanityhub.com',
    },
  })

  const muaitherLocation = await prisma.location.create({
    data: {
      name: 'Muaither',
      address: 'Muaither, Doha',
      city: 'Doha',
      state: 'Doha',
      zipCode: '12346',
      country: 'Qatar',
      phone: '+974 1234 5679',
      email: 'muaither@vanityhub.com',
    },
  })

  const medinatKhalifaLocation = await prisma.location.create({
    data: {
      name: 'Medinat Khalifa',
      address: 'Medinat Khalifa, Doha',
      city: 'Doha',
      state: 'Doha',
      zipCode: '12347',
      country: 'Qatar',
      phone: '+974 1234 5680',
      email: 'medinat@vanityhub.com',
    },
  })

  const homeServiceLocation = await prisma.location.create({
    data: {
      name: 'Home service',
      address: 'Mobile Service - Doha Area',
      city: 'Doha',
      state: 'Doha',
      zipCode: '00000',
      country: 'Qatar',
      phone: '+974 1234 5681',
      email: 'homeservice@vanityhub.com',
    },
  })

  const onlineStoreLocation = await prisma.location.create({
    data: {
      name: 'Online store',
      address: 'E-commerce Platform',
      city: 'Doha',
      state: 'Doha',
      zipCode: '00001',
      country: 'Qatar',
      phone: '+974 1234 5682',
      email: 'online@vanityhub.com',
    },
  })

  const locations = [dRingLocation, muaitherLocation, medinatKhalifaLocation, homeServiceLocation, onlineStoreLocation]

  // Create real salon services
  console.log(`🌱 Creating ${realServiceData.length} real salon services...`)
  const services = []

  for (const serviceData of realServiceData) {
    const service = await prisma.service.create({
      data: {
        name: serviceData.name,
        description: `Professional ${serviceData.name.toLowerCase()} service`,
        duration: serviceData.duration,
        price: serviceData.price,
        category: serviceData.category,
        isActive: true,
        showPricesToClients: true,
      },
    })
    services.push(service)
  }

  // Associate all services with all physical locations (except Online store which is for products only)
  console.log('🔗 Associating services with locations...')
  for (const service of services) {
    // Associate with physical locations (not online store)
    for (const location of locations.slice(0, 4)) { // First 4 locations (excluding online store)
      await prisma.locationService.create({
        data: {
          locationId: location.id,
          serviceId: service.id,
          price: service.price, // Use same price for all locations
          isActive: true,
        },
      })
    }
  }

  // Create 20 staff members with comprehensive HR data
  console.log('👥 Creating 20 staff members...')

  const staffData = [
    { name: 'Mekdes Abebe', email: 'mekdes@vanityhub.com', role: 'Stylist', empNo: 'VH001', qid: '28901234567', passport: 'ET1234567', locations: [0, 1] },
    { name: 'Woyni Tade', email: 'woyni@vanityhub.com', role: 'Nail Artist', empNo: 'VH002', qid: '28902345678', passport: 'ET2345678', locations: [0, 2] },
    { name: 'Maria Santos', email: 'maria@vanityhub.com', role: 'Beautician', empNo: 'VH003', qid: '28903456789', passport: 'PH3456789', locations: [1, 2] },
    { name: 'Fatima Al-Zahra', email: 'fatima@vanityhub.com', role: 'Nail technician', empNo: 'VH004', qid: '28904567890', passport: 'QA4567890', locations: [0, 1, 2] },
    { name: 'Jane Mussa', email: 'jane@vanityhub.com', role: 'Stylist', empNo: 'VH005', qid: '28905678901', passport: 'ET5678901', locations: [1, 2, 3] },
    { name: 'Aisha Hassan', email: 'aisha@vanityhub.com', role: 'Beautician', empNo: 'VH006', qid: '28906789012', passport: 'SO6789012', locations: [0, 3] },
    { name: 'Aster Bekele', email: 'aster@vanityhub.com', role: 'Nail Artist', empNo: 'VH007', qid: '28907890123', passport: 'ET7890123', locations: [2, 3] },
    { name: 'Priya Sharma', email: 'priya@vanityhub.com', role: 'Stylist', empNo: 'VH008', qid: '28908901234', passport: 'IN8901234', locations: [0, 1] },
    { name: 'Lina Abdullah', email: 'lina@vanityhub.com', role: 'Beautician', empNo: 'VH009', qid: '28909012345', passport: 'LB9012345', locations: [1, 2] },
    { name: 'Zara Ahmed', email: 'zara@vanityhub.com', role: 'Nail technician', empNo: 'VH010', qid: '28910123456', passport: 'PK0123456', locations: [0, 2, 3] },
    { name: 'Hanan Khalil', email: 'hanan@vanityhub.com', role: 'Stylist', empNo: 'VH011', qid: '28911234567', passport: 'EG1234567', locations: [1, 3] },
    { name: 'Nour Mansour', email: 'nour@vanityhub.com', role: 'Beautician', empNo: 'VH012', qid: '28912345678', passport: 'SY2345678', locations: [0, 2] },
    { name: 'Reem Al-Rashid', email: 'reem@vanityhub.com', role: 'Nail Artist', empNo: 'VH013', qid: '28913456789', passport: 'QA3456789', locations: [1, 2, 3] },
    { name: 'Yasmin Farouk', email: 'yasmin@vanityhub.com', role: 'Stylist', empNo: 'VH014', qid: '28914567890', passport: 'EG4567890', locations: [0, 1, 3] },
    { name: 'Amira Saleh', email: 'amira@vanityhub.com', role: 'Beautician', empNo: 'VH015', qid: '28915678901', passport: 'JO5678901', locations: [2, 3] },
    { name: 'Layla Mahmoud', email: 'layla@vanityhub.com', role: 'Nail technician', empNo: 'VH016', qid: '28916789012', passport: 'LB6789012', locations: [0, 1] },
    { name: 'Dina Habib', email: 'dina@vanityhub.com', role: 'Stylist', empNo: 'VH017', qid: '28917890123', passport: 'EG7890123', locations: [1, 2] },
    { name: 'Sara Al-Zahra', email: 'sara@vanityhub.com', role: 'Beautician', empNo: 'VH018', qid: '28918901234', passport: 'QA8901234', locations: [0, 2, 3] },
    { name: 'Mona Kassem', email: 'mona@vanityhub.com', role: 'Nail Artist', empNo: 'VH019', qid: '28919012345', passport: 'SY9012345', locations: [1, 3] },
    { name: 'Rana Othman', email: 'rana@vanityhub.com', role: 'Stylist', empNo: 'VH020', qid: '28920123456', passport: 'JO0123456', locations: [0, 1, 2] }
  ]

  const staffMembers = []
  const staffPassword = await bcrypt.hash('staff123', 10)

  for (let i = 0; i < staffData.length; i++) {
    const staff = staffData[i]

    // Create user account (or get existing one)
    let staffUser = await prisma.user.findUnique({
      where: { email: staff.email }
    })

    if (!staffUser) {
      staffUser = await prisma.user.create({
        data: {
          email: staff.email,
          password: staffPassword,
          role: 'STAFF',
        },
      })
    }

    // Create staff member with HR data
    const staffMember = await prisma.staffMember.create({
      data: {
        userId: staffUser.id,
        name: staff.name,
        phone: `+974 1234 ${5680 + i}`,
        jobRole: staff.role,
        employeeNumber: staff.empNo,
        qidNumber: staff.qid,
        passportNumber: staff.passport,
        qidValidity: '12-25-26', // Sample validity date
        passportValidity: '06-30-27', // Sample validity date
        medicalValidity: '03-15-26', // Sample validity date
        color: `hsl(${(i * 137.5) % 360}, 70%, 50%)`, // Generate unique colors
        homeService: staff.locations.includes(3), // Home service if assigned to location index 3
        status: 'ACTIVE',
        dateOfBirth: new Date(1985 + (i % 15), (i % 12), (i % 28) + 1), // Sample birth dates
      },
    })

    staffMembers.push({ member: staffMember, locationIndices: staff.locations })
  }

  // Create client users
  const client1Password = await bcrypt.hash('client123', 10)
  const client1User = await prisma.user.create({
    data: {
      email: 'client1@example.com',
      password: client1Password,
      role: 'CLIENT',
    },
  })

  const client1 = await prisma.client.create({
    data: {
      userId: client1User.id,
      name: 'Emma Wilson',
      phone: '+974 1234 5682',
      preferences: 'Prefers morning appointments',
    },
  })

  const client2Password = await bcrypt.hash('client123', 10)
  const client2User = await prisma.user.create({
    data: {
      email: 'client2@example.com',
      password: client2Password,
      role: 'CLIENT',
    },
  })

  const client2 = await prisma.client.create({
    data: {
      userId: client2User.id,
      name: 'Fatima Al-Rashid',
      phone: '+974 1234 5683',
      preferences: 'Allergic to certain hair products',
    },
  })

  // Link staff to locations
  console.log('🔗 Linking staff to locations...')
  for (const staffInfo of staffMembers) {
    for (const locationIndex of staffInfo.locationIndices) {
      await prisma.staffLocation.create({
        data: {
          staffId: staffInfo.member.id,
          locationId: locations[locationIndex].id,
        },
      })
    }
  }

  // Services are already linked to locations above, so skip this duplicate step

  // Link staff to services based on their roles
  console.log('🔗 Linking staff to services based on roles...')
  for (const staffInfo of staffMembers) {
    const role = staffData.find(s => s.name === staffInfo.member.name)?.role

    // Assign services based on role
    const serviceAssignments = []

    if (role === 'Stylist') {
      // Stylists get hair services
      const hairServices = services.filter(s =>
        s.category === 'Braiding' ||
        s.category === 'Hair Extension' ||
        s.category === 'Styling' ||
        s.category === 'Hair Treatment' ||
        s.category === 'Color'
      )
      serviceAssignments.push(...hairServices.slice(0, 10)) // Limit to 10 services per stylist
    } else if (role === 'Nail Artist' || role === 'Nail technician') {
      // Nail specialists get nail services
      const nailServices = services.filter(s => s.category === 'Nail')
      serviceAssignments.push(...nailServices)
    } else if (role === 'Beautician') {
      // Beauticians get beauty services
      const beautyServices = services.filter(s =>
        s.category === 'Eyelash' ||
        s.category === 'Threading' ||
        s.category === 'Waxing' ||
        s.category === 'Henna' ||
        s.category === 'Massage And Spa'
      )
      serviceAssignments.push(...beautyServices.slice(0, 8)) // Limit to 8 services per beautician
    }

    // Create staff-service associations
    for (const service of serviceAssignments) {
      await prisma.staffService.create({
        data: {
          staffId: staffInfo.member.id,
          serviceId: service.id,
        },
      })
    }
  }

  // Create sample appointments
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const appointment1 = await prisma.appointment.create({
    data: {
      bookingReference: 'VH-001',
      clientId: client1User.id,
      staffId: staffMembers[0].member.id, // First staff member
      locationId: locations[0].id, // D-ring road location
      date: tomorrow,
      duration: 60,
      totalPrice: 150,
      status: 'CONFIRMED',
      notes: 'First time client',
    },
  })

  await prisma.appointmentService.create({
    data: {
      appointmentId: appointment1.id,
      serviceId: services[0].id,
      price: 150,
      duration: 60,
    },
  })

  // Create loyalty programs
  await Promise.all([
    prisma.loyaltyProgram.create({
      data: {
        clientId: client1.id,
        points: 150,
        tier: 'Silver',
        totalSpent: 450,
      },
    }),
    prisma.loyaltyProgram.create({
      data: {
        clientId: client2.id,
        points: 80,
        tier: 'Bronze',
        totalSpent: 240,
      },
    }),
  ])

  console.log('✅ Database seeding completed successfully!')
  console.log('📊 Created:')
  console.log('  - 23 users (1 admin, 20 staff, 2 clients)')
  console.log('  - 5 locations (D-ring road, Muaither, Medinat Khalifa, Home service, Online store)')
  console.log(`  - ${realServiceData.length} real salon services`)
  console.log(`  - ${realServiceData.length * 4} location-service associations (excluding online store)`)
  console.log('  - 20 staff members with comprehensive HR data')
  console.log('  - 1 sample appointment')
  console.log('  - 2 loyalty programs')

  // Count services by category
  const categoryCount = realServiceData.reduce((acc, service) => {
    acc[service.category] = (acc[service.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('📋 Services by category:')
  Object.entries(categoryCount).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count} services`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
