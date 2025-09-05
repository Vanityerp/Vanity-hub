"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Grid3X3, List } from "lucide-react"

export function MockCalendar() {
  const [view, setView] = useState<"month" | "week" | "day">("week")

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const hours = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"]

  const appointments = [
    {
      id: 1,
      client: "Anna Kim",
      service: "Facial Treatment",
      time: "10:00 - 11:00",
      day: 1,
      color: "bg-blue-100 border-blue-300",
    },
    {
      id: 2,
      client: "Emily Doe",
      service: "Haircut & Style",
      time: "11:30 - 12:30",
      day: 1,
      color: "bg-amber-100 border-amber-300",
    },
    {
      id: 3,
      client: "Anna Kim",
      service: "Color & Highlights",
      time: "13:00 - 15:00",
      day: 2,
      color: "bg-rose-100 border-rose-300",
    },
    {
      id: 4,
      client: "Andrew",
      service: "Men's Haircut",
      time: "15:30 - 16:00",
      day: 3,
      color: "bg-green-100 border-green-300",
    },
    {
      id: 5,
      client: "Alex",
      service: "Beard Trim",
      time: "16:30 - 17:00",
      day: 3,
      color: "bg-purple-100 border-purple-300",
    },
    {
      id: 6,
      client: "Christina Sanders",
      service: "Manicure",
      time: "10:00 - 11:00",
      day: 4,
      color: "bg-red-100 border-red-300",
    },
    {
      id: 7,
      client: "Patricia Smith",
      service: "Facial Massage",
      time: "11:30 - 12:30",
      day: 5,
      color: "bg-violet-100 border-violet-300",
    },
    {
      id: 8,
      client: "Melissa Jackson",
      service: "Manicure & Pedicure",
      time: "14:00 - 15:30",
      day: 5,
      color: "bg-teal-100 border-teal-300",
    },
    {
      id: 9,
      client: "Cory Williams",
      service: "Color and styling",
      time: "16:00 - 17:30",
      day: 6,
      color: "bg-indigo-100 border-indigo-300",
    },
    {
      id: 10,
      client: "Daniel Hoffmann",
      service: "Special treatment",
      time: "10:00 - 11:00",
      day: 7,
      color: "bg-amber-100 border-amber-300",
    },
  ]

  return (
    <div className="rounded-lg border bg-background shadow-xl overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">September 2023</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button variant="ghost" size="sm" className="rounded-none h-8">
              Day
            </Button>
            <Button variant="default" size="sm" className="rounded-none h-8">
              Week
            </Button>
            <Button variant="ghost" size="sm" className="rounded-none h-8">
              Month
            </Button>
          </div>
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button variant="ghost" size="sm" className="rounded-none h-8">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-none h-8">
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-2">
        <div className="flex items-center mb-2">
          <div className="w-16"></div>
          <div className="grid grid-cols-7 flex-1 gap-1">
            {days.map((day, i) => (
              <div key={day} className="text-center">
                <div className="text-sm font-medium">{day}</div>
                <div className="text-xs text-muted-foreground">{i + 1}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          {hours.map((hour, i) => (
            <div key={hour} className="flex items-start border-t">
              <div className="w-16 pr-2 py-2 text-xs text-right text-muted-foreground">{hour}</div>
              <div className="grid grid-cols-7 flex-1 gap-1">
                {days.map((_, dayIndex) => (
                  <div key={dayIndex} className="h-16 border-l"></div>
                ))}
              </div>
            </div>
          ))}

          {/* Appointments */}
          {appointments.map((appointment) => {
            const startHour = Number.parseInt(appointment.time.split(":")[0])
            const top = (startHour - 9) * 64 + 2
            const duration = appointment.time.includes("- 17:00") ? 64 : appointment.time.includes("15:00") ? 128 : 64

            return (
              <div
                key={appointment.id}
                className={`absolute rounded-md border p-2 ${appointment.color}`}
                style={{
                  top: `${top}px`,
                  left: `${64 + (appointment.day - 1) * 14.28}%`,
                  width: "13.28%",
                  height: `${duration}px`,
                }}
              >
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="text-xs font-medium truncate">{appointment.client}</div>
                  <div className="text-xs text-muted-foreground truncate">{appointment.service}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

