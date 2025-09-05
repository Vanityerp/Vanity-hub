"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useClients, Client, ClientPreferences } from "@/lib/client-provider"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientPreferencesForm } from "./client-preferences-form"
import { useToast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface EditClientDialogProps {
  clientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onClientUpdated?: (client: Client) => void
  initialTab?: "basic" | "preferences" | "review"
}

export function EditClientDialog({ clientId, open, onOpenChange, onClientUpdated, initialTab = "basic" }: EditClientDialogProps) {
  const { currentLocation } = useAuth()
  const { getClient, updateClient } = useClients()
  const { locations, getLocationName, isHomeServiceEnabled } = useLocations()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState(initialTab)

  // Client data state
  const [formData, setFormData] = useState<Partial<Client>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    preferredLocation: currentLocation === "all" ? "loc1" : currentLocation,
    birthday: "",
    referredBy: "",
    notes: "",
    status: "Active",
    segment: "Regular",
  })

  // Preferences state
  const [preferences, setPreferences] = useState<ClientPreferences>({
    preferredStylists: [],
    preferredServices: [],
    preferredProducts: [],
    allergies: [],
    notes: ""
  })

  // Load client data when dialog opens and set initial tab
  useEffect(() => {
    if (open && clientId) {
      // Set the initial tab when dialog opens
      setActiveTab(initialTab)

      const client = getClient(clientId)
      if (client) {
        setFormData({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address || "",
          city: client.city || "",
          state: client.state || "",
          zip: client.zip || "",
          preferredLocation: client.preferredLocation,
          birthday: client.birthday || "",
          referredBy: client.referredBy || "",
          notes: client.notes || "",
          status: client.status,
          segment: client.segment,
        })

        if (client.preferences) {
          setPreferences(client.preferences)
        } else {
          setPreferences({
            preferredStylists: [],
            preferredServices: [],
            preferredProducts: [],
            allergies: [],
            notes: ""
          })
        }
      }
    }
  }, [open, clientId, initialTab]) // Removed getClient from dependencies

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePreferencesSave = (newPreferences: ClientPreferences) => {
    setPreferences(newPreferences)
    setActiveTab("review")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const updatedClient = updateClient(clientId, {
      ...formData,
      preferences,
    })

    if (updatedClient && onClientUpdated) {
      onClientUpdated(updatedClient)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information and preferences.</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="py-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    City/State/Zip
                  </Label>
                  <div className="col-span-3 grid grid-cols-7 gap-2">
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className="col-span-3"
                    />
                    <Input
                      id="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      className="col-span-2"
                    />
                    <Input
                      id="zip"
                      placeholder="Zip"
                      value={formData.zip}
                      onChange={(e) => handleChange("zip", e.target.value)}
                      className="col-span-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="birthday" className="text-right">
                    Birthday
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => handleChange("birthday", e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="preferredLocation" className="text-right">
                    Preferred Location
                  </Label>
                  <Select
                    value={formData.preferredLocation}
                    onValueChange={(value) => handleChange("preferredLocation", value)}
                  >
                    <SelectTrigger id="preferredLocation" className="col-span-3">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Map through active locations from settings */}
                      {locations
                        .filter(location => location.status === "Active" && location.name && location.name.trim() !== "")
                        .map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}

                      {/* Add Home Service option if enabled and not already in locations */}
                      {isHomeServiceEnabled && !locations.some(loc => loc.id === "home") && (
                        <SelectItem value="home" key="home">Home Service</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="referredBy" className="text-right">
                    Referred By
                  </Label>
                  <Input
                    id="referredBy"
                    value={formData.referredBy}
                    onChange={(e) => handleChange("referredBy", e.target.value)}
                    className="col-span-3"
                    placeholder="How did they hear about us?"
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="status" className="text-right pt-2">
                    Status
                  </Label>
                  <RadioGroup
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                    className="col-span-3 flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Active" id="status-active" />
                      <Label htmlFor="status-active">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Inactive" id="status-inactive" />
                      <Label htmlFor="status-inactive">Inactive</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Pending" id="status-pending" />
                      <Label htmlFor="status-pending">Pending</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="segment" className="text-right pt-2">
                    Segment
                  </Label>
                  <Select
                    value={formData.segment}
                    onValueChange={(value) => handleChange("segment", value)}
                  >
                    <SelectTrigger id="segment" className="col-span-3">
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="At Risk">At Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="notes" className="text-right pt-2">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    className="col-span-3"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <Button type="button" onClick={() => setActiveTab("preferences")}>
                    Continue to Preferences
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="py-4">
              <ClientPreferencesForm
                initialPreferences={preferences}
                onSave={handlePreferencesSave}
              />
            </TabsContent>

            <TabsContent value="review" className="py-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Client Information</h3>
                  <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                    <div className="font-medium">Name:</div>
                    <div>{formData.name || "Not provided"}</div>

                    <div className="font-medium">Email:</div>
                    <div>{formData.email || "Not provided"}</div>

                    <div className="font-medium">Phone:</div>
                    <div>{formData.phone || "Not provided"}</div>

                    <div className="font-medium">Address:</div>
                    <div>
                      {formData.address ? (
                        <>
                          {formData.address}
                          {(formData.city || formData.state || formData.zip) && (
                            <>, {formData.city} {formData.state} {formData.zip}</>
                          )}
                        </>
                      ) : (
                        "Not provided"
                      )}
                    </div>

                    <div className="font-medium">Birthday:</div>
                    <div>{formData.birthday || "Not provided"}</div>

                    <div className="font-medium">Preferred Location:</div>
                    <div>
                      {getLocationName(formData.preferredLocation)}
                    </div>

                    <div className="font-medium">Status:</div>
                    <div>{formData.status}</div>

                    <div className="font-medium">Segment:</div>
                    <div>{formData.segment}</div>

                    <div className="font-medium">Referred By:</div>
                    <div>{formData.referredBy || "Not provided"}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Client Preferences</h3>
                  <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                    <div className="font-medium">Preferred Stylists:</div>
                    <div>
                      {preferences.preferredStylists && preferences.preferredStylists.length > 0
                        ? preferences.preferredStylists.join(", ")
                        : "None selected"}
                    </div>

                    <div className="font-medium">Preferred Services:</div>
                    <div>
                      {preferences.preferredServices && preferences.preferredServices.length > 0
                        ? preferences.preferredServices.join(", ")
                        : "None selected"}
                    </div>

                    <div className="font-medium">Preferred Products:</div>
                    <div>
                      {preferences.preferredProducts && preferences.preferredProducts.length > 0
                        ? preferences.preferredProducts.join(", ")
                        : "None selected"}
                    </div>

                    <div className="font-medium">Allergies & Sensitivities:</div>
                    <div>
                      {preferences.allergies && preferences.allergies.length > 0
                        ? preferences.allergies.join(", ")
                        : "None provided"}
                    </div>

                    <div className="font-medium">Special Instructions:</div>
                    <div>{preferences.notes || "None provided"}</div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("preferences")}>
                    Back to Preferences
                  </Button>
                  <Button type="submit">
                    Update Client
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  )
}
