"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import {
  SettingsStorage,
  ClientNotificationSettings,
  StaffNotificationSettings,
  AdminNotificationSettings,
  NotificationTemplates
} from "@/lib/settings-storage"

export function NotificationSettings() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("client")

  // State for client notifications
  const [clientNotifications, setClientNotifications] = useState<ClientNotificationSettings>(
    SettingsStorage.getClientNotifications()
  )

  // State for staff notifications
  const [staffNotifications, setStaffNotifications] = useState<StaffNotificationSettings>(
    SettingsStorage.getStaffNotifications()
  )

  // State for admin notifications
  const [adminNotifications, setAdminNotifications] = useState<AdminNotificationSettings>(
    SettingsStorage.getAdminNotifications()
  )

  // State for notification templates
  const [templates, setTemplates] = useState<NotificationTemplates>(
    SettingsStorage.getNotificationTemplates()
  )

  // Load settings from storage
  useEffect(() => {
    setClientNotifications(SettingsStorage.getClientNotifications())
    setStaffNotifications(SettingsStorage.getStaffNotifications())
    setAdminNotifications(SettingsStorage.getAdminNotifications())
    setTemplates(SettingsStorage.getNotificationTemplates())
  }, [])

  // Handle client notification changes
  const handleClientChange = (field: string, value: boolean | string) => {
    setClientNotifications((prev) => ({ ...prev, [field]: value }))
  }

  // Handle staff notification changes
  const handleStaffChange = (field: string, value: boolean | string) => {
    setStaffNotifications((prev) => ({ ...prev, [field]: value }))
  }

  // Handle admin notification changes
  const handleAdminChange = (field: string, value: boolean | string) => {
    setAdminNotifications((prev) => ({ ...prev, [field]: value }))
  }

  // Handle template changes
  const handleTemplateChange = (field: string, value: string) => {
    setTemplates((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setIsSubmitting(true)

    try {
      // Save all notification settings to storage
      SettingsStorage.saveClientNotifications(clientNotifications)
      SettingsStorage.saveStaffNotifications(staffNotifications)
      SettingsStorage.saveAdminNotifications(adminNotifications)
      SettingsStorage.saveNotificationTemplates(templates)

      toast({
        title: "Settings saved",
        description: "Your notification settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Failed to save notification settings:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="client" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="client">Client Notifications</TabsTrigger>
          <TabsTrigger value="staff">Staff Notifications</TabsTrigger>
          <TabsTrigger value="admin">Admin Notifications</TabsTrigger>
          <TabsTrigger value="templates">Notification Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="client">
          <Card>
            <CardHeader>
              <CardTitle>Client Notifications</CardTitle>
              <CardDescription>Configure notifications sent to clients</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appointment-confirmation">Appointment Confirmation</Label>
                  <p className="text-sm text-muted-foreground">Send confirmation when a client books an appointment</p>
                </div>
                <Switch
                  id="appointment-confirmation"
                  checked={clientNotifications.appointmentConfirmation}
                  onCheckedChange={(checked) => handleClientChange("appointmentConfirmation", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appointment-reminder">Appointment Reminder</Label>
                  <p className="text-sm text-muted-foreground">Send reminder before upcoming appointments</p>
                </div>
                <Switch
                  id="appointment-reminder"
                  checked={clientNotifications.appointmentReminder}
                  onCheckedChange={(checked) => handleClientChange("appointmentReminder", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appointment-followup">Appointment Follow-up</Label>
                  <p className="text-sm text-muted-foreground">Send follow-up after completed appointments</p>
                </div>
                <Switch
                  id="appointment-followup"
                  checked={clientNotifications.appointmentFollowup}
                  onCheckedChange={(checked) => handleClientChange("appointmentFollowup", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Send promotional emails and newsletters</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={clientNotifications.marketingEmails}
                  onCheckedChange={(checked) => handleClientChange("marketingEmails", checked)}
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <Select
                  value={clientNotifications.reminderTime}
                  onValueChange={(value) => handleClientChange("reminderTime", value)}
                >
                  <SelectTrigger id="reminder-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour before</SelectItem>
                    <SelectItem value="2">2 hours before</SelectItem>
                    <SelectItem value="4">4 hours before</SelectItem>
                    <SelectItem value="24">24 hours before</SelectItem>
                    <SelectItem value="48">48 hours before</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-channels">Notification Channels</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="email-channel"
                      checked={clientNotifications.emailChannel}
                      onCheckedChange={(checked) => handleClientChange("emailChannel", checked)}
                    />
                    <Label htmlFor="email-channel">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sms-channel"
                      checked={clientNotifications.smsChannel}
                      onCheckedChange={(checked) => handleClientChange("smsChannel", checked)}
                    />
                    <Label htmlFor="sms-channel">SMS</Label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Notifications</CardTitle>
              <CardDescription>Configure notifications sent to staff members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-appointment">New Appointment</Label>
                  <p className="text-sm text-muted-foreground">Notify staff when they receive a new appointment</p>
                </div>
                <Switch
                  id="new-appointment"
                  checked={staffNotifications.newAppointment}
                  onCheckedChange={(checked) => handleStaffChange("newAppointment", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="appointment-changes">Appointment Changes</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify staff when an appointment is modified or canceled
                  </p>
                </div>
                <Switch
                  id="appointment-changes"
                  checked={staffNotifications.appointmentChanges}
                  onCheckedChange={(checked) => handleStaffChange("appointmentChanges", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-schedule">Daily Schedule</Label>
                  <p className="text-sm text-muted-foreground">Send daily schedule to staff members</p>
                </div>
                <Switch
                  id="daily-schedule"
                  checked={staffNotifications.dailySchedule}
                  onCheckedChange={(checked) => handleStaffChange("dailySchedule", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inventory-alerts">Inventory Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify staff about low inventory items</p>
                </div>
                <Switch
                  id="inventory-alerts"
                  checked={staffNotifications.inventoryAlerts}
                  onCheckedChange={(checked) => handleStaffChange("inventoryAlerts", checked)}
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="schedule-time">Daily Schedule Time</Label>
                <Select
                  value={staffNotifications.scheduleTime}
                  onValueChange={(value) => handleStaffChange("scheduleTime", value)}
                >
                  <SelectTrigger id="schedule-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5:00 AM</SelectItem>
                    <SelectItem value="6">6:00 AM</SelectItem>
                    <SelectItem value="7">7:00 AM</SelectItem>
                    <SelectItem value="8">8:00 AM</SelectItem>
                    <SelectItem value="9">9:00 AM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSubmitting}>
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
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Admin Notifications</CardTitle>
              <CardDescription>Configure notifications sent to administrators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-summary">Daily Summary</Label>
                  <p className="text-sm text-muted-foreground">Send daily business summary</p>
                </div>
                <Switch
                  id="daily-summary"
                  checked={adminNotifications.dailySummary}
                  onCheckedChange={(checked) => handleAdminChange("dailySummary", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-client">New Client Registration</Label>
                  <p className="text-sm text-muted-foreground">Notify when a new client registers</p>
                </div>
                <Switch
                  id="new-client"
                  checked={adminNotifications.newClient}
                  onCheckedChange={(checked) => handleAdminChange("newClient", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inventory-alerts-admin">Inventory Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify about low inventory items</p>
                </div>
                <Switch
                  id="inventory-alerts-admin"
                  checked={adminNotifications.inventoryAlertsAdmin}
                  onCheckedChange={(checked) => handleAdminChange("inventoryAlertsAdmin", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="staff-changes">Staff Changes</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify about staff schedule changes or time off requests
                  </p>
                </div>
                <Switch
                  id="staff-changes"
                  checked={adminNotifications.staffChanges}
                  onCheckedChange={(checked) => handleAdminChange("staffChanges", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="payment-alerts">Payment Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify about payment issues or large transactions</p>
                </div>
                <Switch
                  id="payment-alerts"
                  checked={adminNotifications.paymentAlerts}
                  onCheckedChange={(checked) => handleAdminChange("paymentAlerts", checked)}
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="summary-recipients">Summary Recipients</Label>
                <Input
                  id="summary-recipients"
                  placeholder="Enter email addresses separated by commas"
                  value={adminNotifications.summaryRecipients}
                  onChange={(e) => handleAdminChange("summaryRecipients", e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSubmitting}>
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
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>Customize notification templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="appointment-confirmation">
                <TabsList className="mb-4">
                  <TabsTrigger value="appointment-confirmation">Appointment Confirmation</TabsTrigger>
                  <TabsTrigger value="appointment-reminder">Appointment Reminder</TabsTrigger>
                  <TabsTrigger value="appointment-followup">Appointment Follow-up</TabsTrigger>
                </TabsList>

                <TabsContent value="appointment-confirmation" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmation-subject">Email Subject</Label>
                    <Input
                      id="confirmation-subject"
                      value={templates.confirmationSubject}
                      onChange={(e) => handleTemplateChange("confirmationSubject", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmation-email">Email Template</Label>
                    <Textarea
                      id="confirmation-email"
                      rows={8}
                      value={templates.confirmationEmail}
                      onChange={(e) => handleTemplateChange("confirmationEmail", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmation-sms">SMS Template</Label>
                    <Textarea
                      id="confirmation-sms"
                      rows={4}
                      value={templates.confirmationSms}
                      onChange={(e) => handleTemplateChange("confirmationSms", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Available Variables</Label>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{"{{client_name}}"} - Client's full name</p>
                      <p>{"{{service_name}}"} - Service name</p>
                      <p>{"{{appointment_date}}"} - Appointment date</p>
                      <p>{"{{appointment_time}}"} - Appointment time</p>
                      <p>{"{{staff_name}}"} - Staff member's name</p>
                      <p>{"{{location_name}}"} - Location name</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="appointment-reminder" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reminder-subject">Email Subject</Label>
                    <Input
                      id="reminder-subject"
                      value={templates.reminderSubject}
                      onChange={(e) => handleTemplateChange("reminderSubject", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reminder-email">Email Template</Label>
                    <Textarea
                      id="reminder-email"
                      rows={8}
                      value={templates.reminderEmail}
                      onChange={(e) => handleTemplateChange("reminderEmail", e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="appointment-followup" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="followup-subject">Email Subject</Label>
                    <Input
                      id="followup-subject"
                      value={templates.followupSubject}
                      onChange={(e) => handleTemplateChange("followupSubject", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="followup-email">Email Template</Label>
                    <Textarea
                      id="followup-email"
                      rows={8}
                      value={templates.followupEmail}
                      onChange={(e) => handleTemplateChange("followupEmail", e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSubmitting}>
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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

