import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateStaffServices } from '@/lib/services/staff';

// Map staff roles to UserRole enum values
function mapStaffRoleToUserRole(staffRole: string): string {
  const roleMapping: { [key: string]: string } = {
    // Admin roles
    'super_admin': 'ADMIN',
    'org_admin': 'ADMIN',

    // Manager roles
    'location_manager': 'MANAGER',
    'manager': 'MANAGER',

    // Staff roles (all salon workers)
    'stylist': 'STAFF',
    'colorist': 'STAFF',
    'barber': 'STAFF',
    'nail_technician': 'STAFF',
    'esthetician': 'STAFF',
    'receptionist': 'STAFF',
    'staff': 'STAFF',

    // Client role
    'client': 'CLIENT'
  };

  const normalizedRole = staffRole.toLowerCase().trim();
  return roleMapping[normalizedRole] || 'STAFF'; // Default to STAFF if role not found
}

/**
 * PUT /api/staff/[id]
 * 
 * Update an existing staff member
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, role, locations, status, homeService, employeeNumber, dateOfBirth, qidNumber, passportNumber, qidValidity, passportValidity, medicalValidity, profileImage, profileImageType, specialties } = body;

    console.log(`PUT /api/staff/${id} - Attempting to update staff member`);
    console.log('Request body:', { name, email, role, status });

    // Try to update in database first
    try {
      // Find the staff member
      const existingStaff = await prisma.staffMember.findUnique({
        where: { id },
        include: { user: true }
      });

      console.log('Found existing staff:', existingStaff ? `${existingStaff.name} (${existingStaff.id})` : 'null');

      if (!existingStaff) {
        console.log(`Staff member with ID ${id} not found in database`);
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }

      // Update user
      const userRole = mapStaffRoleToUserRole(role);
      await prisma.user.update({
        where: { id: existingStaff.userId },
        data: {
          email,
          role: userRole,
          isActive: status === 'Active'
        }
      });

      // Update staff member
      const updatedStaff = await prisma.staffMember.update({
        where: { id },
        data: {
          name,
          phone,
          avatar: name.split(' ').map(n => n[0]).join(''),
          jobRole: role, // Update the specific job role
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          homeService: homeService || false,
          status: status === 'Active' ? 'ACTIVE' : status === 'Inactive' ? 'INACTIVE' : 'ON_LEAVE',
          // HR Document Management Fields
          employeeNumber,
          qidNumber,
          passportNumber,
          qidValidity,
          passportValidity,
          medicalValidity,
          profileImage,
          profileImageType,
          // Manual specialties as JSON string
          specialties: specialties ? JSON.stringify(specialties) : null
        },
        include: {
          user: true,
          locations: {
            include: {
              location: true
            }
          }
        }
      });

      // Update location associations
      if (locations) {
        // Remove existing associations
        await prisma.staffLocation.deleteMany({
          where: { staffId: id }
        });

        // Add new associations
        if (locations.length > 0) {
          await Promise.all(
            locations.map(locationId =>
              prisma.staffLocation.create({
                data: {
                  staffId: id,
                  locationId
                }
              })
            )
          );
        }
      }

      // Fetch the updated staff with location data
      const updatedStaffWithLocations = await prisma.staffMember.findUnique({
        where: { id },
        include: {
          user: true,
          locations: {
            include: {
              location: true
            }
          }
        }
      });

      if (!updatedStaffWithLocations) {
        throw new Error("Failed to fetch updated staff data");
      }

      // Transform response to match frontend interface
      const transformedStaff = {
        id: updatedStaffWithLocations.id,
        name: updatedStaffWithLocations.name,
        email: updatedStaffWithLocations.user.email,
        phone: updatedStaffWithLocations.phone || '',
        role: updatedStaffWithLocations.jobRole || role, // Use the stored jobRole
        locations: updatedStaffWithLocations.locations.map(loc => loc.locationId), // Get actual location IDs from database
        status: updatedStaffWithLocations.status === 'ACTIVE' ? 'Active' : updatedStaffWithLocations.status === 'INACTIVE' ? 'Inactive' : 'On Leave',
        avatar: updatedStaffWithLocations.avatar || updatedStaffWithLocations.name.split(' ').map(n => n[0]).join(''),
        color: updatedStaffWithLocations.color || 'bg-purple-100 text-purple-800',
        homeService: updatedStaffWithLocations.homeService,
        specialties: updatedStaffWithLocations.specialties ? (() => {
          try {
            return JSON.parse(updatedStaffWithLocations.specialties);
          } catch (e) {
            console.warn('Failed to parse specialties JSON:', updatedStaffWithLocations.specialties);
            return [];
          }
        })() : [],
        employeeNumber: employeeNumber || '',
        dateOfBirth: updatedStaffWithLocations.dateOfBirth ? (() => {
          const date = updatedStaffWithLocations.dateOfBirth.toISOString().split('T')[0] // YYYY-MM-DD
          const [year, month, day] = date.split('-')
          const shortYear = year.slice(-2) // Get last 2 digits for YY format
          return `${day}-${month}-${shortYear}` // Convert to DD-MM-YY for frontend
        })() : '',
        qidValidity: qidValidity || '',
        passportValidity: passportValidity || '',
        medicalValidity: medicalValidity || '',
        profileImage: profileImage || '',
        profileImageType: profileImageType || ''
      };

      return NextResponse.json({ staff: transformedStaff });
    } catch (dbError) {
      console.error('Database error updating staff member:', dbError);
      return NextResponse.json(
        { error: 'Failed to update staff member' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/[id]
 * 
 * Delete a staff member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to delete from database first
    try {
      // Find the staff member to get the user ID
      const existingStaff = await prisma.staffMember.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!existingStaff) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }

      // Delete staff member (this will cascade to related records)
      await prisma.staffMember.delete({
        where: { id }
      });

      // Delete the associated user
      await prisma.user.delete({
        where: { id: existingStaff.userId }
      });

      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Database error deleting staff member:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete staff member' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    );
  }
}
