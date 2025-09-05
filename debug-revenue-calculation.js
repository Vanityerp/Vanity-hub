// Debug script to analyze transaction data and revenue calculation
console.log('🔍 Starting revenue calculation debug...');

// Get transactions from localStorage
const storedTransactions = localStorage.getItem('vanity_transactions');
if (!storedTransactions) {
  console.log('❌ No transactions found in localStorage');
  return;
}

try {
  const transactions = JSON.parse(storedTransactions);
  console.log(`📊 Total transactions: ${transactions.length}`);

  // Count by transaction type
  const typeCount = {};
  transactions.forEach(t => {
    typeCount[t.type] = (typeCount[t.type] || 0) + 1;
  });
  console.log('📊 Transactions by type:', typeCount);

  // Count by transaction source
  const sourceCount = {};
  transactions.forEach(t => {
    sourceCount[t.source] = (sourceCount[t.source] || 0) + 1;
  });
  console.log('📊 Transactions by source:', sourceCount);

  // Calculate service revenue
  const serviceTransactions = transactions.filter(t => 
    (t.type === 'income' || t.type === 'service_sale') && 
    t.source !== 'inventory' && 
    t.status !== 'cancelled'
  );
  const serviceRevenue = serviceTransactions.reduce((sum, t) => sum + t.amount, 0);
  console.log(`📊 Service transactions: ${serviceTransactions.length}`);
  console.log(`📊 Service revenue: ${serviceRevenue}`);
  
  // Log service transactions for inspection
  console.log('📊 Service transactions details:');
  serviceTransactions.forEach(t => {
    console.log(`- ${t.id}: ${t.description}, ${t.amount}, type=${t.type}, source=${t.source}`);
  });

  // Calculate product revenue
  const productTransactions = transactions.filter(t => 
    (t.type === 'inventory_sale' || t.type === 'product_sale') && 
    t.status !== 'cancelled'
  );
  const productRevenue = productTransactions.reduce((sum, t) => sum + t.amount, 0);
  console.log(`📊 Product transactions: ${productTransactions.length}`);
  console.log(`📊 Product revenue: ${productRevenue}`);

  // Calculate in-person service revenue
  const inPersonServiceTransactions = transactions.filter(t =>
    (t.source === 'pos' || t.source === 'calendar') &&
    (t.type === 'service_sale' || t.type === 'consolidated_sale' || (t.items && t.items.some(i => i.type === 'service'))) &&
    t.status !== 'cancelled'
  );
  const inPersonServices = inPersonServiceTransactions.reduce((sum, t) => {
    if (t.items && Array.isArray(t.items)) {
      return sum + t.items.filter(i => i.type === 'service').reduce((s, i) => s + (i.totalPrice || 0), 0);
    }
    return sum + (t.type === 'service_sale' ? t.amount : 0);
  }, 0);
  console.log(`📊 In-person service transactions: ${inPersonServiceTransactions.length}`);
  console.log(`📊 In-person service revenue: ${inPersonServices}`);

  // Calculate home service revenue
  const homeServiceTransactions = transactions.filter(t =>
    t.source === 'home_service' &&
    t.status !== 'cancelled'
  );
  const homeServiceRevenue = homeServiceTransactions.reduce((sum, t) => sum + t.amount, 0);
  console.log(`📊 Home service transactions: ${homeServiceTransactions.length}`);
  console.log(`📊 Home service revenue: ${homeServiceRevenue}`);

  console.log('🔍 Revenue calculation debug complete');
} catch (error) {
  console.error('❌ Error analyzing transactions:', error);
}