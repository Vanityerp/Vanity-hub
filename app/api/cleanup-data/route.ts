import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/cleanup-data
 * 
 * Clean up localStorage data by removing duplicates and invalid entries
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffData } = body;

    if (!staffData || !Array.isArray(staffData)) {
      return NextResponse.json(
        { error: 'Invalid staff data provided' },
        { status: 400 }
      );
    }

    // Clean up the data
    const cleanedStaff = [];
    const emailsSeen = new Set();
    const namesSeen = new Set();
    const duplicatesRemoved = [];

    for (const staff of staffData) {
      // Check for required fields
      if (!staff.name || !staff.email) {
        duplicatesRemoved.push({
          reason: 'Missing required fields',
          staff: staff.name || 'Unknown',
          email: staff.email || 'No email'
        });
        continue;
      }

      // Check for duplicate emails
      if (emailsSeen.has(staff.email.toLowerCase())) {
        duplicatesRemoved.push({
          reason: 'Duplicate email',
          staff: staff.name,
          email: staff.email
        });
        continue;
      }

      // Check for duplicate names with same email
      const nameEmailKey = `${staff.name.toLowerCase()}_${staff.email.toLowerCase()}`;
      if (namesSeen.has(nameEmailKey)) {
        duplicatesRemoved.push({
          reason: 'Duplicate name and email combination',
          staff: staff.name,
          email: staff.email
        });
        continue;
      }

      // Add to seen sets
      emailsSeen.add(staff.email.toLowerCase());
      namesSeen.add(nameEmailKey);

      // Clean up the staff object
      const cleanedStaffMember = {
        ...staff,
        // Ensure required fields are present
        id: staff.id || `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: staff.name.trim(),
        email: staff.email.trim().toLowerCase(),
        phone: staff.phone || '',
        role: staff.role || 'stylist',
        locations: Array.isArray(staff.locations) ? staff.locations : [],
        status: staff.status || 'Active',
        avatar: staff.avatar || staff.name.split(' ').map(n => n[0]).join(''),
        color: staff.color || 'bg-purple-100 text-purple-800',
        homeService: Boolean(staff.homeService),
        // Optional fields
        employeeNumber: staff.employeeNumber || '',
        qidValidity: staff.qidValidity || '',
        passportValidity: staff.passportValidity || '',
        medicalValidity: staff.medicalValidity || '',
        profileImage: staff.profileImage || '',
        profileImageType: staff.profileImageType || ''
      };

      cleanedStaff.push(cleanedStaffMember);
    }

    return NextResponse.json({
      success: true,
      originalCount: staffData.length,
      cleanedCount: cleanedStaff.length,
      duplicatesRemoved: duplicatesRemoved.length,
      cleanedStaff,
      duplicatesRemoved,
      message: `Cleaned ${staffData.length} staff members. Removed ${duplicatesRemoved.length} duplicates/invalid entries.`
    });

  } catch (error) {
    console.error('Error cleaning up data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clean up data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
