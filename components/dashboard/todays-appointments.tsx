"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Clock, User, MapPin } from "lucide-react"

export function TodaysAppointments() {
  const appointments = [
    {
      id: 1,
      client: "Emily Davis",
      service: "Color & Highlights",
      time: "12:30 PM - 2:00 PM",
      stylist: "Michael Chen",
      stylistId: "MC",
      stylistColor: "bg-blue-100 text-blue-800",
      location: "Downtown Salon",
      status: "Confirmed",
    },
    {
      id: 2,
      client: "James Wilson",
      service: "Haircut & Beard Trim",
      time: "2:30 PM - 3:15 PM",
      stylist: "Emma Johnson",
      stylistId: "EJ",
      stylistColor: "bg-purple-100 text-purple-800",
      location: "Downtown Salon",
      status: "Checked In",
    },
    {
      id: 3,
      client: "Olivia Martinez",
      service: "Manicure & Pedicure",
      time: "3:30 PM - 4:45 PM",
      stylist: "Sophia Rodriguez",
      stylistId: "SR",
      stylistColor: "bg-pink-100 text-pink-800",
      location: "Downtown Salon",
      status: "Confirmed",
    },
    {
      id: 4,
      client: "Emily Davis",
      service: "Haircut & Style",
      time: "4:30 PM - 5:30 PM",
      stylist: "Robert Taylor",
      stylistId: "RT",
      stylistColor: "bg-rose-100 text-rose-800",
      location: "Downtown Salon",
      status: "Confirmed",
    },
    {
      id: 5,
      client: "William Brown",
      service: "Facial Treatment",
      time: "5:45 PM - 6:45 PM",
      stylist: "Jessica Lee",
      stylistId: "JL",
      stylistColor: "bg-green-100 text-green-800",
      location: "Downtown Salon",
      status: "Confirmed",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Today's Appointments</CardTitle>
        <p className="text-sm text-muted-foreground">
          You have {appointments.length} appointments scheduled for today.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{appointment.client}</h4>
                  <Badge
                    className={
                      appointment.status === "Checked In"
                        ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
                        : "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{appointment.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{appointment.service}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{appointment.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="flex items-center gap-2">
                  <Avatar className={`h-8 w-8 ${appointment.stylistColor}`}>
                    <AvatarFallback>{appointment.stylistId}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p>{appointment.stylist}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                  <Button size="sm">Check In</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

