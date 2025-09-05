"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClientPortalLayout } from "@/components/client-portal/client-portal-layout"
import {
  ShoppingBag,
  Heart,
  Trash2,
  ChevronRight,
  Star,
  Search,
  Filter,
  X
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"

// Mock favorite products
const initialFavoriteProducts = [
  {
    id: "p1",
    name: "Hydrating Shampoo",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop&crop=center&auto=format&q=80",
    category: "Hair Care",
    rating: 4.8,
    stock: 15,
    isSale: false
  },
  {
    id: "p2",
    name: "Volumizing Conditioner",
    price: 22.99,
    image: "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&h=400&fit=crop&crop=center&auto=format&q=80",
    category: "Hair Care",
    rating: 4.6,
    stock: 12,
    isSale: false
  },
  {
    id: "p4",
    name: "Styling Mousse",
    price: 18.99,
    image: "https://images.unsplash.com/photo-1626784215021-2e39ccf971cd?w=400&h=400&fit=crop&crop=center&auto=format&q=80",
    category: "Styling",
    rating: 4.5,
    stock: 8,
    isSale: true,
    salePrice: 15.99
  }
]

// Mock favorite services
const initialFavoriteServices = [
  {
    id: "s1",
    name: "Haircut & Style",
    price: 65.00,
    duration: 60,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    category: "Hair",
    rating: 4.9
  },
  {
    id: "s3",
    name: "Color & Highlights",
    price: 120.00,
    duration: 120,
    image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
    category: "Color",
    rating: 4.8
  }
]

export default function FavoritesPage() {
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const [favoriteProducts, setFavoriteProducts] = useState(initialFavoriteProducts)
  const [favoriteServices, setFavoriteServices] = useState(initialFavoriteServices)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Filter favorites based on search query and active tab
  const filteredProducts = favoriteProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredServices = favoriteServices.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle removing from favorites
  const removeFromFavorites = (id: string, type: 'product' | 'service') => {
    if (type === 'product') {
      setFavoriteProducts(prev => prev.filter(item => item.id !== id))
    } else {
      setFavoriteServices(prev => prev.filter(item => item.id !== id))
    }

    toast({
      title: "Removed from favorites",
      description: "The item has been removed from your favorites.",
    })
  }

  // Handle adding to cart
  const addToCart = (item: any) => {
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    })
  }

  // Get total favorites count
  const totalFavorites = favoriteProducts.length + favoriteServices.length

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Favorites</h1>
            <p className="text-gray-600">
              {totalFavorites} {totalFavorites === 1 ? 'item' : 'items'} saved to your favorites
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs for filtering */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All ({totalFavorites})</TabsTrigger>
            <TabsTrigger value="products">Products ({favoriteProducts.length})</TabsTrigger>
            <TabsTrigger value="services">Services ({favoriteServices.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : totalFavorites === 0 ||
           (activeTab === "products" && filteredProducts.length === 0) ||
           (activeTab === "services" && filteredServices.length === 0) ||
           (activeTab === "all" && filteredProducts.length === 0 && filteredServices.length === 0) ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium mb-2">No favorites yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              {searchQuery
                ? "No items match your search. Try a different search term."
                : "You haven't added any items to your favorites yet."}
            </p>
            <Button className="bg-pink-600 hover:bg-pink-700" asChild>
              <Link href="/client-portal/shop">
                Browse Products
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Products Section */}
            {(activeTab === "all" || activeTab === "products") && filteredProducts.length > 0 && (
              <div>
                {activeTab === "all" && <h2 className="text-xl font-bold mb-4">Favorite Products</h2>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="relative">
                        <div className="relative h-48 w-full bg-gray-100">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFromFavorites(product.id, 'product')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {product.isSale && (
                          <Badge className="absolute top-2 left-2 bg-red-500">Sale</Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <Link href={`/client-portal/shop/${product.id}`} className="block">
                          <h3 className="font-medium mb-1 group-hover:text-pink-600 transition-colors">{product.name}</h3>
                        </Link>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-gray-600">{product.rating}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            {product.isSale ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium"><CurrencyDisplay amount={product.salePrice || 0} /></span>
                                <span className="text-sm text-gray-500 line-through"><CurrencyDisplay amount={product.price} /></span>
                              </div>
                            ) : (
                              <span className="font-medium"><CurrencyDisplay amount={product.price} /></span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 hover:bg-pink-50 hover:text-pink-600"
                            onClick={() => addToCart(product)}
                          >
                            <ShoppingBag className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Services Section */}
            {(activeTab === "all" || activeTab === "services") && filteredServices.length > 0 && (
              <div>
                {activeTab === "all" && <h2 className="text-xl font-bold mb-4 mt-8">Favorite Services</h2>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredServices.map((service) => (
                    <Card key={service.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="relative">
                        <div className="relative h-48 w-full bg-gray-100">
                          <Image
                            src={service.image}
                            alt={service.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFromFavorites(service.id, 'service')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge className="absolute top-2 left-2 bg-blue-500">{service.category}</Badge>
                      </div>
                      <CardContent className="p-4">
                        <Link href={`/client-portal/services/${service.id}`} className="block">
                          <h3 className="font-medium mb-1 group-hover:text-pink-600 transition-colors">{service.name}</h3>
                        </Link>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-gray-600">{service.rating}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-medium"><CurrencyDisplay amount={service.price} /></span>
                            <span className="text-xs text-gray-500">{service.duration} min</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 hover:bg-pink-50 hover:text-pink-600"
                            asChild
                          >
                            <Link href="/client-portal/appointments/book">
                              Book Now
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  )
}
