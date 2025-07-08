"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { MapPin, ShoppingCart } from "lucide-react"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { useLocations } from "@/lib/location-provider"
import { useTransactions } from "@/lib/transaction-provider"
import { TransactionSource, TransactionStatus, TransactionType } from "@/lib/transaction-types"

export function LocationPerformance() {
  const { locations, isHomeServiceEnabled } = useLocations()
  const { transactions, filterTransactions } = useTransactions()
  const [locationData, setLocationData] = useState<Array<{
    id: string;
    name: string;
    revenue: number;
    appointments: number;
    utilization: number;
    color: string;
    isOnline?: boolean;
  }>>([])

  // Colors for different locations
  const colors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-purple-100 text-purple-800",
    "bg-orange-100 text-orange-800",
    "bg-pink-100 text-pink-800",
    "bg-yellow-100 text-yellow-800",
    "bg-indigo-100 text-indigo-800",
  ]

  // Calculate real revenue data from transactions
  useEffect(() => {
    const calculateLocationRevenue = (locationId: string) => {
      const locationTransactions = transactions.filter(t =>
        t.location === locationId &&
        t.status !== TransactionStatus.CANCELLED &&
        (t.type === TransactionType.PRODUCT_SALE ||
         t.type === TransactionType.SERVICE_SALE ||
         t.type === TransactionType.INVENTORY_SALE ||
         t.type === TransactionType.INCOME)
      )
      return locationTransactions.reduce((sum, t) => sum + t.amount, 0)
    }

    const calculateLocationAppointments = (locationId: string) => {
      // For now, use a simplified calculation based on service transactions
      const serviceTransactions = transactions.filter(t =>
        t.location === locationId &&
        t.status !== TransactionStatus.CANCELLED &&
        (t.type === TransactionType.SERVICE_SALE || t.type === TransactionType.INCOME)
      )
      return serviceTransactions.length
    }

    // Generate performance data for each active location (excluding special locations)
    const activeLocations = locations.filter(loc =>
      loc.status === "Active" &&
      loc.id !== "online" &&
      loc.id !== "home"
    )
    const newLocationData = activeLocations.map((location, index) => {
      const revenue = calculateLocationRevenue(location.id)
      const appointments = calculateLocationAppointments(location.id)
      const utilization = Math.min(60 + (appointments * 2), 100) // Simple utilization calculation

      return {
        id: location.id,
        name: location.name,
        revenue,
        appointments,
        utilization,
        color: colors[index % colors.length],
      }
    })

    // Add Online location for client portal transactions (always check, don't duplicate)
    const onlineRevenue = calculateLocationRevenue("online")
    const onlineOrders = transactions.filter(t =>
      t.location === "online" &&
      t.status !== TransactionStatus.CANCELLED &&
      t.source === TransactionSource.CLIENT_PORTAL
    ).length

    // Always add online location if there's any online activity or to show it's available
    const onlineLocationIndex = newLocationData.findIndex(loc => loc.id === "online")
    if (onlineLocationIndex === -1) { // Only add if not already present
      newLocationData.push({
        id: "online",
        name: "Online Store",
        revenue: onlineRevenue,
        appointments: onlineOrders, // For online, we show orders instead of appointments
        utilization: Math.min(onlineOrders * 5, 100), // Different utilization calculation for online
        color: "bg-cyan-100 text-cyan-800",
        isOnline: true,
      })
    }

    // Add home service if enabled (always check, don't duplicate)
    if (isHomeServiceEnabled) {
      const homeRevenue = calculateLocationRevenue("home")
      const homeAppointments = calculateLocationAppointments("home")

      const homeLocationIndex = newLocationData.findIndex(loc => loc.id === "home")
      if (homeLocationIndex === -1) { // Only add if not already present
        newLocationData.push({
          id: "home",
          name: "Home Service",
          revenue: homeRevenue,
          appointments: homeAppointments,
          utilization: Math.min(60 + (homeAppointments * 2), 100),
          color: "bg-orange-100 text-orange-800",
        })
      }
    }

    console.log('📍 LOCATION PERFORMANCE: Updated location data:', {
      totalLocations: newLocationData.length,
      onlineRevenue,
      onlineOrders,
      locationData: newLocationData.map(l => ({ id: l.id, name: l.name, revenue: l.revenue, appointments: l.appointments }))
    })

    setLocationData(newLocationData)
  }, [locations, isHomeServiceEnabled, transactions])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Location Performance</CardTitle>
        <p className="text-sm text-muted-foreground">Performance metrics across all salon locations.</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="revenue">
          <TabsList className="mb-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <div className="space-y-6">
              {locationData.map((location) => (
                <div key={location.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full ${location.color} flex items-center justify-center`}>
                        {location.isOnline ? (
                          <ShoppingCart className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </div>
                      <p className="font-medium">{location.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium"><CurrencyDisplay amount={location.revenue} /></p>
                    </div>
                  </div>
                  <Progress value={(location.revenue / 15000) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <div className="space-y-6">
              {locationData.map((location) => (
                <div key={location.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full ${location.color} flex items-center justify-center`}>
                        {location.isOnline ? (
                          <ShoppingCart className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </div>
                      <p className="font-medium">{location.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {location.appointments} {location.isOnline ? 'orders' : 'appointments'}
                      </p>
                    </div>
                  </div>
                  <Progress value={(location.appointments / 150) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="utilization">
            <div className="space-y-6">
              {locationData.map((location) => (
                <div key={location.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full ${location.color} flex items-center justify-center`}>
                        {location.isOnline ? (
                          <ShoppingCart className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </div>
                      <p className="font-medium">{location.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{location.utilization}%</p>
                    </div>
                  </div>
                  <Progress value={location.utilization} className="h-2" />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

