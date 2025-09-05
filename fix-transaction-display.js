// This script should be run in the browser console on the accounting page
// It will fix transaction display issues including service/product revenue and discount calculations

function fixTransactionDisplay() {
  console.log('🔧 Starting transaction display fix...');

  // Get transactions from localStorage
  const storedTransactions = localStorage.getItem('vanity_transactions');
  if (!storedTransactions) {
    console.log('❌ No transactions found in localStorage');
    return;
  }

  try {
    const transactions = JSON.parse(storedTransactions);
    console.log(`📊 Total transactions before fix: ${transactions.length}`);

    let fixedCount = 0;
    const updatedTransactions = transactions.map(transaction => {
      let needsUpdate = false;
      
      // Fix service and product amounts if they're missing or incorrect
      if (!transaction.serviceAmount && !transaction.productAmount) {
        console.log(`🔧 Fixing service/product amounts for transaction ${transaction.id}`);
        
        let serviceAmount = 0;
        let productAmount = 0;
        
        // Calculate from items if available
        if (transaction.items && Array.isArray(transaction.items)) {
          serviceAmount = transaction.items
            .filter(item => item.type === 'service')
            .reduce((sum, item) => sum + (item.totalPrice || item.unitPrice || 0), 0);
          
          productAmount = transaction.items
            .filter(item => item.type === 'product')
            .reduce((sum, item) => sum + (item.totalPrice || item.unitPrice || 0), 0);
        } else {
          // Calculate based on transaction type and description
          if (transaction.type === 'service_sale' || 
              transaction.description?.toLowerCase().includes('service') ||
              transaction.description?.toLowerCase().includes('haircut') ||
              transaction.description?.toLowerCase().includes('color') ||
              transaction.description?.toLowerCase().includes('style') ||
              transaction.description?.toLowerCase().includes('treatment') ||
              transaction.description?.toLowerCase().includes('manicure') ||
              transaction.description?.toLowerCase().includes('pedicure')) {
            serviceAmount = transaction.amount;
          } else if (transaction.type === 'product_sale' || 
                     transaction.type === 'inventory_sale' ||
                     transaction.description?.toLowerCase().includes('product')) {
            productAmount = transaction.amount;
          } else if (transaction.type === 'consolidated_sale') {
            // For consolidated sales, try to split based on description
            const description = transaction.description?.toLowerCase() || '';
            if (description.includes('service') && description.includes('product')) {
              // Split 70/30 service/product as a reasonable default
              serviceAmount = Math.round(transaction.amount * 0.7 * 100) / 100;
              productAmount = Math.round(transaction.amount * 0.3 * 100) / 100;
            } else if (description.includes('service')) {
              serviceAmount = transaction.amount;
            } else if (description.includes('product')) {
              productAmount = transaction.amount;
            } else {
              // Default to service for consolidated sales
              serviceAmount = transaction.amount;
            }
          }
        }
        
        if (serviceAmount > 0 || productAmount > 0) {
          transaction.serviceAmount = serviceAmount;
          transaction.productAmount = productAmount;
          needsUpdate = true;
          console.log(`✅ Set service amount: ${serviceAmount}, product amount: ${productAmount}`);
        }
      }
      
      // Fix discount information and original amounts
      if (transaction.discountPercentage && transaction.discountPercentage > 0 && !transaction.originalServiceAmount) {
        console.log(`🔧 Fixing discount information for transaction ${transaction.id}`);
        
        const currentAmount = transaction.amount;
        const discountPercentage = transaction.discountPercentage;
        
        // Calculate original amount before discount
        const originalAmount = Math.round((currentAmount / (1 - discountPercentage / 100)) * 100) / 100;
        const discountAmount = originalAmount - currentAmount;
        
        // Set original service amount (assuming discount applies to services only)
        if (transaction.serviceAmount && transaction.serviceAmount > 0) {
          const originalServiceAmount = Math.round((transaction.serviceAmount / (1 - discountPercentage / 100)) * 100) / 100;
          transaction.originalServiceAmount = originalServiceAmount;
        } else {
          transaction.originalServiceAmount = originalAmount - (transaction.productAmount || 0);
        }
        
        transaction.discountAmount = discountAmount;
        needsUpdate = true;
        console.log(`✅ Set original service amount: ${transaction.originalServiceAmount}, discount amount: ${discountAmount}`);
      }
      
      // Fix description to include discount information if missing
      if (transaction.discountPercentage && transaction.discountPercentage > 0 && 
          !transaction.description?.includes('% off')) {
        transaction.description += ` (${transaction.discountPercentage}% off)`;
        needsUpdate = true;
        console.log(`✅ Updated description with discount info`);
      }
      
      // Ensure final amount is correct (should be the discounted amount)
      if (transaction.originalServiceAmount && transaction.discountPercentage) {
        const expectedFinalAmount = Math.round(
          (transaction.originalServiceAmount * (1 - transaction.discountPercentage / 100) + 
           (transaction.productAmount || 0)) * 100
        ) / 100;
        
        if (Math.abs(transaction.amount - expectedFinalAmount) > 0.01) {
          console.log(`🔧 Correcting final amount for transaction ${transaction.id}`);
          console.log(`   Current: ${transaction.amount}, Expected: ${expectedFinalAmount}`);
          transaction.amount = expectedFinalAmount;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        fixedCount++;
      }
      
      return transaction;
    });

    console.log(`🔧 Fixed ${fixedCount} transactions`);
    
    // Save the updated transactions back to localStorage
    localStorage.setItem('vanity_transactions', JSON.stringify(updatedTransactions));
    
    console.log('🔧 Transaction display fix complete. Please refresh the page to see the updated values.');
    
    // Force a refresh of the page
    console.log('🔄 Refreshing page to apply changes...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (error) {
    console.error('❌ Error fixing transaction display:', error);
  }
}

// Instructions for running this script:
console.log(`
To fix transaction display issues:
1. Open your browser's developer console (F12 or right-click > Inspect > Console)
2. Copy and paste this entire script into the console
3. Run the function by typing: fixTransactionDisplay()
4. The page will automatically refresh after the fix is applied
`);