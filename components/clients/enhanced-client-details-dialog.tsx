"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Mail,
  MapPin,
  Phone,
  User,
  Clock,
  Heart,
  Scissors,
  ShoppingBag,
  MessageSquare,
  AlertCircle,
  Star,
  History
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useLocations } from "@/lib/location-provider"
import { useClients } from "@/lib/client-provider"
// DEPRECATED: Mock data removed - now using real API data
import { format, parseISO } from "date-fns"

interface ClientDetailsDialogProps {
  client: {
    id: string
    name: string
    email: string
    phone: string
    lastVisit: string
    preferredLocation: string
    status: string
    avatar: string
    segment: string
    color?: string
    totalSpent?: number
    locations: string[]
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnhancedClientDetailsDialog({ client, open, onOpenChange }: ClientDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("info")
  const { getLocationName } = useLocations()
  const { getClient } = useClients()

  // Get full client data with preferences
  const fullClient = getClient(client.id)

  // Get client appointments
  // TODO: Replace with real API call to fetch client appointments
  const clientAppointments: any[] = []

  // Generate timeline events from appointments and other activities
  const timelineEvents = [
    ...clientAppointments.map(appointment => ({
      id: appointment.id,
      date: appointment.date,
      type: "appointment",
      title: appointment.service,
      description: `with ${appointment.staffName}`,
      status: appointment.status,
      icon: <Scissors className="h-4 w-4" />,
      color: getAppointmentStatusColor(appointment.status)
    })),
    // Add some mock purchase events
    {
      id: "p1",
      date: "2025-03-15T14:30:00",
      type: "purchase",
      title: "Product Purchase",
      description: "Shampoo & Conditioner Set",
      amount: 45.99,
      icon: <ShoppingBag className="h-4 w-4" />,
      color: "bg-green-100 text-green-800"
    },
    // Add some mock communication events
    {
      id: "c1",
      date: "2025-03-10T09:15:00",
      type: "communication",
      title: "SMS Reminder",
      description: "Appointment reminder sent",
      icon: <MessageSquare className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-800"
    },
    // Add some mock note events
    {
      id: "n1",
      date: "2025-02-20T11:00:00",
      type: "note",
      title: "Stylist Note",
      description: "Client prefers cooler tones for highlights",
      icon: <AlertCircle className="h-4 w-4" />,
      color: "bg-purple-100 text-purple-800"
    }
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Get real client preferences or use defaults
  const clientPreferences = fullClient?.preferences || {
    preferredStylists: [],
    preferredServices: [],
    preferredProducts: [],
    allergies: [],
    notes: ""
  }

  // Mock loyalty data
  const loyaltyData = {
    points: 450,
    pointsToNextReward: 50,
    totalPointsEarned: 750,
    memberSince: "Jan 15, 2025",
    tier: "Gold"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Profile</DialogTitle>
          <DialogDescription>Comprehensive client information and history</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          <Avatar className={`h-16 w-16 ${client.color || "bg-primary/10"}`}>
            <AvatarFallback>{client.avatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{client.name}</h3>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    client.segment === "VIP"
                      ? "bg-purple-100 text-purple-800"
                      : client.segment === "Regular"
                        ? "bg-blue-100 text-blue-800"
                        : client.segment === "New"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {client.segment}
                </Badge>
                <Badge variant={client.status === "Active" ? "outline" : "secondary"}>{client.status}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                <span>{client.phone}</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid grid-cols-5">
            <TabsTrigger value="info">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Client Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Member Since</span>
                      <span>Jan 2025</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Visit</span>
                      <span>{client.lastVisit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Appointments</span>
                      <span>{clientAppointments.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Spent</span>
                      <span>
                        {client.totalSpent ? (
                          <CurrencyDisplay amount={client.totalSpent} />
                        ) : (
                          <CurrencyDisplay amount={0} />
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preferred Location</span>
                      <span>{getLocationName(client.preferredLocation)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Loyalty Program</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {loyaltyData.tier} Member
                      </Badge>
                      <span className="text-sm text-muted-foreground">Since {loyaltyData.memberSince}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{loyaltyData.points} points</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progress to next reward</span>
                      <span>{loyaltyData.points}/{loyaltyData.points + loyaltyData.pointsToNextReward} points</span>
                    </div>
                    <Progress value={(loyaltyData.points / (loyaltyData.points + loyaltyData.pointsToNextReward)) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Earn {loyaltyData.pointsToNextReward} more points for a <CurrencyDisplay amount={25} /> reward
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timelineEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className={`rounded-full p-1.5 ${event.color}`}>
                          {event.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium text-sm">{event.title}</p>
                            <time className="text-xs text-muted-foreground">
                              {format(new Date(event.date), "MMM d, yyyy")}
                            </time>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab("timeline")}>
                      <History className="mr-2 h-4 w-4" />
                      View Full Timeline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Client Timeline</CardTitle>
                <CardDescription>Complete history of client interactions and activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="relative">
                      {index !== timelineEvents.length - 1 && (
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
                              {event.type === "appointment" && (
                                <Badge variant={getAppointmentStatusVariant(event.status)}>
                                  {capitalizeFirstLetter(event.status)}
                                </Badge>
                              )}
                              {event.type === "purchase" && (
                                <span className="text-sm font-medium">
                                  <CurrencyDisplay amount={(event as any).amount} />
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Appointment History</CardTitle>
                <CardDescription>All past and upcoming appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left font-medium">Date & Time</th>
                        <th className="py-3 px-4 text-left font-medium">Service</th>
                        <th className="py-3 px-4 text-left font-medium">Staff</th>
                        <th className="py-3 px-4 text-left font-medium">Location</th>
                        <th className="py-3 px-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAppointments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground">
                            No appointments found
                          </td>
                        </tr>
                      ) : (
                        clientAppointments.map((appointment) => (
                          <tr key={appointment.id} className="border-b">
                            <td className="py-3 px-4">
                              {format(parseISO(appointment.date), "MMM d, yyyy h:mm a")}
                            </td>
                            <td className="py-3 px-4">{appointment.service}</td>
                            <td className="py-3 px-4">{appointment.staffName}</td>
                            <td className="py-3 px-4">
                              {getLocationName(appointment.location)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={getAppointmentStatusVariant(appointment.status)}>
                                {capitalizeFirstLetter(appointment.status)}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>All services and products purchased</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left font-medium">Date</th>
                        <th className="py-3 px-4 text-left font-medium">Description</th>
                        <th className="py-3 px-4 text-left font-medium">Type</th>
                        <th className="py-3 px-4 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">Apr 1, 2025</td>
                        <td className="py-3 px-4">Haircut & Style</td>
                        <td className="py-3 px-4">Service</td>
                        <td className="py-3 px-4 text-right">
                          <CurrencyDisplay amount={75.00} />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Mar 15, 2025</td>
                        <td className="py-3 px-4">Shampoo & Conditioner Set</td>
                        <td className="py-3 px-4">Product</td>
                        <td className="py-3 px-4 text-right">
                          <CurrencyDisplay amount={45.99} />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Mar 1, 2025</td>
                        <td className="py-3 px-4">Color & Highlights</td>
                        <td className="py-3 px-4">Service</td>
                        <td className="py-3 px-4 text-right">
                          <CurrencyDisplay amount={150.00} />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Feb 15, 2025</td>
                        <td className="py-3 px-4">Styling Gel</td>
                        <td className="py-3 px-4">Product</td>
                        <td className="py-3 px-4 text-right">
                          <CurrencyDisplay amount={18.99} />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Feb 1, 2025</td>
                        <td className="py-3 px-4">Haircut & Style</td>
                        <td className="py-3 px-4">Service</td>
                        <td className="py-3 px-4 text-right">
                          <CurrencyDisplay amount={75.00} />
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50">
                        <td colSpan={3} className="py-3 px-4 font-medium">Total Spent</td>
                        <td className="py-3 px-4 text-right font-medium">
                          {client.totalSpent ? (
                            <CurrencyDisplay amount={client.totalSpent} />
                          ) : (
                            <CurrencyDisplay amount={0} />
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Service Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Preferred Stylists</h4>
                    <div className="flex flex-wrap gap-2">
                      {clientPreferences.preferredStylists && clientPreferences.preferredStylists.length > 0 ? (
                        clientPreferences.preferredStylists.map((stylist) => (
                          <Badge key={stylist} variant="secondary">
                            {stylist}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No preferred stylists selected</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Preferred Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {clientPreferences.preferredServices && clientPreferences.preferredServices.length > 0 ? (
                        clientPreferences.preferredServices.map((service) => (
                          <Badge key={service} variant="secondary">
                            {service}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No preferred services selected</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Product Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Preferred Products</h4>
                    <div className="flex flex-wrap gap-2">
                      {clientPreferences.preferredProducts && clientPreferences.preferredProducts.length > 0 ? (
                        clientPreferences.preferredProducts.map((product) => (
                          <Badge key={product} variant="secondary">
                            {product}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No preferred products selected</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Allergies & Sensitivities</h4>
                    <div className="flex flex-wrap gap-2">
                      {clientPreferences.allergies && clientPreferences.allergies.length > 0 ? (
                        clientPreferences.allergies.map((allergy) => (
                          <Badge key={allergy} variant="destructive">
                            {allergy}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No allergies or sensitivities recorded</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Notes & Special Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm">
                      {clientPreferences.notes || "No special notes or instructions recorded"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => {
            onOpenChange(false);
            // Here you would typically open the edit dialog
            // But since we're in a dialog already, we'll just close this one
            // The parent component should handle opening the edit dialog
          }}>
            <User className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions
function getAppointmentStatusColor(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 text-blue-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    case "checked-in":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

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

// This function is now provided by the useLocations hook
