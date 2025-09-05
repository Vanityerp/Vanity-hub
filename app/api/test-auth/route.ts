import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    console.log(`Found ${userCount} users in database`)

    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@vanityhub.com' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        password: true
      }
    })

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        message: 'Admin user not found',
        userCount
      })
    }

    // Test password verification
    const testPassword = 'admin123'
    const passwordMatch = await bcrypt.compare(testPassword, adminUser.password)

    return NextResponse.json({
      success: true,
      message: 'Database connection and admin user verified',
      data: {
        userCount,
        adminExists: !!adminUser,
        adminActive: adminUser.isActive,
        adminRole: adminUser.role,
        passwordTest: passwordMatch
      }
    })

  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        staffProfile: {
          include: {
            locations: {
              include: {
                location: true
              }
            }
          }
        }
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        message: user ? 'Account inactive' : 'User not found'
      })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({
        success: false,
        message: 'Invalid password'
      })
    }

    // Get user locations from staff profile
    let locationIds: string[] = []
    if (user.staffProfile?.locations) {
      locationIds = user.staffProfile.locations
        .filter(sl => sl.isActive)
        .map(sl => sl.location.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        name: user.staffProfile?.name || user.email.split('@')[0],
        email: user.email,
        role: user.role,
        locations: user.role === "ADMIN" ? ["all"] : locationIds,
      }
    })

  } catch (error) {
    console.error('Test auth POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
