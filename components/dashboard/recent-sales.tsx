"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"

export function RecentSales() {
  const { formatCurrency } = useCurrency()
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Recent Sales</CardTitle>
        <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 text-sm font-medium text-muted-foreground">
            <div>Service/Product</div>
            <div className="text-right">Amount</div>
            <div className="text-right">Status</div>
          </div>

          <div className="grid grid-cols-3 items-center">
            <div>Haircut & Style</div>
            <div className="text-right"><CurrencyDisplay amount={75.00} /></div>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 items-center">
            <div>Color Treatment</div>
            <div className="text-right"><CurrencyDisplay amount={120.00} /></div>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 items-center">
            <div>Styling Products</div>
            <div className="text-right"><CurrencyDisplay amount={45.00} /></div>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 items-center">
            <div>Manicure</div>
            <div className="text-right"><CurrencyDisplay amount={35.00} /></div>
            <div className="text-right">
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

