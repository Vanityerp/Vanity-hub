"use client"

import { Transaction, TransactionType, TransactionSource, TransactionStatus } from "./transaction-types"
import { inventoryTransactionService } from "./inventory-transaction-service"

/**
 * Comprehensive analytics interface combining all business metrics
 */
export interface IntegratedAnalytics {
  // Revenue Analytics
  totalRevenue: number;
  serviceRevenue: number;
  productRevenue: number;
  revenueGrowth: number;
  clientPortalRevenue: number;
  posRevenue: number;
  calendarRevenue: number;
  homeServiceRevenue: number;
  homeServiceServices: number;
  homeServiceProducts: number;
  inPersonServices: number;
  inPersonProducts: number;

  // Expense Analytics
  totalExpenses: number;
  operatingExpenses: number;
  cogs: number;
  expenseGrowth: number;

  // Profit Analytics
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;

  // Inventory Analytics
  inventoryValue: number;
  inventoryTurnover: number;
  lowStockItems: number;
  outOfStockItems: number;

  // Product Performance
  topSellingProducts: Array<{
    id: string;
    name: string;
    category: string;
    quantitySold: number;
    revenue: number;
    profit: number;
    margin: number;
    averagePrice: number;
    salesCount: number;
    trend: number;
  }>;

  // Service Performance
  topServices: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
    averagePrice: number;
  }>;

  // Financial Health Indicators
  revenuePerClient: number;
  averageTransactionValue: number;
  profitPerTransaction: number;
  cashFlow: number;
}

/**
 * Service for integrated analytics across all business functions
 */
export class IntegratedAnalyticsService {
  private transactions: Transaction[] = [];
  private listeners: Array<(analytics: IntegratedAnalytics) => void> = [];

  constructor() {
    this.loadTransactions();
  }

  /**
   * Load transactions from localStorage
   */
  private loadTransactions() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vanity_transactions');
      if (stored) {
        try {
          this.transactions = JSON.parse(stored).map((t: any) => ({
            ...t,
            date: new Date(t.date),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt)
          }));
        } catch (error) {
          console.error('Failed to load transactions:', error);
        }
      }
    }
  }

  /**
   * Save transactions to localStorage
   */
  private saveTransactions() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vanity_transactions', JSON.stringify(this.transactions));
    }
  }

  /**
   * Add a new transaction and update analytics
   */
  addTransaction(transaction: Transaction) {
    this.transactions.push(transaction);
    this.saveTransactions();
    this.notifyListeners();
  }

  /**
   * Update an existing transaction and refresh analytics
   */
  updateTransaction(transactionId: string, updates: Partial<Transaction>): Transaction | null {
    const index = this.transactions.findIndex(t => t.id === transactionId);
    if (index === -1) {
      console.warn(`Transaction ${transactionId} not found in analytics service`);
      return null;
    }

    const updatedTransaction = {
      ...this.transactions[index],
      ...updates,
      updatedAt: new Date()
    };

    this.transactions[index] = updatedTransaction;
    this.saveTransactions();
    this.notifyListeners();

    console.log('🔄 IntegratedAnalyticsService: Transaction updated', { transactionId, updates });
    return updatedTransaction;
  }

  /**
   * Sync with external transaction data (e.g., from TransactionProvider)
   */
  syncWithTransactionProvider(transactions: Transaction[]) {
    this.transactions = transactions.map(t => ({
      ...t,
      date: new Date(t.date),
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt)
    }));
    this.saveTransactions();
    this.notifyListeners();
    console.log('🔄 IntegratedAnalyticsService: Synced with transaction provider', { count: transactions.length });
  }

  /**
   * Subscribe to analytics updates
   */
  subscribe(listener: (analytics: IntegratedAnalytics) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of analytics updates
   */
  private notifyListeners() {
    const analytics = this.getAnalytics();
    this.listeners.forEach(listener => listener(analytics));
  }

  /**
   * Get comprehensive analytics for a date range
   */
  getAnalytics(
    startDate?: Date,
    endDate?: Date,
    locationId?: string
  ): IntegratedAnalytics {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = now;

    const start = startDate || defaultStart;
    const end = endDate || defaultEnd;

    // Filter transactions by date range and location
    const filteredTransactions = this.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const inDateRange = transactionDate >= start && transactionDate <= end;

      // Location filtering logic
      let inLocation = true;
      if (locationId && locationId !== 'all') {
        if (locationId === 'online') {
          // For online location filter, only include client portal transactions
          inLocation = t.source === TransactionSource.CLIENT_PORTAL && t.location === 'online';
        } else {
          // For specific location filter, only include transactions from that location
          inLocation = t.location === locationId;
        }
      }

      return inDateRange && inLocation;
    });

    console.log('💰 ANALYTICS: Transaction filtering results:', {
      totalTransactions: this.transactions.length,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      locationId,
      filteredCount: filteredTransactions.length,
      clientPortalInFiltered: filteredTransactions.filter(t => t.source === TransactionSource.CLIENT_PORTAL).length,
      onlineLocationInFiltered: filteredTransactions.filter(t => t.location === 'online').length
    });

    // Calculate revenue metrics - EXCLUDE CANCELLED TRANSACTIONS
    // Enhanced service revenue calculation to include all service-related transactions
    const serviceTransactions = filteredTransactions.filter(t =>
      // Include all service sale transactions
      ((t.type === TransactionType.INCOME || 
        t.type === TransactionType.SERVICE_SALE || 
        t.type === TransactionType.CONSOLIDATED_SALE) &&
       t.source !== TransactionSource.INVENTORY &&
       t.status !== TransactionStatus.CANCELLED) ||
      // Also include transactions with service items
      (t.items && Array.isArray(t.items) && 
       t.items.some(item => item.type === 'service') &&
       t.status !== TransactionStatus.CANCELLED)
    );

    // Implement enhanced deduplication to prevent counting revenue multiple times
    // This prevents duplicate revenue from home service appointments and other sources
    const deduplicatedServiceTransactions = serviceTransactions.reduce((acc, transaction) => {
      // Check if this is a home service appointment transaction
      if (transaction.metadata?.location === 'home' && transaction.metadata?.appointmentId) {
        const appointmentId = transaction.metadata.appointmentId;
        const existingTransaction = acc.find(t =>
          t.metadata?.appointmentId === appointmentId &&
          t.metadata?.location === 'home'
        );

        if (!existingTransaction) {
          // First occurrence of this home service appointment - include it
          acc.push(transaction);
        }
        // Skip duplicate home service appointment revenue
      } else if (transaction.reference?.type === 'appointment' && transaction.reference?.id) {
        // Check for duplicate appointment transactions
        const appointmentId = transaction.reference.id;
        const existingTransaction = acc.find(t =>
          t.reference?.type === 'appointment' &&
          t.reference?.id === appointmentId
        );

        if (!existingTransaction) {
          // First occurrence of this appointment - include it
          acc.push(transaction);
        }
        // Skip duplicate appointment revenue
      } else {
        // Regular transaction - include normally
        acc.push(transaction);
      }

      return acc;
    }, [] as typeof serviceTransactions);

    // Enhanced product transaction filtering to include consolidated transactions and transactions with product items
    const productTransactions = filteredTransactions.filter(t =>
      ((t.type === TransactionType.INVENTORY_SALE || 
        t.type === TransactionType.PRODUCT_SALE || 
        t.type === TransactionType.CONSOLIDATED_SALE) &&
       t.status !== TransactionStatus.CANCELLED) ||
      // Also include transactions with product items
      (t.items && Array.isArray(t.items) && 
       t.items.some(item => item.type === 'product') &&
       t.status !== TransactionStatus.CANCELLED)
    );

    // Apply same deduplication logic to product transactions
    const deduplicatedProductTransactions = productTransactions.reduce((acc, transaction) => {
      if (transaction.reference?.type === 'appointment' && transaction.reference?.id) {
        // Check for duplicate appointment transactions
        const appointmentId = transaction.reference.id;
        const existingTransaction = acc.find(t =>
          t.reference?.type === 'appointment' &&
          t.reference?.id === appointmentId
        );

        if (!existingTransaction) {
          // First occurrence of this appointment - include it
          acc.push(transaction);
        }
        // Skip duplicate appointment revenue
      } else {
        // Regular transaction - include normally
        acc.push(transaction);
      }

      return acc;
    }, [] as typeof productTransactions);

    const serviceRevenue = deduplicatedServiceTransactions.reduce((sum, t) => {
      // For consolidated transactions with items, only count the service items
      if (t.type === TransactionType.CONSOLIDATED_SALE && t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'service').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      // For service-only transactions, count the full amount
      else if (t.type === TransactionType.SERVICE_SALE || 
              (t.type === TransactionType.INCOME && 
               (t.category === 'Service' || t.category === 'service'))) {
        return sum + t.amount;
      }
      // For other transactions, don't count them as service revenue
      return sum;
    }, 0);
    
    const productRevenue = deduplicatedProductTransactions.reduce((sum, t) => {
      // For consolidated transactions with items, only count the product items
      if (t.type === TransactionType.CONSOLIDATED_SALE && t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'product').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      // For product-only transactions, count the full amount
      else if (t.type === TransactionType.PRODUCT_SALE || t.type === TransactionType.INVENTORY_SALE) {
        return sum + t.amount;
      }
      // For other transactions with product items, count those items
      else if (t.items && Array.isArray(t.items) && t.items.some(i => i.type === 'product')) {
        return sum + t.items.filter(i => i.type === 'product').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      return sum;
    }, 0);
    const totalRevenue = serviceRevenue + productRevenue;

    // Enhanced logging for service revenue debugging
    console.log('💰 ANALYTICS: Enhanced revenue calculation breakdown:', {
      totalTransactions: filteredTransactions.length,
      cancelledTransactions: filteredTransactions.filter(t => t.status === TransactionStatus.CANCELLED).length,
      serviceRevenue,
      productRevenue,
      totalRevenue,
      serviceTransactions: serviceTransactions.length,
      productTransactions: productTransactions.length,
      serviceTransactionDetails: serviceTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        source: t.source,
        description: t.description,
        reference: t.reference
      })),
      productTransactionDetails: productTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        source: t.source,
        description: t.description
      })),
      clientPortalTransactions: filteredTransactions.filter(t => t.source === TransactionSource.CLIENT_PORTAL).length,
      calendarTransactions: filteredTransactions.filter(t => t.source === TransactionSource.CALENDAR).length,
      posTransactions: filteredTransactions.filter(t => t.source === TransactionSource.POS).length,
      clientPortalRevenue: filteredTransactions.filter(t => t.source === TransactionSource.CLIENT_PORTAL && t.status !== TransactionStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0),
      calendarRevenue: filteredTransactions.filter(t => t.source === TransactionSource.CALENDAR && t.status !== TransactionStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0),
      posRevenue: filteredTransactions.filter(t => t.source === TransactionSource.POS && t.status !== TransactionStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0),
      homeServiceRevenue: filteredTransactions.filter(t => t.source === TransactionSource.HOME_SERVICE && t.status !== TransactionStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0),
      cancelledRevenue: filteredTransactions.filter(t => t.status === TransactionStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0)
    });

    // Calculate expense metrics - EXCLUDE CANCELLED TRANSACTIONS
    const operatingExpenses = filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.status !== TransactionStatus.CANCELLED)
      .reduce((sum, t) => sum + t.amount, 0);

    const cogs = filteredTransactions
      .filter(t => t.type === TransactionType.COGS && t.status !== TransactionStatus.CANCELLED)
      .reduce((sum, t) => sum + t.amount, 0);

    const inventoryPurchases = filteredTransactions
      .filter(t => t.type === TransactionType.INVENTORY_PURCHASE && t.status !== TransactionStatus.CANCELLED)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = operatingExpenses + cogs + inventoryPurchases;

    // Calculate profit metrics
    const grossProfit = totalRevenue - cogs;
    const netProfit = totalRevenue - totalExpenses;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Get inventory analytics (using mock data for now)
    // Real inventory data is fetched separately in dashboard components
    const inventoryAnalytics = inventoryTransactionService.getInventoryAnalytics(start, end, locationId);

    // Calculate top selling products with enhanced data
    const productSales = new Map<string, {
      name: string;
      category: string;
      quantitySold: number;
      revenue: number;
      profit: number;
      averagePrice: number;
      salesCount: number;
      trend: number; // Week-over-week growth
    }>();

    // Process product sales transactions
    filteredTransactions
      .filter(t => t.type === TransactionType.INVENTORY_SALE && t.productId && t.status !== TransactionStatus.CANCELLED)
      .forEach(t => {
        const existing = productSales.get(t.productId!) || {
          name: t.productName || 'Unknown Product',
          category: t.category || 'General',
          quantitySold: 0,
          revenue: 0,
          profit: 0,
          averagePrice: 0,
          salesCount: 0,
          trend: 0
        };
        existing.quantitySold += t.quantity || 0;
        existing.revenue += t.amount;
        existing.profit += (t.amount - (t.costPrice || 0) * (t.quantity || 0));
        existing.salesCount += 1;
        productSales.set(t.productId!, existing);
      });

    // If no real transactions exist, create realistic sample data based on beauty salon products
    if (productSales.size === 0) {
      const sampleProducts = [
        { id: 'prod-001', name: 'Hydrating Shampoo', category: 'Hair Care', price: 28.99, cost: 14.50, popularity: 0.9 },
        { id: 'prod-002', name: 'Keratin Hair Treatment', category: 'Hair Care', price: 65.00, cost: 32.50, popularity: 0.8 },
        { id: 'prod-003', name: 'Professional Hair Serum', category: 'Hair Care', price: 45.99, cost: 23.00, popularity: 0.7 },
        { id: 'prod-004', name: 'Color Protection Conditioner', category: 'Hair Care', price: 32.99, cost: 16.50, popularity: 0.85 },
        { id: 'prod-005', name: 'Volumizing Mousse', category: 'Styling', price: 24.99, cost: 12.50, popularity: 0.6 },
        { id: 'prod-006', name: 'Heat Protection Spray', category: 'Styling', price: 19.99, cost: 10.00, popularity: 0.75 },
        { id: 'prod-007', name: 'Facial Cleanser', category: 'Skincare', price: 35.99, cost: 18.00, popularity: 0.65 },
        { id: 'prod-008', name: 'Anti-Aging Serum', category: 'Skincare', price: 89.99, cost: 45.00, popularity: 0.55 },
        { id: 'prod-009', name: 'Moisturizing Cream', category: 'Skincare', price: 42.99, cost: 21.50, popularity: 0.7 },
        { id: 'prod-010', name: 'Hair Styling Gel', category: 'Styling', price: 16.99, cost: 8.50, popularity: 0.5 }
      ];

      sampleProducts.forEach(product => {
        // Generate realistic sales data based on popularity
        const baseQuantity = Math.floor(product.popularity * 50) + 10; // 10-60 units
        const salesCount = Math.floor(product.popularity * 25) + 5; // 5-30 transactions
        const revenue = baseQuantity * product.price;
        const profit = revenue - (baseQuantity * product.cost);
        const trend = (Math.random() - 0.5) * 40; // -20% to +20% trend

        productSales.set(product.id, {
          name: product.name,
          category: product.category,
          quantitySold: baseQuantity,
          revenue: revenue,
          profit: profit,
          averagePrice: product.price,
          salesCount: salesCount,
          trend: trend
        });
      });
    }

    // Calculate average price and finalize data
    const topSellingProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        category: data.category,
        quantitySold: data.quantitySold,
        revenue: data.revenue,
        profit: data.profit,
        margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
        averagePrice: data.salesCount > 0 ? data.revenue / data.quantitySold : data.averagePrice || 0,
        salesCount: data.salesCount,
        trend: data.trend
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate service performance (mock data for now)
    const topServices = [
      { id: '1', name: 'Haircut & Style', bookings: 45, revenue: 3375, averagePrice: 75 },
      { id: '2', name: 'Color & Highlights', bookings: 22, revenue: 3300, averagePrice: 150 },
      { id: '3', name: 'Blowout', bookings: 18, revenue: 1170, averagePrice: 65 },
      { id: '4', name: 'Hair Treatment', bookings: 15, revenue: 1875, averagePrice: 125 },
      { id: '5', name: 'Styling', bookings: 12, revenue: 720, averagePrice: 60 }
    ];

    // Calculate financial health indicators - EXCLUDE CANCELLED TRANSACTIONS
    const transactionCount = filteredTransactions.filter(t =>
      (t.type === TransactionType.INCOME || t.type === TransactionType.INVENTORY_SALE) &&
      t.status !== TransactionStatus.CANCELLED
    ).length;

    const uniqueClients = new Set(
      filteredTransactions
        .filter(t => t.clientId && t.status !== TransactionStatus.CANCELLED)
        .map(t => t.clientId)
    ).size;

    const revenuePerClient = uniqueClients > 0 ? totalRevenue / uniqueClients : 0;
    const averageTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;
    const profitPerTransaction = transactionCount > 0 ? netProfit / transactionCount : 0;

    // Calculate growth rates (mock for now - would compare to previous period)
    const revenueGrowth = 15.3; // Mock growth percentage
    const expenseGrowth = 8.7;

    // Home Service breakdown
    const homeServiceServiceTransactions = filteredTransactions.filter(t =>
      t.source === TransactionSource.HOME_SERVICE &&
      (t.type === TransactionType.SERVICE_SALE || t.type === TransactionType.CONSOLIDATED_SALE || (t.items && t.items.some(i => i.type === 'service')))
      && t.status !== TransactionStatus.CANCELLED
    );
    const homeServiceProductTransactions = filteredTransactions.filter(t =>
      t.source === TransactionSource.HOME_SERVICE &&
      (t.type === TransactionType.PRODUCT_SALE || t.type === TransactionType.INVENTORY_SALE || t.type === TransactionType.CONSOLIDATED_SALE || (t.items && t.items.some(i => i.type === 'product')))
      && t.status !== TransactionStatus.CANCELLED
    );
    // Sum up service and product revenue for home service
    const homeServiceServices = homeServiceServiceTransactions.reduce((sum, t) => {
      if (t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'service').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      return sum + (t.type === TransactionType.SERVICE_SALE ? t.amount : 0);
    }, 0);
    const homeServiceProducts = homeServiceProductTransactions.reduce((sum, t) => {
      if (t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'product').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      return sum + (t.type === TransactionType.PRODUCT_SALE || t.type === TransactionType.INVENTORY_SALE ? t.amount : 0);
    }, 0);

    // In-Person breakdown (POS + CALENDAR)
    const inPersonServiceTransactions = filteredTransactions.filter(t =>
      (t.source === TransactionSource.POS || t.source === TransactionSource.CALENDAR) &&
      (t.type === TransactionType.SERVICE_SALE || t.type === TransactionType.CONSOLIDATED_SALE || (t.items && t.items.some(i => i.type === 'service')))
      && t.status !== TransactionStatus.CANCELLED
    );
    const inPersonProductTransactions = filteredTransactions.filter(t =>
      (t.source === TransactionSource.POS || t.source === TransactionSource.CALENDAR) &&
      (t.type === TransactionType.PRODUCT_SALE || t.type === TransactionType.INVENTORY_SALE || t.type === TransactionType.CONSOLIDATED_SALE || (t.items && t.items.some(i => i.type === 'product')))
      && t.status !== TransactionStatus.CANCELLED
    );
    const inPersonServices = inPersonServiceTransactions.reduce((sum, t) => {
      if (t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'service').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      return sum + (t.type === TransactionType.SERVICE_SALE ? t.amount : 0);
    }, 0);
    const inPersonProducts = inPersonProductTransactions.reduce((sum, t) => {
      if (t.items && Array.isArray(t.items)) {
        return sum + t.items.filter(i => i.type === 'product').reduce((s, i) => s + (i.totalPrice || 0), 0);
      }
      return sum + (t.type === TransactionType.PRODUCT_SALE || t.type === TransactionType.INVENTORY_SALE ? t.amount : 0);
    }, 0);

    return {
      totalRevenue,
      serviceRevenue,
      productRevenue,
      revenueGrowth,
      totalExpenses,
      operatingExpenses,
      cogs,
      expenseGrowth,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      inventoryValue: inventoryAnalytics.totalInventoryValue,
      inventoryTurnover: 6.2, // Mock value
      lowStockItems: inventoryAnalytics.lowStockItems.length,
      outOfStockItems: 3, // Mock value
      topSellingProducts,
      topServices,
      revenuePerClient,
      averageTransactionValue,
      profitPerTransaction,
      cashFlow: netProfit, // Simplified cash flow calculation
      clientPortalRevenue: filteredTransactions.filter(t => t.source === TransactionSource.CLIENT_PORTAL && t.status !== TransactionStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0),
      calendarRevenue: filteredTransactions.filter(t => t.source === TransactionSource.CALENDAR && t.status !== TransactionStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0),
      posRevenue: filteredTransactions.filter(t => t.source === TransactionSource.POS && t.status !== TransactionStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0),
      homeServiceRevenue: filteredTransactions.filter(t => t.source === TransactionSource.HOME_SERVICE && t.status !== TransactionStatus.CANCELLED).reduce((sum, t) => sum + t.amount, 0),
      homeServiceServices,
      homeServiceProducts,
      inPersonServices,
      inPersonProducts
    };
  }

  /**
   * Get revenue breakdown by source
   */
  getRevenueBreakdown(startDate?: Date, endDate?: Date, locationId?: string) {
    const analytics = this.getAnalytics(startDate, endDate, locationId);

    return {
      services: {
        amount: analytics.serviceRevenue,
        percentage: analytics.totalRevenue > 0 ? (analytics.serviceRevenue / analytics.totalRevenue) * 100 : 0
      },
      products: {
        amount: analytics.productRevenue,
        percentage: analytics.totalRevenue > 0 ? (analytics.productRevenue / analytics.totalRevenue) * 100 : 0
      }
    };
  }

  /**
   * Get expense breakdown by category
   */
  getExpenseBreakdown(startDate?: Date, endDate?: Date, locationId?: string) {
    const analytics = this.getAnalytics(startDate, endDate, locationId);

    return {
      operating: {
        amount: analytics.operatingExpenses,
        percentage: analytics.totalExpenses > 0 ? (analytics.operatingExpenses / analytics.totalExpenses) * 100 : 0
      },
      cogs: {
        amount: analytics.cogs,
        percentage: analytics.totalExpenses > 0 ? (analytics.cogs / analytics.totalExpenses) * 100 : 0
      }
    };
  }

  /**
   * Get profit margin comparison
   */
  getProfitMarginComparison(startDate?: Date, endDate?: Date, locationId?: string) {
    const analytics = this.getAnalytics(startDate, endDate, locationId);

    // Calculate service-only margin (excluding product costs)
    const serviceMargin = analytics.serviceRevenue > 0
      ? ((analytics.serviceRevenue - analytics.operatingExpenses) / analytics.serviceRevenue) * 100
      : 0;

    // Calculate product-only margin
    const productMargin = analytics.productRevenue > 0
      ? ((analytics.productRevenue - analytics.cogs) / analytics.productRevenue) * 100
      : 0;

    return {
      serviceMargin,
      productMargin,
      combinedMargin: analytics.grossMargin,
      netMargin: analytics.netMargin
    };
  }
}

// Export singleton instance
export const integratedAnalyticsService = new IntegratedAnalyticsService();
