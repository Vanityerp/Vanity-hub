"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useLocations } from "@/lib/location-provider"
import { useServices } from "@/lib/service-provider"
import { useCurrency, useCurrencyEnforcer } from "@/lib/currency-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditServiceDialog } from "@/components/services/edit-service-dialog"
import { DeleteServiceDialog } from "@/components/services/delete-service-dialog"
import { Clock, Edit, MoreHorizontal, Trash, MapPin } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Custom hook to fetch and cache location names from database
function useLocationNames() {
  const [locationNames, setLocationNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch('/api/locations')
        if (response.ok) {
          const data = await response.json()
          const locations = data.locations || []

          // Create a mapping of location ID to name
          const nameMap: Record<string, string> = {}
          locations.forEach((location: any) => {
            nameMap[location.id] = location.name
          })

          setLocationNames(nameMap)
          console.log('📍 Loaded location names:', nameMap)
        } else {
          console.error('Failed to fetch locations:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  const getLocationName = (locationId: string): string => {
    return locationNames[locationId] || "Unknown Location"
  }

  return { getLocationName, loading }
}

interface ServicesListProps {
  search: string
}

export function ServicesList({ search }: ServicesListProps) {
  const { currentLocation, hasPermission, user } = useAuth()
  const { getLocationName: getLocationNameFromCache, locations } = useLocations()
  const { getLocationName, loading: locationNamesLoading } = useLocationNames()
  const {
    services,
    categories: serviceCategories,
    loading: servicesLoading,
    error: servicesError,
    refreshData
  } = useServices()
  // Use the currency enforcer to ensure this component updates when currency changes
  const { currency } = useCurrencyEnforcer()
  const [activeTab, setActiveTab] = useState("all")
  const [editingService, setEditingService] = useState<any | null>(null)
  const [deletingService, setDeletingService] = useState<any | null>(null)
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>("all")
  const [loadingServiceData, setLoadingServiceData] = useState(false)

  // Function to fetch complete service data for editing
  const handleEditService = async (service: any) => {
    setLoadingServiceData(true)
    try {
      // Fetch complete service data from the API
      const response = await fetch(`/api/services/${service.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch service data')
      }
      const data = await response.json()
      console.log('Fetched complete service data for editing:', data.service)
      setEditingService(data.service)
    } catch (error) {
      console.error('Error fetching service data:', error)
      // Fallback to using the service from the list
      setEditingService(service)
    } finally {
      setLoadingServiceData(false)
    }
  }

  // Refresh services when component mounts
  useEffect(() => {
    refreshData().catch(err => {
      console.error("Failed to load services data:", err)
    })
  }, [refreshData])

  // Ensure services is an array before processing
  const servicesArray = Array.isArray(services) ? services : [];

  // Create a bidirectional mapping between category IDs and names
  const categoryIdToNameMap = new Map()
  const categoryNameToIdMap = new Map()

  serviceCategories.forEach(cat => {
    categoryIdToNameMap.set(cat.id, cat.name)
    categoryNameToIdMap.set(cat.name, cat.id)
  })

  // Log services for debugging
  console.log("Services loaded:", servicesArray.length, "services")
  console.log("Service categories:", serviceCategories)
  console.log("Category IDs:", serviceCategories.map(c => c.id))
  console.log("Category names:", serviceCategories.map(c => c.name))

  // Check for duplicate category IDs
  const categoryIds = serviceCategories.map(c => c.id)
  const duplicateIds = categoryIds.filter((id, index) => categoryIds.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    console.warn("⚠️ Duplicate category IDs found:", duplicateIds)
  }

  // Log service categories for debugging - don't modify the data
  servicesArray.forEach(service => {
    console.log(`Service: ${service.name}, Category: ${service.category}`)
  })

  // Filter services based on location, search term, and active tab
  const filteredServices = servicesArray.filter((service) => {
    // Filter by current location (auth-based)
    if (currentLocation !== "all" && !service.locations.includes(currentLocation)) {
      return false
    }

    // Staff users cannot access home service services
    if (user?.role !== "ADMIN" && service.locations.includes("home")) {
      return false
    }

    // Filter by selected location filter (additional filter)
    if (selectedLocationFilter !== "all" && !service.locations.includes(selectedLocationFilter)) {
      return false
    }

    // Filter by search term
    if (
      search &&
      !service.name.toLowerCase().includes(search.toLowerCase()) &&
      !(service.category || "Uncategorized").toLowerCase().includes(search.toLowerCase())
    ) {
      return false
    }

    // Filter by tab
    if (activeTab !== "all") {
      // Check if the active tab matches the service's category name
      return activeTab === service.category;
    }

    return true
  })

  if (servicesLoading || locationNamesLoading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mr-4"></div>
          <p className="text-gray-500">
            {servicesLoading ? "Loading services..." : "Loading locations..."}
          </p>
        </div>
      </Card>
    )
  }

  if (servicesError) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Error loading services: {servicesError}</p>
          <Button
            onClick={() => refreshData()}
            variant="outline"
            className="border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card>
        {/* Location Filter */}
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedLocationFilter} onValueChange={setSelectedLocationFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations
                .filter(location => location.status === "Active")
                .map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {selectedLocationFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLocationFilter("all")}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear filter
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Services</TabsTrigger>
            {serviceCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.name}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Locations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No services found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category || "Uncategorized"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {service.duration} min
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CurrencyDisplay amount={service.price} showSymbol={true} useLocaleFormat={true} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {service.locations.map((loc, index) => (
                            <Badge
                              key={`${service.id}-${loc}-${index}`}
                              variant="secondary"
                              className="text-xs"
                            >
                              {getLocationName(loc)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {hasPermission("edit_service") && (
                              <DropdownMenuItem onClick={() => handleEditService(service)} disabled={loadingServiceData}>
                                <Edit className="mr-2 h-4 w-4" />
                                {loadingServiceData ? "Loading..." : "Edit service"}
                              </DropdownMenuItem>
                            )}
                            {hasPermission("delete_service") && (
                              <DropdownMenuItem
                                onClick={() => setDeletingService(service)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete service
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Tabs>
      </Card>

      {editingService && (
        <EditServiceDialog
          service={editingService}
          open={!!editingService}
          onOpenChange={(open) => {
            if (!open) {
              setEditingService(null)
              // Refresh services after editing
              refreshData()
            }
          }}
        />
      )}

      {deletingService && (
        <DeleteServiceDialog
          service={deletingService}
          open={!!deletingService}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingService(null)
              // Refresh services after deletion
              refreshData()
            }
          }}
        />
      )}
    </>
  )
}

