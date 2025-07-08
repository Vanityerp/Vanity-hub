"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Trash2, Edit, Save } from "lucide-react"
import { useLocations } from "@/lib/location-provider"
import { Location } from "@/lib/settings-storage"
import { v4 as uuidv4 } from "uuid"

export function LocationSettings() {
  console.log("🏢 LocationSettings: Component rendered!")
  const { toast } = useToast()
  const {
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    getLocationById,
    refreshLocations
  } = useLocations()

  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [location, setLocation] = useState<Location>({
    id: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    email: "",
    status: "Active",
    description: "",
    enableOnlineBooking: true,
    displayOnWebsite: true,
    staffCount: 0,
    servicesCount: 0
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)

  // Load locations on initial render
  useEffect(() => {
    console.log("🏢 LocationSettings: Component mounted, current locations:", locations)
    console.log("🏢 LocationSettings: Locations count:", locations.length)
    const loadData = async () => {
      console.log("🏢 LocationSettings: Calling refreshLocations...")
      await refreshLocations()
    }
    loadData()
  }, [refreshLocations])

  // Debug locations changes
  useEffect(() => {
    console.log("🏢 LocationSettings: Locations updated:", locations)
    console.log("🏢 LocationSettings: Location names:", locations.map(loc => loc.name))
  }, [locations])

  // Set default location to first available location on initial load
  useEffect(() => {
    if (locations.length > 0 && selectedLocation === "") {
      // Select the first location from the database
      const defaultLocation = locations[0];
      if (defaultLocation) {
        setSelectedLocation(defaultLocation.id);
        setLocation(defaultLocation);
      }
    }
  }, [locations, selectedLocation]);

  const handleLocationSelect = (id: string) => {
    const loc = getLocationById(id)
    if (loc) {
      setLocation(loc)
      setSelectedLocation(id)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLocation(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setLocation(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Special handling for Home Service location
    if (location.id === "home") {
      updateLocation(location)
      toast({
        title: "Home Service settings saved",
        description: "Your Home Service settings have been updated."
      })
    } else {
      updateLocation(location)
      toast({
        title: "Location saved",
        description: `Your ${location.name} location settings have been updated.`
      })
    }

    setIsFormDialogOpen(false)
  }

  const handleCreateLocation = () => {
    setIsCreating(true)
    setIsEditing(false)

    // Create a new location with default values
    const newLocation: Location = {
      id: `loc_${uuidv4().substring(0, 8)}`,
      name: "",
      address: "",
      city: "Doha",
      state: "Doha",
      zipCode: "",
      country: "Qatar",
      phone: "(974) ",
      email: "",
      status: "Active",
      description: "",
      enableOnlineBooking: true,
      displayOnWebsite: true,
      staffCount: 0,
      servicesCount: 0
    }

    setLocation(newLocation)
    setIsFormDialogOpen(true)
  }

  const handleEditLocation = () => {
    setIsEditing(true)
    setIsCreating(false)
    setIsFormDialogOpen(true)
  }

  const handleDeleteLocation = () => {
    if (location.id === "home") {
      toast({
        title: "Cannot delete Home Service",
        description: "The Home Service location cannot be deleted as it's a system requirement.",
        variant: "destructive"
      })
      return
    }

    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    const locationName = location.name
    deleteLocation(location.id)

    toast({
      title: "Location deleted",
      description: `${locationName} has been deleted.`
    })

    // Select the first available location
    if (locations.length > 0) {
      const firstLocation = locations[0]
      setSelectedLocation(firstLocation.id)
      setLocation(firstLocation)
    }

    // Close both dialogs
    setIsDeleteDialogOpen(false)
    setIsFormDialogOpen(false)
  }

  const handleSaveNewLocation = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!location.name || !location.address || !location.city || !location.country) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    addLocation(location)

    toast({
      title: "Location created",
      description: `${location.name} has been added.`
    })

    setSelectedLocation(location.id)
    setIsFormDialogOpen(false)
    setIsCreating(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Location Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your salon locations and Home Service settings
            </p>
          </div>
          <Button onClick={handleCreateLocation} className="flex items-center gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>Add Location</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label>Select Location</Label>
            <Select value={selectedLocation} onValueChange={handleLocationSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={handleEditLocation}
            disabled={!selectedLocation}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>

        {selectedLocation && (
          <div className="border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-medium">{location.name}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Address</h4>
                <p>{location.address}</p>
                <p>{location.city}, {location.state} {location.zipCode}</p>
                <p>{location.country}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact</h4>
                <p>{location.phone}</p>
                <p>{location.email}</p>
              </div>
            </div>

            {location.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                <p>{location.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                <p className={location.status === "Active" ? "text-green-600" : "text-amber-600"}>
                  {location.status}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Settings</h4>
                <p>Online Booking: {location.enableOnlineBooking ? "Enabled" : "Disabled"}</p>
                <p>Display on Website: {location.displayOnWebsite ? "Yes" : "No"}</p>
              </div>
            </div>

            {location.id === "home" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                <p><strong>Note:</strong> Home Service is a special location type. Some settings may be limited.</p>
              </div>
            )}
          </div>
        )}

        {/* Edit/Create Location Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isCreating ? "Add New Location" : "Edit Location"}</DialogTitle>
              <DialogDescription>
                {isCreating
                  ? "Create a new salon location with the details below."
                  : `Update the details for ${location.name}.`}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={isCreating ? handleSaveNewLocation : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Location Name*</Label>
                  <Input
                    id="name"
                    name="name"
                    value={location.name}
                    onChange={handleChange}
                    required
                    disabled={location.id === "home"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address*</Label>
                  <Input
                    id="address"
                    name="address"
                    value={location.address}
                    onChange={handleChange}
                    required
                    disabled={location.id === "home"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City*</Label>
                  <Input
                    id="city"
                    name="city"
                    value={location.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    value={location.state}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country*</Label>
                  <Input
                    id="country"
                    name="country"
                    value={location.country}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Postal Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={location.zipCode}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={location.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={location.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={location.description || ""}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    name="status"
                    value={location.status}
                    onValueChange={(value) => setLocation(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableOnlineBooking">Enable Online Booking</Label>
                  <Switch
                    id="enableOnlineBooking"
                    checked={location.enableOnlineBooking}
                    onCheckedChange={(checked) => handleSwitchChange("enableOnlineBooking", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="displayOnWebsite">Display on Website</Label>
                  <Switch
                    id="displayOnWebsite"
                    checked={location.displayOnWebsite}
                    onCheckedChange={(checked) => handleSwitchChange("displayOnWebsite", checked)}
                  />
                </div>
              </div>

              {location.id === "home" && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                  <p><strong>Note:</strong> Home Service is a special location type. Some settings may be limited.</p>
                </div>
              )}

              <DialogFooter className="flex justify-between">
                <div>
                  {!isCreating && location.id !== "home" && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteLocation}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Location</span>
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFormDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex items-center gap-1">
                    <Save className="h-4 w-4" />
                    <span>{isCreating ? "Create Location" : "Save Changes"}</span>
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this location?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {location.name} location
                and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
