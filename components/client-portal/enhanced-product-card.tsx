"use client"

import React, { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EnhancedImage } from "@/components/ui/enhanced-image"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Eye, 
  Flame, 
  Sparkles, 
  Tag,
  Crown,
  TrendingUp
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  description?: string
  price: number
  salePrice?: number
  category: string
  type?: string
  image?: string
  images?: string[]
  rating?: number
  reviewCount?: number
  isNew?: boolean
  isBestSeller?: boolean
  isSale?: boolean
  isFeatured?: boolean
  stock?: number
}

interface EnhancedProductCardProps {
  product: Product
  showAddToCart?: boolean
  showFavoriteButton?: boolean
  showQuickView?: boolean
  compact?: boolean
  className?: string
  onAddToCart?: (product: Product) => void
  onFavorite?: (product: Product) => void
  onQuickView?: (product: Product) => void
}

const badgeConfig = {
  featured: { icon: Crown, color: "bg-gradient-to-r from-purple-500 to-pink-500", text: "Featured" },
  new: { icon: Sparkles, color: "bg-gradient-to-r from-green-500 to-emerald-500", text: "New" },
  bestseller: { icon: Flame, color: "bg-gradient-to-r from-orange-500 to-red-500", text: "Bestseller" },
  sale: { icon: Tag, color: "bg-gradient-to-r from-red-500 to-pink-500", text: "Sale" },
  trending: { icon: TrendingUp, color: "bg-gradient-to-r from-blue-500 to-indigo-500", text: "Trending" }
}

export function EnhancedProductCard({
  product,
  showAddToCart = true,
  showFavoriteButton = true,
  showQuickView = true,
  compact = false,
  className,
  onAddToCart,
  onFavorite,
  onQuickView
}: EnhancedProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const images = product.images && product.images.length > 0 ? product.images : [product.image].filter(Boolean)
  const currentImage = images[currentImageIndex] || product.image

  const handleFavorite = () => {
    setIsFavorited(!isFavorited)
    onFavorite?.(product)
  }

  const handleAddToCart = () => {
    onAddToCart?.(product)
  }

  const handleQuickView = () => {
    onQuickView?.(product)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-3 h-3",
          i < Math.floor(rating) 
            ? "fill-amber-400 text-amber-400" 
            : "fill-gray-200 text-gray-200"
        )}
      />
    ))
  }

  const getBadges = () => {
    const badges = []
    if (product.isFeatured) badges.push({ type: 'featured', ...badgeConfig.featured })
    if (product.isNew) badges.push({ type: 'new', ...badgeConfig.new })
    if (product.isBestSeller) badges.push({ type: 'bestseller', ...badgeConfig.bestseller })
    if (product.isSale || (product.salePrice && product.salePrice < product.price)) {
      badges.push({ type: 'sale', ...badgeConfig.sale })
    }
    return badges
  }

  const badges = getBadges()
  const hasDiscount = product.salePrice && product.salePrice < product.price
  const discountPercentage = hasDiscount 
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0

  if (compact) {
    return (
      <Card className={cn("group hover:shadow-md transition-all duration-300", className)}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Product Image */}
            <div className="relative flex-shrink-0">
              <EnhancedImage
                src={currentImage}
                alt={product.name}
                className="w-16 h-16 rounded-lg"
                aspectRatio="square"
                showZoom={false}
              />
              {badges.length > 0 && (
                <Badge className={cn(
                  "absolute -top-1 -right-1 text-xs px-1 py-0 text-white border-0",
                  badges[0].color
                )}>
                  {React.createElement(badges[0].icon, { className: "w-2 h-2" })}
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{product.name}</h4>
              <p className="text-xs text-gray-500">{product.category}</p>
              
              {/* Price */}
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-sm">
                  <CurrencyDisplay amount={product.salePrice || product.price} />
                </span>
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    <CurrencyDisplay amount={product.price} />
                  </span>
                )}
              </div>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex">
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1">
              {showFavoriteButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleFavorite}
                >
                  <Heart className={cn(
                    "h-3 w-3",
                    isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"
                  )} />
                </Button>
              )}
              {showAddToCart && (
                <Button size="sm" onClick={handleAddToCart}>
                  <ShoppingCart className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("group hover:shadow-lg transition-all duration-300 overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden">
          <EnhancedImage
            src={currentImage}
            alt={product.name}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
            aspectRatio="square"
            showZoom={true}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {badges.slice(0, 2).map((badge, index) => {
              const BadgeIcon = badge.icon
              return (
                <Badge
                  key={badge.type}
                  className={cn(
                    "text-white border-0 px-2 py-1 text-xs font-medium",
                    badge.color
                  )}
                >
                  <BadgeIcon className="w-3 h-3 mr-1" />
                  {badge.text}
                </Badge>
              )
            })}
            {hasDiscount && (
              <Badge className="bg-red-500 text-white border-0 px-2 py-1 text-xs font-bold">
                -{discountPercentage}%
              </Badge>
            )}
          </div>

          {/* Action buttons overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {showFavoriteButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                onClick={handleFavorite}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
                )} />
              </Button>
            )}
            {showQuickView && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white text-gray-700 shadow-sm"
                onClick={handleQuickView}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Image indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    index === currentImageIndex 
                      ? "bg-white scale-110" 
                      : "bg-white/60 hover:bg-white/80"
                  )}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}

          {/* Stock indicator */}
          {product.stock !== undefined && product.stock < 5 && product.stock > 0 && (
            <Badge className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs">
              Only {product.stock} left
            </Badge>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge className="bg-red-500 text-white">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          {/* Category and Name */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{product.category}</p>
            <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-pink-600 transition-colors">
              <Link href={`/client-portal/shop/${product.id}`}>
                {product.name}
              </Link>
            </h3>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          )}

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {renderStars(product.rating)}
              </div>
              <span className="text-sm text-gray-600">{product.rating}</span>
              {product.reviewCount && (
                <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                <CurrencyDisplay amount={product.salePrice || product.price} />
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through">
                  <CurrencyDisplay amount={product.price} />
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Footer with Add to Cart */}
      {showAddToCart && (
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full" 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
