"use client"

import { useState, useEffect } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Banknote, CreditCard, Receipt, Smartphone, Gift } from "lucide-react"
import { useCurrency } from "@/lib/currency-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { printReceipt } from "@/components/accounting/receipt-printer.ts"
import { Transaction } from "@/lib/transaction-types"
import { useTransactions } from "@/lib/transaction-provider"
import { useLocations } from "@/lib/location-provider"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  serviceTotal: number // New prop for service-only total
  onComplete: (paymentMethod: string, giftCardCode?: string, giftCardAmount?: number, discountPercentage?: number, discountAmount?: number, serviceDiscountAmount?: number) => void
  lastTransaction?: Transaction | null // New prop for the last transaction
}

export function PaymentDialog({ open, onOpenChange, total, serviceTotal, onComplete, lastTransaction }: PaymentDialogProps) {
  const { currency, formatCurrency } = useCurrency()
  const { getLocationName } = useLocations();
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [amountPaid, setAmountPaid] = useState(total.toFixed(currency.decimalDigits))
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)

  // Discount state
  const [discountPercentage, setDiscountPercentage] = useState("")
  const [discountAmount, setDiscountAmount] = useState(0) // Add discountAmount state
  const [discountError, setDiscountError] = useState("")

  // Calculate discount amounts
  const discountPercent = parseFloat(discountPercentage) || 0
  const serviceDiscountAmount = (serviceTotal * discountPercent) / 100
  const totalDiscountAmount = serviceDiscountAmount // For now, total discount is only from services
  const finalTotal = total - totalDiscountAmount

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState("")
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null)
  const [giftCardAmount, setGiftCardAmount] = useState("")
  const [giftCardError, setGiftCardError] = useState("")

  // Update amount paid when total or discount changes
  useEffect(() => {
    setAmountPaid(finalTotal.toFixed(currency.decimalDigits))
  }, [finalTotal, currency.decimalDigits])

  // Update discountAmount whenever discountPercentage or total changes
  useEffect(() => {
    setDiscountAmount(total * discountPercent / 100)
  }, [total, discountPercent])
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false)

  const validateGiftCard = async (code: string) => {
    if (!code.trim()) {
      setGiftCardError("")
      setGiftCardBalance(null)
      return
    }

    setIsValidatingGiftCard(true)
    setGiftCardError("")

    try {
      // Simulate gift card validation - in real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock validation logic
      if (code.toUpperCase() === "GIFT-1234-5678-9012") {
        setGiftCardBalance(150.00)
        setGiftCardAmount(Math.min(total, 150.00).toFixed(currency.decimalDigits))
      } else if (code.toUpperCase() === "GIFT-ABCD-EFGH-IJKL") {
        setGiftCardBalance(75.50)
        setGiftCardAmount(Math.min(total, 75.50).toFixed(currency.decimalDigits))
      } else {
        setGiftCardError("Invalid gift card code or gift card not found")
        setGiftCardBalance(null)
      }
    } catch (error) {
      setGiftCardError("Error validating gift card. Please try again.")
      setGiftCardBalance(null)
    } finally {
      setIsValidatingGiftCard(false)
    }
  }

  // Handle discount percentage change with validation
  const handleDiscountChange = (value: string) => {
    setDiscountPercentage(value)
    setDiscountError("")

    const percent = parseFloat(value)
    if (value && (isNaN(percent) || percent < 0 || percent > 100)) {
      setDiscountError("Discount must be between 0 and 100")
    }
  }

  const handlePrintReceipt = () => {
    // Prevent double-clicking
    if (isPrintingReceipt || !lastTransaction) {
      return;
    }

    setIsPrintingReceipt(true)
    
    try {
      // Print the receipt
      printReceipt(lastTransaction, getLocationName)
      
      // Auto-close dialog after a short delay to allow printing to start
      setTimeout(() => {
        onOpenChange(false)
      }, 500)
    } catch (error) {
      console.error('Error printing receipt:', error)
      setIsPrintingReceipt(false)
    }
  }

  const handlePayment = () => {
    // Prevent double-clicking
    if (isProcessing || paymentCompleted) {
      return;
    }

    setIsProcessing(true)

    // Guard: Prevent zero or negative finalTotal
    if (finalTotal <= 0) {
      setDiscountError("Transaction amount must be greater than zero. Please check your cart and discounts.");
      setIsProcessing(false);
      return;
    }

    // Validate discount
    if (discountPercentage && (discountPercent < 0 || discountPercent > 100)) {
      setDiscountError("Discount must be between 0 and 100")
      setIsProcessing(false)
      return
    }

    // Validate gift card payment
    if (paymentMethod === "gift-card") {
      if (!giftCardCode.trim()) {
        setGiftCardError("Please enter a gift card code")
        setIsProcessing(false)
        return
      }
      if (giftCardBalance === null) {
        setGiftCardError("Please validate the gift card first")
        setIsProcessing(false)
        return
      }
      const amount = parseFloat(giftCardAmount)
      if (amount <= 0 || amount > giftCardBalance) {
        setGiftCardError("Invalid gift card amount")
        setIsProcessing(false)
        return
      }
    }

    // Simulate payment processing
    setTimeout(() => {
      let method = "Credit Card"
      if (paymentMethod === "cash") method = "Cash"
      else if (paymentMethod === "mobile") method = "Mobile Payment"
      else if (paymentMethod === "gift-card") method = "Gift Card"

      onComplete(
        method,
        paymentMethod === "gift-card" ? giftCardCode : undefined,
        paymentMethod === "gift-card" ? parseFloat(giftCardAmount) : undefined,
        discountPercent > 0 ? discountPercent : undefined,
        totalDiscountAmount > 0 ? totalDiscountAmount : undefined,
        serviceDiscountAmount > 0 ? serviceDiscountAmount : undefined
      )
      setIsProcessing(false)
      setPaymentCompleted(true)
      // Don't reset form immediately - keep it open to show print receipt button
      // resetForm() will be called when dialog is closed
    }, 1500)
  }

  const resetForm = () => {
    setPaymentMethod("card")
    setDiscountPercentage("")
    setDiscountAmount(0) // Reset discountAmount
    setDiscountError("")
    setCardNumber("")
    setCardExpiry("")
    setCardCvc("")
    setNotes("")
    setGiftCardCode("")
    setGiftCardBalance(null)
    setGiftCardAmount("")
    setGiftCardError("")
    setPaymentCompleted(false)
    setIsPrintingReceipt(false)
    // Amount paid will be updated by useEffect when discount is reset
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")

    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`
    }

    return value
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isProcessing && !isPrintingReceipt) {
          onOpenChange(newOpen)
          if (!newOpen) resetForm()
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            Complete the transaction for <CurrencyDisplay amount={finalTotal} />
            {discountAmount > 0 && (
              <span className="text-green-600 ml-2">
                (Original: <CurrencyDisplay amount={total} />, Discount: {discountPercent}%)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Discount Section */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <Label htmlFor="discount" className="text-sm font-medium">Discount (%)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                value={discountPercentage}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="w-20 text-right"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          {discountError && (
            <p className="text-sm text-red-600">{discountError}</p>
          )}

          {discountAmount > 0 && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Original Total:</span>
                <span><CurrencyDisplay amount={total} /></span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount ({discountPercent}%):</span>
                <span>-<CurrencyDisplay amount={discountAmount} /></span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t pt-2">
                <span>Final Total:</span>
                <span><CurrencyDisplay amount={finalTotal} /></span>
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="card" value={paymentMethod} onValueChange={setPaymentMethod}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Card</span>
            </TabsTrigger>
            <TabsTrigger value="cash" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              <span>Cash</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span>Mobile</span>
            </TabsTrigger>
            <TabsTrigger value="gift-card" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span>Gift Card</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="card" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardExpiry">Expiry Date</Label>
                <Input
                  id="cardExpiry"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardCvc">CVC</Label>
                <Input
                  id="cardCvc"
                  placeholder="123"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cash" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount Received</Label>
              <Input
                id="amountPaid"
                type="number"
                min={finalTotal}
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
            </div>
            <div className="rounded-md bg-muted p-4">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span><CurrencyDisplay amount={finalTotal} /></span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Amount Received</span>
                <span><CurrencyDisplay amount={Number.parseFloat(amountPaid || "0")} /></span>
              </div>
              <div className="flex justify-between mt-2 font-medium">
                <span>Change</span>
                <span><CurrencyDisplay amount={Math.max(0, Number.parseFloat(amountPaid || "0") - finalTotal)} /></span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4">
            <div className="rounded-md bg-muted p-4 text-center">
              <Smartphone className="h-16 w-16 mx-auto mb-2" />
              <p>Process payment through mobile payment app</p>
              <p className="text-sm text-muted-foreground mt-2">Show the customer the payment terminal or QR code</p>
            </div>
          </TabsContent>

          <TabsContent value="gift-card" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="giftCardCode">Gift Card Code</Label>
              <div className="flex gap-2">
                <Input
                  id="giftCardCode"
                  placeholder="Enter gift card code"
                  value={giftCardCode}
                  onChange={(e) => {
                    setGiftCardCode(e.target.value.toUpperCase())
                    setGiftCardError("")
                  }}
                  onBlur={() => validateGiftCard(giftCardCode)}
                />
                <Button
                  variant="outline"
                  onClick={() => validateGiftCard(giftCardCode)}
                  disabled={isValidatingGiftCard || !giftCardCode.trim()}
                >
                  {isValidatingGiftCard ? "Validating..." : "Validate"}
                </Button>
              </div>
              {giftCardError && (
                <p className="text-sm text-destructive">{giftCardError}</p>
              )}
            </div>

            {giftCardBalance !== null && (
              <div className="space-y-4">
                <div className="rounded-md bg-green-50 p-4 border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Gift Card Balance</span>
                    <span className="font-bold text-green-600">
                      <CurrencyDisplay amount={giftCardBalance} />
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="giftCardAmount">Amount to Use</Label>
                  <Input
                    id="giftCardAmount"
                    type="number"
                    min="0.01"
                    max={Math.min(total, giftCardBalance)}
                    step="0.01"
                    value={giftCardAmount}
                    onChange={(e) => setGiftCardAmount(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum: <CurrencyDisplay amount={Math.min(total, giftCardBalance)} />
                  </p>
                </div>

                <div className="rounded-md bg-muted p-4">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span><CurrencyDisplay amount={total} /></span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Gift Card Payment</span>
                    <span><CurrencyDisplay amount={parseFloat(giftCardAmount) || 0} /></span>
                  </div>
                  <div className="flex justify-between mt-2 font-medium">
                    <span>Remaining Balance</span>
                    <span><CurrencyDisplay amount={Math.max(0, total - (parseFloat(giftCardAmount) || 0))} /></span>
                  </div>
                  {total > (parseFloat(giftCardAmount) || 0) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Additional payment method required for remaining balance
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <div className="space-y-2 mt-4">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this transaction"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </Tabs>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isProcessing || isPrintingReceipt}
          >
            {lastTransaction ? "Close" : "Cancel"}
          </Button>
          {/* Print Receipt button appears after payment (when lastTransaction is present) */}
          {lastTransaction && (
            <Button
              variant="secondary"
              onClick={handlePrintReceipt}
              disabled={isPrintingReceipt}
              type="button"
            >
              {isPrintingReceipt ? (
                <>
                  <Receipt className="mr-2 h-4 w-4 animate-spin" />
                  Printing...
                </>
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Print Receipt
                </>
              )}
            </Button>
          )}
          {!lastTransaction && (
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing || paymentCompleted}
            >
              {isProcessing ? (
                "Processing..."
              ) : paymentCompleted ? (
                "Payment Completed"
              ) : (
                <>
                  <Receipt className="mr-2 h-4 w-4" />
                  Complete Payment
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

