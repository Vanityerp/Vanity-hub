"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Scissors, Clock, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useServices } from "@/lib/service-provider"

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  category: string
}

interface ServicesListProps {
  location: string;
  categories: { id: string; name: string }[];
}

export function ServicesList({ location, categories }: ServicesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState<string | null>(null)

  // Get real services and categories from database via ServiceProvider
  const { services, categories: serviceCategories, loading, error } = useServices()

  // Handle loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading services...</span>
        </CardContent>
      </Card>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error loading services</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const filteredServices = searchQuery
    ? services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : services

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Service</CardTitle>
        <CardDescription>Choose from our range of salon services</CardDescription>
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search services..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {searchQuery ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Search Results</h3>
            {filteredServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services found matching "{searchQuery}"</p>
            ) : (
              <div className="grid gap-4">
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedService === service.id}
                    onSelect={() => setSelectedService(service.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="haircuts" className="w-full">
            <TabsList className="mb-4 w-full grid grid-cols-4">
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                {services
                  .filter((service) => service.category === category.name || service.category === category.id)
                  .map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isSelected={selectedService === service.id}
                      onSelect={() => setSelectedService(service.id)}
                    />
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Back</Button>
        <Button disabled={!selectedService}>Continue</Button>
      </CardFooter>
    </Card>
  )
}

interface ServiceCardProps {
  service: Service
  isSelected: boolean
  onSelect: () => void
}

function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{service.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center text-muted-foreground text-sm">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {service.duration} min
            </div>
            <Badge variant="outline" className="text-xs">
              <Scissors className="h-3 w-3 mr-1" />
              {service.category}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <span className="font-medium">${service.price}</span>
        </div>
      </div>
    </div>
  )
}
