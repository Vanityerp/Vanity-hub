import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/seed-locations
 * 
 * Seed default locations in the database
 */
export async function POST() {
  try {
    // Default locations to seed - exactly as specified in requirements
    const defaultLocations = [
      {
        id: 'loc1',
        name: 'D-ring road',
        address: '123 D-Ring Road',
        city: 'Doha',
        state: 'Doha',
        zipCode: '12345',
        country: 'Qatar',
        phone: '(974) 123-4567',
        email: 'dring@vanityhub.com',
        isActive: true
      },
      {
        id: 'loc2',
        name: 'Muaither',
        address: '456 Muaither St',
        city: 'Doha',
        state: 'Doha',
        zipCode: '23456',
        country: 'Qatar',
        phone: '(974) 234-5678',
        email: 'muaither@vanityhub.com',
        isActive: true
      },
      {
        id: 'loc3',
        name: 'Medinat Khalifa',
        address: '789 Medinat Khalifa Blvd',
        city: 'Doha',
        state: 'Doha',
        zipCode: '34567',
        country: 'Qatar',
        phone: '(974) 345-6789',
        email: 'medinat@vanityhub.com',
        isActive: true
      },
      {
        id: 'home',
        name: 'Home service',
        address: 'Client\'s Location',
        city: 'Doha',
        state: 'Doha',
        zipCode: '',
        country: 'Qatar',
        phone: '(974) 456-7890',
        email: 'homeservice@vanityhub.com',
        isActive: true
      },
      {
        id: 'online',
        name: 'Online store',
        address: 'Virtual Location',
        city: 'Doha',
        state: 'Doha',
        zipCode: '',
        country: 'Qatar',
        phone: '(974) 567-8901',
        email: 'online@vanityhub.com',
        isActive: true
      },
      {
        id: 'loc3',
        name: 'Medinat Khalifa',
        address: '789 Medinat Khalifa Blvd',
        city: 'Doha',
        state: 'Doha',
        zipCode: '34567',
        country: 'Qatar',
        phone: '(974) 345-6789',
        email: 'medinat@vanityhub.com',
        isActive: true
      },
      {
        id: 'home',
        name: 'Home service',
        address: 'Client\'s Location',
        city: 'Doha',
        state: 'Doha',
        zipCode: '',
        country: 'Qatar',
        phone: '(974) 456-7890',
        email: 'homeservice@vanityhub.com',
        isActive: true
      }
    ];

    const seededLocations = [];
    const errors = [];

    for (const location of defaultLocations) {
      try {
        // Check if location already exists
        const existingLocation = await prisma.location.findUnique({
          where: { id: location.id }
        });

        if (existingLocation) {
          console.log(`Location ${location.name} already exists, skipping...`);
          continue;
        }

        // Create the location
        const newLocation = await prisma.location.create({
          data: location
        });

        seededLocations.push(newLocation);
      } catch (locationError) {
        console.error(`Error seeding location ${location.name}:`, locationError);
        errors.push({
          location: location.name,
          error: locationError instanceof Error ? locationError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      seededCount: seededLocations.length,
      seededLocations,
      errors,
      message: `Successfully seeded ${seededLocations.length} locations`
    });

  } catch (error) {
    console.error('Error seeding locations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed locations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed-locations
 * 
 * Check if locations need to be seeded
 */
export async function GET() {
  try {
    const locationCount = await prisma.location.count();
    
    return NextResponse.json({
      locationCount,
      seedingNeeded: locationCount === 0
    });
  } catch (error) {
    console.error('Error checking location count:', error);
    return NextResponse.json(
      { error: 'Failed to check location count' },
      { status: 500 }
    );
  }
}
