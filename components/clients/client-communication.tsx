"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
// DEPRECATED: Mock data removed - now using real API data
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Mail, MessageSquare } from "lucide-react"

export function ClientCommunication() {
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedSegment, setSelectedSegment] = useState("all")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  // Filter clients based on selected segment
  // TODO: Replace with real API call to fetch clients
  const filteredClients: any[] = []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Communication</CardTitle>
        <CardDescription>Send emails and SMS messages to your clients</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email">
          <TabsList className="mb-4">
            <TabsTrigger value="email">Email Campaign</TabsTrigger>
            <TabsTrigger value="sms">SMS Campaign</TabsTrigger>
            <TabsTrigger value="history">Communication History</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Email Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">Promotion Announcement</SelectItem>
                      <SelectItem value="newsletter">Monthly Newsletter</SelectItem>
                      <SelectItem value="birthday">Birthday Wishes</SelectItem>
                      <SelectItem value="followup">Appointment Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segment">Client Segment</Label>
                  <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                    <SelectTrigger id="segment">
                      <SelectValue placeholder="Select segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      <SelectItem value="VIP">VIP Clients</SelectItem>
                      <SelectItem value="Regular">Regular Clients</SelectItem>
                      <SelectItem value="New">New Clients</SelectItem>
                      <SelectItem value="At Risk">At Risk Clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Email Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Recipients: {filteredClients.length} clients</p>
                <Button>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sms">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="sms-segment">Client Segment</Label>
                <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                  <SelectTrigger id="sms-segment">
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    <SelectItem value="VIP">VIP Clients</SelectItem>
                    <SelectItem value="Regular">Regular Clients</SelectItem>
                    <SelectItem value="New">New Clients</SelectItem>
                    <SelectItem value="At Risk">At Risk Clients</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-message">SMS Message</Label>
                <Textarea
                  id="sms-message"
                  placeholder="Enter your SMS message"
                  rows={4}
                  maxLength={160}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/160 characters</p>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Recipients: {filteredClients.length} clients</p>
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send SMS
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject/Content</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Apr 1, 2025</TableCell>
                    <TableCell>
                      <Badge variant="outline">Email</Badge>
                    </TableCell>
                    <TableCell>Spring Promotion: 20% Off All Services</TableCell>
                    <TableCell>All Clients (124)</TableCell>
                    <TableCell>
                      <Badge variant="success">Sent</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mar 15, 2025</TableCell>
                    <TableCell>
                      <Badge variant="outline">SMS</Badge>
                    </TableCell>
                    <TableCell>Reminder: Book your appointment for next week</TableCell>
                    <TableCell>Regular Clients (78)</TableCell>
                    <TableCell>
                      <Badge variant="success">Sent</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mar 1, 2025</TableCell>
                    <TableCell>
                      <Badge variant="outline">Email</Badge>
                    </TableCell>
                    <TableCell>March Newsletter: New Services & Staff</TableCell>
                    <TableCell>All Clients (120)</TableCell>
                    <TableCell>
                      <Badge variant="success">Sent</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

