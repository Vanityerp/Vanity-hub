import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('🔍 Debug auth endpoint called')
    
    // Check environment variables
    const envCheck = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    }
    
    console.log('🌍 Environment:', envCheck)
    
    // Test database connection
    const userCount = await prisma.user.count()
    console.log(`📊 Total users: ${userCount}`)
    
    // Check admin user
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
        env: envCheck,
        userCount
      })
    }
    
    // Test password
    const passwordTest = await bcrypt.compare('admin123', adminUser.password)
    
    return NextResponse.json({
      success: true,
      message: 'Debug info',
      data: {
        env: envCheck,
        userCount,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          isActive: adminUser.isActive,
          passwordTest
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Debug auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log('🔐 Testing login for:', email)
    
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
    
    if (!user) {
      console.log('❌ User not found:', email)
      return NextResponse.json({
        success: false,
        message: 'User not found'
      })
    }
    
    if (!user.isActive) {
      console.log('❌ User inactive:', email)
      return NextResponse.json({
        success: false,
        message: 'Account inactive'
      })
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password)
    console.log('🔐 Password match:', passwordMatch)
    
    if (!passwordMatch) {
      return NextResponse.json({
        success: false,
        message: 'Invalid password'
      })
    }
    
    // Get user locations
    let locationIds: string[] = []
    if (user.staffProfile?.locations) {
      locationIds = user.staffProfile.locations
        .filter(sl => sl.isActive)
        .map(sl => sl.location.id)
    }
    
    console.log('✅ Login successful for:', email)
    
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
    console.error('❌ Debug auth POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
