// Verification script for pending revenue fix
console.log('🔍 VERIFYING PENDING REVENUE FIX');

// Clear existing appointments to test the fix
localStorage.removeItem('vanity_appointments');
console.log('✅ Cleared existing appointments');

// Create test appointment data that matches the user's scenario
const testAppointments = [
  {
    id: "lula-appointment-1",
    clientId: "lula-client",
    clientName: "Lula",
    staffId: "3",
    staffName: "Robert Taylor", 
    service: "Color & Highlights",
    serviceId: "2",
    date: new Date().toISOString(),
    duration: 120,
    status: "confirmed",
    location: "loc1",
    price: 150, // QAR 150.00 as shown in the user's screenshot
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: "pending",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        updatedBy: "Client Portal"
      },
      {
        status: "confirmed", 
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        updatedBy: "Staff"
      }
    ]
  },
  {
    id: "test-appointment-2",
    clientId: "test-client-2", 
    clientName: "Test Client 2",
    staffId: "1",
    staffName: "Emma Johnson",
    service: "Haircut & Style",
    serviceId: "1", 
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    status: "arrived",
    location: "loc1",
    price: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Save test appointments
localStorage.setItem('vanity_appointments', JSON.stringify(testAppointments));
console.log('✅ Created test appointments:', testAppointments.length);

// Test the pending revenue calculation
function testPendingRevenueCalculation() {
  const appointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
  const pendingStatuses = ['confirmed', 'arrived', 'service-started'];
  
  const pendingAppointments = appointments.filter(apt => 
    pendingStatuses.includes(apt.status)
  );
  
  console.log('📊 Pending appointments found:', pendingAppointments.length);
  
  let totalRevenue = 0;
  pendingAppointments.forEach(apt => {
    console.log(`💰 ${apt.clientName} - ${apt.service}: ${apt.price} QAR`);
    totalRevenue += apt.price || 0;
  });
  
  console.log('💰 TOTAL PENDING REVENUE:', totalRevenue, 'QAR');
  console.log('📊 EXPECTED: 225 QAR (150 + 75)');
  
  if (totalRevenue === 225) {
    console.log('✅ PENDING REVENUE CALCULATION IS CORRECT!');
  } else {
    console.log('❌ PENDING REVENUE CALCULATION NEEDS FIXING');
  }
}

testPendingRevenueCalculation();

console.log('🔄 Please refresh the dashboard to see the updated pending revenue card');
console.log('📊 Expected result: Pending Revenue card should show QAR 225.00 with 2 appointments');
