"use client"

import { Transaction, TransactionType } from "./transaction-types"

/**
 * Enhanced transaction deduplication utility specifically targeting the discount-related duplicate issue
 * This utility focuses on identifying and resolving cases where both discounted and non-discounted
 * versions of the same transaction exist in the system
 */

/**
 * Find and group transactions that might be duplicates due to discount application
 * Returns a map of transaction groups where each group contains potential duplicates
 */
export function findDiscountDuplicateGroups(transactions: Transaction[]): Map<string, Transaction[]> {
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

        // Also check metadata for appointment ID
        if (tx.metadata?.appointmentId) {
            const appointmentId = tx.metadata.appointmentId;
            if (!appointmentTransactionGroups.has(appointmentId)) {
                appointmentTransactionGroups.set(appointmentId, []);
            }
            appointmentTransactionGroups.get(appointmentId)!.push(tx);
        }

        // Check booking reference as well
        if (tx.metadata?.bookingReference) {
            const bookingRef = tx.metadata.bookingReference;
            // Use a special key format to distinguish from appointment IDs
            const bookingKey = `booking-${bookingRef}`;
            if (!appointmentTransactionGroups.has(bookingKey)) {
                appointmentTransactionGroups.set(bookingKey, []);
            }
            appointmentTransactionGroups.get(bookingKey)!.push(tx);
        }
    });

    // Filter to only include groups with multiple transactions
    const duplicateGroups = new Map<string, Transaction[]>();

    appointmentTransactionGroups.forEach((txGroup, appointmentId) => {
        if (txGroup.length > 1) {
            // Check if there are transactions with different amounts (potential discount case)
            const uniqueAmounts = new Set(txGroup.map(tx => tx.amount));

            // Check for transactions created within a short time window (3 seconds)
            const timeWindowDuplicates = checkForTimeWindowDuplicates(txGroup, 3 * 1000); // 3 seconds in milliseconds

            // Check for transactions from different sources (POS, CALENDAR, CLIENT_PORTAL)
            const uniqueSources = new Set(txGroup.map(tx => tx.source));
            const hasMultipleSources = uniqueSources.size > 1;

            if (uniqueAmounts.size > 1 || timeWindowDuplicates || hasMultipleSources) {
                // This is likely a duplicate case from different sources or with different amounts
                duplicateGroups.set(appointmentId, txGroup);
                console.log(`🔍 Found potential duplicate group for ${appointmentId}:`, {
                    transactionCount: txGroup.length,
                    uniqueAmounts: Array.from(uniqueAmounts),
                    sources: Array.from(uniqueSources),
                    timeWindowDuplicates,
                    hasMultipleSources
                });
            }
        }
    });

    return duplicateGroups;
}

/**
 * Check if transactions were created within a short time window of each other
 * Returns true if any transactions were created within the specified time window
 */
function checkForTimeWindowDuplicates(transactions: Transaction[], timeWindowMs: number): boolean {
    if (transactions.length <= 1) return false;

    // Sort transactions by creation time
    const sortedTx = [...transactions].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return aTime - bTime;
    });

    // Check if any consecutive transactions were created within the time window
    for (let i = 1; i < sortedTx.length; i++) {
        const prevTime = new Date(sortedTx[i - 1].createdAt).getTime();
        const currTime = new Date(sortedTx[i].createdAt).getTime();

        if (currTime - prevTime <= timeWindowMs) {
            console.log(`🕒 Found transactions created within ${timeWindowMs / 1000} seconds of each other:`, {
                tx1: { id: sortedTx[i - 1].id, time: new Date(sortedTx[i - 1].createdAt).toISOString() },
                tx2: { id: sortedTx[i].id, time: new Date(sortedTx[i].createdAt).toISOString() }
            });
            return true;
        }
    }

    return false;
}

/**
 * Analyze a group of transactions to determine which one to keep
 * Returns the transaction to keep and the transactions to remove
 */
export function analyzeDiscountDuplicates(
    transactions: Transaction[]
): { transactionToKeep: Transaction; transactionsToRemove: Transaction[] } {
    // Log the transactions we're analyzing
    console.log(`🔍 Analyzing ${transactions.length} potential duplicate transactions:`,
        transactions.map(tx => ({
            id: tx.id,
            amount: tx.amount,
            source: tx.source,
            createdAt: new Date(tx.createdAt).toISOString(),
            hasDiscount: tx.discountPercentage && tx.discountPercentage > 0
        }))
    );

    // First, check if we have a transaction with discount information
    const discountedTx = transactions.find(tx => tx.discountPercentage && tx.discountPercentage > 0);

    // If we have a transaction with discount info, prioritize keeping it
    if (discountedTx) {
        console.log(`✅ Found transaction with explicit discount information: ${discountedTx.id} (${discountedTx.discountPercentage}% off)`);

        // Find the transaction with the highest amount (likely the pre-discount one)
        const sortedByAmount = [...transactions].sort((a, b) => b.amount - a.amount);
        const highestAmountTx = sortedByAmount[0];

        // Calculate service and product amounts
        let serviceAmount = 0;
        let productAmount = 0;

        // Try to extract service and product amounts from the discounted transaction
        if (discountedTx.serviceAmount !== undefined) {
            serviceAmount = discountedTx.serviceAmount;
        } else if (discountedTx.items && Array.isArray(discountedTx.items)) {
            serviceAmount = discountedTx.items
                .filter(item => item.type === 'service')
                .reduce((sum, item) => sum + item.totalPrice, 0);
        } else if (discountedTx.type === TransactionType.SERVICE_SALE) {
            serviceAmount = discountedTx.amount;
        }

        if (discountedTx.productAmount !== undefined) {
            productAmount = discountedTx.productAmount;
        } else if (discountedTx.items && Array.isArray(discountedTx.items)) {
            productAmount = discountedTx.items
                .filter(item => item.type === 'product')
                .reduce((sum, item) => sum + item.totalPrice, 0);
        } else if (discountedTx.type === TransactionType.PRODUCT_SALE ||
            discountedTx.type === TransactionType.INVENTORY_SALE) {
            productAmount = discountedTx.amount;
        }

        // Calculate original amount and discount
        const originalAmount = highestAmountTx.amount;
        const discountedAmount = discountedTx.amount;
        const discountAmount = originalAmount - discountedAmount;
        const discountPercentage = Math.round((discountAmount / originalAmount) * 100);

        // Create an enhanced version of the discounted transaction with all necessary information
        const enhancedTransaction: Transaction = {
            ...discountedTx,
            serviceAmount: serviceAmount,
            productAmount: productAmount,
            originalServiceAmount: originalAmount - productAmount,
            discountPercentage: discountPercentage,
            discountAmount: discountAmount
        };

        // Update description to include discount information if not already present
        if (!enhancedTransaction.description.includes('% off')) {
            enhancedTransaction.description += ` (${discountPercentage}% off)`;
        }

        // Return the enhanced transaction to keep and the transactions to remove
        return {
            transactionToKeep: enhancedTransaction,
            transactionsToRemove: transactions.filter(tx => tx.id !== discountedTx.id)
        };
    }

    // If no transaction has explicit discount info, check if we have transactions from different sources
    const uniqueSources = new Set(transactions.map(tx => tx.source));
    if (uniqueSources.size > 1) {
        console.log(`🔄 Found transactions from different sources: ${Array.from(uniqueSources).join(', ')}`);

        // Sort transactions by completeness of data (prefer transactions with more detailed information)
        const scoredTransactions = transactions.map(tx => {
            let score = 0;

            // Prefer transactions with item details
            if (tx.items && tx.items.length > 0) score += 5;

            // Prefer transactions with service/product amount breakdown
            if (tx.serviceAmount !== undefined) score += 3;
            if (tx.productAmount !== undefined) score += 3;

            // Prefer transactions with client and staff information
            if (tx.clientId) score += 2;
            if (tx.staffId) score += 2;

            // Prefer transactions with metadata
            if (tx.metadata && Object.keys(tx.metadata).length > 0) score += 2;

            return { tx, score };
        }).sort((a, b) => b.score - a.score);

        const bestTransaction = scoredTransactions[0].tx;
        console.log(`✅ Selected most complete transaction: ${bestTransaction.id} (score: ${scoredTransactions[0].score})`);

        // Sort remaining transactions by amount to find the highest amount (if different from best)
        const sortedByAmount = [...transactions].sort((a, b) => b.amount - a.amount);
        const highestAmountTx = sortedByAmount[0];

        // If the best transaction has a lower amount than the highest, it might be discounted
        if (bestTransaction.amount < highestAmountTx.amount && bestTransaction.id !== highestAmountTx.id) {
            const originalAmount = highestAmountTx.amount;
            const discountedAmount = bestTransaction.amount;
            const discountAmount = originalAmount - discountedAmount;
            const discountPercentage = Math.round((discountAmount / originalAmount) * 100);

            // Only apply discount logic if the difference is significant (>1%)
            if (discountPercentage > 1) {
                console.log(`💰 Detected implicit discount of ${discountPercentage}% (${originalAmount} → ${discountedAmount})`);

                // Calculate service and product amounts
                let serviceAmount = 0;
                let productAmount = 0;

                // Try to extract service and product amounts
                if (bestTransaction.serviceAmount !== undefined) {
                    serviceAmount = bestTransaction.serviceAmount;
                } else if (bestTransaction.items && Array.isArray(bestTransaction.items)) {
                    serviceAmount = bestTransaction.items
                        .filter(item => item.type === 'service')
                        .reduce((sum, item) => sum + item.totalPrice, 0);
                } else if (bestTransaction.type === TransactionType.SERVICE_SALE) {
                    serviceAmount = bestTransaction.amount;
                }

                if (bestTransaction.productAmount !== undefined) {
                    productAmount = bestTransaction.productAmount;
                } else if (bestTransaction.items && Array.isArray(bestTransaction.items)) {
                    productAmount = bestTransaction.items
                        .filter(item => item.type === 'product')
                        .reduce((sum, item) => sum + item.totalPrice, 0);
                } else if (bestTransaction.type === TransactionType.PRODUCT_SALE ||
                    bestTransaction.type === TransactionType.INVENTORY_SALE) {
                    productAmount = bestTransaction.amount;
                }

                // Create an enhanced version with discount information
                const enhancedTransaction: Transaction = {
                    ...bestTransaction,
                    serviceAmount: serviceAmount,
                    productAmount: productAmount,
                    originalServiceAmount: originalAmount - productAmount,
                    discountPercentage: discountPercentage,
                    discountAmount: discountAmount
                };

                // Update description to include discount information if not already present
                if (!enhancedTransaction.description.includes('% off')) {
                    enhancedTransaction.description += ` (${discountPercentage}% off)`;
                }

                return {
                    transactionToKeep: enhancedTransaction,
                    transactionsToRemove: transactions.filter(tx => tx.id !== bestTransaction.id)
                };
            }
        }

        // If no discount detected, just keep the best transaction
        return {
            transactionToKeep: bestTransaction,
            transactionsToRemove: transactions.filter(tx => tx.id !== bestTransaction.id)
        };
    }

    // Default case: sort by amount (ascending) to find the lowest amount (likely the discounted one)
    const sortedTransactions = [...transactions].sort((a, b) => a.amount - b.amount);

    // The transaction with the lowest amount is likely the discounted one
    const lowestAmountTx = sortedTransactions[0];
    const highestAmountTx = sortedTransactions[sortedTransactions.length - 1];

    // Only apply discount logic if there's a significant difference in amounts
    if (lowestAmountTx.amount < highestAmountTx.amount) {
        // Calculate service and product amounts
        let serviceAmount = 0;
        let productAmount = 0;

        // Try to extract service and product amounts from the transaction
        if (lowestAmountTx.serviceAmount !== undefined) {
            serviceAmount = lowestAmountTx.serviceAmount;
        } else if (lowestAmountTx.items && Array.isArray(lowestAmountTx.items)) {
            serviceAmount = lowestAmountTx.items
                .filter(item => item.type === 'service')
                .reduce((sum, item) => sum + item.totalPrice, 0);
        } else if (lowestAmountTx.type === TransactionType.SERVICE_SALE) {
            serviceAmount = lowestAmountTx.amount;
        }

        if (lowestAmountTx.productAmount !== undefined) {
            productAmount = lowestAmountTx.productAmount;
        } else if (lowestAmountTx.items && Array.isArray(lowestAmountTx.items)) {
            productAmount = lowestAmountTx.items
                .filter(item => item.type === 'product')
                .reduce((sum, item) => sum + item.totalPrice, 0);
        } else if (lowestAmountTx.type === TransactionType.PRODUCT_SALE ||
            lowestAmountTx.type === TransactionType.INVENTORY_SALE) {
            productAmount = lowestAmountTx.amount;
        }

        // Calculate original amount and discount
        const originalAmount = highestAmountTx.amount;
        const discountedAmount = lowestAmountTx.amount;
        const discountAmount = originalAmount - discountedAmount;
        const discountPercentage = Math.round((discountAmount / originalAmount) * 100);

        // Create an enhanced version of the lowest amount transaction with all necessary information
        const enhancedTransaction: Transaction = {
            ...lowestAmountTx,
            serviceAmount: serviceAmount,
            productAmount: productAmount,
            originalServiceAmount: originalAmount - productAmount,
            discountPercentage: discountPercentage,
            discountAmount: discountAmount
        };

        // Update description to include discount information if not already present
        if (!enhancedTransaction.description.includes('% off')) {
            enhancedTransaction.description += ` (${discountPercentage}% off)`;
        }

        // Return the enhanced transaction to keep and the transactions to remove
        return {
            transactionToKeep: enhancedTransaction,
            transactionsToRemove: sortedTransactions.slice(1)
        };
    }

    // If all transactions have the same amount, keep the most recent one
    const sortedByDate = [...transactions].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log(`📅 All transactions have the same amount. Keeping the most recent one: ${sortedByDate[0].id}`);

    return {
        transactionToKeep: sortedByDate[0],
        transactionsToRemove: sortedByDate.slice(1)
    };
}

/**
 * Fix discount-related duplicate transactions
 * Returns the number of duplicates fixed
 */
export function fixDiscountDuplicates(
    transactions: Transaction[],
    updateTransactionCallback: (transaction: Transaction) => void,
    removeTransactionCallback: (transactionId: string) => void
): number {
    console.log(`🔧 Starting discount duplicate fix for ${transactions.length} transactions`);

    // First, run a pre-check to identify transactions from different sources for the same appointment
    const sourceGroups = new Map<string, Map<string, Transaction[]>>();

    // Group transactions by appointment ID and then by source
    transactions.forEach(tx => {
        let appointmentId = null;

        // Try to get appointment ID from various sources
        if (tx.reference?.type === 'appointment' && tx.reference?.id) {
            appointmentId = tx.reference.id;
        } else if (tx.metadata?.appointmentId) {
            appointmentId = tx.metadata.appointmentId;
        } else if (tx.metadata?.bookingReference) {
            appointmentId = `booking-${tx.metadata.bookingReference}`;
        }

        if (appointmentId) {
            if (!sourceGroups.has(appointmentId)) {
                sourceGroups.set(appointmentId, new Map<string, Transaction[]>());
            }

            const sourceMap = sourceGroups.get(appointmentId)!;
            const source = tx.source || 'unknown';

            if (!sourceMap.has(source)) {
                sourceMap.set(source, []);
            }

            sourceMap.get(source)!.push(tx);
        }
    });

    // Log appointments with transactions from multiple sources
    sourceGroups.forEach((sourceMap, appointmentId) => {
        if (sourceMap.size > 1) {
            console.log(`⚠️ Appointment ${appointmentId} has transactions from ${sourceMap.size} different sources:`,
                Array.from(sourceMap.keys()));
        }
    });

    // Now proceed with the regular duplicate detection and fixing
    const duplicateGroups = findDiscountDuplicateGroups(transactions);
    let duplicatesFixed = 0;

    console.log(`🔍 Found ${duplicateGroups.size} potential discount duplicate groups`);

    duplicateGroups.forEach((txGroup, appointmentId) => {
        console.log(`🔍 Processing group for appointment ${appointmentId} with ${txGroup.length} transactions`);

        // Check if this is a case of transactions from different sources
        const uniqueSources = new Set(txGroup.map(tx => tx.source));
        if (uniqueSources.size > 1) {
            console.log(`🔄 This group has transactions from multiple sources: ${Array.from(uniqueSources).join(', ')}`);
        }

        // Check if this is a case of transactions with different amounts (potential discount)
        const uniqueAmounts = new Set(txGroup.map(tx => tx.amount));
        if (uniqueAmounts.size > 1) {
            console.log(`💰 This group has transactions with different amounts: ${Array.from(uniqueAmounts).join(', ')}`);
        }

        const { transactionToKeep, transactionsToRemove } = analyzeDiscountDuplicates(txGroup);

        // Update the transaction to keep with enhanced information
        console.log(`✅ Keeping and enhancing transaction: ${transactionToKeep.id} (${transactionToKeep.amount})`);

        // Create a deep copy of the transaction to avoid reference issues
        const enhancedTransaction = {
            ...transactionToKeep,
            // Ensure these fields are properly set
            serviceAmount: transactionToKeep.serviceAmount || 0,
            productAmount: transactionToKeep.productAmount || 0,
            // If this transaction has discount info, make sure it's preserved
            discountPercentage: transactionToKeep.discountPercentage || 0,
            discountAmount: transactionToKeep.discountAmount || 0
        };

        // Update the transaction with the enhanced information
        updateTransactionCallback(enhancedTransaction);

        // Remove the other transactions
        transactionsToRemove.forEach(tx => {
            console.log(`❌ Removing duplicate transaction: ${tx.id} (${tx.amount})`);
            removeTransactionCallback(tx.id);
            duplicatesFixed++;
        });
    });

    console.log(`🧹 Discount duplicate fix completed. Fixed ${duplicatesFixed} duplicates.`);
    return duplicatesFixed;
}