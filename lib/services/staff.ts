import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { StaffStatus } from '@/lib/types/enums'

export type StaffWithDetails = Prisma.StaffMemberGetPayload<{
  include: {
    user: true
    locations: {
      include: {
        location: true
      }
    }
    services: {
      include: {
        service: true
      }
    }
    schedule: true
    appointments: {
      include: {
        client: {
          include: {
            clientProfile: true
          }
        }
        services: {
          include: {
            service: true
          }
        }
      }
    }
  }
}>

export async function getStaffMembers(filters?: {
  status?: StaffStatus
  locationId?: string
  serviceId?: string
}) {
  const where: Prisma.StaffMemberWhereInput = {}

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.locationId) {
    where.locations = {
      some: {
        locationId: filters.locationId,
        isActive: true
      }
    }
  }

  if (filters?.serviceId) {
    where.services = {
      some: {
        serviceId: filters.serviceId,
        isActive: true
      }
    }
  }

  return await prisma.staffMember.findMany({
    where,
    include: {
      user: true,
      locations: {
        include: {
          location: true
        },
        where: {
          isActive: true
        }
      },
      services: {
        include: {
          service: true
        },
        where: {
          isActive: true
        }
      },
      schedule: {
        where: {
          isActive: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getStaffMemberById(id: string) {
  return await prisma.staffMember.findUnique({
    where: { id },
    include: {
      user: true,
      locations: {
        include: {
          location: true
        }
      },
      services: {
        include: {
          service: true
        }
      },
      schedule: true,
      appointments: {
        include: {
          client: {
            include: {
              clientProfile: true
            }
          },
          services: {
            include: {
              service: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 10 // Last 10 appointments
      }
    }
  })
}

export async function createStaffMember(data: {
  userId: string
  name: string
  phone?: string
  avatar?: string
  color?: string
  homeService?: boolean
  locationIds?: string[]
  serviceIds?: string[]
}) {
  return await prisma.staffMember.create({
    data: {
      userId: data.userId,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
      color: data.color,
      homeService: data.homeService || false,
      locations: data.locationIds ? {
        create: data.locationIds.map(locationId => ({
          locationId
        }))
      } : undefined,
      services: data.serviceIds ? {
        create: data.serviceIds.map(serviceId => ({
          serviceId
        }))
      } : undefined
    },
    include: {
      user: true,
      locations: {
        include: {
          location: true
        }
      },
      services: {
        include: {
          service: true
        }
      }
    }
  })
}

export async function updateStaffMember(id: string, data: {
  name?: string
  phone?: string
  avatar?: string
  color?: string
  homeService?: boolean
  status?: StaffStatus
}) {
  return await prisma.staffMember.update({
    where: { id },
    data,
    include: {
      user: true,
      locations: {
        include: {
          location: true
        }
      },
      services: {
        include: {
          service: true
        }
      }
    }
  })
}

export async function deleteStaffMember(id: string) {
  return await prisma.staffMember.delete({
    where: { id }
  })
}

export async function updateStaffLocations(staffId: string, locationIds: string[]) {
  // Remove existing locations
  await prisma.staffLocation.deleteMany({
    where: { staffId }
  })

  // Add new locations
  if (locationIds.length > 0) {
    await prisma.staffLocation.createMany({
      data: locationIds.map(locationId => ({
        staffId,
        locationId
      }))
    })
  }

  return await getStaffMemberById(staffId)
}

export async function updateStaffServices(staffId: string, serviceIds: string[]) {
  // Remove existing services
  await prisma.staffService.deleteMany({
    where: { staffId }
  })

  // Add new services
  if (serviceIds.length > 0) {
    await prisma.staffService.createMany({
      data: serviceIds.map(serviceId => ({
        staffId,
        serviceId
      }))
    })
  }

  return await getStaffMemberById(staffId)
}

export async function updateStaffSchedule(staffId: string, schedule: Array<{
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}>) {
  // Remove existing schedule
  await prisma.staffSchedule.deleteMany({
    where: { staffId }
  })

  // Add new schedule
  if (schedule.length > 0) {
    await prisma.staffSchedule.createMany({
      data: schedule.map(item => ({
        staffId,
        ...item
      }))
    })
  }

  return await getStaffMemberById(staffId)
}

export async function getStaffAvailability(staffId: string, date: Date) {
  const dayOfWeek = date.getDay()
  
  const schedule = await prisma.staffSchedule.findFirst({
    where: {
      staffId,
      dayOfWeek,
      isActive: true
    }
  })

  if (!schedule) {
    return null
  }

  // Get existing appointments for the day
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const appointments = await prisma.appointment.findMany({
    where: {
      staffId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      status: {
        notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW']
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  return {
    schedule,
    appointments
  }
}
