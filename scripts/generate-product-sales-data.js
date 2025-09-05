// Script to generate realistic product sales transactions for analytics
console.log('🛍️ Generating realistic product sales data...');

// Beauty salon product sales data based on real products
const productSalesData = [
  // Hair Care Products (High volume, moderate prices)
  {
    productId: 'prod-hair-001',
    productName: 'Hydrating Shampoo',
    category: 'Hair Care',
    price: 28.99,
    cost: 14.50,
    salesData: [
      { quantity: 3, date: new Date(Date.now() - 86400000 * 1) }, // Yesterday
      { quantity: 2, date: new Date(Date.now() - 86400000 * 2) }, // 2 days ago
      { quantity: 4, date: new Date(Date.now() - 86400000 * 3) }, // 3 days ago
      { quantity: 1, date: new Date(Date.now() - 86400000 * 5) }, // 5 days ago
      { quantity: 2, date: new Date(Date.now() - 86400000 * 7) }, // 1 week ago
      { quantity: 3, date: new Date(Date.now() - 86400000 * 10) }, // 10 days ago
      { quantity: 2, date: new Date(Date.now() - 86400000 * 14) }, // 2 weeks ago
    ]
  },
  {
    productId: 'prod-hair-002',
    productName: 'Keratin Hair Treatment',
    category: 'Hair Care',
    price: 65.00,
    cost: 32.50,
    salesData: [
      { quantity: 1, date: new Date(Date.now() - 86400000 * 1) },
      { quantity: 2, date: new Date(Date.now() - 86400000 * 3) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 6) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 9) },
      { quantity: 2, date: new Date(Date.now() - 86400000 * 12) },
    ]
  },
  {
    productId: 'prod-hair-003',
    productName: 'Professional Hair Serum',
    category: 'Hair Care',
    price: 45.99,
    cost: 23.00,
    salesData: [
      { quantity: 2, date: new Date(Date.now() - 86400000 * 2) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 4) },
      { quantity: 3, date: new Date(Date.now() - 86400000 * 8) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 11) },
    ]
  },
  {
    productId: 'prod-hair-004',
    productName: 'Color Protection Conditioner',
    category: 'Hair Care',
    price: 32.99,
    cost: 16.50,
    salesData: [
      { quantity: 2, date: new Date(Date.now() - 86400000 * 1) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 3) },
      { quantity: 2, date: new Date(Date.now() - 86400000 * 5) },
      { quantity: 3, date: new Date(Date.now() - 86400000 * 8) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 12) },
    ]
  },

  // Styling Products (Medium volume, lower prices)
  {
    productId: 'prod-style-001',
    productName: 'Volumizing Mousse',
    category: 'Styling',
    price: 24.99,
    cost: 12.50,
    salesData: [
      { quantity: 1, date: new Date(Date.now() - 86400000 * 2) },
      { quantity: 2, date: new Date(Date.now() - 86400000 * 6) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 10) },
    ]
  },
  {
    productId: 'prod-style-002',
    productName: 'Heat Protection Spray',
    category: 'Styling',
    price: 19.99,
    cost: 10.00,
    salesData: [
      { quantity: 2, date: new Date(Date.now() - 86400000 * 1) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 4) },
      { quantity: 2, date: new Date(Date.now() - 86400000 * 7) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 13) },
    ]
  },
  {
    productId: 'prod-style-003',
    productName: 'Hair Styling Gel',
    category: 'Styling',
    price: 16.99,
    cost: 8.50,
    salesData: [
      { quantity: 1, date: new Date(Date.now() - 86400000 * 3) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 9) },
    ]
  },

  // Skincare Products (Lower volume, higher prices)
  {
    productId: 'prod-skin-001',
    productName: 'Facial Cleanser',
    category: 'Skincare',
    price: 35.99,
    cost: 18.00,
    salesData: [
      { quantity: 1, date: new Date(Date.now() - 86400000 * 2) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 7) },
      { quantity: 2, date: new Date(Date.now() - 86400000 * 11) },
    ]
  },
  {
    productId: 'prod-skin-002',
    productName: 'Anti-Aging Serum',
    category: 'Skincare',
    price: 89.99,
    cost: 45.00,
    salesData: [
      { quantity: 1, date: new Date(Date.now() - 86400000 * 4) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 12) },
    ]
  },
  {
    productId: 'prod-skin-003',
    productName: 'Moisturizing Cream',
    category: 'Skincare',
    price: 42.99,
    cost: 21.50,
    salesData: [
      { quantity: 1, date: new Date(Date.now() - 86400000 * 1) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 6) },
      { quantity: 1, date: new Date(Date.now() - 86400000 * 10) },
    ]
  }
];

// Generate transactions from the sales data
function generateProductTransactions() {
  const transactions = [];
  let transactionId = 1000;

  productSalesData.forEach(product => {
    product.salesData.forEach(sale => {
      const totalAmount = sale.quantity * product.price;
      const totalCost = sale.quantity * product.cost;

      // Create inventory sale transaction
      const transaction = {
        id: `TX-PROD-${transactionId++}`,
        date: sale.date.toISOString(),
        type: 'inventory_sale',
        source: 'pos',
        status: 'completed',
        amount: totalAmount,
        paymentMethod: ['cash', 'credit_card', 'debit_card'][Math.floor(Math.random() * 3)],
        clientId: `client-${Math.floor(Math.random() * 100) + 1}`,
        clientName: `Client ${Math.floor(Math.random() * 100) + 1}`,
        staffId: ['1', '2', '3'][Math.floor(Math.random() * 3)],
        staffName: ['Emma Johnson', 'Sarah Wilson', 'Mike Davis'][Math.floor(Math.random() * 3)],
        location: 'loc1',
        category: 'Product Sale',
        description: `${product.productName} (Qty: ${sale.quantity})`,
        productId: product.productId,
        productName: product.productName,
        quantity: sale.quantity,
        costPrice: product.cost,
        items: [{
          id: product.productId,
          name: product.productName,
          quantity: sale.quantity,
          unitPrice: product.price,
          totalPrice: totalAmount,
          category: product.category
        }],
        reference: {
          type: 'pos_sale',
          id: `pos-${transactionId}`
        },
        metadata: {
          productId: product.productId,
          quantity: sale.quantity,
          unitPrice: product.price,
          costPrice: product.cost
        },
        createdAt: sale.date.toISOString(),
        updatedAt: sale.date.toISOString()
      };

      transactions.push(transaction);
    });
  });

  return transactions;
}

// Main execution
try {
  // Get existing transactions
  const existingTransactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]');
  
  // Generate new product transactions
  const newTransactions = generateProductTransactions();
  
  // Remove any existing product transactions to avoid duplicates
  const filteredExisting = existingTransactions.filter(t => 
    t.type !== 'inventory_sale' && !t.productId
  );
  
  // Combine transactions
  const allTransactions = [...filteredExisting, ...newTransactions];
  
  // Save to localStorage
  localStorage.setItem('vanity_transactions', JSON.stringify(allTransactions));
  
  console.log(`✅ Generated ${newTransactions.length} product sales transactions`);
  console.log(`📊 Total transactions now: ${allTransactions.length}`);
  
  // Calculate summary
  const totalRevenue = newTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalUnits = newTransactions.reduce((sum, t) => sum + t.quantity, 0);
  
  console.log(`💰 Total product revenue: $${totalRevenue.toFixed(2)}`);
  console.log(`📦 Total units sold: ${totalUnits}`);
  
  // Show top products by revenue
  const productRevenue = {};
  newTransactions.forEach(t => {
    if (!productRevenue[t.productName]) {
      productRevenue[t.productName] = 0;
    }
    productRevenue[t.productName] += t.amount;
  });
  
  const topProducts = Object.entries(productRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  console.log('\n🏆 Top 5 Products by Revenue:');
  topProducts.forEach(([name, revenue], index) => {
    console.log(`${index + 1}. ${name}: $${revenue.toFixed(2)}`);
  });
  
  return newTransactions;
  
} catch (error) {
  console.error('❌ Error generating product sales data:', error);
  throw error;
}
