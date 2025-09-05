"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { X, Search, Plus } from "lucide-react"
import { useStaff } from "@/lib/staff-provider"
import { useServices } from "@/lib/service-provider"
import { ClientPreferences } from "@/lib/client-data-service"

interface ClientPreferencesFormProps {
  initialPreferences?: ClientPreferences
  onSave: (preferences: ClientPreferences) => void
}

export function ClientPreferencesForm({ initialPreferences, onSave }: ClientPreferencesFormProps) {
  // Get real data from providers
  const { staff, categories, services } = useServices()

  // Initialize with empty arrays or initial values if provided
  const [preferredStylists, setPreferredStylists] = useState<string[]>([])
  const [preferredServices, setPreferredServices] = useState<string[]>([])
  const [preferredProducts, setPreferredProducts] = useState<string[]>([])
  const [allergies, setAllergies] = useState<string[]>([])
  const [newAllergy, setNewAllergy] = useState("")
  const [notes, setNotes] = useState("")
  const [serviceSearchTerm, setServiceSearchTerm] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)
  const [newStylistName, setNewStylistName] = useState("")
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  // Get staff data from staff provider
  const { staff: staffData } = useStaff()

  // Load initial preferences when component mounts or initialPreferences changes
  useEffect(() => {
    // Only initialize once when we have data and haven't initialized yet
    if (!isInitialized && staffData.length > 0 && services.length > 0) {
      if (initialPreferences) {
        // For stylists and services, we need to find the IDs from the names
        const stylistIds = (initialPreferences.preferredStylists || []).map(name => {
          const staffMember = staffData.find(s => s.name === name)
          return staffMember ? staffMember.id : ""
        }).filter(Boolean)

        const serviceIds = (initialPreferences.preferredServices || []).map(name => {
          const service = services.find(s => s.name === name)
          return service ? service.id : ""
        }).filter(Boolean)

        setPreferredStylists(stylistIds)
        setPreferredServices(serviceIds)
        setAllergies(initialPreferences.allergies || [])
        setNotes(initialPreferences.notes || "")
      } else {
        // Initialize with empty values if no initial preferences
        setPreferredStylists([])
        setPreferredServices([])
        setAllergies([])
        setNotes("")
      }
      setIsInitialized(true)
    }
  }, [initialPreferences, staffData, services, isInitialized])

  // Reset initialization when initialPreferences changes (e.g., different client)
  useEffect(() => {
    setIsInitialized(false)
  }, [initialPreferences?.preferredStylists, initialPreferences?.preferredServices, initialPreferences?.allergies, initialPreferences?.notes])

  // Filter staff to only include stylists and related roles
  const stylists = staffData.filter(staffMember =>
    ["stylist", "colorist", "barber", "nail_technician", "esthetician", "massage_therapist"].includes(staffMember.role) &&
    staffMember.status === "Active"
  )

  // Filter services by search term
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  )

  // Group services by category
  const servicesByCategory = categories.reduce((acc, category) => {
    const categoryServices = filteredServices.filter(service =>
      service.category === category.id || service.category === category.name
    )
    if (categoryServices.length > 0) {
      acc[category.id] = {
        category,
        services: categoryServices
      }
    }
    return acc
  }, {} as Record<string, { category: any, services: any[] }>)

  const handleStylistToggle = (staffId: string) => {
    setPreferredStylists(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    )
  }

  const handleServiceToggle = (serviceId: string) => {
    setPreferredServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const addStylistName = () => {
    if (newStylistName.trim() && !preferredStylists.includes(newStylistName.trim())) {
      setPreferredStylists(prev => [...prev, newStylistName.trim()])
      setNewStylistName("")
    }
  }

  const removeStylistName = (stylistName: string) => {
    setPreferredStylists(prev => prev.filter(name => name !== stylistName))
  }

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies(prev => [...prev, newAllergy.trim()])
      setNewAllergy("")
    }
  }

  const removeAllergy = (allergy: string) => {
    setAllergies(prev => prev.filter(a => a !== allergy))
  }

  const handleProductToggle = (productId: string) => {
    setPreferredProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSubmit = () => {
    const stylistNames = preferredStylists.map(id => {
      const staffMember = staffData.find(s => s.id === id)
      return staffMember ? staffMember.name : ""
    }).filter(Boolean)

    const serviceNames = preferredServices.map(id => {
      const service = services.find(s => s.id === id)
      return service ? service.name : ""
    }).filter(Boolean)

    const productNames = preferredProducts.map(id => {
      // For now, we'll use placeholder names for products
      // This can be enhanced later when product preferences are implemented
      return `Product ${id}`
    })

    onSave({
      preferredStylists: stylistNames,
      preferredServices: serviceNames,
      preferredProducts: productNames,
      allergies,
      notes
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Preferred Stylists</h3>

          {/* Manual stylist entry */}
          <div className="flex items-center space-x-2 mb-3">
            <Input
              placeholder="Enter stylist name"
              value={newStylistName}
              onChange={(e) => setNewStylistName(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addStylistName()
                }
              }}
            />
            <Button type="button" onClick={addStylistName} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Display added stylists */}
          {preferredStylists.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {preferredStylists.map((stylist) => (
                <Badge key={stylist} variant="outline" className="flex items-center gap-1">
                  {stylist}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeStylistName(stylist)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Staff member checkboxes */}
          <div className="grid grid-cols-2 gap-2">
            {stylists.length > 0 ? (
              stylists.map((staffMember) => (
                <div key={staffMember.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`stylist-${staffMember.id}`}
                    checked={preferredStylists.includes(staffMember.id)}
                    onCheckedChange={() => handleStylistToggle(staffMember.id)}
                  />
                  <Label htmlFor={`stylist-${staffMember.id}`} className="text-sm">
                    {staffMember.name} ({staffMember.role})
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 col-span-2">No staff members available</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Preferred Services</h3>

          {/* Service Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={serviceSearchTerm}
              onChange={(e) => setServiceSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Services organized by categories */}
          {Object.keys(servicesByCategory).length > 0 ? (
            <Tabs defaultValue={Object.keys(servicesByCategory)[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-3">
                {Object.values(servicesByCategory).slice(0, 3).map(({ category }) => (
                  <TabsTrigger key={category.id} value={category.id} className="text-xs">
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.values(servicesByCategory).map(({ category, services: categoryServices }) => (
                <TabsContent key={category.id} value={category.id}>
                  <ScrollArea className="h-48 w-full rounded-md border p-3">
                    <div className="grid grid-cols-1 gap-2">
                      {categoryServices.map((service) => (
                        <div key={service.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`service-${service.id}`}
                            checked={preferredServices.includes(service.id)}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                          />
                          <Label htmlFor={`service-${service.id}`} className="text-sm flex-1">
                            {service.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">
                {serviceSearchTerm ? "No services found matching your search" : "No services available"}
              </p>
            </div>
          )}

          {/* Show all categories if there are more than 3 */}
          {Object.keys(servicesByCategory).length > 3 && (
            <div className="mt-3">
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-800">
                    View All Categories ({Object.keys(servicesByCategory).length - 3} more)
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>All Service Categories</DialogTitle>
                    <DialogDescription>
                      Select preferred services from all available categories
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] w-full pr-4">
                    <div className="space-y-4">
                      {Object.values(servicesByCategory).slice(3).map(({ category, services: categoryServices }) => (
                        <div key={category.id} className="border rounded-md p-4">
                          <h4 className="text-sm font-medium mb-3">{category.name}</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {categoryServices.map((service) => (
                              <div key={service.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`dialog-service-${service.id}`}
                                  checked={preferredServices.includes(service.id)}
                                  onCheckedChange={() => handleServiceToggle(service.id)}
                                />
                                <Label htmlFor={`dialog-service-${service.id}`} className="text-sm flex-1">
                                  {service.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex justify-end">
                    <Button onClick={() => setIsCategoryDialogOpen(false)}>
                      Done
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Allergies & Sensitivities</h3>
          <div className="flex items-center space-x-2 mb-2">
            <Input
              placeholder="Add allergy or sensitivity"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addAllergy()
                }
              }}
            />
            <Button type="button" onClick={addAllergy} size="sm">
              Add
            </Button>
          </div>
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {allergies.map((allergy) => (
                <Badge key={allergy} variant="outline" className="flex items-center gap-1">
                  {allergy}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeAllergy(allergy)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Notes & Special Instructions</h3>
          <Textarea
            placeholder="Add any special notes or instructions for this client"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <Button type="button" onClick={handleSubmit} className="w-full">
        Save Preferences
      </Button>
    </div>
  )
}
