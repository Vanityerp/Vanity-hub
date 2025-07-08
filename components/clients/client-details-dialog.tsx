"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mail, MapPin, Phone, User } from "lucide-react"
import { CurrencyDisplay } from "@/components/ui/currency-display"

interface ClientDetailsDialogProps {
  client: {
    id: string
    name: string
    email: string
    phone: string
    lastVisit: string
    preferredLocation: string
    status: string
    avatar: string
    segment: string
    color?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDetailsDialog({ client, open, onOpenChange }: ClientDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
          <DialogDescription>View detailed information about this client.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          <Avatar className={`h-16 w-16 ${client.color || "bg-primary/10"}`}>
            <AvatarFallback>{client.avatar}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{client.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge
                className={
                  client.segment === "VIP"
                    ? "bg-purple-100 text-purple-800"
                    : client.segment === "Regular"
                      ? "bg-blue-100 text-blue-800"
                      : client.segment === "New"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                }
              >
                {client.segment}
              </Badge>
              <span>•</span>
              <Badge variant={client.status === "Active" ? "outline" : "secondary"}>{client.status}</Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info">Basic Info</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {client.preferredLocation === "loc1"
                      ? "Downtown"
                      : client.preferredLocation === "loc2"
                        ? "Westside"
                        : "Northside"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Last Visit: {client.lastVisit}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">No notes available for this client.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">Haircut & Style</h4>
                    <p className="text-sm text-muted-foreground">Apr 1, 2025 • 10:00 AM - 11:00 AM</p>
                  </div>
                  <Badge>Upcoming</Badge>
                </div>
                <div className="text-sm">
                  <p>Stylist: Emma Johnson</p>
                  <p>Location: Downtown</p>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">Color & Highlights</h4>
                    <p className="text-sm text-muted-foreground">Mar 1, 2025 • 2:00 PM - 4:00 PM</p>
                  </div>
                  <Badge variant="outline">Completed</Badge>
                </div>
                <div className="text-sm">
                  <p>Stylist: Michael Chen</p>
                  <p>Location: Downtown</p>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">Haircut & Style</h4>
                    <p className="text-sm text-muted-foreground">Feb 1, 2025 • 11:00 AM - 12:00 PM</p>
                  </div>
                  <Badge variant="outline">Completed</Badge>
                </div>
                <div className="text-sm">
                  <p>Stylist: Emma Johnson</p>
                  <p>Location: Downtown</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="purchases">
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">Haircut & Style, Deep Conditioning</h4>
                    <p className="text-sm text-muted-foreground">Apr 1, 2025</p>
                  </div>
                  <span className="font-medium">
                    <CurrencyDisplay amount={120.00} />
                  </span>
                </div>
                <div className="text-sm">
                  <p>Payment Method: Credit Card</p>
                  <p>Transaction ID: TX-001</p>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">Shampoo & Conditioner Set</h4>
                    <p className="text-sm text-muted-foreground">Mar 15, 2025</p>
                  </div>
                  <span className="font-medium">
                    <CurrencyDisplay amount={45.00} />
                  </span>
                </div>
                <div className="text-sm">
                  <p>Payment Method: Credit Card</p>
                  <p>Transaction ID: TX-003</p>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">Color & Highlights</h4>
                    <p className="text-sm text-muted-foreground">Mar 1, 2025</p>
                  </div>
                  <span className="font-medium">
                    <CurrencyDisplay amount={150.00} />
                  </span>
                </div>
                <div className="text-sm">
                  <p>Payment Method: Credit Card</p>
                  <p>Transaction ID: TX-004</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            <User className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

