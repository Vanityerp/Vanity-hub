import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateStaffServices } from '@/lib/services/staff';

/**
 * GET /api/staff/[id]/services
 * 
 * Get services for a specific staff member
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`GET /api/staff/${id}/services - Fetching staff services`);

    // Get staff services from database
    const staffServices = await prisma.staffService.findMany({
      where: {
        staffId: id,
        isActive: true
      },
      include: {
        service: true
      }
    });

    const services = staffServices.map(ss => ({
      id: ss.service.id,
      name: ss.service.name,
      description: ss.service.description,
      category: ss.service.category,
      duration: ss.service.duration,
      price: ss.service.price
    }));

    console.log(`✅ Found ${services.length} services for staff member ${id}`);
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error fetching staff services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff services' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/staff/[id]/services
 * 
 * Update services for a specific staff member
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serviceIds } = body;

    console.log(`PUT /api/staff/${id}/services - Updating staff services`);
    console.log('Service IDs:', serviceIds);

    if (!Array.isArray(serviceIds)) {
      return NextResponse.json(
        { error: 'serviceIds must be an array' },
        { status: 400 }
      );
    }

    // Update staff services using the existing function
    const updatedStaff = await updateStaffServices(id, serviceIds);

    if (!updatedStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Get the updated services
    const staffServices = await prisma.staffService.findMany({
      where: {
        staffId: id,
        isActive: true
      },
      include: {
        service: true
      }
    });

    const services = staffServices.map(ss => ({
      id: ss.service.id,
      name: ss.service.name,
      description: ss.service.description,
      category: ss.service.category,
      duration: ss.service.duration,
      price: ss.service.price
    }));

    console.log(`✅ Updated services for staff member ${id}. Now has ${services.length} services`);
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error updating staff services:', error);
    return NextResponse.json(
      { error: 'Failed to update staff services' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/staff/[id]/services
 * 
 * Add a service to a staff member
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serviceId } = body;

    console.log(`POST /api/staff/${id}/services - Adding service ${serviceId}`);

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      );
    }

    // Check if the service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check if the staff-service relationship already exists
    const existingStaffService = await prisma.staffService.findUnique({
      where: {
        staffId_serviceId: {
          staffId: id,
          serviceId: serviceId
        }
      }
    });

    if (existingStaffService) {
      // If it exists but is inactive, reactivate it
      if (!existingStaffService.isActive) {
        await prisma.staffService.update({
          where: { id: existingStaffService.id },
          data: { isActive: true }
        });
      }
    } else {
      // Create new staff-service relationship
      await prisma.staffService.create({
        data: {
          staffId: id,
          serviceId: serviceId,
          isActive: true
        }
      });
    }

    // Get the updated services
    const staffServices = await prisma.staffService.findMany({
      where: {
        staffId: id,
        isActive: true
      },
      include: {
        service: true
      }
    });

    const services = staffServices.map(ss => ({
      id: ss.service.id,
      name: ss.service.name,
      description: ss.service.description,
      category: ss.service.category,
      duration: ss.service.duration,
      price: ss.service.price
    }));

    console.log(`✅ Added service to staff member ${id}. Now has ${services.length} services`);
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error adding staff service:', error);
    return NextResponse.json(
      { error: 'Failed to add staff service' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/staff/[id]/services/[serviceId]
 * 
 * Remove a service from a staff member
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    console.log(`DELETE /api/staff/${id}/services - Removing service ${serviceId}`);

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      );
    }

    // Deactivate the staff-service relationship
    const staffService = await prisma.staffService.findUnique({
      where: {
        staffId_serviceId: {
          staffId: id,
          serviceId: serviceId
        }
      }
    });

    if (!staffService) {
      return NextResponse.json(
        { error: 'Staff service relationship not found' },
        { status: 404 }
      );
    }

    await prisma.staffService.update({
      where: { id: staffService.id },
      data: { isActive: false }
    });

    // Get the updated services
    const staffServices = await prisma.staffService.findMany({
      where: {
        staffId: id,
        isActive: true
      },
      include: {
        service: true
      }
    });

    const services = staffServices.map(ss => ({
      id: ss.service.id,
      name: ss.service.name,
      description: ss.service.description,
      category: ss.service.category,
      duration: ss.service.duration,
      price: ss.service.price
    }));

    console.log(`✅ Removed service from staff member ${id}. Now has ${services.length} services`);
    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error removing staff service:', error);
    return NextResponse.json(
      { error: 'Failed to remove staff service' },
      { status: 500 }
    );
  }
}
