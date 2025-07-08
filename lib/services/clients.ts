import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'

export type ClientWithDetails = Prisma.ClientGetPayload<{
  include: {
    user: {
      include: {
        appointments: {
          include: {
            staff: true
            location: true
            services: {
              include: {
                service: true
              }
            }
          }
        }
        transactions: true
      }
    }
    loyaltyProgram: true
  }
}>

export async function getClients(filters?: {
  search?: string
  hasLoyaltyProgram?: boolean
}) {
  const where: Prisma.ClientWhereInput = {}

  if (filters?.search) {
    where.OR = [
      {
        name: {
          contains: filters.search
        }
      },
      {
        user: {
          email: {
            contains: filters.search
          }
        }
      },
      {
        phone: {
          contains: filters.search
        }
      }
    ]
  }

  if (filters?.hasLoyaltyProgram !== undefined) {
    if (filters.hasLoyaltyProgram) {
      where.loyaltyProgram = {
        isNot: null
      }
    } else {
      where.loyaltyProgram = null
    }
  }

  return await prisma.client.findMany({
    where,
    include: {
      user: {
        include: {
          appointments: {
            include: {
              staff: true,
              location: true,
              services: {
                include: {
                  service: true
                }
              }
            },
            orderBy: {
              date: 'desc'
            },
            take: 5 // Last 5 appointments
          },
          transactions: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 5 // Last 5 transactions
          }
        }
      },
      loyaltyProgram: true
    },
    orderBy: {
      name: 'asc'
    }
  })
}

export async function getClientById(id: string) {
  return await prisma.client.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          appointments: {
            include: {
              staff: true,
              location: true,
              services: {
                include: {
                  service: true
                }
              }
            },
            orderBy: {
              date: 'desc'
            }
          },
          transactions: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      },
      loyaltyProgram: true
    }
  })
}

export async function getClientByUserId(userId: string) {
  return await prisma.client.findUnique({
    where: { userId },
    include: {
      user: {
        include: {
          appointments: {
            include: {
              staff: true,
              location: true,
              services: {
                include: {
                  service: true
                }
              }
            },
            orderBy: {
              date: 'desc'
            }
          },
          transactions: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      },
      loyaltyProgram: true
    }
  })
}

export async function createClient(data: {
  userId: string
  name: string
  phone?: string
  dateOfBirth?: Date
  preferences?: string
  notes?: string
}) {
  return await prisma.client.create({
    data,
    include: {
      user: true,
      loyaltyProgram: true
    }
  })
}

export async function updateClient(id: string, data: {
  name?: string
  phone?: string
  dateOfBirth?: Date
  preferences?: string
  notes?: string
}) {
  return await prisma.client.update({
    where: { id },
    data,
    include: {
      user: true,
      loyaltyProgram: true
    }
  })
}

export async function deleteClient(id: string) {
  return await prisma.client.delete({
    where: { id }
  })
}

export async function createLoyaltyProgram(clientId: string) {
  return await prisma.loyaltyProgram.create({
    data: {
      clientId,
      points: 0,
      tier: 'Bronze',
      totalSpent: 0
    }
  })
}

export async function updateLoyaltyPoints(clientId: string, points: number, spent: number) {
  const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
    where: { clientId }
  })

  if (!loyaltyProgram) {
    return await createLoyaltyProgram(clientId)
  }

  const newPoints = loyaltyProgram.points + points
  const newTotalSpent = Number(loyaltyProgram.totalSpent) + spent

  // Determine tier based on total spent
  let tier = 'Bronze'
  if (newTotalSpent >= 1000) {
    tier = 'Gold'
  } else if (newTotalSpent >= 500) {
    tier = 'Silver'
  }

  return await prisma.loyaltyProgram.update({
    where: { clientId },
    data: {
      points: newPoints,
      totalSpent: newTotalSpent,
      tier,
      lastActivity: new Date()
    }
  })
}

export async function getClientStats(filters?: {
  dateRange?: { start: Date; end: Date }
}) {
  const where: Prisma.AppointmentWhereInput = {}

  if (filters?.dateRange) {
    where.date = {
      gte: filters.dateRange.start,
      lte: filters.dateRange.end,
    }
  }

  const [totalClients, activeClients, newClients, loyaltyMembers] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({
      where: {
        user: {
          appointments: {
            some: where
          }
        }
      }
    }),
    prisma.client.count({
      where: {
        createdAt: filters?.dateRange ? {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end,
        } : undefined
      }
    }),
    prisma.loyaltyProgram.count({
      where: {
        isActive: true
      }
    })
  ])

  return {
    totalClients,
    activeClients,
    newClients,
    loyaltyMembers
  }
}
