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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, X, DollarSign, Clock, User } from "lucide-react"
import { parseISO } from "date-fns"
import { formatAppDate, formatAppTime } from "@/lib/date-utils"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"
import { useServices } from "@/lib/service-provider"
import { useCurrency } from "@/hooks/use-currency"
import { Appointment } from "@/lib/types/appointment"
import { updateAppointment } from "@/lib/appointment-service"

interface EditAppointmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
  onAppointmentUpdated?: (appointment: Appointment) => void
}

export function EditAppointmentDetailsDialog({
  open,
  onOpenChange,
  appointment,
  onAppointmentUpdated,
}: EditAppointmentDetailsDialogProps) {
  const { toast } = useToast()
  const { hasPermission } = useAuth()
  const { services } = useServices()
  const { currency } = useCurrency()

  const [formData, setFormData] = useState({
    serviceId: "",
    notes: "",
    price: 0,
    additionalServices: [] as Array<{
      id?: string
      name: string
      price: number
      duration: number
    }>,
    products: [] as Array<{
      id?: string
      name: string
      price: number
      quantity: number
    }>,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when appointment changes
  useEffect(() => {
    if (appointment) {
      const service = services.find(s => 
        s.name === appointment.service || 
        s.id === appointment.serviceId
      )
      
      setFormData({
        serviceId: service?.id || "",
        notes: appointment.notes || "",
        price: appointment.price || service?.price || 0,
        additionalServices: appointment.additionalServices || [],
        products: appointment.products || [],
      })
    }
  }, [appointment, services])

  // Get available services for the current service category
  const availableServices = useMemo(() => {
    return services.filter(service => service.isActive !== false)
  }, [services])

  // Calculate total price
  const totalPrice = useMemo(() => {
    const servicePrice = formData.price || 0
    const additionalServicesPrice = formData.additionalServices.reduce((sum, service) => sum + (service.price || 0), 0)
    const productsPrice = formData.products.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0)
    return servicePrice + additionalServicesPrice + productsPrice
  }, [formData])

  // Calculate total duration
  const totalDuration = useMemo(() => {
    const selectedService = services.find(s => s.id === formData.serviceId)
    const serviceDuration = selectedService?.duration || appointment.duration || 60
    const additionalDuration = formData.additionalServices.reduce((sum, service) => sum + (service.duration || 0), 0)
    return serviceDuration + additionalDuration
  }, [formData.serviceId, formData.additionalServices, services, appointment.duration])

  const handleServiceChange = (serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId)
    setFormData(prev => ({
      ...prev,
      serviceId,
      price: selectedService?.price || 0,
    }))
  }

  const addAdditionalService = () => {
    setFormData(prev => ({
      ...prev,
      additionalServices: [
        ...prev.additionalServices,
        { name: "", price: 0, duration: 30 }
      ]
    }))
  }

  const updateAdditionalService = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      )
    }))
  }

  const removeAdditionalService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.filter((_, i) => i !== index)
    }))
  }

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        { name: "", price: 0, quantity: 1 }
      ]
    }))
  }

  const updateProduct = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      )
    }))
  }

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!formData.serviceId) {
      toast({
        variant: "destructive",
        title: "Missing service",
        description: "Please select a service.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const selectedService = services.find(s => s.id === formData.serviceId)
      
      const updates = {
        service: selectedService?.name || appointment.service,
        serviceId: formData.serviceId,
        notes: formData.notes,
        price: formData.price,
        duration: totalDuration,
        additionalServices: formData.additionalServices.filter(service => service.name.trim() !== ""),
        products: formData.products.filter(product => product.name.trim() !== ""),
      }

      // Update the appointment
      const updatedAppointment = await updateAppointment(appointment.id, updates)

      if (updatedAppointment && onAppointmentUpdated) {
        onAppointmentUpdated(updatedAppointment)
      }

      toast({
        title: "Appointment updated",
        description: "Appointment details have been successfully updated.",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update appointment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the appointment details. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === formData.serviceId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Appointment Details</DialogTitle>
          <DialogDescription>
            Update the service, pricing, and other details for {appointment.clientName}'s appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Appointment Info */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>{appointment.clientName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <Clock className="h-4 w-4" />
              <span>{formatAppDate(appointment.date)} at {formatAppTime(appointment.date)}</span>
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label>Service</Label>
            <Select
              value={formData.serviceId}
              onValueChange={handleServiceChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{service.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                        <span>{service.duration}min</span>
                        <span>{currency.symbol}{service.price}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Price Override */}
          {hasPermission("edit_pricing") && (
            <div className="space-y-2">
              <Label>Service Price ({currency.symbol})</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          )}

          {/* Additional Services */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Additional Services</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAdditionalService}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </div>
            {formData.additionalServices.map((service, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    placeholder="Service name"
                    value={service.name}
                    onChange={(e) => updateAdditionalService(index, "name", e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={service.price}
                    onChange={(e) => updateAdditionalService(index, "price", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={service.duration}
                    onChange={(e) => updateAdditionalService(index, "duration", parseInt(e.target.value) || 0)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAdditionalService(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Products */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Products Used</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProduct}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>
            {formData.products.map((product, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    placeholder="Product name"
                    value={product.name}
                    onChange={(e) => updateProduct(index, "name", e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={product.price}
                    onChange={(e) => updateProduct(index, "price", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={product.quantity}
                    onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeProduct(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Add any notes about this appointment..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <Separator />

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Duration:</span>
              <Badge variant="outline">{totalDuration} minutes</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price:</span>
              <Badge variant="outline" className="font-mono">
                {currency.symbol}{totalPrice.toFixed(2)}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.serviceId}>
            {isSubmitting ? "Updating..." : "Update Details"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
