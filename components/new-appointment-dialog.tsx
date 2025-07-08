"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useApiStaff } from "@/lib/api-staff-service"
import { getFirstName } from "@/lib/female-avatars"
import { useServices } from "@/lib/service-provider"
import { useClients } from "@/lib/client-provider"

interface NewAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewAppointmentDialog({ open, onOpenChange }: NewAppointmentDialogProps) {
  const { currentLocation } = useAuth()

  // Fetch real staff data from HR system
  const { staff: realStaff, isLoading: isStaffLoading, fetchStaff } = useApiStaff()

  // Use real services and categories from service provider
  const { services, categories, refreshServices, refreshCategories } = useServices()

  // Use real client data from client provider
  const { clients: realClients } = useClients()

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState("10:00")
  const [clientId, setClientId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [staffId, setStaffId] = useState("")

  // Debug log to verify we're using REAL staff data from HR system
  useEffect(() => {
    console.log("NewAppointmentDialog - Using REAL staff from HR system");
    console.log("NewAppointmentDialog - Total Real Staff Count:", realStaff.length);
    console.log("NewAppointmentDialog - Real Staff Names:", realStaff.map(s => s.name));

    // Verify we have real staff data (should be exactly 7 real staff members)
    if (realStaff.length === 0) {
      console.warn("⚠️ NewAppointmentDialog - No staff data found! Check HR staff management system.");
    } else if (realStaff.length !== 7) {
      console.warn(`⚠️ NewAppointmentDialog - Expected 7 real staff members, found ${realStaff.length}. Check HR system.`);
    } else {
      console.log("✅ NewAppointmentDialog - Using correct number of real staff members (7)");
    }
  }, [realStaff])

  // Fetch staff data and refresh services when dialog opens
  useEffect(() => {
    if (open) {
      if (!isStaffLoading && realStaff.length === 0) {
        fetchStaff();
      }
      // Refresh services and categories to ensure we have the latest data
      Promise.all([
        refreshServices(),
        refreshCategories()
      ]).catch(err => {
        console.error("Error refreshing services/categories:", err)
      })
    }
  }, [open, isStaffLoading, realStaff.length, fetchStaff, refreshServices, refreshCategories]);

  // Filter clients, services, and staff based on location
  const filteredClients = realClients.filter(
    (client) => currentLocation === "all" || client.locations?.includes(currentLocation),
  )

  const filteredServices = services.filter(
    (service) => currentLocation === "all" || !service.locations || service.locations.includes(currentLocation),
  )

  const filteredStaff = realStaff.filter(
    (staff) => {
      // First check if staff is active
      if (staff.status !== "Active") return false;

      // For regular locations, check if staff is assigned to that location
      if (currentLocation !== "all" && currentLocation !== "home") {
        return staff.locations && staff.locations.includes(currentLocation);
      }
      // For Home service location, only admin users can access
      else if (currentLocation === "home") {
        // Staff users cannot access home service
        if (user && user.role !== "ADMIN") {
          return false;
        }
        return staff.homeService === true || (staff.locations && staff.locations.includes("home"));
      }
      // For "all" locations, include all staff
      return true;
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would create a new appointment via API
    const selectedDateTime = new Date(date!)
    const [hours, minutes] = time.split(':')
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes))

    const selectedService = services.find(service => service.id === serviceId)
    const selectedClient = realClients.find(client => client.id === clientId)
    const selectedStaff = realStaff.find(staff => staff.id === staffId)

    if (!selectedService || !selectedClient || !selectedStaff) return

    const newAppointment = {
      id: Math.random().toString(36).substring(7),
      clientId,
      clientName: selectedClient.name,
      date: selectedDateTime.toISOString(),
      service: selectedService.name,
      serviceId: selectedService.id, // Add service ID for proper validation
      duration: selectedService.duration,
      staffId,
      staffName: selectedStaff.name,
      location: currentLocation,
      status: 'pending' as const,
      statusHistory: [
        {
          status: 'pending' as const,
          timestamp: new Date().toISOString(),
          updatedBy: 'system'
        }
      ],
      price: selectedService.price
    }

    console.log(newAppointment)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
            <DialogDescription>Create a new appointment for a client.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client" className="text-right">
                Client
              </Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger id="client" className="col-span-3">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service" className="text-right">
                Service
              </Label>
              <Select value={serviceId} onValueChange={setServiceId} required>
                <SelectTrigger id="service" className="col-span-3">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {filteredServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staff" className="text-right">
                Staff
              </Label>
              <Select value={staffId} onValueChange={setStaffId} required>
                <SelectTrigger id="staff" className="col-span-3">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {isStaffLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading staff...
                    </SelectItem>
                  ) : (
                    filteredStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {getFirstName(staff.name)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="col-span-3 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <div className="col-span-3">
                <Select value={time} onValueChange={setTime} required>
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i + 9
                      if (hour >= 9 && hour <= 19) {
                        return [
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"}
                          </SelectItem>,
                          <SelectItem key={`${hour}:30`} value={`${hour}:30`}>
                            {hour > 12 ? hour - 12 : hour}:30 {hour >= 12 ? "PM" : "AM"}
                          </SelectItem>,
                        ]
                      }
                      return null
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Appointment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

