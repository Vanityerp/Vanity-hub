import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper function to generate initials for avatar
function generateInitials(name: string): string {
  const nameParts = name.trim().split(" ")
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
  }
  return nameParts[0].substring(0, 2).toUpperCase()
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get("locationId")

    // Get all clients from Prisma
    const clients = await prisma.client.findMany({
      include: {
        user: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform clients to match the expected format
    const transformedClients = clients.map(client => {
      // Safely parse preferences with error handling
      let preferences = {
        preferredStylists: [],
        preferredServices: [],
        allergies: [],
        notes: ''
      }

      if (client.preferences) {
        try {
          preferences = JSON.parse(client.preferences)
        } catch (error) {
          console.error(`Invalid JSON in preferences for client ${client.name} (${client.id}):`, client.preferences)
          // Keep default preferences if JSON is invalid
        }
      }

      return {
        id: client.id,
        name: client.name,
        email: client.user?.email || '',
        phone: client.phone || '',
        address: '', // Not stored in current schema
        city: '', // Not stored in current schema
        state: '', // Not stored in current schema
        birthday: client.dateOfBirth?.toISOString().split('T')[0] || '',
        preferredLocation: 'loc1', // Default for now
        locations: ['loc1'], // Default for now
        status: 'Active' as const,
        avatar: generateInitials(client.name),
        segment: 'Regular' as const,
        totalSpent: 0,
        referredBy: '',
        preferences,
        notes: client.notes || '',
        registrationSource: 'manual',
        isAutoRegistered: false,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString()
      }
    })

    return NextResponse.json({ clients: transformedClients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
    }

    // This route is deprecated - redirect to the new create endpoint
    return NextResponse.json({
      error: "This endpoint is deprecated. Use /api/clients/create instead."
    }, { status: 410 })

  } catch (error) {
    console.error("Error in POST /api/clients:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
