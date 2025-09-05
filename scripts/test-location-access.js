const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLocationAccess() {
  try {
    console.log('🧪 Testing location-based access control...');
    
    // Find Aster's user account
    const asterUser = await prisma.user.findUnique({
      where: { email: 'aster@vanityhub.com' },
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
    });

    if (!asterUser) {
      console.log('❌ Aster user not found');
      return;
    }

    console.log('\n👤 Aster User Information:');
    console.log(`  - ID: ${asterUser.id}`);
    console.log(`  - Email: ${asterUser.email}`);
    console.log(`  - Role: ${asterUser.role}`);
    console.log(`  - Active: ${asterUser.isActive}`);

    if (asterUser.staffProfile) {
      console.log(`  - Staff Name: ${asterUser.staffProfile.name}`);
      console.log(`  - Staff ID: ${asterUser.staffProfile.id}`);
      
      console.log('\n📍 Assigned Locations:');
      asterUser.staffProfile.locations.forEach(sl => {
        console.log(`    - ${sl.location.name} (${sl.location.city}) - Active: ${sl.isActive}`);
      });
    }

    // Get all locations for comparison
    const allLocations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    console.log('\n🏢 All Available Locations:');
    allLocations.forEach(location => {
      const hasAccess = asterUser.staffProfile?.locations.some(sl => 
        sl.location.id === location.id && sl.isActive
      );
      console.log(`  ${hasAccess ? '✅' : '❌'} ${location.name} (${location.city})`);
    });

    // Get all staff members for comparison
    const allStaff = await prisma.staffMember.findMany({
      include: {
        user: true,
        locations: {
          include: {
            location: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log('\n👥 All Staff Members by Location:');
    
    // Group staff by location
    const staffByLocation = {};
    allStaff.forEach(staff => {
      staff.locations.forEach(sl => {
        if (!staffByLocation[sl.location.name]) {
          staffByLocation[sl.location.name] = [];
        }
        staffByLocation[sl.location.name].push(staff);
      });
    });

    Object.entries(staffByLocation).forEach(([locationName, staffList]) => {
      console.log(`\n  📍 ${locationName}:`);
      staffList.forEach(staff => {
        const isAsterLocation = asterUser.staffProfile?.locations.some(sl => 
          sl.location.name === locationName && sl.isActive
        );
        const shouldSee = isAsterLocation ? '👁️ ' : '🚫 ';
        console.log(`    ${shouldSee}${staff.name} (${staff.user?.email || 'No email'})`);
      });
    });

    console.log('\n🎯 Expected Behavior for Aster:');
    console.log('  - Should only see Medinat Khalifa location');
    console.log('  - Should only see staff assigned to Medinat Khalifa');
    console.log('  - Should only see appointments at Medinat Khalifa');
    console.log('  - Other locations should be invisible');

    // Test API simulation
    console.log('\n🔧 API Filter Simulation:');
    const asterLocationIds = asterUser.staffProfile?.locations
      .filter(sl => sl.isActive)
      .map(sl => sl.location.id) || [];
    
    console.log(`  - Aster's location IDs: [${asterLocationIds.join(', ')}]`);
    
    // Simulate location filtering
    const visibleLocations = allLocations.filter(location => 
      asterLocationIds.includes(location.id)
    );
    
    console.log(`  - Visible locations: ${visibleLocations.map(l => l.name).join(', ')}`);
    
    // Simulate staff filtering
    const visibleStaff = allStaff.filter(staff => 
      staff.locations.some(sl => asterLocationIds.includes(sl.locationId))
    );
    
    console.log(`  - Visible staff count: ${visibleStaff.length}`);
    console.log(`  - Visible staff: ${visibleStaff.map(s => s.name).join(', ')}`);

  } catch (error) {
    console.error('❌ Error testing location access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLocationAccess();
