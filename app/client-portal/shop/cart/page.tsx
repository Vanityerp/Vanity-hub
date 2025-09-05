"use client"

import React, { useState } from 'react'
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  Heart,
  Tag,
  X
} from "lucide-react"
import { useCart } from "@/lib/cart-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"

export default function CartPage() {
  const { toast } = useToast()
  const {
    cartItems,
    cartItemCount,
    cartSubtotal,
    cartTax,
    cartShipping,
    cartTotal,
    appliedPromo,
    updateCartItemQuantity,
    removeFromCart,
    moveToWishlist,
    applyPromoCode,
    removePromoCode,
    clearCart
  } = useCart()

  const [promoCode, setPromoCode] = useState("")
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
    } else {
      updateCartItemQuantity(productId, newQuantity)
    }
  }

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return

    setIsApplyingPromo(true)

    // Simulate API call delay
    setTimeout(() => {
      const success = applyPromoCode(promoCode.trim())
      if (success) {
        setPromoCode("")
      }
      setIsApplyingPromo(false)
    }, 1000)
  }

  const handleRemovePromo = () => {
    removePromoCode()
  }

  const handleCheckout = () => {
    // Navigate to checkout page
    window.location.href = "/client-portal/shop/checkout"
  }

  // Error boundary component for images
  const ProductImage = ({ product }: { product: any }) => {
    const [imageError, setImageError] = useState(false)

    return (
      <Image
        src={imageError ? "/placeholder.jpg" : product.image}
        alt={product.name}
        width={80}
        height={80}
        className="object-cover rounded-md"
        onError={() => setImageError(true)}
      />
    )
  }

  if (cartItemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Order completed</h1>
          <p className="text-gray-600 mb-8">
            Come back again.
          </p>
          <Button asChild className="bg-pink-600 hover:bg-pink-700">
            <Link href="/client-portal/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
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
          <Link href="/client-portal/shop">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-gray-600">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <ProductImage product={item.product} />

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link
                          href={`/client-portal/shop/${item.product.id}`}
                          className="font-medium hover:text-pink-600 transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.product.category} • {item.product.type}
                        </p>
                      </div>
                      <div className="text-right">
                        {item.product.isSale && item.product.salePrice ? (
                          <div>
                            <span className="font-bold">
                              <CurrencyDisplay amount={item.product.salePrice} />
                            </span>
                            <div className="text-sm text-gray-500 line-through">
                              <CurrencyDisplay amount={item.product.price} />
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold">
                            <CurrencyDisplay amount={item.product.price} />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <span className="text-sm text-gray-500">
                          Stock: {item.product.stock}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveToWishlist(item.product.id)}
                          className="text-gray-500 hover:text-pink-600"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 text-right">
                      <span className="font-bold">
                        Subtotal: <CurrencyDisplay amount={(item.product.salePrice || item.product.price) * item.quantity} />
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Clear Cart Button */}
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Promo Code */}
              <div>
                <Label htmlFor="promo-code" className="text-sm font-medium">
                  Promo Code
                </Label>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md mt-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {appliedPromo.code}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePromo}
                      className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="promo-code"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={!promoCode.trim() || isApplyingPromo}
                    >
                      {isApplyingPromo ? "..." : "Apply"}
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
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
                className="w-full bg-pink-600 hover:bg-pink-700"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Secure checkout powered by Stripe
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
