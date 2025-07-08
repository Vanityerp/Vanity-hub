"use client"

import { TransactionTest } from "@/components/test/transaction-test"

export default function TransactionTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Transaction Integration Test</h1>
        <p className="text-gray-600 mt-2">
          Test the integration between client portal purchases and main dashboard transaction tracking.
        </p>
      </div>
      
      <TransactionTest />
    </div>
  )
}
