import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔄 Fetching location by ID:", params.id)
    
    const location = await prisma.location.findUnique({
      where: {
        id: params.id
      }
    })

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    // Transform location to match expected format
    const transformedLocation = {
      id: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      country: location.country,
      phone: location.phone,
      email: location.email,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt
    }

    console.log("✅ Location fetched successfully:", location.name)
    return NextResponse.json({ location: transformedLocation })
  } catch (error) {
    console.error("❌ Error fetching location:", error)
    return NextResponse.json({ error: "Failed to fetch location" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔄 Updating location:", params.id)
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.address || !data.city) {
      return NextResponse.json({ error: "Missing required fields: name, address, and city are required" }, { status: 400 })
    }

    // Update the location with Prisma
    const location = await prisma.location.update({
      where: {
        id: params.id
      },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state || "",
        zipCode: data.zipCode || "",
        country: data.country || "Qatar",
        phone: data.phone || "",
        email: data.email || "",
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    })

    // Transform location to match expected format
    const transformedLocation = {
      id: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      country: location.country,
      phone: location.phone,
      email: location.email,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt
    }

    console.log("✅ Location updated successfully:", location.name)
    return NextResponse.json({ 
      message: "Location updated successfully", 
      location: transformedLocation 
    })
  } catch (error) {
    console.error("❌ Error updating location:", error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔄 Deleting location:", params.id)

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: {
        id: params.id
      },
      include: {
        _count: {
          select: {
            staff: true,
            appointments: true,
            services: true,
            products: true
          }
        }
      }
    })

    if (!existingLocation) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    // Check for referential integrity - warn if location has dependencies
    const dependencies = []
    if (existingLocation._count.staff > 0) {
      dependencies.push(`${existingLocation._count.staff} staff member(s)`)
    }
    if (existingLocation._count.appointments > 0) {
      dependencies.push(`${existingLocation._count.appointments} appointment(s)`)
    }
    if (existingLocation._count.services > 0) {
      dependencies.push(`${existingLocation._count.services} service(s)`)
    }
    if (existingLocation._count.products > 0) {
      dependencies.push(`${existingLocation._count.products} product(s)`)
    }

    if (dependencies.length > 0) {
      console.log(`⚠️ Location has dependencies: ${dependencies.join(', ')}`)
      // Still allow deletion but warn about dependencies
    }

    // Instead of hard delete, mark as inactive to preserve data integrity
    const location = await prisma.location.update({
      where: {
        id: params.id
      },
      data: {
        isActive: false
      }
    })

    console.log("✅ Location marked as inactive:", location.name)
    return NextResponse.json({
      message: "Location deleted successfully",
      location: {
        id: location.id,
        name: location.name,
        isActive: location.isActive
      },
      dependencies: dependencies.length > 0 ? dependencies : undefined
    })
  } catch (error) {
    console.error("❌ Error deleting location:", error)
    return NextResponse.json({
      error: "Failed to delete location",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
