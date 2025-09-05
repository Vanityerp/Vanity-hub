"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { bufferTimeConfigService, BufferTimeSettings } from "@/lib/services/buffer-time-config"
import { useServices } from "@/lib/service-provider"
import { useStaff } from "@/lib/staff-provider"
import { useLocations } from "@/lib/location-provider"

export function BufferTimeSettings() {
  const { toast } = useToast()
  const { services } = useServices()
  const { staff } = useStaff()
  const { locations } = useLocations()
  
  const [settings, setSettings] = useState<BufferTimeSettings>(bufferTimeConfigService.getSettings())
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const currentSettings = bufferTimeConfigService.getSettings()
    setSettings(currentSettings)
  }, [])

  const handleSettingsChange = (updates: Partial<BufferTimeSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    setHasChanges(true)
  }

  const handleSave = () => {
    try {
      bufferTimeConfigService.updateSettings(settings)
      setHasChanges(false)
      toast({
        title: "Settings saved",
        description: "Buffer time settings have been updated successfully.",
      })
    } catch (error) {
      console.error('Error saving buffer time settings:', error)
      toast({
        title: "Error",
        description: "Failed to save buffer time settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReset = () => {
    bufferTimeConfigService.resetToDefaults()
    setSettings(bufferTimeConfigService.getSettings())
    setHasChanges(false)
    toast({
      title: "Settings reset",
      description: "Buffer time settings have been reset to defaults.",
    })
  }

  const updateServiceBuffer = (serviceId: string, beforeMinutes: number, afterMinutes: number) => {
    const newServiceBuffers = { ...settings.serviceBuffers }
    newServiceBuffers[serviceId] = { beforeMinutes, afterMinutes }
    handleSettingsChange({ serviceBuffers: newServiceBuffers })
  }

  const updateStaffBuffer = (staffId: string, beforeMinutes: number, afterMinutes: number) => {
    const newStaffBuffers = { ...settings.staffBuffers }
    newStaffBuffers[staffId] = { beforeMinutes, afterMinutes }
    handleSettingsChange({ staffBuffers: newStaffBuffers })
  }

  const updateLocationBuffer = (locationId: string, beforeMinutes: number, afterMinutes: number) => {
    const newLocationBuffers = { ...settings.locationBuffers }
    newLocationBuffers[locationId] = { beforeMinutes, afterMinutes }
    handleSettingsChange({ locationBuffers: newLocationBuffers })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Buffer Time Settings</h2>
          <p className="text-muted-foreground">
            Configure buffer times to prevent back-to-back appointments and ensure adequate time between bookings.
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buffer Time Enforcement</CardTitle>
          <CardDescription>
            Control how buffer times are applied and enforced across the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Buffer Times</Label>
              <p className="text-sm text-muted-foreground">
                Turn on buffer time enforcement for appointments
              </p>
            </div>
            <Switch
              checked={settings.enforcement.enabled}
              onCheckedChange={(enabled) =>
                handleSettingsChange({
                  enforcement: { ...settings.enforcement, enabled }
                })
              }
            />
          </div>

          {settings.enforcement.enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Strict Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Make buffer times mandatory (cannot be overridden)
                  </p>
                </div>
                <Switch
                  checked={settings.enforcement.strictMode}
                  onCheckedChange={(strictMode) =>
                    handleSettingsChange({
                      enforcement: { ...settings.enforcement, strictMode }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Override</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow staff to override buffer time restrictions
                  </p>
                </div>
                <Switch
                  checked={settings.enforcement.allowOverride}
                  onCheckedChange={(allowOverride) =>
                    handleSettingsChange({
                      enforcement: { ...settings.enforcement, allowOverride }
                    })
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {settings.enforcement.enabled && (
        <Tabs defaultValue="global" className="space-y-4">
          <TabsList>
            <TabsTrigger value="global">Global Settings</TabsTrigger>
            <TabsTrigger value="services">Service-Specific</TabsTrigger>
            <TabsTrigger value="staff">Staff-Specific</TabsTrigger>
            <TabsTrigger value="locations">Location-Specific</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Global Buffer Times</CardTitle>
                <CardDescription>
                  Default buffer times applied to all appointments unless overridden by specific settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="global-before">Before Appointment (minutes)</Label>
                    <Input
                      id="global-before"
                      type="number"
                      min="0"
                      max="120"
                      value={settings.globalBeforeMinutes}
                      onChange={(e) =>
                        handleSettingsChange({
                          globalBeforeMinutes: parseInt(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="global-after">After Appointment (minutes)</Label>
                    <Input
                      id="global-after"
                      type="number"
                      min="0"
                      max="120"
                      value={settings.globalAfterMinutes}
                      onChange={(e) =>
                        handleSettingsChange({
                          globalAfterMinutes: parseInt(e.target.value) || 0
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service-Specific Buffer Times</CardTitle>
                <CardDescription>
                  Set custom buffer times for specific services that may require more or less time between appointments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((service) => {
                  const serviceBuffer = settings.serviceBuffers[service.id] || { beforeMinutes: 0, afterMinutes: 0 }
                  return (
                    <div key={service.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Duration: {service.duration} minutes
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Before (minutes)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="120"
                            value={serviceBuffer.beforeMinutes}
                            onChange={(e) =>
                              updateServiceBuffer(
                                service.id,
                                parseInt(e.target.value) || 0,
                                serviceBuffer.afterMinutes
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>After (minutes)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="120"
                            value={serviceBuffer.afterMinutes}
                            onChange={(e) =>
                              updateServiceBuffer(
                                service.id,
                                serviceBuffer.beforeMinutes,
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff-Specific Buffer Times</CardTitle>
                <CardDescription>
                  Set custom buffer times for individual staff members based on their working style or service requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {staff.map((member) => {
                  const staffBuffer = settings.staffBuffers[member.id] || { beforeMinutes: 0, afterMinutes: 0 }
                  return (
                    <div key={member.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Before (minutes)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="120"
                            value={staffBuffer.beforeMinutes}
                            onChange={(e) =>
                              updateStaffBuffer(
                                member.id,
                                parseInt(e.target.value) || 0,
                                staffBuffer.afterMinutes
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>After (minutes)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="120"
                            value={staffBuffer.afterMinutes}
                            onChange={(e) =>
                              updateStaffBuffer(
                                member.id,
                                staffBuffer.beforeMinutes,
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Location-Specific Buffer Times</CardTitle>
                <CardDescription>
                  Set custom buffer times for different locations based on their operational requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {locations.map((location) => {
                  const locationBuffer = settings.locationBuffers[location.id] || { beforeMinutes: 0, afterMinutes: 0 }
                  return (
                    <div key={location.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{location.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {location.address}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Before (minutes)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="120"
                            value={locationBuffer.beforeMinutes}
                            onChange={(e) =>
                              updateLocationBuffer(
                                location.id,
                                parseInt(e.target.value) || 0,
                                locationBuffer.afterMinutes
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>After (minutes)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="120"
                            value={locationBuffer.afterMinutes}
                            onChange={(e) =>
                              updateLocationBuffer(
                                location.id,
                                locationBuffer.beforeMinutes,
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
