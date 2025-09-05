"use client"

import { Transaction } from './transaction-types';

/**
 * Enhanced transaction display service
 * Provides utilities for displaying transaction details with better breakdown
 */
export class TransactionDisplayService {
  /**
   * Format a transaction for display with service and product breakdown
   */
  static formatTransactionForDisplay(transaction: Transaction): {
    serviceAmount: string;
    productAmount: string;
    originalAmount: string;
    finalAmount: string;
    discountInfo: string;
  } {
    if (!transaction) {
      return {
        serviceAmount: '0.00',
        productAmount: '0.00',
        originalAmount: '0.00',
        finalAmount: '0.00',
        discountInfo: ''
      };
    }
    
    // Get service amount (with null/undefined check and calculation from items)
    let serviceAmount = 0;
    if (transaction.serviceAmount !== undefined && transaction.serviceAmount !== null) {
      serviceAmount = transaction.serviceAmount;
    } else if (transaction.items && Array.isArray(transaction.items)) {
      // Calculate from items
      serviceAmount = transaction.items
        .filter(item => item.type === 'service')
        .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    } else if (transaction.type === 'service_sale' || transaction.type === 'consolidated_sale') {
      // For service-only transactions, use the full amount
      serviceAmount = transaction.amount || 0;
    }
    
    // Get product amount (with null/undefined check and calculation from items)
    let productAmount = 0;
    if (transaction.productAmount !== undefined && transaction.productAmount !== null) {
      productAmount = transaction.productAmount;
    } else if (transaction.items && Array.isArray(transaction.items)) {
      // Calculate from items
      productAmount = transaction.items
        .filter(item => item.type === 'product')
        .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    } else if (transaction.type === 'product_sale' || transaction.type === 'inventory_sale') {
      // For product-only transactions, use the full amount
      productAmount = transaction.amount || 0;
    }
    
    // Get original amount before discount (with null/undefined check)
    const originalAmount = transaction.originalServiceAmount !== undefined && transaction.originalServiceAmount !== null
      ? transaction.originalServiceAmount + productAmount 
      : (transaction.amount !== undefined && transaction.amount !== null ? transaction.amount : 0);
    
    // Get final amount (after discount) (with null/undefined check)
    const finalAmount = transaction.amount !== undefined && transaction.amount !== null 
      ? transaction.amount 
      : 0;
    
    // Format discount info
    let discountInfo = '';
    if (transaction.discountPercentage && transaction.discountPercentage > 0) {
      discountInfo = `${transaction.discountPercentage}% off`;
    } else if (transaction.discountAmount && transaction.discountAmount > 0) {
      discountInfo = `${transaction.discountAmount} off`;
    } else if (originalAmount > finalAmount) {
      // Calculate discount percentage if not explicitly provided
      const discountAmount = originalAmount - finalAmount;
      const discountPercentage = Math.round((discountAmount / originalAmount) * 100);
      discountInfo = `${discountPercentage}% off`;
    }
    
    return {
      serviceAmount: typeof serviceAmount === 'number' ? serviceAmount.toFixed(2) : '0.00',
      productAmount: typeof productAmount === 'number' ? productAmount.toFixed(2) : '0.00',
      originalAmount: typeof originalAmount === 'number' ? originalAmount.toFixed(2) : '0.00',
      finalAmount: typeof finalAmount === 'number' ? finalAmount.toFixed(2) : '0.00',
      discountInfo
    };
  }
  
  /**
   * Get formatted service amount for display
   */
  static getServiceAmount(transaction: Transaction): string {
    if (!transaction) {
      return '0.00';
    }
    
    if (transaction.serviceAmount !== undefined && transaction.serviceAmount !== null) {
      return typeof transaction.serviceAmount === 'number' ? transaction.serviceAmount.toFixed(2) : '0.00';
    }
    
    // Try to calculate from items
    if (transaction.items && Array.isArray(transaction.items)) {
      const serviceItems = transaction.items.filter(item => item.type === 'service');
      if (serviceItems.length > 0) {
        const total = serviceItems.reduce((sum, item) => {
          const itemPrice = item.totalPrice !== undefined && item.totalPrice !== null ? item.totalPrice : 0;
          return sum + itemPrice;
        }, 0);
        return total.toFixed(2);
      }
    }
    
    // If this is a service-only transaction
    if (transaction.type === 'service_sale' && transaction.amount !== undefined && transaction.amount !== null) {
      return typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : '0.00';
    }
    
    return '0.00';
  }
  
  /**
   * Get formatted product amount for display
   */
  static getProductAmount(transaction: Transaction): string {
    if (!transaction) {
      return '0.00';
    }
    
    if (transaction.productAmount !== undefined && transaction.productAmount !== null) {
      return typeof transaction.productAmount === 'number' ? transaction.productAmount.toFixed(2) : '0.00';
    }
    
    // Try to calculate from items
    if (transaction.items && Array.isArray(transaction.items)) {
      const productItems = transaction.items.filter(item => item.type === 'product');
      if (productItems.length > 0) {
        const total = productItems.reduce((sum, item) => {
          const itemPrice = item.totalPrice !== undefined && item.totalPrice !== null ? item.totalPrice : 0;
          return sum + itemPrice;
        }, 0);
        return total.toFixed(2);
      }
    }
    
    // If this is a product-only transaction
    if ((transaction.type === 'product_sale' || transaction.type === 'inventory_sale') && 
        transaction.amount !== undefined && transaction.amount !== null) {
      return typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : '0.00';
    }
    
    return '0.00';
  }
  
  /**
   * Get original amount before discount
   */
  static getOriginalAmount(transaction: Transaction): string {
    if (!transaction) {
      return '0.00';
    }
    
    if (transaction.originalServiceAmount !== undefined && transaction.originalServiceAmount !== null) {
      const originalServiceAmount = transaction.originalServiceAmount;
      const productAmount = (transaction.productAmount !== undefined && transaction.productAmount !== null) 
        ? transaction.productAmount 
        : 0;
      return (originalServiceAmount + productAmount).toFixed(2);
    }
    
    // If there's no discount, the original amount is the same as the final amount
    if (transaction.amount !== undefined && transaction.amount !== null) {
      return typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : '0.00';
    }
    
    return '0.00';
  }
}