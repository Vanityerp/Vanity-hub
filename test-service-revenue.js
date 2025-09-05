// Test script to verify service revenue tracking
console.log('🔧 TESTING SERVICE REVENUE TRACKING');

// Simulate localStorage data for testing
const mockTransactions = [
  {
    id: "TX-SERVICE-1",
    date: new Date().toISOString(),
    clientId: "client-1",
    clientName: "Test Client 1",
    staffId: "staff-1",
    staffName: "Emma Johnson",
    type: "service_sale",
    category: "Appointment Service",
    description: "Completed appointment - Haircut & Style",
    amount: 75.00,
    paymentMethod: "cash",
    status: "completed",
    location: "loc1",
    source: "calendar",
    reference: {
      type: "appointment",
      id: "apt-1"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "TX-SERVICE-2",
    date: new Date().toISOString(),
    clientId: "client-2",
    clientName: "Test Client 2",
    staffId: "staff-2",
    staffName: "Michael Chen",
    type: "service_sale",
    category: "Appointment Service",
    description: "Completed appointment - Color & Highlights",
    amount: 150.00,
    paymentMethod: "credit_card",
    status: "completed",
    location: "loc1",
    source: "calendar",
    reference: {
      type: "appointment",
      id: "apt-2"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "TX-PRODUCT-1",
    date: new Date().toISOString(),
    clientId: "client-3",
    clientName: "Test Client 3",
    type: "product_sale",
    category: "Online Product Sale",
    description: "Client Portal Order - Hair Serum",
    amount: 89.99,
    paymentMethod: "credit_card",
    status: "completed",
    location: "online",
    source: "client_portal",
    reference: {
      type: "client_portal_order",
      id: "order-1"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

console.log('📊 MOCK TRANSACTION DATA:');
console.log('- Total transactions:', mockTransactions.length);
console.log('- Service transactions:', mockTransactions.filter(tx => tx.type === 'service_sale').length);
console.log('- Product transactions:', mockTransactions.filter(tx => tx.type === 'product_sale').length);

// Calculate expected revenue
const serviceRevenue = mockTransactions
  .filter(tx => tx.type === 'service_sale' && tx.status === 'completed')
  .reduce((sum, tx) => sum + tx.amount, 0);

const productRevenue = mockTransactions
  .filter(tx => tx.type === 'product_sale' && tx.status === 'completed')
  .reduce((sum, tx) => sum + tx.amount, 0);

const totalRevenue = serviceRevenue + productRevenue;

console.log('📊 EXPECTED REVENUE CALCULATIONS:');
console.log('- Service revenue:', serviceRevenue);
console.log('- Product revenue:', productRevenue);
console.log('- Total revenue:', totalRevenue);

// Test analytics service logic
const testAnalyticsLogic = (transactions) => {
  console.log('🔧 TESTING ANALYTICS SERVICE LOGIC:');
  
  // Simulate the analytics service filtering
  const filteredTransactions = transactions.filter(t => t.status !== 'cancelled');
  
  // Service revenue calculation (matching the analytics service)
  const serviceTransactions = filteredTransactions.filter(t => 
    (t.type === 'income' || t.type === 'service_sale') &&
    t.source !== 'inventory' &&
    t.status !== 'cancelled'
  );

  const productTransactions = filteredTransactions.filter(t => 
    (t.type === 'inventory_sale' || t.type === 'product_sale') &&
    t.status !== 'cancelled'
  );

  const calculatedServiceRevenue = serviceTransactions.reduce((sum, t) => sum + t.amount, 0);
  const calculatedProductRevenue = productTransactions.reduce((sum, t) => sum + t.amount, 0);
  const calculatedTotalRevenue = calculatedServiceRevenue + calculatedProductRevenue;

  console.log('🔧 ANALYTICS SERVICE SIMULATION:');
  console.log('- Filtered transactions:', filteredTransactions.length);
  console.log('- Service transactions found:', serviceTransactions.length);
  console.log('- Product transactions found:', productTransactions.length);
  console.log('- Calculated service revenue:', calculatedServiceRevenue);
  console.log('- Calculated product revenue:', calculatedProductRevenue);
  console.log('- Calculated total revenue:', calculatedTotalRevenue);

  console.log('🔧 SERVICE TRANSACTION DETAILS:');
  serviceTransactions.forEach((tx, index) => {
    console.log(`  ${index + 1}. ${tx.id}: ${tx.amount} (${tx.source} -> ${tx.type})`);
  });

  console.log('🔧 PRODUCT TRANSACTION DETAILS:');
  productTransactions.forEach((tx, index) => {
    console.log(`  ${index + 1}. ${tx.id}: ${tx.amount} (${tx.source} -> ${tx.type})`);
  });

  return {
    serviceRevenue: calculatedServiceRevenue,
    productRevenue: calculatedProductRevenue,
    totalRevenue: calculatedTotalRevenue
  };
};

// Run the test
const analyticsResult = testAnalyticsLogic(mockTransactions);

console.log('✅ TEST RESULTS:');
console.log('- Expected service revenue:', serviceRevenue);
console.log('- Analytics service revenue:', analyticsResult.serviceRevenue);
console.log('- Service revenue match:', serviceRevenue === analyticsResult.serviceRevenue ? '✅' : '❌');
console.log('- Expected total revenue:', totalRevenue);
console.log('- Analytics total revenue:', analyticsResult.totalRevenue);
console.log('- Total revenue match:', totalRevenue === analyticsResult.totalRevenue ? '✅' : '❌');

if (serviceRevenue === analyticsResult.serviceRevenue && totalRevenue === analyticsResult.totalRevenue) {
  console.log('🎉 SERVICE REVENUE TRACKING LOGIC IS WORKING CORRECTLY');
  console.log('💡 The issue might be:');
  console.log('   1. No service transactions exist in the actual data');
  console.log('   2. Service transactions are not being created when appointments are completed');
  console.log('   3. Service transactions have incorrect type or source values');
} else {
  console.log('❌ SERVICE REVENUE TRACKING LOGIC HAS ISSUES');
  console.log('💡 Check the analytics service filtering logic');
}

console.log('\n📋 NEXT STEPS:');
console.log('1. Check if any service transactions exist in localStorage');
console.log('2. Test appointment completion to verify transaction creation');
console.log('3. Use the debug page to create test service transactions');
console.log('4. Verify the dashboard displays the service revenue correctly');
