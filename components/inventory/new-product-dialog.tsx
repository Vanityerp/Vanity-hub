"use client"

import type React from "react"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-provider"
import { useCurrency } from "@/lib/currency-provider"
import { useProducts } from "@/lib/product-provider"
import { useLocations } from "@/lib/location-provider"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, Plus, Image as ImageIcon, Eye, EyeOff } from "lucide-react"

interface NewProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewProductDialog({ open, onOpenChange }: NewProductDialogProps) {
  const { currentLocation } = useAuth()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const { categories, productTypes, addProduct, ensureShopIntegration } = useProducts()
  const { locations, getLocationName } = useLocations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")



  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    sku: "",
    barcode: "",
    category: "",
    type: "",
    description: "",
    shortDescription: "",

    // Pricing
    isRetail: true,
    retailPrice: "",
    salePrice: "",
    costPrice: "",

    // Inventory
    initialStock: "0",
    minStockLevel: "0",
    maxStockLevel: "0",
    selectedLocation: currentLocation || "",

    // E-commerce Features
    images: [] as string[],
    features: [] as string[],
    ingredients: [] as string[],
    howToUse: [] as string[],
    tags: [] as string[],

    // Status & Visibility
    isActive: true,
    isFeatured: false,
    isNew: false,
    isBestSeller: false,
    isOnSale: false,

    // SEO
    metaTitle: "",
    metaDescription: "",
    urlSlug: "",
  })

  const [newFeature, setNewFeature] = useState("")
  const [newIngredient, setNewIngredient] = useState("")
  const [newHowToUse, setNewHowToUse] = useState("")
  const [newTag, setNewTag] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)

  // Use ref to preserve image state across re-renders
  const imageStateRef = useRef<{
    images: string[]
    lastUpdate: number
  }>({
    images: [],
    lastUpdate: 0
  })

  // Compute image preview from form data instead of separate state
  const imagePreview = formData.images.length > 0 ? formData.images[0] : null

  // Sync form data images with ref when they change
  useEffect(() => {
    if (formData.images.length !== imageStateRef.current.images.length ||
        formData.images.some((img, index) => img !== imageStateRef.current.images[index])) {
      imageStateRef.current = {
        images: [...formData.images],
        lastUpdate: Date.now()
      }
    }
  }, [formData.images])



  // Memoize filtered data to prevent unnecessary re-renders
  const activeCategories = useMemo(() =>
    categories.filter(cat => cat.isActive),
    [categories]
  )

  const activeProductTypes = useMemo(() =>
    productTypes.filter(type => type.isActive),
    [productTypes]
  )

  const activeLocations = useMemo(() =>
    locations.filter(location => location.status === 'Active'),
    [locations]
  )

  // Update selectedLocation when currentLocation changes
  useEffect(() => {
    if (currentLocation) {
      setFormData(prev => {
        // Only update if the current location is different and not empty
        if (prev.selectedLocation !== currentLocation) {
          return {
            ...prev,
            selectedLocation: currentLocation
          }
        }
        return prev
      })
    }
  }, [currentLocation])

  // Restore images from ref if they get lost due to re-renders
  useEffect(() => {
    if (open && imageStateRef.current.images.length > 0 && formData.images.length === 0) {
      setFormData(prev => ({
        ...prev,
        images: [...imageStateRef.current.images]
      }))
    }
  }, [open, formData.images.length])

  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const addToArray = useCallback((field: keyof typeof formData, value: string) => {
    if (value.trim()) {
      setFormData((prev) => {
        const currentArray = prev[field] as string[]
        const newValue = value.trim()

        // Prevent duplicate images
        if (field === 'images' && currentArray.includes(newValue)) {
          return prev
        }

        return {
          ...prev,
          [field]: [...currentArray, newValue]
        }
      })
    }
  }, [])

  const removeFromArray = useCallback((field: keyof typeof formData, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }))
  }, [])

  const addImage = () => {
    if (imageUrl.trim()) {
      // Validate URL format
      try {
        new URL(imageUrl.trim())
      } catch {
        toast({
          variant: "destructive",
          title: "Invalid URL",
          description: "Please enter a valid image URL.",
        })
        return
      }

      addToArray('images', imageUrl.trim())
      setImageUrl("")

      toast({
        title: "Image URL added successfully",
        description: "Your product image has been added from URL.",
      })
    }
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file.",
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

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          addToArray('images', result)

          toast({
            title: "Image uploaded successfully",
            description: "Your product image has been added.",
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
  }

  // Remove image
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.slice(1) // Remove first image
    }))

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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Auto-generate URL slug when name changes
  const handleNameChange = useCallback((value: string) => {
    setFormData(prev => {
      const updates: Partial<typeof prev> = { name: value }

      // Only auto-generate slug if it's empty
      if (!prev.urlSlug) {
        updates.urlSlug = generateSlug(value)
      }

      // Only auto-generate meta title if it's empty
      if (!prev.metaTitle) {
        updates.metaTitle = value
      }

      return { ...prev, ...updates }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.selectedLocation) {
        toast({
          variant: "destructive",
          title: "Location Required",
          description: "Please select a location for the initial stock.",
        })
        setIsSubmitting(false)
        return
      }
      // Create enhanced product data
      const productData = {
        ...formData,
        location: currentLocation,
        // Convert string prices to numbers
        retailPrice: formData.retailPrice ? parseFloat(formData.retailPrice) : 0,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
        initialStock: parseInt(formData.initialStock) || 0,
        minStockLevel: parseInt(formData.minStockLevel) || 0,
        maxStockLevel: parseInt(formData.maxStockLevel) || 0,
        // Add timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Create location data for the selected location
      const locationData = [{
        locationId: formData.selectedLocation,
        stock: productData.initialStock,
        price: formData.isRetail ? productData.retailPrice : null
      }]

      // Create the product using the product provider
      const newProduct = await addProduct({
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        type: formData.type,
        description: formData.description,
        price: productData.retailPrice,
        salePrice: productData.salePrice,
        cost: productData.costPrice,
        stock: productData.initialStock,
        minStock: productData.minStockLevel,
        isRetail: formData.isRetail,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        isNew: formData.isNew,
        isBestSeller: formData.isBestSeller,
        isSale: formData.isOnSale,
        image: formData.images[0] || "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: formData.images,
        features: formData.features,
        ingredients: formData.ingredients,
        howToUse: formData.howToUse,
        locations: locationData,
        location: currentLocation,
      })

      console.log("Product created:", newProduct)

      // Ensure shop integration for retail products
      if (formData.isRetail) {
        console.log("🔄 Triggering shop integration for retail product...")
        ensureShopIntegration()
      }

      toast({
        title: "Product created successfully",
        description: `${formData.name} has been added to inventory${formData.isRetail ? ' and will appear in the client shop' : ''}.`,
      })

      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Failed to create product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create product. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      sku: "",
      barcode: "",
      category: "",
      type: "",
      description: "",
      shortDescription: "",
      isRetail: true,
      retailPrice: "",
      salePrice: "",
      costPrice: "",
      initialStock: "0",
      minStockLevel: "0",
      maxStockLevel: "0",
      selectedLocation: currentLocation || "",
      images: [],
      features: [],
      ingredients: [],
      howToUse: [],
      tags: [],
      isActive: true,
      isFeatured: false,
      isNew: false,
      isBestSeller: false,
      isOnSale: false,
      metaTitle: "",
      metaDescription: "",
      urlSlug: "",
    })
    setNewFeature("")
    setNewIngredient("")
    setNewHowToUse("")
    setNewTag("")
    setImageUrl("")
    setActiveTab("basic")

    // Clear image state ref
    imageStateRef.current = {
      images: [],
      lastUpdate: Date.now()
    }
  }, [currentLocation])

  // Don't render the dialog content when closed to prevent unnecessary re-renders
  if (!open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" />
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product for your inventory. Retail products will automatically appear in the client shop.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="seo">SEO & Status</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    required
                    placeholder="e.g., SH-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCategories
                        .filter((category, index, array) =>
                          array.findIndex(c => c.name === category.name) === index
                        )
                        .map((category, index) => (
                          <SelectItem key={`category-${category.id}-${category.name}-${index}`} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Product Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProductTypes
                        .filter((type, index, array) =>
                          array.findIndex(t => t.name === type.name) === index
                        )
                        .map((type, index) => (
                          <SelectItem key={`type-${type.id}-${type.name}-${index}`} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                  placeholder="Product barcode (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleChange("shortDescription", e.target.value)}
                  rows={2}
                  placeholder="Brief product description for listings"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  placeholder="Detailed product description with benefits and features"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isRetail"
                  checked={formData.isRetail}
                  onCheckedChange={(checked) => handleChange("isRetail", checked)}
                />
                <Label htmlFor="isRetail">This is a retail product (will appear in client shop)</Label>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {formData.isRetail && (
                  <div className="space-y-2">
                    <Label htmlFor="retailPrice">Retail Price *</Label>
                    <div className="relative">
                      <Input
                        id="retailPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.retailPrice}
                        onChange={(e) => handleChange("retailPrice", e.target.value)}
                        required={formData.isRetail}
                        placeholder="0.00"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        {formData.retailPrice && <CurrencyDisplay amount={parseFloat(formData.retailPrice) || 0} />}
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price *</Label>
                  <div className="relative">
                    <Input
                      id="costPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => handleChange("costPrice", e.target.value)}
                      required
                      placeholder="0.00"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                      {formData.costPrice && <CurrencyDisplay amount={parseFloat(formData.costPrice) || 0} />}
                    </div>
                  </div>
                </div>
              </div>

              {formData.isRetail && (
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
                  <p className="text-sm text-gray-500">Leave empty if not on sale</p>
                </div>
              )}

              {/* Location Selection */}
              <div className="space-y-2">
                <Label htmlFor="selectedLocation">Initial Stock Location *</Label>
                <Select value={formData.selectedLocation} onValueChange={(value) => handleChange("selectedLocation", value)}>
                  <SelectTrigger id="selectedLocation">
                    <SelectValue placeholder="Select location for initial stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Choose where the initial stock will be assigned. Other locations will start with 0 stock.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialStock">Initial Stock *</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    min="0"
                    value={formData.initialStock}
                    onChange={(e) => handleChange("initialStock", e.target.value)}
                    required
                    placeholder="0"
                  />
                  {formData.selectedLocation && (
                    <p className="text-xs text-gray-500">
                      Will be assigned to {getLocationName(formData.selectedLocation)}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">Min Stock Level *</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => handleChange("minStockLevel", e.target.value)}
                    required
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxStockLevel">Max Stock Level</Label>
                  <Input
                    id="maxStockLevel"
                    type="number"
                    min="0"
                    value={formData.maxStockLevel}
                    onChange={(e) => handleChange("maxStockLevel", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {formData.isRetail && formData.retailPrice && formData.costPrice && (
                <Card className="p-4 bg-gray-50">
                  <div className="space-y-2">
                    <h4 className="font-medium">Profit Analysis</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Profit Margin:</span>
                        <span className="ml-2 font-medium">
                          {((parseFloat(formData.retailPrice) - parseFloat(formData.costPrice)) / parseFloat(formData.retailPrice) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Profit per Unit:</span>
                        <span className="ml-2 font-medium">
                          <CurrencyDisplay amount={parseFloat(formData.retailPrice) - parseFloat(formData.costPrice)} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Image Management */}
              <div className="space-y-2">
                <Label>Product Images</Label>
                <div className="space-y-4">
                  {/* Main Image Preview */}
                  {imagePreview ? (
                    <div className="relative w-full h-48 border rounded-lg overflow-hidden">
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
                    <div className="w-full h-48 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No image selected</p>
                        <p className="text-xs text-gray-400">Upload an image to preview it here</p>
                      </div>
                    </div>
                  )}

                  {/* Upload Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          const fileInput = document.getElementById('new-product-image-upload') as HTMLInputElement
                          if (fileInput) {
                            fileInput.click()
                          }
                        }}
                      >
                        <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                        <p className={`text-sm ${isDragOver ? 'text-blue-700' : 'text-gray-600'}`}>
                          {isDragOver ? 'Drop image here' : 'Upload Image or Drag & Drop'}
                        </p>
                        <p className="text-xs text-gray-400">Max 5MB • JPG, PNG, GIF</p>
                      </div>
                      <input
                        id="new-product-image-upload"
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
                      <Label htmlFor="new-product-image-url">Or enter image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="new-product-image-url"
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" onClick={addImage} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Images Grid */}
                  {formData.images.length > 1 && (
                    <div>
                      <Label className="text-sm text-gray-600">Additional Images</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {formData.images.slice(1).map((img, index) => (
                          <div key={index + 1} className="relative group">
                            <img src={img} alt={`Product ${index + 2}`} className="w-full h-16 object-cover rounded border" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                              onClick={() => removeFromArray('images', index + 1)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label>Product Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a product feature"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('features', newFeature)
                        setNewFeature("")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addToArray('features', newFeature)
                      setNewFeature("")
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeFromArray('features', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Ingredients */}
              <div className="space-y-2">
                <Label>Ingredients</Label>
                <div className="flex gap-2">
                  <Input
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    placeholder="Add an ingredient"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('ingredients', newIngredient)
                        setNewIngredient("")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addToArray('ingredients', newIngredient)
                      setNewIngredient("")
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {ingredient}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeFromArray('ingredients', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* How to Use */}
              <div className="space-y-2">
                <Label>How to Use</Label>
                <div className="flex gap-2">
                  <Input
                    value={newHowToUse}
                    onChange={(e) => setNewHowToUse(e.target.value)}
                    placeholder="Add usage instruction"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('howToUse', newHowToUse)
                        setNewHowToUse("")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addToArray('howToUse', newHowToUse)
                      setNewHowToUse("")
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.howToUse.length > 0 && (
                  <div className="space-y-1">
                    {formData.howToUse.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">{index + 1}.</span>
                        <span className="flex-1">{step}</span>
                        <X
                          className="h-3 w-3 cursor-pointer text-gray-400 hover:text-red-500"
                          onClick={() => removeFromArray('howToUse', index)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addToArray('tags', newTag)
                        setNewTag("")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addToArray('tags', newTag)
                      setNewTag("")
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="default" className="flex items-center gap-1">
                        #{tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeFromArray('tags', index)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 mt-4">
              {/* Product Status */}
              <div className="space-y-4">
                <h4 className="font-medium">Product Status</h4>
                <div className="grid grid-cols-2 gap-4">
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

              {/* SEO Settings */}
              <div className="space-y-4">
                <h4 className="font-medium">SEO Settings</h4>
                <div className="space-y-2">
                  <Label htmlFor="urlSlug">URL Slug</Label>
                  <Input
                    id="urlSlug"
                    value={formData.urlSlug}
                    onChange={(e) => handleChange("urlSlug", e.target.value)}
                    placeholder="product-url-slug"
                  />
                  <p className="text-sm text-gray-500">Used in the product URL</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => handleChange("metaTitle", e.target.value)}
                    placeholder="SEO title for search engines"
                    maxLength={60}
                  />
                  <p className="text-sm text-gray-500">{formData.metaTitle.length}/60 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleChange("metaDescription", e.target.value)}
                    placeholder="SEO description for search engines"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-sm text-gray-500">{formData.metaDescription.length}/160 characters</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

