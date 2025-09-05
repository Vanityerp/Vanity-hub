"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useToast } from "@/components/ui/use-toast"
import { useLocations } from "@/lib/location-provider"
import { StaffStorage } from "@/lib/staff-storage"
import { useUnifiedStaff } from "@/lib/unified-staff-provider"

interface NewStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStaffAdded?: () => void
}

export function NewStaffDialog({ open, onOpenChange, onStaffAdded }: NewStaffDialogProps) {
  const { user, currentLocation } = useAuth()
  const { toast } = useToast()
  const { locations: availableLocations, isHomeServiceEnabled } = useLocations()
  const { addStaffMember, refreshData } = useUnifiedStaff()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("stylist")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [homeService, setHomeService] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize selected locations based on current location
  useEffect(() => {
    if (currentLocation === "all" && availableLocations.length > 0) {
      setSelectedLocations([availableLocations[0].id])
    } else if (currentLocation !== "home") {
      setSelectedLocations([currentLocation])
    } else if (availableLocations.length > 0) {
      setSelectedLocations([availableLocations[0].id])
    }
  }, [currentLocation, availableLocations])

  const handleLocationChange = (location: string, checked: boolean) => {
    if (checked) {
      setSelectedLocations((prev) => [...prev, location])
    } else {
      setSelectedLocations((prev) => prev.filter((loc) => loc !== location))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create new staff member
      const newStaffData = {
        name,
        email,
        phone,
        role,
        locations: selectedLocations,
        status: "Active",
        avatar: name.split(' ').map(n => n[0]).join(''),
        color: "bg-purple-100 text-purple-800",
        homeService
      }

      // Use unified provider to add staff member (this also creates corresponding user)
      const result = addStaffMember(newStaffData)

      console.log("New staff member:", result.staff)
      console.log("Corresponding user:", result.user)

      // Refresh data to ensure all components are updated
      refreshData()

      toast({
        title: "Staff member created",
        description: `${name} has been added to your staff directory.`,
      })

      if (onStaffAdded) {
        onStaffAdded()
      }

      // Reset form
      setName("")
      setEmail("")
      setPhone("")
      setRole("stylist")
      if (currentLocation === "all" && availableLocations.length > 0) {
        setSelectedLocations([availableLocations[0].id])
      } else if (currentLocation !== "home") {
        setSelectedLocations([currentLocation])
      } else if (availableLocations.length > 0) {
        setSelectedLocations([availableLocations[0].id])
      }
      setHomeService(false)

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create staff member:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create staff member. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Staff Member</DialogTitle>
            <DialogDescription>Add a new staff member to your salon.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
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
                required
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
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role" className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {user?.role === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                  {(user?.role === "super_admin" || user?.role === "org_admin") && (
                    <SelectItem value="org_admin">Organization Admin</SelectItem>
                  )}
                  <SelectItem value="location_manager">Location Manager</SelectItem>
                  <SelectItem value="stylist">Stylist</SelectItem>
                  <SelectItem value="colorist">Colorist</SelectItem>
                  <SelectItem value="barber">Barber</SelectItem>
                  <SelectItem value="nail_technician">Nail Technician</SelectItem>
                  <SelectItem value="esthetician">Esthetician</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right pt-2">Locations</Label>
              <div className="col-span-3 space-y-2">
                {/* Map through available locations from settings */}
                {availableLocations
                  .filter(location => location.status === "Active")
                  .filter(location => currentLocation === "all" || currentLocation === location.id)
                  .filter(location => user?.role === "ADMIN" || location.id !== "home") // Hide home service for staff users
                  .map(location => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={location.id}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={(checked) => handleLocationChange(location.id, checked as boolean)}
                      />
                      <Label htmlFor={location.id}>{location.name}</Label>
                    </div>
                  ))
                }

                {/* Add All Locations option for super admins */}
                {user?.role === "super_admin" && role === "super_admin" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all"
                      checked={selectedLocations.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLocations(["all"])
                        } else {
                          setSelectedLocations([])
                        }
                      }}
                    />
                    <Label htmlFor="all">All Locations</Label>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Home Service</Label>
              <div className="col-span-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homeService"
                    checked={homeService}
                    onCheckedChange={(checked) => setHomeService(checked === true)}
                  />
                  <Label htmlFor="homeService">Available for home service</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Staff Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

