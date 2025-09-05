// This script should be run in the browser console
// It will fix transaction display issues in both the dashboard and accounting page

function fixTransactionDisplayIssues() {
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

    // Group transactions by appointment ID
    const appointmentGroups = new Map();
    
    // First, identify all transactions with appointment references
    transactions.forEach(tx => {
      if (tx.reference?.type === 'appointment' && tx.reference?.id) {
        const appointmentId = tx.reference.id;
        if (!appointmentGroups.has(appointmentId)) {
          appointmentGroups.set(appointmentId, []);
        }
        appointmentGroups.get(appointmentId).push(tx);
      }
      
      // Also check metadata for appointment ID
      if (tx.metadata?.appointmentId) {
        const appointmentId = tx.metadata.appointmentId;
        if (!appointmentGroups.has(appointmentId)) {
          appointmentGroups.set(appointmentId, []);
        }
        appointmentGroups.get(appointmentId).push(tx);
      }
    });

    // Process each group to find and fix duplicates
    let duplicatesFixed = 0;
    const transactionsToRemove = [];
    const transactionsToKeep = [];
    
    appointmentGroups.forEach((txGroup, appointmentId) => {
      if (txGroup.length > 1) {
        console.log(`🔍 Found ${txGroup.length} transactions for appointment ${appointmentId}`);
        
        // Check if there are transactions with different amounts (potential discount case)
        const uniqueAmounts = new Set(txGroup.map(tx => tx.amount));
        if (uniqueAmounts.size > 1) {
          console.log(`⚠️ Found transactions with different amounts for appointment ${appointmentId}`);
          
          // Sort by amount (ascending) to find the lowest amount (likely the discounted one)
          txGroup.sort((a, b) => a.amount - b.amount);
          
          // Keep the transaction with the lowest amount (discounted) and mark others for removal
          const lowestAmountTx = txGroup[0];
          const highestAmountTx = txGroup[txGroup.length - 1];
          
          console.log(`✅ Keeping transaction with lowest amount: ${lowestAmountTx.id} (${lowestAmountTx.amount})`);
          
          // Calculate service and product amounts
          let serviceAmount = 0;
          let productAmount = 0;
          
          // Try to extract service and product amounts from the transaction
          if (lowestAmountTx.serviceAmount !== undefined) {
            serviceAmount = lowestAmountTx.serviceAmount;
          } else if (lowestAmountTx.items && Array.isArray(lowestAmountTx.items)) {
            serviceAmount = lowestAmountTx.items
              .filter(item => item.type === 'service')
              .reduce((sum, item) => sum + (item.totalPrice || item.unitPrice || 0), 0);
          } else if (lowestAmountTx.type === 'service_sale') {
            serviceAmount = lowestAmountTx.amount;
          }
          
          if (lowestAmountTx.productAmount !== undefined) {
            productAmount = lowestAmountTx.productAmount;
          } else if (lowestAmountTx.items && Array.isArray(lowestAmountTx.items)) {
            productAmount = lowestAmountTx.items
              .filter(item => item.type === 'product')
              .reduce((sum, item) => sum + (item.totalPrice || item.unitPrice || 0), 0);
          } else if (lowestAmountTx.type === 'product_sale' || lowestAmountTx.type === 'inventory_sale') {
            productAmount = lowestAmountTx.amount;
          }
          
          // Calculate original amount and discount
          const originalAmount = highestAmountTx.amount;
          const discountedAmount = lowestAmountTx.amount;
          const discountAmount = originalAmount - discountedAmount;
          const discountPercentage = Math.round((discountAmount / originalAmount) * 100);
          
          // Update the transaction with the lowest amount to include all necessary information
          lowestAmountTx.serviceAmount = serviceAmount;
          lowestAmountTx.productAmount = productAmount;
          lowestAmountTx.originalServiceAmount = originalAmount - productAmount;
          lowestAmountTx.discountPercentage = discountPercentage;
          lowestAmountTx.discountAmount = discountAmount;
          
          // Update description to include discount information
          if (!lowestAmountTx.description.includes('% off')) {
            lowestAmountTx.description += ` (${discountPercentage}% off)`;
          }
          
          console.log(`📝 Added discount information to transaction ${lowestAmountTx.id}: ${discountPercentage}% off`);
          
          // Keep the updated transaction
          transactionsToKeep.push(lowestAmountTx);
          
          // Mark all other transactions for removal
          for (let i = 1; i < txGroup.length; i++) {
            console.log(`❌ Marking for removal: ${txGroup[i].id} (${txGroup[i].amount})`);
            transactionsToRemove.push(txGroup[i].id);
            duplicatesFixed++;
          }
        } else {
          console.log(`ℹ️ All transactions for appointment ${appointmentId} have the same amount: ${txGroup[0].amount}`);
          
          // If they have the same amount, keep the most recent one
          txGroup.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          // Keep the most recent transaction
          transactionsToKeep.push(txGroup[0]);
          
          // Mark others for removal
          for (let i = 1; i < txGroup.length; i++) {
            console.log(`❌ Marking duplicate for removal: ${txGroup[i].id} (same amount)`);
            transactionsToRemove.push(txGroup[i].id);
            duplicatesFixed++;
          }
        }
      } else if (txGroup.length === 1) {
        // Keep single transactions
        transactionsToKeep.push(txGroup[0]);
      }
    });
    
    // Add transactions that don't have appointment references
    transactions.forEach(tx => {
      const appointmentId = tx.reference?.id || tx.metadata?.appointmentId;
      if (!appointmentId) {
        transactionsToKeep.push(tx);
      }
    });
    
    // Remove the marked transactions
    const updatedTransactions = transactions.filter(tx => !transactionsToRemove.includes(tx.id));
    
    console.log(`🧹 Removed ${duplicatesFixed} duplicate transactions`);
    console.log(`📊 Total transactions after fix: ${updatedTransactions.length}`);
    
    // Fix location display
    updatedTransactions.forEach(tx => {
      // Fix location names
      if (tx.location === 'loc1') {
        tx.location = 'D-Ring Road';
      } else if (tx.location === 'loc2') {
        tx.location = 'Muaither';
      } else if (tx.location === 'loc3') {
        tx.location = 'Medinat Khalifa';
      }
    });
    
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
3. Run the function by typing: fixTransactionDisplayIssues()
4. The page will automatically refresh after the fix is applied
`);