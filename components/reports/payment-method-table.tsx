"use client"

import { useAuth } from "@/lib/auth-provider"
import type { DateRange } from "react-day-picker"

interface PaymentMethodTableProps {
  dateRange?: DateRange
}

export function PaymentMethodTable({ dateRange }: PaymentMethodTableProps) {
  const { currentLocation } = useAuth()

  // Mock data for payment methods
  const paymentData = [
    { method: "Credit Card", count: 156, amount: 3256.75, percentage: 59.7 },
    { method: "Cash", count: 87, amount: 1618.50, percentage: 29.7 },
    { method: "Mobile Payment", count: 32, amount: 583.25, percentage: 10.6 },
  ]

  const totalAmount = paymentData.reduce((sum, item) => sum + item.amount, 0)
  const totalCount = paymentData.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">Payment Method</th>
            <th className="p-3 text-right font-medium">Transactions</th>
            <th className="p-3 text-right font-medium">Amount</th>
            <th className="p-3 text-right font-medium">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {paymentData.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="p-3 font-medium">{item.method}</td>
              <td className="p-3 text-right">{item.count}</td>
              <td className="p-3 text-right">${item.amount.toFixed(2)}</td>
              <td className="p-3 text-right">{item.percentage}%</td>
            </tr>
          ))}
          <tr className="bg-muted/20 font-medium">
            <td className="p-3">Total</td>
            <td className="p-3 text-right">{totalCount}</td>
            <td className="p-3 text-right">${totalAmount.toFixed(2)}</td>
            <td className="p-3 text-right">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
