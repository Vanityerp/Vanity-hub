import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { AppointmentStatus } from '@/lib/types/enums'

export type AppointmentWithDetails = Prisma.AppointmentGetPayload<{
  include: {
    client: {
      include: {
        clientProfile: true
      }
    }
    staff: true
    location: true
    services: {
      include: {
        service: true
      }
    }
    products: {
      include: {
        product: true
      }
    }
  }
}>

export async function getAppointments(filters?: {
  status?: AppointmentStatus
  staffId?: string
  locationId?: string
  date?: Date
  dateRange?: { start: Date; end: Date }
}) {
  const where: Prisma.AppointmentWhereInput = {}

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.staffId) {
    where.staffId = filters.staffId
  }

  if (filters?.locationId) {
    where.locationId = filters.locationId
  }

  if (filters?.date) {
    const startOfDay = new Date(filters.date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(filters.date)
    endOfDay.setHours(23, 59, 59, 999)

    where.date = {
      gte: startOfDay,
      lte: endOfDay,
    }
  }

  if (filters?.dateRange) {
    where.date = {
      gte: filters.dateRange.start,
      lte: filters.dateRange.end,
    }
  }

  return await prisma.appointment.findMany({
    where,
    include: {
      client: {
        include: {
          clientProfile: true
        }
      },
      staff: true,
      location: true,
      services: {
        include: {
          service: true
        }
      },
      products: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      date: 'asc'
    }
  })
}

export async function getAppointmentById(id: string) {
  return await prisma.appointment.findUnique({
    where: { id },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      },
      staff: true,
      location: true,
      services: {
        include: {
          service: true
        }
      },
      products: {
        include: {
          product: true
        }
      }
    }
  })
}

export async function createAppointment(data: {
  clientId: string
  staffId: string
  locationId: string
  date: Date
  serviceIds: string[]
  notes?: string
}) {
  // Get services to calculate total price and duration
  const services = await prisma.service.findMany({
    where: {
      id: {
        in: data.serviceIds
      }
    }
  })

  const totalPrice = services.reduce((sum, service) => sum + Number(service.price), 0)
  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0)

  // Generate booking reference
  const bookingReference = `VH-${Date.now().toString().slice(-6)}`

  return await prisma.appointment.create({
    data: {
      bookingReference,
      clientId: data.clientId,
      staffId: data.staffId,
      locationId: data.locationId,
      date: data.date,
      duration: totalDuration,
      totalPrice,
      notes: data.notes,
      services: {
        create: services.map(service => ({
          serviceId: service.id,
          price: service.price,
          duration: service.duration,
        }))
      }
    },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      },
      staff: true,
      location: true,
      services: {
        include: {
          service: true
        }
      }
    }
  })
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  return await prisma.appointment.update({
    where: { id },
    data: { status },
    include: {
      client: {
        include: {
          clientProfile: true
        }
      },
      staff: true,
      location: true,
      services: {
        include: {
          service: true
        }
      }
    }
  })
}

export async function deleteAppointment(id: string) {
  return await prisma.appointment.delete({
    where: { id }
  })
}

export async function getAppointmentStats(filters?: {
  locationId?: string
  dateRange?: { start: Date; end: Date }
}) {
  const where: Prisma.AppointmentWhereInput = {}

  if (filters?.locationId) {
    where.locationId = filters.locationId
  }

  if (filters?.dateRange) {
    where.date = {
      gte: filters.dateRange.start,
      lte: filters.dateRange.end,
    }
  }

  const [total, confirmed, completed, cancelled] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CONFIRMED } }),
    prisma.appointment.count({ where: { ...where, status: AppointmentStatus.COMPLETED } }),
    prisma.appointment.count({ where: { ...where, status: AppointmentStatus.CANCELLED } }),
  ])

  return {
    total,
    confirmed,
    completed,
    cancelled,
    pending: total - confirmed - completed - cancelled,
  }
}
