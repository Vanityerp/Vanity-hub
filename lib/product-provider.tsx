"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { useToast } from "@/components/ui/use-toast"
import { ProductTransfer } from "./products-data"

// Product Location interface
export interface ProductLocation {
  id: string
  productId: string
  locationId: string
  stock: number
  price?: number
  isActive: boolean
  location?: {
    id: string
    name: string
  }
}

// Product interface for database-driven products
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  salePrice?: number
  cost?: number
  category: string
  type?: string
  brand?: string
  image?: string
  images?: string[]
  stock: number
  minStock?: number
  isNew?: boolean
  isBestSeller?: boolean
  isSale?: boolean
  isOnSale?: boolean
  features?: string[]
  ingredients?: string[]
  howToUse?: string[]
  relatedProducts?: string[]
  rating?: number
  reviewCount?: number
  sku?: string
  barcode?: string
  location?: string
  isRetail?: boolean
  isActive?: boolean
  isFeatured?: boolean
  createdAt?: Date
  updatedAt?: Date
  locations?: ProductLocation[]
}

// Product Category interface
export interface ProductCategory {
  id: string
  name: string
  description?: string
  isActive: boolean
  productCount: number
  createdAt: Date
  updatedAt: Date
}

// Product Type interface
export interface ProductType {
  id: string
  name: string
  description?: string
  category?: string // Category name for API compatibility
  categoryId?: string
  productCount?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Context interface with full functionality
interface ProductContextType {
  // Products
  products: Product[]
  getProductById: (id: string) => Product | undefined
  getProductsByCategory: (category: string) => Product[]
  getRetailProducts: () => Product[]
  addProduct: (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<Product>
  updateProduct: (updatedProduct: Product) => void
  deleteProduct: (productId: string) => Promise<boolean>
  refreshProducts: () => Promise<void>
  refreshAllData: () => Promise<void>
  isLoading: boolean
  error: string | null

  // Categories
  categories: ProductCategory[]
  getCategoryById: (id: string) => ProductCategory | undefined
  getCategoryName: (id: string) => string
  addCategory: (categoryData: Omit<ProductCategory, "id" | "createdAt" | "updatedAt">) => Promise<ProductCategory>
  updateCategory: (updatedCategory: ProductCategory) => void
  deleteCategory: (categoryId: string) => Promise<boolean>
  refreshCategories: () => void

  // Product Types
  productTypes: ProductType[]
  getProductTypeById: (id: string) => ProductType | undefined
  getProductTypeName: (id: string) => string
  getProductTypesByCategory: (categoryId: string) => ProductType[]
  addProductType: (typeData: Omit<ProductType, "id" | "createdAt" | "updatedAt">) => Promise<ProductType>
  updateProductType: (updatedType: ProductType) => void
  deleteProductType: (typeId: string) => Promise<boolean>
  refreshProductTypes: () => void

  // Transfers
  transfers: ProductTransfer[]
  getTransferById: (id: string) => ProductTransfer | undefined
  getTransfersByProduct: (productId: string) => ProductTransfer[]
  createTransfer: (transferData: Omit<ProductTransfer, "id" | "createdAt">) => Promise<ProductTransfer>
  updateTransfer: (updatedTransfer: ProductTransfer) => void
  completeTransfer: (transferId: string) => Promise<boolean>
  cancelTransfer: (transferId: string) => boolean
  refreshTransfers: () => void

  // Shop Integration
  ensureShopIntegration: (triggerUpdate?: boolean) => Product[]
  refreshShop: () => void
}

// Default categories
const defaultCategories: ProductCategory[] = [
  { id: "1", name: "Skincare", description: "Skincare products", isActive: true, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "Makeup", description: "Makeup products", isActive: true, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: "3", name: "Hair Care", description: "Hair care products", isActive: true, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: "4", name: "Nail Care", description: "Nail care products", isActive: true, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: "5", name: "Tools", description: "Beauty tools", isActive: true, productCount: 0, createdAt: new Date(), updatedAt: new Date() },
]

// Default product types
const defaultProductTypes: ProductType[] = [
  { id: "1", name: "Cleanser", categoryId: "1", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "2", name: "Moisturizer", categoryId: "1", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "3", name: "Foundation", categoryId: "2", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "4", name: "Lipstick", categoryId: "2", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "5", name: "Shampoo", categoryId: "3", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "6", name: "Conditioner", categoryId: "3", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "7", name: "Nail Polish", categoryId: "4", isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: "8", name: "Brush", categoryId: "5", isActive: true, createdAt: new Date(), updatedAt: new Date() },
]

// Create context with default values
const ProductContext = createContext<ProductContextType>({
  products: [],
  getProductById: () => undefined,
  getProductsByCategory: () => [],
  getRetailProducts: () => [],
  addProduct: async () => ({} as Product),
  updateProduct: () => {},
  deleteProduct: async () => false,
  refreshProducts: async () => {},
  refreshAllData: async () => {},
  isLoading: false,
  error: null,

  categories: [],
  getCategoryById: () => undefined,
  getCategoryName: () => "Uncategorized",
  addCategory: async () => ({} as ProductCategory),
  updateCategory: () => {},
  deleteCategory: async () => false,
  refreshCategories: () => {},

  productTypes: [],
  getProductTypeById: () => undefined,
  getProductTypeName: () => "Other",
  getProductTypesByCategory: () => [],
  addProductType: async () => ({} as ProductType),
  updateProductType: () => {},
  deleteProductType: async () => false,
  refreshProductTypes: () => {},

  transfers: [],
  getTransferById: () => undefined,
  getTransfersByProduct: () => [],
  createTransfer: async () => ({} as ProductTransfer),
  updateTransfer: () => {},
  completeTransfer: async () => false,
  cancelTransfer: () => false,
  refreshTransfers: () => {},

  ensureShopIntegration: () => [],
  refreshShop: () => {},
})

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>(defaultCategories)
  const [productTypes, setProductTypes] = useState<ProductType[]>(defaultProductTypes)
  const [transfers, setTransfers] = useState<ProductTransfer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch products from database API
  const fetchProducts = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Fetching products from database API...')
      // Add cache busting to ensure fresh data
      const timestamp = Date.now()
      const response = await fetch(`/api/products?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }) // Fetch ALL products, not just retail

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ Fetched ${data.products?.length || 0} products from database`)

      // Debug: Log first product's stock levels and validate data integrity
      if (data.products && data.products.length > 0) {
        const firstProduct = data.products[0]
        console.log(`📊 Sample product "${firstProduct.name}" stock levels:`,
          firstProduct.locations?.map((loc: any) => `${loc.locationId}: ${loc.stock}`).join(', '))

        // Validate stock data integrity
        const totalProducts = data.products.length
        const productsWithLocations = data.products.filter((p: any) => p.locations && p.locations.length > 0).length
        const totalStockEntries = data.products.reduce((sum: any, p: any) => sum + (p.locations?.length || 0), 0)

        console.log(`📈 Stock data summary: ${totalProducts} products, ${productsWithLocations} with location data, ${totalStockEntries} total stock entries`)

        // Check for any negative stock values
        const negativeStockEntries = data.products.flatMap((p: any) =>
          (p.locations || []).filter((loc: any) => loc.stock < 0)
        )
        if (negativeStockEntries.length > 0) {
          console.warn(`⚠️ Found ${negativeStockEntries.length} negative stock entries:`, negativeStockEntries)
        }
      }

      setProducts(data.products || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products'
      console.error('❌ Error fetching products:', err)
      setError(errorMessage)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch categories from database API
  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Fetching categories from database API...')
      const response = await fetch('/api/products/categories')

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ Fetched ${data.categories?.length || 0} categories from database`)

      // Deduplicate categories by ID to prevent React key conflicts
      const uniqueCategories = data.categories ?
        data.categories.filter((category: any, index: number, array: any[]) =>
          array.findIndex(c => c.id === category.id) === index
        ) : defaultCategories

      setCategories(uniqueCategories)
    } catch (err) {
      console.error('❌ Error fetching categories:', err)
      setCategories(defaultCategories)
    }
  }, [])

  // Fetch product types from database API
  const fetchProductTypes = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Fetching product types from database API...')
      const response = await fetch('/api/products/types')

      if (!response.ok) {
        throw new Error(`Failed to fetch product types: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ Fetched ${data.types?.length || 0} product types from database`)

      // Deduplicate product types by ID to prevent React key conflicts
      const uniqueTypes = data.types ?
        data.types.filter((type: any, index: number, array: any[]) =>
          array.findIndex(t => t.id === type.id) === index
        ) : defaultProductTypes

      setProductTypes(uniqueTypes)
    } catch (err) {
      console.error('❌ Error fetching product types:', err)
      setProductTypes(defaultProductTypes)
    }
  }, [])

  // Initialize data on mount
  useEffect(() => {
    console.log('🚀 ProductProvider: Initializing data on mount...')
    fetchProducts()
    fetchCategories()
    fetchProductTypes()
    fetchTransfers()
  }, [fetchProducts, fetchCategories, fetchProductTypes])

  // Auto-refresh products every 5 minutes to ensure data consistency (reduced frequency)
  // TEMPORARILY DISABLED FOR DEBUGGING
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     console.log('🔄 Auto-refreshing products for data consistency...')
  //     fetchProducts()
  //   }, 300000) // 5 minutes instead of 30 seconds

  //   return () => clearInterval(interval)
  // }, [fetchProducts])

  // Refresh products when window regains focus to ensure fresh data (with debounce)
  // TEMPORARILY DISABLED FOR DEBUGGING
  // useEffect(() => {
  //   let focusTimeout: NodeJS.Timeout

  //   const handleFocus = () => {
  //     // Clear any existing timeout
  //     if (focusTimeout) {
  //       clearTimeout(focusTimeout)
  //     }

  //     // Debounce the refresh to prevent rapid successive calls
  //     focusTimeout = setTimeout(() => {
  //       console.log('🔄 Window focused, refreshing products...')
  //       fetchProducts()
  //     }, 1000) // 1 second debounce
  //   }

  //   window.addEventListener('focus', handleFocus)
  //   return () => {
  //     window.removeEventListener('focus', handleFocus)
  //     if (focusTimeout) {
  //       clearTimeout(focusTimeout)
  //     }
  //   }
  // }, [fetchProducts])

  // Product methods
  const getProductById = useCallback((id: string) => {
    return products.find(product => product.id === id)
  }, [products])

  const getProductsByCategory = useCallback((category: string) => {
    return products.filter(product => product.category === category)
  }, [products])

  const getRetailProducts = useCallback(() => {
    return products.filter(product => product.isRetail && product.isActive)
  }, [products])

  const addProduct = useCallback(async (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    try {
      console.log('🔄 Creating product via API...')
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const data = await response.json()
      const newProduct = {
        ...data.product,
        createdAt: new Date(data.product.createdAt),
        updatedAt: new Date(data.product.updatedAt)
      }

      // Update local state
      setProducts(prev => [...prev, newProduct])

      toast({
        title: "Product added",
        description: `${newProduct.name} has been added to inventory.`,
      })

      return newProduct
    } catch (error) {
      console.error('❌ Error creating product:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product",
      })
      throw error
    }
  }, [toast])

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    try {
      console.log('🔄 Updating product via API...')
      const response = await fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      const data = await response.json()
      const product = {
        ...data.product,
        createdAt: new Date(data.product.createdAt),
        updatedAt: new Date(data.product.updatedAt)
      }

      // Update local state
      setProducts(prev => prev.map(p =>
        p.id === product.id ? product : p
      ))

      toast({
        title: "Product updated",
        description: `${product.name} has been updated.`,
      })

      return product
    } catch (error) {
      console.error('❌ Error updating product:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
      })
      throw error
    }
  }, [toast])

  const deleteProduct = useCallback(async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return false

    try {
      console.log('🔄 Deleting product via API:', productId)
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete product')
      }

      // Update local state
      setProducts(prev => prev.filter(p => p.id !== productId))

      toast({
        title: "Product deleted",
        description: `${product.name} has been removed from inventory.`,
      })

      return true
    } catch (error) {
      console.error('Failed to delete product:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product. Please try again.",
      })
      return false
    }
  }, [products, toast])

  // Category methods
  const getCategoryById = useCallback((id: string) => {
    return categories.find(category => category.id === id)
  }, [categories])

  const getCategoryName = useCallback((id: string) => {
    const category = categories.find(c => c.id === id || c.name === id)
    return category?.name || "Uncategorized"
  }, [categories])

  const addCategory = useCallback(async (categoryData: Omit<ProductCategory, "id" | "createdAt" | "updatedAt">) => {
    try {
      console.log('🔄 Creating category via API...')
      const response = await fetch('/api/products/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      const data = await response.json()
      const newCategory = {
        ...data.category,
        createdAt: new Date(data.category.createdAt),
        updatedAt: new Date(data.category.updatedAt)
      }

      setCategories(prev => [...prev, newCategory])

      toast({
        title: "Category added",
        description: `${newCategory.name} category has been created.`,
      })

      return newCategory
    } catch (error) {
      console.error('❌ Error creating category:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create category",
      })
      throw error
    }
  }, [toast])

  const updateCategory = useCallback((updatedCategory: ProductCategory) => {
    setCategories(prev => prev.map(category =>
      category.id === updatedCategory.id
        ? { ...updatedCategory, updatedAt: new Date() }
        : category
    ))

    toast({
      title: "Category updated",
      description: `${updatedCategory.name} category has been updated.`,
    })
  }, [toast])

  const deleteCategory = useCallback(async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return false

    try {
      console.log('🔄 Deleting category via API:', categoryId)
      const response = await fetch(`/api/products/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to delete category')
      }

      // Update local state
      setCategories(prev => prev.filter(c => c.id !== categoryId))

      toast({
        title: "Category deleted",
        description: `${category.name} category has been removed.`,
      })

      return true
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category. Please try again.",
      })
      return false
    }
  }, [categories, toast])

  const refreshCategories = useCallback(() => {
    fetchCategories()
  }, [fetchCategories])

  // Product Type methods
  const getProductTypeById = useCallback((id: string) => {
    return productTypes.find(type => type.id === id)
  }, [productTypes])

  const getProductTypeName = useCallback((id: string) => {
    const type = productTypes.find(t => t.id === id || t.name === id)
    return type?.name || "Other"
  }, [productTypes])

  const getProductTypesByCategory = useCallback((categoryId: string) => {
    return productTypes.filter(type => type.categoryId === categoryId && type.isActive)
  }, [productTypes])

  const addProductType = useCallback(async (typeData: Omit<ProductType, "id" | "createdAt" | "updatedAt">) => {
    try {
      console.log('🔄 Creating product type via API...')
      const response = await fetch('/api/products/types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(typeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product type')
      }

      const data = await response.json()
      const newType = {
        ...data.type,
        createdAt: new Date(data.type.createdAt),
        updatedAt: new Date(data.type.updatedAt)
      }

      setProductTypes(prev => [...prev, newType])

      toast({
        title: "Product type added",
        description: `${newType.name} type has been created.`,
      })

      return newType
    } catch (error) {
      console.error('❌ Error creating product type:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product type",
      })
      throw error
    }
  }, [toast])

  const updateProductType = useCallback((updatedType: ProductType) => {
    setProductTypes(prev => prev.map(type =>
      type.id === updatedType.id
        ? { ...updatedType, updatedAt: new Date() }
        : type
    ))

    toast({
      title: "Product type updated",
      description: `${updatedType.name} type has been updated.`,
    })
  }, [toast])

  const deleteProductType = useCallback(async (typeId: string) => {
    const type = productTypes.find(t => t.id === typeId)
    if (!type) return false

    try {
      console.log('🔄 Deleting product type via API:', typeId)
      const response = await fetch(`/api/products/types/${typeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to delete product type')
      }

      // Update local state
      setProductTypes(prev => prev.filter(t => t.id !== typeId))

      toast({
        title: "Product type deleted",
        description: `${type.name} type has been removed.`,
      })

      return true
    } catch (error) {
      console.error('Failed to delete product type:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product type. Please try again.",
      })
      return false
    }
  }, [productTypes, toast])

  const refreshProductTypes = useCallback(() => {
    fetchProductTypes()
  }, [fetchProductTypes])

  // Fetch transfers from database API
  const fetchTransfers = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 Fetching transfers from database API...')
      const response = await fetch('/api/inventory/transfer')
      if (!response.ok) {
        console.warn(`⚠️ Transfer API returned ${response.status}: ${response.statusText}`)
        // Don't throw error, just set empty transfers array
        setTransfers([])
        return
      }
      const data = await response.json()
      console.log('📦 Raw transfer data from API:', data)

      // Convert API response to ProductTransfer format
      const fetchedTransfers: ProductTransfer[] = (data.transfers || []).map((transfer: any) => ({
        id: transfer.id,
        productId: transfer.productId,
        productName: transfer.productName,
        fromLocationId: transfer.fromLocation?.id || transfer.fromLocationId,
        toLocationId: transfer.toLocation?.id || transfer.toLocationId,
        quantity: transfer.quantity,
        status: transfer.status as 'pending' | 'completed' | 'cancelled',
        notes: transfer.notes || '',
        createdBy: transfer.createdBy,
        createdAt: new Date(transfer.createdAt),
        completedAt: transfer.completedAt ? new Date(transfer.completedAt) : undefined
      }))

      setTransfers(fetchedTransfers)
      console.log(`✅ Fetched ${fetchedTransfers.length} transfers from database`)
    } catch (error) {
      console.error('❌ Error fetching transfers:', error)
      // Don't set error state for transfers, just log and continue with empty array
      console.warn('⚠️ Continuing with empty transfers array due to fetch error')
      setTransfers([])
    }
  }, [])

  const refreshTransfers = useCallback(() => {
    fetchTransfers()
  }, [fetchTransfers])

  // Transfer methods
  const getTransferById = useCallback((id: string) => {
    return transfers.find(transfer => transfer.id === id)
  }, [transfers])

  const getTransfersByProduct = useCallback((productId: string) => {
    return transfers.filter(transfer => transfer.productId === productId)
  }, [transfers])

  const createTransfer = useCallback(async (transferData: Omit<ProductTransfer, "id" | "createdAt">) => {
    const newTransfer: ProductTransfer = {
      id: uuidv4(),
      ...transferData,
      createdAt: new Date(),
      status: 'pending'
    }

    // Add transfer to state immediately for optimistic UI update
    setTransfers(prev => [...prev, newTransfer])

    try {
      // Use the new atomic transfer endpoint
      const transferResponse = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: transferData.productId,
          fromLocationId: transferData.fromLocationId,
          toLocationId: transferData.toLocationId,
          quantity: transferData.quantity,
          reason: transferData.notes || `Transfer of ${transferData.productName}`,
          notes: transferData.notes,
          performedBy: transferData.createdBy || 'user'
        }),
      })

      if (!transferResponse.ok) {
        const errorData = await transferResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || 'Failed to complete transfer'
        throw new Error(errorMessage)
      }

      const transferResult = await transferResponse.json()

      // Update transfer status to completed with actual transfer ID from server
      const completedTransfer = {
        ...newTransfer,
        id: transferResult.transfer.transferId || newTransfer.id,
        status: 'completed' as const,
        completedAt: new Date()
      }

      setTransfers(prev => prev.map(transfer =>
        transfer.id === newTransfer.id ? completedTransfer : transfer
      ))

      // Refresh products and transfers to show updated data immediately
      console.log('🔄 Transfer completed, refreshing products and transfers...')
      await Promise.allSettled([fetchProducts(), fetchTransfers()])

      toast({
        title: "Transfer completed",
        description: transferResult.message || `${transferData.quantity} units of ${transferData.productName} have been transferred successfully.`,
      })

      return completedTransfer

    } catch (error) {
      console.error('Failed to complete transfer:', error)

      // Remove the failed transfer from state
      setTransfers(prev => prev.filter(transfer => transfer.id !== newTransfer.id))

      // Provide more specific error messages
      let errorMessage = "Failed to complete the transfer. Please try again."

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error instanceof Error && error.message.includes('Insufficient stock')) {
        errorMessage = "Insufficient stock at the source location for this transfer."
      } else if (error instanceof Error && error.message.includes('not found')) {
        errorMessage = "Product or location not found. Please refresh and try again."
      } else if (error instanceof Error && error.message.includes('inactive')) {
        errorMessage = "Cannot transfer inactive products or to inactive locations."
      } else if (error instanceof Error && error.message.includes('cannot be the same')) {
        errorMessage = "Source and destination locations must be different."
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message
      }

      toast({
        variant: "destructive",
        title: "Transfer failed",
        description: errorMessage,
      })

      throw error // Re-throw to allow calling components to handle the error
    }
  }, [toast, fetchProducts])

  const updateTransfer = useCallback((updatedTransfer: ProductTransfer) => {
    setTransfers(prev => prev.map(transfer =>
      transfer.id === updatedTransfer.id ? updatedTransfer : transfer
    ))
  }, [])

  const completeTransfer = useCallback(async (transferId: string) => {
    const transfer = transfers.find(t => t.id === transferId)
    if (!transfer || transfer.status !== 'pending') return false

    // This function is now mainly for manually completing transfers that were created as pending
    // Most transfers are auto-completed in createTransfer
    const updatedTransfer = {
      ...transfer,
      status: 'completed' as const,
      completedAt: new Date()
    }

    updateTransfer(updatedTransfer)

    toast({
      title: "Transfer completed",
      description: `${transfer.quantity} units of ${transfer.productName} transferred successfully.`,
    })

    return true
  }, [transfers, updateTransfer, toast])

  const cancelTransfer = useCallback((transferId: string) => {
    const transfer = transfers.find(t => t.id === transferId)
    if (!transfer || transfer.status !== 'pending') return false

    const updatedTransfer = {
      ...transfer,
      status: 'cancelled' as const
    }

    updateTransfer(updatedTransfer)

    toast({
      title: "Transfer cancelled",
      description: `Transfer of ${transfer.productName} has been cancelled.`,
    })

    return true
  }, [transfers, updateTransfer, toast])

  // Data consistency methods
  const refreshAllData = useCallback(async () => {
    console.log("🔄 Refreshing all data for consistency...")
    setIsLoading(true)
    try {
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        fetchProducts(),
        fetchCategories(),
        fetchProductTypes(),
        fetchTransfers()
      ])
      
      // Log any failures but don't throw
      results.forEach((result, index) => {
        const operations = ['products', 'categories', 'productTypes', 'transfers']
        if (result.status === 'rejected') {
          console.warn(`⚠️ Failed to refresh ${operations[index]}:`, result.reason)
        }
      })
      
      console.log("✅ Data refresh completed (some operations may have failed)")
    } catch (error) {
      console.error("❌ Error refreshing data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchProducts, fetchCategories, fetchProductTypes, fetchTransfers])

  // Shop integration methods
  const ensureShopIntegration = useCallback((triggerUpdate = true) => {
    console.log("🔄 Ensuring shop integration...")
    const retailProducts = getRetailProducts()
    console.log("🛒 Current retail products for shop:", retailProducts.length)
    return retailProducts
  }, [getRetailProducts])

  const refreshShop = useCallback(() => {
    console.log("🔄 Refreshing shop...")
    fetchProducts()
  }, [fetchProducts])

  return (
    <ProductContext.Provider
      value={{
        products,
        getProductById,
        getProductsByCategory,
        getRetailProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        refreshProducts: fetchProducts,
        refreshAllData,
        isLoading,
        error,

        categories,
        getCategoryById,
        getCategoryName,
        addCategory,
        updateCategory,
        deleteCategory,
        refreshCategories,

        productTypes,
        getProductTypeById,
        getProductTypeName,
        getProductTypesByCategory,
        addProductType,
        updateProductType,
        deleteProductType,
        refreshProductTypes,

        transfers,
        getTransferById,
        getTransfersByProduct,
        createTransfer,
        updateTransfer,
        completeTransfer,
        cancelTransfer,
        refreshTransfers,

        ensureShopIntegration,
        refreshShop,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export const useProducts = () => {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}
