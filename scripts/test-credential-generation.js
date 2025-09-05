const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCredentialGeneration() {
  try {
    console.log('🔄 Testing credential generation system...');
    
    // First, let's see what staff members exist
    const allStaff = await prisma.staffMember.findMany({
      include: {
        user: true,
        locations: {
          include: {
            location: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${allStaff.length} staff members in database`);
    
    // Check how many have credentials
    const staffWithCredentials = allStaff.filter(s => s.user);
    const staffWithoutCredentials = allStaff.filter(s => !s.user);
    
    console.log(`✅ Staff with credentials: ${staffWithCredentials.length}`);
    console.log(`❌ Staff without credentials: ${staffWithoutCredentials.length}`);
    
    // Show locations
    const locations = await prisma.location.findMany({
      where: { isActive: true }
    });
    
    console.log(`🏢 Found ${locations.length} active locations:`);
    locations.forEach(loc => {
      console.log(`  - ${loc.name} (${loc.city})`);
    });
    
    // If there are staff without credentials, we can create some test credentials
    if (staffWithoutCredentials.length > 0) {
      console.log('\n🧪 Creating test credentials for staff without login access...');
      
      // Group staff by location to ensure we get one per location
      const staffByLocation = {};
      
      for (const staff of staffWithoutCredentials) {
        for (const staffLocation of staff.locations) {
          const locationId = staffLocation.location.id;
          if (!staffByLocation[locationId]) {
            staffByLocation[locationId] = [];
          }
          staffByLocation[locationId].push(staff);
        }
      }
      
      console.log('📍 Staff distribution by location:');
      Object.entries(staffByLocation).forEach(([locationId, staffList]) => {
        const location = locations.find(l => l.id === locationId);
        console.log(`  - ${location?.name}: ${staffList.length} staff without credentials`);
      });
      
    } else {
      console.log('\n✅ All staff members already have login credentials!');
      
      // Show existing credentials
      console.log('\n📋 Existing staff credentials:');
      staffWithCredentials.forEach(staff => {
        console.log(`  - ${staff.name} (${staff.user.email}) - Role: ${staff.user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing credential generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCredentialGeneration();
