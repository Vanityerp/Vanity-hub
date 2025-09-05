import { NextRequest, NextResponse } from 'next/server';
import { StaffStorage } from '@/lib/staff-storage';

// DEPRECATED: This endpoint is no longer needed as staff data is managed through the database
// Use the staff management interface in the admin dashboard instead
const realStaffData: any[] = []


/**
 * POST /api/add-real-staff
 *
 * DEPRECATED: This endpoint is no longer needed as staff data is managed through the database
 */
export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint is deprecated. Use the staff management interface in the admin dashboard instead.',
    deprecated: true
  }, { status: 410 });
}
