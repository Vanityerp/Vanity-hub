"use client"

import { z } from "zod"

/**
 * Enum for transaction sources
 */
export enum TransactionSource {
  POS = "pos",
  CALENDAR = "calendar",
  MANUAL = "manual",
  INVENTORY = "inventory",
  ONLINE = "online",
  SYSTEM = "system",
  CLIENT_PORTAL = "client_portal",
  HOME_SERVICE = "home_service"
}

/**
 * Get user-friendly label for transaction source
 */
export function getTransactionSourceLabel(source: TransactionSource): string {
  switch (source) {
    case TransactionSource.POS:
      return "POS"
    case TransactionSource.CALENDAR:
      return "Walk-in"
    case TransactionSource.MANUAL:
      return "Manual Entry"
    case TransactionSource.INVENTORY:
      return "Inventory"
    case TransactionSource.ONLINE:
      return "Online Store"
    case TransactionSource.CLIENT_PORTAL:
      return "Client Portal"
    case TransactionSource.HOME_SERVICE:
      return "Home Service"
    default:
      return "System"
  }
}

/**
 * Enum for transaction types
 */
export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
  REFUND = "refund",
  ADJUSTMENT = "adjustment",
  INVENTORY_PURCHASE = "inventory_purchase",
  INVENTORY_SALE = "inventory_sale",
  PRODUCT_SALE = "product_sale",
  SERVICE_SALE = "service_sale",
  CONSOLIDATED_SALE = "consolidated_sale", // For transactions with both services and products
  PAYMENT = "payment",
  COGS = "cogs", // Cost of Goods Sold
  GIFT_CARD_SALE = "gift_card_sale",
  GIFT_CARD_REDEMPTION = "gift_card_redemption",
  MEMBERSHIP_SALE = "membership_sale",
  MEMBERSHIP_RENEWAL = "membership_renewal"
}

/**
 * Enum for transaction status
 */
export enum TransactionStatus {
  COMPLETED = "completed",
  PENDING = "pending",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
  PARTIAL = "partial"
}

/**
 * Enum for payment methods
 */
export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  CASH = "cash",
  BANK_TRANSFER = "bank_transfer",
  MOBILE_PAYMENT = "mobile_payment",
  CHECK = "check",
  GIFT_CARD = "gift_card",
  LOYALTY_POINTS = "loyalty_points",
  OTHER = "other"
}

/**
 * Interface for transaction items (products/services in a transaction)
 */
export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  cost?: number;
  category?: string;
  sku?: string;
  type: 'service' | 'product'; // Distinguish between services and products
  discountApplied?: boolean; // Whether discount was applied to this item
  discountPercentage?: number; // Discount percentage applied
  discountAmount?: number; // Discount amount applied
  originalPrice?: number; // Original price before discount
}

/**
 * Interface for transaction data
 */
export interface Transaction {
  id: string;
  date: Date | string;
  clientId?: string;
  clientName?: string;
  staffId?: string;
  staffName?: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  location: string;
  source: TransactionSource;
  reference?: {
    type: string;
    id: string;
  };
  metadata?: Record<string, any>;
  // Items for product/service sales
  items?: TransactionItem[];
  // Consolidated transaction fields
  serviceAmount?: number; // Total amount for services (after discount)
  productAmount?: number; // Total amount for products (no discount)
  originalServiceAmount?: number; // Original service amount before discount
  discountPercentage?: number; // Overall discount percentage applied
  discountAmount?: number; // Total discount amount applied
  // Inventory-specific fields
  productId?: string;
  productName?: string;
  quantity?: number;
  costPrice?: number;
  retailPrice?: number;
  profitMargin?: number;
  inventoryTransactionId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Zod schema for transaction validation
 */
export const transactionSchema = z.object({
  id: z.string().optional(),
  date: z.union([z.date(), z.string().datetime()]),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  staffId: z.string().optional(),
  staffName: z.string().optional(),
  type: z.nativeEnum(TransactionType),
  category: z.string(),
  description: z.string().optional(),
  amount: z.number().positive(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  status: z.nativeEnum(TransactionStatus),
  location: z.string(),
  source: z.nativeEnum(TransactionSource),
  reference: z.object({
    type: z.string(),
    id: z.string()
  }).optional(),
  metadata: z.record(z.any()).optional(),
  // Include items for product/service sales
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    cost: z.number().optional(),
    category: z.string().optional(),
    sku: z.string().optional(),
    type: z.union([z.literal('service'), z.literal('product')]),
    discountApplied: z.boolean().optional(),
    discountPercentage: z.number().optional(),
    discountAmount: z.number().optional(),
    originalPrice: z.number().optional(),
  })).optional(),
  // Include overall discount fields
  discountPercentage: z.number().optional(),
  discountAmount: z.number().optional(),
  createdAt: z.union([z.date(), z.string().datetime()]).optional(),
  updatedAt: z.union([z.date(), z.string().datetime()]).optional()
});

/**
 * Type for transaction creation
 */
export type TransactionCreate = z.infer<typeof transactionSchema>;

/**
 * Interface for transaction filter options
 */
export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  singleDate?: Date;
  type?: TransactionType;
  source?: TransactionSource | 'all';
  status?: TransactionStatus;
  location?: string;
  clientId?: string;
  staffId?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}
