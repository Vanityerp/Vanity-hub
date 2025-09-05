"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, X, Users } from "lucide-react"
import { format, set, isBefore, startOfDay, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { useServices } from "@/lib/service-provider"
import { useApiStaff } from "@/lib/api-staff-service"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { validateStaffAvailability } from "@/lib/appointment-service"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"
import { useLocations } from "@/lib/location-provider"
import { getFirstName } from "@/lib/female-avatars"

interface GroupAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: Date
  initialTime?: string
  initialStaffId?: string
  onAppointmentCreated?: (appointment: any) => void
}

export function GroupAppointmentDialog({
  open,
  onOpenChange,
  initialDate = new Date(),
  initialTime,
  initialStaffId,
  onAppointmentCreated,
}: GroupAppointmentDialogProps) {
  const { toast } = useToast()
  const { currency } = useCurrency()
  const { user } = useAuth()
  const { locations: storeLocations, isHomeServiceEnabled } = useLocations()

  // Get real services and staff data
  const { services, categories } = useServices()
  const { staff: realStaff, isLoading: isStaffLoading, fetchStaff } = useApiStaff()

  const [formData, setFormData] = useState({
    date: initialDate,
    time: initialTime || "10:00",
    serviceId: "",
    staffId: initialStaffId || "",
    location: "loc1",
    notes: "",
    maxParticipants: "5",
  })

  const [selectedCategory, setSelectedCategory] = useState("")

  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string; phone: string }>>([
    { id: "1", name: "", email: "", phone: "" }
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create a mapping between category IDs and names using real categories
  const categoryIdToNameMap = new Map()
  const categoryNameToIdMap = new Map()

  categories.forEach(cat => {
    categoryIdToNameMap.set(cat.id, cat.name)
    categoryNameToIdMap.set(cat.name, cat.id)
  })

  // Create a memoized filtered services array
  const computedFilteredServices = useMemo(() => {
    if (selectedCategory) {
      // Get the category name from the ID for comparison
      const selectedCategoryName = categoryIdToNameMap.get(selectedCategory);

      // Filter services by matching either category ID or category name
      return services.filter((service) => {
        // Services are stored with category names, so match by name primarily
        const matchByName = service.category === selectedCategoryName;
        const matchById = service.category === selectedCategory;

        return matchByName || matchById;
      });
    } else {
      return [];  // Return empty array when no category is selected
    }
  }, [selectedCategory, categoryIdToNameMap, services]);

  // Fetch staff data when dialog opens
  useEffect(() => {
    if (open && !isStaffLoading && realStaff.length === 0) {
      fetchStaff();
    }
  }, [open, isStaffLoading, realStaff.length, fetchStaff]);

  // Reset form when dialog opens with new initial date
  useEffect(() => {
    if (open) {
      setFormData({
        ...formData,
        date: initialDate,
        time: initialTime || "10:00",
        staffId: initialStaffId || "",
      })
      setClients([{ id: "1", name: "", email: "", phone: "" }])
    }
  }, [open, initialDate, initialTime, initialStaffId])

  const handleAddClient = () => {
    const newClientId = `client-${Date.now()}`;
    console.log("Group appointment - Adding new client with ID:", newClientId);
    setClients(prevClients => [...prevClients, {
      id: newClientId,
      name: "",
      email: "",
      phone: ""
    }])
  }

  const handleRemoveClient = (id: string) => {
    if (clients.length > 1) {
      console.log("Group appointment - Removing client with ID:", id);
      setClients(prevClients => prevClients.filter(client => client.id !== id))
    }
  }

  const handleClientChange = (id: string, field: string, value: string) => {
    console.log(`Group appointment - Client ${id} ${field} changed:`, value);
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === id ? { ...client, [field]: value } : client
      )
    )
  }

  const handleSubmit = async () => {
    // Validate form
    if (!formData.serviceId || !formData.staffId || clients.some(client => !client.name)) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill out all required fields including client names and service.",
      })
      return
    }

    // Create appointment date by combining date and time
    const [hours, minutes] = formData.time.split(":").map(Number)
    const appointmentDate = set(formData.date, { hours, minutes })

    // Validate that appointment time is in the future
    const now = new Date()
    if (isBefore(appointmentDate, now)) {
      toast({
        variant: "destructive",
        title: "Invalid appointment time",
        description: "Group appointments cannot be scheduled in the past. Please select a future time.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Get the selected service details
      const selectedService = services.find((s) => s.id === formData.serviceId)
      const selectedStaff = realStaff.find((s) => s.id === formData.staffId)

      if (!selectedService || !selectedStaff) {
        throw new Error("Service or staff not found")
      }

      // Create a new group appointment object
      const newGroupAppointment = {
        id: `group-appointment-${Date.now()}`,
        clients: clients.map(client => ({
          clientId: client.id,
          clientName: client.name,
          email: client.email,
          phone: client.phone
        })),
        staffId: formData.staffId,
        staffName: selectedStaff.name,
        service: selectedService.name,
        serviceId: selectedService.id, // Add service ID for validation
        date: format(appointmentDate, "yyyy-MM-dd'T'HH:mm:ss"),
        duration: selectedService.duration,
        status: "pending",
        location: formData.location,
        notes: formData.notes,
        maxParticipants: parseInt(formData.maxParticipants),
        type: "group"
      }

      // Validate staff availability across all locations before creating group appointment
      console.log("🔍 Validating staff availability for group appointment:", newGroupAppointment)
      const availabilityValidation = await validateStaffAvailability(newGroupAppointment)

      if (!availabilityValidation.isValid) {
        console.error("❌ Staff availability validation failed:", availabilityValidation.error)
        toast({
          variant: "destructive",
          title: "Staff unavailable",
          description: availabilityValidation.error || "The selected staff member is not available at this time.",
        })
        setIsSubmitting(false)
        return
      }

      console.log("✅ Staff availability validation passed for group appointment")

      // Call the callback with the new appointment
      if (onAppointmentCreated) {
        onAppointmentCreated(newGroupAppointment)
      }

      toast({
        title: "Group appointment created",
        description: `Group appointment for ${clients.length} clients on ${format(appointmentDate, "MMMM d, yyyy")} at ${format(appointmentDate, "h:mm a")} has been scheduled.`,
      })

      // Reset form and close dialog
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create group appointment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create the group appointment. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Group Appointment</DialogTitle>
          <DialogDescription>Schedule multiple clients for the same service.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Service Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  console.log("Group appointment - Category selected:", value);
                  setSelectedCategory(value);
                  // Reset service when category changes
                  setFormData((prevData) => ({
                    ...prevData,
                    serviceId: ""
                  }));
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => {
                  console.log("Group appointment - Service selected:", value);
                  setFormData((prevData) => ({
                    ...prevData,
                    serviceId: value
                  }));
                }}
                disabled={!selectedCategory}
              >
                <SelectTrigger id="service">
                  <SelectValue placeholder={selectedCategory ? "Select a service" : "Please select a category first"} />
                </SelectTrigger>
                <SelectContent>
                  {computedFilteredServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - <CurrencyDisplay amount={service.price} showSymbol={true} useLocaleFormat={false} /> ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedCategory && (
                <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                  Please select a service category to filter services.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => {
                  console.log("Group appointment - Location selected:", value);
                  // Reset staff selection when location changes to ensure valid staff selection
                  setFormData((prevData) => ({
                    ...prevData,
                    location: value,
                    staffId: ""
                  }));
                }}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {/* Map through locations from the location provider */}
                  {storeLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}

                  {/* Add Home Service option if enabled - only for admin users */}
                  {isHomeServiceEnabled && !storeLocations.some(loc => loc.id === "home") && user?.role === "ADMIN" && (
                    <SelectItem value="home">Home Service</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff">Staff Member</Label>
              <Select
                value={formData.staffId}
                onValueChange={(value) => {
                  console.log("Group appointment - Staff selected:", value);
                  setFormData((prevData) => ({
                    ...prevData,
                    staffId: value
                  }));
                }}
              >
                <SelectTrigger id="staff">
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {isStaffLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading staff...
                    </SelectItem>
                  ) : (
                    realStaff
                      .filter((staff) => {
                        // First check if staff is active
                        if (staff.status !== "Active") return false;

                        // For Home service location, include staff with homeService flag OR staff with "home" in their locations
                        if (formData.location === "loc4" || formData.location === "home") { // loc4 is Home Service
                          return staff.homeService === true || (staff.locations && staff.locations.includes("home"));
                        }

                        // For regular locations, check if staff is assigned to that location
                        return staff.locations && staff.locations.includes(formData.location);
                      })
                      .map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {getFirstName(staff.name)}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "MMMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date) {
                        console.log("Group appointment - Date selected:", date);
                        setFormData((prevData) => ({
                          ...prevData,
                          date
                        }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => {
                  console.log("Group appointment - Time selected:", value);
                  setFormData((prevData) => ({
                    ...prevData,
                    time: value
                  }));
                }}
              >
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 * 4 }, (_, i) => {
                    const hour = Math.floor(i / 4) + 9; // Start from 9 AM
                    const minute = (i % 4) * 15;
                    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
                    const period = hour >= 12 ? "PM" : "AM";
                    const timeValue = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                    const timeLabel = `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
                    return { value: timeValue, label: timeLabel };
                  }).map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Maximum Participants</Label>
            <Select
              value={formData.maxParticipants}
              onValueChange={(value) => {
                console.log("Group appointment - Max participants selected:", value);
                setFormData((prevData) => ({
                  ...prevData,
                  maxParticipants: value
                }));
              }}
            >
              <SelectTrigger id="maxParticipants" className="w-full">
                <SelectValue placeholder="Select max participants" />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 8, 10, 12, 15].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} participants
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Clients</Label>
              <Badge variant="outline" className="font-normal">
                <Users className="h-3 w-3 mr-1" />
                {clients.length} of {formData.maxParticipants}
              </Badge>
            </div>

            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="space-y-4">
                {clients.map((client, index) => (
                  <div key={client.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input
                      placeholder="Client name"
                      value={client.name}
                      onChange={(e) => handleClientChange(client.id, "name", e.target.value)}
                      className="col-span-2 sm:col-span-1"
                    />
                    <Input
                      placeholder="Phone number"
                      value={client.phone}
                      onChange={(e) => handleClientChange(client.id, "phone", e.target.value)}
                      className="col-span-2 sm:col-span-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveClient(client.id)}
                      disabled={clients.length === 1}
                      className="h-10 w-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleAddClient}
              disabled={clients.length >= parseInt(formData.maxParticipants)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes about this group appointment"
              value={formData.notes}
              onChange={(e) => {
                const newValue = e.target.value;
                console.log("Group appointment - Notes changed:", newValue);
                setFormData((prevData) => ({
                  ...prevData,
                  notes: newValue
                }));
              }}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Group Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
