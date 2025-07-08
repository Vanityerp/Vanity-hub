"use client"

import { z } from "zod"

/**
 * Enum for order status
 */
export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled"
}

/**
 * Enum for order fulfillment actions
 */
export enum OrderAction {
  MARK_PROCESSING = "mark_processing",
  MARK_SHIPPED = "mark_shipped",
  MARK_DELIVERED = "mark_delivered",
  CANCEL_ORDER = "cancel_order"
}

/**
 * Interface for order item
 */
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  sku?: string;
  image?: string;
}

/**
 * Interface for shipping address
 */
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * Interface for tracking information
 */
export interface TrackingInfo {
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date | string;
  shippedDate?: Date | string;
  deliveredDate?: Date | string;
  trackingUrl?: string;
}

/**
 * Interface for order data
 */
export interface Order {
  id: string;
  clientId: string;
  clientName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  appliedPromo?: {
    code: string;
    discount: number;
    type: string;
  };
  tracking?: TrackingInfo;
  notes?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  processedAt?: Date | string;
  shippedAt?: Date | string;
  deliveredAt?: Date | string;
  cancelledAt?: Date | string;
  cancellationReason?: string;
  transactionId?: string; // Link to the corresponding transaction
}

/**
 * Interface for order status update
 */
export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  notes?: string;
  tracking?: Partial<TrackingInfo>;
  updatedBy?: string;
  timestamp: Date | string;
}

/**
 * Interface for order notification
 */
export interface OrderNotification {
  id: string;
  type: 'new_order' | 'status_update' | 'payment_received';
  orderId: string;
  clientName: string;
  message: string;
  amount?: number;
  timestamp: Date | string;
  read: boolean;
  acknowledged: boolean;
}

/**
 * Zod schema for order validation
 */
export const orderSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  clientName: z.string().optional(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    totalPrice: z.number().positive(),
    sku: z.string().optional(),
    image: z.string().optional()
  })),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  shipping: z.number().nonnegative(),
  total: z.number().positive(),
  paymentMethod: z.string(),
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }),
  status: z.nativeEnum(OrderStatus),
  appliedPromo: z.object({
    code: z.string(),
    discount: z.number(),
    type: z.string()
  }).optional(),
  tracking: z.object({
    trackingNumber: z.string().optional(),
    carrier: z.string().optional(),
    estimatedDelivery: z.union([z.date(), z.string()]).optional(),
    shippedDate: z.union([z.date(), z.string()]).optional(),
    deliveredDate: z.union([z.date(), z.string()]).optional(),
    trackingUrl: z.string().optional()
  }).optional(),
  notes: z.string().optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]).optional(),
  processedAt: z.union([z.date(), z.string()]).optional(),
  shippedAt: z.union([z.date(), z.string()]).optional(),
  deliveredAt: z.union([z.date(), z.string()]).optional(),
  cancelledAt: z.union([z.date(), z.string()]).optional(),
  cancellationReason: z.string().optional(),
  transactionId: z.string().optional()
});

/**
 * Type for order creation
 */
export type OrderCreate = z.infer<typeof orderSchema>;

/**
 * Interface for order filter options
 */
export interface OrderFilter {
  status?: OrderStatus;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  paymentMethod?: string;
}

/**
 * Interface for order analytics
 */
export interface OrderAnalytics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
}
