"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useClients } from "@/lib/client-provider"
import { useLocations } from "@/lib/location-provider"
import { useCurrency } from "@/lib/currency-provider"
import { currencies, popularCurrencyCodes } from "@/lib/currency-data"
import { useToast } from "@/hooks/use-toast"
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

interface EnhancedNewClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnhancedNewClientDialog({ open, onOpenChange }: EnhancedNewClientDialogProps) {
  const { currentLocation } = useAuth()
  const { addClient } = useClients()
  const { locations, getLocationName } = useLocations()
  const { currencyCode } = useCurrency()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("basic")

  // Basic info
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [preferredLocation, setPreferredLocation] = useState(currentLocation === "all" ? "loc1" : currentLocation)
  const [birthday, setBirthday] = useState("")
  const [referredBy, setReferredBy] = useState("")
  const [notes, setNotes] = useState("")
  const [currency, setCurrency] = useState(currencyCode)

  // Preferences
  const [preferences, setPreferences] = useState({
    preferredStylists: [],
    preferredServices: [],
    allergies: [],
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Create the new client using the client provider
      await addClient({
        name,
        email,
        phone,
        address,
        city,
        state,
        preferredLocation,
        birthday,
        referredBy,
        notes,
        currency,
        locations: [preferredLocation],
        preferences
      })

      onOpenChange(false)

      // Reset form
      setName("")
      setEmail("")
      setPhone("")
      setAddress("")
      setCity("")
      setState("")
      setPreferredLocation(currentLocation === "all" ? "loc1" : currentLocation)
      setBirthday("")
      setReferredBy("")
      setNotes("")
      setCurrency(currencyCode)
      setPreferences({
        preferredStylists: [],
        preferredServices: [],
        allergies: [],
        notes: ""
      })
      setActiveTab("basic")
    } catch (error) {
      console.error('Error creating client:', error)
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handlePreferencesSave = (newPreferences: any) => {
    setPreferences(newPreferences)
    setActiveTab("review")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
            <DialogDescription>Add a new client to your salon database.</DialogDescription>
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    City/State
                  </Label>
                  <div className="col-span-3 grid grid-cols-5 gap-2">
                    <Input
                      id="city"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="col-span-3"
                    />
                    <Input
                      id="state"
                      placeholder="State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
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
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="preferredLocation" className="text-right">
                    Preferred Location
                  </Label>
                  <Select
                    value={preferredLocation}
                    onValueChange={setPreferredLocation}
                  >
                    <SelectTrigger id="preferredLocation" className="col-span-3">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter(loc => loc.id !== "home" && loc.id !== "online").map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="currency" className="text-right">
                    Currency Preference
                  </Label>
                  <Select
                    value={currency}
                    onValueChange={setCurrency}
                  >
                    <SelectTrigger id="currency" className="col-span-3">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {popularCurrencyCodes.map((code) => (
                        <SelectItem key={code} value={code}>
                          {currencies[code]?.code} - {currencies[code]?.name} ({currencies[code]?.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="referredBy" className="text-right">
                    Referred By
                  </Label>
                  <Input
                    id="referredBy"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    className="col-span-3"
                    placeholder="How did they hear about us?"
                  />
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="notes" className="text-right pt-2">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
              <ClientPreferencesForm onSave={handlePreferencesSave} />
            </TabsContent>

            <TabsContent value="review" className="py-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Client Information</h3>
                  <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                    <div className="font-medium">Name:</div>
                    <div>{name || "Not provided"}</div>

                    <div className="font-medium">Email:</div>
                    <div>{email || "Not provided"}</div>

                    <div className="font-medium">Phone:</div>
                    <div>{phone || "Not provided"}</div>

                    <div className="font-medium">Address:</div>
                    <div>
                      {address ? (
                        <>
                          {address}
                          {(city || state) && (
                            <>, {city} {state}</>
                          )}
                        </>
                      ) : (
                        "Not provided"
                      )}
                    </div>

                    <div className="font-medium">Birthday:</div>
                    <div>{birthday || "Not provided"}</div>

                    <div className="font-medium">Preferred Location:</div>
                    <div>{getLocationName(preferredLocation)}</div>

                    <div className="font-medium">Currency Preference:</div>
                    <div>{currencies[currency]?.name} ({currencies[currency]?.symbol})</div>

                    <div className="font-medium">Referred By:</div>
                    <div>{referredBy || "Not provided"}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Client Preferences</h3>
                  <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                    <div className="font-medium">Preferred Stylists:</div>
                    <div>
                      {preferences.preferredStylists.length > 0
                        ? preferences.preferredStylists.join(", ")
                        : "None selected"}
                    </div>

                    <div className="font-medium">Preferred Services:</div>
                    <div>
                      {preferences.preferredServices.length > 0
                        ? preferences.preferredServices.join(", ")
                        : "None selected"}
                    </div>

                    <div className="font-medium">Allergies & Sensitivities:</div>
                    <div>
                      {preferences.allergies.length > 0
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
                    Create Client
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
