"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Home, Menu, MessageSquare, Plus, Search, User } from "lucide-react"

export function MockMobileApp() {
  return (
    <div className="rounded-lg overflow-hidden bg-gray-900 text-white">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Menu className="h-5 w-5" />
          <span className="font-semibold">SalonSync</span>
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-gray-700 text-xs">JD</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">September 2023</h3>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="bg-gray-800 hover:bg-gray-700">
              Week
            </Badge>
            <Badge variant="outline" className="bg-transparent">
              Month
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-gray-400">{day}</div>
              <div
                className={`text-sm rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1 ${i === 2 ? "bg-teal-500 text-white" : ""}`}
              >
                {i + 10}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-sm text-gray-400 mb-2">Today, Sep 12</div>

          <div className="bg-blue-500 rounded-md p-3 mb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">Anna Kim</div>
                <div className="text-sm text-blue-100">Facial Treatment</div>
              </div>
              <Badge className="bg-blue-700">10:00 AM</Badge>
            </div>
          </div>

          <div className="bg-yellow-500 rounded-md p-3 mb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">Emily Doe</div>
                <div className="text-sm text-yellow-100">Haircut & Style</div>
              </div>
              <Badge className="bg-yellow-700">11:30 AM</Badge>
            </div>
          </div>

          <div className="bg-purple-500 rounded-md p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">Robert Chen</div>
                <div className="text-sm text-purple-100">Men's Haircut</div>
              </div>
              <Badge className="bg-purple-700">2:00 PM</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 p-3 flex items-center justify-around">
        <div className="flex flex-col items-center">
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </div>
        <div className="flex flex-col items-center">
          <Calendar className="h-5 w-5 text-teal-500" />
          <span className="text-xs mt-1 text-teal-500">Calendar</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-teal-500 rounded-full p-2">
            <Plus className="h-5 w-5" />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <MessageSquare className="h-5 w-5" />
          <span className="text-xs mt-1">Messages</span>
        </div>
        <div className="flex flex-col items-center">
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </div>
      </div>
    </div>
  )
}

