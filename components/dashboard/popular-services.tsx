"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function PopularServices() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Popular Services</CardTitle>
        <p className="text-sm text-muted-foreground">Top services by appointment count.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span>Haircut & Style</span>
              <span>45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Color Treatment</span>
              <span>30%</span>
            </div>
            <Progress value={30} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Manicure & Pedicure</span>
              <span>15%</span>
            </div>
            <Progress value={15} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Facial Treatment</span>
              <span>10%</span>
            </div>
            <Progress value={10} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

