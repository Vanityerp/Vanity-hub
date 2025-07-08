"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useClients } from "@/lib/client-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Eye, Edit, MoreHorizontal, UserRound, Search, Filter, Mail, MessageSquare, Users, TrendingUp, Star, AlertTriangle, Plus, Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { CurrencyDisplay } from "@/components/ui/currency-display"

export function ClientSegments() {
  const router = useRouter()
  const { clients, updateClient } = useClients()
  const { toast } = useToast()

  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSegment, setSelectedSegment] = useState("vip")
  const [isEditSegmentDialogOpen, setIsEditSegmentDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any>(null)
  const [newSegment, setNewSegment] = useState("")

  // Filter clients by segment
  const vipClients = clients.filter((client) => client.segment === "VIP")
  const regularClients = clients.filter((client) => client.segment === "Regular")
  const newClients = clients.filter((client) => client.segment === "New")
  const atRiskClients = clients.filter((client) => client.segment === "At Risk")

  // Calculate segment statistics
  const getSegmentStats = (segmentClients: any[]) => {
    const totalSpent = segmentClients.reduce((sum, client) => sum + (client.totalSpent || 0), 0)
    const avgSpent = segmentClients.length > 0 ? totalSpent / segmentClients.length : 0
    const lastVisitDays = segmentClients.map(client => {
      if (!client.lastVisit) return 999
      const lastVisit = new Date(client.lastVisit)
      const today = new Date()
      return Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    })
    const avgDaysSinceVisit = lastVisitDays.length > 0 ?
      lastVisitDays.reduce((sum, days) => sum + days, 0) / lastVisitDays.length : 0

    return {
      count: segmentClients.length,
      totalSpent,
      avgSpent,
      avgDaysSinceVisit: Math.round(avgDaysSinceVisit)
    }
  }

  const handleViewClient = (clientId: string) => {
    router.push(`/dashboard/clients/${clientId}`)
  }

  const handleEditSegment = (client: any) => {
    setEditingClient(client)
    setNewSegment(client.segment)
    setIsEditSegmentDialogOpen(true)
  }

  const handleUpdateSegment = async () => {
    if (!editingClient || !newSegment) return

    try {
      await updateClient(editingClient.id, { segment: newSegment })
      toast({
        title: "Segment updated",
        description: `${editingClient.name} has been moved to ${newSegment} segment.`
      })
      setIsEditSegmentDialogOpen(false)
      setEditingClient(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update client segment."
      })
    }
  }

  const renderSegmentHeader = (segmentName: string, segmentClients: any[], icon: any, color: string) => {
    const stats = getSegmentStats(segmentClients)
    const IconComponent = icon

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{segmentName} Clients</h3>
              <p className="text-sm text-muted-foreground">
                {stats.count} clients • Avg spent: <CurrencyDisplay amount={stats.avgSpent} />
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Email All
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              SMS All
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Segment Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Clients</span>
            </div>
            <div className="text-xl font-bold mt-1">{stats.count}</div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <div className="text-xl font-bold mt-1">
              <CurrencyDisplay amount={stats.totalSpent} />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Avg per Client</span>
            </div>
            <div className="text-xl font-bold mt-1">
              <CurrencyDisplay amount={stats.avgSpent} />
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Avg Days Since Visit</span>
            </div>
            <div className="text-xl font-bold mt-1">{stats.avgDaysSinceVisit}</div>
          </Card>
        </div>
      </div>
    )
  }

  const renderClientTable = (clients: any[], segmentName: string) => {
    const filteredClients = clients.filter(client =>
      searchTerm === "" ||
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {searchTerm ? "No clients match your search." : `No clients in ${segmentName} segment.`}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {client.avatar || client.name.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Client since {client.createdAt ? new Date(client.createdAt).getFullYear() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{client.email}</div>
                        <div className="text-sm text-muted-foreground">{client.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.lastVisit ? (
                        <div>
                          <div className="text-sm">{client.lastVisit}</div>
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              const lastVisit = new Date(client.lastVisit)
                              const today = new Date()
                              const daysDiff = Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
                              return `${daysDiff} days ago`
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <CurrencyDisplay amount={client.totalSpent || 0} />
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === "Active" ? "success" : "secondary"}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClient(client.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewClient(client.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditSegment(client)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Change Segment
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Send SMS
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Segments</CardTitle>
        <CardDescription>Manage your client segments for targeted marketing and services</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedSegment} onValueChange={setSelectedSegment}>
          <TabsList className="mb-6">
            <TabsTrigger value="vip">VIP Clients</TabsTrigger>
            <TabsTrigger value="regular">Regular Clients</TabsTrigger>
            <TabsTrigger value="new">New Clients</TabsTrigger>
            <TabsTrigger value="at-risk">At Risk</TabsTrigger>
          </TabsList>

          <TabsContent value="vip">
            {renderSegmentHeader("VIP", vipClients, Star, "bg-yellow-100 text-yellow-800")}
            {renderClientTable(vipClients, "VIP")}
          </TabsContent>

          <TabsContent value="regular">
            {renderSegmentHeader("Regular", regularClients, Users, "bg-blue-100 text-blue-800")}
            {renderClientTable(regularClients, "Regular")}
          </TabsContent>

          <TabsContent value="new">
            {renderSegmentHeader("New", newClients, Plus, "bg-green-100 text-green-800")}
            {renderClientTable(newClients, "New")}
          </TabsContent>

          <TabsContent value="at-risk">
            {renderSegmentHeader("At Risk", atRiskClients, AlertTriangle, "bg-red-100 text-red-800")}
            {renderClientTable(atRiskClients, "At Risk")}
          </TabsContent>
        </Tabs>

        {/* Edit Segment Dialog */}
        <Dialog open={isEditSegmentDialogOpen} onOpenChange={setIsEditSegmentDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Change Client Segment</DialogTitle>
              <DialogDescription>
                Update the segment for {editingClient?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-segment">Current Segment</Label>
                <Input
                  id="current-segment"
                  value={editingClient?.segment || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-segment">New Segment</Label>
                <Select value={newSegment} onValueChange={setNewSegment}>
                  <SelectTrigger id="new-segment">
                    <SelectValue placeholder="Select new segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="At Risk">At Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditSegmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSegment}>
                Update Segment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

