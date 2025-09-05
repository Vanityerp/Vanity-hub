// This script should be run in the browser console on the dashboard page

function fixServiceRevenueCalculation() {
  console.log('🔧 Starting service revenue calculation fix...');

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
      
      // Check for consolidated transactions with service items but not properly categorized
      if (transaction.items && 
          Array.isArray(transaction.items) && 
          transaction.items.some(item => item.type === 'service') &&
          transaction.type !== 'consolidated_sale' && 
          transaction.type !== 'service_sale') {
        
        // Fix: Change type to consolidated_sale
        transaction.type = 'consolidated_sale';
        fixedCount++;
        console.log(`🔧 Fixed transaction ${transaction.id}: "${transaction.description}" - Changed type to consolidated_sale`);
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
      (t.type === 'service_sale' || t.type === 'consolidated_sale' || 
       (t.items && Array.isArray(t.items) && t.items.some(i => i.type === 'service'))) && 
      t.status !== 'cancelled'
    );
    const serviceRevenue = serviceTransactions.reduce((sum, t) => sum + t.amount, 0);
    console.log(`📊 Service transactions after fix: ${serviceTransactions.length}`);
    console.log(`📊 Service revenue after fix: ${serviceRevenue}`);
    
    console.log('🔧 Service revenue calculation fix complete. Please refresh the dashboard to see the updated values.');
    
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
To fix the service revenue calculation:
1. Open your browser's developer console (F12 or right-click > Inspect > Console)
2. Copy and paste this entire script into the console
3. Run the function by typing: fixServiceRevenueCalculation()
4. The page will automatically refresh after the fix is applied
`);