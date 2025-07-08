"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-provider"
import { useCurrency } from "@/lib/currency-provider"
import { useProducts } from "@/lib/product-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useToast } from "@/components/ui/use-toast"
import { Star, Eye, EyeOff, Upload, X, Plus, Image as ImageIcon, Trash2 } from "lucide-react"

interface ProductEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any | null
}

export function ProductEditDialog({ open, onOpenChange, product }: ProductEditDialogProps) {
  const { currentLocation } = useAuth()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const { updateProduct, deleteProduct, ensureShopIntegration } = useProducts()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    isActive: true,
    isFeatured: false,
    isNew: false,
    isBestSeller: false,
    isOnSale: false,
    retailPrice: "",
    salePrice: "",
    images: [] as string[],
  })

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
        isBestSeller: product.isBestSeller ?? false,
        isOnSale: product.isOnSale ?? false,
        retailPrice: product.price?.toString() || "",
        salePrice: product.salePrice?.toString() || "",
        images: product.images || [],
      })
      setImagePreview(product.images?.[0] || null)
      setImageUrl("")
    }
  }, [product])

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, WebP).",
      })
      // Reset the input
      event.target.value = ''
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
      })
      // Reset the input
      event.target.value = ''
      return
    }

    // Show loading state
    toast({
      title: "Uploading image...",
      description: "Please wait while we process your image.",
    })

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        setImagePreview(result)
        setFormData(prev => {
          const newImages = prev.images.length > 0 ? [result, ...prev.images.slice(1)] : [result]
          return {
            ...prev,
            images: newImages
          }
        })

        toast({
          title: "Image uploaded successfully",
          description: "Product image has been updated and will be saved when you update the product.",
        })
      }
    }
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to read the image file. Please try again.",
      })
    }
    reader.readAsDataURL(file)

    // Reset the input so the same file can be selected again if needed
    event.target.value = ''
  }

  // Handle image URL input
  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
  }

  // Add image from URL
  const addImageFromUrl = () => {
    const url = imageUrl.trim()
    if (!url) {
      toast({
        variant: "destructive",
        title: "Empty URL",
        description: "Please enter an image URL.",
      })
      return
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid image URL.",
      })
      return
    }

    // Check if URL looks like an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext))
    const isImageHost = url.includes('unsplash.com') || url.includes('images.') || url.includes('img.')

    if (!hasImageExtension && !isImageHost) {
      toast({
        variant: "destructive",
        title: "Invalid image URL",
        description: "URL doesn't appear to be an image. Please check the URL.",
      })
      return
    }

    // Test if image loads
    const img = new Image()
    img.onload = () => {
      setImagePreview(url)
      setFormData(prev => {
        const newImages = prev.images.length > 0 ? [url, ...prev.images.slice(1)] : [url]
        return {
          ...prev,
          images: newImages
        }
      })
      setImageUrl("")

      toast({
        title: "Image URL added successfully",
        description: "Product image has been updated from URL.",
      })
    }
    img.onerror = () => {
      toast({
        variant: "destructive",
        title: "Failed to load image",
        description: "The image URL is not accessible or invalid.",
      })
    }
    img.src = url
  }

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!product) return

    setIsDeleting(true)
    try {
      const success = await deleteProduct(product.id)
      if (success) {
        toast({
          title: "Product deleted successfully",
          description: `${product.name} has been removed from inventory and all sections.`,
        })
        onOpenChange(false)
        setShowDeleteConfirm(false)
      } else {
        toast({
          variant: "destructive",
          title: "Failed to delete product",
          description: "The product could not be deleted. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to delete product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting the product.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Remove image
  const handleRemoveImage = () => {
    setFormData(prev => {
      const newImages = prev.images.slice(1) // Remove first image
      // Update preview to show the next image if available, or fallback to product image
      setImagePreview(newImages.length > 0 ? newImages[0] : (product?.images?.[0] || null))
      return {
        ...prev,
        images: newImages
      }
    })

    toast({
      title: "Image removed",
      description: "The product image has been removed.",
    })
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      // Create a mock event to reuse the existing upload logic
      const mockEvent = {
        target: { files: [file], value: '' }
      } as React.ChangeEvent<HTMLInputElement>
      handleImageUpload(mockEvent)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Update the product using the product provider
      const updatedProduct = {
        ...product,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        isNew: formData.isNew,
        isBestSeller: formData.isBestSeller,
        isSale: formData.isOnSale,
        price: parseFloat(formData.retailPrice) || 0,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        images: formData.images,
        image: formData.images[0] || product.image, // Update main image
        updatedAt: new Date(),
      }

      await updateProduct(updatedProduct)

      // Ensure shop integration for retail products
      if (product.isRetail && updatedProduct.isActive) {
        console.log("🔄 Triggering shop integration for updated retail product...")
        ensureShopIntegration()
      }

      toast({
        title: "Product updated successfully",
        description: `${product.name} has been updated and changes are reflected across all sections.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update product. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product settings and e-commerce features for {product.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Product Info Display */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {product.images && product.images[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded border"
                  />
                )}
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  {product.rating && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {product.rating} ({product.reviewCount} reviews)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retailPrice">Retail Price</Label>
                <div className="relative">
                  <Input
                    id="retailPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.retailPrice}
                    onChange={(e) => handleChange("retailPrice", e.target.value)}
                    placeholder="0.00"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    {formData.retailPrice && <CurrencyDisplay amount={parseFloat(formData.retailPrice) || 0} />}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price (Optional)</Label>
                <div className="relative">
                  <Input
                    id="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => handleChange("salePrice", e.target.value)}
                    placeholder="0.00"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    {formData.salePrice && <CurrencyDisplay amount={parseFloat(formData.salePrice) || 0} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="space-y-4">
                {/* Image Preview */}
                {imagePreview ? (
                  <div className="relative w-full h-32 sm:h-48 border rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Product preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-32 sm:h-48 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No image selected</p>
                      <p className="text-xs text-gray-400">Upload an image to update the product image</p>
                    </div>
                  </div>
                )}

                {/* Upload Options */}
                <div className="grid grid-cols-1 gap-4">
                  {/* File Upload */}
                  <div>
                    <div
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                        isDragOver
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const fileInput = document.getElementById('product-edit-image-upload') as HTMLInputElement
                        if (fileInput) {
                          fileInput.click()
                        }
                      }}
                    >
                      <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDragOver ? 'text-blue-700' : 'text-gray-600'}`}>
                        {isDragOver ? 'Drop image here' : 'Upload New Image or Drag & Drop'}
                      </p>
                      <p className="text-xs text-gray-400">Max 5MB • JPG, PNG, GIF</p>
                    </div>
                    <input
                      id="product-edit-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      onClick={(e) => {
                        e.stopPropagation()
                        // Clear the value to allow selecting the same file again
                        e.currentTarget.value = ''
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="product-edit-image-url">Or enter image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="product-edit-image-url"
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => handleImageUrlChange(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" onClick={addImageFromUrl} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Status */}
            <div className="space-y-4">
              <h4 className="font-medium">Product Status & Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive" className="flex items-center gap-2">
                    {formData.isActive ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                    Visible in shop
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleChange("isFeatured", checked)}
                  />
                  <Label htmlFor="isFeatured">Featured product</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isNew"
                    checked={formData.isNew}
                    onCheckedChange={(checked) => handleChange("isNew", checked)}
                  />
                  <Label htmlFor="isNew">New product</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isBestSeller"
                    checked={formData.isBestSeller}
                    onCheckedChange={(checked) => handleChange("isBestSeller", checked)}
                  />
                  <Label htmlFor="isBestSeller">Best seller</Label>
                </div>
              </div>
            </div>

            {/* Current Features Preview */}
            <div className="space-y-2">
              <Label>Current Features</Label>
              <div className="flex flex-wrap gap-2">
                {formData.isFeatured && (
                  <Badge variant="default" className="text-xs">Featured</Badge>
                )}
                {formData.isNew && (
                  <Badge variant="secondary" className="text-xs">New</Badge>
                )}
                {formData.isBestSeller && (
                  <Badge variant="outline" className="text-xs">Best Seller</Badge>
                )}
                {formData.salePrice && parseFloat(formData.salePrice) > 0 && (
                  <Badge variant="destructive" className="text-xs">Sale</Badge>
                )}
                {!formData.isFeatured && !formData.isNew && !formData.isBestSeller && (!formData.salePrice || parseFloat(formData.salePrice) === 0) && (
                  <span className="text-sm text-gray-500">No special features</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </DialogFooter>

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-2">Delete Product</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete "{product?.name}"? This action cannot be undone and will remove the product from all sections including inventory and client shop.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteProduct}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Product"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
