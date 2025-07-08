"use client"

import { Transaction, TransactionSource } from "./transaction-types"

/**
 * Transaction Deduplication Utility
 *
 * This utility provides functions to prevent duplicate transactions from being created
 * for the same appointment, especially when appointments are completed through different
 * channels (client portal, staff interface, etc.)
 */

export interface AppointmentReference {
  id: string;
  bookingReference?: string;
  clientId?: string;
  date: string | Date;
  amount: number;
}

/**
 * Check if a transaction already exists for a given appointment
 * Uses multiple criteria to detect potential duplicates:
 * - Appointment reference ID
 * - Appointment metadata
 * - Booking reference
 * - Client, amount, and date proximity matching
 * - Enhanced duplicate detection for similar transactions
 */
export function findExistingTransactionsForAppointment(
  transactions: Transaction[],
  appointment: AppointmentReference
): Transaction[] {
  console.log(`🔍 Checking for existing transactions for appointment ${appointment.id}`);
  console.log(`📊 Total transactions to check: ${transactions.length}`);

  const existingTransactions = transactions.filter(tx => {
    // Check by appointment reference (primary method)
    if (tx.reference?.type === 'appointment' && tx.reference?.id === appointment.id) {
      console.log(`✅ Found exact appointment reference match: ${tx.id}`);
      return true;
    }

    // Check by appointment metadata
    if (tx.metadata?.appointmentId === appointment.id) {
      console.log(`✅ Found appointment metadata match: ${tx.id}`);
      return true;
    }

    // Check by booking reference if available
    if (appointment.bookingReference && tx.metadata?.bookingReference === appointment.bookingReference) {
      console.log(`✅ Found booking reference match: ${tx.id}`);
      return true;
    }

    // Enhanced duplicate detection: Check for similar transactions
    // This catches cases where the same appointment might be processed multiple times
    if (appointment.clientId && tx.clientId === appointment.clientId) {

      // Check if it's an appointment service transaction
      const isAppointmentService = tx.category === "Appointment Service" ||
                                   tx.source === "calendar" ||
                                   tx.type === "service_sale";

      if (isAppointmentService) {
        const txDate = new Date(tx.date);
        const appointmentDate = new Date(appointment.date);
        const timeDiff = Math.abs(txDate.getTime() - appointmentDate.getTime());
        const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds (increased tolerance)

        if (timeDiff <= twoHours) {
          // For appointment transactions, check if amounts are similar OR if this is the same appointment
          // This handles cases where discounts are applied and amounts differ
          const amountsSimilar = Math.abs(tx.amount - appointment.amount) < 0.01;
          const sameAppointmentContext = tx.metadata?.appointmentId === appointment.id ||
                                       tx.reference?.id === appointment.id ||
                                       tx.metadata?.bookingReference === appointment.bookingReference;

          if (amountsSimilar || sameAppointmentContext) {
            console.log(`⚠️ Found potential duplicate by client/date match: ${tx.id}`);
            console.log(`   Client: ${tx.clientId}, TX Amount: ${tx.amount}, Appt Amount: ${appointment.amount}, Time diff: ${timeDiff}ms`);
            console.log(`   Same appointment context: ${sameAppointmentContext}, Amounts similar: ${amountsSimilar}`);
            return true;
          }
        }
      }
    }

    return false;
  });

  console.log(`🔍 Found ${existingTransactions.length} existing transactions for appointment ${appointment.id}`);
  return existingTransactions;
}

/**
 * Check if it's safe to create a transaction for an appointment
 * Returns true if no duplicates are found and creation is not in progress
 */
export function canCreateTransactionForAppointment(
  transactions: Transaction[],
  appointment: AppointmentReference & { _transactionCreationInProgress?: boolean }
): boolean {
  // Check if creation is already in progress
  if (appointment._transactionCreationInProgress) {
    console.log("Transaction deduplication - Creation already in progress for appointment:", appointment.id);
    return false;
  }

  // Check for existing transactions
  const existingTransactions = findExistingTransactionsForAppointment(transactions, appointment);

  if (existingTransactions.length > 0) {
    console.log("Transaction deduplication - Found existing transactions for appointment:", appointment.id);
    console.log("Transaction deduplication - Existing transactions count:", existingTransactions.length);
    existingTransactions.forEach((tx, index) => {
      console.log(`Transaction deduplication - Transaction ${index + 1}: ${tx.id} - ${tx.amount} - ${tx.source}`);
    });
    return false;
  }

  return true;
}

/**
 * Mark an appointment as having transaction creation in progress
 * This prevents multiple simultaneous creation attempts
 */
export function markTransactionCreationInProgress(
  appointment: any,
  timeoutMs: number = 5000
): void {
  appointment._transactionCreationInProgress = true;

  // Clear the flag after the specified timeout
  setTimeout(() => {
    delete appointment._transactionCreationInProgress;
  }, timeoutMs);
}

/**
 * Remove duplicate transactions based on appointment reference and similarity
 * This can be used to clean up existing duplicates
 * Returns the number of duplicates removed
 */
export function removeDuplicateTransactions(
  transactions: Transaction[],
  removeTransactionCallback: (transactionId: string) => void
): number {
  console.log(`🧹 Starting duplicate transaction cleanup for ${transactions.length} transactions`);

  const appointmentTransactionGroups = new Map<string, Transaction[]>();
  const similarTransactionGroups = new Map<string, Transaction[]>();
  let duplicatesRemoved = 0;

  // Group transactions by appointment ID (exact matches)
  transactions.forEach(tx => {
    if (tx.reference?.type === 'appointment' && tx.reference?.id) {
      const appointmentId = tx.reference.id;
      if (!appointmentTransactionGroups.has(appointmentId)) {
        appointmentTransactionGroups.set(appointmentId, []);
      }
      appointmentTransactionGroups.get(appointmentId)!.push(tx);
    }
  });

  // Group similar transactions (same client, amount, date, service type)
  transactions.forEach(tx => {
    if (tx.clientId && tx.amount && (tx.category === "Appointment Service" || tx.source === "calendar")) {
      const txDate = new Date(tx.date);
      const similarityKey = `${tx.clientId}-${tx.amount}-${txDate.toDateString()}-service`;

      if (!similarTransactionGroups.has(similarityKey)) {
        similarTransactionGroups.set(similarityKey, []);
      }
      similarTransactionGroups.get(similarityKey)!.push(tx);
    }
  });

  // Remove exact appointment duplicates
  appointmentTransactionGroups.forEach((txGroup, appointmentId) => {
    if (txGroup.length > 1) {
      console.log(`🔍 Found ${txGroup.length} exact duplicate transactions for appointment ${appointmentId}`);

      // Sort by creation date to keep the earliest one
      txGroup.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      // Remove all but the first transaction
      for (let i = 1; i < txGroup.length; i++) {
        console.log(`❌ Removing exact duplicate transaction: ${txGroup[i].id}`);
        removeTransactionCallback(txGroup[i].id);
        duplicatesRemoved++;
      }
    }
  });

  // Remove similar transaction duplicates (but be more careful)
  similarTransactionGroups.forEach((txGroup, similarityKey) => {
    if (txGroup.length > 1) {
      console.log(`🔍 Found ${txGroup.length} similar transactions for key ${similarityKey}`);

      // Filter out transactions that were already removed as exact duplicates
      const remainingTransactions = txGroup.filter(tx =>
        transactions.some(existingTx => existingTx.id === tx.id)
      );

      if (remainingTransactions.length > 1) {
        // Sort by creation date and completeness (prefer transactions with more metadata)
        remainingTransactions.sort((a, b) => {
          // First, prefer transactions with appointment references
          const aHasRef = a.reference?.type === 'appointment' ? 1 : 0;
          const bHasRef = b.reference?.type === 'appointment' ? 1 : 0;
          if (aHasRef !== bHasRef) return bHasRef - aHasRef;

          // Then, prefer earlier creation date
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        // Remove all but the best transaction
        for (let i = 1; i < remainingTransactions.length; i++) {
          console.log(`❌ Removing similar duplicate transaction: ${remainingTransactions[i].id}`);
          removeTransactionCallback(remainingTransactions[i].id);
          duplicatesRemoved++;
        }
      }
    }
  });

  console.log(`🧹 Duplicate cleanup completed. Removed ${duplicatesRemoved} duplicate transactions.`);
  return duplicatesRemoved;
}

/**
 * Validate that a transaction should be created for an appointment
 * Comprehensive check that includes amount validation and duplicate prevention
 */
export function validateTransactionCreation(
  transactions: Transaction[],
  appointment: AppointmentReference & { _transactionCreationInProgress?: boolean },
  minAmount: number = 0.01
): { canCreate: boolean; reason?: string } {
  // Check if amount is valid
  if (appointment.amount < minAmount) {
    return {
      canCreate: false,
      reason: `Amount ${appointment.amount} is below minimum threshold ${minAmount}`
    };
  }

  // Check if creation is safe
  if (!canCreateTransactionForAppointment(transactions, appointment)) {
    return {
      canCreate: false,
      reason: "Duplicate transaction detected or creation in progress"
    };
  }

  return { canCreate: true };
}
