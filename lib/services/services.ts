import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export type ServiceWithDetails = Prisma.ServiceGetPayload<{
  include: {
    locations: {
      include: {
        location: true
      }
    }
    staff: {
      include: {
        staff: true
      }
    }
    appointments: {
      include: {
        appointment: {
          include: {
            client: {
              include: {
                clientProfile: true
              }
            }
          }
        }
      }
    }
  }
}>

export async function getServices(filters?: {
  category?: string
  locationId?: string
  staffId?: string
  isActive?: boolean
}) {
  const where: Prisma.ServiceWhereInput = {}

  if (filters?.category) {
    where.category = filters.category
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  if (filters?.locationId) {
    where.locations = {
      some: {
        locationId: filters.locationId,
        isActive: true
      }
    }
  }

  if (filters?.staffId) {
    where.staff = {
      some: {
        staffId: filters.staffId,
        isActive: true
      }
    }
  }

  return await prisma.service.findMany({
    where,
    include: {
      locations: {
        include: {
          location: true
        },
        where: {
          isActive: true
        }
      },
      staff: {
        include: {
          staff: true
        },
        where: {
          isActive: true
        }
      }
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' }
    ]
  })
}

export async function getServiceById(id: string) {
  return await prisma.service.findUnique({
    where: { id },
    include: {
      locations: {
        include: {
          location: true
        }
      },
      staff: {
        include: {
          staff: true
        }
      },
      appointments: {
        include: {
          appointment: {
            include: {
              client: {
                include: {
                  clientProfile: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Last 10 appointments
      }
    }
  })
}

export async function createService(data: {
  name: string
  description?: string
  duration: number
  price: number
  category: string
  locationIds?: string[]
  staffIds?: string[]
}) {
  return await prisma.service.create({
    data: {
      name: data.name,
      description: data.description,
      duration: data.duration,
      price: data.price,
      category: data.category,
      locations: data.locationIds ? {
        create: data.locationIds.map(locationId => ({
          locationId
        }))
      } : undefined,
      staff: data.staffIds ? {
        create: data.staffIds.map(staffId => ({
          staffId
        }))
      } : undefined
    },
    include: {
      locations: {
        include: {
          location: true
        }
      },
      staff: {
        include: {
          staff: true
        }
      }
    }
  })
}

export async function updateService(id: string, data: {
  name?: string
  description?: string
  duration?: number
  price?: number
  category?: string
  isActive?: boolean
}) {
  return await prisma.service.update({
    where: { id },
    data,
    include: {
      locations: {
        include: {
          location: true
        }
      },
      staff: {
        include: {
          staff: true
        }
      }
    }
  })
}

export async function deleteService(id: string) {
  return await prisma.service.delete({
    where: { id }
  })
}

export async function updateServiceLocations(serviceId: string, locationIds: string[]) {
  // Remove existing locations
  await prisma.locationService.deleteMany({
    where: { serviceId }
  })

  // Add new locations
  if (locationIds.length > 0) {
    await prisma.locationService.createMany({
      data: locationIds.map(locationId => ({
        serviceId,
        locationId
      }))
    })
  }

  return await getServiceById(serviceId)
}

export async function updateServiceStaff(serviceId: string, staffIds: string[]) {
  // Remove existing staff
  await prisma.staffService.deleteMany({
    where: { serviceId }
  })

  // Add new staff
  if (staffIds.length > 0) {
    await prisma.staffService.createMany({
      data: staffIds.map(staffId => ({
        serviceId,
        staffId
      }))
    })
  }

  return await getServiceById(serviceId)
}

export async function getServiceCategories() {
  const categories = await prisma.service.findMany({
    where: {
      isActive: true
    },
    select: {
      category: true
    },
    distinct: ['category']
  })

  return categories.map(c => c.category).sort()
}

export async function getServiceStats(filters?: {
  locationId?: string
  dateRange?: { start: Date; end: Date }
}) {
  const where: Prisma.AppointmentServiceWhereInput = {}

  if (filters?.locationId) {
    where.appointment = {
      locationId: filters.locationId
    }
  }

  if (filters?.dateRange) {
    where.appointment = {
      ...where.appointment,
      date: {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      }
    }
  }

  const serviceStats = await prisma.appointmentService.groupBy({
    by: ['serviceId'],
    where,
    _count: {
      serviceId: true
    },
    _sum: {
      price: true
    }
  })

  // Get service details
  const serviceIds = serviceStats.map(stat => stat.serviceId)
  const services = await prisma.service.findMany({
    where: {
      id: {
        in: serviceIds
      }
    }
  })

  return serviceStats.map(stat => {
    const service = services.find(s => s.id === stat.serviceId)
    return {
      service,
      bookings: stat._count.serviceId,
      revenue: Number(stat._sum.price || 0)
    }
  }).sort((a, b) => b.bookings - a.bookings)
}
