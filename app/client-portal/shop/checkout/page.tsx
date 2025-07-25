"use client"

import React, { useState, useEffect } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import {
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
  CheckCircle,
  Banknote
} from "lucide-react"
import { useCart } from "@/lib/cart-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { SettingsStorage } from "@/lib/settings-storage"
import { useTransactions } from "@/lib/transaction-provider"
import { useOrders } from "@/lib/order-provider"
import { useProducts } from "@/lib/product-provider"
import { TransactionType, TransactionSource, TransactionStatus, PaymentMethod } from "@/lib/transaction-types"
import { getCurrentClientId, getClientInfo } from "@/lib/client-auth-utils"

interface CheckoutForm {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  billingAddress: string
  billingCity: string
  billingState: string
  billingZipCode: string
  billingCountry: string
  paymentMethod: string
  cardNumber: string
  expiryDate: string
  cvv: string
  cardName: string
  sameAsShipping: boolean
}

export default function CheckoutPage() {
  const { toast } = useToast()
  const { addTransaction } = useTransactions()
  const { createOrderFromTransaction } = useOrders()
  const { updateProduct } = useProducts()
  const {
    cartItems,
    cartItemCount,
    cartSubtotal,
    cartTax,
    cartShipping,
    cartTotal,
    appliedPromo,
    isInitialized,
    clearCart
  } = useCart()

  // Get checkout settings for payment method availability
  const checkoutSettings = SettingsStorage.getCheckoutSettings()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState<CheckoutForm>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: 'US',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    sameAsShipping: true
  })

  // Check if user is logged in and pre-fill form
  useEffect(() => {
    const token = localStorage.getItem("client_auth_token")
    const email = localStorage.getItem("client_email")

    if (token && email) {
      setIsLoggedIn(true)
      setFormData(prev => ({
        ...prev,
        email: email
      }))
    }
  }, [])

  // Redirect to cart if empty (only after cart has been initialized)
  useEffect(() => {
    if (isInitialized && cartItemCount === 0) {
      window.location.href = "/client-portal/shop/cart"
    }
  }, [cartItemCount, isInitialized])

  const handleInputChange = (field: keyof CheckoutForm, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Validate COD requirements
      if (formData.paymentMethod === 'cod') {
        if (checkoutSettings.orderProcessing.requirePhoneForCOD && !formData.phone.trim()) {
          throw new Error("Phone number is required for Cash on Delivery orders")
        }
      }

      // Validate card details for card payments
      if (formData.paymentMethod === 'card') {
        if (!formData.cardNumber.trim() || !formData.expiryDate.trim() || !formData.cvv.trim() || !formData.cardName.trim()) {
          throw new Error("Please fill in all card details")
        }
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Get client information using consistent utility
      const clientId = getCurrentClientId()
      const clientInfo = getClientInfo()
      const clientName = `${formData.firstName} ${formData.lastName}`

      console.log('🔍 CLIENT PORTAL CHECKOUT: Client information:', {
        clientId,
        clientName,
        clientInfo,
        isAuthenticated: clientInfo.isAuthenticated
      })

      // Create order ID
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Get the correct online location ID
      const getOnlineLocationId = async (): Promise<string> => {
        try {
          const locationsResponse = await fetch('/api/locations')
          if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json()
            const onlineLocation = locationsData.locations.find((loc: any) =>
              loc.name.toLowerCase().includes('online') || loc.id === 'online'
            )
            return onlineLocation?.id || 'online'
          }
        } catch (error) {
          console.warn('Failed to fetch online location ID, using fallback:', error)
        }
        return 'online' // Fallback to hardcoded value
      }

      const onlineLocationId = await getOnlineLocationId()
      console.log('🏪 Using online location ID:', onlineLocationId)

      // Pre-check inventory availability for all items before processing
      console.log('🔍 Pre-checking inventory availability...')
      for (const item of cartItems) {
        try {
          const inventoryCheckResponse = await fetch(`/api/inventory?locationId=${onlineLocationId}`)
          if (inventoryCheckResponse.ok) {
            const inventoryData = await inventoryCheckResponse.json()
            const productInventory = inventoryData.inventory.find((inv: any) => inv.product.id === item.product.id)

            if (!productInventory || productInventory.stock < item.quantity) {
              throw new Error(`Insufficient stock for ${item.product.name}. Available: ${productInventory?.stock || 0}, Requested: ${item.quantity}`)
            }
          }
        } catch (error) {
          console.error(`Inventory check failed for ${item.product.name}:`, error)
          throw error
        }
      }
      console.log('✅ Inventory availability confirmed for all items')

      // Create order data
      const orderData = {
        id: orderId,
        clientId,
        items: cartItems.map(item => ({
          id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.salePrice || item.product.price,
          totalPrice: (item.product.salePrice || item.product.price) * item.quantity,
          sku: item.product.sku || undefined,
          image: item.product.image || undefined
        })),
        subtotal: cartSubtotal,
        tax: cartTax,
        shipping: cartShipping,
        total: cartTotal,
        paymentMethod: formData.paymentMethod,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        appliedPromo: appliedPromo,
        createdAt: new Date().toISOString()
      }

      // Process each cart item - update inventory using proper API calls
      for (const item of cartItems) {
        const product = item.product

        try {
          // Call the inventory adjustment API to properly deduct stock from the database
          const inventoryResponse = await fetch('/api/inventory/adjust', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              locationId: onlineLocationId, // Use the correct online location ID
              adjustmentType: 'remove',
              quantity: item.quantity,
              reason: `Online store sale - Order ${orderId}`,
              notes: `Client portal purchase by ${clientName}`
            }),
          })

          if (!inventoryResponse.ok) {
            const errorData = await inventoryResponse.json()
            throw new Error(`Failed to adjust inventory for ${product.name}: ${errorData.error || 'Unknown error'}`)
          }

          const inventoryResult = await inventoryResponse.json()
          console.log(`📦 Updated inventory for ${product.name}: ${inventoryResult.previousStock} -> ${inventoryResult.newStock}`)
        } catch (error) {
          console.error(`Error updating inventory for ${product.name}:`, error)
          // Re-throw the error to be caught by the outer try-catch
          throw new Error(`Inventory adjustment failed for ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Create main order transaction with detailed item information
      const orderTransaction = {
        date: new Date(),
        clientId,
        clientName,
        type: TransactionType.PRODUCT_SALE,
        category: "Online Product Sale",
        description: `Client Portal Order - ${cartItems.length} item${cartItems.length > 1 ? 's' : ''}`,
        amount: cartTotal,
        paymentMethod: formData.paymentMethod === 'cod' ? PaymentMethod.CASH : PaymentMethod.CREDIT_CARD,
        status: TransactionStatus.PENDING, // Always start as pending, will be updated when order is delivered
        location: "online", // Use special "online" location for client portal transactions
        source: TransactionSource.CLIENT_PORTAL,
        reference: {
          type: "client_portal_order",
          id: orderId
        },
        // Include detailed item information in the transaction
        items: cartItems.map(item => ({
          id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.salePrice || item.product.price,
          totalPrice: (item.product.salePrice || item.product.price) * item.quantity,
          cost: item.product.cost || 0
        })),
        metadata: {
          orderData,
          itemCount: cartItems.length,
          shippingAddress: orderData.shippingAddress,
          appliedPromo: appliedPromo,
          isOnlineTransaction: true, // Flag to identify online transactions
          subtotal: cartSubtotal,
          tax: cartTax,
          shipping: cartShipping,
          total: cartTotal,
          // Calculate total cost and profit
          totalCost: cartItems.reduce((sum, item) => sum + ((item.product.cost || 0) * item.quantity), 0),
          totalProfit: cartTotal - cartItems.reduce((sum, item) => sum + ((item.product.cost || 0) * item.quantity), 0)
        }
      }

      console.log('🛒 CLIENT PORTAL: Creating order transaction:', {
        orderId,
        amount: cartTotal,
        clientName,
        itemCount: cartItems.length,
        paymentMethod: formData.paymentMethod,
        transaction: orderTransaction
      })

      // Make the transaction creation function available globally for testing
      if (typeof window !== 'undefined') {
        (window as any).testCreateTransaction = () => {
          console.log('🧪 TEST: Creating test transaction...')
          const testTransaction = addTransaction(orderTransaction)
          console.log('🧪 TEST: Transaction created:', testTransaction)
          return testTransaction
        }
      }

      // Add the main transaction
      let createdTransaction;
      try {
        createdTransaction = addTransaction(orderTransaction)

        console.log('✅ CLIENT PORTAL: Transaction created:', {
          transactionId: createdTransaction.id,
          amount: createdTransaction.amount,
          source: createdTransaction.source,
          status: createdTransaction.status
        })
      } catch (error) {
        console.error('❌ CLIENT PORTAL: Failed to create transaction:', error)
        throw new Error('Failed to create transaction for order')
      }

      // Create order from transaction (this will trigger notifications)
      let createdOrder;
      try {
        createdOrder = createOrderFromTransaction(createdTransaction)

        console.log('📦 CLIENT PORTAL: Order created from transaction:', {
          orderId: createdOrder?.id,
          transactionId: createdTransaction.id,
          orderStatus: createdOrder?.status,
          orderClientId: createdOrder?.clientId,
          orderClientName: createdOrder?.clientName
        })

        // Verify order was created correctly
        if (createdOrder) {
          console.log('✅ CLIENT PORTAL: Order creation successful:', {
            orderExists: !!createdOrder,
            orderClientIdMatches: createdOrder.clientId === clientId,
            orderData: {
              id: createdOrder.id,
              clientId: createdOrder.clientId,
              clientName: createdOrder.clientName,
              total: createdOrder.total,
              itemCount: createdOrder.items.length
            }
          })
        } else {
          console.error('❌ CLIENT PORTAL: Order creation returned null')
        }
      } catch (error) {
        console.error('❌ CLIENT PORTAL: Failed to create order from transaction:', error)
        // Continue with order processing even if order creation fails
      }

      // Store order in localStorage for order history
      const existingOrders = JSON.parse(localStorage.getItem('client_orders') || '[]')
      existingOrders.push(orderData)
      localStorage.setItem('client_orders', JSON.stringify(existingOrders))

      console.log('✅ Order processed successfully:', {
        orderId,
        transaction: orderTransaction,
        inventoryUpdated: cartItems.length
      })

      // Clear cart after successful order
      clearCart()

      const orderMessage = formData.paymentMethod === 'cod'
        ? "Your order has been placed! You will pay when the order is delivered."
        : "Thank you for your purchase. You will receive a confirmation email shortly."

      toast({
        title: "Order placed successfully!",
        description: orderMessage,
      })

      // Redirect to success page
      window.location.href = "/client-portal/shop/order-success"
    } catch (error) {
      console.error('❌ Order processing failed:', error)

      // If the error is related to inventory adjustment, provide specific feedback
      const errorMessage = error instanceof Error ? error.message : "There was an error processing your order. Please try again."

      let title = formData.paymentMethod === 'cod' ? "Order failed" : "Payment failed"
      let description = errorMessage

      // Check if it's an inventory-related error
      if (errorMessage.includes('inventory') || errorMessage.includes('stock')) {
        title = "Inventory Error"
        description = "There was an issue updating inventory. Please check product availability and try again."
      }

      toast({
        title,
        description,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Show loading state while cart is initializing
  if (!isInitialized) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-medium">Loading checkout...</h1>
        </div>
      </div>
    )
  }

  // Show empty cart message if cart is initialized but empty
  if (isInitialized && cartItemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button asChild className="bg-pink-600 hover:bg-pink-700">
            <Link href="/client-portal/shop">
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" asChild>
          <Link href="/client-portal/shop/cart">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-gray-600">Complete your purchase</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pink-600 text-white text-sm flex items-center justify-center">1</div>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isLoggedIn && (
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pink-600 text-white text-sm flex items-center justify-center">2</div>
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pink-600 text-white text-sm flex items-center justify-center">3</div>
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                >
                  {checkoutSettings.paymentMethods.creditCard && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Credit/Debit Card
                      </Label>
                    </div>
                  )}

                  {checkoutSettings.paymentMethods.cod && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Cash on Delivery (COD)
                      </Label>
                    </div>
                  )}
                </RadioGroup>

                {formData.paymentMethod === 'cod' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start gap-3">
                        <Banknote className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium text-amber-800">Cash on Delivery</h4>
                          <p className="text-sm text-amber-700">
                            You will pay for this order when it is delivered to your address.
                            {checkoutSettings.orderProcessing.requirePhoneForCOD && " A phone number is required for delivery coordination."}
                          </p>
                          {checkoutSettings.orderProcessing.codConfirmationRequired && (
                            <p className="text-xs text-amber-600">
                              Note: COD orders require manual confirmation and may take longer to process.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.paymentMethod === 'card' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        value={formData.cardName}
                        onChange={(e) => handleInputChange('cardName', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.product.name}</span>
                        <span className="text-gray-500 ml-2">×{item.quantity}</span>
                      </div>
                      <span>
                        <CurrencyDisplay amount={(item.product.salePrice || item.product.price) * item.quantity} />
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span><CurrencyDisplay amount={cartSubtotal} /></span>
                  </div>

                  {appliedPromo && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedPromo.code})</span>
                      <span>
                        -{appliedPromo.type === 'percentage' ?
                          `${appliedPromo.discount}%` :
                          <CurrencyDisplay amount={appliedPromo.discount} />
                        }
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {cartShipping === 0 ? 'Free' : <CurrencyDisplay amount={cartShipping} />}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span><CurrencyDisplay amount={cartTax} /></span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span><CurrencyDisplay amount={cartTotal} /></span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-pink-600 hover:bg-pink-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Complete Order
                    </>
                  )}
                </Button>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    <span>Secure SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-3 w-3" />
                    <span>Free shipping on all orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3" />
                    <span>30-day return policy</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
