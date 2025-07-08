import { Transaction } from "@/lib/transaction-types"
import { format, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns"
import type { DateRange } from "react-day-picker"

// Types for accounting data aggregation
export interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  grossMargin: number
  transactionCount: number
  averageTransactionValue: number
}

export interface ExpenseData {
  id: string
  date: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  location: string
  staffName?: string
  reference?: string
}

export interface StaffCostData {
  staffId: string
  staffName: string
  baseSalary: number
  commission: number
  benefits: number
  totalCost: number
  hoursWorked: number
  hourlyRate: number
  location: string
}

export interface DailySalesData {
  date: string
  grossSales: number
  refunds: number
  netSales: number
  transactionCount: number
  averageTicket: number
  cashPayments: number
  cardPayments: number
  otherPayments: number
}

export interface TransactionSummary {
  totalTransactions: number
  completedTransactions: number
  pendingTransactions: number
  cancelledTransactions: number
  totalRevenue: number
  averageTransactionValue: number
  topPaymentMethod: string
  topLocation: string
}

// Financial summary aggregation
export function aggregateFinancialSummary(
  transactions: Transaction[],
  expenses: ExpenseData[],
  dateRange?: DateRange,
  location?: string
): FinancialSummary {
  if (!transactions || !Array.isArray(transactions)) {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      grossMargin: 0,
      transactionCount: 0,
      averageTransactionValue: 0
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction || typeof transaction !== 'object') return false

    let includeTransaction = true

    if (dateRange?.from && dateRange?.to) {
      const transactionDate = new Date(transaction.date)
      includeTransaction = transactionDate >= startOfDay(dateRange.from) && 
                          transactionDate <= endOfDay(dateRange.to)
    }

    if (location && location !== 'all') {
      includeTransaction = includeTransaction && transaction.location === location
    }

    return includeTransaction
  })

  const filteredExpenses = expenses?.filter(expense => {
    let includeExpense = true

    if (dateRange?.from && dateRange?.to) {
      const expenseDate = new Date(expense.date)
      includeExpense = expenseDate >= startOfDay(dateRange.from) && 
                      expenseDate <= endOfDay(dateRange.to)
    }

    if (location && location !== 'all') {
      includeExpense = includeExpense && expense.location === location
    }

    return includeExpense
  }) || []

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const netProfit = totalRevenue - totalExpenses
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    grossMargin,
    transactionCount: filteredTransactions.length,
    averageTransactionValue: filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0
  }
}

// Daily sales aggregation
export function aggregateDailySalesData(
  transactions: Transaction[],
  dateRange?: DateRange,
  location?: string
): DailySalesData[] {
  if (!transactions || !Array.isArray(transactions)) {
    return []
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction || typeof transaction !== 'object') return false

    let includeTransaction = true

    if (dateRange?.from && dateRange?.to) {
      const transactionDate = new Date(transaction.date)
      includeTransaction = transactionDate >= startOfDay(dateRange.from) && 
                          transactionDate <= endOfDay(dateRange.to)
    }

    if (location && location !== 'all') {
      includeTransaction = includeTransaction && transaction.location === location
    }

    return includeTransaction
  })

  const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const endDate = dateRange?.to || new Date()
  const intervals = eachDayOfInterval({ start: startDate, end: endDate })

  return intervals.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayTransactions = filteredTransactions.filter(transaction => 
      format(new Date(transaction.date), 'yyyy-MM-dd') === dateStr
    )

    const grossSales = dayTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const refunds = dayTransactions
      .filter(t => t.status === 'refunded')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const netSales = grossSales - refunds

    const cashPayments = dayTransactions
      .filter(t => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const cardPayments = dayTransactions
      .filter(t => t.paymentMethod === 'credit_card')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const otherPayments = dayTransactions
      .filter(t => !['cash', 'credit_card'].includes(t.paymentMethod))
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    return {
      date: format(date, 'MMM dd, yyyy'),
      grossSales,
      refunds,
      netSales,
      transactionCount: dayTransactions.length,
      averageTicket: dayTransactions.length > 0 ? grossSales / dayTransactions.length : 0,
      cashPayments,
      cardPayments,
      otherPayments
    }
  })
}

// Transaction summary aggregation
export function aggregateTransactionSummary(
  transactions: Transaction[],
  dateRange?: DateRange,
  location?: string
): TransactionSummary {
  if (!transactions || !Array.isArray(transactions)) {
    return {
      totalTransactions: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
      cancelledTransactions: 0,
      totalRevenue: 0,
      averageTransactionValue: 0,
      topPaymentMethod: '',
      topLocation: ''
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (!transaction || typeof transaction !== 'object') return false

    let includeTransaction = true

    if (dateRange?.from && dateRange?.to) {
      const transactionDate = new Date(transaction.date)
      includeTransaction = transactionDate >= startOfDay(dateRange.from) && 
                          transactionDate <= endOfDay(dateRange.to)
    }

    if (location && location !== 'all') {
      includeTransaction = includeTransaction && transaction.location === location
    }

    return includeTransaction
  })

  const completedTransactions = filteredTransactions.filter(t => t.status === 'completed').length
  const pendingTransactions = filteredTransactions.filter(t => t.status === 'pending').length
  const cancelledTransactions = filteredTransactions.filter(t => t.status === 'cancelled').length
  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)

  // Find top payment method
  const paymentMethodCounts = new Map<string, number>()
  filteredTransactions.forEach(t => {
    const method = t.paymentMethod || 'unknown'
    paymentMethodCounts.set(method, (paymentMethodCounts.get(method) || 0) + 1)
  })
  const topPaymentMethod = Array.from(paymentMethodCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || ''

  // Find top location
  const locationCounts = new Map<string, number>()
  filteredTransactions.forEach(t => {
    const loc = t.location || 'unknown'
    locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1)
  })
  const topLocation = Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || ''

  return {
    totalTransactions: filteredTransactions.length,
    completedTransactions,
    pendingTransactions,
    cancelledTransactions,
    totalRevenue,
    averageTransactionValue: filteredTransactions.length > 0 ? totalRevenue / filteredTransactions.length : 0,
    topPaymentMethod,
    topLocation
  }
}

// Staff costs aggregation
export function aggregateStaffCostsData(
  staffList: any[],
  transactions: Transaction[],
  dateRange?: DateRange,
  location?: string
): StaffCostData[] {
  if (!staffList || !Array.isArray(staffList)) {
    return []
  }

  const filteredTransactions = transactions?.filter(transaction => {
    if (!transaction || typeof transaction !== 'object') return false

    let includeTransaction = true

    if (dateRange?.from && dateRange?.to) {
      const transactionDate = new Date(transaction.date)
      includeTransaction = transactionDate >= startOfDay(dateRange.from) && 
                          transactionDate <= endOfDay(dateRange.to)
    }

    if (location && location !== 'all') {
      includeTransaction = includeTransaction && transaction.location === location
    }

    return includeTransaction
  }) || []

  return staffList.map((staff, index) => {
    const staffTransactions = filteredTransactions.filter(t => t.staffId === staff.id)
    const revenue = staffTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    
    // Mock calculations based on staff ID for consistent data
    const seed = parseInt(staff.id.replace(/\D/g, '')) || index + 1
    const baseSalary = 3000 + (seed * 100) % 2000 // 3000-5000 range
    const commission = revenue * 0.1 // 10% commission
    const benefits = baseSalary * 0.2 // 20% benefits
    const totalCost = baseSalary + commission + benefits
    const hoursWorked = 160 + (seed * 10) % 40 // 160-200 hours
    const hourlyRate = totalCost / hoursWorked

    return {
      staffId: staff.id,
      staffName: staff.name,
      baseSalary,
      commission,
      benefits,
      totalCost,
      hoursWorked,
      hourlyRate,
      location: staff.location || location || 'all'
    }
  })
}

// Expense data aggregation (mock for now)
export function aggregateExpenseData(
  dateRange?: DateRange,
  location?: string
): ExpenseData[] {
  // Mock expense data - in real implementation, this would come from an expense provider
  const mockExpenses: ExpenseData[] = [
    {
      id: 'EXP001',
      date: format(new Date(), 'yyyy-MM-dd'),
      category: 'Supplies',
      description: 'Hair care products',
      amount: 250.00,
      paymentMethod: 'credit_card',
      location: 'loc1',
      staffName: 'Manager',
      reference: 'INV-2024-001'
    },
    {
      id: 'EXP002',
      date: format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      category: 'Utilities',
      description: 'Electricity bill',
      amount: 180.00,
      paymentMethod: 'bank_transfer',
      location: 'loc1',
      staffName: 'Manager',
      reference: 'UTIL-2024-001'
    }
  ]

  return mockExpenses.filter(expense => {
    let includeExpense = true

    if (dateRange?.from && dateRange?.to) {
      const expenseDate = new Date(expense.date)
      includeExpense = expenseDate >= startOfDay(dateRange.from) && 
                      expenseDate <= endOfDay(dateRange.to)
    }

    if (location && location !== 'all') {
      includeExpense = includeExpense && expense.location === location
    }

    return includeExpense
  })
}
