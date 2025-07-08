"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Edit, AlertTriangle } from "lucide-react"

interface ClientPreferencesCardProps {
  clientId: string
  preferences: {
    preferredStylists: string[]
    preferredServices: string[]
    preferredProducts: string[]
    allergies: string[]
    notes: string
  }
  onEdit?: () => void
}

export function ClientPreferencesCard({ clientId, preferences, onEdit }: ClientPreferencesCardProps) {
  const hasAllergies = preferences.allergies && preferences.allergies.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Client Preferences</CardTitle>
            <CardDescription>Service and product preferences</CardDescription>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasAllergies && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Allergies & Sensitivities</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {preferences.allergies && preferences.allergies.map((allergy) => (
                  <Badge key={allergy} variant="outline" className="bg-white text-red-700 border-red-200">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Preferred Stylists</h3>
            {preferences.preferredStylists && preferences.preferredStylists.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {preferences.preferredStylists.map((stylist) => (
                  <Badge key={stylist} variant="secondary">
                    {stylist}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No preferred stylists specified</p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Preferred Services</h3>
            {preferences.preferredServices && preferences.preferredServices.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {preferences.preferredServices.map((service) => (
                  <Badge key={service} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No preferred services specified</p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">Preferred Products</h3>
            {preferences.preferredProducts && preferences.preferredProducts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {preferences.preferredProducts.map((product) => (
                  <Badge key={product} variant="secondary">
                    {product}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No preferred products specified</p>
            )}
          </div>

          {preferences.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Notes & Special Instructions</h3>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm">{preferences.notes}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
