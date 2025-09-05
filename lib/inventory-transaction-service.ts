"use client"

import {
  Transaction,
  TransactionType,
  TransactionSource,
  TransactionStatus,
  PaymentMethod
} from "./transaction-types"
import { SettingsStorage } from "./settings-storage"

/**
 * Interface for inventory transaction data
 */
export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  locationId: string;
  quantity: number;
  transactionType: 'sale' | 'purchase' | 'adjustment' | 'transfer';
  costPrice: number;
  retailPrice?: number;
  totalCost: number;
  totalRevenue?: number;
  profitMargin?: number;
  reference?: {
    type: string;
    id: string;
  };
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

/**
 * Interface for inventory analytics
 */
export interface InventoryAnalytics {
  totalInventoryValue: number;
  totalCOGS: number;
  totalProductRevenue: number;
  totalProductProfit: number;
  averageMargin: number;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    profit: number;
  }>;
  lowStockItems: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    minStock: number;
    reorderRecommendation: number;
  }>;
  turnoverRates: Array<{
    productId: string;
    productName: string;
    turnoverRate: number;
    daysToSellOut: number;
  }>;
}

/**
 * Service for managing inventory transactions and financial integration
 */
export class InventoryTransactionService {
  private transactions: InventoryTransaction[] = [];
  private onTransactionAdded?: (transaction: Transaction) => void;

  constructor(onTransactionAdded?: (transaction: Transaction) => void) {
    this.onTransactionAdded = onTransactionAdded;
    this.loadFromStorage();
  }

  /**
   * Load inventory transactions from localStorage
   */
  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vanity_inventory_transactions');
      if (stored) {
        try {
          this.transactions = JSON.parse(stored).map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt)
          }));
        } catch (error) {
          console.error('Failed to load inventory transactions:', error);
        }
      }
    }
  }

  /**
   * Save inventory transactions to localStorage
   */
  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vanity_inventory_transactions', JSON.stringify(this.transactions));
    }
  }

  /**
   * Record a product sale and create corresponding financial transactions
   */
  recordProductSale(
    productId: string,
    productName: string,
    locationId: string,
    quantity: number,
    costPrice: number,
    retailPrice: number,
    paymentMethod: PaymentMethod,
    clientId?: string,
    clientName?: string,
    staffId?: string,
    staffName?: string,
    reference?: { type: string; id: string }
  ): { inventoryTransaction: InventoryTransaction; financialTransactions: Transaction[] } {

    const totalCost = costPrice * quantity;
    const totalRevenue = retailPrice * quantity;
    const profitMargin = ((totalRevenue - totalCost) / totalRevenue) * 100;

    // Generate a shorter 8-digit ID
    const generateShortId = () => {
      const timestamp = Date.now();
      const last6Digits = timestamp % 1000000; // Last 6 digits of timestamp
      const random2Digits = Math.floor(Math.random() * 100); // 2 random digits
      return `${last6Digits}${random2Digits.toString().padStart(2, '0')}`;
    };

    // Create inventory transaction
    const inventoryTransaction: InventoryTransaction = {
      id: generateShortId(),
      productId,
      productName,
      locationId,
      quantity: -quantity, // Negative for sales
      transactionType: 'sale',
      costPrice,
      retailPrice,
      totalCost,
      totalRevenue,
      profitMargin,
      reference,
      createdAt: new Date()
    };

    this.transactions.push(inventoryTransaction);
    this.saveToStorage();

    // Create financial transactions
    const financialTransactions: Transaction[] = [];

    // 1. Revenue transaction
    const revenueTransaction: Transaction = {
      id: generateShortId(),
      date: new Date(),
      type: TransactionType.INVENTORY_SALE,
      category: 'Product Sales',
      description: `Sale of ${quantity}x ${productName}`,
      amount: totalRevenue,
      paymentMethod,
      status: TransactionStatus.COMPLETED,
      location: locationId,
      source: TransactionSource.POS,
      clientId,
      clientName,
      staffId,
      staffName,
      productId,
      productName,
      quantity,
      costPrice,
      retailPrice,
      profitMargin,
      inventoryTransactionId: inventoryTransaction.id,
      reference,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 2. COGS transaction
    const cogsTransaction: Transaction = {
      id: generateShortId(),
      date: new Date(),
      type: TransactionType.COGS,
      category: 'Cost of Goods Sold',
      description: `COGS for ${quantity}x ${productName}`,
      amount: totalCost,
      paymentMethod: PaymentMethod.OTHER,
      status: TransactionStatus.COMPLETED,
      location: locationId,
      source: TransactionSource.SYSTEM,
      productId,
      productName,
      quantity,
      costPrice,
      retailPrice,
      profitMargin,
      inventoryTransactionId: inventoryTransaction.id,
      reference,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    financialTransactions.push(revenueTransaction, cogsTransaction);

    // Add to transaction system if callback provided
    if (this.onTransactionAdded) {
      financialTransactions.forEach(transaction => {
        this.onTransactionAdded!(transaction);
      });
    }

    return { inventoryTransaction, financialTransactions };
  }

  /**
   * Record inventory sale (for client portal purchases)
   */
  recordInventorySale(
    productId: string,
    productName: string,
    locationId: string,
    quantity: number,
    costPrice: number,
    salePrice: number,
    clientId: string,
    clientName: string,
    reference?: { type: string; id: string }
  ): Transaction {
    const totalAmount = quantity * salePrice
    const totalCost = quantity * costPrice

    // Generate a shorter 8-digit ID
    const generateShortId = () => {
      const timestamp = Date.now();
      const last6Digits = timestamp % 1000000; // Last 6 digits of timestamp
      const random2Digits = Math.floor(Math.random() * 100); // 2 random digits
      return `${last6Digits}${random2Digits.toString().padStart(2, '0')}`;
    };

    // Create the main transaction
    const transaction: Transaction = {
      id: generateShortId(),
      date: new Date(),
      type: TransactionType.PRODUCT_SALE,
      source: TransactionSource.CLIENT_PORTAL,
      status: TransactionStatus.COMPLETED,
      amount: totalAmount,
      paymentMethod: PaymentMethod.CREDIT_CARD, // Default for online orders
      clientId,
      clientName,
      location: locationId,
      category: "Online Product Sale",
      description: `${productName} - Online Order (Qty: ${quantity})`,
      items: [{
        id: productId,
        name: productName,
        quantity,
        unitPrice: salePrice,
        totalPrice: totalAmount,
        cost: costPrice,
        type: 'product'
      }],
      reference,
      metadata: {
        productId,
        quantity,
        costPrice,
        salePrice,
        totalCost,
        profit: totalAmount - totalCost,
        source: "client_portal"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to transaction system if callback provided
    if (this.onTransactionAdded) {
      this.onTransactionAdded(transaction);
    }

    console.log(`📦 Recording inventory sale: ${productName} x${quantity} = $${totalAmount}`)
    return transaction
  }

  /**
   * Record inventory purchase and create expense transaction
   */
  recordInventoryPurchase(
    productId: string,
    productName: string,
    locationId: string,
    quantity: number,
    costPrice: number,
    supplier?: string,
    reference?: { type: string; id: string }
  ): { inventoryTransaction: InventoryTransaction; financialTransaction: Transaction } {

    const totalCost = costPrice * quantity;

    // Generate a shorter 8-digit ID
    const generateShortId = () => {
      const timestamp = Date.now();
      const last6Digits = timestamp % 1000000; // Last 6 digits of timestamp
      const random2Digits = Math.floor(Math.random() * 100); // 2 random digits
      return `${last6Digits}${random2Digits.toString().padStart(2, '0')}`;
    };

    // Create inventory transaction
    const inventoryTransaction: InventoryTransaction = {
      id: generateShortId(),
      productId,
      productName,
      locationId,
      quantity, // Positive for purchases
      transactionType: 'purchase',
      costPrice,
      totalCost,
      reference,
      notes: supplier ? `Purchased from ${supplier}` : undefined,
      createdAt: new Date()
    };

    this.transactions.push(inventoryTransaction);
    this.saveToStorage();

    // Create expense transaction
    const expenseTransaction: Transaction = {
      id: generateShortId(),
      date: new Date(),
      type: TransactionType.INVENTORY_PURCHASE,
      category: 'Inventory Purchase',
      description: `Purchase of ${quantity}x ${productName}${supplier ? ` from ${supplier}` : ''}`,
      amount: totalCost,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: TransactionStatus.COMPLETED,
      location: locationId,
      source: TransactionSource.INVENTORY,
      productId,
      productName,
      quantity,
      costPrice,
      inventoryTransactionId: inventoryTransaction.id,
      reference,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to transaction system if callback provided
    if (this.onTransactionAdded) {
      this.onTransactionAdded(expenseTransaction);
    }

    return { inventoryTransaction, financialTransaction: expenseTransaction };
  }

  /**
   * Get inventory analytics for a date range
   */
  getInventoryAnalytics(
    startDate: Date,
    endDate: Date,
    locationId?: string
  ): InventoryAnalytics {
    const filteredTransactions = this.transactions.filter(t => {
      const inDateRange = t.createdAt >= startDate && t.createdAt <= endDate;
      const inLocation = !locationId || t.locationId === locationId;
      return inDateRange && inLocation;
    });

    // Calculate total inventory value (this would typically come from current stock levels)
    const totalInventoryValue = this.calculateInventoryValue(locationId);

    // Calculate COGS
    const totalCOGS = filteredTransactions
      .filter(t => t.transactionType === 'sale')
      .reduce((sum, t) => sum + t.totalCost, 0);

    // Calculate product revenue
    const totalProductRevenue = filteredTransactions
      .filter(t => t.transactionType === 'sale')
      .reduce((sum, t) => sum + (t.totalRevenue || 0), 0);

    // Calculate profit
    const totalProductProfit = totalProductRevenue - totalCOGS;

    // Calculate average margin
    const averageMargin = totalProductRevenue > 0 ? (totalProductProfit / totalProductRevenue) * 100 : 0;

    // Get top selling products
    const productSales = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();

    filteredTransactions
      .filter(t => t.transactionType === 'sale')
      .forEach(t => {
        const existing = productSales.get(t.productId) || {
          name: t.productName,
          quantity: 0,
          revenue: 0,
          profit: 0
        };
        existing.quantity += Math.abs(t.quantity);
        existing.revenue += t.totalRevenue || 0;
        existing.profit += (t.totalRevenue || 0) - t.totalCost;
        productSales.set(t.productId, existing);
      });

    const topSellingProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantitySold: data.quantity,
        revenue: data.revenue,
        profit: data.profit
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalInventoryValue,
      totalCOGS,
      totalProductRevenue,
      totalProductProfit,
      averageMargin,
      topSellingProducts,
      lowStockItems: [], // This would be populated from actual inventory data
      turnoverRates: [] // This would be calculated from actual inventory data
    };
  }

  /**
   * Calculate current inventory value (mock implementation)
   * Note: This should be replaced with real database queries
   */
  private calculateInventoryValue(locationId?: string): number {
    // This would typically query the actual inventory database
    // For now, return a mock value - this will be replaced by API call
    return 0; // Changed to 0 to indicate it needs real implementation
  }

  /**
   * Get all inventory transactions
   */
  getTransactions(): InventoryTransaction[] {
    return [...this.transactions];
  }

  /**
   * Get transactions by date range
   */
  getTransactionsByDateRange(startDate: Date, endDate: Date): InventoryTransaction[] {
    return this.transactions.filter(t =>
      t.createdAt >= startDate && t.createdAt <= endDate
    );
  }

  /**
   * Record a service sale transaction
   */
  recordServiceSale(
    serviceId: string,
    serviceName: string,
    price: number,
    clientId?: string,
    clientName?: string,
    staffId?: string,
    staffName?: string,
    location?: string,
    paymentMethod: PaymentMethod = PaymentMethod.CASH,
    reference?: { type: string; id: string }
  ): Transaction {
    // Use provided location or get the first active location as fallback
    const locations = SettingsStorage.getLocations()
    const locationToUse = location || (locations.length > 0 ? locations[0].id : "loc1")
    // Generate a shorter 8-digit ID
    const generateShortId = () => {
      const timestamp = Date.now();
      const last6Digits = timestamp % 1000000; // Last 6 digits of timestamp
      const random2Digits = Math.floor(Math.random() * 100); // 2 random digits
      return `${last6Digits}${random2Digits.toString().padStart(2, '0')}`;
    };

    const transaction: Transaction = {
      id: generateShortId(),
      date: new Date(),
      type: TransactionType.SERVICE_SALE,
      source: TransactionSource.CALENDAR,
      status: TransactionStatus.COMPLETED,
      amount: price,
      paymentMethod,
      clientId,
      clientName,
      staffId,
      staffName,
      location: locationToUse,
      category: "Service Sale",
      description: serviceName,
      items: [{
        id: serviceId,
        name: serviceName,
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
        type: 'service'
      }],
      reference,
      metadata: {
        serviceId,
        serviceName,
        price,
        // Ensure service ID is available for validation
        serviceIds: [serviceId]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to transaction system if callback provided
    if (this.onTransactionAdded) {
      this.onTransactionAdded(transaction);
    }

    console.log(`💇 Recording service sale: ${serviceName} = $${price}`)
    return transaction
  }

  /**
   * Record a product sale transaction (for POS)
   */
  recordPOSProductSale(
    productId: string,
    productName: string,
    quantity: number,
    unitPrice: number,
    clientId?: string,
    clientName?: string,
    staffId?: string,
    staffName?: string,
    location?: string,
    paymentMethod: PaymentMethod = PaymentMethod.CASH,
    reference?: { type: string; id: string }
  ): Transaction {
    // Use provided location or get the first active location as fallback
    const locations = SettingsStorage.getLocations()
    const locationToUse = location || (locations.length > 0 ? locations[0].id : "loc1")
    const totalAmount = quantity * unitPrice

    // Generate a shorter 8-digit ID
    const generateShortId = () => {
      const timestamp = Date.now();
      const last6Digits = timestamp % 1000000; // Last 6 digits of timestamp
      const random2Digits = Math.floor(Math.random() * 100); // 2 random digits
      return `${last6Digits}${random2Digits.toString().padStart(2, '0')}`;
    };

    const transaction: Transaction = {
      id: generateShortId(),
      date: new Date(),
      type: TransactionType.PRODUCT_SALE,
      source: TransactionSource.POS,
      status: TransactionStatus.COMPLETED,
      amount: totalAmount,
      paymentMethod,
      clientId,
      clientName,
      staffId,
      staffName,
      location: locationToUse,
      category: "Product Sale",
      description: `${productName} (Qty: ${quantity})`,
      items: [{
        id: productId,
        name: productName,
        quantity,
        unitPrice,
        totalPrice: totalAmount,
        type: 'product'
      }],
      reference,
      metadata: {
        productId,
        quantity,
        unitPrice
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to transaction system if callback provided
    if (this.onTransactionAdded) {
      this.onTransactionAdded(transaction);
    }

    console.log(`🏪 Recording POS product sale: ${productName} x${quantity} = $${totalAmount}`)
    return transaction
  }
}

// Export singleton instance
export const inventoryTransactionService = new InventoryTransactionService();
