// DEPRECATED: Service Storage - Database-only version
// All service data now comes from the database via API endpoints

export interface Service {
  id: string
  name: string
  category: string
  type: 'service'
  price: number
  duration: number
  locations: string[]
  description?: string
}

export interface ServiceCategory {
  id: string
  name: string
  description: string
  serviceCount: number
}

export const ServiceStorage = {
  getServices: (): Service[] => {
    console.warn("ServiceStorage.getServices is deprecated. Use GET /api/services instead.")
    return []
  },
  getServicesByCategory: (category: string): Service[] => {
    console.warn("ServiceStorage.getServicesByCategory is deprecated.")
    return []
  },
  getServicesByLocation: (locationId: string): Service[] => {
    console.warn("ServiceStorage.getServicesByLocation is deprecated.")
    return []
  },
  getServiceById: (id: string): Service | undefined => {
    console.warn("ServiceStorage.getServiceById is deprecated.")
    return undefined
  },
  addService: (service: Omit<Service, "id">): Service => {
    console.warn("ServiceStorage.addService is deprecated.")
    return { ...service, id: 'deprecated' }
  },
  updateService: (service: Service): Service => {
    console.warn("ServiceStorage.updateService is deprecated.")
    return service
  },
  deleteService: (id: string): boolean => {
    console.warn("ServiceStorage.deleteService is deprecated.")
    return false
  },
  initializeServices: (): Service[] => {
    console.warn("ServiceStorage.initializeServices is deprecated.")
    return []
  },
  getCategories: (): ServiceCategory[] => {
    console.warn("ServiceStorage.getCategories is deprecated.")
    return []
  },
  getServiceCategories: (): ServiceCategory[] => {
    console.warn("ServiceStorage.getServiceCategories is deprecated.")
    return []
  },
  initializeServiceCategories: (): ServiceCategory[] => {
    console.warn("ServiceStorage.initializeServiceCategories is deprecated.")
    return []
  },
  addCategory: (category: Omit<ServiceCategory, "id">): ServiceCategory => {
    console.warn("ServiceStorage.addCategory is deprecated.")
    return { ...category, id: 'deprecated' }
  },
  updateCategory: (category: ServiceCategory): ServiceCategory => {
    console.warn("ServiceStorage.updateCategory is deprecated.")
    return category
  },
  deleteCategory: (id: string): boolean => {
    console.warn("ServiceStorage.deleteCategory is deprecated.")
    return false
  },
  clearLocalStorage: (): void => {
    console.warn("ServiceStorage.clearLocalStorage is deprecated.")
  }
}