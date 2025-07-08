// Test script to verify staff save functionality
const testStaffSave = async () => {
  const testData = {
    id: "test-staff-1",
    name: "Test Staff",
    email: "test@example.com",
    phone: "123-456-7890",
    role: "stylist",
    locations: [],
    status: "Active",
    homeService: false,
    employeeNumber: "9100",
    dateOfBirth: "01-15-95", // MM-DD-YY format
    qidValidity: "12-31-25",
    passportValidity: "06-15-30",
    medicalValidity: "03-20-24",
    profileImage: "",
    profileImageType: ""
  };

  try {
    const response = await fetch('/api/staff/test-staff-1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Save test result:', result);
    
    if (response.ok) {
      console.log('✅ Staff save test PASSED');
      console.log('Date of birth saved as:', result.staff?.dateOfBirth);
    } else {
      console.log('❌ Staff save test FAILED:', result.error);
    }
  } catch (error) {
    console.log('❌ Staff save test ERROR:', error.message);
  }
};

// Run test if in browser environment
if (typeof window !== 'undefined') {
  console.log('Running staff save test...');
  testStaffSave();
}

module.exports = { testStaffSave };
