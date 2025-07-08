"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  Transaction,
  TransactionCreate,
  TransactionFilter,
  TransactionSource,
  TransactionStatus,
  TransactionType,
  PaymentMethod
} from "./transaction-types"
import { SettingsStorage } from "./settings-storage"
import { format, isAfter, isBefore, isSameDay, parseISO } from "date-fns"
import {
  removeDuplicateTransactions as removeDuplicatesUtil,
  findExistingTransactionsForAppointment
} from "./transaction-deduplication"
import { integratedAnalyticsService } from "./integrated-analytics-service"
import { realTimeService, RealTimeEventType } from "./real-time-service"

// Default transactions for initial setup (using real location IDs)
const getDefaultTransactions = (): Transaction[] => {
  const locations = SettingsStorage.getLocations()
  const primaryLocationId = locations.length > 0 ? locations[0].id : "loc1"
  const secondaryLocationId = locations.length > 1 ? locations[1].id : "loc2"

  // Use current month dates to ensure they appear in analytics
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return [
    // Today's transactions for Daily Sales demo
    {
      id: "TX-TODAY-001",
      date: new Date(), // Today
      clientName: "Jennifer Smith",
      type: TransactionType.SERVICE_SALE,
      category: "Service",
      description: "Haircut & Style",
      amount: 120.0,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: primaryLocationId,
      source: TransactionSource.CALENDAR,
      reference: { type: 'appointment', id: 'apt-001' },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "TX-TODAY-002",
      date: new Date(), // Today
      clientName: "Michael Johnson",
      type: TransactionType.PRODUCT_SALE,
      category: "Product",
      description: "Hair Styling Gel",
      amount: 25.0,
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      location: primaryLocationId,
      source: TransactionSource.POS,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "TX-TODAY-003",
      date: new Date(), // Today
      clientName: "Sarah Williams",
      type: TransactionType.SERVICE_SALE,
      category: "Service",
      description: "Manicure & Pedicure",
      amount: 85.0,
      paymentMethod: PaymentMethod.GIFT_CARD,
      status: TransactionStatus.COMPLETED,
      location: primaryLocationId,
      source: TransactionSource.CALENDAR,
      reference: { type: 'appointment', id: 'apt-002' },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Online store transactions for testing location filtering
    {
      id: "TX-ONLINE-001",
      date: new Date(), // Today
      clientName: "Emma Wilson",
      type: TransactionType.PRODUCT_SALE,
      category: "Product",
      description: "Shampoo & Conditioner Set",
      amount: 45.0,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: "online", // Online location
      source: TransactionSource.CLIENT_PORTAL,
      reference: { type: 'client_portal_order', id: 'order-001' },
      metadata: { isOnlineTransaction: true },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "TX-ONLINE-002",
      date: new Date(), // Today
      clientName: "David Chen",
      type: TransactionType.PRODUCT_SALE,
      category: "Product",
      description: "Hair Mask Treatment",
      amount: 35.0,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: "online", // Online location
      source: TransactionSource.ONLINE,
      metadata: { isOnlineTransaction: true },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Previous days' transactions
    {
      id: "TX-001",
      date: new Date(currentYear, currentMonth, 15), // 15th of current month
      clientName: "Jennifer Smith",
      type: TransactionType.INCOME,
      category: "Service",
      description: "Haircut & Style, Deep Conditioning",
      amount: 120.0,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: primaryLocationId,
      source: TransactionSource.MANUAL,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "TX-002",
      date: new Date(currentYear, currentMonth, 14), // 14th of current month
      clientName: "Michael Johnson",
      type: TransactionType.INCOME,
      category: "Service",
      description: "Men's Haircut",
      amount: 55.0,
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      location: primaryLocationId,
      source: TransactionSource.MANUAL,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "TX-003",
      date: new Date(currentYear, currentMonth, 13), // 13th of current month
      clientName: "Sarah Williams",
      type: TransactionType.INCOME,
      category: "Product",
      description: "Shampoo & Conditioner Set",
      amount: 45.0,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: secondaryLocationId, // Use second location for variety
      source: TransactionSource.MANUAL,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "TX-004",
      date: new Date(currentYear, currentMonth, 12), // 12th of current month
      clientName: "David Brown",
      type: TransactionType.INCOME,
      category: "Service",
      description: "Color & Highlights",
      amount: 150.0,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: secondaryLocationId, // Use second location for variety
      source: TransactionSource.MANUAL,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "TX-005",
      date: new Date(currentYear, currentMonth, 11), // 11th of current month
      clientName: "Emily Davis",
      type: TransactionType.INCOME,
      category: "Service + Product",
      description: "Blowout, Styling Products",
      amount: 95.0,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: primaryLocationId,
      source: TransactionSource.MANUAL,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: TransactionCreate) => Transaction;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Transaction | null;
  deleteTransaction: (id: string) => boolean;
  getTransaction: (id: string) => Transaction | null;
  filterTransactions: (filter: TransactionFilter) => Transaction[];
  getTransactionsBySource: (source: TransactionSource) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
  getTransactionsByDate: (date: Date) => Transaction[];
  removeDuplicateTransactions: () => number;
  cleanupAllDuplicates: () => number;
  cleanupAppointmentDuplicates: () => number;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const storedTransactions = localStorage.getItem('vanity_transactions');
    if (storedTransactions) {
      try {
        const parsedTransactions = JSON.parse(storedTransactions);
        // Convert date strings back to Date objects
        const transactionsWithDates = parsedTransactions.map((tx: any) => ({
          ...tx,
          date: new Date(tx.date),
          createdAt: new Date(tx.createdAt),
          updatedAt: new Date(tx.updatedAt)
        }));
        setTransactions(transactionsWithDates);
        console.log('Loaded transactions from localStorage:', transactionsWithDates.length);
      } catch (error) {
        console.error('Failed to parse stored transactions:', error);
        // If parsing fails, start with default transactions
        const defaultTransactions = getDefaultTransactions();
        setTransactions(defaultTransactions);
        console.log('Failed to parse stored transactions, using default data');
      }
    } else {
      // If no stored transactions, start with default transactions
      const defaultTransactions = getDefaultTransactions();
      setTransactions(defaultTransactions);
      console.log('No stored transactions found, initializing with default data');
    }
    setIsInitialized(true);
  }, []);

  // Save transactions to localStorage when they change (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('vanity_transactions', JSON.stringify(transactions));
        console.log('💾 TRANSACTION PROVIDER: Saved transactions to localStorage:', {
          count: transactions.length,
          latestTransactionIds: transactions.slice(-3).map(tx => tx.id),
          sources: [...new Set(transactions.map(tx => tx.source))]
        });

        // Sync with analytics service to ensure real-time updates
        integratedAnalyticsService.syncWithTransactionProvider(transactions);
      } catch (error) {
        console.error('❌ TRANSACTION PROVIDER: Failed to save transactions to localStorage:', error);
      }
    }
  }, [transactions, isInitialized]);

  // Function to remove duplicate transactions (legacy - kept for compatibility)
  const removeDuplicateTransactions = (): number => {
    console.log('🧹 Legacy duplicate removal called - using enhanced version');
    return cleanupAllDuplicates();
  };

  // Enhanced function to clean up all types of duplicates
  const cleanupAllDuplicates = (): number => {
    console.log('🧹 Starting comprehensive duplicate cleanup');

    let totalRemoved = 0;

    // Use the enhanced duplicate removal utility
    try {
      totalRemoved = removeDuplicatesUtil(transactions, (transactionId: string) => {
        setTransactions(prev => {
          const filtered = prev.filter(tx => tx.id !== transactionId);
          console.log(`Removed transaction ${transactionId}, ${prev.length} -> ${filtered.length}`);
          return filtered;
        });
      });

      console.log(`🧹 Enhanced duplicate cleanup completed. Removed ${totalRemoved} duplicates.`);
    } catch (error) {
      console.error('Error during duplicate cleanup:', error);

      // Fallback to simple duplicate removal
      totalRemoved += cleanupAppointmentDuplicates();
    }

    return totalRemoved;
  };

  // Specific function to clean up appointment transaction duplicates
  const cleanupAppointmentDuplicates = (): number => {
    console.log('🧹 Starting appointment duplicate cleanup');

    let totalRemoved = 0;
    const appointmentTransactionGroups = new Map<string, Transaction[]>();

    // Group transactions by appointment ID
    transactions.forEach(tx => {
      if (tx.reference?.type === 'appointment' && tx.reference?.id) {
        const appointmentId = tx.reference.id;
        if (!appointmentTransactionGroups.has(appointmentId)) {
          appointmentTransactionGroups.set(appointmentId, []);
        }
        appointmentTransactionGroups.get(appointmentId)!.push(tx);
      }
    });

    // Remove duplicates for each appointment
    appointmentTransactionGroups.forEach((txGroup, appointmentId) => {
      if (txGroup.length > 1) {
        console.log(`🔍 Found ${txGroup.length} transactions for appointment ${appointmentId}`);

        // Sort by creation date to keep the most recent one
        txGroup.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Keep the first (most recent) transaction, remove the rest
        for (let i = 1; i < txGroup.length; i++) {
          console.log(`🗑️ Removing duplicate transaction: ${txGroup[i].id} (Amount: ${txGroup[i].amount})`);
          deleteTransaction(txGroup[i].id);
          totalRemoved++;
        }

        console.log(`✅ Kept transaction: ${txGroup[0].id} (Amount: ${txGroup[0].amount})`);
      }
    });

    console.log(`🧹 Appointment duplicate cleanup completed. Removed ${totalRemoved} duplicates.`);
    return totalRemoved;
  };

  const addTransaction = (transaction: TransactionCreate): Transaction => {
    console.log('=== TRANSACTION PROVIDER: addTransaction called ===');
    console.log('Input transaction:', transaction);

    // Check for duplicates if this is an appointment transaction
    if (transaction.reference?.type === 'appointment' && transaction.reference?.id) {
      const appointmentRef = {
        id: transaction.reference.id,
        bookingReference: transaction.metadata?.bookingReference,
        clientId: transaction.clientId,
        date: transaction.date,
        amount: transaction.amount
      };

      const existingTransactions = findExistingTransactionsForAppointment(transactions, appointmentRef);

      // Filter existing transactions to only those of the same type
      const sameTypeTransactions = existingTransactions.filter(tx => tx.type === transaction.type);

      if (sameTypeTransactions.length > 0) {
        console.log('🚫 DUPLICATE TRANSACTION DETECTED - Same type transaction already exists');
        console.log('Existing transactions of same type:', sameTypeTransactions.map(tx => ({ id: tx.id, type: tx.type })));
        console.log('All existing transactions for appointment:', existingTransactions.map(tx => ({ id: tx.id, type: tx.type })));

        // If we have multiple existing transactions of the same type, clean them up
        if (sameTypeTransactions.length > 1) {
          console.log('🧹 Multiple existing transactions of same type detected, cleaning up duplicates');
          setTimeout(() => {
            cleanupAppointmentDuplicates();
          }, 100);
        }

        // Return the first existing transaction of the same type instead of creating a duplicate
        return sameTypeTransactions[0];
      } else if (existingTransactions.length > 0) {
        console.log('✅ ALLOWING NEW TRANSACTION - Different type from existing transactions');
        console.log('New transaction type:', transaction.type);
        console.log('Existing transaction types:', existingTransactions.map(tx => tx.type));
      }
    }

    // Generate a more unique transaction ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueId = transaction.id || `TX-${timestamp}-${randomSuffix}`;

    const newTransaction: Transaction = {
      ...transaction,
      id: uniqueId,
      date: transaction.date || new Date(),
      description: transaction.description || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('=== TRANSACTION PROVIDER: Created new transaction ===');
    console.log('New transaction:', newTransaction);
    console.log('Transaction ID:', newTransaction.id);
    console.log('Transaction source:', newTransaction.source);
    console.log('Transaction amount:', newTransaction.amount);

    setTransactions(prev => {
      // Double-check for duplicates in the current state
      const duplicateCheck = prev.find(tx => {
        // Check for exact ID match
        if (tx.id === newTransaction.id) {
          return true;
        }

        // For appointment transactions, check for same appointment AND same transaction type
        // This allows separate service and product transactions from the same appointment
        if (tx.reference?.type === 'appointment' &&
            newTransaction.reference?.type === 'appointment' &&
            tx.reference?.id === newTransaction.reference?.id &&
            tx.type === newTransaction.type) {
          console.log('🚫 TRANSACTION PROVIDER: Found duplicate appointment transaction of same type');
          console.log(`   Existing: ${tx.id} - Type: ${tx.type} - Amount: ${tx.amount}`);
          console.log(`   New: ${newTransaction.id} - Type: ${newTransaction.type} - Amount: ${newTransaction.amount}`);
          return true;
        }

        return false;
      });

      if (duplicateCheck) {
        console.log('🚫 TRANSACTION PROVIDER: Last-minute duplicate detected, skipping addition');
        console.log('🚫 Returning existing transaction instead:', duplicateCheck.id);
        return prev;
      }

      const updated = [...prev, newTransaction];
      console.log('✅ TRANSACTION PROVIDER: Updated transactions array:', {
        previousCount: prev.length,
        newCount: updated.length,
        newTransactionId: newTransaction.id,
        newTransactionSource: newTransaction.source,
        newTransactionAmount: newTransaction.amount,
        allTransactionIds: updated.slice(-5).map(tx => tx.id) // Show last 5 IDs
      });
      return updated;
    });

    // Emit real-time event for new transaction
    realTimeService.emitEvent(RealTimeEventType.TRANSACTION_CREATED, {
      transaction: newTransaction,
      source: newTransaction.source,
      amount: newTransaction.amount,
      clientName: newTransaction.clientName
    }, {
      source: 'TransactionProvider',
      userId: newTransaction.staffId,
      locationId: newTransaction.location
    });

    console.log('=== TRANSACTION PROVIDER: Returning transaction ===');
    return newTransaction;
  };

  // Update an existing transaction
  const updateTransaction = (id: string, updates: Partial<Transaction>): Transaction | null => {
    console.log('🔄 TransactionProvider: Updating transaction', { id, updates });
    let updatedTransaction: Transaction | null = null;

    setTransactions(prev => {
      const index = prev.findIndex(tx => tx.id === id);
      if (index === -1) {
        console.warn(`Transaction ${id} not found in provider`);
        return prev;
      }

      const updated = {
        ...prev[index],
        ...updates,
        updatedAt: new Date()
      };

      updatedTransaction = updated;
      const newTransactions = [...prev];
      newTransactions[index] = updated;

      console.log('✅ TransactionProvider: Transaction updated successfully', {
        id,
        oldStatus: prev[index].status,
        newStatus: updated.status
      });

      return newTransactions;
    });

    // Emit real-time event for transaction update
    if (updatedTransaction) {
      realTimeService.emitEvent(RealTimeEventType.TRANSACTION_UPDATED, {
        transaction: updatedTransaction,
        updates,
        previousStatus: updates.status ? 'updated' : 'unchanged'
      }, {
        source: 'TransactionProvider',
        userId: updatedTransaction.staffId || '',
        locationId: updatedTransaction.location || ''
      });
    }

    return updatedTransaction;
  };

  // Delete a transaction
  const deleteTransaction = (id: string): boolean => {
    let deleted = false;
    let deletedTransaction: Transaction | null = null;

    setTransactions(prev => {
      const index = prev.findIndex(tx => tx.id === id);
      if (index === -1) return prev;

      deleted = true;
      deletedTransaction = prev[index];
      const newTransactions = [...prev];
      newTransactions.splice(index, 1);
      return newTransactions;
    });

    // Emit real-time event for transaction deletion
    if (deleted && deletedTransaction) {
      realTimeService.emitEvent(RealTimeEventType.TRANSACTION_DELETED, {
        transactionId: id,
        transaction: deletedTransaction
      }, {
        source: 'TransactionProvider',
        userId: deletedTransaction.staffId || '',
        locationId: deletedTransaction.location || ''
      });
    }

    return deleted;
  };

  // Get a transaction by ID
  const getTransaction = (id: string): Transaction | null => {
    return transactions.find(tx => tx.id === id) || null;
  };

  // Filter transactions based on criteria
  const filterTransactions = (filter: TransactionFilter): Transaction[] => {
    console.log('🔍 TRANSACTION PROVIDER: Filtering transactions:', {
      totalTransactions: transactions.length,
      filter,
      clientPortalCount: transactions.filter(tx => tx.source === TransactionSource.CLIENT_PORTAL).length
    });

    const filtered = transactions.filter(tx => {
      // Convert date strings to Date objects if needed
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : tx.date;

      // Filter by date range
      if (filter.startDate && filter.endDate) {
        // Create end of day for endDate to include all transactions from that day
        const endOfDay = new Date(filter.endDate);
        endOfDay.setHours(23, 59, 59, 999);

        const isBeforeStart = isBefore(txDate, filter.startDate);
        const isAfterEnd = isAfter(txDate, endOfDay);

        if (tx.source === TransactionSource.CLIENT_PORTAL) {
          console.log('🔍 CLIENT_PORTAL transaction date check:', {
            transactionId: tx.id,
            txDate: txDate.toISOString(),
            startDate: filter.startDate.toISOString(),
            endDate: filter.endDate.toISOString(),
            endOfDay: endOfDay.toISOString(),
            isBeforeStart,
            isAfterEnd,
            willBeFiltered: isBeforeStart || isAfterEnd
          });
        }

        if (isBeforeStart || isAfterEnd) {
          return false;
        }
      }

      // Filter by single date
      if (filter.singleDate && !isSameDay(txDate, filter.singleDate)) {
        return false;
      }

      // Filter by type
      if (filter.type && tx.type !== filter.type) {
        return false;
      }

      // Filter by source
      if (filter.source && filter.source !== 'all' && tx.source !== filter.source) {
        console.log('🔍 Source filter check:', {
          transactionId: tx.id,
          txSource: tx.source,
          filterSource: filter.source,
          willBeFiltered: true
        });
        return false;
      }

      // Filter by status
      if (filter.status && tx.status !== filter.status) {
        return false;
      }

      // Filter by location with proper handling for online vs physical locations
      if (filter.location && filter.location !== 'all' && tx.location !== filter.location) {
        // Identify online transactions
        const isClientPortalTransaction = tx.source === TransactionSource.CLIENT_PORTAL;

        const isOnlineTransaction = tx.location === 'online' ||
                                  tx.location === 'client_portal' ||
                                  tx.metadata?.isOnlineTransaction === true;

        const hasNoLocation = !tx.location || tx.location === null || tx.location === undefined;

        const isOnlineRelated = isClientPortalTransaction || isOnlineTransaction || hasNoLocation;

        if (isOnlineRelated) {
          // Online transactions should ONLY appear when filtering by "online" location
          if (filter.location === 'online') {
            console.log('🔍 Online transaction included in online filter:', {
              transactionId: tx.id,
              txLocation: tx.location,
              txSource: tx.source,
              willBeFiltered: false,
              reason: 'Online transaction matches online location filter'
            });
            // Keep the transaction - it matches the online filter
          } else {
            console.log('🔍 Online transaction excluded from physical location filter:', {
              transactionId: tx.id,
              txLocation: tx.location,
              filterLocation: filter.location,
              txSource: tx.source,
              willBeFiltered: true,
              reason: 'Online transaction filtered out from physical location'
            });
            return false; // Filter out online transactions when filtering by physical locations
          }
        } else {
          // Physical location transaction that doesn't match the filter
          console.log('🔍 Physical location transaction check:', {
            transactionId: tx.id,
            txLocation: tx.location,
            filterLocation: filter.location,
            txSource: tx.source,
            willBeFiltered: true,
            reason: 'Physical location does not match filter'
          });
          return false;
        }
      }

      // Filter by client ID
      if (filter.clientId && tx.clientId !== filter.clientId) {
        return false;
      }

      // Filter by staff ID
      if (filter.staffId && tx.staffId !== filter.staffId) {
        return false;
      }

      // Filter by search term
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesId = tx.id.toLowerCase().includes(searchLower);
        const matchesClient = tx.clientName?.toLowerCase().includes(searchLower) || false;
        const matchesStaff = tx.staffName?.toLowerCase().includes(searchLower) || false;
        const matchesDescription = tx.description.toLowerCase().includes(searchLower);

        if (!(matchesId || matchesClient || matchesStaff || matchesDescription)) {
          return false;
        }
      }

      // Filter by amount range
      if (filter.minAmount !== undefined && tx.amount < filter.minAmount) {
        return false;
      }

      if (filter.maxAmount !== undefined && tx.amount > filter.maxAmount) {
        return false;
      }

      return true;
    });

    console.log('🔍 TRANSACTION PROVIDER: Filter results:', {
      originalCount: transactions.length,
      filteredCount: filtered.length,
      clientPortalFiltered: filtered.filter(tx => tx.source === TransactionSource.CLIENT_PORTAL).length
    });

    return filtered;
  };

  // Get transactions by source
  const getTransactionsBySource = (source: TransactionSource): Transaction[] => {
    return transactions.filter(tx => tx.source === source);
  };

  // Get transactions by date range
  const getTransactionsByDateRange = (startDate: Date, endDate: Date): Transaction[] => {
    return transactions.filter(tx => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : tx.date;
      return !isBefore(txDate, startDate) && !isAfter(txDate, endDate);
    });
  };

  // Get transactions by single date
  const getTransactionsByDate = (date: Date): Transaction[] => {
    return transactions.filter(tx => {
      const txDate = typeof tx.date === 'string' ? new Date(tx.date) : tx.date;
      return isSameDay(txDate, date);
    });
  };

  const value = {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransaction,
    filterTransactions,
    getTransactionsBySource,
    getTransactionsByDateRange,
    getTransactionsByDate,
    removeDuplicateTransactions,
    cleanupAllDuplicates,
    cleanupAppointmentDuplicates
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
