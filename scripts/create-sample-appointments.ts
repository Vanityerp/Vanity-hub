import { prisma } from '../lib/prisma'

async function createSampleAppointments() {
  try {
    console.log("🔄 Creating sample appointments...")
    
    // Get staff and locations
    const staff = await prisma.staffMember.findMany({
      include: {
        user: true
      }
    })
    
    const locations = await prisma.location.findMany({
      where: {
        isActive: true
      }
    })
    
    const services = await prisma.service.findMany({
      where: {
        isActive: true
      }
    })
    
    console.log(`📊 Found ${staff.length} staff, ${locations.length} locations, ${services.length} services`)
    
    if (staff.length === 0 || locations.length === 0 || services.length === 0) {
      console.log("❌ Need staff, locations, and services to create appointments")
      return
    }
    
    // Create some sample appointments for today and tomorrow
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const sampleAppointments = [
      {
        clientName: "John Smith",
        clientEmail: "john.smith@email.com",
        clientPhone: "(974) 111-2222",
        date: today.toISOString().split('T')[0],
        time: "10:00",
        duration: 60,
        staffId: staff[0].id,
        locationId: locations[0].id,
        serviceId: services[0].id,
        status: "CONFIRMED",
        notes: "Regular customer"
      },
      {
        clientName: "Sarah Wilson",
        clientEmail: "sarah.wilson@email.com", 
        clientPhone: "(974) 333-4444",
        date: today.toISOString().split('T')[0],
        time: "14:00",
        duration: 90,
        staffId: staff[1] ? staff[1].id : staff[0].id,
        locationId: locations[1] ? locations[1].id : locations[0].id,
        serviceId: services[1] ? services[1].id : services[0].id,
        status: "CONFIRMED",
        notes: "First time client"
      },
      {
        clientName: "Ahmed Hassan",
        clientEmail: "ahmed.hassan@email.com",
        clientPhone: "(974) 555-6666", 
        date: tomorrow.toISOString().split('T')[0],
        time: "11:30",
        duration: 45,
        staffId: staff[2] ? staff[2].id : staff[0].id,
        locationId: locations[2] ? locations[2].id : locations[0].id,
        serviceId: services[2] ? services[2].id : services[0].id,
        status: "PENDING",
        notes: "Needs confirmation"
      }
    ]
    
    for (const appointment of sampleAppointments) {
      try {
        const bookingRef = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

        const created = await prisma.appointment.create({
          data: {
            bookingReference: bookingRef,
            clientName: appointment.clientName,
            clientEmail: appointment.clientEmail,
            clientPhone: appointment.clientPhone,
            date: new Date(appointment.date + 'T' + appointment.time + ':00'),
            duration: appointment.duration,
            staffId: appointment.staffId,
            locationId: appointment.locationId,
            status: appointment.status,
            notes: appointment.notes,
            totalPrice: 0, // Will be calculated based on services
            services: {
              create: {
                serviceId: appointment.serviceId,
                price: 50.00 // Default price
              }
            }
          }
        })
        
        console.log(`✅ Created appointment for ${appointment.clientName}`)
      } catch (error) {
        console.error(`❌ Failed to create appointment for ${appointment.clientName}:`, error)
      }
    }
    
    console.log("✅ Sample appointments created")
    
  } catch (error) {
    console.error("❌ Error creating sample appointments:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleAppointments()
