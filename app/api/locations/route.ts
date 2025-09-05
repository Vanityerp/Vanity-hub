import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromHeaders, filterLocationsByAccess } from "@/lib/auth-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Fetching locations from database...")

    const locations = await prisma.location.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform locations to match expected format
    const transformedLocations = locations.map(location => ({
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
    }))

    // Apply user-based access control
    const currentUser = getUserFromHeaders(request);
    let filteredLocations = transformedLocations;

    if (currentUser) {
      console.log(`🔍 Current user: ${currentUser.email}, Role: ${currentUser.role}, Locations: ${JSON.stringify(currentUser.locations)}`);
      filteredLocations = filterLocationsByAccess(transformedLocations, currentUser.locations || [], currentUser.role);
      console.log(`🔒 Filtered locations by user access: ${filteredLocations.length}/${transformedLocations.length} locations visible to user`);
      console.log(`🔒 Visible locations: ${filteredLocations.map(loc => loc.name).join(', ')}`);
    } else {
      console.log("🔍 No authenticated user found, returning all locations");
    }

    console.log(`✅ Successfully fetched ${filteredLocations.length} locations`)
    return NextResponse.json({ locations: filteredLocations })
  } catch (error) {
    console.error("❌ Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("🔄 Creating new location...")
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.address || !data.city) {
      return NextResponse.json({ error: "Missing required fields: name, address, and city are required" }, { status: 400 })
    }

    // Create the location with Prisma
    const location = await prisma.location.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state || "",
        zipCode: data.zipCode || "",
        country: data.country || "Qatar",
        phone: data.phone || "",
        email: data.email || "",
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

    console.log(`✅ Successfully created location: ${location.name}`)
    return NextResponse.json({ location: transformedLocation }, { status: 201 })
  } catch (error) {
    console.error("❌ Error creating location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
