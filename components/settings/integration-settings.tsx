"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Mail, MessageSquare, Calendar, ShoppingCart, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SettingsStorage, Integration } from "@/lib/settings-storage"

export function IntegrationSettings() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [activeTab, setActiveTab] = useState("payment")
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false)
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [integrationToDisconnect, setIntegrationToDisconnect] = useState<string | null>(null)

  // Form state for integration credentials
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [settings, setSettings] = useState<Record<string, boolean>>({})

  // Load integrations from storage
  useEffect(() => {
    const storedIntegrations = SettingsStorage.getIntegrations()
    if (storedIntegrations.length === 0) {
      // Initialize with default integrations
      const defaultIntegrations: Integration[] = [
        {
          id: "stripe",
          name: "Stripe",
          type: "payment",
          status: "connected",
          credentials: {
            apiKey: "sk_test_•••••••••••••••••••••••••",
            webhookSecret: "whsec_••••••••••••••••••••••"
          },
          settings: {
            testMode: true
          }
        },
        {
          id: "square",
          name: "Square",
          type: "payment",
          status: "not_connected"
        },
        {
          id: "google_calendar",
          name: "Google Calendar",
          type: "calendar",
          status: "connected",
          settings: {
            twoWaySync: true,
            autoUpdate: true
          }
        },
        {
          id: "outlook",
          name: "Microsoft Outlook",
          type: "calendar",
          status: "not_connected"
        },
        {
          id: "twilio",
          name: "Twilio SMS",
          type: "messaging",
          status: "connected",
          credentials: {
            accountSid: "AC•••••••••••••••••••••••••",
            authToken: "••••••••••••••••••••••••••••",
            phoneNumber: "+1 (555) 123-4567"
          },
          settings: {
            appointmentReminders: true
          }
        },
        {
          id: "mailchimp",
          name: "Mailchimp",
          type: "messaging",
          status: "not_connected"
        },
        {
          id: "mailchimp_marketing",
          name: "Mailchimp",
          type: "marketing",
          status: "not_connected"
        },
        {
          id: "facebook",
          name: "Facebook & Instagram",
          type: "marketing",
          status: "not_connected"
        },
        {
          id: "shopify",
          name: "Shopify",
          type: "ecommerce",
          status: "not_connected"
        },
        {
          id: "woocommerce",
          name: "WooCommerce",
          type: "ecommerce",
          status: "not_connected"
        }
      ]

      setIntegrations(defaultIntegrations)
      SettingsStorage.saveIntegrations(defaultIntegrations)
    } else {
      setIntegrations(storedIntegrations)
    }
  }, [])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  // Handle connect integration
  const handleConnectIntegration = (integration: Integration) => {
    setSelectedIntegration(integration)
    setCredentials({})
    setSettings({})
    setIsConnectDialogOpen(true)
  }

  // Handle disconnect integration
  const handleDisconnectIntegration = (integrationId: string) => {
    setIntegrationToDisconnect(integrationId)
    setIsDisconnectDialogOpen(true)
  }

  // Save integration changes
  const handleSaveIntegration = (integration: Integration) => {
    setIsSubmitting(true)

    try {
      // Update the integration in the array
      const updatedIntegrations = integrations.map(i =>
        i.id === integration.id ? integration : i
      )

      setIntegrations(updatedIntegrations)

      // Save to storage
      SettingsStorage.saveIntegrations(updatedIntegrations)

      toast({
        title: "Integration saved",
        description: "Integration settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to save integration:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save integration settings. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Connect integration
  const handleConnect = () => {
    if (!selectedIntegration) return

    setIsSubmitting(true)

    try {
      // Create updated integration object
      const updatedIntegration: Integration = {
        ...selectedIntegration,
        status: "connected",
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
        settings: Object.keys(settings).length > 0 ? settings : undefined
      }

      // Update the integration in the array
      const updatedIntegrations = integrations.map(i =>
        i.id === updatedIntegration.id ? updatedIntegration : i
      )

      setIntegrations(updatedIntegrations)

      // Save to storage
      SettingsStorage.saveIntegrations(updatedIntegrations)

      // Reset state and close dialog
      setSelectedIntegration(null)
      setCredentials({})
      setSettings({})
      setIsConnectDialogOpen(false)

      toast({
        title: "Integration connected",
        description: `${updatedIntegration.name} has been connected successfully.`,
      })
    } catch (error) {
      console.error("Failed to connect integration:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect integration. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Disconnect integration
  const handleDisconnect = () => {
    if (!integrationToDisconnect) return

    setIsSubmitting(true)

    try {
      // Find the integration
      const integration = integrations.find(i => i.id === integrationToDisconnect)

      if (integration) {
        // Create updated integration object
        const updatedIntegration: Integration = {
          ...integration,
          status: "not_connected",
          credentials: undefined,
          settings: undefined
        }

        // Update the integration in the array
        const updatedIntegrations = integrations.map(i =>
          i.id === updatedIntegration.id ? updatedIntegration : i
        )

        setIntegrations(updatedIntegrations)

        // Save to storage
        SettingsStorage.saveIntegrations(updatedIntegrations)

        toast({
          title: "Integration disconnected",
          description: `${integration.name} has been disconnected successfully.`,
        })
      }

      // Reset state and close dialog
      setIntegrationToDisconnect(null)
      setIsDisconnectDialogOpen(false)
    } catch (error) {
      console.error("Failed to disconnect integration:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to disconnect integration. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get integrations by type
  const getIntegrationsByType = (type: string) => {
    return integrations.filter(integration => integration.type === type)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="payment" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="ecommerce">E-commerce</TabsTrigger>
        </TabsList>

        <TabsContent value="payment">
          <div className="grid gap-6">
            {getIntegrationsByType("payment").map(integration => (
              <Card key={integration.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center">
                      <CreditCard className="mr-2 h-5 w-5" />
                      {integration.name}
                    </CardTitle>
                    <CardDescription>
                      {integration.id === "stripe"
                        ? "Process credit card payments and manage subscriptions"
                        : "Process in-person and online payments"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={integration.status === "connected" ? "outline" : "secondary"}
                    className="ml-auto"
                  >
                    {integration.status === "connected" ? "Connected" : "Not Connected"}
                  </Badge>
                </CardHeader>

                {integration.status === "connected" ? (
                  <>
                    <CardContent>
                      <div className="space-y-4">
                        {integration.id === "stripe" && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`${integration.id}-api-key`}>API Key</Label>
                                <Input
                                  id={`${integration.id}-api-key`}
                                  type="password"
                                  defaultValue={integration.credentials?.apiKey || ""}
                                  readOnly
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${integration.id}-webhook-secret`}>Webhook Secret</Label>
                                <Input
                                  id={`${integration.id}-webhook-secret`}
                                  type="password"
                                  defaultValue={integration.credentials?.webhookSecret || ""}
                                  readOnly
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label htmlFor={`${integration.id}-test-mode`}>Test Mode</Label>
                                <p className="text-sm text-muted-foreground">Use Stripe test environment</p>
                              </div>
                              <Switch
                                id={`${integration.id}-test-mode`}
                                checked={integration.settings?.testMode === true}
                                onCheckedChange={(checked) => {
                                  const updatedIntegration = {
                                    ...integration,
                                    settings: {
                                      ...integration.settings,
                                      testMode: checked
                                    }
                                  }
                                  handleSaveIntegration(updatedIntegration)
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <AlertDialog open={isDisconnectDialogOpen && integrationToDisconnect === integration.id} onOpenChange={(open) => {
                        setIsDisconnectDialogOpen(open)
                        if (!open) setIntegrationToDisconnect(null)
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => handleDisconnectIntegration(integration.id)}
                          >
                            Disconnect
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect {integration.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will disconnect your {integration.name} integration. You will need to reconnect and reconfigure it if you want to use it again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDisconnect}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Disconnecting...
                                </>
                              ) : (
                                "Disconnect"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        onClick={() => handleSaveIntegration(integration)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </CardFooter>
                  </>
                ) : (
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your {integration.name} account to process payments and sync inventory.
                    </p>
                    <Dialog open={isConnectDialogOpen && selectedIntegration?.id === integration.id} onOpenChange={(open) => {
                      setIsConnectDialogOpen(open)
                      if (!open) setSelectedIntegration(null)
                    }}>
                      <DialogTrigger asChild>
                        <Button onClick={() => handleConnectIntegration(integration)}>
                          Connect {integration.name}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Connect {integration.name}</DialogTitle>
                          <DialogDescription>
                            Enter your {integration.name} credentials to connect your account.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {integration.id === "stripe" && (
                            <>
                              <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="connect-api-key">API Key</Label>
                                  <Input
                                    id="connect-api-key"
                                    type="password"
                                    value={credentials.apiKey || ""}
                                    onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                                    placeholder="sk_test_..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="connect-webhook-secret">Webhook Secret</Label>
                                  <Input
                                    id="connect-webhook-secret"
                                    type="password"
                                    value={credentials.webhookSecret || ""}
                                    onChange={(e) => setCredentials({...credentials, webhookSecret: e.target.value})}
                                    placeholder="whsec_..."
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="connect-test-mode"
                                  checked={settings.testMode === true}
                                  onCheckedChange={(checked) => setSettings({...settings, testMode: checked})}
                                />
                                <Label htmlFor="connect-test-mode">Use Test Mode</Label>
                              </div>
                            </>
                          )}

                          {integration.id === "square" && (
                            <>
                              <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="connect-access-token">Access Token</Label>
                                  <Input
                                    id="connect-access-token"
                                    type="password"
                                    value={credentials.accessToken || ""}
                                    onChange={(e) => setCredentials({...credentials, accessToken: e.target.value})}
                                    placeholder="sq0atp-..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="connect-application-id">Application ID</Label>
                                  <Input
                                    id="connect-application-id"
                                    value={credentials.applicationId || ""}
                                    onChange={(e) => setCredentials({...credentials, applicationId: e.target.value})}
                                    placeholder="sq0idp-..."
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="connect-sandbox"
                                  checked={settings.sandbox === true}
                                  onCheckedChange={(checked) => setSettings({...settings, sandbox: checked})}
                                />
                                <Label htmlFor="connect-sandbox">Use Sandbox Environment</Label>
                              </div>
                            </>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>Cancel</Button>
                          <Button
                            onClick={handleConnect}
                            disabled={isSubmitting || Object.keys(credentials).length === 0}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              "Connect"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Google Calendar
                  </CardTitle>
                  <CardDescription>Sync appointments with Google Calendar</CardDescription>
                </div>
                <Badge variant="outline" className="ml-auto">
                  Connected
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="google-two-way-sync">Two-way Sync</Label>
                      <p className="text-sm text-muted-foreground">Sync appointments in both directions</p>
                    </div>
                    <Switch id="google-two-way-sync" checked={true} onCheckedChange={() => {}} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="google-auto-update">Auto Update</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically update Google Calendar when appointments change
                      </p>
                    </div>
                    <Switch id="google-auto-update" checked={true} onCheckedChange={() => {}} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Disconnect</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Microsoft Outlook
                  </CardTitle>
                  <CardDescription>Sync appointments with Outlook Calendar</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Not Connected
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Microsoft Outlook account to sync appointments.
                </p>
                <Button>Connect Outlook</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messaging">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Twilio SMS
                  </CardTitle>
                  <CardDescription>Send appointment reminders and notifications via SMS</CardDescription>
                </div>
                <Badge variant="outline" className="ml-auto">
                  Connected
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twilio-account-sid">Account SID</Label>
                      <Input id="twilio-account-sid" type="password" defaultValue="AC•••••••••••••••••••••••••" readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilio-auth-token">Auth Token</Label>
                      <Input id="twilio-auth-token" type="password" defaultValue="••••••••••••••••••••••••••••" readOnly />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twilio-phone-number">Phone Number</Label>
                    <Input id="twilio-phone-number" defaultValue="+1 (555) 123-4567" readOnly />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="twilio-appointment-reminders">Appointment Reminders</Label>
                      <p className="text-sm text-muted-foreground">Send SMS reminders for upcoming appointments</p>
                    </div>
                    <Switch id="twilio-appointment-reminders" checked={true} onCheckedChange={() => {}} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Disconnect</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5" />
                    Mailchimp
                  </CardTitle>
                  <CardDescription>Send marketing emails and newsletters</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Not Connected
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Mailchimp account to send marketing emails and newsletters.
                </p>
                <Button>Connect Mailchimp</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="marketing">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5" />
                    Mailchimp
                  </CardTitle>
                  <CardDescription>Email marketing and automation</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Not Connected
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Mailchimp account to sync client lists and send marketing campaigns.
                </p>
                <Button>Connect Mailchimp</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Facebook & Instagram
                  </CardTitle>
                  <CardDescription>Social media integration for marketing</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Not Connected
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Facebook Business account to manage your social media presence.
                </p>
                <Button>Connect Facebook</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ecommerce">
          <div className="grid gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Shopify
                  </CardTitle>
                  <CardDescription>E-commerce platform for online product sales</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Not Connected
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Shopify store to sync inventory and orders.
                </p>
                <Button>Connect Shopify</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    WooCommerce
                  </CardTitle>
                  <CardDescription>WordPress e-commerce plugin</CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Not Connected
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your WooCommerce store to sync inventory and orders.
                </p>
                <Button>Connect WooCommerce</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

