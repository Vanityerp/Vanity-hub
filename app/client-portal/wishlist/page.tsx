"use client"

import React, { useState } from 'react'
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowLeft,
  Star
} from "lucide-react"
import { useCart } from "@/lib/cart-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"

export default function WishlistPage() {
  const { toast } = useToast()
  const {
    wishlistItems,
    wishlistItemCount,
    removeFromWishlist,
    moveToCart,
    addToCart,
    isInCart,
    getCartItem
  } = useCart()

  // Error boundary component for images
  const ProductImage = ({ product }: { product: any }) => {
    const [imageError, setImageError] = useState(false)

    return (
      <Image
        src={imageError ? "/placeholder.jpg" : product.image}
        alt={product.name}
        width={200}
        height={200}
        className="object-cover rounded-md w-full h-48"
        onError={() => setImageError(true)}
      />
    )
  }

  if (wishlistItemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
          <p className="text-gray-600 mb-8">
            Save items you love for later by clicking the heart icon on any product.
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
          <h1 className="text-2xl font-bold">My Wishlist</h1>
          <p className="text-gray-600">{wishlistItemCount} {wishlistItemCount === 1 ? 'item' : 'items'} saved for later</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((item) => (
          <Card key={item.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="relative">
                <ProductImage product={item.product} />
                
                {/* Sale badge */}
                {item.product.isSale && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                    Sale
                  </div>
                )}

                {/* Remove from wishlist button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromWishlist(item.product.id)}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 hover:text-red-600 p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4">
                <div className="mb-2">
                  <Link 
                    href={`/client-portal/shop/${item.product.id}`}
                    className="font-medium hover:text-pink-600 transition-colors line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.product.category} • {item.product.type}
                  </p>
                </div>

                {/* Rating */}
                {item.product.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(item.product.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({item.product.rating})
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-3">
                  {item.product.isSale && item.product.salePrice ? (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">
                        <CurrencyDisplay amount={item.product.salePrice} />
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        <CurrencyDisplay amount={item.product.price} />
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-lg">
                      <CurrencyDisplay amount={item.product.price} />
                    </span>
                  )}
                </div>

                {/* Stock status */}
                <div className="mb-3">
                  {item.product.stock > 0 ? (
                    <span className="text-sm text-green-600">
                      ✓ In Stock ({item.product.stock} available)
                    </span>
                  ) : (
                    <span className="text-sm text-red-600">
                      ✗ Out of Stock
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  {isInCart(item.product.id) ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-green-50 border-green-200 text-green-700"
                        disabled
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        In Cart ({getCartItem(item.product.id)?.quantity || 0})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToCart(item.product, 1)}
                        disabled={item.product.stock <= 0}
                        className="px-3"
                      >
                        +
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-pink-600 hover:bg-pink-700"
                      onClick={() => moveToCart(item.product.id)}
                      disabled={item.product.stock <= 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      {item.product.stock <= 0 ? "Out of Stock" : "Move to Cart"}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => removeFromWishlist(item.product.id)}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    Remove from Wishlist
                  </Button>
                </div>

                {/* Added date */}
                <p className="text-xs text-gray-400 mt-3">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => {
            wishlistItems.forEach(item => {
              if (item.product.stock > 0 && !isInCart(item.product.id)) {
                moveToCart(item.product.id)
              }
            })
          }}
          className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Move All Available to Cart
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            wishlistItems.forEach(item => removeFromWishlist(item.product.id))
          }}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Wishlist
        </Button>
      </div>
    </div>
  )
}
