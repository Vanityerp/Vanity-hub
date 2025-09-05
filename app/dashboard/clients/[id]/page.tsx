"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { useClients, Client } from "@/lib/client-provider"
import { EditClientDialog } from "@/components/clients/edit-client-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// DEPRECATED: Mock data removed - now using real API data
import { ClientPreferencesCard } from "@/components/clients/client-preferences-card"
import { ClientLoyaltyCard } from "@/components/clients/client-loyalty-card"
import { ClientTimeline } from "@/components/clients/client-timeline"
import {
  ArrowLeft,
  User,
  Calendar,
  Scissors,
  ShoppingBag,
  MessageSquare,
  AlertCircle,
  Edit,
  Mail,
  Phone,
  MapPin,
  History,
  RefreshCw
} from "lucide-react"
import { parseISO } from "date-fns"
import { formatAppDate, formatAppTime } from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useCurrency } from "@/lib/currency-provider"
import { useToast } from "@/components/ui/use-toast"
import { IndividualClientCommunication } from "@/components/clients/individual-client-communication"

interface ClientProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ClientProfilePage({ params }: ClientProfilePageProps) {
  const router = useRouter()
  const { currentLocation } = useAuth()
  const { getClient } = useClients()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editDialogInitialTab, setEditDialogInitialTab] = useState<"basic" | "preferences" | "review">("basic")

  // Real data states
  const [appointments, setAppointments] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [timelineEvents, setTimelineEvents] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // Unwrap params using React.use() during render
  const unwrappedParams = use(params)
  const clientId = unwrappedParams.id

  // Load client history from API
  const loadClientHistory = async () => {
    if (!clientId || historyLoaded) return

    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/history`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
        setPurchases(data.purchases || [])
        setTimelineEvents(data.timeline || [])
        setHistoryLoaded(true)
        console.log(`Loaded client history: ${data.appointments?.length} appointments, ${data.purchases?.length} purchases`)
      } else {
        console.error('Failed to load client history:', response.status)
        toast({
          title: "Error",
          description: "Failed to load client history",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading client history:', error)
      toast({
        title: "Error",
        description: "Failed to load client history",
        variant: "destructive"
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  // Refresh client history
  const refreshClientHistory = async () => {
    setHistoryLoaded(false)
    await loadClientHistory()
  }

  // Generate timeline events from appointments and other activities
  const generateTimelineEvents = (clientId: string) => {
    // TODO: Replace with real API call to fetch client appointments
    const clientAppointments: any[] = []

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

    return timelineEvents
  }

  // Get real client preferences or use defaults
  const clientPreferences = client?.preferences || {
    preferredStylists: [],
    preferredServices: [],
    preferredProducts: [],
    allergies: [],
    notes: ""
  }

  // Fetch client data
  useEffect(() => {
    const foundClient = getClient(clientId)

    if (foundClient) {
      setClient(foundClient)
      // Load client history after client is found
      loadClientHistory()
    } else {
      // Client not found, redirect to clients page
      router.push("/dashboard/clients")
    }

    setLoading(false)
  }, [clientId, router, getClient])

  const handleClientUpdated = (updatedClient: Client) => {
    setClient(updatedClient)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading client profile...</div>
  }

  if (!client) {
    return <div className="flex items-center justify-center h-96">Client not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/dashboard/clients")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        <Button onClick={() => {
          setEditDialogInitialTab("basic")
          setIsEditDialogOpen(true)
        }}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Client
        </Button>
      </div>

      {client && (
        <EditClientDialog
          clientId={client.id}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onClientUpdated={handleClientUpdated}
          initialTab={editDialogInitialTab}
        />
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Client Profile</CardTitle>
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
              </div>
              <CardDescription>Personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className={`h-24 w-24 mb-2 ${client.color || "bg-primary/10"}`}>
                  <AvatarFallback className="text-2xl">{client.avatar}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{client.name}</h2>
                <Badge variant={client.status === "Active" ? "outline" : "secondary"}>
                  {client.status}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Preferred: {client.preferredLocation === "loc1"
                      ? "Downtown"
                      : client.preferredLocation === "loc2"
                        ? "Westside"
                        : "Northside"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Last Visit: {client.lastVisit}</span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-muted-foreground text-sm">Total Spent</p>
                  <p className="text-xl font-bold"><CurrencyDisplay amount={client.totalSpent || 0} /></p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Appointments</p>
                  <p className="text-xl font-bold">
                    {appointments.length || 0}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={refreshClientHistory}
                  disabled={loadingHistory}
                >
                  {loadingHistory ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <History className="mr-2 h-4 w-4" />
                  )}
                  {loadingHistory ? "Loading..." : "View Complete History"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {historyLoaded ?
                    `${appointments.length} appointments, ${purchases.length} purchases` :
                    "Click to load complete history"
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <ClientLoyaltyCard
              clientId={client.id}
              clientName={client.name}
              points={450}
              pointsToNextReward={50}
              tier="Gold"
              memberSince="Jan 15, 2025"
              rewardHistory={[
                {
                  id: "r1",
                  date: "Mar 15, 2025",
                  description: "Service Purchase",
                  points: 75,
                  redeemed: false
                },
                {
                  id: "r2",
                  date: "Mar 1, 2025",
                  description: "Product Purchase",
                  points: 45,
                  redeemed: false
                },
                {
                  id: "r3",
                  date: "Feb 15, 2025",
                  description: "Reward Redemption",
                  points: 250,
                  redeemed: true
                }
              ]}
            />
          </div>

          <div className="mt-6">
            <ClientPreferencesCard
              clientId={client.id}
              preferences={clientPreferences}
              onEdit={() => {
                setEditDialogInitialTab("preferences")
                setIsEditDialogOpen(true)
              }}
            />
          </div>
        </div>

        <div className="md:w-2/3 space-y-6">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <ClientTimeline
                clientId={client.id}
                events={historyLoaded ? timelineEvents : generateTimelineEvents(client.id)}
                isLoading={loadingHistory}
                onRefresh={refreshClientHistory}
              />
            </TabsContent>

            <TabsContent value="appointments">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Appointment History</CardTitle>
                      <CardDescription>All past and upcoming appointments</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshClientHistory}
                      disabled={loadingHistory}
                    >
                      {loadingHistory ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="py-6 text-center text-muted-foreground">
                      Loading appointments...
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-left font-medium">Date & Time</th>
                            <th className="py-3 px-4 text-left font-medium">Service</th>
                            <th className="py-3 px-4 text-left font-medium">Staff</th>
                            <th className="py-3 px-4 text-left font-medium">Location</th>
                            <th className="py-3 px-4 text-left font-medium">Status</th>
                            <th className="py-3 px-4 text-right font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-muted-foreground">
                                No appointments found
                              </td>
                            </tr>
                          ) : (
                            appointments
                              .map((appointment) => (
                                <tr key={appointment.id} className="border-b">
                                  <td className="py-3 px-4">
                                    {formatAppDate(appointment.date)} {formatAppTime(appointment.date)}
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium">{appointment.title || appointment.service}</p>
                                      {appointment.bookingReference && (
                                        <p className="text-xs text-muted-foreground">Ref: {appointment.bookingReference}</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">{appointment.description?.replace("with ", "") || appointment.staffName}</td>
                                  <td className="py-3 px-4">{appointment.location || "Downtown"}</td>
                                  <td className="py-3 px-4">
                                    <Badge variant={getAppointmentStatusVariant(appointment.status)}>
                                      {capitalizeFirstLetter(appointment.status)}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {appointment.amount ? <CurrencyDisplay amount={appointment.amount} /> : "-"}
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="purchases">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Purchase History</CardTitle>
                      <CardDescription>All services and products purchased</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshClientHistory}
                      disabled={loadingHistory}
                    >
                      {loadingHistory ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="py-6 text-center text-muted-foreground">
                      Loading purchases...
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-left font-medium">Date</th>
                            <th className="py-3 px-4 text-left font-medium">Description</th>
                            <th className="py-3 px-4 text-left font-medium">Type</th>
                            <th className="py-3 px-4 text-left font-medium">Payment</th>
                            <th className="py-3 px-4 text-right font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(historyLoaded ? purchases : []).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                {historyLoaded ? "No purchases found" : "Click 'View Complete History' to load purchase data"}
                              </td>
                            </tr>
                          ) : (
                            (historyLoaded ? purchases : []).map((purchase) => (
                              <tr key={purchase.id} className="border-b">
                                <td className="py-3 px-4">
                                  {format(parseISO(purchase.date), "MMM d, yyyy h:mm a")}
                                </td>
                                <td className="py-3 px-4">
                                  <div>
                                    <p className="font-medium">{purchase.description}</p>
                                    {purchase.transactionId && (
                                      <p className="text-xs text-muted-foreground">ID: {purchase.transactionId}</p>
                                    )}
                                    {purchase.items && purchase.items.length > 0 && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {purchase.items.map((item: any, idx: number) => (
                                          <span key={idx}>
                                            {item.name} (x{item.quantity})
                                            {idx < purchase.items.length - 1 ? ", " : ""}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    Product
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">{purchase.paymentMethod}</td>
                                <td className="py-3 px-4 text-right">
                                  <CurrencyDisplay amount={purchase.amount} />
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {historyLoaded && purchases.length > 0 && (
                          <tfoot>
                            <tr className="bg-muted/50">
                              <td colSpan={4} className="py-3 px-4 font-medium">Total Product Purchases</td>
                              <td className="py-3 px-4 text-right font-medium">
                                <CurrencyDisplay amount={purchases.reduce((sum, p) => sum + p.amount, 0)} />
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communication">
              <IndividualClientCommunication client={client} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getAppointmentStatusColor(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
    case "completed":
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
    case "cancelled":
      return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
    case "checked-in":
      return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800"
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
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
