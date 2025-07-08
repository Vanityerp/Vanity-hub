"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { format } from "date-fns"
import {
  Calendar,
  User,
  MapPin,
  CreditCard,
  FileText,
  Package,
  ShoppingCart,
  Globe,
  Edit,
  Printer,
  Download,
  ExternalLink,
  Clock,
  Hash
} from "lucide-react"
import { Transaction, TransactionSource, getTransactionSourceLabel } from "@/lib/transaction-types"
import { useToast } from "@/components/ui/use-toast"

interface TransactionDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  onPrintReceipt?: (transaction: Transaction) => void
  onExportPDF?: (transaction: Transaction) => void
  onViewReference?: (transaction: Transaction) => void
}

export function TransactionDetailsDialog({
  open,
  onOpenChange,
  transaction,
  onPrintReceipt,
  onExportPDF,
  onViewReference
}: TransactionDetailsDialogProps) {
  const { toast } = useToast()

  if (!transaction) return null

  // Helper function to get source icon
  const getSourceIcon = (source: TransactionSource) => {
    switch (source) {
      case TransactionSource.POS:
        return <ShoppingCart className="h-4 w-4" />
      case TransactionSource.CALENDAR:
        return <Calendar className="h-4 w-4" />
      case TransactionSource.MANUAL:
        return <Edit className="h-4 w-4" />
      case TransactionSource.INVENTORY:
        return <Package className="h-4 w-4" />
      case TransactionSource.ONLINE:
        return <Globe className="h-4 w-4" />
      case TransactionSource.CLIENT_PORTAL:
        return <Globe className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Helper function to get source label (using shared utility)
  const getSourceLabel = (source: TransactionSource) => {
    return getTransactionSourceLabel(source)
  }

  // Helper function to get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      case "refunded":
        return "outline"
      case "partial":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Helper function to get location name
  const getLocationName = (locationId: string) => {
    switch (locationId) {
      case "loc1":
        return "D-Ring Road Salon"
      case "loc2":
        return "Muaither Salon"
      case "loc3":
        return "Medinat Khalifa Salon"
      case "home":
        return "Home Service"
      default:
        return locationId
    }
  }

  // Helper function to format payment method
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "credit_card":
        return "Credit Card"
      case "mobile_payment":
        return "Mobile Payment"
      case "bank_transfer":
        return "Bank Transfer"
      case "cash":
        return "Cash"
      default:
        return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const handlePrintReceipt = () => {
    if (onPrintReceipt) {
      onPrintReceipt(transaction)
    } else {
      toast({
        title: "Print Receipt",
        description: "Receipt printing functionality will be implemented.",
      })
    }
  }

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF(transaction)
    } else {
      toast({
        title: "Export PDF",
        description: "PDF export functionality will be implemented.",
      })
    }
  }

  const handleViewReference = () => {
    if (onViewReference) {
      onViewReference(transaction)
    } else {
      toast({
        title: "View Reference",
        description: "Reference viewing functionality will be implemented.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSourceIcon(transaction.source)}
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Complete information for transaction {transaction.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{transaction.id}</h3>
              <p className="text-sm text-muted-foreground">
                {typeof transaction.date === 'string' 
                  ? transaction.date 
                  : format(transaction.date, 'PPP p')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                <CurrencyDisplay amount={transaction.amount} />
              </div>
              {/* Show consolidated transaction breakdown */}
              {transaction.type === 'consolidated_sale' && (transaction.serviceAmount || transaction.productAmount) && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {transaction.serviceAmount && transaction.serviceAmount > 0 && (
                    <div>Services: <CurrencyDisplay amount={transaction.serviceAmount} /></div>
                  )}
                  {transaction.productAmount && transaction.productAmount > 0 && (
                    <div>Products: <CurrencyDisplay amount={transaction.productAmount} /></div>
                  )}
                  {transaction.discountAmount && transaction.discountAmount > 0 && (
                    <div className="text-green-600">Discount: -<CurrencyDisplay amount={transaction.discountAmount} /></div>
                  )}
                </div>
              )}
              {/* Legacy discount display for non-consolidated transactions */}
              {transaction.metadata?.discountApplied && transaction.metadata?.originalTotal && !transaction.type?.includes('consolidated') && (
                <div className="text-sm text-muted-foreground line-through mb-1">
                  Original: <CurrencyDisplay amount={transaction.metadata.originalTotal} />
                </div>
              )}
              {/* Show original service amount for consolidated transactions */}
              {transaction.originalServiceAmount && transaction.originalServiceAmount > (transaction.serviceAmount || 0) && (
                <div className="text-sm text-muted-foreground">
                  Original services: <span className="line-through"><CurrencyDisplay amount={transaction.originalServiceAmount} /></span>
                </div>
              )}
              {(transaction.metadata?.discountApplied || (transaction.discountPercentage && transaction.discountPercentage > 0)) && (
                <div className="text-sm text-green-600 mb-2">
                  {transaction.discountPercentage || transaction.metadata?.discountPercentage}% discount applied
                </div>
              )}
              <Badge variant={getStatusVariant(transaction.status)}>
                {transaction.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Transaction Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getSourceIcon(transaction.source)}
                <div>
                  <p className="text-sm font-medium">Source</p>
                  <p className="text-sm text-muted-foreground">
                    {getSourceLabel(transaction.source)}
                  </p>
                </div>
              </div>

              {transaction.clientName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Client</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.clientName}
                    </p>
                  </div>
                </div>
              )}

              {transaction.staffName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Staff</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.staffName}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPaymentMethod(transaction.paymentMethod)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {getLocationName(transaction.location)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Type</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.type}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Discount Information */}
          {(transaction.metadata?.discountApplied || (transaction.discountPercentage && transaction.discountPercentage > 0)) && (
            <>
              <Separator />
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3 text-green-800">Discount Applied</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-700">Discount Percentage</p>
                    <p className="text-green-600">{transaction.discountPercentage || transaction.metadata?.discountPercentage}%</p>
                  </div>
                  <div>
                    <p className="font-medium text-green-700">Discount Amount</p>
                    <p className="text-green-600">
                      <CurrencyDisplay amount={transaction.discountAmount || transaction.metadata?.discountAmount || ((transaction.metadata?.originalTotal || transaction.originalServiceAmount || 0) - transaction.amount)} />
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-green-700">Original Total</p>
                    <p className="text-green-600">
                      <CurrencyDisplay amount={transaction.metadata?.originalTotal || transaction.originalServiceAmount || 0} />
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-green-700">Final Amount Paid</p>
                    <p className="text-green-600 font-semibold">
                      <CurrencyDisplay amount={transaction.amount} />
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">
              {transaction.description}
            </p>
          </div>

          {/* Items */}
          {transaction.items && transaction.items.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3">
                  {transaction.type === 'consolidated_sale' ? 'Services & Products' : 'Items'}
                </h4>
                <div className="space-y-2">
                  {transaction.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.name}</p>
                          {item.type && (
                            <Badge variant={item.type === 'service' ? 'default' : 'secondary'} className="text-xs">
                              {item.type}
                            </Badge>
                          )}
                          {item.discountApplied && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              {item.discountPercentage}% off
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × <CurrencyDisplay amount={item.unitPrice} />
                          {item.discountApplied && item.originalPrice && (
                            <span className="ml-2">
                              (Original: <span className="line-through"><CurrencyDisplay amount={item.originalPrice} /></span>)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        <CurrencyDisplay amount={item.totalPrice} />
                        {item.discountApplied && item.discountAmount && (
                          <div className="text-xs text-green-600">
                            Saved: <CurrencyDisplay amount={item.discountAmount} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Consolidated transaction summary */}
                {transaction.type === 'consolidated_sale' && (transaction.serviceAmount || transaction.productAmount) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <h5 className="text-sm font-medium mb-2">Transaction Summary</h5>
                    <div className="space-y-1 text-sm">
                      {transaction.serviceAmount && transaction.serviceAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Services Total:</span>
                          <CurrencyDisplay amount={transaction.serviceAmount} />
                        </div>
                      )}
                      {transaction.productAmount && transaction.productAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Products Total:</span>
                          <CurrencyDisplay amount={transaction.productAmount} />
                        </div>
                      )}
                      {transaction.discountAmount && transaction.discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Total Discount:</span>
                          <span>-<CurrencyDisplay amount={transaction.discountAmount} /></span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Final Total:</span>
                        <CurrencyDisplay amount={transaction.amount} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Metadata */}
          {transaction.metadata && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Additional Information</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  {transaction.metadata.appointmentId && (
                    <p>Appointment ID: {transaction.metadata.appointmentId}</p>
                  )}
                  {transaction.metadata.bookingReference && (
                    <p>Booking Reference: {transaction.metadata.bookingReference}</p>
                  )}
                  {transaction.metadata.completedAt && (
                    <p>Completed: {format(new Date(transaction.metadata.completedAt), 'PPp')}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePrintReceipt} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            {transaction.reference && (
              <Button onClick={handleViewReference} variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                View {transaction.source === TransactionSource.CALENDAR ? 'Appointment' : 
                      transaction.source === TransactionSource.CLIENT_PORTAL ? 'Order' : 'Reference'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
