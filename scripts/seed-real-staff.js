const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Real staff data for a salon
const realStaffData = [
  {
    name: "Sarah Mitchell",
    email: "sarah.mitchell@vanitysalon.com",
    phone: "+974 5555 1234",
    role: "stylist",
    status: "Active",
    homeService: true,
    employeeNumber: "9100",
    dateOfBirth: "15-03-90", // MM-DD-YY format
    qidValidity: "12-31-25",
    passportValidity: "06-15-30",
    medicalValidity: "03-20-24"
  },
  {
    name: "Ahmed Al-Rashid",
    email: "ahmed.rashid@vanitysalon.com",
    phone: "+974 5555 2345",
    role: "barber",
    status: "Active",
    homeService: false,
    employeeNumber: "9101",
    dateOfBirth: "22-07-88",
    qidValidity: "08-15-26",
    passportValidity: "11-20-29",
    medicalValidity: "05-10-24"
  },
  {
    name: "Maria Santos",
    email: "maria.santos@vanitysalon.com",
    phone: "+974 5555 3456",
    role: "nail_technician",
    status: "Active",
    homeService: true,
    employeeNumber: "9102",
    dateOfBirth: "08-12-92",
    qidValidity: "04-30-25",
    passportValidity: "09-12-31",
    medicalValidity: "01-15-25"
  },
  {
    name: "Fatima Al-Zahra",
    email: "fatima.zahra@vanitysalon.com",
    phone: "+974 5555 4567",
    role: "esthetician",
    status: "Active",
    homeService: false,
    employeeNumber: "9103",
    dateOfBirth: "30-09-85",
    qidValidity: "07-22-24",
    passportValidity: "02-28-28",
    medicalValidity: "12-05-24"
  },
  {
    name: "James Wilson",
    email: "james.wilson@vanitysalon.com",
    phone: "+974 5555 5678",
    role: "colorist",
    status: "Active",
    homeService: true,
    employeeNumber: "9104",
    dateOfBirth: "14-06-87",
    qidValidity: "10-18-25",
    passportValidity: "03-14-30",
    medicalValidity: "08-22-24"
  },
  {
    name: "Aisha Mohammed",
    email: "aisha.mohammed@vanitysalon.com",
    phone: "+974 5555 6789",
    role: "receptionist",
    status: "Active",
    homeService: false,
    employeeNumber: "9105",
    dateOfBirth: "25-11-95",
    qidValidity: "01-12-26",
    passportValidity: "07-08-32",
    medicalValidity: "04-18-25"
  }
];

// Function to map staff role to user role
function mapStaffRoleToUserRole(staffRole) {
  const roleMapping = {
    'super_admin': 'SUPER_ADMIN',
    'org_admin': 'ORG_ADMIN',
    'location_manager': 'LOCATION_MANAGER',
    'stylist': 'STAFF',
    'colorist': 'STAFF',
    'barber': 'STAFF',
    'nail_technician': 'STAFF',
    'esthetician': 'STAFF',
    'receptionist': 'STAFF'
  };
  return roleMapping[staffRole] || 'STAFF';
}

// Function to convert MM-DD-YY to Date object
function convertDateOfBirth(dateStr) {
  if (!dateStr) return null;
  
  const [month, day, year] = dateStr.split('-').map(Number);
  const fullYear = year < 50 ? 2000 + year : 1900 + year;
  return new Date(fullYear, month - 1, day);
}

async function seedRealStaff() {
  try {
    console.log('Starting to seed real staff data...');
    
    const seededStaff = [];
    
    for (const staffData of realStaffData) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: staffData.email }
        });
        
        if (existingUser) {
          console.log(`User ${staffData.email} already exists, skipping...`);
          continue;
        }
        
        // Create user
        const userRole = mapStaffRoleToUserRole(staffData.role);
        const user = await prisma.user.create({
          data: {
            email: staffData.email,
            password: 'temp123', // Temporary password
            role: userRole,
            isActive: staffData.status === 'Active'
          }
        });
        
        // Create staff member
        const staff = await prisma.staffMember.create({
          data: {
            userId: user.id,
            name: staffData.name,
            phone: staffData.phone,
            avatar: staffData.name.split(' ').map(n => n[0]).join(''),
            color: 'bg-blue-100 text-blue-800',
            jobRole: staffData.role,
            dateOfBirth: convertDateOfBirth(staffData.dateOfBirth),
            homeService: staffData.homeService,
            status: staffData.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
            employeeNumber: staffData.employeeNumber,
            qidValidity: staffData.qidValidity,
            passportValidity: staffData.passportValidity,
            medicalValidity: staffData.medicalValidity
          }
        });
        
        seededStaff.push(staff);
        console.log(`✅ Created staff member: ${staffData.name}`);
        
      } catch (error) {
        console.error(`❌ Error creating staff member ${staffData.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully seeded ${seededStaff.length} staff members!`);
    return seededStaff;
    
  } catch (error) {
    console.error('Error seeding staff:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedRealStaff()
    .then(() => {
      console.log('Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedRealStaff, realStaffData };
