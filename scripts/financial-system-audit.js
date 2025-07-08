/**
 * Comprehensive Financial System Audit Script
 * Tests revenue recording, cash reconciliation, and data integrity
 */

// Financial System Audit Functions
const FinancialAudit = {
  
  // 1. Revenue Recording & Cash Reconciliation Tests
  async testRevenueRecording() {
    console.log('🔍 AUDIT: Testing Revenue Recording & Cash Reconciliation');
    
    const transactions = this.getStoredTransactions();
    const issues = [];
    
    // Test 1: Verify transaction amounts are properly recorded
    const zeroAmountTransactions = transactions.filter(tx => !tx.amount || tx.amount <= 0);
    if (zeroAmountTransactions.length > 0) {
      issues.push({
        type: 'ZERO_AMOUNT_TRANSACTIONS',
        count: zeroAmountTransactions.length,
        transactions: zeroAmountTransactions.map(tx => ({ id: tx.id, amount: tx.amount }))
      });
    }
    
    // Test 2: Verify discount calculations are accurate
    const discountedTransactions = transactions.filter(tx => 
      tx.metadata?.discountApplied || (tx.discountPercentage && tx.discountPercentage > 0)
    );
    
    for (const tx of discountedTransactions) {
      const originalAmount = tx.metadata?.originalTotal || tx.originalServiceAmount || 0;
      const discountPercentage = tx.discountPercentage || tx.metadata?.discountPercentage || 0;
      const expectedDiscountAmount = (originalAmount * discountPercentage) / 100;
      const actualDiscountAmount = tx.discountAmount || (originalAmount - tx.amount);
      
      if (Math.abs(expectedDiscountAmount - actualDiscountAmount) > 0.01) {
        issues.push({
          type: 'DISCOUNT_CALCULATION_ERROR',
          transactionId: tx.id,
          expected: expectedDiscountAmount,
          actual: actualDiscountAmount,
          originalAmount,
          discountPercentage
        });
      }
    }
    
    // Test 3: Verify consolidated transaction integrity
    const consolidatedTransactions = transactions.filter(tx => tx.type === 'consolidated_sale');
    for (const tx of consolidatedTransactions) {
      const serviceAmount = tx.serviceAmount || 0;
      const productAmount = tx.productAmount || 0;
      const expectedTotal = serviceAmount + productAmount;
      
      if (Math.abs(expectedTotal - tx.amount) > 0.01) {
        issues.push({
          type: 'CONSOLIDATED_TOTAL_MISMATCH',
          transactionId: tx.id,
          serviceAmount,
          productAmount,
          expectedTotal,
          actualTotal: tx.amount
        });
      }
    }
    
    return {
      testName: 'Revenue Recording & Cash Reconciliation',
      totalTransactions: transactions.length,
      discountedTransactions: discountedTransactions.length,
      consolidatedTransactions: consolidatedTransactions.length,
      issues
    };
  },
  
  // 2. Payment Method Reconciliation
  async testPaymentMethodReconciliation() {
    console.log('🔍 AUDIT: Testing Payment Method Reconciliation');
    
    const transactions = this.getStoredTransactions();
    const paymentSummary = {};
    const issues = [];
    
    transactions.forEach(tx => {
      const method = tx.paymentMethod || 'unknown';
      if (!paymentSummary[method]) {
        paymentSummary[method] = { count: 0, total: 0 };
      }
      paymentSummary[method].count++;
      paymentSummary[method].total += tx.amount;
    });
    
    // Check for missing payment methods
    const missingPaymentMethods = transactions.filter(tx => !tx.paymentMethod);
    if (missingPaymentMethods.length > 0) {
      issues.push({
        type: 'MISSING_PAYMENT_METHOD',
        count: missingPaymentMethods.length,
        transactions: missingPaymentMethods.map(tx => ({ id: tx.id, amount: tx.amount }))
      });
    }
    
    return {
      testName: 'Payment Method Reconciliation',
      paymentSummary,
      issues
    };
  },
  
  // 3. Transaction Format Compatibility Test
  async testTransactionFormatCompatibility() {
    console.log('🔍 AUDIT: Testing Transaction Format Compatibility');
    
    const transactions = this.getStoredTransactions();
    const issues = [];
    
    // Check for old vs new format compatibility
    const oldFormatTransactions = transactions.filter(tx => tx.metadata?.discountApplied && !tx.discountPercentage);
    const newFormatTransactions = transactions.filter(tx => tx.discountPercentage && tx.discountPercentage > 0);
    const mixedFormatTransactions = transactions.filter(tx => 
      tx.metadata?.discountApplied && tx.discountPercentage && tx.discountPercentage > 0
    );
    
    // Check for inconsistent discount data
    for (const tx of mixedFormatTransactions) {
      const oldDiscount = tx.metadata?.discountPercentage || 0;
      const newDiscount = tx.discountPercentage || 0;
      
      if (Math.abs(oldDiscount - newDiscount) > 0.01) {
        issues.push({
          type: 'INCONSISTENT_DISCOUNT_FORMAT',
          transactionId: tx.id,
          oldFormatDiscount: oldDiscount,
          newFormatDiscount: newDiscount
        });
      }
    }
    
    return {
      testName: 'Transaction Format Compatibility',
      oldFormatCount: oldFormatTransactions.length,
      newFormatCount: newFormatTransactions.length,
      mixedFormatCount: mixedFormatTransactions.length,
      issues
    };
  },
  
  // 4. Data Integrity Checks
  async testDataIntegrity() {
    console.log('🔍 AUDIT: Testing Data Integrity');
    
    const transactions = this.getStoredTransactions();
    const issues = [];
    
    // Check for duplicate transactions
    const duplicates = this.findDuplicateTransactions(transactions);
    if (duplicates.length > 0) {
      issues.push({
        type: 'DUPLICATE_TRANSACTIONS',
        count: duplicates.length,
        duplicates: duplicates.map(group => ({
          referenceId: group.referenceId,
          count: group.transactions.length,
          totalAmount: group.transactions.reduce((sum, tx) => sum + tx.amount, 0)
        }))
      });
    }
    
    // Check for missing required fields
    const requiredFields = ['id', 'date', 'type', 'amount', 'status'];
    const incompleteTransactions = transactions.filter(tx => 
      requiredFields.some(field => !tx[field])
    );
    
    if (incompleteTransactions.length > 0) {
      issues.push({
        type: 'INCOMPLETE_TRANSACTIONS',
        count: incompleteTransactions.length,
        transactions: incompleteTransactions.map(tx => ({
          id: tx.id,
          missingFields: requiredFields.filter(field => !tx[field])
        }))
      });
    }
    
    return {
      testName: 'Data Integrity',
      totalTransactions: transactions.length,
      duplicateGroups: duplicates.length,
      incompleteTransactions: incompleteTransactions.length,
      issues
    };
  },
  
  // Helper Functions
  getStoredTransactions() {
    try {
      const stored = localStorage.getItem('vanity_transactions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return [];
    }
  },
  
  findDuplicateTransactions(transactions) {
    const groups = {};
    
    transactions.forEach(tx => {
      if (tx.reference?.type === 'appointment' && tx.reference?.id) {
        const key = `${tx.reference.type}-${tx.reference.id}-${tx.amount}`;
        if (!groups[key]) {
          groups[key] = { referenceId: tx.reference.id, transactions: [] };
        }
        groups[key].transactions.push(tx);
      }
    });
    
    return Object.values(groups).filter(group => group.transactions.length > 1);
  },
  
  // Main audit function
  async runFullAudit() {
    console.log('🚀 Starting Comprehensive Financial System Audit...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: []
    };
    
    try {
      results.tests.push(await this.testRevenueRecording());
      results.tests.push(await this.testPaymentMethodReconciliation());
      results.tests.push(await this.testTransactionFormatCompatibility());
      results.tests.push(await this.testDataIntegrity());
      
      // Summary
      const totalIssues = results.tests.reduce((sum, test) => sum + test.issues.length, 0);
      results.summary = {
        totalTests: results.tests.length,
        totalIssues,
        status: totalIssues === 0 ? 'PASS' : 'FAIL'
      };
      
      console.log('✅ Financial System Audit Complete');
      console.log('📊 Audit Results:', results);
      
      return results;
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
      results.error = error.message;
      return results;
    }
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.FinancialAudit = FinancialAudit;
}

// Auto-run if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinancialAudit;
}
