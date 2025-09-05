"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, AlertCircle, Package, FileText, Users, Calendar } from "lucide-react"
import { useDocumentAlertCounts } from "@/components/dashboard/document-alerts"
import { useInventoryAlertCounts } from "@/components/dashboard/inventory-alerts"
import { useAuth } from "@/lib/auth-provider"

interface AlertSummaryProps {
  className?: string
  onNavigateToAlerts?: (alertType: string) => void
}

export function AlertSummary({ className, onNavigateToAlerts }: AlertSummaryProps) {
  const { hasPermission } = useAuth()
  const documentAlerts = useDocumentAlertCounts()
  const inventoryAlerts = useInventoryAlertCounts()
  
  // Calculate total alerts
  const totalDocumentAlerts = documentAlerts.expired + documentAlerts.expiringSoon + 
                             documentAlerts.staffExpired + documentAlerts.staffExpiringSoon
  const totalInventoryAlerts = inventoryAlerts.lowStock + inventoryAlerts.expiring
  const totalAlerts = totalDocumentAlerts + totalInventoryAlerts

  // Don't show if no permissions or no alerts
  if (!hasPermission("view_dashboard") || totalAlerts === 0) {
    return null
  }

  return (
    <Card className={`${className} border-orange-200 bg-orange-50 dashboard-card`}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <span className="font-medium text-orange-800 truncate">
                {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''} Require Attention
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Document Alerts */}
              {totalDocumentAlerts > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToAlerts?.('documents')}
                  className="flex items-center space-x-2 border-orange-300 hover:bg-orange-100"
                >
                  <FileText className="w-4 h-4" />
                  <span>Documents</span>
                  <Badge variant="destructive" className="ml-1 alert-badge">
                    {totalDocumentAlerts}
                  </Badge>
                </Button>
              )}
              
              {/* Inventory Alerts */}
              {totalInventoryAlerts > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToAlerts?.('inventory')}
                  className="flex items-center space-x-2 border-orange-300 hover:bg-orange-100"
                >
                  <Package className="w-4 h-4" />
                  <span>Inventory</span>
                  <Badge variant="destructive" className="ml-1 alert-badge">
                    {totalInventoryAlerts}
                  </Badge>
                </Button>
              )}
            </div>
          </div>
          
          {/* Detailed breakdown */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-orange-700">
            {documentAlerts.expired > 0 && (
              <div className="flex items-center space-x-1 whitespace-nowrap">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="truncate">{documentAlerts.expired} expired</span>
              </div>
            )}
            {documentAlerts.staffExpired > 0 && (
              <div className="flex items-center space-x-1 whitespace-nowrap">
                <Users className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="truncate">{documentAlerts.staffExpired} staff expired</span>
              </div>
            )}
            {inventoryAlerts.lowStock > 0 && (
              <div className="flex items-center space-x-1 whitespace-nowrap">
                <Package className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <span className="truncate">{inventoryAlerts.lowStock} low stock</span>
              </div>
            )}
            {inventoryAlerts.expiring > 0 && (
              <div className="flex items-center space-x-1 whitespace-nowrap">
                <Calendar className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <span className="truncate">{inventoryAlerts.expiring} expiring</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for real-time alert updates
export function useRealTimeAlerts() {
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const documentAlerts = useDocumentAlertCounts()
  const inventoryAlerts = useInventoryAlertCounts()

  useEffect(() => {
    // Update timestamp when alerts change
    setLastUpdate(new Date())
  }, [documentAlerts, inventoryAlerts])

  const totalAlerts = documentAlerts.expired + documentAlerts.expiringSoon + 
                     documentAlerts.staffExpired + documentAlerts.staffExpiringSoon +
                     inventoryAlerts.lowStock + inventoryAlerts.expiring

  return {
    totalAlerts,
    documentAlerts,
    inventoryAlerts,
    lastUpdate
  }
}
