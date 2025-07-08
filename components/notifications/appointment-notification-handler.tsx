"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { useRealTimeEvent } from "@/hooks/use-real-time-updates"
import { RealTimeEventType } from "@/lib/real-time-service"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Button } from "@/components/ui/button"
import { Calendar, Eye } from "lucide-react"
import { format } from "date-fns"

interface AppointmentNotificationHandlerProps {
  onViewAppointment?: (appointmentId: string) => void
}

export function AppointmentNotificationHandler({
  onViewAppointment
}: AppointmentNotificationHandlerProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  // Subscribe to appointment created events
  useRealTimeEvent(
    RealTimeEventType.APPOINTMENT_CREATED,
    (payload, event) => {
      // Only show notifications for admin users
      if (!user || user.role !== "ADMIN") {
        return
      }

      console.log("📅 New appointment notification received:", payload)

      const {
        clientName,
        service,
        date,
        amount,
        bookingReference,
        appointment
      } = payload

      // Format the date for display
      let formattedDate = "Unknown date"
      try {
        if (date) {
          const appointmentDate = new Date(date)
          formattedDate = format(appointmentDate, "MMM d, yyyy 'at' h:mm a")
        }
      } catch (error) {
        console.error("Error formatting appointment date:", error)
      }

      // Show toast notification
      toast({
        title: "📅 New Booking Received!",
        description: (
          <div className="space-y-3">
            <p>
              <strong>{clientName}</strong> booked an appointment
            </p>
            <p className="text-sm text-muted-foreground">
              {service} • {formattedDate}
            </p>
            {bookingReference && (
              <p className="text-xs text-muted-foreground">
                Ref: {bookingReference}
              </p>
            )}
            {amount && (
              <div className="font-semibold">
                <CurrencyDisplay amount={amount} />
              </div>
            )}
            <div className="flex gap-2">
              {onViewAppointment && appointment?.id && (
                <Button
                  size="sm"
                  onClick={() => onViewAppointment(appointment.id)}
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  View Calendar
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Navigate to appointments page
                  window.location.href = '/dashboard/appointments'
                }}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                View All
              </Button>
            </div>
          </div>
        ),
        duration: 15000, // Show for 15 seconds
      })

      // Play notification sound (optional)
      try {
        // Create a subtle notification sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } catch (error) {
        // Ignore audio errors - not critical
        console.log("Could not play notification sound:", error)
      }
    },
    [user, toast, onViewAppointment]
  )

  // Subscribe to appointment status changes
  useRealTimeEvent(
    RealTimeEventType.APPOINTMENT_STATUS_CHANGED,
    (payload, event) => {
      // Only show notifications for admin users
      if (!user || user.role !== "ADMIN") {
        return
      }

      console.log("📋 Appointment status changed:", payload)

      const { appointment, newStatus, previousStatus } = payload

      // Only show notifications for significant status changes
      if (newStatus === 'cancelled' || newStatus === 'completed') {
        toast({
          title: `Appointment ${newStatus === 'cancelled' ? 'Cancelled' : 'Completed'}`,
          description: `${appointment.clientName}'s appointment has been ${newStatus}.`,
          duration: 5000,
        })
      }
    },
    [user, toast]
  )

  // This component doesn't render anything visible
  return null
}
