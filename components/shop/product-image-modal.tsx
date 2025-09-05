"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ImageIcon,
  ShoppingBag,
  Heart
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Product } from "@/lib/products-data"

interface ProductImageModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
  isInCart?: (productId: string) => boolean
  isInWishlist?: (productId: string) => boolean
  getCartItem?: (productId: string) => { quantity: number } | undefined
}

export function ProductImageModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onAddToWishlist,
  isInCart,
  isInWishlist,
  getCartItem
}: ProductImageModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Get all available images for the product
  const images = product?.images && product.images.length > 0
    ? product.images
    : product?.image
    ? [product.image]
    : []

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0)
      setImageLoading(true)
      setImageError(false)
    }
  }, [product])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || !product) return

      switch (event.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          event.preventDefault()
          navigateToPrevious()
          break
        case "ArrowRight":
          event.preventDefault()
          navigateToNext()
          break
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, product])

  const navigateToNext = useCallback(() => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
      setImageLoading(true)
      setImageError(false)
    }
  }, [images.length])

  const navigateToPrevious = useCallback(() => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
      setImageLoading(true)
      setImageError(false)
    }
  }, [images.length])

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleAddToCart = () => {
    if (product && onAddToCart) {
      onAddToCart(product)
    }
  }

  const handleAddToWishlist = () => {
    if (product && onAddToWishlist) {
      onAddToWishlist(product)
    }
  }

  if (!product) return null

  const currentImage = images[currentImageIndex]
  const hasMultipleImages = images.length > 1
  const productInCart = isInCart?.(product.id)
  const productInWishlist = isInWishlist?.(product.id)
  const cartItem = getCartItem?.(product.id)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden bg-white animate-in fade-in-0 zoom-in-95 duration-300"
        aria-describedby="product-image-modal-description"
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">
          {product.name} - Product Image Gallery
        </DialogTitle>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Image Section */}
          <div
            className="relative flex-1 bg-gray-50 flex items-center justify-center cursor-pointer"
            onClick={(e) => {
              // Close modal when clicking on background (but not on image or controls)
              if (e.target === e.currentTarget) {
                onClose()
              }
            }}
          >
            {/* Close Button */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white shadow-md"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md transition-all duration-200 hover:scale-110"
                  onClick={navigateToPrevious}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-md transition-all duration-200 hover:scale-110"
                  onClick={navigateToNext}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Main Image */}
            <div
              className="relative w-full h-full max-w-3xl max-h-full cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {imageLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-600 mb-2" />
                  <p className="text-sm text-gray-600">Loading image...</p>
                </div>
              )}

              {imageError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                  <ImageIcon className="h-16 w-16 mb-4 text-gray-300" />
                  <p className="text-sm font-medium">Image not available</p>
                  <p className="text-xs text-gray-400 mt-1">Please try again later</p>
                </div>
              ) : (
                <Image
                  src={currentImage}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className={cn(
                    "object-contain transition-opacity duration-300",
                    imageLoading ? "opacity-0" : "opacity-100"
                  )}
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  priority
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </div>

            {/* Image Counter */}
            {hasMultipleImages && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}

            {/* Product Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && (
                <Badge className="bg-pink-600">New</Badge>
              )}
              {product.isBestSeller && (
                <Badge className="bg-amber-500">Best Seller</Badge>
              )}
              {product.isSale && (
                <Badge className="bg-red-500">Sale</Badge>
              )}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="w-full lg:w-96 p-6 flex flex-col justify-between bg-white">
            <div>
              <h2 className="text-2xl font-bold mb-2">{product.name}</h2>

              {/* Price */}
              <div className="mb-4">
                {product.salePrice ? (
                  <div className="flex items-center gap-2">
                    <CurrencyDisplay amount={product.salePrice} className="text-2xl font-bold text-pink-600" />
                    <CurrencyDisplay amount={product.price} className="text-lg text-gray-500 line-through" />
                  </div>
                ) : (
                  <CurrencyDisplay amount={product.price} className="text-2xl font-bold text-pink-600" />
                )}
              </div>

              {/* Category and Type */}
              <div className="mb-4 space-y-2">
                {product.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Category:</span>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                )}
                {product.type && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Type:</span>
                    <Badge variant="outline">{product.type}</Badge>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <p className="text-sm text-green-600">✓ In stock ({product.stock} available)</p>
                ) : (
                  <p className="text-sm text-red-600">✗ Out of stock</p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Add to Cart */}
              {productInCart ? (
                <div className="flex items-center gap-2">
                  <Button
                    className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    variant="outline"
                    disabled
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    In Cart ({cartItem?.quantity || 0})
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    +
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-pink-600 hover:bg-pink-700"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
              )}

              {/* Add to Wishlist */}
              {onAddToWishlist && (
                <Button
                  variant="outline"
                  className={cn(
                    "w-full",
                    productInWishlist
                      ? "bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                      : "hover:bg-pink-50"
                  )}
                  onClick={handleAddToWishlist}
                >
                  <Heart className={cn("h-4 w-4 mr-2", productInWishlist && "fill-current")} />
                  {productInWishlist ? "In Wishlist" : "Add to Wishlist"}
                </Button>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {hasMultipleImages && (
              <div className="mt-6 pt-4 border-t">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      className={cn(
                        "relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all",
                        currentImageIndex === index
                          ? "border-pink-600 ring-2 ring-pink-200"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => {
                        setCurrentImageIndex(index)
                        setImageLoading(true)
                        setImageError(false)
                      }}
                      aria-label={`View image ${index + 1}`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Screen reader description */}
        <div id="product-image-modal-description" className="sr-only">
          Product image modal for {product.name}. Use arrow keys to navigate between images, or press Escape to close.
        </div>
      </DialogContent>
    </Dialog>
  )
}
