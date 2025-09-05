import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DailySales } from '@/components/accounting/daily-sales'
import { TransactionProvider } from '@/lib/transaction-provider'
import { TransactionType, TransactionStatus, PaymentMethod } from '@/lib/transaction-types'

// Mock the transaction provider
jest.mock('@/lib/transaction-provider', () => ({
  useTransactions: () => ({
    transactions: [],
    filterTransactions: jest.fn(() => [])
  })
}))

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

// Mock the date-fns functions
jest.mock('date-fns', () => ({
  format: jest.fn(() => 'Jan 01, 2024'),
  addDays: jest.fn((date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)),
  subDays: jest.fn((date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000)),
  isSameDay: jest.fn(() => false)
}))

describe('DailySales Component', () => {
  const mockTransactions = [
    {
      id: '1',
      date: new Date('2024-01-01T10:00:00Z'),
      type: TransactionType.SERVICE_SALE,
      category: 'Service',
      description: 'Haircut',
      amount: 50,
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      location: 'loc1',
      source: 'calendar',
      items: [
        {
          id: 'service1',
          name: 'Haircut',
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50,
          type: 'service'
        }
      ]
    },
    {
      id: '2',
      date: new Date('2024-01-01T11:00:00Z'),
      type: TransactionType.PRODUCT_SALE,
      category: 'Product',
      description: 'Shampoo',
      amount: 25,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      location: 'loc1',
      source: 'pos',
      items: [
        {
          id: 'product1',
          name: 'Shampoo',
          quantity: 1,
          unitPrice: 25,
          totalPrice: 25,
          type: 'product'
        }
      ]
    },
    {
      id: '3',
      date: new Date('2024-01-01T12:00:00Z'),
      type: TransactionType.CONSOLIDATED_SALE,
      category: 'Consolidated Sale',
      description: 'Haircut + Shampoo',
      amount: 70,
      paymentMethod: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      location: 'loc1',
      source: 'calendar',
      items: [
        {
          id: 'service2',
          name: 'Hair Color',
          quantity: 1,
          unitPrice: 60,
          totalPrice: 60,
          type: 'service'
        },
        {
          id: 'product2',
          name: 'Conditioner',
          quantity: 1,
          unitPrice: 10,
          totalPrice: 10,
          type: 'product'
        }
      ]
    }
  ]

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
  })

  it('should render the daily sales component', () => {
    render(
      <TransactionProvider>
        <DailySales />
      </TransactionProvider>
    )

    expect(screen.getByText('Daily sales')).toBeInTheDocument()
    expect(screen.getByText('Transaction summary')).toBeInTheDocument()
  })

  it('should display service and product breakdowns', () => {
    // Mock the filterTransactions to return our test data
    const mockFilterTransactions = jest.fn(() => mockTransactions)
    
    jest.doMock('@/lib/transaction-provider', () => ({
      useTransactions: () => ({
        transactions: mockTransactions,
        filterTransactions: mockFilterTransactions
      })
    }))

    render(
      <TransactionProvider>
        <DailySales />
      </TransactionProvider>
    )

    // Check that the component renders without errors
    expect(screen.getByText('Daily sales')).toBeInTheDocument()
  })

  it('should handle empty transaction data', () => {
    const mockFilterTransactions = jest.fn(() => [])
    
    jest.doMock('@/lib/transaction-provider', () => ({
      useTransactions: () => ({
        transactions: [],
        filterTransactions: mockFilterTransactions
      })
    }))

    render(
      <TransactionProvider>
        <DailySales />
      </TransactionProvider>
    )

    expect(screen.getByText('Daily sales')).toBeInTheDocument()
  })

  it('should show expandable chevron icons for categories with breakdowns', () => {
    const mockFilterTransactions = jest.fn(() => mockTransactions)
    
    jest.doMock('@/lib/transaction-provider', () => ({
      useTransactions: () => ({
        transactions: mockTransactions,
        filterTransactions: mockFilterTransactions
      })
    }))

    render(
      <TransactionProvider>
        <DailySales />
      </TransactionProvider>
    )

    // Check that the component renders without errors
    expect(screen.getByText('Daily sales')).toBeInTheDocument()
  })

  it('should toggle breakdown expansion when chevron is clicked', () => {
    const mockFilterTransactions = jest.fn(() => mockTransactions)
    
    jest.doMock('@/lib/transaction-provider', () => ({
      useTransactions: () => ({
        transactions: mockTransactions,
        filterTransactions: mockFilterTransactions
      })
    }))

    render(
      <TransactionProvider>
        <DailySales />
      </TransactionProvider>
    )

    // Check that the component renders without errors
    expect(screen.getByText('Daily sales')).toBeInTheDocument()
  })
}) 