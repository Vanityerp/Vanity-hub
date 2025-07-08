"use client"

import { useAuth } from "@/lib/auth-provider"
import { useClients } from "@/lib/client-provider"
import { useLocations } from "@/lib/location-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function RecentClients() {
  const { currentLocation } = useAuth()
  const { clients } = useClients()
  const { getLocationName } = useLocations()

  // Filter clients based on location
  const filteredClients = clients
    .filter((client) => currentLocation === "all" || client.locations.includes(currentLocation))
    .sort((a, b) => {
      // Handle cases where lastVisit might be undefined
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    })
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Clients</CardTitle>
        <CardDescription>
          {currentLocation === "all"
            ? "Clients across all locations"
            : `Clients at ${getLocationName(currentLocation)} location`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">Last visit: {client.lastVisit}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
          ))}

          {filteredClients.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No recent clients found</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

