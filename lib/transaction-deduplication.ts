"use client"

import {
  Transaction,
  TransactionCreate,
  TransactionType,
  TransactionStatus
} from "./transaction-types"
import {
  getExistingTransactionsForAppointment,
  calculateDiscountInfo,
  calculateServiceAndProductAmounts,
  areTransactionsDuplicates,
  isTransactionDiscounted,
  determineTransactionType
} from "./transaction-utils"

/**
 * Generate a unique transaction ID
 */
const generateTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `tx-${timestamp}-${random}`;
};

/**
 * Create a transaction with comprehensive duplicate prevention
 * 
 * @param transactionData - The transaction data to create
 * @param existingTransactions - All existing transactions
 * @returns The created or updated transaction
 */
export const createTransactionWithDuplicatePrevention = (
  transactionData: TransactionCreate,
  existingTransactions: Transaction[]
): Transaction => {
  console.log('🔄 Creating transaction with duplicate prevention', transactionData);
  
  // Generate a unique ID if not provided
  const uniqueId = transactionData.id || generateTransactionId();
  
  // Determine the appropriate transaction type
  const transactionType = determineTransactionType({
    ...transactionData,
    type: transactionData.type
  } as Transaction);
  
  // Create the new transaction object
  const newTransaction: Transaction = {
    ...transactionData,
    id: uniqueId,
    date: transactionData.date || new Date(),
    description: transactionData.description || '',
    type: transactionType,
    status: transactionData.status || TransactionStatus.COMPLETED,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Check for duplicates if this is an appointment-related transaction
  if (newTransaction.reference?.type === 'appointment' || 
      newTransaction.metadata?.appointmentId || 
      newTransaction.metadata?.bookingReference) {

    // Get the appointment ID from either reference or metadata
    const appointmentId = newTransaction.reference?.type === 'appointment' ? 
                         newTransaction.reference?.id : 
                         newTransaction.metadata?.appointmentId;
    
    // Get the booking reference from metadata
    const bookingReference = newTransaction.metadata?.bookingReference;
    
    if (appointmentId || bookingReference) {
      // Find any existing transactions for this appointment
      const existingAppointmentTransactions = getExistingTransactionsForAppointment(
        existingTransactions,
        appointmentId,
        bookingReference
      );

      // If we found any existing transactions
      if (existingAppointmentTransactions.length > 0) {
        console.warn(`Found ${existingAppointmentTransactions.length} existing transactions for this appointment`);

        // Check if this is a discounted transaction
        const isIncomingTransactionDiscounted = isTransactionDiscounted(newTransaction);
        
        // Find existing discounted and non-discounted transactions
        const existingDiscountedTx = existingAppointmentTransactions.find(isTransactionDiscounted);
        const existingNonDiscountedTx = existingAppointmentTransactions.find(tx => !isTransactionDiscounted(tx));
        
        // CASE 1: Incoming transaction has discount information
        if (isIncomingTransactionDiscounted) {
          console.log('Incoming transaction has discount information');
          
          // If a discounted transaction already exists, return it instead
          if (existingDiscountedTx) {
            console.warn('A discounted transaction already exists. Returning existing transaction.');
            return existingDiscountedTx;
          }
     
          // If a non-discounted transaction exists, we should update it with discount info
          if (existingNonDiscountedTx) {
            console.log(`Updating existing non-discounted transaction with discount information: ${existingNonDiscountedTx.id}`);
            
            // Calculate service and product amounts
            const { serviceAmount, productAmount } = calculateServiceAndProductAmounts(newTransaction.items);
            
            // Calculate original amount and discount if not provided
            const originalAmount = existingNonDiscountedTx.amount;
            const discountedAmount = newTransaction.amount;
            
            // Create an updated transaction with discount information
            const updatedTransaction = {
              ...existingNonDiscountedTx,
              amount: discountedAmount,
              serviceAmount: newTransaction.serviceAmount || serviceAmount || existingNonDiscountedTx.serviceAmount || 0,
              productAmount: newTransaction.productAmount || productAmount || existingNonDiscountedTx.productAmount || 0,
              discountPercentage: newTransaction.discountPercentage,
              discountAmount: newTransaction.discountAmount,
              updatedAt: new Date()
            };
            
            // If discount info is not provided, calculate it
            if (!updatedTransaction.discountPercentage || !updatedTransaction.discountAmount) {
              const { discountPercentage, discountAmount } = calculateDiscountInfo(originalAmount, discountedAmount);
              updatedTransaction.discountPercentage = discountPercentage;
              updatedTransaction.discountAmount = discountAmount;
            }
            
            // Calculate original service amount
            updatedTransaction.originalServiceAmount = originalAmount - updatedTransaction.productAmount;
            
            // Update description to include discount information if not already present
            if (!updatedTransaction.description.includes('% off')) {
              updatedTransaction.description += ` (${updatedTransaction.discountPercentage}% off)`;
            }
            
            console.log('✅ Updated transaction with discount information', {
              id: updatedTransaction.id,
              originalAmount,
              discountedAmount,
              discountPercentage: updatedTransaction.discountPercentage
            });
            
            return updatedTransaction;
          }
          
          // No existing transaction to update, return the new discounted transaction
          console.log('Adding new discounted transaction');
          return newTransaction;
        }
        // CASE 2: Incoming transaction has no discount
        else {
          console.log('Incoming transaction has no discount information');
          
          // If a discounted transaction already exists, return it instead
          if (existingDiscountedTx) {
            console.warn('A discounted transaction already exists. Returning existing transaction instead.');
            return existingDiscountedTx;
          }
          
          // If a non-discounted transaction already exists, return it instead
          if (existingNonDiscountedTx) {
            console.warn('A non-discounted transaction already exists. Returning existing transaction instead.');
            return existingNonDiscountedTx;
          }
          
          // If no transactions exist, add the new one
          console.log('No existing transactions found. Adding new transaction.');
        }
      }
    }
  }
  
  // Final check for duplicates
  const duplicateCheck = existingTransactions.find(tx => areTransactionsDuplicates(tx, newTransaction));
  
  // If a duplicate was found, return it
  if (duplicateCheck) {
    console.log('🚫 Duplicate detected, returning existing transaction', {
      id: duplicateCheck.id,
      type: duplicateCheck.type,
      amount: duplicateCheck.amount
    });
    return duplicateCheck;
  }
  
  // Otherwise, return the new transaction
  console.log('✅ No duplicates found, returning new transaction', {
    id: newTransaction.id,
    type: newTransaction.type,
    amount: newTransaction.amount
  });
  
  return newTransaction;
};