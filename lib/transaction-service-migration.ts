"use client"

import { ServiceStorage } from "@/lib/service-storage"
import { Transaction } from "@/lib/transaction-types"

/**
 * Migration utility to fix service references in existing transactions
 */
export class TransactionServiceMigration {
  
  /**
   * Fix service references in a single transaction
   */
  static fixTransactionServiceReferences(transaction: Transaction): Transaction {
    if (transaction.type !== 'service_sale') {
      return transaction; // Only fix service transactions
    }

    const services = ServiceStorage.getServices();
    const updatedTransaction = { ...transaction };
    let hasChanges = false;

    // Fix items array - remove prefixes and add serviceId fields
    if (updatedTransaction.items && Array.isArray(updatedTransaction.items)) {
      updatedTransaction.items = updatedTransaction.items.map(item => {
        if (item.category === 'Service' || item.category === 'Additional Service') {
          const updatedItem = { ...item };
          
          // Remove service- prefix if present
          if (typeof item.id === 'string' && item.id.startsWith('service-')) {
            const cleanId = item.id.replace('service-', '');
            // Check if the clean ID is a valid service ID
            const service = services.find(s => s.id === cleanId || s.name === cleanId);
            if (service) {
              updatedItem.id = service.id;
              updatedItem.serviceId = service.id;
              hasChanges = true;
            }
          }
          
          // Try to find service by name if no serviceId exists
          if (!updatedItem.serviceId && item.name) {
            const service = services.find(s => s.name === item.name);
            if (service) {
              updatedItem.serviceId = service.id;
              updatedItem.id = service.id; // Also update the item ID
              hasChanges = true;
            }
          }
          
          return updatedItem;
        }
        return item;
      });
    }

    // Fix metadata - add serviceId and serviceIds if missing
    if (!updatedTransaction.metadata) {
      updatedTransaction.metadata = {};
    }

    // Extract service IDs from items
    const serviceIds: string[] = [];
    const serviceNames: string[] = [];
    
    if (updatedTransaction.items) {
      updatedTransaction.items.forEach(item => {
        if ((item.category === 'Service' || item.category === 'Additional Service') && item.serviceId) {
          if (!serviceIds.includes(item.serviceId)) {
            serviceIds.push(item.serviceId);
          }
          if (item.name && !serviceNames.includes(item.name)) {
            serviceNames.push(item.name);
          }
        }
      });
    }

    // Update metadata with service information
    if (serviceIds.length > 0) {
      if (!updatedTransaction.metadata.serviceId) {
        updatedTransaction.metadata.serviceId = serviceIds[0]; // Primary service
        hasChanges = true;
      }
      
      if (!updatedTransaction.metadata.serviceIds) {
        updatedTransaction.metadata.serviceIds = serviceIds;
        hasChanges = true;
      }
      
      if (!updatedTransaction.metadata.serviceNames) {
        updatedTransaction.metadata.serviceNames = serviceNames;
        hasChanges = true;
      }
    }

    // Try to extract service info from description if metadata is still missing
    if (!updatedTransaction.metadata.serviceId && updatedTransaction.description) {
      const services = ServiceStorage.getServices();
      const foundService = services.find(s => 
        updatedTransaction.description?.includes(s.name)
      );
      
      if (foundService) {
        updatedTransaction.metadata.serviceId = foundService.id;
        updatedTransaction.metadata.serviceIds = [foundService.id];
        updatedTransaction.metadata.serviceName = foundService.name;
        updatedTransaction.metadata.serviceNames = [foundService.name];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      updatedTransaction.updatedAt = new Date();
      console.log(`🔧 Fixed service references for transaction ${transaction.id}`);
    }

    return updatedTransaction;
  }

  /**
   * Fix service references in all transactions
   */
  static fixAllTransactionServiceReferences(transactions: Transaction[]): Transaction[] {
    console.log('🔧 Starting transaction service reference migration...');
    
    const fixedTransactions = transactions.map(transaction => 
      this.fixTransactionServiceReferences(transaction)
    );
    
    const changedCount = fixedTransactions.filter((tx, index) => 
      JSON.stringify(tx) !== JSON.stringify(transactions[index])
    ).length;
    
    console.log(`🔧 Migration complete: ${changedCount} transactions updated`);
    
    return fixedTransactions;
  }

  /**
   * Validate that a transaction has proper service references
   */
  static validateTransactionServiceReferences(transaction: Transaction): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    if (transaction.type !== 'service_sale') {
      return { isValid: true, issues, suggestions };
    }

    const services = ServiceStorage.getServices();
    
    // Check metadata
    if (!transaction.metadata?.serviceId) {
      issues.push('Missing serviceId in metadata');
      suggestions.push('Add serviceId to transaction metadata');
    } else {
      const service = services.find(s => s.id === transaction.metadata.serviceId);
      if (!service) {
        issues.push(`Invalid serviceId in metadata: ${transaction.metadata.serviceId}`);
        suggestions.push('Update serviceId to match existing service');
      }
    }
    
    // Check items
    if (!transaction.items || transaction.items.length === 0) {
      issues.push('No items in service transaction');
      suggestions.push('Add service items to transaction');
    } else {
      const serviceItems = transaction.items.filter(item => 
        item.category === 'Service' || item.category === 'Additional Service'
      );
      
      if (serviceItems.length === 0) {
        issues.push('No service items found in transaction');
        suggestions.push('Add service category items');
      } else {
        serviceItems.forEach((item, index) => {
          if (!item.serviceId) {
            issues.push(`Service item ${index} missing serviceId`);
            suggestions.push(`Add serviceId to service item ${index}`);
          } else {
            const service = services.find(s => s.id === item.serviceId);
            if (!service) {
              issues.push(`Service item ${index} has invalid serviceId: ${item.serviceId}`);
              suggestions.push(`Update serviceId for item ${index}`);
            }
          }
        });
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Get statistics about service reference issues in transactions
   * @param transactions - All transactions to analyze
   * @param cutoffDate - Optional date to only validate transactions after this date
   */
  static getServiceReferenceStatistics(
    transactions: Transaction[],
    cutoffDate?: Date
  ): {
    totalServiceTransactions: number;
    validTransactions: number;
    invalidTransactions: number;
    issueBreakdown: Record<string, number>;
    ignoredOldTransactions?: number;
  } {
    const serviceTransactions = transactions.filter(t => t.type === 'service_sale');
    const issueBreakdown: Record<string, number> = {};

    let validCount = 0;
    let ignoredCount = 0;
    let analyzedTransactions = serviceTransactions;

    // Filter out old transactions if cutoff date is provided
    if (cutoffDate) {
      analyzedTransactions = serviceTransactions.filter(transaction => {
        const txDate = typeof transaction.date === 'string' ? new Date(transaction.date) : transaction.date;
        const isOld = txDate < cutoffDate;
        if (isOld) {
          ignoredCount++;
        }
        return !isOld;
      });
    }

    analyzedTransactions.forEach(transaction => {
      const validation = this.validateTransactionServiceReferences(transaction);

      if (validation.isValid) {
        validCount++;
      } else {
        validation.issues.forEach(issue => {
          issueBreakdown[issue] = (issueBreakdown[issue] || 0) + 1;
        });
      }
    });

    const result: any = {
      totalServiceTransactions: analyzedTransactions.length,
      validTransactions: validCount,
      invalidTransactions: analyzedTransactions.length - validCount,
      issueBreakdown
    };

    if (cutoffDate && ignoredCount > 0) {
      result.ignoredOldTransactions = ignoredCount;
    }

    return result;
  }
}
