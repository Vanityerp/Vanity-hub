"use client"

import { MapPin, Phone, Clock, Check } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useLocations } from "@/lib/location-provider"
import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"

interface LocationSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function LocationSelector({ value, onValueChange }: LocationSelectorProps) {
  const { locations: storeLocations, getLocationById } = useLocations()
  const { user } = useAuth()
  const [formattedLocations, setFormattedLocations] = useState<any[]>([])

  // Format locations for display
  useEffect(() => {
    let filteredLocations = storeLocations;

    // Filter out home service for staff users and online store for all users in client booking
    if (user?.role !== "ADMIN") {
      filteredLocations = storeLocations.filter(location => location.id !== "home");
    }

    // Always filter out online store from client-facing booking
    filteredLocations = filteredLocations.filter(location =>
      location.id !== "online" &&
      !location.name.toLowerCase().includes("online store")
    );

    const locationsWithHours = filteredLocations.map(location => {
      return {
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode || "",
        phone: location.phone,
        hours: location.id === "home" ? "By appointment only" : "Mon-Sat: 9am - 8pm, Sun: 10am - 6pm",
        description: location.description || (location.id === "home" ? "We come to you! Available within city limits" : "")
      }
    })

    setFormattedLocations(locationsWithHours)
  }, [storeLocations, user])

  return (
    <RadioGroup value={value} onValueChange={onValueChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {formattedLocations.map((location) => (
        <div key={location.id} className="relative">
          <RadioGroupItem
            value={location.id}
            id={location.id}
            className="peer sr-only"
          />
          <Label
            htmlFor={location.id}
            className="flex flex-col p-4 border rounded-lg cursor-pointer transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{location.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{location.description}</p>
              </div>
              <div className="h-5 w-5 rounded-full border flex items-center justify-center peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                {value === location.id && <Check className="h-3 w-3 text-white" />}
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                <div>
                  <p>{location.address}</p>
                  <p>{location.city}, {location.state} {location.zipCode}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                <p>{location.phone}</p>
              </div>
              <div className="flex items-start">
                <Clock className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                <p>{location.hours}</p>
              </div>
            </div>
            {value === location.id && (
              <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check className="h-4 w-4" />
              </div>
            )}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
