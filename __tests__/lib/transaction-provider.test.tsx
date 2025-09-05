import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { TransactionProvider, useTransactionContext } from '../../lib/transaction-provider';
import {
  Transaction,
  TransactionCreate,
  TransactionType,
  TransactionStatus,
  TransactionSource,
  PaymentMethod
} from '../../lib/transaction-types';
import { be } from 'date-fns/locale';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    getAll: () => store
  };
})();

// Mock real-time service
jest.mock('../../lib/real-time-service', () => ({
  realTimeService: {
    emitEvent: jest.fn()
  },
  RealTimeEventType: {
    TRANSACTION_CREATED: 'transaction_created',
    TRANSACTION_UPDATED: 'transaction_updated'
  }
}));

// Mock integrated analytics service
jest.mock('../../lib/integrated-analytics-service', () => ({
  integratedAnalyticsService: {
    updateTransactionData: jest.fn()
  }
}));

// Setup and teardown
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
  jest.clearAllMocks();
  mockLocalStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// Helper component to access the context in tests
function TestComponent({ testFn }: { testFn: (context: any) => void }) {
  const context = useTransactionContext();
  testFn(context);
  return null;
}

// Helper function to render the provider with a test component
function renderWithProvider(testFn: (context: any) => void) {
  return render(
    <TransactionProvider>
      <TestComponent testFn={testFn} />
    </TransactionProvider>
  );
}

// Sample transactions for testing
const createSampleTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-123',
  date: new Date('2023-01-01'),
  type: TransactionType.SERVICE_SALE,
  category: 'Haircut',
  description: 'Haircut service',
  amount: 50,
  paymentMethod: PaymentMethod.CREDIT_CARD,
  status: TransactionStatus.COMPLETED,
  location: 'Main Salon',
  source: TransactionSource.POS,
  createdAt: new Date('2023-01-01T10:00:00'),
  updatedAt: new Date('2023-01-01T10:00:00'),
  ...overrides
});

describe('TransactionProvider - findExistingTransactionsForAppointment', () => {
  // Test case 1: Find transactions by appointment ID in reference
  test('should find transactions by appointment ID in reference', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    const existingTransaction = createSampleTransaction({
      id: 'tx-1',
      reference: {
        type: 'appointment',
        id: appointmentId
      }
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with the same appointment ID
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 60,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      reference: {
        type: 'appointment',
        id: appointmentId
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with the same appointment ID
          const result = context.addTransaction(newTransaction);
          
          // The provider should return the existing transaction instead of creating a new one
          expect(result.id).toBe('tx-1');
          
          // Check that no new transaction was added
          expect(context.transactions.length).toBe(1);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 2: Find transactions by appointment ID in metadata
  test('should find transactions by appointment ID in metadata', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    const existingTransaction = createSampleTransaction({
      id: 'tx-2',
      metadata: {
        appointmentId: appointmentId
      }
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with the same appointment ID in metadata
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 60,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      metadata: {
        appointmentId: appointmentId
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with the same appointment ID in metadata
          const result = context.addTransaction(newTransaction);
          
          // The provider should return the existing transaction instead of creating a new one
          expect(result.id).toBe('tx-2');
          
          // Check that no new transaction was added
          expect(context.transactions.length).toBe(1);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 3: Find transactions by booking reference
  test('should find transactions by booking reference', async () => {
    // Arrange
    const bookingReference = 'booking-456';
    const existingTransaction = createSampleTransaction({
      id: 'tx-3',
      metadata: {
        bookingReference: bookingReference
      }
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with the same booking reference
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 60,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      metadata: {
        bookingReference: bookingReference
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with the same booking reference
          const result = context.addTransaction(newTransaction);
          
          // The provider should return the existing transaction instead of creating a new one
          expect(result.id).toBe('tx-3');
          
          // Check that no new transaction was added
          expect(context.transactions.length).toBe(1);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 4: Find transactions with multiple matching criteria
  test('should find transactions with multiple matching criteria', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    const bookingReference = 'booking-456';
    
    const existingTransaction1 = createSampleTransaction({
      id: 'tx-4a',
      reference: {
        type: 'appointment',
        id: appointmentId
      }
    });
    
    const existingTransaction2 = createSampleTransaction({
      id: 'tx-4b',
      metadata: {
        appointmentId: appointmentId
      }
    });
    
    const existingTransaction3 = createSampleTransaction({
      id: 'tx-4c',
      metadata: {
        bookingReference: bookingReference
      }
    });
    
    // Set up localStorage with the existing transactions
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([
      existingTransaction1, existingTransaction2, existingTransaction3
    ]));
    
    // Create a new transaction with both appointment ID and booking reference
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 60,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      metadata: {
        bookingReference: bookingReference
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with both appointment ID and booking reference
          const result = context.addTransaction(newTransaction);
          
          // The provider should return one of the existing transactions
          expect(['tx-4a', 'tx-4b', 'tx-4c']).toContain(result.id);
          
          // Check that no new transaction was added
          expect(context.transactions.length).toBe(3);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 5: Handle edge case - no matching criteria
  test('should create new transaction when no matching criteria', async () => {
    // Arrange
    const existingTransaction = createSampleTransaction({
      id: 'tx-5',
      reference: {
        type: 'appointment',
        id: 'appt-123'
      }
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with no appointment ID or booking reference
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 60,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with no appointment ID or booking reference
          const result = context.addTransaction(newTransaction);
          
          // The provider should create a new transaction
          expect(result.id).not.toBe('tx-5');
          
          // Check that a new transaction was added
          expect(context.transactions.length).toBe(2);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 6: Handle edge case - different reference type
  test('should create new transaction when reference type is different', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    const existingTransaction = createSampleTransaction({
      id: 'tx-6',
      reference: {
        type: 'other',
        id: appointmentId
      }
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with the same ID but different reference type
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 60,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      reference: {
        type: 'appointment',
        id: appointmentId
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with the same ID but different reference type
          const result = context.addTransaction(newTransaction);
          
          // The provider should create a new transaction
          expect(result.id).not.toBe('tx-6');
          
          // Check that a new transaction was added
          expect(context.transactions.length).toBe(2);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 7: Handle edge case - empty string appointment ID
  test('should create new transaction when appointment ID is empty string', async () => {
    // Arrange
    const existingTransaction = createSampleTransaction({
      id: 'tx-7',
      reference: {
        type: 'appointment',
        id: 'appt-123'
      }
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with empty string appointment ID
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 60,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      reference: {
        type: 'appointment',
        id: ''
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with empty string appointment ID
          const result = context.addTransaction(newTransaction);
          
          // The provider should create a new transaction
          expect(result.id).not.toBe('tx-7');
          
          // Check that a new transaction was added
          expect(context.transactions.length).toBe(2);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 8: Handle edge case - null values in metadata
  test('should handle null values in metadata', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    const existingTransaction = createSampleTransaction({
      id: 'tx-8',
      metadata: {
        appointmentId: null
      }
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with the appointment ID
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 60,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      reference: {
        type: 'appointment',
        id: appointmentId
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with the appointment ID
          const result = context.addTransaction(newTransaction);
          
          // The provider should create a new transaction
          expect(result.id).not.toBe('tx-8');
          
          // Check that a new transaction was added
          expect(context.transactions.length).toBe(2);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });
});

describe('TransactionProvider - addTransaction duplicate prevention', () => {
  // Test case 1: Adding a new transaction with no duplicates
  test('should add a new transaction when no duplicates exist', async () => {
    // Arrange
    const existingTransaction = createSampleTransaction({
      id: 'tx-existing',
      reference: {
        type: 'appointment',
        id: 'appt-123'
      }
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with different appointment ID
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'New haircut service',
      amount: 60,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      reference: {
        type: 'appointment',
        id: 'appt-456' // Different appointment ID
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with different appointment ID
          const result = context.addTransaction(newTransaction);
          
          // The provider should create a new transaction
          expect(result.id).not.toBe('tx-existing');
          
          // Check that a new transaction was added
          expect(context.transactions.length).toBe(2);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 2: Adding a transaction with an existing non-discounted transaction
  test('should return existing non-discounted transaction when adding a duplicate', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    const existingTransaction = createSampleTransaction({
      id: 'tx-non-discounted',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 50,
      discountPercentage: 0
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with the same appointment ID
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 50,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      discountPercentage: 0
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with the same appointment ID
          const result = context.addTransaction(newTransaction);
          
          // The provider should return the existing transaction
          expect(result.id).toBe('tx-non-discounted');
          
          // Check that no new transaction was added
          expect(context.transactions.length).toBe(1);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 3: Adding a discounted transaction with an existing non-discounted transaction
  test('should replace non-discounted transaction when adding a discounted transaction', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    const existingTransaction = createSampleTransaction({
      id: 'tx-non-discounted',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 50,
      discountPercentage: 0
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new discounted transaction with the same appointment ID
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Discounted haircut service',
      amount: 40, // Discounted amount
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      discountPercentage: 20, // 20% discount
      discountAmount: 10
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new discounted transaction
          const result = context.addTransaction(newTransaction);
          
          // The provider should create a new transaction (replacing the old one)
          expect(result.id).not.toBe('tx-non-discounted');
          expect(result.discountPercentage).toBe(20);
          
          // Check that there's still only one transaction (the old one was removed)
          expect(context.transactions.length).toBe(1);
          
          // Check that the transaction in the context has the discount
          expect(context.transactions[0].discountPercentage).toBe(20);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 4: Adding a non-discounted transaction with an existing discounted transaction
  test('should return existing discounted transaction when adding a non-discounted transaction', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    const existingTransaction = createSampleTransaction({
      id: 'tx-discounted',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 40, // Discounted amount
      discountPercentage: 20, // 20% discount
      discountAmount: 10,
      description: 'Discounted haircut service'
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new non-discounted transaction with the same appointment ID
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Regular haircut service',
      amount: 50, // Regular amount
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      reference: {
        type: 'appointment',
        id: appointmentId
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new non-discounted transaction
          const result = context.addTransaction(newTransaction);
          
          // The provider should return the existing discounted transaction
          expect(result.id).toBe('tx-discounted');
          expect(result.discountPercentage).toBe(20);
          
          // Check that no new transaction was added
          expect(context.transactions.length).toBe(1);
          
          // Check that the transaction in the context still has the discount
          expect(context.transactions[0].discountPercentage).toBe(20);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 5: Adding a transaction from a different interface (source)
  test('should detect duplicates across different transaction sources', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    const existingTransaction = createSampleTransaction({
      id: 'tx-calendar',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      source: TransactionSource.CALENDAR
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with the same appointment ID but from POS
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Haircut service from POS',
      amount: 50,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS, // Different source
      reference: {
        type: 'appointment',
        id: appointmentId
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction from a different source
          const result = context.addTransaction(newTransaction);
          
          // The provider should return the existing transaction
          expect(result.id).toBe('tx-calendar');
          
          // Check that no new transaction was added
          expect(context.transactions.length).toBe(1);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 6: Adding a transaction with booking reference instead of appointment ID
  test('should detect duplicates using booking reference', async () => {
    // Arrange
    const bookingReference = 'booking-456';
    const existingTransaction = createSampleTransaction({
      id: 'tx-booking',
      metadata: {
        bookingReference: bookingReference
      }
    });
    
    // Set up localStorage with the existing transaction
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([existingTransaction]));
    
    // Create a new transaction with the same booking reference
    const newTransaction: TransactionCreate = {
      type: TransactionType.SERVICE_SALE,
      category: 'Haircut',
      description: 'Another haircut service',
      amount: 50,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'Main Salon',
      source: TransactionSource.POS,
      metadata: {
        bookingReference: bookingReference
      }
    };
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Add a new transaction with the same booking reference
          const result = context.addTransaction(newTransaction);
          
          // The provider should return the existing transaction
          expect(result.id).toBe('tx-booking');
          
          // Check that no new transaction was added
          expect(context.transactions.length).toBe(1);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });
});

describe('TransactionProvider - cleanupAllDuplicates', () => {
  // Test case 1: No duplicates
  test('should return 0 when no duplicates exist', async () => {
    // Arrange
    const transaction1 = createSampleTransaction({
      id: 'tx-1',
      reference: {
        type: 'appointment',
        id: 'appt-1'
      }
    });
    
    const transaction2 = createSampleTransaction({
      id: 'tx-2',
      reference: {
        type: 'appointment',
        id: 'appt-2'
      }
    });
    
    // Set up localStorage with transactions that have no duplicates
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([transaction1, transaction2]));
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Run the cleanup
          const result = context.cleanupAllDuplicates();
          
          // Should return 0 as no duplicates were found
          expect(result).toBe(0);
          
          // Check that both transactions are still there
          expect(context.transactions.length).toBe(2);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 2: Same-amount duplicates
  test('should remove same-amount duplicates and keep the most recent one', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    
    // Create two transactions with the same appointment ID and amount
    const olderTransaction = createSampleTransaction({
      id: 'tx-older',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 50,
      createdAt: new Date('2023-01-01T10:00:00')
    });
    
    const newerTransaction = createSampleTransaction({
      id: 'tx-newer',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 50,
      createdAt: new Date('2023-01-02T10:00:00') // More recent
    });
    
    // Set up localStorage with the duplicate transactions
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([olderTransaction, newerTransaction]));
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Run the cleanup
          const result = context.cleanupAllDuplicates();
          
          // Should return 1 as one duplicate was removed
          expect(result).toBe(1);
          
          // Check that only one transaction remains
          expect(context.transactions.length).toBe(1);
          
          // Check that the newer transaction was kept
          expect(context.transactions[0].id).toBe('tx-newer');
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 3: Different-amount duplicates (discount case)
  test('should handle different-amount duplicates and keep the discounted one', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    
    // Create two transactions with the same appointment ID but different amounts
    const fullPriceTransaction = createSampleTransaction({
      id: 'tx-full',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 50, // Full price
      discountPercentage: 0
    });
    
    const discountedTransaction = createSampleTransaction({
      id: 'tx-discounted',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 40, // Discounted price
      discountPercentage: 20,
      discountAmount: 10,
      description: 'Haircut service (20% off)'
    });
    
    // Set up localStorage with the duplicate transactions
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([fullPriceTransaction, discountedTransaction]));
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Run the cleanup
          const result = context.cleanupAllDuplicates();
          
          // Should return 1 as one duplicate was removed
          expect(result).toBe(1);
          
          // Check that only one transaction remains
          expect(context.transactions.length).toBe(1);
          
          // Check that the discounted transaction was kept
          expect(context.transactions[0].id).toBe('tx-discounted');
          expect(context.transactions[0].discountPercentage).toBe(20);
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 4: Different-amount duplicates without explicit discount info
  test('should handle different-amount duplicates without explicit discount info', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    
    // Create two transactions with the same appointment ID but different amounts
    // Neither has explicit discount information
    const higherAmountTransaction = createSampleTransaction({
      id: 'tx-higher',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 50 // Higher amount
    });
    
    const lowerAmountTransaction = createSampleTransaction({
      id: 'tx-lower',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 40 // Lower amount (implicitly discounted)
    });
    
    // Set up localStorage with the duplicate transactions
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([higherAmountTransaction, lowerAmountTransaction]));
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Run the cleanup
          const result = context.cleanupAllDuplicates();
          
          // Should return 1 as one duplicate was removed
          expect(result).toBe(1);
          
          // Check that only one transaction remains
          expect(context.transactions.length).toBe(1);
          
          // Check that the lower amount transaction was kept and updated with discount info
          expect(context.transactions[0].id).toBe('tx-lower');
          expect(context.transactions[0].discountPercentage).toBe(20); // 20% discount calculated
          expect(context.transactions[0].discountAmount).toBe(10); // $10 discount calculated
          expect(context.transactions[0].description).toContain('% off'); // Description updated
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 5: Mixed scenarios with multiple groups
  test('should handle mixed scenarios with multiple transaction groups', async () => {
    // Arrange
    // Group 1: Two transactions with same amount (appointment-1)
    const tx1Older = createSampleTransaction({
      id: 'tx1-older',
      reference: {
        type: 'appointment',
        id: 'appt-1'
      },
      amount: 50,
      createdAt: new Date('2023-01-01T10:00:00')
    });
    
    const tx1Newer = createSampleTransaction({
      id: 'tx1-newer',
      reference: {
        type: 'appointment',
        id: 'appt-1'
      },
      amount: 50,
      createdAt: new Date('2023-01-02T10:00:00') // More recent
    });
    
    // Group 2: Two transactions with different amounts (appointment-2)
    const tx2Full = createSampleTransaction({
      id: 'tx2-full',
      reference: {
        type: 'appointment',
        id: 'appt-2'
      },
      amount: 60, // Full price
      discountPercentage: 0
    });
    
    const tx2Discounted = createSampleTransaction({
      id: 'tx2-discounted',
      reference: {
        type: 'appointment',
        id: 'appt-2'
      },
      amount: 48, // Discounted price
      discountPercentage: 20,
      discountAmount: 12,
      description: 'Premium haircut service (20% off)'
    });
    
    // Group 3: Single transaction (no duplicates)
    const tx3Unique = createSampleTransaction({
      id: 'tx3-unique',
      reference: {
        type: 'appointment',
        id: 'appt-3'
      },
      amount: 70
    });
    
    // Set up localStorage with all transactions
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([
      tx1Older, tx1Newer, tx2Full, tx2Discounted, tx3Unique
    ]));
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Run the cleanup
          const result = context.cleanupAllDuplicates();
          
          // Should return 2 as two duplicates were removed
          expect(result).toBe(2);
          
          // Check that three transactions remain (one from each group)
          expect(context.transactions.length).toBe(3);
          
          // Check that the correct transactions were kept
          const remainingIds = context.transactions.map(tx => tx.id);
          expect(remainingIds).toContain('tx1-newer'); // Newer of same-amount duplicates
          expect(remainingIds).toContain('tx2-discounted'); // Discounted transaction
          expect(remainingIds).toContain('tx3-unique'); // Unique transaction
          
          // Check that the older and full-price transactions were removed
          expect(remainingIds).not.toContain('tx1-older');
          expect(remainingIds).not.toContain('tx2-full');
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 6: Transactions with booking reference instead of appointment ID
  test('should handle duplicates identified by booking reference', async () => {
    // Arrange
    const bookingReference = 'booking-456';
    
    // Create two transactions with the same booking reference
    const olderTransaction = createSampleTransaction({
      id: 'tx-older-booking',
      metadata: {
        bookingReference: bookingReference
      },
      amount: 50,
      createdAt: new Date('2023-01-01T10:00:00')
    });
    
    const newerTransaction = createSampleTransaction({
      id: 'tx-newer-booking',
      metadata: {
        bookingReference: bookingReference
      },
      amount: 50,
      createdAt: new Date('2023-01-02T10:00:00') // More recent
    });
    
    // Set up localStorage with the duplicate transactions
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([olderTransaction, newerTransaction]));
    
    // Act & Assert
    await act(async () => {
      renderWithProvider((context) => {
        // Wait for the provider to initialize
        setTimeout(() => {
          // Run the cleanup
          const result = context.cleanupAllDuplicates();
          
          // Should return 1 as one duplicate was removed
          expect(result).toBe(1);
          
          // Check that only one transaction remains
          expect(context.transactions.length).toBe(1);
          
          // Check that the newer transaction was kept
          expect(context.transactions[0].id).toBe('tx-newer-booking');
        }, 200);
      });
    });
    
    // Fast-forward timers to ensure all async operations complete
    jest.runAllTimers();
  });

  // Test case 7: Automatic cleanup during initialization
  test('should automatically clean up duplicates during initialization', async () => {
    // Arrange
    const appointmentId = 'appt-123';
    
    // Create two transactions with the same appointment ID but different amounts
    const fullPriceTransaction = createSampleTransaction({
      id: 'tx-full-init',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 50 // Full price
    });
    
    const discountedTransaction = createSampleTransaction({
      id: 'tx-discounted-init',
      reference: {
        type: 'appointment',
        id: appointmentId
      },
      amount: 40, // Discounted price
      discountPercentage: 20,
      discountAmount: 10
    });
    
    // Set up localStorage with the duplicate transactions
    mockLocalStorage.setItem('vanity_transactions', JSON.stringify([fullPriceTransaction, discountedTransaction]));
    
    // Act & Assert
    await act(async () => {
      // Just render the provider - initialization should trigger cleanup
      render(
        <TransactionProvider>
          <div>Test Component</div>
        </TransactionProvider>
      );
      
      // Fast-forward timers to ensure initialization and cleanup run
      jest.advanceTimersByTime(200);
      
      // Check localStorage to see if it was updated with deduplicated transactions
      const storedData = mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1][1];
      const parsedData = JSON.parse(storedData);
      
      // Should only have one transaction
      expect(parsedData.length).toBe(1);
      
      // Should be the discounted transaction
      expect(parsedData[0].id).toBe('tx-discounted-init');
    });
  });
});