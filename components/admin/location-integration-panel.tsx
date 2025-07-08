"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, MapPin, Users, Briefcase, CheckCircle, AlertCircle, RotateCw } from "lucide-react"

interface LocationStats {
  totalServices: number
  totalLocations: number
  totalRelationships: number
  expectedRelationships: number
  completionPercentage: number
  servicesWithoutLocations: number
  locationsWithoutServices: number
  needsSync: boolean
}

interface StaffStats {
  totalStaff: number
  totalLocations: number
  totalAssignments: number
  staffWithoutLocations: number
  locationsWithoutStaff: number
  needsSync: boolean
}

export function LocationIntegrationPanel() {
  const { toast } = useToast()
  const [serviceStats, setServiceStats] = useState<LocationStats | null>(null)
  const [staffStats, setStaffStats] = useState<StaffStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadStats = async () => {
    try {
      setLoading(true)
      const [serviceResponse, staffResponse] = await Promise.all([
        fetch("/api/sync-service-locations"),
        fetch("/api/sync-staff-locations")
      ])

      if (serviceResponse.ok) {
        const serviceData = await serviceResponse.json()
        setServiceStats(serviceData.statistics)
      }

      if (staffResponse.ok) {
        const staffData = await staffResponse.json()
        setStaffStats(staffData.statistics)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load location integration statistics"
      })
    } finally {
      setLoading(false)
    }
  }

  const syncServiceLocations = async () => {
    try {
      setSyncing(true)
      const response = await fetch("/api/sync-service-locations", {
        method: "POST"
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Sync Complete",
          description: `Created ${result.stats.relationshipsCreated} new service-location relationships`
        })
        await loadStats()
      } else {
        throw new Error("Sync failed")
      }
    } catch (error) {
      console.error("Error syncing service locations:", error)
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Failed to sync service-location relationships"
      })
    } finally {
      setSyncing(false)
    }
  }

  const syncStaffLocations = async () => {
    try {
      setSyncing(true)
      const response = await fetch("/api/sync-staff-locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mode: "auto" })
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Sync Complete",
          description: `Created ${result.stats.assignmentsCreated} new staff-location assignments`
        })
        await loadStats()
      } else {
        throw new Error("Sync failed")
      }
    } catch (error) {
      console.error("Error syncing staff locations:", error)
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: "Failed to sync staff-location assignments"
      })
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading location integration statistics...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Integration Management
          </CardTitle>
          <CardDescription>
            Monitor and manage relationships between services, staff, and locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Button onClick={loadStats} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
          </div>

          <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Staff
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4">
              {serviceStats && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Services</p>
                            <p className="text-2xl font-bold">{serviceStats.totalServices}</p>
                          </div>
                          <Briefcase className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Locations</p>
                            <p className="text-2xl font-bold">{serviceStats.totalLocations}</p>
                          </div>
                          <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Relationships</p>
                            <p className="text-2xl font-bold">
                              {serviceStats.totalRelationships}/{serviceStats.expectedRelationships}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {serviceStats.needsSync ? (
                              <AlertCircle className="h-8 w-8 text-orange-500" />
                            ) : (
                              <CheckCircle className="h-8 w-8 text-green-500" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Integration Progress</span>
                          <Badge variant={serviceStats.completionPercentage === 100 ? "success" : "secondary"}>
                            {serviceStats.completionPercentage}%
                          </Badge>
                        </div>
                        <Progress value={serviceStats.completionPercentage} className="w-full" />
                        
                        {serviceStats.needsSync && (
                          <div className="flex items-center justify-between pt-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {serviceStats.servicesWithoutLocations} services need location assignments
                              </p>
                            </div>
                            <Button 
                              onClick={syncServiceLocations} 
                              disabled={syncing}
                              className="flex items-center gap-2"
                            >
                              <RotateCw className="h-4 w-4" />
                              {syncing ? "Syncing..." : "Sync Now"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="staff" className="space-y-4">
              {staffStats && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Staff Members</p>
                            <p className="text-2xl font-bold">{staffStats.totalStaff}</p>
                          </div>
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Locations</p>
                            <p className="text-2xl font-bold">{staffStats.totalLocations}</p>
                          </div>
                          <MapPin className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Assignments</p>
                            <p className="text-2xl font-bold">{staffStats.totalAssignments}</p>
                          </div>
                          <div className="flex items-center">
                            {staffStats.needsSync ? (
                              <AlertCircle className="h-8 w-8 text-orange-500" />
                            ) : (
                              <CheckCircle className="h-8 w-8 text-green-500" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {staffStats.needsSync && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Staff Without Location Assignments</p>
                            <p className="text-sm text-muted-foreground">
                              {staffStats.staffWithoutLocations} staff members need location assignments
                            </p>
                          </div>
                          <Button 
                            onClick={syncStaffLocations} 
                            disabled={syncing}
                            className="flex items-center gap-2"
                          >
                            <RotateCw className="h-4 w-4" />
                            {syncing ? "Syncing..." : "Auto-Assign"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
