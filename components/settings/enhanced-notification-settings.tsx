"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect } from "react"
import { Loader2, Plus, Edit, Trash2, Copy, Eye } from "lucide-react"
import { format } from "date-fns"
import {
  SettingsStorage,
  ClientNotificationSettings,
  StaffNotificationSettings,
  AdminNotificationSettings,
  NotificationTemplates,
  UnifiedTemplates,
  MessageTemplate
} from "@/lib/settings-storage"

export function EnhancedNotificationSettings() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("client")
  const [templateTab, setTemplateTab] = useState("unified")

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

  // State for legacy notification templates
  const [legacyTemplates, setLegacyTemplates] = useState<NotificationTemplates>(
    SettingsStorage.getNotificationTemplates()
  )

  // State for unified templates
  const [unifiedTemplates, setUnifiedTemplates] = useState<UnifiedTemplates>(
    SettingsStorage.getUnifiedTemplates()
  )

  // Template management states
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null)

  // Load settings from storage
  useEffect(() => {
    setClientNotifications(SettingsStorage.getClientNotifications())
    setStaffNotifications(SettingsStorage.getStaffNotifications())
    setAdminNotifications(SettingsStorage.getAdminNotifications())
    setLegacyTemplates(SettingsStorage.getNotificationTemplates())
    setUnifiedTemplates(SettingsStorage.getUnifiedTemplates())
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

  // Handle legacy template changes
  const handleLegacyTemplateChange = (field: string, value: string) => {
    setLegacyTemplates((prev) => ({ ...prev, [field]: value }))
  }

  // Handle unified template operations
  const handleCreateTemplate = (templateData: Partial<MessageTemplate>) => {
    const newTemplate: MessageTemplate = {
      id: `tpl-${Date.now()}`,
      name: templateData.name || "New Template",
      type: templateData.type || "email",
      category: templateData.category || "general",
      subject: templateData.subject,
      content: templateData.content || "",
      variables: templateData.variables || [],
      isDefault: false,
      isSystem: false,
      createdAt: new Date(),
      usageCount: 0
    }

    setUnifiedTemplates(prev => ({
      ...prev,
      templates: [...prev.templates, newTemplate]
    }))

    toast({
      title: "Template created",
      description: "Your message template has been created successfully."
    })
  }

  const handleUpdateTemplate = (templateId: string, updates: Partial<MessageTemplate>) => {
    setUnifiedTemplates(prev => ({
      ...prev,
      templates: prev.templates.map(template =>
        template.id === templateId ? { ...template, ...updates } : template
      )
    }))

    toast({
      title: "Template updated",
      description: "Your message template has been updated successfully."
    })
  }

  const handleDeleteTemplate = (templateId: string) => {
    const template = unifiedTemplates.templates.find(t => t.id === templateId)
    if (template?.isSystem) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description: "System templates cannot be deleted."
      })
      return
    }

    setUnifiedTemplates(prev => ({
      ...prev,
      templates: prev.templates.filter(template => template.id !== templateId)
    }))

    toast({
      title: "Template deleted",
      description: "The template has been deleted successfully."
    })
  }

  const handleSave = () => {
    setIsSubmitting(true)

    try {
      // Save all notification settings to storage
      SettingsStorage.saveClientNotifications(clientNotifications)
      SettingsStorage.saveStaffNotifications(staffNotifications)
      SettingsStorage.saveAdminNotifications(adminNotifications)
      SettingsStorage.saveNotificationTemplates(legacyTemplates)
      SettingsStorage.saveUnifiedTemplates(unifiedTemplates)

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

  // Get templates by category
  const getTemplatesByCategory = (category: string) => {
    return unifiedTemplates.templates.filter(template => template.category === category)
  }

  // Get templates by type
  const getTemplatesByType = (type: "email" | "sms") => {
    return unifiedTemplates.templates.filter(template => template.type === type)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="client" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="client">Client Notifications</TabsTrigger>
          <TabsTrigger value="staff">Staff Notifications</TabsTrigger>
          <TabsTrigger value="admin">Admin Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
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
                  <p className="text-sm text-muted-foreground">Send reminder before appointment</p>
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
                  <p className="text-sm text-muted-foreground">Send follow-up message after appointment</p>
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
                  <p className="text-sm text-muted-foreground">Send promotional and marketing emails</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={clientNotifications.marketingEmails}
                  onCheckedChange={(checked) => handleClientChange("marketingEmails", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <Select value={clientNotifications.reminderTime} onValueChange={(value) => handleClientChange("reminderTime", value)}>
                  <SelectTrigger id="reminder-time">
                    <SelectValue />
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
                  <p className="text-sm text-muted-foreground">Notify staff when new appointments are booked</p>
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
                  <p className="text-sm text-muted-foreground">Notify staff when appointments are modified or cancelled</p>
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
                  <p className="text-sm text-muted-foreground">Send daily schedule summary</p>
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
                  <p className="text-sm text-muted-foreground">Notify when inventory is low</p>
                </div>
                <Switch
                  id="inventory-alerts"
                  checked={staffNotifications.inventoryAlerts}
                  onCheckedChange={(checked) => handleStaffChange("inventoryAlerts", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-time">Daily Schedule Time</Label>
                <Select value={staffNotifications.scheduleTime} onValueChange={(value) => handleStaffChange("scheduleTime", value)}>
                  <SelectTrigger id="schedule-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                {isSubmitting ? "Saving..." : "Save Changes"}
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
                  <Label htmlFor="system-alerts">System Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive system-wide alerts and notifications</p>
                </div>
                <Switch
                  id="system-alerts"
                  checked={adminNotifications.systemAlerts}
                  onCheckedChange={(checked) => handleAdminChange("systemAlerts", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="daily-reports">Daily Reports</Label>
                  <p className="text-sm text-muted-foreground">Receive daily business reports</p>
                </div>
                <Switch
                  id="daily-reports"
                  checked={adminNotifications.dailyReports}
                  onCheckedChange={(checked) => handleAdminChange("dailyReports", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="staff-updates">Staff Updates</Label>
                  <p className="text-sm text-muted-foreground">Notifications about staff changes and updates</p>
                </div>
                <Switch
                  id="staff-updates"
                  checked={adminNotifications.staffUpdates}
                  onCheckedChange={(checked) => handleAdminChange("staffUpdates", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-time">Daily Report Time</Label>
                <Select value={adminNotifications.reportTime} onValueChange={(value) => handleAdminChange("reportTime", value)}>
                  <SelectTrigger id="report-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18">6:00 PM</SelectItem>
                    <SelectItem value="19">7:00 PM</SelectItem>
                    <SelectItem value="20">8:00 PM</SelectItem>
                    <SelectItem value="21">9:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>Manage all notification and communication templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="unified" value={templateTab} onValueChange={setTemplateTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="unified">All Templates</TabsTrigger>
                  <TabsTrigger value="system">System Templates</TabsTrigger>
                  <TabsTrigger value="marketing">Marketing Templates</TabsTrigger>
                  <TabsTrigger value="legacy">Legacy Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="unified" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">All Templates</h4>
                      <p className="text-sm text-muted-foreground">Manage all message templates in one place</p>
                    </div>
                    <Button onClick={() => setIsTemplateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Template
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {unifiedTemplates.templates.map((template) => (
                      <Card key={template.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{template.name}</h4>
                              <Badge variant={template.type === "email" ? "default" : "secondary"}>
                                {template.type}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {template.category}
                              </Badge>
                              {template.isSystem && (
                                <Badge variant="destructive">System</Badge>
                              )}
                              {template.isDefault && (
                                <Badge variant="outline">Default</Badge>
                              )}
                            </div>
                            {template.subject && (
                              <p className="text-sm text-muted-foreground mb-1">
                                <strong>Subject:</strong> {template.subject}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.content}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Used {template.usageCount} times</span>
                              <span>Created {format(template.createdAt, "MMM d, yyyy")}</span>
                              {template.lastUsed && (
                                <span>Last used {format(template.lastUsed, "MMM d, yyyy")}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              setPreviewTemplate(template)
                              setIsPreviewDialogOpen(true)
                            }}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditingTemplate(template)
                              setIsTemplateDialogOpen(true)
                            }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Copy className="h-3 w-3" />
                            </Button>
                            {!template.isSystem && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                  <div>
                    <h4 className="font-medium">System Templates</h4>
                    <p className="text-sm text-muted-foreground">Templates used for automated appointment notifications</p>
                  </div>

                  <div className="grid gap-4">
                    {getTemplatesByCategory("system").map((template) => (
                      <Card key={template.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{template.name}</h4>
                              <Badge variant={template.type === "email" ? "default" : "secondary"}>
                                {template.type}
                              </Badge>
                              <Badge variant="destructive">System</Badge>
                            </div>
                            {template.subject && (
                              <p className="text-sm text-muted-foreground mb-1">
                                <strong>Subject:</strong> {template.subject}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.content}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              setPreviewTemplate(template)
                              setIsPreviewDialogOpen(true)
                            }}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditingTemplate(template)
                              setIsTemplateDialogOpen(true)
                            }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="marketing" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Marketing Templates</h4>
                      <p className="text-sm text-muted-foreground">Templates for client communication and campaigns</p>
                    </div>
                    <Button onClick={() => setIsTemplateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Marketing Template
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    {unifiedTemplates.templates
                      .filter(template => !template.isSystem)
                      .map((template) => (
                        <Card key={template.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{template.name}</h4>
                                <Badge variant={template.type === "email" ? "default" : "secondary"}>
                                  {template.type}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {template.category}
                                </Badge>
                              </div>
                              {template.subject && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Subject:</strong> {template.subject}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.content}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Used {template.usageCount} times</span>
                                <span>Created {format(template.createdAt, "MMM d, yyyy")}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => {
                                setPreviewTemplate(template)
                                setIsPreviewDialogOpen(true)
                              }}>
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => {
                                setEditingTemplate(template)
                                setIsTemplateDialogOpen(true)
                              }}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="legacy" className="space-y-4">
                  <div>
                    <h4 className="font-medium">Legacy Templates</h4>
                    <p className="text-sm text-muted-foreground">Original notification templates (for backward compatibility)</p>
                  </div>

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
                          value={legacyTemplates.confirmationSubject}
                          onChange={(e) => handleLegacyTemplateChange("confirmationSubject", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmation-email">Email Template</Label>
                        <Textarea
                          id="confirmation-email"
                          rows={8}
                          value={legacyTemplates.confirmationEmail}
                          onChange={(e) => handleLegacyTemplateChange("confirmationEmail", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmation-sms">SMS Template</Label>
                        <Textarea
                          id="confirmation-sms"
                          rows={4}
                          value={legacyTemplates.confirmationSms}
                          onChange={(e) => handleLegacyTemplateChange("confirmationSms", e.target.value)}
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
                          value={legacyTemplates.reminderSubject}
                          onChange={(e) => handleLegacyTemplateChange("reminderSubject", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reminder-email">Email Template</Label>
                        <Textarea
                          id="reminder-email"
                          rows={8}
                          value={legacyTemplates.reminderEmail}
                          onChange={(e) => handleLegacyTemplateChange("reminderEmail", e.target.value)}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="appointment-followup" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="followup-subject">Email Subject</Label>
                        <Input
                          id="followup-subject"
                          value={legacyTemplates.followupSubject}
                          onChange={(e) => handleLegacyTemplateChange("followupSubject", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="followup-email">Email Template</Label>
                        <Textarea
                          id="followup-email"
                          rows={8}
                          value={legacyTemplates.followupEmail}
                          onChange={(e) => handleLegacyTemplateChange("followupEmail", e.target.value)}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
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

      {/* Template Management Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create New Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Update your message template" : "Create a reusable message template"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Welcome Message"
                  defaultValue={editingTemplate?.name || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-type">Type</Label>
                <Select defaultValue={editingTemplate?.type || "email"}>
                  <SelectTrigger id="template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-category">Category</Label>
              <Select defaultValue={editingTemplate?.category || "general"}>
                <SelectTrigger id="template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject (Email only)</Label>
              <Input
                id="template-subject"
                placeholder="Email subject line"
                defaultValue={editingTemplate?.subject || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">Message Content</Label>
              <Textarea
                id="template-content"
                placeholder="Enter your message template..."
                rows={6}
                defaultValue={editingTemplate?.content || ""}
              />
              <div className="text-xs text-muted-foreground">
                Available variables: {`{{client_name}}, {{salon_name}}, {{appointment_time}}, {{service_name}}, {{staff_name}}, {{location_name}}`}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsTemplateDialogOpen(false)
              setEditingTemplate(null)
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle template save
              const formData = new FormData(document.querySelector('form') as HTMLFormElement)
              const templateData = {
                name: (document.getElementById('template-name') as HTMLInputElement)?.value,
                type: (document.querySelector('[id="template-type"]') as HTMLSelectElement)?.value as "email" | "sms",
                category: (document.querySelector('[id="template-category"]') as HTMLSelectElement)?.value,
                subject: (document.getElementById('template-subject') as HTMLInputElement)?.value,
                content: (document.getElementById('template-content') as HTMLTextAreaElement)?.value,
                variables: ["client_name", "salon_name", "appointment_time", "service_name", "staff_name", "location_name"]
              }

              if (editingTemplate) {
                handleUpdateTemplate(editingTemplate.id, templateData)
              } else {
                handleCreateTemplate(templateData)
              }

              setIsTemplateDialogOpen(false)
              setEditingTemplate(null)
            }}>
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how your template will appear to recipients
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Template Name</Label>
                  <p className="text-sm text-muted-foreground">{previewTemplate.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-muted-foreground capitalize">{previewTemplate.type}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Category</Label>
                <p className="text-sm text-muted-foreground capitalize">{previewTemplate.category}</p>
              </div>

              {previewTemplate.subject && (
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm bg-muted p-2 rounded">{previewTemplate.subject}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Message Content</Label>
                <div className="bg-muted p-4 rounded whitespace-pre-wrap text-sm">
                  {previewTemplate.content}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Available Variables</Label>
                <div className="text-xs text-muted-foreground space-y-1">
                  {previewTemplate.variables.map(variable => (
                    <p key={variable}>{`{{${variable}}}`}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
