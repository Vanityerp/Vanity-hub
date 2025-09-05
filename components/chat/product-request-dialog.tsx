"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-provider"
import { chatService } from "@/lib/chat-service"
import { Package, Search, AlertCircle, CheckCircle, Clock } from "lucide-react"

interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  price: number;
  supplier?: string;
  location: string;
}

interface ProductRequestDialogProps {
  children: React.ReactNode;
  channelId: string;
}

export function ProductRequestDialog({ children, channelId }: ProductRequestDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [requestType, setRequestType] = useState<'restock' | 'new_order' | 'urgent' | 'inquiry'>('restock')
  const [quantity, setQuantity] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [notes, setNotes] = useState('')
  const [products, setProducts] = useState<Product[]>([])

  // Mock product data - in real app, this would come from inventory API
  useEffect(() => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Hydrating Shampoo 500ml',
        category: 'Hair Care',
        currentStock: 3,
        minStock: 5,
        maxStock: 20,
        price: 24.99,
        supplier: 'Beauty Supply Co',
        location: 'Downtown'
      },
      {
        id: '2',
        name: 'Professional Hair Dryer',
        category: 'Tools',
        currentStock: 0,
        minStock: 2,
        maxStock: 5,
        price: 149.99,
        supplier: 'Salon Equipment Ltd',
        location: 'Downtown'
      },
      {
        id: '3',
        name: 'Color Developer 1000ml',
        category: 'Hair Color',
        currentStock: 8,
        minStock: 10,
        maxStock: 25,
        price: 18.50,
        supplier: 'Color Pro',
        location: 'Downtown'
      },
      {
        id: '4',
        name: 'Nail Polish - Red',
        category: 'Nail Care',
        currentStock: 4,
        minStock: 8,
        maxStock: 15,
        price: 12.99,
        supplier: 'Nail Essentials',
        location: 'Downtown'
      },
      {
        id: '5',
        name: 'Facial Cleanser',
        category: 'Skin Care',
        currentStock: 2,
        minStock: 5,
        maxStock: 12,
        price: 32.00,
        supplier: 'Skin Solutions',
        location: 'Downtown'
      }
    ]
    setProducts(mockProducts)
  }, [])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    } else if (product.currentStock < product.minStock) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
  }

  const handleSubmitRequest = () => {
    if (!selectedProduct || !user) return

    const requestMessage = `**Product Request**

**Product:** ${selectedProduct.name}
**Type:** ${requestType.replace('_', ' ').toUpperCase()}
**Quantity:** ${quantity || 'Not specified'}
**Priority:** ${priority.toUpperCase()}
**Current Stock:** ${selectedProduct.currentStock}
**Minimum Stock:** ${selectedProduct.minStock}

${notes ? `**Notes:** ${notes}` : ''}

**Requested by:** ${user.name} (${user.role})`

    chatService.sendMessage(
      channelId,
      requestMessage,
      'product_request',
      {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        requestType,
        priority
      }
    )

    // Reset form
    setSelectedProduct(null)
    setRequestType('restock')
    setQuantity('')
    setPriority('medium')
    setNotes('')
    setSearchQuery('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Request Product
          </DialogTitle>
          <DialogDescription>
            Search for products and submit requests for restocking or new orders
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* Product Search */}
          <div className="space-y-2">
            <Label>Search Products</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Product List */}
          <div className="space-y-2">
            <Label>Select Product</Label>
            <ScrollArea className="h-48 border rounded-md p-2">
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const status = getStockStatus(product)
                  const StatusIcon = status.icon
                  
                  return (
                    <div
                      key={product.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProduct?.id === product.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{product.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Stock: {product.currentStock}</span>
                            <span>Min: {product.minStock}</span>
                            <span>${product.price}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {selectedProduct && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Request Details for {selectedProduct.name}</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <Select value={requestType} onValueChange={(value: any) => setRequestType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restock">Restock</SelectItem>
                      <SelectItem value="new_order">New Order</SelectItem>
                      <SelectItem value="urgent">Urgent Request</SelectItem>
                      <SelectItem value="inquiry">Stock Inquiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity (optional)</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity needed"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any additional information about this request..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitRequest}
            disabled={!selectedProduct}
          >
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
