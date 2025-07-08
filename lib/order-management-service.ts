"use client"

import {
  Order,
  OrderStatus,
  OrderStatusUpdate,
  OrderFilter,
  OrderNotification,
  TrackingInfo
} from "./order-types"
import { Transaction, TransactionStatus } from "./transaction-types"

/**
 * Order Management Service
 * Handles order lifecycle, status updates, and notifications
 */
export class OrderManagementService {
  private static instance: OrderManagementService;
  private orders: Order[] = [];
  private notifications: OrderNotification[] = [];
  private listeners: Array<(orders: Order[]) => void> = [];
  private notificationListeners: Array<(notifications: OrderNotification[]) => void> = [];
  private transactionUpdateCallback?: (transactionId: string, status: TransactionStatus) => void;

  private constructor() {
    this.loadOrders();
    this.loadNotifications();
  }

  static getInstance(): OrderManagementService {
    if (!OrderManagementService.instance) {
      OrderManagementService.instance = new OrderManagementService();
    }
    return OrderManagementService.instance;
  }

  /**
   * Set callback for updating transaction status when order status changes
   */
  setTransactionUpdateCallback(callback: (transactionId: string, status: TransactionStatus) => void): void {
    this.transactionUpdateCallback = callback;
  }

  /**
   * Map order status to transaction status
   */
  private mapOrderStatusToTransactionStatus(orderStatus: OrderStatus): TransactionStatus {
    switch (orderStatus) {
      case OrderStatus.PENDING:
        return TransactionStatus.PENDING;
      case OrderStatus.PROCESSING:
        return TransactionStatus.PENDING; // Still pending payment-wise
      case OrderStatus.SHIPPED:
        return TransactionStatus.PENDING; // Still pending until delivered
      case OrderStatus.DELIVERED:
        return TransactionStatus.COMPLETED; // Only completed when delivered
      case OrderStatus.CANCELLED:
        return TransactionStatus.CANCELLED;
      default:
        return TransactionStatus.PENDING;
    }
  }

  /**
   * Load orders from localStorage
   */
  private loadOrders(): void {
    if (typeof window !== 'undefined') {
      try {
        const storedOrders = localStorage.getItem('salon_orders');
        if (storedOrders) {
          this.orders = JSON.parse(storedOrders).map((order: any) => ({
            ...order,
            createdAt: new Date(order.createdAt),
            updatedAt: order.updatedAt ? new Date(order.updatedAt) : undefined,
            processedAt: order.processedAt ? new Date(order.processedAt) : undefined,
            shippedAt: order.shippedAt ? new Date(order.shippedAt) : undefined,
            deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
            cancelledAt: order.cancelledAt ? new Date(order.cancelledAt) : undefined
          }));
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        this.orders = [];
      }
    }
  }

  /**
   * Save orders to localStorage
   */
  private saveOrders(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('salon_orders', JSON.stringify(this.orders));
      } catch (error) {
        console.error('Error saving orders:', error);
      }
    }
  }

  /**
   * Load notifications from localStorage
   */
  private loadNotifications(): void {
    if (typeof window !== 'undefined') {
      try {
        const storedNotifications = localStorage.getItem('salon_order_notifications');
        if (storedNotifications) {
          this.notifications = JSON.parse(storedNotifications).map((notification: any) => ({
            ...notification,
            timestamp: new Date(notification.timestamp)
          }));
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        this.notifications = [];
      }
    }
  }

  /**
   * Save notifications to localStorage
   */
  private saveNotifications(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('salon_order_notifications', JSON.stringify(this.notifications));
      } catch (error) {
        console.error('Error saving notifications:', error);
      }
    }
  }

  /**
   * Create order from transaction data
   */
  createOrderFromTransaction(transaction: Transaction): Order | null {
    console.log('📦 ORDER SERVICE: createOrderFromTransaction called with:', {
      transactionId: transaction.id,
      source: transaction.source,
      amount: transaction.amount,
      hasMetadata: !!transaction.metadata,
      hasOrderData: !!transaction.metadata?.orderData
    });

    if (!transaction.metadata?.orderData) {
      console.warn('❌ ORDER SERVICE: Transaction does not contain order data', {
        transactionId: transaction.id,
        metadata: transaction.metadata
      });
      return null;
    }

    const orderData = transaction.metadata.orderData;
    console.log('📦 ORDER SERVICE: Processing order data:', orderData);
    const order: Order = {
      id: orderData.id,
      clientId: transaction.clientId || '',
      clientName: transaction.clientName || '',
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      tax: orderData.tax || 0,
      shipping: orderData.shipping || 0,
      total: transaction.amount,
      paymentMethod: orderData.paymentMethod || 'card',
      shippingAddress: orderData.shippingAddress || {},
      status: OrderStatus.PENDING,
      appliedPromo: orderData.appliedPromo,
      createdAt: transaction.date,
      updatedAt: new Date(),
      // Store transaction ID for status synchronization
      transactionId: transaction.id
    };

    console.log('📦 ORDER SERVICE: Created order object:', {
      orderId: order.id,
      clientId: order.clientId,
      clientName: order.clientName,
      total: order.total,
      itemCount: order.items.length,
      transactionId: order.transactionId
    });

    // Check if order already exists
    const existingOrderIndex = this.orders.findIndex(o => o.id === order.id);
    if (existingOrderIndex >= 0) {
      console.log('📦 ORDER SERVICE: Updating existing order:', order.id);
      // Update existing order
      this.orders[existingOrderIndex] = { ...this.orders[existingOrderIndex], ...order };
    } else {
      console.log('📦 ORDER SERVICE: Creating new order:', {
        orderId: order.id,
        clientName: order.clientName,
        total: order.total,
        itemCount: order.items.length
      });

      // Add new order
      this.orders.unshift(order); // Add to beginning for newest first

      // Create notification for new order
      this.createNotification({
        type: 'new_order',
        orderId: order.id,
        clientName: order.clientName || 'Unknown Customer',
        message: `New order received from ${order.clientName || 'customer'}`,
        amount: order.total
      });

      console.log('🔔 ORDER SERVICE: Notification created for new order');
    }

    this.saveOrders();
    this.notifyListeners();

    console.log('✅ ORDER SERVICE: Order processing complete:', {
      orderId: order.id,
      totalOrders: this.orders.length,
      totalNotifications: this.notifications.length
    });

    return order;
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Order | null {
    return this.orders.find(order => order.id === orderId) || null;
  }

  /**
   * Get all orders
   */
  getAllOrders(): Order[] {
    return [...this.orders];
  }

  /**
   * Filter orders
   */
  filterOrders(filter: OrderFilter): Order[] {
    return this.orders.filter(order => {
      if (filter.status && order.status !== filter.status) return false;
      if (filter.clientId && order.clientId !== filter.clientId) return false;
      if (filter.paymentMethod && order.paymentMethod !== filter.paymentMethod) return false;

      if (filter.dateFrom || filter.dateTo) {
        const orderDate = new Date(order.createdAt);
        if (filter.dateFrom && orderDate < filter.dateFrom) return false;
        if (filter.dateTo && orderDate > filter.dateTo) return false;
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(searchLower);
        const matchesClient = order.clientName?.toLowerCase().includes(searchLower) || false;
        const matchesItems = order.items.some(item =>
          item.name.toLowerCase().includes(searchLower)
        );

        if (!(matchesId || matchesClient || matchesItems)) return false;
      }

      return true;
    });
  }

  /**
   * Update order status
   */
  updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    tracking?: Partial<TrackingInfo>,
    notes?: string,
    updatedBy?: string
  ): Order | null {
    console.log('🔄 OrderManagementService: Updating order status', { orderId, newStatus, tracking, notes })

    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      console.error('❌ Order not found:', orderId)
      return null;
    }

    const order = this.orders[orderIndex];
    console.log('📦 Found order:', order)
    const now = new Date();

    // Update order
    const updatedOrder: Order = {
      ...order,
      status: newStatus,
      updatedAt: now,
      notes: notes || order.notes,
      tracking: tracking ? { ...order.tracking, ...tracking } : order.tracking
    };

    // Set status-specific timestamps
    switch (newStatus) {
      case OrderStatus.PROCESSING:
        updatedOrder.processedAt = now;
        break;
      case OrderStatus.SHIPPED:
        updatedOrder.shippedAt = now;
        if (tracking?.estimatedDelivery) {
          updatedOrder.tracking = {
            ...updatedOrder.tracking,
            estimatedDelivery: tracking.estimatedDelivery,
            shippedDate: now
          };
        }
        break;
      case OrderStatus.DELIVERED:
        updatedOrder.deliveredAt = now;
        if (updatedOrder.tracking) {
          updatedOrder.tracking.deliveredDate = now;
        }
        break;
      case OrderStatus.CANCELLED:
        updatedOrder.cancelledAt = now;
        updatedOrder.cancellationReason = notes;
        break;
    }

    this.orders[orderIndex] = updatedOrder;
    console.log('✅ Order updated in service:', updatedOrder)

    // Update corresponding transaction status if callback is available
    if (this.transactionUpdateCallback && updatedOrder.transactionId) {
      const transactionStatus = this.mapOrderStatusToTransactionStatus(newStatus);
      console.log('🔄 Updating transaction status:', { transactionId: updatedOrder.transactionId, transactionStatus });
      this.transactionUpdateCallback(updatedOrder.transactionId, transactionStatus);
    }

    this.saveOrders();
    this.notifyListeners();

    // Create status update notification
    this.createNotification({
      type: 'status_update',
      orderId: order.id,
      clientName: order.clientName || 'Unknown Customer',
      message: `Order status updated to ${newStatus}`
    });

    console.log('🔔 Status update notification created')
    return updatedOrder;
  }

  /**
   * Create notification
   */
  private createNotification(data: {
    type: 'new_order' | 'status_update' | 'payment_received';
    orderId: string;
    clientName: string;
    message: string;
    amount?: number;
  }): void {
    const notification: OrderNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      timestamp: new Date(),
      read: false,
      acknowledged: false
    };

    this.notifications.unshift(notification);
    this.saveNotifications();
    this.notifyNotificationListeners();
  }

  /**
   * Get all notifications
   */
  getNotifications(): OrderNotification[] {
    return [...this.notifications];
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyNotificationListeners();
    }
  }

  /**
   * Acknowledge notification
   */
  acknowledgeNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.acknowledged = true;
      notification.read = true;
      this.saveNotifications();
      this.notifyNotificationListeners();
    }
  }

  /**
   * Subscribe to order updates
   */
  subscribe(listener: (orders: Order[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Subscribe to notification updates
   */
  subscribeToNotifications(listener: (notifications: OrderNotification[]) => void): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners of order changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.orders));
  }

  /**
   * Notify listeners of notification changes
   */
  private notifyNotificationListeners(): void {
    this.notificationListeners.forEach(listener => listener(this.notifications));
  }
}
