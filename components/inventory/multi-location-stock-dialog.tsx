"use client"

import React, { useState, useEffect } from "react"
import { useLocations } from "@/lib/location-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus, Edit3, RotateCcw, Save, Loader2 } from "lucide-react"

interface MultiLocationStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
  onStockAdjusted?: () => void
}

interface LocationStockData {
  locationId: string
  locationName: string
  currentStock: number
  newStock: number
  adjustment: number
  operation: 'add' | 'remove' | 'set'
}

export function MultiLocationStockDialog({ 
  open, 
  onOpenChange, 
  product, 
  onStockAdjusted 
}: MultiLocationStockDialogProps) {
  const { getActiveLocations } = useLocations()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("individual")
  const [locationStocks, setLocationStocks] = useState<LocationStockData[]>([])
  const [globalOperation, setGlobalOperation] = useState<'add' | 'remove' | 'set'>('add')
  const [globalValue, setGlobalValue] = useState("")
  const [reason, setReason] = useState("manual_adjustment")
  const [notes, setNotes] = useState("")

  // Initialize location stock data when dialog opens
  useEffect(() => {
    if (open && product) {
      const activeLocations = getActiveLocations()
      console.log("🔄 Initializing multi-location stock dialog:", {
        productId: product.id,
        productName: product.name,
        activeLocations: activeLocations.map(loc => ({ id: loc.id, name: loc.name })),
        productLocations: product.locations?.map((pl: any) => ({ locationId: pl.locationId, stock: pl.stock }))
      })

      const initialStocks: LocationStockData[] = activeLocations.map(location => {
        const productLocation = product.locations?.find((pl: any) => pl.locationId === location.id)
        const currentStock = productLocation?.stock || 0

        console.log(`📊 Location ${location.name} (${location.id}):`, {
          hasProductLocation: !!productLocation,
          currentStock
        })

        return {
          locationId: location.id,
          locationName: location.name,
          currentStock,
          newStock: currentStock,
          adjustment: 0,
          operation: 'add'
        }
      })

      setLocationStocks(initialStocks)
      setGlobalValue("")
      setNotes("")
    }
  }, [open, product, getActiveLocations])

  // Update individual location stock
  const updateLocationStock = (locationId: string, field: keyof LocationStockData, value: any) => {
    setLocationStocks(prev => prev.map(stock => {
      if (stock.locationId === locationId) {
        const updated = { ...stock, [field]: value }
        
        // Recalculate based on operation
        if (field === 'operation' || field === 'adjustment') {
          const adjustment = field === 'adjustment' ? Number(value) || 0 : updated.adjustment
          const operation = field === 'operation' ? value : updated.operation
          
          switch (operation) {
            case 'add':
              updated.newStock = updated.currentStock + adjustment
              break
            case 'remove':
              updated.newStock = Math.max(0, updated.currentStock - adjustment)
              break
            case 'set':
              updated.newStock = adjustment
              break
          }
          
          updated.adjustment = adjustment
          updated.operation = operation
        }
        
        return updated
      }
      return stock
    }))
  }

  // Apply global operation to all locations
  const applyGlobalOperation = () => {
    const value = Number(globalValue) || 0
    if (value <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid value",
        description: "Please enter a valid positive number"
      })
      return
    }

    setLocationStocks(prev => prev.map(stock => {
      let newStock = stock.currentStock
      
      switch (globalOperation) {
        case 'add':
          newStock = stock.currentStock + value
          break
        case 'remove':
          newStock = Math.max(0, stock.currentStock - value)
          break
        case 'set':
          newStock = value
          break
      }
      
      return {
        ...stock,
        newStock,
        adjustment: value,
        operation: globalOperation
      }
    }))
  }

  // Reset all changes
  const resetChanges = () => {
    setLocationStocks(prev => prev.map(stock => ({
      ...stock,
      newStock: stock.currentStock,
      adjustment: 0,
      operation: 'add' as const
    })))
    setGlobalValue("")
  }

  // Calculate total changes
  const totalCurrentStock = locationStocks.reduce((sum, stock) => sum + stock.currentStock, 0)
  const totalNewStock = locationStocks.reduce((sum, stock) => sum + stock.newStock, 0)
  const totalChange = totalNewStock - totalCurrentStock
  const hasChanges = locationStocks.some(stock => stock.newStock !== stock.currentStock)

  // Submit stock adjustments
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasChanges) {
      toast({
        variant: "destructive",
        title: "No changes",
        description: "Please make some stock adjustments before submitting"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const adjustments = locationStocks
        .filter(stock => stock.newStock !== stock.currentStock)
        .map(stock => ({
          locationId: stock.locationId,
          currentStock: stock.currentStock,
          newStock: stock.newStock,
          adjustment: stock.adjustment,
          operation: stock.operation
        }))

      console.log("📤 Sending multi-location stock adjustments:", {
        productId: product.id,
        productName: product.name,
        adjustments: adjustments.map(adj => ({
          locationId: adj.locationId,
          locationName: locationStocks.find(ls => ls.locationId === adj.locationId)?.locationName,
          currentStock: adj.currentStock,
          newStock: adj.newStock,
          operation: adj.operation
        })),
        reason,
        notes
      })

      const response = await fetch("/api/inventory/adjust-multi-location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          adjustments,
          reason,
          notes
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to adjust stock")
      }

      const result = await response.json()
      console.log("✅ Multi-location stock adjustment result:", result)

      toast({
        title: "Stock adjusted successfully",
        description: `Updated stock levels for ${adjustments.length} location(s)`,
      })

      if (onStockAdjusted) {
        console.log("🔄 Calling onStockAdjusted callback to refresh data...")
        // Call immediately without delay
        await onStockAdjusted()
        console.log("✅ Data refresh callback completed")
      }

      onOpenChange(false)
    } catch (error) {
      console.error("❌ Failed to adjust stock:", error)
      toast({
        variant: "destructive",
        title: "Error adjusting stock",
        description: error instanceof Error ? error.message : "Failed to adjust stock. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Stock: {product.name}
            </DialogTitle>
            <DialogDescription>
              Adjust stock levels across all locations. Current total stock: {totalCurrentStock} units
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual">Individual Locations</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="space-y-4">
                <div className="grid gap-4 max-h-[400px] overflow-y-auto">
                  {locationStocks.map((stock) => (
                    <Card key={stock.locationId} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{stock.locationName}</h4>
                        <Badge variant="outline">
                          Current: {stock.currentStock}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Operation</Label>
                          <Select
                            value={stock.operation}
                            onValueChange={(value: 'add' | 'remove' | 'set') => 
                              updateLocationStock(stock.locationId, 'operation', value)
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="add">Add</SelectItem>
                              <SelectItem value="remove">Remove</SelectItem>
                              <SelectItem value="set">Set to</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs">
                            {stock.operation === 'set' ? 'New Stock' : 'Quantity'}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={stock.adjustment}
                            onChange={(e) => 
                              updateLocationStock(stock.locationId, 'adjustment', Number(e.target.value) || 0)
                            }
                            className="h-8"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">New Stock</Label>
                          <div className="h-8 px-3 py-1 bg-muted rounded-md flex items-center text-sm">
                            {stock.newStock}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-4">
                <Card className="p-4">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-base">Apply to All Locations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <Label>Operation</Label>
                        <Select value={globalOperation} onValueChange={setGlobalOperation}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add">Add to all</SelectItem>
                            <SelectItem value="remove">Remove from all</SelectItem>
                            <SelectItem value="set">Set all to</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>
                          {globalOperation === 'set' ? 'Stock Level' : 'Quantity'}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={globalValue}
                          onChange={(e) => setGlobalValue(e.target.value)}
                          placeholder="Enter value"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          onClick={applyGlobalOperation}
                          className="w-full"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{totalCurrentStock}</div>
                      <div className="text-sm text-muted-foreground">Current Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{totalNewStock}</div>
                      <div className="text-sm text-muted-foreground">New Total</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalChange >= 0 ? '+' : ''}{totalChange}
                      </div>
                      <div className="text-sm text-muted-foreground">Change</div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Reason and Notes */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                    <SelectItem value="inventory_count">Inventory Count</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="damage">Damage/Loss</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this adjustment"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetChanges}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
