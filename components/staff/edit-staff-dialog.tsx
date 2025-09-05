"use client"

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
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useLocations } from "@/lib/location-provider"
import { StaffStorage } from "@/lib/staff-storage"
import { useUnifiedStaff } from "@/lib/unified-staff-provider"

interface EditStaffDialogProps {
  staffId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onStaffUpdated?: (updatedStaff: any) => void
}

export function EditStaffDialog({ staffId, open, onOpenChange, onStaffUpdated }: EditStaffDialogProps) {
  const { user, currentLocation } = useAuth()
  const { toast } = useToast()
  const { locations: availableLocations, isHomeServiceEnabled } = useLocations()
  const { updateStaffMember, getStaffById } = useUnifiedStaff()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    locations: [] as string[],
    status: "Active",
    homeService: false,
    specialties: [] as string[]
  })
  const [newServiceName, setNewServiceName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Don't render if no staffId
  if (!staffId || staffId === "") {
    return null
  }

  // Fetch staff data when dialog opens
  useEffect(() => {
    if (open && staffId) {
      // Get staff data from unified provider
      const staff = getStaffById(staffId)
      if (staff) {
        setFormData({
          name: staff.name,
          email: staff.email,
          phone: staff.phone,
          role: staff.role,
          locations: staff.locations || [],
          status: staff.status,
          homeService: staff.homeService || false,
          specialties: staff.specialties || []
        })
      }
    } else if (!open) {
      // Reset form when dialog closes to prevent stale data
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        locations: [],
        status: "Active",
        homeService: false,
        specialties: []
      })
      setNewServiceName("")
      setIsSubmitting(false)
    }
  }, [open, staffId, getStaffById])

  const handleLocationChange = (location: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        locations: [...prev.locations, location]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.filter(loc => loc !== location)
      }))
    }
  }

  // Add service to staff
  const addServiceToStaff = () => {
    if (!newServiceName.trim()) return

    // Check if service already exists
    if (formData.specialties.includes(newServiceName.trim())) {
      toast({
        title: "Service already exists",
        description: "This service is already assigned to the staff member.",
        variant: "destructive",
      })
      return
    }

    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, newServiceName.trim()]
    }))
    setNewServiceName("")
  }

  // Remove service from staff
  const removeServiceFromStaff = (serviceName: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(service => service !== serviceName)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Get the existing staff data to preserve fields we don't edit
      const existingStaff = getStaffById(staffId)

      if (!existingStaff) {
        throw new Error(`Staff with ID ${staffId} not found`)
      }

      // Prepare the update data for the API
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        locations: formData.locations,
        status: formData.status,
        homeService: formData.homeService,
        specialties: formData.specialties,
      }

      console.log("Updating staff via API:", updateData)
      console.log("Staff ID:", staffId)
      console.log("Form data locations:", formData.locations)

      // Update staff via API
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error(errorData.error || `Failed to update staff: ${response.statusText}`)
      }

      const { staff: updatedStaff } = await response.json()
      console.log("Staff updated via API:", updatedStaff)
      console.log("Updated staff locations:", updatedStaff.locations)

      // Also update the local unified provider for immediate UI updates
      const localUpdatedStaff = {
        ...existingStaff,
        id: staffId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        locations: formData.locations,
        status: formData.status,
        homeService: formData.homeService,
        specialties: formData.specialties,
        avatar: formData.name.split(' ').map(n => n[0]).join(''),
      }

      // Update local state for immediate feedback
      updateStaffMember(localUpdatedStaff)

      // Dispatch a custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('staff-updated', {
          detail: { staffId, updatedStaff }
        }))
      }

      toast({
        title: "Staff updated",
        description: `${formData.name}'s information has been updated successfully.`,
      })

      // Call the callback with the updated staff data
      if (onStaffUpdated) {
        onStaffUpdated(updatedStaff)
      }

      // Add a small delay to ensure the event is processed before closing
      setTimeout(() => {
        onOpenChange(false)
      }, 100)
    } catch (error) {
      console.error("Failed to update staff:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update staff member. Please try again.",
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
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff member information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({...formData, role: value})}
              >
                <SelectTrigger id="role" className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {user?.role === "super_admin" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                  {(user?.role === "super_admin" || user?.role === "org_admin") && (
                    <SelectItem value="org_admin">Organization Admin</SelectItem>
                  )}
                  {(user?.role === "super_admin" || user?.role === "org_admin") && (
                    <SelectItem value="location_manager">Location Manager</SelectItem>
                  )}
                  <SelectItem value="stylist">Stylist</SelectItem>
                  <SelectItem value="colorist">Colorist</SelectItem>
                  <SelectItem value="barber">Barber</SelectItem>
                  <SelectItem value="nail_technician">Nail Technician</SelectItem>
                  <SelectItem value="esthetician">Esthetician</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Locations</Label>
              <div className="col-span-3 space-y-2">
                {/* Map through available locations from settings */}
                {availableLocations
                  .filter(location =>
                    location.status === "Active" &&
                    location.name !== "Home Service" &&
                    location.id !== "home"
                  )
                  .map(location => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={location.id}
                        checked={formData.locations.includes(location.id)}
                        onCheckedChange={(checked) => handleLocationChange(location.id, checked === true)}
                      />
                      <Label htmlFor={location.id}>{location.name}</Label>
                    </div>
                  ))
                }

                {/* REMOVED: Hardcoded Home Service option - now using database locations exclusively */}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Home Service</Label>
              <div className="col-span-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homeService"
                    checked={formData.homeService}
                    onCheckedChange={(checked) => setFormData({...formData, homeService: checked === true})}
                  />
                  <Label htmlFor="homeService">Available for home service</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Services</Label>
              <div className="col-span-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter service name..."
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addServiceToStaff()
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={addServiceToStaff}
                    disabled={!newServiceName.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.map((service, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <Badge variant="outline">{service}</Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeServiceFromStaff(service)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No services assigned. Use the input field above to add services.
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
