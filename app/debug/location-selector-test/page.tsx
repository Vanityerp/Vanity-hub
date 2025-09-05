"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-provider"
import { useLocations } from "@/lib/location-provider"
import { useTransactions } from "@/lib/transaction-provider"
import { TransactionSource, TransactionStatus } from "@/lib/transaction-types"
import { LocationSelector } from "@/components/location-selector"
import { CurrencyDisplay } from "@/components/ui/currency-display"

export default function LocationSelectorTestPage() {
  const { currentLocation } = useAuth()
  const { locations, getActiveLocations, getLocationById } = useLocations()
  const { transactions, filterTransactions } = useTransactions()
  const [locationStats, setLocationStats] = useState<any>({})

  // Calculate stats for current location
  useEffect(() => {
    const calculateStats = () => {
      let filteredTxs = transactions

      // Apply location filter
      if (currentLocation && currentLocation !== 'all') {
        if (currentLocation === 'online') {
          // For online location, only show client portal transactions
          filteredTxs = transactions.filter(t =>
            t.source === TransactionSource.CLIENT_PORTAL &&
            t.location === 'online'
          )
        } else {
          // For other locations, filter by location
          filteredTxs = transactions.filter(t => t.location === currentLocation)
        }
      }

      // Calculate revenue excluding cancelled transactions
      const activeTransactions = filteredTxs.filter(t => t.status !== TransactionStatus.CANCELLED)
      const cancelledTransactions = filteredTxs.filter(t => t.status === TransactionStatus.CANCELLED)

      const totalRevenue = activeTransactions.reduce((sum, t) => sum + t.amount, 0)
      const cancelledRevenue = cancelledTransactions.reduce((sum, t) => sum + t.amount, 0)

      setLocationStats({
        totalTransactions: filteredTxs.length,
        activeTransactions: activeTransactions.length,
        cancelledTransactions: cancelledTransactions.length,
        totalRevenue,
        cancelledRevenue,
        clientPortalTransactions: filteredTxs.filter(t => t.source === TransactionSource.CLIENT_PORTAL).length,
        onlineTransactions: filteredTxs.filter(t => t.location === 'online').length
      })
    }

    calculateStats()
  }, [currentLocation, transactions])

  const currentLocationData = getLocationById(currentLocation || 'all')
  const allActiveLocations = getActiveLocations()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Selector Test</h1>
          <p className="text-muted-foreground">Test the location selector functionality and filtering</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Location Selector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Location Selector:</label>
              <div className="mt-2">
                <LocationSelector />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm"><strong>Current Location:</strong> {currentLocation || 'all'}</p>
              <p className="text-sm"><strong>Location Name:</strong> {currentLocationData?.name || 'All Locations'}</p>
              <p className="text-sm"><strong>Location Type:</strong> {
                currentLocation === 'all' ? 'All Locations' :
                currentLocation === 'online' ? 'Online Store' :
                currentLocation === 'home' ? 'Home Service' :
                'Physical Location'
              }</p>
            </div>
          </CardContent>
        </Card>

        {/* Location Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Filtered Transaction Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{locationStats.totalTransactions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Transactions</p>
                <p className="text-2xl font-bold text-green-600">{locationStats.activeTransactions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled Transactions</p>
                <p className="text-2xl font-bold text-red-600">{locationStats.cancelledTransactions || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  <CurrencyDisplay amount={locationStats.totalRevenue || 0} />
                </p>
              </div>
            </div>
            
            {locationStats.cancelledRevenue > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  Cancelled Revenue (excluded): <CurrencyDisplay amount={locationStats.cancelledRevenue} />
                </p>
              </div>
            )}

            {currentLocation === 'online' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  Showing only Client Portal transactions with location = "online"
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Client Portal Transactions: {locationStats.clientPortalTransactions || 0}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">Regular Locations ({locations.length}):</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {locations.map((location) => (
                <div key={location.id} className="p-2 border rounded text-sm">
                  <p className="font-medium">{location.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {location.id}</p>
                  <p className="text-xs text-muted-foreground">Status: {location.status}</p>
                </div>
              ))}
            </div>

            <p className="text-sm font-medium mt-4">All Active Locations ({allActiveLocations.length}):</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allActiveLocations.map((location) => (
                <div key={location.id} className={`p-2 border rounded text-sm ${
                  location.id === 'online' ? 'bg-blue-50 border-blue-200' :
                  location.id === 'home' ? 'bg-orange-50 border-orange-200' :
                  'bg-gray-50'
                }`}>
                  <p className="font-medium">{location.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {location.id}</p>
                  <p className="text-xs text-muted-foreground">Status: {location.status}</p>
                  {location.id === 'online' && (
                    <p className="text-xs text-blue-600">Special: Online Store</p>
                  )}
                  {location.id === 'home' && (
                    <p className="text-xs text-orange-600">Special: Home Service</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions for Current Location */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions for Current Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions
              .filter(t => {
                if (!currentLocation || currentLocation === 'all') return true
                if (currentLocation === 'online') {
                  return t.source === TransactionSource.CLIENT_PORTAL && t.location === 'online'
                }
                return t.location === currentLocation
              })
              .slice(0, 10)
              .map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.clientName} • {new Date(transaction.date).toLocaleDateString()} • {transaction.source}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Location: {transaction.location} • Status: {transaction.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${transaction.status === TransactionStatus.CANCELLED ? 'text-red-600 line-through' : ''}`}>
                      <CurrencyDisplay amount={transaction.amount} />
                    </p>
                    <p className={`text-sm ${
                      transaction.status === TransactionStatus.CANCELLED ? 'text-red-600' :
                      transaction.status === TransactionStatus.COMPLETED ? 'text-green-600' :
                      'text-yellow-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            {transactions.filter(t => {
              if (!currentLocation || currentLocation === 'all') return true
              if (currentLocation === 'online') {
                return t.source === TransactionSource.CLIENT_PORTAL && t.location === 'online'
              }
              return t.location === currentLocation
            }).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No transactions found for the selected location.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
