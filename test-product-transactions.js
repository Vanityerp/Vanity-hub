// Test script to create appointments with products and complete them
// This will help verify that the In-Person Sales card shows product revenue correctly

console.log("=== TESTING PRODUCT TRANSACTIONS ===");

// Function to create test appointments with products
function createTestAppointmentsWithProducts() {
  console.log("Creating test appointments with products...");
  
  const testAppointments = [
    {
      id: `product-test-${Date.now()}-1`,
      clientId: "test-client-1",
      clientName: "Test Client 1",
      staffId: "1",
      staffName: "Emma Johnson",
      service: "Haircut & Style",
      serviceId: "1",
      date: new Date().toISOString(),
      duration: 60,
      status: "completed", // Already completed
      location: "loc1",
      price: 75,
      bookingReference: `PROD-TEST-${Date.now()}-1`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          updatedBy: "Staff"
        },
        {
          status: "confirmed",
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
          updatedBy: "Staff"
        },
        {
          status: "completed",
          timestamp: new Date().toISOString(),
          updatedBy: "Staff"
        }
      ],
      additionalServices: [
        { name: "Hair Wash", price: 15 }
      ],
      products: [
        { name: "Hair Shampoo", price: 25, quantity: 1 },
        { name: "Hair Conditioner", price: 20, quantity: 1 }
      ]
    },
    {
      id: `product-test-${Date.now()}-2`,
      clientId: "test-client-2",
      clientName: "Test Client 2",
      staffId: "2",
      staffName: "Sarah Wilson",
      service: "Color & Highlights",
      serviceId: "2",
      date: new Date().toISOString(),
      duration: 120,
      status: "completed", // Already completed
      location: "loc1",
      price: 150,
      bookingReference: `PROD-TEST-${Date.now()}-2`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          updatedBy: "Staff"
        },
        {
          status: "confirmed",
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          updatedBy: "Staff"
        },
        {
          status: "completed",
          timestamp: new Date().toISOString(),
          updatedBy: "Staff"
        }
      ],
      additionalServices: [],
      products: [
        { name: "Hair Color", price: 35, quantity: 2 },
        { name: "Hair Treatment", price: 40, quantity: 1 }
      ]
    }
  ];

  // Get existing appointments
  const existingAppointments = JSON.parse(localStorage.getItem('vanity_appointments') || '[]');
  
  // Add test appointments
  const updatedAppointments = [...existingAppointments, ...testAppointments];
  
  // Save to localStorage
  localStorage.setItem('vanity_appointments', JSON.stringify(updatedAppointments));
  
  console.log("Test appointments with products created:", testAppointments.length);
  console.log("Total appointments now:", updatedAppointments.length);
  
  return testAppointments;
}

// Function to check current transactions
function checkCurrentTransactions() {
  console.log("=== CHECKING CURRENT TRANSACTIONS ===");
  
  const transactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]');
  console.log("Total transactions:", transactions.length);
  
  const calendarTransactions = transactions.filter(t => t.source === 'calendar');
  console.log("Calendar transactions:", calendarTransactions.length);
  
  const serviceTransactions = calendarTransactions.filter(t => t.type === 'service_sale');
  const productTransactions = calendarTransactions.filter(t => t.type === 'product_sale');
  
  console.log("Calendar service transactions:", serviceTransactions.length);
  console.log("Calendar product transactions:", productTransactions.length);
  
  const serviceRevenue = serviceTransactions.reduce((sum, t) => sum + t.amount, 0);
  const productRevenue = productTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  console.log("Calendar service revenue:", serviceRevenue);
  console.log("Calendar product revenue:", productRevenue);
  
  return {
    total: transactions.length,
    calendar: calendarTransactions.length,
    services: serviceTransactions.length,
    products: productTransactions.length,
    serviceRevenue,
    productRevenue
  };
}

// Function to trigger transaction creation for completed appointments
function triggerTransactionCreation() {
  console.log("=== TRIGGERING TRANSACTION CREATION ===");
  
  // This would normally be done by the appointment completion process
  // For testing, we'll manually trigger it by dispatching a custom event
  window.dispatchEvent(new CustomEvent('refreshTransactions'));
  
  // Also trigger a page refresh to ensure the stats cards update
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// Run the test
console.log("Starting product transaction test...");

// Check current state
const beforeState = checkCurrentTransactions();
console.log("Before state:", beforeState);

// Create test appointments
const testAppointments = createTestAppointmentsWithProducts();

// Check state after creating appointments
setTimeout(() => {
  const afterState = checkCurrentTransactions();
  console.log("After creating appointments:", afterState);
  
  // Trigger transaction creation
  triggerTransactionCreation();
}, 1000);

console.log("Test script completed. Check the dashboard in a few seconds to see updated revenue.");
