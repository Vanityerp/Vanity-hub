"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { integratedAnalyticsService } from "@/lib/integrated-analytics-service"
import { ShoppingCart, TrendingUp, Package, BarChart3 } from "lucide-react"

export default function ProductAnalyticsTest() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [message, setMessage] = useState("")

  const generateSalesData = async () => {
    setIsGenerating(true)
    setMessage("")
    
    try {
      // Beauty salon product sales data
      const productSalesData = [
        {
          productId: 'prod-hair-001',
          productName: 'Hydrating Shampoo',
          category: 'Hair Care',
          price: 28.99,
          cost: 14.50,
          salesCount: 17
        },
        {
          productId: 'prod-hair-002',
          productName: 'Keratin Hair Treatment',
          category: 'Hair Care',
          price: 65.00,
          cost: 32.50,
          salesCount: 7
        },
        {
          productId: 'prod-hair-003',
          productName: 'Professional Hair Serum',
          category: 'Hair Care',
          price: 45.99,
          cost: 23.00,
          salesCount: 7
        },
        {
          productId: 'prod-hair-004',
          productName: 'Color Protection Conditioner',
          category: 'Hair Care',
          price: 32.99,
          cost: 16.50,
          salesCount: 9
        },
        {
          productId: 'prod-style-001',
          productName: 'Volumizing Mousse',
          category: 'Styling',
          price: 24.99,
          cost: 12.50,
          salesCount: 4
        },
        {
          productId: 'prod-style-002',
          productName: 'Heat Protection Spray',
          category: 'Styling',
          price: 19.99,
          cost: 10.00,
          salesCount: 6
        },
        {
          productId: 'prod-style-003',
          productName: 'Hair Styling Gel',
          category: 'Styling',
          price: 16.99,
          cost: 8.50,
          salesCount: 2
        },
        {
          productId: 'prod-skin-001',
          productName: 'Facial Cleanser',
          category: 'Skincare',
          price: 35.99,
          cost: 18.00,
          salesCount: 4
        },
        {
          productId: 'prod-skin-002',
          productName: 'Anti-Aging Serum',
          category: 'Skincare',
          price: 89.99,
          cost: 45.00,
          salesCount: 2
        },
        {
          productId: 'prod-skin-003',
          productName: 'Moisturizing Cream',
          category: 'Skincare',
          price: 42.99,
          cost: 21.50,
          salesCount: 3
        }
      ];

      const transactions = [];
      let transactionId = 1000;

      // Generate transactions for each product
      productSalesData.forEach(product => {
        for (let i = 0; i < product.salesCount; i++) {
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 units per transaction
          const daysAgo = Math.floor(Math.random() * 14) + 1; // 1-14 days ago
          const saleDate = new Date(Date.now() - (daysAgo * 86400000));
          const totalAmount = quantity * product.price;

          const transaction = {
            id: `TX-PROD-${transactionId++}`,
            date: saleDate.toISOString(),
            type: 'inventory_sale',
            source: 'pos',
            status: 'completed',
            amount: totalAmount,
            paymentMethod: ['cash', 'credit_card', 'debit_card'][Math.floor(Math.random() * 3)],
            clientId: `client-${Math.floor(Math.random() * 100) + 1}`,
            clientName: `Client ${Math.floor(Math.random() * 100) + 1}`,
            staffId: ['1', '2', '3'][Math.floor(Math.random() * 3)],
            staffName: ['Emma Johnson', 'Sarah Wilson', 'Mike Davis'][Math.floor(Math.random() * 3)],
            location: 'loc1',
            category: product.category,
            description: `${product.productName} (Qty: ${quantity})`,
            productId: product.productId,
            productName: product.productName,
            quantity: quantity,
            costPrice: product.cost,
            items: [{
              id: product.productId,
              name: product.productName,
              quantity: quantity,
              unitPrice: product.price,
              totalPrice: totalAmount,
              category: product.category
            }],
            reference: {
              type: 'pos_sale',
              id: `pos-${transactionId}`
            },
            metadata: {
              productId: product.productId,
              quantity: quantity,
              unitPrice: product.price,
              costPrice: product.cost
            },
            createdAt: saleDate.toISOString(),
            updatedAt: saleDate.toISOString()
          };

          transactions.push(transaction);
        }
      });

      // Get existing transactions and filter out old product sales
      const existingTransactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]');
      const filteredExisting = existingTransactions.filter((t: any) => 
        t.type !== 'inventory_sale' && !t.productId
      );

      // Combine and save
      const allTransactions = [...filteredExisting, ...transactions];
      localStorage.setItem('vanity_transactions', JSON.stringify(allTransactions));

      // Get updated analytics
      const updatedAnalytics = integratedAnalyticsService.getAnalytics();
      setAnalytics(updatedAnalytics);

      setMessage(`✅ Generated ${transactions.length} product sales transactions! Check the dashboard to see the enhanced top selling products section.`);
      
    } catch (error) {
      console.error('Error generating sales data:', error);
      setMessage(`❌ Error: ${error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearData = () => {
    try {
      const existingTransactions = JSON.parse(localStorage.getItem('vanity_transactions') || '[]');
      const filteredTransactions = existingTransactions.filter((t: any) => 
        t.type !== 'inventory_sale' && !t.productId
      );
      localStorage.setItem('vanity_transactions', JSON.stringify(filteredTransactions));
      setAnalytics(null);
      setMessage("🗑️ Cleared all product sales data");
    } catch (error) {
      setMessage(`❌ Error clearing data: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Product Analytics Test</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Generate Product Sales Data
          </CardTitle>
          <CardDescription>
            Create realistic product sales transactions to populate the top selling products analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={generateSalesData} 
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Sales Data'}
            </Button>
            <Button 
              onClick={clearData} 
              variant="outline"
            >
              Clear Data
            </Button>
          </div>
          
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('✅') ? 'bg-green-50 text-green-700' :
              message.includes('❌') ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Selling Products Preview
            </CardTitle>
            <CardDescription>
              Preview of the enhanced analytics data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topSellingProducts.slice(0, 5).map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <span className="font-medium text-sm">{product.name}</span>
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {product.quantitySold} units • {product.margin.toFixed(1)}% margin
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">
                      <CurrencyDisplay amount={product.revenue} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <CurrencyDisplay amount={product.profit} /> profit
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        <p>💡 <strong>Tip:</strong> After generating data, navigate to the main dashboard to see the enhanced top selling products section with real data, trends, and improved visuals.</p>
      </div>
    </div>
  );
}
