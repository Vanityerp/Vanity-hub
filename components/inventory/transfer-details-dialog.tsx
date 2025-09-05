"use client"

import React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRightLeft, Package, MapPin, User, Calendar, FileText, Clock } from "lucide-react"
import { format } from "date-fns"
import { useLocations } from "@/lib/location-provider"
import { ProductTransfer } from "@/lib/products-data"

interface TransferDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transfer?: ProductTransfer | null
}

export function TransferDetailsDialog({ open, onOpenChange, transfer }: TransferDetailsDialogProps) {
  const { getLocationById } = useLocations()

  if (!transfer) return null

  const fromLocation = getLocationById(transfer.fromLocationId)
  const toLocation = getLocationById(transfer.toLocationId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this inventory transfer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transfer Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <Badge
                variant={
                  transfer.status === 'completed' ? 'default' :
                  transfer.status === 'pending' ? 'secondary' :
                  'destructive'
                }
              >
                {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              ID: {transfer.id}
            </div>
          </div>

          <div className="border-t"></div>

          {/* Product Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{transfer.productName}</span>
                <span className="text-sm text-muted-foreground">
                  Product ID: {transfer.productId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Quantity Transferred:</span>
                <Badge variant="outline" className="font-medium">
                  {transfer.quantity} units
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Transfer Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <div className="font-medium">{fromLocation?.name || 'Unknown Location'}</div>
                    <div className="text-sm text-muted-foreground">Source</div>
                  </div>
                </div>
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium text-right">{toLocation?.name || 'Unknown Location'}</div>
                    <div className="text-sm text-muted-foreground text-right">Destination</div>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Transfer Created</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(transfer.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created by {transfer.createdBy}
                  </div>
                </div>
              </div>
              
              {transfer.completedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Transfer Completed</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(transfer.completedAt), "MMM dd, yyyy 'at' HH:mm")}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Stock successfully moved between locations
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {transfer.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {transfer.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
