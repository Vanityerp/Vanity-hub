"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useClients } from "@/lib/client-provider"
import { useLegacyTemplates } from "@/lib/use-templates"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { 
  Mail, 
  MessageSquare, 
  Send, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  BarChart3,
  Settings,
  Copy,
  Download,
  Upload,
  Star,
  Heart,
  Gift,
  Bell,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap
} from "lucide-react"

interface CommunicationTemplate {
  id: string
  name: string
  type: "email" | "sms"
  subject?: string
  content: string
  category: string
  isDefault: boolean
  variables: string[]
  createdAt: Date
  lastUsed?: Date
  usageCount: number
}

interface CommunicationHistory {
  id: string
  type: "email" | "sms"
  subject?: string
  content: string
  recipients: string[]
  recipientCount: number
  segment: string
  status: "draft" | "scheduled" | "sending" | "sent" | "failed"
  scheduledFor?: Date
  sentAt?: Date
  openRate?: number
  clickRate?: number
  deliveryRate?: number
  createdBy: string
  createdAt: Date
}

interface AutomationRule {
  id: string
  name: string
  trigger: "birthday" | "appointment_reminder" | "follow_up" | "no_visit" | "first_visit"
  template: string
  isActive: boolean
  conditions: any
  lastRun?: Date
  totalSent: number
}

export function EnhancedClientCommunication() {
  const { toast } = useToast()
  const { clients } = useClients()
  const { templates, loading: templatesLoading, updateTemplateUsage } = useLegacyTemplates()
  const [activeTab, setActiveTab] = useState("campaigns")

  // Campaign states
  const [selectedTemplate, setSelectedTemplate] = useState("custom")
  const [selectedSegment, setSelectedSegment] = useState("all")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date>()
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  // Dialog states
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false)
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false)
  
  // History and analytics
  const [communicationHistory, setCommunicationHistory] = useState<CommunicationHistory[]>([])
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  
  // Filters
  const [historyFilter, setHistoryFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Templates are now loaded from the unified templates system via useLegacyTemplates hook

  // Initialize mock communication history
  useEffect(() => {
    const mockHistory: CommunicationHistory[] = [
      {
        id: "hist-1",
        type: "email",
        subject: "Spring Promotion: 20% Off All Services",
        content: "Don't miss our spring special...",
        recipients: clients.map(c => c.email),
        recipientCount: clients.length,
        segment: "all",
        status: "sent",
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        openRate: 68,
        clickRate: 12,
        deliveryRate: 98,
        createdBy: "Admin",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: "hist-2",
        type: "sms",
        content: "Reminder: Your appointment is tomorrow at 2 PM",
        recipients: ["client1@example.com"],
        recipientCount: 1,
        segment: "individual",
        status: "sent",
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        deliveryRate: 100,
        createdBy: "System",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ]
    setCommunicationHistory(mockHistory)
  }, [clients])

  const filteredClients = selectedSegment === "all" 
    ? clients 
    : clients.filter(client => client.segment === selectedSegment)

  const handleSendCampaign = () => {
    if (!subject && activeTab === "email") {
      toast({
        variant: "destructive",
        title: "Missing subject",
        description: "Please enter an email subject."
      })
      return
    }

    if (!message) {
      toast({
        variant: "destructive",
        title: "Missing message",
        description: "Please enter a message."
      })
      return
    }

    const newCommunication: CommunicationHistory = {
      id: `comm-${Date.now()}`,
      type: activeTab as "email" | "sms",
      subject: activeTab === "email" ? subject : undefined,
      content: message,
      recipients: selectedClients.length > 0 
        ? selectedClients 
        : filteredClients.map(c => c.email),
      recipientCount: selectedClients.length > 0 
        ? selectedClients.length 
        : filteredClients.length,
      segment: selectedSegment,
      status: isScheduled ? "scheduled" : "sent",
      scheduledFor: isScheduled ? scheduledDate : undefined,
      sentAt: isScheduled ? undefined : new Date(),
      createdBy: "Admin",
      createdAt: new Date()
    }

    setCommunicationHistory(prev => [newCommunication, ...prev])

    toast({
      title: isScheduled ? "Campaign scheduled" : "Campaign sent",
      description: `${activeTab === "email" ? "Email" : "SMS"} ${isScheduled ? "scheduled for" : "sent to"} ${newCommunication.recipientCount} recipients.`
    })

    // Reset form
    setSubject("")
    setMessage("")
    setSelectedClients([])
    setIsScheduled(false)
    setScheduledDate(undefined)
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    if (templateId === "custom") {
      // Clear template content for custom message
      return
    }
    const template = templates.find(t => t.id === templateId)
    if (template) {
      if (template.subject) setSubject(template.subject)
      setMessage(template.content)
      // Track template usage
      updateTemplateUsage(templateId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Communication</CardTitle>
        <CardDescription>Send targeted campaigns and manage client communications</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <div className="space-y-6">
              {/* Campaign Type Selector */}
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "email" ? "default" : "outline"}
                  onClick={() => setActiveTab("email")}
                  className="flex-1"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Campaign
                </Button>
                <Button
                  variant={activeTab === "sms" ? "default" : "outline"}
                  onClick={() => setActiveTab("sms")}
                  className="flex-1"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  SMS Campaign
                </Button>
              </div>

              {/* Campaign Configuration */}
              <div className="grid gap-6">
                {/* Template and Segment Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Template</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Message</SelectItem>
                        {templates
                          .filter(t => t.type === (activeTab === "email" ? "email" : "sms"))
                          .map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="segment">Target Segment</Label>
                    <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                      <SelectTrigger id="segment">
                        <SelectValue placeholder="Select segment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Clients ({clients.length})</SelectItem>
                        <SelectItem value="VIP">VIP Clients ({clients.filter(c => c.segment === "VIP").length})</SelectItem>
                        <SelectItem value="Regular">Regular Clients ({clients.filter(c => c.segment === "Regular").length})</SelectItem>
                        <SelectItem value="New">New Clients ({clients.filter(c => c.segment === "New").length})</SelectItem>
                        <SelectItem value="At Risk">At Risk Clients ({clients.filter(c => c.segment === "At Risk").length})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{filteredClients.length} clients</span>
                      <Button variant="outline" size="sm" onClick={() => setIsPreviewDialogOpen(true)}>
                        <Eye className="mr-1 h-3 w-3" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Email Subject (only for email campaigns) */}
                {activeTab === "email" && (
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      placeholder="Enter email subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                )}

                {/* Message Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="message">Message Content</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Copy className="mr-1 h-3 w-3" />
                        Variables
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        toast({
                          title: "Template Management",
                          description: "To create or edit templates, go to Settings → Notifications → Templates"
                        })
                      }}>
                        <Settings className="mr-1 h-3 w-3" />
                        Manage Templates
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="message"
                    placeholder={activeTab === "email" ? "Enter your email message..." : "Enter your SMS message (160 chars max)"}
                    rows={activeTab === "email" ? 8 : 4}
                    maxLength={activeTab === "sms" ? 160 : undefined}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  {activeTab === "sms" && (
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/160 characters
                    </p>
                  )}
                </div>

                {/* Scheduling Options */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="schedule"
                      checked={isScheduled}
                      onCheckedChange={setIsScheduled}
                    />
                    <Label htmlFor="schedule">Schedule for later</Label>
                  </div>

                  {isScheduled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Schedule Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !scheduledDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={scheduledDate}
                              onSelect={setScheduledDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          defaultValue="09:00"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsPreviewDialogOpen(true)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Save Draft
                    </Button>
                  </div>
                  <Button onClick={handleSendCampaign} disabled={!message}>
                    <Send className="mr-2 h-4 w-4" />
                    {isScheduled ? "Schedule Campaign" : "Send Now"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>



          <TabsContent value="history">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Communication History</h3>
                  <p className="text-sm text-muted-foreground">Track all sent campaigns and messages</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search communications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                  <Select value={historyFilter} onValueChange={setHistoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="email">Email Only</SelectItem>
                      <SelectItem value="sms">SMS Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject/Content</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communicationHistory
                      .filter(comm => historyFilter === "all" || comm.type === historyFilter)
                      .filter(comm =>
                        searchTerm === "" ||
                        comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        comm.content.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((communication) => (
                        <TableRow key={communication.id}>
                          <TableCell>
                            {format(communication.createdAt, "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={communication.type === "email" ? "default" : "secondary"}>
                              {communication.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            {communication.subject && (
                              <div className="font-medium">{communication.subject}</div>
                            )}
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {communication.content}
                            </div>
                          </TableCell>
                          <TableCell>{communication.recipientCount}</TableCell>
                          <TableCell>
                            <Badge variant={
                              communication.status === "sent" ? "success" :
                              communication.status === "failed" ? "destructive" :
                              communication.status === "scheduled" ? "default" :
                              "outline"
                            }>
                              {communication.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {communication.status === "sent" && (
                              <div className="text-xs space-y-1">
                                {communication.openRate && (
                                  <div>Open: {communication.openRate}%</div>
                                )}
                                {communication.clickRate && (
                                  <div>Click: {communication.clickRate}%</div>
                                )}
                                <div>Delivery: {communication.deliveryRate}%</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <BarChart3 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="automation">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Automated Campaigns</h3>
                  <p className="text-sm text-muted-foreground">Set up automated messages based on triggers</p>
                </div>
                <Button onClick={() => setIsAutomationDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Automation
                </Button>
              </div>

              <div className="grid gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Gift className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Birthday Wishes</h4>
                        <p className="text-sm text-muted-foreground">Send birthday greetings with special offers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Active</Badge>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Last run: 2 days ago • Total sent: 45 messages
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Bell className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Appointment Reminders</h4>
                        <p className="text-sm text-muted-foreground">24-hour appointment reminders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Active</Badge>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Last run: 6 hours ago • Total sent: 12 messages
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Heart className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Follow-up Messages</h4>
                        <p className="text-sm text-muted-foreground">Thank you messages after appointments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Inactive</Badge>
                      <Switch />
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Last run: Never • Total sent: 0 messages
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Communication Analytics</h3>
                  <p className="text-sm text-muted-foreground">Track performance and engagement metrics</p>
                </div>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>

              {/* Analytics Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Emails</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-xs text-green-600">+12% from last month</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Total SMS</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">856</div>
                    <div className="text-xs text-green-600">+8% from last month</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Avg Open Rate</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">68%</div>
                    <div className="text-xs text-green-600">+3% from last month</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Click Rate</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">12%</div>
                    <div className="text-xs text-red-600">-1% from last month</div>
                  </div>
                </Card>
              </div>

              {/* Performance Chart Placeholder */}
              <Card className="p-6">
                <h4 className="font-medium mb-4">Campaign Performance Over Time</h4>
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>Analytics chart would be displayed here</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>



        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Campaign Preview</DialogTitle>
              <DialogDescription>
                Preview how your message will appear to recipients
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Campaign Type</Label>
                  <p className="text-sm text-muted-foreground capitalize">{activeTab}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Recipients</Label>
                  <p className="text-sm text-muted-foreground">{filteredClients.length} clients</p>
                </div>
              </div>

              {subject && (
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm bg-muted p-2 rounded">{subject}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Message</Label>
                <div className="bg-muted p-4 rounded whitespace-pre-wrap text-sm">
                  {message}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Sample Recipients</Label>
                <div className="max-h-32 overflow-y-auto border rounded p-2">
                  {filteredClients.slice(0, 10).map((client, index) => (
                    <div key={client.id} className="text-xs py-1">
                      {index + 1}. {client.name} ({client.email})
                    </div>
                  ))}
                  {filteredClients.length > 10 && (
                    <div className="text-xs text-muted-foreground py-1">
                      ... and {filteredClients.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsPreviewDialogOpen(false)
                handleSendCampaign()
              }}>
                <Send className="mr-2 h-4 w-4" />
                Send Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
