"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, RefreshCw, Database, Users, Package } from "lucide-react"
import { resetAllData, resetStaffData, resetProductData, getDataStatus } from "@/lib/reset-data"

export default function ResetDataPage() {
  const [dataStatus, setDataStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check data status on mount
    const status = getDataStatus()
    setDataStatus(status)
  }, [])

  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset ALL data? This will clear everything and reload the page.')) {
      setIsLoading(true)
      resetAllData()
    }
  }

  const handleResetStaff = async () => {
    if (confirm('Are you sure you want to reset staff data? This will restore the default staff list.')) {
      setIsLoading(true)
      resetStaffData()
      setTimeout(() => {
        setIsLoading(false)
        const status = getDataStatus()
        setDataStatus(status)
      }, 1000)
    }
  }

  const handleResetProducts = async () => {
    if (confirm('Are you sure you want to reset product data? This will restore the default product catalog.')) {
      setIsLoading(true)
      resetProductData()
    }
  }

  const refreshStatus = () => {
    const status = getDataStatus()
    setDataStatus(status)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">Reset and restore default data for testing</p>
        </div>
        <Button onClick={refreshStatus} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      {/* Data Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Current Data Status
          </CardTitle>
          <CardDescription>
            Overview of current data in localStorage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Staff Data</p>
                  <p className="text-sm text-muted-foreground">
                    {dataStatus?.staff?.count || 0} staff members
                  </p>
                </div>
              </div>
              <Badge variant={dataStatus?.staff?.exists ? "default" : "secondary"}>
                {dataStatus?.staff?.exists ? "Loaded" : "Empty"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Product Data</p>
                  <p className="text-sm text-muted-foreground">
                    {dataStatus?.products?.count || 0} products
                  </p>
                </div>
              </div>
              <Badge variant={dataStatus?.products?.exists ? "default" : "secondary"}>
                {dataStatus?.products?.exists ? "Loaded" : "Empty"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reset Staff Data</CardTitle>
            <CardDescription>
              Restore the default staff list with all mock staff members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleResetStaff} 
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Users className="mr-2 h-4 w-4" />
              Reset Staff
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reset Product Data</CardTitle>
            <CardDescription>
              Restore the default product catalog with all beauty products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleResetProducts} 
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Package className="mr-2 h-4 w-4" />
              Reset Products
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Reset All Data</CardTitle>
            <CardDescription>
              Clear all data and restore everything to defaults
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleResetAll} 
              disabled={isLoading}
              className="w-full"
              variant="destructive"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Reset Everything
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Important Notes</p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Resetting data will clear all custom changes</li>
                <li>• Staff and product resets will restore mock/demo data</li>
                <li>• "Reset Everything" will reload the entire page</li>
                <li>• This is intended for development and testing only</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
