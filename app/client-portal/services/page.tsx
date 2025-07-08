"use client"

import { useState, useEffect, useMemo } from "react"
import { ClientPortalLayout } from "@/components/client-portal/client-portal-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useServices } from "@/lib/service-provider"
import { useLocations } from "@/lib/location-provider"
import { useCurrency } from "@/lib/currency-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Search, Clock, Calendar, Star, Heart, Filter, ArrowLeft, Home, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ServicesPage() {
  const { services, categories, getCategoryName } = useServices()
  const { locations, getLocationName, isHomeServiceLocation } = useLocations()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [favorites, setFavorites] = useState<string[]>([])

  // Load favorites from localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem("client_favorite_services")
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites))
      } catch (error) {
        console.error("Error loading favorite services:", error)
      }
    }
  }, [])

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: string[]) => {
    setFavorites(newFavorites)
    localStorage.setItem("client_favorite_services", JSON.stringify(newFavorites))
  }

  // Toggle favorite status
  const toggleFavorite = (serviceId: string) => {
    const newFavorites = favorites.includes(serviceId)
      ? favorites.filter(id => id !== serviceId)
      : [...favorites, serviceId]

    saveFavorites(newFavorites)

    toast({
      title: favorites.includes(serviceId) ? "Removed from favorites" : "Added to favorites",
      description: favorites.includes(serviceId)
        ? "Service removed from your favorites"
        : "Service added to your favorites",
    })
  }

  // Filter and sort services
  const filteredAndSortedServices = useMemo(() => {
    let filtered = services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           getCategoryName(service.category).toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === "all" ||
                          service.category === selectedCategory ||
                          service.category === getCategoryName(selectedCategory) ||
                          service.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory

      // Filter by location
      let matchesLocation = true
      if (selectedLocation !== "all") {
        if (service.locations && service.locations.length > 0) {
          matchesLocation = service.locations.includes(selectedLocation)
        } else {
          // If service has no location restrictions, it's available everywhere
          matchesLocation = true
        }
      }

      return matchesSearch && matchesCategory && matchesLocation
    })

    // Sort services
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "duration":
          return a.duration - b.duration
        case "category":
          return getCategoryName(a.category).localeCompare(getCategoryName(b.category))
        default: // name
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [services, searchTerm, selectedCategory, selectedLocation, sortBy, getCategoryName])

  // Get service image (use uploaded image or fallback to themed images)
  const getServiceImage = (service: any) => {
    // Use uploaded image if available
    if (service.imageUrl) {
      return service.imageUrl
    }

    // Enhanced beauty/salon themed images from Unsplash with better quality and variety
    const beautyImages = [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Hair salon
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Makeup
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Spa
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Beauty treatment
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Nail care
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Hair styling
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Hair color
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Facial
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Massage
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Henna
    ]
    const index = parseInt(service.id.slice(-1)) || 0
    return beautyImages[index % beautyImages.length]
  }

  // Get service rating (mock implementation)
  const getServiceRating = () => {
    return (4.0 + Math.random() * 1.0).toFixed(1)
  }

  return (
    <ClientPortalLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/client-portal" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Services</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Our Services</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our comprehensive range of beauty and wellness services.
            From haircuts to spa treatments, we have everything you need to look and feel your best.
          </p>
        </div>

        {/* Horizontal Category Navigation - Optimized Layout */}
        <div className="mb-8 -mx-4 md:-mx-8 lg:-mx-12 xl:-mx-16">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 md:p-6 mx-4 md:mx-8 lg:mx-12 xl:mx-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Service Categories</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">
                  {filteredAndSortedServices.length} service{filteredAndSortedServices.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Category Tabs - Optimized Horizontal Layout */}
            <div className="relative">
              <div className="flex overflow-x-auto pb-2 scrollbar-hide scroll-smooth">
                <div className="flex space-x-1.5 md:space-x-2 lg:space-x-3 min-w-max px-1 py-1 w-full justify-start lg:justify-center">
                  {/* Category Tabs First */}
                  {categories.map((category) => {
                    const categoryServiceCount = services.filter(s => {
                      const matchesCategory = s.category === category.name ||
                                            s.category === category.id ||
                                            s.category.toLowerCase().replace(/\s+/g, '-') === category.id;

                      // Also filter by location if a location is selected
                      let matchesLocation = true;
                      if (selectedLocation !== "all") {
                        if (s.locations && s.locations.length > 0) {
                          matchesLocation = s.locations.includes(selectedLocation);
                        }
                      }

                      return matchesCategory && matchesLocation;
                    }).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex-shrink-0 px-3 md:px-4 lg:px-5 xl:px-6 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit ${
                          selectedCategory === category.id
                            ? "bg-pink-600 text-white shadow-lg shadow-pink-600/25 scale-105"
                            : "bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 hover:scale-105"
                        }`}
                      >
                        {category.name}
                        <span className={`ml-1.5 md:ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                          selectedCategory === category.id
                            ? "bg-white/20 opacity-75"
                            : "bg-gray-100 opacity-75"
                        }`}>
                          {categoryServiceCount}
                        </span>
                      </button>
                    );
                  })}

                  {/* All Services Tab - Moved to End */}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`flex-shrink-0 px-3 md:px-4 lg:px-5 xl:px-6 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit ${
                      selectedCategory === "all"
                        ? "bg-pink-600 text-white shadow-lg shadow-pink-600/25 scale-105"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 hover:scale-105"
                    }`}
                  >
                    All Services
                    <span className="ml-1.5 md:ml-2 text-xs opacity-75 bg-white/20 px-1.5 py-0.5 rounded-full">
                      {selectedLocation === "all" ? services.length : services.filter(s => {
                        if (s.locations && s.locations.length > 0) {
                          return s.locations.includes(selectedLocation);
                        }
                        return true;
                      }).length}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations
                .filter(location =>
                  location.status === "Active" &&
                  location.id !== "online" &&
                  !location.name.toLowerCase().includes("online store")
                )
                .map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {location.name}
                    </div>
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || selectedCategory !== "all" || selectedLocation !== "all") && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                {getCategoryName(selectedCategory)}
              </span>
            )}
            {selectedLocation !== "all" && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <MapPin className="h-3 w-3 mr-1" />
                {getLocationName(selectedLocation)}
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
              }}
              className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Services Grid */}
        {filteredAndSortedServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedServices.map((service) => (
              <Card key={service.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="relative">
                  <div className="relative h-48 w-full bg-gray-100">
                    <Image
                      src={getServiceImage(service)}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        className="bg-pink-600 hover:bg-pink-700"
                        size="sm"
                        asChild
                      >
                        <Link href={`/client-portal/appointments/book?serviceId=${service.id}`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Book Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute top-2 right-2 ${
                      favorites.includes(service.id)
                        ? "text-red-500 hover:text-red-600"
                        : "text-white hover:text-red-500"
                    }`}
                    onClick={() => toggleFavorite(service.id)}
                  >
                    <Heart className={`h-5 w-5 ${favorites.includes(service.id) ? "fill-current" : ""}`} />
                  </Button>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight">{service.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(service.category)}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-600">{getServiceRating()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{service.duration} min</span>
                    </div>
                    {(service.showPrices ?? true) && (
                      <div className="font-bold text-lg">
                        <CurrencyDisplay amount={service.price} />
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    asChild
                  >
                    <Link href={`/client-portal/appointments/book?serviceId=${service.id}`}>
                      Book Appointment
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Categories Overview */}
        {selectedCategory === "all" && searchTerm === "" && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-6 text-center">
                    <h3 className="font-medium mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {services.filter(s => {
                        const matchesCategory = s.category === category.name;
                        let matchesLocation = true;
                        if (selectedLocation !== "all") {
                          if (s.locations && s.locations.length > 0) {
                            matchesLocation = s.locations.includes(selectedLocation);
                          }
                        }
                        return matchesCategory && matchesLocation;
                      }).length} services
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </ClientPortalLayout>
  )
}
