"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Scissors,
  ShoppingBag,
  MessageSquare,
  AlertCircle,
  Calendar,
  Clock,
  Filter
} from "lucide-react"
import { format, parseISO } from "date-fns"
// DEPRECATED: Mock data removed - now using real API data
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencyDisplay } from "@/components/ui/currency-display"

interface TimelineEvent {
  id: string
  date: string
  type: "appointment" | "purchase" | "communication" | "note"
  title: string
  description: string
  status?: string
  amount?: number
  icon: React.ReactNode
  color: string
}

interface ClientTimelineProps {
  clientId: string
  events: TimelineEvent[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function ClientTimeline({ clientId, events: initialEvents, isLoading = false, onRefresh }: ClientTimelineProps) {
  const [filterType, setFilterType] = useState<string>("all")
  const [events, setEvents] = useState<TimelineEvent[]>(initialEvents)

  // Update events when initialEvents change
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  // Filter events based on selected type
  const filteredEvents = filterType === "all"
    ? events
    : events.filter(event => event.type === filterType)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Client Timeline</CardTitle>
            <CardDescription>Complete history of client interactions</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="appointment">Appointments</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
              </SelectContent>
            </Select>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                {isLoading ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading timeline events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No timeline events found
          </div>
        ) : (
          <div className="space-y-8">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="relative">
                {index !== filteredEvents.length - 1 && (
                  <div className="absolute top-7 left-3.5 bottom-0 w-px bg-border" />
                )}
                <div className="flex gap-4">
                  <div className={`rounded-full p-1.5 z-10 ${event.color}`}>
                    {event.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.type === "appointment" && event.status && (
                          <Badge variant={getAppointmentStatusVariant(event.status)}>
                            {capitalizeFirstLetter(event.status)}
                          </Badge>
                        )}
                        {event.type === "purchase" && event.amount && (
                          <span className="text-sm font-medium">
                            <CurrencyDisplay amount={event.amount} />
                          </span>
                        )}
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(event.date), "MMM d, yyyy h:mm a")}
                        </time>
                      </div>
                    </div>

                    {event.type === "appointment" && (
                      <div className="mt-2 text-sm bg-muted/50 p-2 rounded">
                        <p>Service: {event.title}</p>
                        <p>Staff: {event.description.replace("with ", "")}</p>
                        <p>Location: {getLocationName(getAppointmentLocation(event.id))}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper functions
function getAppointmentStatusVariant(status: string) {
  switch (status) {
    case "confirmed":
      return "outline"
    case "completed":
      return "default"
    case "cancelled":
      return "destructive"
    case "checked-in":
      return "secondary"
    default:
      return "outline"
  }
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function getAppointmentLocation(appointmentId: string) {
  // TODO: Replace with real API call to fetch appointment location
  return "unknown"
}

function getLocationName(locationId: string) {
  switch (locationId) {
    case "loc1":
      return "D-Ring Road"
    case "loc2":
      return "Muaither"
    case "loc3":
      return "Medinat Khalifa"
    case "home":
      return "Home Service"
    default:
      return "Unknown"
  }
}
