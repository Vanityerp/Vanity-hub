// Test script to verify in-person sales revenue calculation fix
console.log('🧪 TESTING IN-PERSON SALES REVENUE CALCULATION FIX');

// Clear existing data for clean test
localStorage.removeItem('vanity_appointments');
localStorage.removeItem('vanity_transactions');
console.log('✅ Cleared existing data');

// Create test appointments with completed status
const testAppointments = [
  {
    id: "completed-apt-1",
    clientId: "client-1",
    clientName: "John Doe",
    staffId: "1",
    staffName: "Emma Johnson",
    service: "Haircut & Style",
    serviceId: "1",
    date: new Date().toISOString(),
    duration: 60,
    status: "completed",
    location: "loc1",
    price: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: "pending",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        updatedBy: "Staff"
      },
      {
        status: "confirmed",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        updatedBy: "Staff"
      },
      {
        status: "completed",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        updatedBy: "Staff"
      }
    ]
  },
  {
    id: "completed-apt-2",
    clientId: "client-2",
    clientName: "Jane Smith",
    staffId: "2",
    staffName: "Michael Chen",
    service: "Color & Highlights",
    serviceId: "2",
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    duration: 120,
    status: "completed",
    location: "loc1",
    price: 150,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 82800000).toISOString(),
    statusHistory: [
      {
        status: "pending",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        updatedBy: "Client Portal"
      },
      {
        status: "confirmed",
        timestamp: new Date(Date.now() - 84600000).toISOString(),
        updatedBy: "Staff"
      },
      {
        status: "completed",
        timestamp: new Date(Date.now() - 82800000).toISOString(),
        updatedBy: "Staff"
      }
    ]
  },
  {
    id: "pending-apt-1",
    clientId: "client-3",
    clientName: "Bob Wilson",
    staffId: "1",
    staffName: "Emma Johnson",
    service: "Blowout",
    serviceId: "3",
    date: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    duration: 45,
    status: "confirmed",
    location: "loc1",
    price: 65,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Create corresponding transactions for completed appointments
const testTransactions = [
  {
    id: "tx-completed-apt-1",
    date: new Date().toISOString(),
    clientId: "client-1",
    clientName: "John Doe",
    staffId: "1",
    staffName: "Emma Johnson",
    type: "service_sale",
    category: "Appointment Service",
    description: "Completed appointment - Haircut & Style",
    amount: 75,
    paymentMethod: "cash",
    status: "completed",
    location: "loc1",
    source: "calendar",
    reference: {
      type: "appointment",
      id: "completed-apt-1"
    },
    items: [
      {
        id: "service-1",
        name: "Haircut & Style",
        quantity: 1,
        unitPrice: 75,
        totalPrice: 75,
        category: "Service"
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "tx-completed-apt-2",
    date: new Date(Date.now() - 86400000).toISOString(),
    clientId: "client-2",
    clientName: "Jane Smith",
    staffId: "2",
    staffName: "Michael Chen",
    type: "service_sale",
    category: "Appointment Service",
    description: "Completed appointment - Color & Highlights",
    amount: 150,
    paymentMethod: "credit_card",
    status: "completed",
    location: "loc1",
    source: "calendar",
    reference: {
      type: "appointment",
      id: "completed-apt-2"
    },
    items: [
      {
        id: "service-2",
        name: "Color & Highlights",
        quantity: 1,
        unitPrice: 150,
        totalPrice: 150,
        category: "Service"
      }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// Save test data
localStorage.setItem('vanity_appointments', JSON.stringify(testAppointments));
localStorage.setItem('vanity_transactions', JSON.stringify(testTransactions));

console.log('✅ Created test data:');
console.log('- Appointments:', testAppointments.length);
console.log('- Completed appointments:', testAppointments.filter(apt => apt.status === 'completed').length);
console.log('- Transactions:', testTransactions.length);

// Calculate expected values
const completedAppointments = testAppointments.filter(apt => apt.status === 'completed');
const expectedCompletedRevenue = completedAppointments.reduce((sum, apt) => sum + apt.price, 0);
const actualTransactionRevenue = testTransactions.reduce((sum, tx) => sum + tx.amount, 0);

console.log('📊 EXPECTED RESULTS:');
console.log('- Completed appointment revenue:', expectedCompletedRevenue, 'QAR');
console.log('- In-person transaction revenue:', actualTransactionRevenue, 'QAR');
console.log('- Should match:', expectedCompletedRevenue === actualTransactionRevenue ? '✅' : '❌');

console.log('\n🔄 Please refresh the dashboard to see the updated in-person sales card');
console.log('📊 Expected in-person sales: QAR 225.00 (75 + 150)');
console.log('📊 Expected pending revenue: QAR 65.00 (1 confirmed appointment)');

// Test the debug function
console.log('\n🧪 Running debug analysis...');
setTimeout(() => {
  if (typeof debugInPersonSales === 'function') {
    debugInPersonSales();
  } else {
    console.log('Debug function not available. Run debug-in-person-sales.js first.');
  }
}, 1000);
