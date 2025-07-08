const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function demoCredentialSystem() {
  try {
    console.log('🎭 Setting up credential management demo...');
    
    // Get all locations
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    console.log(`🏢 Found ${locations.length} active locations:`);
    locations.forEach((loc, index) => {
      console.log(`  ${index + 1}. ${loc.name} (${loc.city})`);
    });
    
    // Get all staff members with their current credentials
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
    
    console.log(`\n👥 Found ${allStaff.length} staff members`);
    
    // Group staff by location to show distribution
    const staffByLocation = {};
    
    for (const staff of allStaff) {
      for (const staffLocation of staff.locations) {
        const locationName = staffLocation.location.name;
        if (!staffByLocation[locationName]) {
          staffByLocation[locationName] = [];
        }
        staffByLocation[locationName].push(staff);
      }
    }
    
    console.log('\n📍 Staff distribution by location:');
    Object.entries(staffByLocation).forEach(([locationName, staffList]) => {
      console.log(`\n  📍 ${locationName}:`);
      staffList.forEach(staff => {
        const hasCredentials = staff.user ? '✅' : '❌';
        const email = staff.user ? staff.user.email : 'No credentials';
        console.log(`    ${hasCredentials} ${staff.name} (${staff.employeeNumber}) - ${email}`);
      });
    });
    
    // Show summary
    const staffWithCredentials = allStaff.filter(s => s.user);
    const staffWithoutCredentials = allStaff.filter(s => !s.user);
    
    console.log('\n📊 Summary:');
    console.log(`  ✅ Staff with credentials: ${staffWithCredentials.length}`);
    console.log(`  ❌ Staff without credentials: ${staffWithoutCredentials.length}`);
    
    // Show one staff member per location with credentials for testing
    console.log('\n🧪 Test Credentials Available:');
    console.log('  The following staff members have login credentials and can be used for testing:');
    
    const testCredentials = [];
    for (const location of locations) {
      const staffAtLocation = staffByLocation[location.name] || [];
      const staffWithCreds = staffAtLocation.filter(s => s.user);
      
      if (staffWithCreds.length > 0) {
        const testStaff = staffWithCreds[0]; // Take the first one
        testCredentials.push({
          location: location.name,
          staff: testStaff.name,
          email: testStaff.user.email,
          role: testStaff.user.role
        });
        console.log(`    📍 ${location.name}: ${testStaff.name} (${testStaff.user.email})`);
      } else {
        console.log(`    📍 ${location.name}: No staff with credentials`);
      }
    }
    
    console.log('\n🔑 Login Information:');
    console.log('  All staff members use the password: "staff123"');
    console.log('  Admin account: admin@vanityhub.com / admin123');
    
    console.log('\n💡 Credential Management Features Available:');
    console.log('  1. View all staff credentials in Settings > Staff Credentials');
    console.log('  2. Reset passwords for existing staff');
    console.log('  3. Update location assignments');
    console.log('  4. Toggle account active/inactive status');
    console.log('  5. Create credentials for new staff (when added without user accounts)');
    
    console.log('\n🎯 To test the system:');
    console.log('  1. Start the development server: npm run dev');
    console.log('  2. Login as admin: admin@vanityhub.com / admin123');
    console.log('  3. Go to Settings > Staff Credentials');
    console.log('  4. Try the various credential management features');
    
  } catch (error) {
    console.error('❌ Error setting up demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

demoCredentialSystem();
