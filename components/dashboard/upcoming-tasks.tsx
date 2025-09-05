"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function UpcomingTasks() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Upcoming Tasks</CardTitle>
        <p className="text-sm text-muted-foreground">Tasks that need your attention.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Order new hair products</p>
              <p className="text-xs text-muted-foreground">Due: Today</p>
            </div>
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Call clients for appointment confirmation</p>
              <p className="text-xs text-muted-foreground">Due: Today</p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Review staff schedule for next week</p>
              <p className="text-xs text-muted-foreground">Due: Tomorrow</p>
            </div>
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">High</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Process payroll</p>
              <p className="text-xs text-muted-foreground">Due: Tomorrow</p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

