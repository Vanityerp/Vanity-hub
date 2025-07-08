// Test script to create appointments with proper service information
// and verify they display correctly in the calendar

console.log("🧪 Testing Service Display in Appointment Cards");

// Create test appointments with clear service information
const testAppointments = [
  {
    id: `test-service-${Date.now()}-1`,
    bookingReference: `VH-${Date.now().toString().slice(-6)}`,
    clientId: "test-client-1",
    clientName: "Jane Smith",
    staffId: "1",
    staffName: "Emma Johnson",
    service: "Haircut & Style",
    serviceId: "1",
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    duration: 60,
    location: "loc1",
    price: 75,
    status: "confirmed",
    notes: "Test appointment for service display",
    statusHistory: [
      {
        status: "confirmed",
        timestamp: new Date().toISOString(),
        updatedBy: "Test Script"
      }
    ],
    type: "appointment",
    additionalServices: [],
    products: [],
    isReflected: false // Ensure this is NOT a reflected appointment
  },
  {
    id: `test-service-${Date.now()}-2`,
    bookingReference: `VH-${Date.now().toString().slice(-6)}`,
    clientId: "test-client-2",
    clientName: "Michael Chen",
    staffId: "2",
    staffName: "Maria Santos",
    service: "Color & Highlights",
    serviceId: "2",
    date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
    duration: 120,
    location: "loc1",
    price: 150,
    status: "confirmed",
    notes: "Test appointment for service display",
    statusHistory: [
      {
        status: "confirmed",
        timestamp: new Date().toISOString(),
        updatedBy: "Test Script"
      }
    ],
    type: "appointment",
    additionalServices: [],
    products: [],
    isReflected: false // Ensure this is NOT a reflected appointment
  }
];

// Function to add test appointments
function addTestAppointments() {
  try {
    // Get existing appointments
    const existingAppointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    
    // Remove any existing test appointments
    const filteredAppointments = existingAppointments.filter(apt => 
      !apt.id.includes('test-service-')
    );
    
    // Add new test appointments
    const updatedAppointments = [...filteredAppointments, ...testAppointments];
    
    // Save to localStorage
    localStorage.setItem('vanity_appointments', JSON.stringify(updatedAppointments));
    
    console.log("✅ Test appointments created successfully!");
    console.log(`📊 Total appointments: ${updatedAppointments.length}`);
    console.log("📋 Test appointments:");
    
    testAppointments.forEach((apt, index) => {
      console.log(`  ${index + 1}. ${apt.clientName} - ${apt.service} at ${new Date(apt.date).toLocaleTimeString()}`);
    });
    
    return testAppointments;
  } catch (error) {
    console.error("❌ Error creating test appointments:", error);
    return [];
  }
}

// Function to verify appointments
function verifyAppointments() {
  try {
    const allAppointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
    
    console.log("\n🔍 Verifying all appointments:");
    console.log(`Total appointments: ${allAppointments.length}`);
    
    const nonReflected = allAppointments.filter(apt => !apt.isReflected);
    const reflected = allAppointments.filter(apt => apt.isReflected);
    
    console.log(`Non-reflected appointments: ${nonReflected.length}`);
    console.log(`Reflected appointments: ${reflected.length}`);
    
    console.log("\n📋 Non-reflected appointments (should show in booking summary):");
    nonReflected.forEach((apt, index) => {
      console.log(`  ${index + 1}. ${apt.clientName} - Service: "${apt.service}" - Location: ${apt.location}`);
    });
    
    if (reflected.length > 0) {
      console.log("\n🔒 Reflected appointments (should be hidden from booking summary):");
      reflected.forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.clientName} - Service: "${apt.service}" - Location: ${apt.location}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error verifying appointments:", error);
  }
}

// Run the test
if (typeof window !== 'undefined') {
  addTestAppointments();
  verifyAppointments();
  
  console.log("\n🎯 Next steps:");
  console.log("1. Refresh the appointments page");
  console.log("2. Check that service names are visible in appointment cards");
  console.log("3. Verify that reflected appointments are hidden from booking summary");
} else {
  console.log("❌ This script must be run in a browser environment");
}
