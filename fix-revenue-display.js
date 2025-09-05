// This script should be run in the browser console on the dashboard page
// It will fix the service and product revenue display in the Total Revenue card

function fixRevenueDisplay() {
  console.log('🔧 Starting revenue display fix...');

  // Get transactions from localStorage
  const storedTransactions = localStorage.getItem('vanity_transactions');
  if (!storedTransactions) {
    console.log('❌ No transactions found in localStorage');
    return;
  }

  try {
    const transactions = JSON.parse(storedTransactions);
    console.log(`📊 Total transactions before fix: ${transactions.length}`);

    // Count by transaction type before fix
    const typeCountBefore = {};
    transactions.forEach(t => {
      typeCountBefore[t.type] = (typeCountBefore[t.type] || 0) + 1;
    });
    console.log('📊 Transactions by type before fix:', typeCountBefore);

    // Fix transactions
    let fixedCount = 0;
    const fixedTransactions = transactions.map(transaction => {
      // Check if this is a service transaction but not properly categorized
      if ((transaction.category === 'Service' || transaction.category === 'service') && 
          transaction.type === 'income') {
        
        // Fix: Change type to service_sale
        transaction.type = 'service_sale';
        fixedCount++;
        console.log(`🔧 Fixed transaction ${transaction.id}: "${transaction.description}" - Changed type to service_sale`);
      }
      
      // Check for transactions with service-related descriptions
      if (transaction.description && 
          (transaction.description.toLowerCase().includes('haircut') ||
           transaction.description.toLowerCase().includes('color') ||
           transaction.description.toLowerCase().includes('style') ||
           transaction.description.toLowerCase().includes('treatment') ||
           transaction.description.toLowerCase().includes('manicure') ||
           transaction.description.toLowerCase().includes('pedicure') ||
           transaction.description.toLowerCase().includes('facial') ||
           transaction.description.toLowerCase().includes('massage')) && 
          transaction.type === 'income') {
        
        // Fix: Change type to service_sale
        transaction.type = 'service_sale';
        fixedCount++;
        console.log(`🔧 Fixed transaction ${transaction.id}: "${transaction.description}" - Changed type to service_sale`);
      }
      
      // Check for transactions with "Service" in the description
      if (transaction.description && 
          transaction.description.toLowerCase().includes('service') && 
          transaction.type === 'income') {
        
        // Fix: Change type to service_sale
        transaction.type = 'service_sale';
        fixedCount++;
        console.log(`🔧 Fixed transaction ${transaction.id}: "${transaction.description}" - Changed type to service_sale`);
      }
      
      // Check for product-related transactions
      if ((transaction.category === 'Product' || transaction.category === 'product') && 
          transaction.type === 'income') {
        
        // Fix: Change type to product_sale
        transaction.type = 'product_sale';
        fixedCount++;
        console.log(`🔧 Fixed transaction ${transaction.id}: "${transaction.description}" - Changed type to product_sale`);
      }
      
      // Check for transactions with product-related descriptions
      if (transaction.description && 
          (transaction.description.toLowerCase().includes('product') ||
           transaction.description.toLowerCase().includes('shampoo') ||
           transaction.description.toLowerCase().includes('conditioner') ||
           transaction.description.toLowerCase().includes('gel') ||
           transaction.description.toLowerCase().includes('spray') ||
           transaction.description.toLowerCase().includes('cream')) && 
          transaction.type === 'income') {
        
        // Fix: Change type to product_sale
        transaction.type = 'product_sale';
        fixedCount++;
        console.log(`🔧 Fixed transaction ${transaction.id}: "${transaction.description}" - Changed type to product_sale`);
      }
      
      // Check for consolidated transactions with service items but not properly categorized
      if (transaction.items && 
          Array.isArray(transaction.items) && 
          transaction.items.some(item => item.type === 'service') &&
          transaction.items.some(item => item.type === 'product') &&
          transaction.type !== 'consolidated_sale') {
        
        // Fix: Change type to consolidated_sale
        transaction.type = 'consolidated_sale';
        fixedCount++;
        console.log(`🔧 Fixed transaction ${transaction.id}: "${transaction.description}" - Changed type to consolidated_sale`);
      }
      
      // Check for transactions with service items but not properly categorized
      if (transaction.items && 
          Array.isArray(transaction.items) && 
          transaction.items.some(item => item.type === 'service') &&
          !transaction.items.some(item => item.type === 'product') &&
          transaction.type !== 'service_sale') {
        
        // Fix: Change type to service_sale
        transaction.type = 'service_sale';
        fixedCount++;
        console.log(`🔧 Fixed transaction ${transaction.id}: "${transaction.description}" - Changed type to service_sale`);
      }
      
      // Check for transactions with product items but not properly categorized
      if (transaction.items && 
          Array.isArray(transaction.items) && 
          transaction.items.some(item => item.type === 'product') &&
          !transaction.items.some(item => item.type === 'service') &&
          transaction.type !== 'product_sale' && 
          transaction.type !== 'inventory_sale') {
        
        // Fix: Change type to product_sale
        transaction.type = 'product_sale';
        fixedCount++;
        console.log(`🔧 Fixed transaction ${transaction.id}: "${transaction.description}" - Changed type to product_sale`);
      }
      
      return transaction;
    });

    // Count by transaction type after fix
    const typeCountAfter = {};
    fixedTransactions.forEach(t => {
      typeCountAfter[t.type] = (typeCountAfter[t.type] || 0) + 1;
    });
    console.log('📊 Transactions by type after fix:', typeCountAfter);
    
    // Save fixed transactions back to localStorage
    localStorage.setItem('vanity_transactions', JSON.stringify(fixedTransactions));
    console.log(`🔧 Fixed ${fixedCount} transactions and saved to localStorage`);
    
    // Calculate service revenue after fix
    const serviceTransactions = fixedTransactions.filter(t => 
      (t.type === 'service_sale' || 
       (t.type === 'consolidated_sale' && t.items && Array.isArray(t.items) && t.items.some(i => i.type === 'service')) ||
       (t.items && Array.isArray(t.items) && t.items.some(i => i.type === 'service'))) && 
      t.status !== 'cancelled'
    );
    
    const serviceRevenue = serviceTransactions.reduce((sum, t) => {
      // For consolidated transactions with items, only count the service items
      if (t.type === 'consolidated_sale' && t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'service').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      // For service-only transactions, count the full amount
      else if (t.type === 'service_sale') {
        return sum + t.amount;
      }
      // For other transactions with service items, count those items
      else if (t.items && Array.isArray(t.items) && t.items.some(i => i.type === 'service')) {
        return sum + t.items.filter(i => i.type === 'service').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      return sum;
    }, 0);
    
    console.log(`📊 Service transactions after fix: ${serviceTransactions.length}`);
    console.log(`📊 Service revenue after fix: ${serviceRevenue}`);
    
    // Calculate product revenue after fix
    const productTransactions = fixedTransactions.filter(t => 
      (t.type === 'product_sale' || 
       t.type === 'inventory_sale' || 
       (t.type === 'consolidated_sale' && t.items && Array.isArray(t.items) && t.items.some(i => i.type === 'product')) ||
       (t.items && Array.isArray(t.items) && t.items.some(i => i.type === 'product'))) && 
      t.status !== 'cancelled'
    );
    
    const productRevenue = productTransactions.reduce((sum, t) => {
      // For consolidated transactions with items, only count the product items
      if (t.type === 'consolidated_sale' && t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'product').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      // For product-only transactions, count the full amount
      else if (t.type === 'product_sale' || t.type === 'inventory_sale') {
        return sum + t.amount;
      }
      // For other transactions with product items, count those items
      else if (t.items && Array.isArray(t.items) && t.items.some(i => i.type === 'product')) {
        return sum + t.items.filter(i => i.type === 'product').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      return sum;
    }, 0);
    
    console.log(`📊 Product transactions after fix: ${productTransactions.length}`);
    console.log(`📊 Product revenue after fix: ${productRevenue}`);
    
    // Calculate in-person product revenue
    const inPersonProductTransactions = fixedTransactions.filter(t =>
      (t.source === 'pos' || t.source === 'calendar') &&
      (t.type === 'product_sale' || t.type === 'inventory_sale' || t.type === 'consolidated_sale' || (t.items && t.items.some(i => i.type === 'product'))) &&
      t.status !== 'cancelled'
    );
    
    const inPersonProductRevenue = inPersonProductTransactions.reduce((sum, t) => {
      if (t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'product').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      return sum + (t.type === 'product_sale' || t.type === 'inventory_sale' ? t.amount : 0);
    }, 0);
    
    console.log(`📊 In-person product transactions: ${inPersonProductTransactions.length}`);
    console.log(`📊 In-person product revenue: ${inPersonProductRevenue}`);
    
    // Calculate home service product revenue
    const homeServiceProductTransactions = fixedTransactions.filter(t =>
      t.source === 'home_service' &&
      (t.type === 'product_sale' || t.type === 'inventory_sale' || t.type === 'consolidated_sale' || (t.items && t.items.some(i => i.type === 'product'))) &&
      t.status !== 'cancelled'
    );
    
    const homeServiceProductRevenue = homeServiceProductTransactions.reduce((sum, t) => {
      if (t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'product').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      return sum + (t.type === 'product_sale' || t.type === 'inventory_sale' ? t.amount : 0);
    }, 0);
    
    console.log(`📊 Home service product transactions: ${homeServiceProductTransactions.length}`);
    console.log(`📊 Home service product revenue: ${homeServiceProductRevenue}`);
    
    // Verify that total product revenue matches the sum of in-person and home service product revenue
    const totalProductRevenue = inPersonProductRevenue + homeServiceProductRevenue;
    console.log(`📊 Total product revenue (in-person + home service): ${totalProductRevenue}`);
    console.log(`📊 Product revenue from all transactions: ${productRevenue}`);
    console.log(`📊 Match: ${Math.abs(totalProductRevenue - productRevenue) < 0.01 ? '✅' : '❌'}`);
    
    if (Math.abs(totalProductRevenue - productRevenue) >= 0.01) {
      console.log('⚠️ Product revenue mismatch detected. This could be due to:');
      console.log('1. Online product sales not included in in-person or home service');
      console.log('2. Transactions with incorrect source categorization');
      console.log('3. Transactions with incorrect type categorization');
      
      // Check for online product sales
      const onlineProductTransactions = fixedTransactions.filter(t =>
        (t.source === 'client_portal' || t.source === 'online') &&
        (t.type === 'product_sale' || t.type === 'inventory_sale' || t.type === 'consolidated_sale' || (t.items && t.items.some(i => i.type === 'product'))) &&
        t.status !== 'cancelled'
      );
      
      const onlineProductRevenue = onlineProductTransactions.reduce((sum, t) => {
        if (t.items && Array.isArray(t.items)) {
          return sum + t.items.filter(i => i.type === 'product').reduce((s, i) => s + (i.totalPrice || 0), 0);
        }
        return sum + (t.type === 'product_sale' || t.type === 'inventory_sale' ? t.amount : 0);
      }, 0);
      
      console.log(`📊 Online product transactions: ${onlineProductTransactions.length}`);
      console.log(`📊 Online product revenue: ${onlineProductRevenue}`);
      
      // Check if adding online product revenue resolves the mismatch
      const adjustedTotalProductRevenue = inPersonProductRevenue + homeServiceProductRevenue + onlineProductRevenue;
      console.log(`📊 Adjusted total product revenue (in-person + home service + online): ${adjustedTotalProductRevenue}`);
      console.log(`📊 Match with adjusted total: ${Math.abs(adjustedTotalProductRevenue - productRevenue) < 0.01 ? '✅' : '❌'}`);
    }
    
    console.log('🔧 Revenue display fix complete. Please refresh the dashboard to see the updated values.');
    
    // Force a refresh of the page
    console.log('🔄 Refreshing page to apply changes...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error('❌ Error fixing transactions:', error);
  }
}

// Instructions for running this script:
console.log(`
To fix the revenue display:
1. Open your browser's developer console (F12 or right-click > Inspect > Console)
2. Copy and paste this entire script into the console
3. Run the function by typing: fixRevenueDisplay()
4. The page will automatically refresh after the fix is applied
`);