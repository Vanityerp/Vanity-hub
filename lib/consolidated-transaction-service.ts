import { Transaction, TransactionItem, TransactionType, TransactionStatus, TransactionSource, PaymentMethod } from './transaction-types';

/**
 * Service for creating consolidated transactions that combine services and products
 * into a single transaction record per payment session
 */
export class ConsolidatedTransactionService {
  
  /**
   * Generate a unique transaction ID for a payment session
   */
  static generateTransactionId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `TX-CONS-${timestamp}-${randomSuffix}`;
  }

  /**
   * Create a consolidated transaction from appointment data
   */
  static createConsolidatedTransaction(
    appointment: any,
    paymentMethod: PaymentMethod,
    discountPercentage?: number,
    discountAmount?: number
  ): Transaction {
    const transactionId = this.generateTransactionId();
    const items: TransactionItem[] = [];
    let serviceAmount = 0;
    let productAmount = 0;
    let originalServiceAmount = 0;

    // Process main service
    if (appointment.service && appointment.price) {
      const serviceItem: TransactionItem = {
        id: `service-${appointment.service.toLowerCase().replace(/\s+/g, '-')}`,
        name: appointment.service,
        quantity: 1,
        unitPrice: appointment.price,
        totalPrice: appointment.price,
        type: 'service',
        discountApplied: false,
        discountPercentage: 0,
        discountAmount: 0,
        originalPrice: appointment.price
      };

      // Apply discount to service if provided
      if (discountPercentage && discountPercentage > 0) {
        const itemDiscountAmount = (appointment.price * discountPercentage) / 100;
        serviceItem.discountApplied = true;
        serviceItem.discountPercentage = discountPercentage;
        serviceItem.discountAmount = itemDiscountAmount;
        serviceItem.totalPrice = appointment.price - itemDiscountAmount;
      }

      items.push(serviceItem);
      originalServiceAmount += appointment.price;
      serviceAmount += serviceItem.totalPrice;
    }

    // Process additional services
    if (appointment.additionalServices && appointment.additionalServices.length > 0) {
      appointment.additionalServices.forEach((service: any) => {
        const serviceItem: TransactionItem = {
          id: `service-${service.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: service.name,
          quantity: 1,
          unitPrice: service.price,
          totalPrice: service.price,
          type: 'service',
          discountApplied: false,
          discountPercentage: 0,
          discountAmount: 0,
          originalPrice: service.price
        };

        // Apply discount to additional services if provided
        if (discountPercentage && discountPercentage > 0) {
          const itemDiscountAmount = (service.price * discountPercentage) / 100;
          serviceItem.discountApplied = true;
          serviceItem.discountPercentage = discountPercentage;
          serviceItem.discountAmount = itemDiscountAmount;
          serviceItem.totalPrice = service.price - itemDiscountAmount;
        }

        items.push(serviceItem);
        originalServiceAmount += service.price;
        serviceAmount += serviceItem.totalPrice;
      });
    }

    // Process products (no discount applied)
    if (appointment.products && appointment.products.length > 0) {
      appointment.products.forEach((product: any) => {
        const productItem: TransactionItem = {
          id: product.id || `product-${product.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: product.name,
          quantity: product.quantity || 1,
          unitPrice: product.price,
          totalPrice: (product.price * (product.quantity || 1)),
          type: 'product',
          discountApplied: false, // Products never have discounts applied
          cost: product.cost
        };

        items.push(productItem);
        productAmount += productItem.totalPrice;
      });
    }

    // Calculate total amount
    const totalAmount = serviceAmount + productAmount;

    // Determine transaction type
    const transactionType = items.some(item => item.type === 'service') && items.some(item => item.type === 'product')
      ? TransactionType.CONSOLIDATED_SALE
      : items.some(item => item.type === 'service')
      ? TransactionType.SERVICE_SALE
      : TransactionType.PRODUCT_SALE;

    // Create short description
    const serviceCount = items.filter(item => item.type === 'service').length;
    const productCount = items.filter(item => item.type === 'product').length;
    let description = '';

    if (serviceCount > 0 && productCount > 0) {
      description = `${serviceCount} service(s) + ${productCount} product(s)`;
    } else if (serviceCount > 0) {
      if (serviceCount === 1 && appointment.service) {
        description = appointment.service;
      } else {
        description = `${serviceCount} service(s)`;
      }
    } else {
      description = `${productCount} product(s)`;
    }

    // Add discount information if applied
    if (discountPercentage && discountPercentage > 0) {
      description += ` (${discountPercentage}% off)`;
    }

    const transaction: Transaction = {
      id: transactionId,
      date: new Date(),
      clientId: appointment.clientId,
      clientName: appointment.clientName,
      staffId: appointment.staffId,
      staffName: appointment.staffName,
      type: transactionType,
      category: transactionType === TransactionType.CONSOLIDATED_SALE ? "Consolidated Sale" : 
                transactionType === TransactionType.SERVICE_SALE ? "Service Sale" : "Product Sale",
      description,
      amount: totalAmount,
      paymentMethod,
      status: TransactionStatus.COMPLETED,
      location: appointment.location || "loc1",
      source: TransactionSource.CALENDAR,
      reference: {
        type: "appointment",
        id: appointment.id
      },
      items,
      serviceAmount,
      productAmount,
      originalServiceAmount,
      discountPercentage,
      discountAmount,
      metadata: {
        appointmentId: appointment.id,
        transactionType: 'consolidated',
        serviceCount,
        productCount,
        discountApplied: discountPercentage && discountPercentage > 0,
        originalTotal: originalServiceAmount + productAmount,
        finalTotal: totalAmount
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return transaction;
  }

  /**
   * Create a consolidated transaction from booking summary data
   */
  static createConsolidatedTransactionFromBooking(
    booking: any,
    paymentMethod: PaymentMethod,
    discountPercentage?: number,
    discountAmount?: number
  ): Transaction {
    const transactionId = this.generateTransactionId();
    const items: TransactionItem[] = [];
    let serviceAmount = 0;
    let productAmount = 0;
    let originalServiceAmount = 0;

    // Process booking items
    if (booking.items && booking.items.length > 0) {
      booking.items.forEach((item: any) => {
        const transactionItem: TransactionItem = {
          id: item.id || `item-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
          totalPrice: item.price,
          type: item.type || 'service', // Default to service if type not specified
          discountApplied: false,
          discountPercentage: 0,
          discountAmount: 0,
          originalPrice: item.price
        };

        // Apply discount only to services
        if (transactionItem.type === 'service' && discountPercentage && discountPercentage > 0) {
          const itemDiscountAmount = (item.price * discountPercentage) / 100;
          transactionItem.discountApplied = true;
          transactionItem.discountPercentage = discountPercentage;
          transactionItem.discountAmount = itemDiscountAmount;
          transactionItem.totalPrice = item.price - itemDiscountAmount;
        }

        items.push(transactionItem);

        if (transactionItem.type === 'service') {
          originalServiceAmount += item.price;
          serviceAmount += transactionItem.totalPrice;
        } else {
          productAmount += transactionItem.totalPrice;
        }
      });
    }

    // Calculate total amount
    const totalAmount = serviceAmount + productAmount;

    // Determine transaction type
    const transactionType = items.some(item => item.type === 'service') && items.some(item => item.type === 'product')
      ? TransactionType.CONSOLIDATED_SALE
      : items.some(item => item.type === 'service')
      ? TransactionType.SERVICE_SALE
      : TransactionType.PRODUCT_SALE;

    // Create short description
    const serviceCount = items.filter(item => item.type === 'service').length;
    const productCount = items.filter(item => item.type === 'product').length;
    let description = '';

    if (serviceCount > 0 && productCount > 0) {
      description = `${serviceCount} service(s) + ${productCount} product(s)`;
    } else if (serviceCount > 0) {
      description = `${serviceCount} service(s)`;
    } else {
      description = `${productCount} product(s)`;
    }

    // Add discount information if applied
    if (discountPercentage && discountPercentage > 0) {
      description += ` (${discountPercentage}% off)`;
    }

    const transaction: Transaction = {
      id: transactionId,
      date: new Date(),
      clientId: booking.clientId,
      clientName: booking.clientName,
      staffId: booking.staffId,
      staffName: booking.staffName,
      type: transactionType,
      category: transactionType === TransactionType.CONSOLIDATED_SALE ? "Consolidated Sale" : 
                transactionType === TransactionType.SERVICE_SALE ? "Service Sale" : "Product Sale",
      description,
      amount: totalAmount,
      paymentMethod,
      status: TransactionStatus.COMPLETED,
      location: booking.location || "loc1",
      source: TransactionSource.CALENDAR,
      reference: {
        type: "booking",
        id: booking.id
      },
      items,
      serviceAmount,
      productAmount,
      originalServiceAmount,
      discountPercentage,
      discountAmount,
      metadata: {
        bookingId: booking.id,
        transactionType: 'consolidated',
        serviceCount,
        productCount,
        discountApplied: discountPercentage && discountPercentage > 0,
        originalTotal: originalServiceAmount + productAmount,
        finalTotal: totalAmount
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return transaction;
  }
}
