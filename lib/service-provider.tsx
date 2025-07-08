"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { Service, ServiceCategory } from "@/lib/service-storage"
import { useAuth } from "@/lib/auth-provider"

interface ServiceContextType {
  services: Service[]
  filteredServices: Service[]
  categories: ServiceCategory[]
  loading: boolean
  error: string | null
  getServiceById: (id: string) => Service | undefined
  getCategoryById: (id: string) => ServiceCategory | undefined
  getCategoryName: (id: string) => string
  refreshServices: () => Promise<void>
  refreshCategories: () => Promise<void>
  refreshData: () => Promise<void>
  addService: (service: Omit<Service, "id">) => Promise<Service>
  updateService: (service: Service) => Promise<void>
  deleteService: (serviceId: string) => Promise<void>
  addCategory: (category: Omit<ServiceCategory, "id">) => Promise<ServiceCategory>
  updateCategory: (category: ServiceCategory) => Promise<void>
  deleteCategory: (categoryId: string) => Promise<void>
}

const ServiceContext = createContext<ServiceContextType>({
  services: [],
  filteredServices: [],
  categories: [],
  loading: false,
  error: null,
  getServiceById: () => undefined,
  getCategoryById: () => undefined,
  getCategoryName: () => "Uncategorized",
  refreshServices: async () => {},
  refreshCategories: async () => {},
  refreshData: async () => {},
  addService: async () => ({ id: "", name: "", category: "", price: 0, duration: 0, locations: [] }),
  updateService: async () => {},
  deleteService: async () => {},
  addCategory: async () => ({ id: "", name: "", description: "", serviceCount: 0 }),
  updateCategory: async () => {},
  deleteCategory: async () => {}
})

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Load services from database
  const loadServices = useCallback(async () => {
    try {
      console.log("🔄 Loading services from database...")

      // Check if we're in the client portal by looking at the current path
      const isClientPortal = typeof window !== 'undefined' && window.location.pathname.includes('/client-portal')
      const url = isClientPortal ? "/api/services?clientPortal=true" : "/api/services"

      console.log(`🌐 Loading services for ${isClientPortal ? 'client portal' : 'admin dashboard'}`)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("✅ Loaded services from database:", data.services?.length || 0)

      setServices(data.services || [])
      return data.services || []
    } catch (err) {
      console.error("❌ Error loading services:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load services"
      setError(errorMessage)
      throw err
    }
  }, [])

  // Load categories from database
  const loadCategories = useCallback(async () => {
    try {
      console.log("🔄 Loading categories from database...")
      const response = await fetch("/api/service-categories")

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("✅ Loaded categories from database:", data.categories?.length || 0)

      setCategories(data.categories || [])
      return data.categories || []
    } catch (err) {
      console.error("❌ Error loading categories:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load categories"
      setError(errorMessage)
      throw err
    }
  }, [])

  // Load both services and categories
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      await Promise.all([
        loadServices(),
        loadCategories()
      ])
    } catch (err) {
      // Error is already set in individual load functions
    } finally {
      setLoading(false)
    }
  }, [loadServices, loadCategories])

  // Load data on initial render
  useEffect(() => {
    loadData()
  }, [loadData])

  // Refresh services from database
  const refreshServices = useCallback(async () => {
    await loadServices()
  }, [loadServices])

  // Refresh categories from database
  const refreshCategories = useCallback(async () => {
    await loadCategories()
  }, [loadCategories])

  // Refresh all data from database
  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  // Get a service by ID
  const getServiceById = useCallback((id: string) => {
    if (!Array.isArray(services)) {
      return undefined;
    }
    return services.find(service => service.id === id)
  }, [services])

  // Get a category by ID
  const getCategoryById = useCallback((id: string) => {
    if (!Array.isArray(categories)) {
      return undefined;
    }
    return categories.find(category => category.id === id)
  }, [categories])

  // Get a category name by ID
  const getCategoryName = useCallback((id: string) => {
    if (!Array.isArray(categories)) {
      return "Uncategorized";
    }
    const category = categories.find(category => category.id === id)
    return category ? category.name : "Uncategorized"
  }, [categories])

  // Add a new service
  const addService = useCallback(async (serviceData: Omit<Service, "id">): Promise<Service> => {
    try {
      console.log("🔄 Adding new service:", serviceData)

      // Validate service data
      if (!serviceData.name) {
        throw new Error("Service name is required")
      }

      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create service: ${response.statusText}`)
      }

      const data = await response.json()
      const newService = data.service

      console.log("✅ Service created successfully:", newService.name)

      // Update local state
      setServices(prev => [...prev, newService])

      // Refresh categories to update service counts
      await loadCategories()

      return newService
    } catch (error) {
      console.error("❌ Error adding service:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to add service"
      setError(errorMessage)
      throw error
    }
  }, [loadCategories])

  // Update an existing service
  const updateService = useCallback(async (updatedService: Service): Promise<void> => {
    try {
      console.log("🔄 Updating service:", updatedService.id, updatedService.name)

      if (!updatedService || !updatedService.id) {
        throw new Error("Invalid service data")
      }

      const response = await fetch(`/api/services/${updatedService.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedService),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update service: ${response.statusText}`)
      }

      const data = await response.json()
      const updated = data.service

      console.log("✅ Service updated successfully:", updated.name)

      // Update local state
      setServices(prev => prev.map(service =>
        service.id === updated.id ? updated : service
      ))

      // Refresh categories to update service counts
      await loadCategories()
    } catch (error) {
      console.error("❌ Error updating service:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update service"
      setError(errorMessage)
      throw error
    }
  }, [loadCategories])

  // Delete a service
  const deleteService = useCallback(async (serviceId: string): Promise<void> => {
    try {
      console.log("🔄 Deleting service:", serviceId)

      if (!serviceId) {
        throw new Error("Invalid service ID")
      }

      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete service: ${response.statusText}`)
      }

      console.log("✅ Service deleted successfully:", serviceId)

      // Update local state
      setServices(prev => prev.filter(service => service.id !== serviceId))

      // Refresh categories to update service counts
      await loadCategories()
    } catch (error) {
      console.error("❌ Error deleting service:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete service"
      setError(errorMessage)
      throw error
    }
  }, [loadCategories])

  // Add a new category
  const addCategory = useCallback(async (categoryData: Omit<ServiceCategory, "id">): Promise<ServiceCategory> => {
    try {
      console.log("🔄 Adding new category:", categoryData)

      const response = await fetch("/api/service-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create category: ${response.statusText}`)
      }

      const data = await response.json()
      const newCategory = data.category

      console.log("✅ Category created successfully:", newCategory.name)

      // Update local state
      setCategories(prev => [...prev, newCategory])

      return newCategory
    } catch (error) {
      console.error("❌ Error adding category:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to add category"
      setError(errorMessage)
      throw error
    }
  }, [])

  // Update an existing category
  const updateCategory = useCallback(async (updatedCategory: ServiceCategory): Promise<void> => {
    try {
      console.log("🔄 Updating category:", updatedCategory.id, updatedCategory.name)

      const response = await fetch(`/api/service-categories/${updatedCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCategory),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to update category: ${response.statusText}`)
      }

      const data = await response.json()
      const updated = data.category

      console.log("✅ Category updated successfully:", updated.name)

      // Update local state
      setCategories(prev => prev.map(category =>
        category.id === updated.id ? updated : category
      ))
    } catch (error) {
      console.error("❌ Error updating category:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update category"
      setError(errorMessage)
      throw error
    }
  }, [])

  // Delete a category
  const deleteCategory = useCallback(async (categoryId: string): Promise<void> => {
    try {
      console.log("🔄 Deleting category:", categoryId)

      const response = await fetch(`/api/service-categories/${categoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to delete category: ${response.statusText}`)
      }

      console.log("✅ Category deleted successfully:", categoryId)

      // Update local state
      setCategories(prev => prev.filter(category => category.id !== categoryId))

      // Refresh services to update any that were using this category
      await loadServices()
    } catch (error) {
      console.error("❌ Error deleting category:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete category"
      setError(errorMessage)
      throw error
    }
  }, [loadServices])

  // Filter services based on user permissions
  const filteredServices = useMemo(() => {
    if (!user || user.role === "ADMIN") {
      return services // Admin sees all services
    }

    // Filter out home service services for staff users
    return services.filter(service => {
      // If service has locations, check if any location is "home"
      if (service.locations && service.locations.includes("home")) {
        return false // Staff users cannot see home service services
      }
      return true
    })
  }, [services, user])

  return (
    <ServiceContext.Provider
      value={{
        services,
        filteredServices,
        categories,
        loading,
        error,
        getServiceById,
        getCategoryById,
        getCategoryName,
        refreshServices,
        refreshCategories,
        refreshData,
        addService,
        updateService,
        deleteService,
        addCategory,
        updateCategory,
        deleteCategory
      }}
    >
      {children}
    </ServiceContext.Provider>
  )
}

export const useServices = () => useContext(ServiceContext)
