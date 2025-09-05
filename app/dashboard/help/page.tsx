"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { 
  Search, 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Video,
  FileText,
  Users,
  Zap,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Send,
  Star,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
  notHelpful: number
}

interface SupportTicket {
  id: string
  subject: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  createdAt: string
  lastUpdate: string
}

// FAQ data should be loaded from the database in a real application
// This is kept as static data since it's help content, not business data
const faqData: FAQItem[] = [
  {
    id: "1",
    question: "How do I schedule an appointment?",
    answer: "To schedule an appointment, go to the Appointments section in the dashboard, click 'New Appointment', select the client, service, staff member, and preferred time slot. The system will automatically check availability and confirm the booking.",
    category: "appointments",
    helpful: 0,
    notHelpful: 0
  },
  {
    id: "2",
    question: "How do I add a new client to the system?",
    answer: "Navigate to the Clients section, click 'Add Client', and fill in the required information including name, contact details, and preferences. You can also add clients directly when creating an appointment.",
    category: "clients",
    helpful: 0,
    notHelpful: 0
  },
  {
    id: "3",
    question: "How do I manage inventory and stock levels?",
    answer: "Go to the Inventory section to view all products, adjust stock levels, set minimum stock alerts, and track product usage. You can also generate inventory reports and set up automatic reorder points.",
    category: "inventory",
    helpful: 52,
    notHelpful: 3
  },
  {
    id: "4",
    question: "How do I process payments and refunds?",
    answer: "In the POS system, select the services/products, choose payment method (cash, card, or digital), and process the transaction. For refunds, go to the transaction history, find the payment, and select 'Process Refund'.",
    category: "payments",
    helpful: 41,
    notHelpful: 4
  },
  {
    id: "5",
    question: "How do I generate reports?",
    answer: "Access the Reports section to generate various reports including sales, appointments, staff performance, and inventory. You can customize date ranges, filters, and export formats (PDF, Excel, CSV).",
    category: "reports",
    helpful: 29,
    notHelpful: 2
  }
]

const supportTickets: SupportTicket[] = [
  {
    id: "T-001",
    subject: "Unable to process credit card payments",
    status: "in-progress",
    priority: "high",
    category: "payments",
    createdAt: "2024-01-20",
    lastUpdate: "2024-01-20 14:30"
  },
  {
    id: "T-002",
    subject: "Appointment notifications not working",
    status: "open",
    priority: "medium",
    category: "notifications",
    createdAt: "2024-01-19",
    lastUpdate: "2024-01-19 16:45"
  }
]

export default function HelpPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [openFAQs, setOpenFAQs] = useState<string[]>([])
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "medium",
    description: ""
  })

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "appointments", label: "Appointments" },
    { value: "clients", label: "Client Management" },
    { value: "inventory", label: "Inventory" },
    { value: "payments", label: "Payments" },
    { value: "reports", label: "Reports" },
    { value: "staff", label: "Staff Management" },
    { value: "settings", label: "Settings" }
  ]

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string) => {
    setOpenFAQs(prev => 
      prev.includes(id) 
        ? prev.filter(faqId => faqId !== id)
        : [...prev, id]
    )
  }

  const handleTicketSubmit = async () => {
    if (!ticketForm.subject || !ticketForm.category || !ticketForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Support Ticket Created",
        description: "Your support ticket has been submitted. We'll get back to you soon!",
      })
      
      setTicketForm({
        subject: "",
        category: "",
        priority: "medium",
        description: ""
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800"
      case "in-progress": return "bg-yellow-100 text-yellow-800"
      case "resolved": return "bg-green-100 text-green-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
        <p className="text-muted-foreground">
          Find answers to common questions or get personalized support from our team
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Knowledge Base</h3>
            <p className="text-sm text-muted-foreground">Browse articles and guides</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Video className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold mb-1">Video Tutorials</h3>
            <p className="text-sm text-muted-foreground">Watch step-by-step guides</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold mb-1">Live Chat</h3>
            <p className="text-sm text-muted-foreground">Chat with support team</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6 text-center">
            <Phone className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <h3 className="font-semibold mb-1">Phone Support</h3>
            <p className="text-sm text-muted-foreground">Call us directly</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Find quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* FAQ List */}
              <div className="space-y-2">
                {filteredFAQs.map(faq => (
                  <Collapsible key={faq.id}>
                    <CollapsibleTrigger
                      className="flex items-center justify-between w-full p-4 text-left border rounded-lg hover:bg-muted/50"
                      onClick={() => toggleFAQ(faq.id)}
                    >
                      <span className="font-medium">{faq.question}</span>
                      {openFAQs.includes(faq.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="pt-2 space-y-3">
                        <p className="text-muted-foreground">{faq.answer}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Was this helpful?</span>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                {faq.helpful}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ThumbsDown className="h-4 w-4 mr-1" />
                                {faq.notHelpful}
                              </Button>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {categories.find(c => c.value === faq.category)?.label}
                          </Badge>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">No FAQs found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or category filter</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create New Ticket */}
            <Card>
              <CardHeader>
                <CardTitle>Create Support Ticket</CardTitle>
                <CardDescription>Submit a new support request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={ticketForm.category}
                      onValueChange={(value) => setTicketForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={ticketForm.priority}
                      onValueChange={(value) => setTicketForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about your issue..."
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[120px]"
                  />
                </div>

                <Button onClick={handleTicketSubmit} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>

            {/* Existing Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Your Support Tickets</CardTitle>
                <CardDescription>Track your submitted requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.map(ticket => (
                    <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{ticket.subject}</h4>
                          <p className="text-sm text-muted-foreground">#{ticket.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('-', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Created: {ticket.createdAt}</span>
                        <span>Updated: {ticket.lastUpdate}</span>
                      </div>
                    </div>
                  ))}

                  {supportTickets.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold mb-2">No tickets yet</h3>
                      <p className="text-muted-foreground">Create your first support ticket to get help</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contact Us Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>Multiple ways to reach our support team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Phone className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Phone Support</h4>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                      <p className="text-sm text-muted-foreground">Mon-Fri, 9 AM - 6 PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Mail className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Email Support</h4>
                      <p className="text-muted-foreground">support@vanityhub.com</p>
                      <p className="text-sm text-muted-foreground">Response within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="bg-purple-100 p-3 rounded-full">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Live Chat</h4>
                      <p className="text-muted-foreground">Available 24/7</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Start Chat
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Business Hours</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Emergency Support</CardTitle>
                <CardDescription>For urgent issues requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-red-900">Critical Issues</h4>
                  </div>
                  <p className="text-sm text-red-800 mb-3">
                    For system outages, security breaches, or payment processing failures
                  </p>
                  <Button variant="destructive" className="w-full">
                    <Phone className="mr-2 h-4 w-4" />
                    Emergency Hotline: +1 (555) 911-HELP
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Before Contacting Emergency Support:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      Check if the issue affects multiple users
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      Verify your internet connection
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      Try refreshing the page or restarting the app
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      Have your account information ready
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    User Manual
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    API Documentation
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Integration Guide
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Video Tutorials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Tutorials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <Video className="mr-2 h-4 w-4" />
                    Getting Started
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Video className="mr-2 h-4 w-4" />
                    Appointment Management
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Video className="mr-2 h-4 w-4" />
                    Inventory Management
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Community */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    User Forum
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Feature Requests
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Star className="mr-2 h-4 w-4" />
                    Best Practices
                    <ExternalLink className="ml-auto h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>Current status of VanityHub services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Core System</p>
                    <p className="text-sm text-muted-foreground">Operational</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Payment Processing</p>
                    <p className="text-sm text-muted-foreground">Operational</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Degraded</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="mt-4">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Full Status Page
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
