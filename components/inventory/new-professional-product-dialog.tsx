"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useCurrency } from "@/lib/currency-provider"
import { useProducts, type Product } from "@/lib/product-provider"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { AlertTriangle, Save, CheckCircle, Loader2, MapPin, Package } from "lucide-react"

interface NewProfessionalProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null // Optional product for edit mode
  mode?: "add" | "edit" // Mode to determine dialog behavior
  currentLocation?: string // Current location context for stock display
  getProductStock?: (product: any) => number // Function to get location-specific stock
}

export function NewProfessionalProductDialog({
  open,
  onOpenChange,
  product,
  mode = "add",
  currentLocation: propCurrentLocation,
  getProductStock
}: NewProfessionalProductDialogProps) {
  const { currentLocation, user } = useAuth()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const { categories, productTypes, addProduct, updateProduct, products } = useProducts()
  const { locations } = useLocations()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isDuplicateCheck, setIsDuplicateCheck] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Helper function to get default location ID
  const getDefaultLocationId = useCallback(() => {
    if (currentLocation?.id) return currentLocation.id
    if (locations.length > 0) return locations[0].id
    // No hardcoded fallback - require valid location selection
    throw new Error("No valid location available. Please ensure locations are properly configured.")
  }, [currentLocation, locations])

  // Helper function to extract professional product data from features
  const extractProfessionalData = useCallback((product: Product) => {
    const features = product.features || []
    const howToUse = product.howToUse || []

    // Extract data from features array
    const usageInstructions = features.find(f => f.startsWith('Usage:'))?.replace('Usage: ', '') ||
                             (howToUse.length > 0 ? howToUse[0] : '')
    const safetyNotes = features.find(f => f.startsWith('Safety:'))?.replace('Safety: ', '') || ''
    const storageRequirements = features.find(f => f.startsWith('Storage:'))?.replace('Storage: ', '') || ''
    const expiryDate = features.find(f => f.startsWith('Expiry:'))?.replace('Expiry: ', '') || ''
    const requiresTraining = features.includes('Requires Training')
    const isHazardous = features.includes('Hazardous Material')

    // Extract location data - use actual location-specific stock if available
    let selectedLocations: string[] = []
    let locationStocks: Record<string, string> = {}

    if (product.locations && product.locations.length > 0) {
      // Use actual location data from the product
      selectedLocations = product.locations.map(loc => loc.locationId)
      locationStocks = product.locations.reduce((acc, loc) => {
        acc[loc.locationId] = loc.stock.toString()
        return acc
      }, {} as Record<string, string>)
    } else {
      // Fallback to default location with product's total stock
      const defaultLocationId = getDefaultLocationId()
      if (defaultLocationId) {
        selectedLocations = [defaultLocationId]
        const currentStock = product.stock || 0
        locationStocks = { [defaultLocationId]: currentStock.toString() }
      }
    }

    return {
      usageInstructions,
      safetyNotes,
      storageRequirements,
      expiryDate,
      requiresTraining,
      isHazardous,
      selectedLocations,
      locationStocks
    }
  }, [getDefaultLocationId])

  // Initialize form data based on mode
  const getInitialFormData = useCallback(() => {
    if (mode === "edit" && product) {
      const professionalData = extractProfessionalData(product)
      return {
        // Basic Information
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category: product.category || "",
        type: product.type || "",
        description: product.description || "",
        brand: product.brand || "",

        // Pricing
        costPrice: product.cost?.toString() || "",

        // Inventory & Location Management
        selectedLocations: professionalData.selectedLocations,
        locationStocks: professionalData.locationStocks,
        minStockLevel: product.minStock?.toString() || "5",
        maxStockLevel: "100", // Default as this isn't stored in current schema
        reorderPoint: "10", // Default as this isn't stored in current schema

        // Professional Use Specific
        usageInstructions: professionalData.usageInstructions,
        safetyNotes: professionalData.safetyNotes,
        storageRequirements: professionalData.storageRequirements,
        expiryDate: professionalData.expiryDate,

        // Status
        isActive: product.isActive ?? true,
        requiresTraining: professionalData.requiresTraining,
        isHazardous: professionalData.isHazardous,
      }
    } else {
      // Default form data for add mode
      const defaultLocationId = getDefaultLocationId()
      return {
        // Basic Information
        name: "",
        sku: "",
        barcode: "",
        category: "",
        type: "",
        description: "",
        brand: "",

        // Pricing
        costPrice: "",

        // Inventory & Location Management
        selectedLocations: defaultLocationId ? [defaultLocationId] : [],
        locationStocks: defaultLocationId ? { [defaultLocationId]: "10" } : {} as Record<string, string>,
        minStockLevel: "5",
        maxStockLevel: "100",
        reorderPoint: "10",

        // Professional Use Specific
        usageInstructions: "",
        safetyNotes: "",
        storageRequirements: "",
        expiryDate: "",

        // Status
        isActive: true,
        requiresTraining: false,
        isHazardous: false,
      }
    }
  }, [mode, product, extractProfessionalData, getDefaultLocationId])

  const [formData, setFormData] = useState(getInitialFormData())

  // Effect to reinitialize form when product or mode changes
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData())
      setValidationErrors([])
      setAutoSaveStatus('idle')
    }
  }, [open, product, mode, getInitialFormData])

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }

    // Auto-save draft every 3 seconds
    if (autoSaveStatus !== 'saving') {
      setAutoSaveStatus('saving')
      setTimeout(() => {
        saveDraft()
      }, 3000)
    }
  }

  // Enhanced validation function
  const validateForm = useCallback((): string[] => {
    const errors: string[] = []

    // Required fields
    if (!formData.name.trim()) errors.push("Product name is required")
    if (!formData.category) errors.push("Category is required")
    if (formData.selectedLocations.length === 0) errors.push("At least one location must be selected")

    // SKU/Barcode duplicate check (exclude current product in edit mode)
    if (formData.sku && products.some(p => p.sku === formData.sku && p.id !== product?.id)) {
      errors.push("SKU already exists in the system")
    }
    if (formData.barcode && products.some(p => p.barcode === formData.barcode && p.id !== product?.id)) {
      errors.push("Barcode already exists in the system")
    }

    // Pricing validation
    if (formData.costPrice && parseFloat(formData.costPrice) < 0) {
      errors.push("Cost price cannot be negative")
    }

    // Stock validation
    const minStock = parseInt(formData.minStockLevel)
    const maxStock = parseInt(formData.maxStockLevel)
    const reorderPoint = parseInt(formData.reorderPoint)

    if (minStock < 0) errors.push("Minimum stock level cannot be negative")
    if (maxStock < minStock) errors.push("Maximum stock level must be greater than minimum")
    if (reorderPoint < minStock) errors.push("Reorder point should be at least the minimum stock level")

    // Location stock validation
    for (const locationId of formData.selectedLocations) {
      const stock = parseInt(formData.locationStocks[locationId] || "0")
      if (stock < 0) {
        const locationName = locations.find(l => l.id === locationId)?.name || locationId
        errors.push(`Stock for ${locationName} cannot be negative`)
      }
    }

    // Professional use specific validation
    if (formData.isHazardous && !formData.safetyNotes.trim()) {
      errors.push("Safety notes are required for hazardous products")
    }

    // Expiry date validation
    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate)
      const today = new Date()
      if (expiryDate <= today) {
        errors.push("Expiry date must be in the future")
      }
    }

    return errors
  }, [formData, products, locations])

  // Duplicate checking function
  const checkForDuplicates = useCallback(async () => {
    if (!formData.sku && !formData.barcode) return

    setIsDuplicateCheck(true)
    try {
      // Simulate API call for duplicate checking
      await new Promise(resolve => setTimeout(resolve, 500))

      const errors = validateForm()
      const duplicateErrors = errors.filter(error =>
        error.includes("already exists")
      )

      if (duplicateErrors.length > 0) {
        setValidationErrors(duplicateErrors)
      }
    } finally {
      setIsDuplicateCheck(false)
    }
  }, [formData.sku, formData.barcode, validateForm])

  // Auto-save draft functionality
  const saveDraft = useCallback(() => {
    try {
      const draftKey = `professional_product_draft_${user?.id || 'anonymous'}`
      localStorage.setItem(draftKey, JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString()
      }))
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save draft:', error)
      setAutoSaveStatus('error')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    }
  }, [formData, user?.id])

  // Set default location when locations are loaded (only for add mode)
  useEffect(() => {
    if (mode === "add" && locations.length > 0 && formData.selectedLocations.length === 0) {
      const defaultLocationId = getDefaultLocationId()
      if (defaultLocationId) {
        setFormData(prev => ({
          ...prev,
          selectedLocations: [defaultLocationId]
        }))
      }
    }
  }, [mode, locations, formData.selectedLocations.length, getDefaultLocationId])

  // Load draft on component mount (only for add mode, not edit mode)
  useEffect(() => {
    if (open && mode === "add") {
      const draftKey = `professional_product_draft_${user?.id || 'anonymous'}`
      const savedDraft = localStorage.getItem(draftKey)

      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          const draftAge = new Date().getTime() - new Date(draft.timestamp).getTime()

          // Only load draft if it's less than 24 hours old
          if (draftAge < 24 * 60 * 60 * 1000) {
            setFormData(draft)
            toast({
              title: "Draft loaded",
              description: "Your previous work has been restored.",
            })
          }
        } catch (error) {
          console.error('Failed to load draft:', error)
        }
      }
    }
  }, [open, mode, user?.id, toast])

  // Trigger duplicate check when SKU or barcode changes
  useEffect(() => {
    if (formData.sku || formData.barcode) {
      const timeoutId = setTimeout(checkForDuplicates, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [formData.sku, formData.barcode, checkForDuplicates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Comprehensive validation
      const errors = validateForm()
      if (errors.length > 0) {
        setValidationErrors(errors)
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: `Please fix the following issues: ${errors.slice(0, 2).join(', ')}${errors.length > 2 ? '...' : ''}`,
        })
        return
      }

      // Prepare location-specific data
      const locationData = formData.selectedLocations.map(locationId => ({
        locationId,
        stock: parseInt(formData.locationStocks[locationId] || "0"),
        price: null // Professional products don't have location-specific pricing
      }))



      // Calculate total stock from location stocks
      const totalStock = Object.values(formData.locationStocks).reduce((sum, stock) => sum + parseInt(stock || "0"), 0)

      // Create enhanced product data with professional-specific fields
      const productData = {
        name: formData.name,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        category: formData.category,
        type: formData.type || formData.category,
        description: formData.description || null,
        brand: formData.brand || null,
        price: 0, // Professional products don't have retail price
        salePrice: null,
        cost: formData.costPrice ? parseFloat(formData.costPrice) : 0,
        stock: totalStock, // Set total stock from location stocks
        minStock: parseInt(formData.minStockLevel),
        isRetail: false, // Professional products are not retail
        isActive: formData.isActive,
        isFeatured: false,
        isNew: false,
        isBestSeller: false,
        isSale: false,
        image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        images: [],
        features: [
          ...(formData.usageInstructions ? [`Usage: ${formData.usageInstructions}`] : []),
          ...(formData.safetyNotes ? [`Safety: ${formData.safetyNotes}`] : []),
          ...(formData.storageRequirements ? [`Storage: ${formData.storageRequirements}`] : []),
          ...(formData.expiryDate ? [`Expiry: ${formData.expiryDate}`] : []),
          ...(formData.requiresTraining ? ["Requires Training"] : []),
          ...(formData.isHazardous ? ["Hazardous Material"] : []),
        ],
        ingredients: [],
        howToUse: formData.usageInstructions ? [formData.usageInstructions] : [],
        locations: locationData,
        // Professional-specific metadata
        metadata: {
          minStockLevel: parseInt(formData.minStockLevel),
          maxStockLevel: parseInt(formData.maxStockLevel),
          reorderPoint: parseInt(formData.reorderPoint),
          expiryDate: formData.expiryDate || null,
          requiresTraining: formData.requiresTraining,
          isHazardous: formData.isHazardous,
          createdBy: user?.id,
          createdAt: new Date().toISOString(),
        }
      }

      if (mode === "edit" && product) {
        // Update existing product
        const updatedProduct = {
          ...product,
          ...productData,
          id: product.id, // Preserve the original ID
          createdAt: product.createdAt, // Preserve original creation date
          updatedAt: new Date(), // Update the modification date
        }

        console.log("Updating professional product with data:", updatedProduct)
        await updateProduct(updatedProduct)

        toast({
          title: "Professional product updated successfully",
          description: `${formData.name} has been updated across ${formData.selectedLocations.length} location(s).`,
        })
      } else {
        // Create new product
        console.log("Creating professional product with data:", productData)
        await addProduct(productData)

        toast({
          title: "Professional product created successfully",
          description: `${formData.name} has been added to your professional inventory across ${formData.selectedLocations.length} location(s).`,
        })
      }

      // Clear draft after successful operation
      const draftKey = `professional_product_draft_${user?.id || 'anonymous'}`
      localStorage.removeItem(draftKey)

      onOpenChange(false)
      if (mode === "add") {
        resetForm()
      }
    } catch (error) {
      console.error(`Failed to ${mode} professional product:`, error)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      const operation = mode === "edit" ? "update" : "create"

      toast({
        variant: "destructive",
        title: `Error ${operation === "update" ? "Updating" : "Creating"} Product`,
        description: `Failed to ${operation} professional product: ${errorMessage}. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    const defaultLocationId = getDefaultLocationId()
    setFormData({
      name: "",
      sku: "",
      barcode: "",
      category: "",
      type: "",
      description: "",
      brand: "",
      costPrice: "",
      selectedLocations: defaultLocationId ? [defaultLocationId] : [],
      locationStocks: {},
      minStockLevel: "5",
      maxStockLevel: "100",
      reorderPoint: "10",
      usageInstructions: "",
      safetyNotes: "",
      storageRequirements: "",
      expiryDate: "",
      isActive: true,
      requiresTraining: false,
      isHazardous: false,
    })
    setValidationErrors([])
    setAutoSaveStatus('idle')

    // Clear draft
    const draftKey = `professional_product_draft_${user?.id || 'anonymous'}`
    localStorage.removeItem(draftKey)
  }

  // Handle location selection changes
  const handleLocationChange = (locationId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        selectedLocations: [...prev.selectedLocations, locationId],
        locationStocks: {
          ...prev.locationStocks,
          [locationId]: mode === "add" ? "10" : "0" // Default to 10 for new products, 0 for edits
        }
      }))
    } else {
      setFormData(prev => {
        const newLocationStocks = { ...prev.locationStocks }
        delete newLocationStocks[locationId]

        return {
          ...prev,
          selectedLocations: prev.selectedLocations.filter(id => id !== locationId),
          locationStocks: newLocationStocks
        }
      })
    }
  }

  // Handle location-specific stock changes
  const handleLocationStockChange = (locationId: string, stock: string) => {
    setFormData(prev => ({
      ...prev,
      locationStocks: {
        ...prev.locationStocks,
        [locationId]: stock
      }
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {mode === "edit" ? "Edit Professional Product" : "Add Professional Product"}
                </DialogTitle>
                <DialogDescription>
                  {mode === "edit"
                    ? "Update the professional product details. These products will not appear in the client shop."
                    : "Create a new product for professional salon use. These products will not appear in the client shop."
                  }
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving draft...
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Draft saved
                  </div>
                )}
                {isDuplicateCheck && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking duplicates...
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Please fix the following issues:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-4 w-4" />
                <h3 className="font-medium">Basic Information</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  placeholder="Enter product name"
                  className={validationErrors.some(e => e.includes("name")) ? "border-red-500" : ""}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    placeholder="Product SKU (optional)"
                    className={validationErrors.some(e => e.includes("SKU")) ? "border-red-500" : ""}
                  />
                  {isDuplicateCheck && formData.sku && (
                    <div className="text-xs text-blue-600">Checking for duplicates...</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleChange("barcode", e.target.value)}
                    placeholder="Product barcode (optional)"
                    className={validationErrors.some(e => e.includes("Barcode")) ? "border-red-500" : ""}
                  />
                  {isDuplicateCheck && formData.barcode && (
                    <div className="text-xs text-blue-600">Checking for duplicates...</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleChange("brand", e.target.value)}
                    placeholder="Product brand (optional)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                    <SelectTrigger id="category" className={validationErrors.some(e => e.includes("Category")) ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter(cat => cat.isActive)
                        // Additional deduplication by name to prevent duplicate values
                        .filter((category, index, array) =>
                          array.findIndex(c => c.name === category.name) === index
                        )
                        .map((category, index) => {
                          // Create a stable unique key using multiple identifiers
                          const safeId = (category.id || 'no-id').toString().replace(/[^a-zA-Z0-9]/g, '_')
                          const safeName = category.name.replace(/[^a-zA-Z0-9]/g, '_')
                          const uniqueKey = `cat_${safeId}_${safeName}_${index}`
                          return (
                            <SelectItem key={uniqueKey} value={category.name}>
                              {category.name}
                            </SelectItem>
                          )
                        })}
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
                      {productTypes
                        .filter(type => type.isActive)
                        // Additional deduplication by name to prevent duplicate values
                        .filter((type, index, array) =>
                          array.findIndex(t => t.name === type.name) === index
                        )
                        .map((type, index) => {
                          // Create a stable unique key using multiple identifiers
                          const safeId = (type.id || 'no-id').toString().replace(/[^a-zA-Z0-9]/g, '_')
                          const safeName = type.name.replace(/[^a-zA-Z0-9]/g, '_')
                          const uniqueKey = `type_${safeId}_${safeName}_${index}`
                          return (
                            <SelectItem key={uniqueKey} value={type.name}>
                              {type.name}
                            </SelectItem>
                          )
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  placeholder="Product description (optional)"
                />
              </div>
            </div>

            <Separator />

            {/* Location & Stock Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4" />
                <h3 className="font-medium">Location & Stock Management</h3>
              </div>

              <div className="space-y-3">
                <Label>Available Locations *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {locations.map((location) => (
                    <div key={location.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`location-${location.id}`}
                          checked={formData.selectedLocations.includes(location.id)}
                          onChange={(e) => handleLocationChange(location.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`location-${location.id}`} className="text-sm font-normal">
                          {location.name}
                        </Label>
                      </div>
                      {formData.selectedLocations.includes(location.id) && (
                        <div className="ml-6">
                          <Label htmlFor={`stock-${location.id}`} className="text-xs text-muted-foreground">
                            Initial Stock
                          </Label>
                          <Input
                            id={`stock-${location.id}`}
                            type="number"
                            min="0"
                            value={formData.locationStocks[location.id] || "0"}
                            onChange={(e) => handleLocationStockChange(location.id, e.target.value)}
                            className="h-8 text-sm"
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {validationErrors.some(e => e.includes("location")) && (
                  <div className="text-sm text-red-600">At least one location must be selected</div>
                )}
              </div>

              {/* Current Stock Display (Edit Mode Only) */}
              {mode === "edit" && product && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-blue-900">Current Stock Level</h4>
                      <p className="text-sm text-blue-700">
                        {propCurrentLocation === "all" || !propCurrentLocation
                          ? "Total stock across all locations"
                          : `Stock for current location filter`}
                      </p>
                      {propCurrentLocation && propCurrentLocation !== "all" && (
                        <p className="text-xs text-blue-600 mt-1">
                          Showing location-specific stock to match table view
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {getProductStock ? getProductStock(product) : (product.stock || 0)}
                      </div>
                      <div className="text-sm text-blue-600">units</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-600">
                      {propCurrentLocation === "all" || !propCurrentLocation
                        ? `Total across all locations: ${product.stock || 0} units`
                        : `Location-specific stock displayed above`}
                    </div>
                    <div className="text-sm text-blue-600">
                      Adjust stock levels in the location-specific fields below
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">Min Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => handleChange("minStockLevel", e.target.value)}
                    className={validationErrors.some(e => e.includes("Minimum stock")) ? "border-red-500" : ""}
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
                    className={validationErrors.some(e => e.includes("Maximum stock")) ? "border-red-500" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    min="0"
                    value={formData.reorderPoint}
                    onChange={(e) => handleChange("reorderPoint", e.target.value)}
                    className={validationErrors.some(e => e.includes("Reorder point")) ? "border-red-500" : ""}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Save className="h-4 w-4" />
                <h3 className="font-medium">Pricing & Expiry</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => handleChange("costPrice", e.target.value)}
                    placeholder="0.00"
                    className={validationErrors.some(e => e.includes("Cost price")) ? "border-red-500" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleChange("expiryDate", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={validationErrors.some(e => e.includes("Expiry date")) ? "border-red-500" : ""}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Professional Use Specific */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="font-medium">Professional Use Details</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="usageInstructions">Usage Instructions</Label>
                  <Textarea
                    id="usageInstructions"
                    value={formData.usageInstructions}
                    onChange={(e) => handleChange("usageInstructions", e.target.value)}
                    rows={2}
                    placeholder="How to use this product professionally..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="safetyNotes">Safety Notes</Label>
                  <Textarea
                    id="safetyNotes"
                    value={formData.safetyNotes}
                    onChange={(e) => handleChange("safetyNotes", e.target.value)}
                    rows={2}
                    placeholder="Important safety information..."
                    className={validationErrors.some(e => e.includes("Safety notes")) ? "border-red-500" : ""}
                  />
                  {formData.isHazardous && !formData.safetyNotes.trim() && (
                    <div className="text-sm text-red-600">Safety notes are required for hazardous products</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storageRequirements">Storage Requirements</Label>
                  <Textarea
                    id="storageRequirements"
                    value={formData.storageRequirements}
                    onChange={(e) => handleChange("storageRequirements", e.target.value)}
                    rows={2}
                    placeholder="Special storage conditions..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requiresTraining"
                      checked={formData.requiresTraining}
                      onCheckedChange={(checked) => handleChange("requiresTraining", checked)}
                    />
                    <Label htmlFor="requiresTraining">Requires Training</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isHazardous"
                      checked={formData.isHazardous}
                      onCheckedChange={(checked) => handleChange("isHazardous", checked)}
                    />
                    <Label htmlFor="isHazardous">Hazardous Material</Label>
                  </div>
                </div>

                {(formData.requiresTraining || formData.isHazardous) && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {formData.requiresTraining && formData.isHazardous
                        ? "This product requires training and is classified as hazardous. Ensure proper safety protocols are followed."
                        : formData.requiresTraining
                        ? "This product requires training before use. Ensure staff are properly trained."
                        : "This product is classified as hazardous. Ensure proper safety protocols are followed."
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <Separator />

            {/* Status & Activation */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4" />
                <h3 className="font-medium">Status</h3>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="text-base font-medium">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    When active, this product will be available for professional use across selected locations.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange("isActive", checked)}
                />
              </div>

              {/* Summary */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>• Product will be {mode === "edit" ? "updated" : "created"} for professional use only</div>
                  <div>• Available in {formData.selectedLocations.length} location(s)</div>
                  <div>• Total stock: {Object.values(formData.locationStocks).reduce((sum, stock) => sum + parseInt(stock || "0"), 0)} units</div>
                  {mode === "edit" && propCurrentLocation && propCurrentLocation !== "all" && (
                    <div>• Current location filter: Stock levels shown for filtered location</div>
                  )}
                  {formData.requiresTraining && <div>• ⚠️ Requires staff training</div>}
                  {formData.isHazardous && <div>• ⚠️ Hazardous material - safety protocols required</div>}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {autoSaveStatus === 'saved' && (
                <>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Draft auto-saved
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || validationErrors.length > 0}
                className="min-w-[200px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "edit" ? "Updating Product..." : "Creating Product..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {mode === "edit" ? "Update Product" : "Create Professional Product"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
