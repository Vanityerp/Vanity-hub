import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔄 Fetching service with ID: ${params.id}`)
    const serviceId = params.id

    const service = await prisma.service.findUnique({
      where: {
        id: serviceId
      },
      include: {
        locations: {
          where: {
            isActive: true
          },
          include: {
            location: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Transform service to match expected format
    const transformedService = {
      id: service.id,
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: Number(service.price),
      category: service.category,
      categoryName: service.category,
      showPrices: service.showPricesToClients,
      locations: service.locations.map(loc => loc.locationId),
      locationPrices: service.locations.reduce((acc, loc) => {
        acc[loc.locationId] = Number(loc.price || service.price)
        return acc
      }, {} as Record<string, number>),
      createdAt: service.createdAt,
      updatedAt: service.updatedAt
    }

    console.log(`✅ Successfully fetched service: ${service.name}`)
    return NextResponse.json({ service: transformedService })
  } catch (error) {
    console.error("❌ Error fetching service:", error)
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔄 Updating service with ID: ${params.id}`)
    const serviceId = params.id
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.duration || data.price === undefined) {
      return NextResponse.json({ error: "Missing required fields: name, duration, and price are required" }, { status: 400 })
    }

    // Update the service with Prisma
    const service = await prisma.service.update({
      where: {
        id: serviceId
      },
      data: {
        name: data.name,
        description: data.description || null,
        duration: parseInt(data.duration),
        price: parseFloat(data.price),
        category: data.category || "Uncategorized",
        showPricesToClients: data.showPrices !== undefined ? data.showPrices : true,
        // Handle location updates
        locations: data.locations && Array.isArray(data.locations) ? {
          deleteMany: {}, // Remove all existing locations
          create: data.locations.map((locationId: string) => ({
            locationId: locationId,
            price: data.locationPrices?.[locationId] ? parseFloat(data.locationPrices[locationId]) : parseFloat(data.price)
          }))
        } : undefined
      },
      include: {
        locations: {
          include: {
            location: true
          }
        }
      }
    })

    // Transform service to match expected format
    const transformedService = {
      id: service.id,
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: Number(service.price),
      category: service.category,
      categoryName: service.category,
      showPrices: service.showPricesToClients,
      locations: service.locations.map(loc => loc.locationId),
      locationPrices: service.locations.reduce((acc, loc) => {
        acc[loc.locationId] = Number(loc.price || service.price)
        return acc
      }, {} as Record<string, number>),
      createdAt: service.createdAt,
      updatedAt: service.updatedAt
    }

    console.log(`✅ Successfully updated service: ${service.name}`)
    return NextResponse.json({ service: transformedService })
  } catch (error) {
    console.error("❌ Error updating service:", error)
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔄 Deleting service with ID: ${params.id}`)
    const serviceId = params.id

    // Check if service has appointments
    const appointmentCount = await prisma.appointmentService.count({
      where: {
        serviceId: serviceId
      }
    })

    if (appointmentCount > 0) {
      return NextResponse.json({
        error: `Cannot delete service with ${appointmentCount} appointments. Please cancel or complete the appointments first.`
      }, { status: 400 })
    }

    // Delete the service (Prisma will handle cascading deletes for locations)
    const deletedService = await prisma.service.delete({
      where: {
        id: serviceId
      }
    })

    console.log(`✅ Successfully deleted service: ${deletedService.name}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error.code === 'P2025') {
      // Prisma error code for record not found
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }
    console.error("❌ Error deleting service:", error)
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 })
  }
}
