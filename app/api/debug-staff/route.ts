import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/debug-staff
 * 
 * Debug endpoint to check staff data in database
 */
export async function GET() {
  try {
    // Get all staff members with full details
    const staffMembers = await prisma.staffMember.findMany({
      include: {
        user: true,
        locations: {
          include: {
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all users
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all locations
    const locations = await prisma.location.findMany();

    // Get all staff-location associations
    const staffLocations = await prisma.staffLocation.findMany();

    return NextResponse.json({
      summary: {
        staffCount: staffMembers.length,
        userCount: users.length,
        locationCount: locations.length,
        staffLocationCount: staffLocations.length
      },
      staffMembers: staffMembers.map(staff => ({
        id: staff.id,
        name: staff.name,
        email: staff.user.email,
        role: staff.jobRole,
        status: staff.status,
        userId: staff.userId,
        locations: staff.locations.map(loc => ({
          locationId: loc.locationId,
          locationName: loc.location.name
        })),
        createdAt: staff.createdAt
      })),
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      })),
      locations: locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address
      })),
      staffLocations: staffLocations.map(sl => ({
        staffId: sl.staffId,
        locationId: sl.locationId
      }))
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch debug data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
