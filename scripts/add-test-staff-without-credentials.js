const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestStaffWithoutCredentials() {
  try {
    console.log('🔄 Adding test staff members without credentials...');
    
    // Get all locations
    const locations = await prisma.location.findMany({
      where: { isActive: true }
    });
    
    console.log(`🏢 Found ${locations.length} active locations`);
    
    // Create one staff member per location without credentials
    const testStaffData = [
      {
        name: 'Ahmed Al-Mansouri',
        jobRole: 'Barber',
        employeeNumber: 'VH021',
        qidNumber: '28921234567',
        passportNumber: 'QA1234567',
        locationIndex: 0 // D-ring road
      },
      {
        name: 'Leila Kassem',
        jobRole: 'Esthetician',
        employeeNumber: 'VH022',
        qidNumber: '28922345678',
        passportNumber: 'LB2345678',
        locationIndex: 1 // Muaither
      },
      {
        name: 'Omar Hassan',
        jobRole: 'Massage Therapist',
        employeeNumber: 'VH023',
        qidNumber: '28923456789',
        passportNumber: 'EG3456789',
        locationIndex: 2 // Medinat Khalifa
      },
      {
        name: 'Nadia Al-Rashid',
        jobRole: 'Mobile Stylist',
        employeeNumber: 'VH024',
        qidNumber: '28924567890',
        passportNumber: 'QA4567890',
        locationIndex: 3 // Home service
      },
      {
        name: 'Khalid Mahmoud',
        jobRole: 'Customer Service',
        employeeNumber: 'VH025',
        qidNumber: '28925678901',
        passportNumber: 'JO5678901',
        locationIndex: 4 // Online store
      }
    ];
    
    const createdStaff = [];
    
    for (const staffData of testStaffData) {
      // Check if staff member already exists
      const existingStaff = await prisma.staffMember.findFirst({
        where: { employeeNumber: staffData.employeeNumber }
      });
      
      if (existingStaff) {
        console.log(`⚠️ Staff member ${staffData.name} already exists, skipping...`);
        continue;
      }
      
      // Create staff member WITHOUT user account (no credentials)
      const staffMember = await prisma.staffMember.create({
        data: {
          name: staffData.name,
          phone: `+974 5555 ${Math.floor(Math.random() * 9000) + 1000}`,
          jobRole: staffData.jobRole,
          employeeNumber: staffData.employeeNumber,
          qidNumber: staffData.qidNumber,
          passportNumber: staffData.passportNumber,
          qidValidity: '12-31-26',
          passportValidity: '06-30-28',
          medicalValidity: '03-15-25',
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
          homeService: staffData.locationIndex === 3, // Home service location
          status: 'ACTIVE',
          dateOfBirth: new Date(1985 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          // Note: userId is intentionally left null (no credentials)
        }
      });
      
      // Assign to location
      await prisma.staffLocation.create({
        data: {
          staffId: staffMember.id,
          locationId: locations[staffData.locationIndex].id,
          isActive: true
        }
      });
      
      createdStaff.push({
        staff: staffMember,
        location: locations[staffData.locationIndex]
      });
      
      console.log(`✅ Created staff member: ${staffData.name} at ${locations[staffData.locationIndex].name}`);
    }
    
    console.log(`\n🎉 Successfully created ${createdStaff.length} staff members without credentials!`);
    console.log('\n📋 Summary:');
    createdStaff.forEach(({ staff, location }) => {
      console.log(`  - ${staff.name} (${staff.employeeNumber}) - ${staff.jobRole} at ${location.name}`);
    });
    
    console.log('\n💡 These staff members can now be used to test the credential creation functionality.');
    
  } catch (error) {
    console.error('❌ Error adding test staff:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestStaffWithoutCredentials();
