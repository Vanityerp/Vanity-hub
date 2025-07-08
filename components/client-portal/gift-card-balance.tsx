"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useGiftCards } from "@/lib/gift-card-provider"
import { CurrencyDisplay } from "@/components/ui/currency-display"
import { Gift, Search, Eye, Calendar, CreditCard, Plus } from "lucide-react"
import { format } from "date-fns"
import { GiftCardStatus, isGiftCardValid } from "@/lib/gift-card-types"
import { GiftCardPurchaseDialog } from "./gift-card-purchase-dialog"
import { SettingsStorage, type GeneralSettings, LiveChatUtils } from "@/lib/settings-storage"

export function GiftCardBalance() {
  const { toast } = useToast()
  const { validateGiftCard, giftCardTransactions } = useGiftCards()

  const [giftCardCode, setGiftCardCode] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [businessSettings, setBusinessSettings] = useState<GeneralSettings | null>(null)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    giftCard?: any
    message: string
  } | null>(null)

  // Load business settings
  useEffect(() => {
    const settings = SettingsStorage.getGeneralSettings()
    setBusinessSettings(settings)
  }, [])

  const handleCheckBalance = async () => {
    if (!giftCardCode.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a gift card code",
        variant: "destructive"
      })
      return
    }

    setIsChecking(true)
    try {
      const result = validateGiftCard(giftCardCode.toUpperCase())
      setValidationResult(result)
      
      if (!result.valid) {
        toast({
          title: "Gift Card Not Found",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check gift card balance. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsChecking(false)
    }
  }

  const giftCardHistory = validationResult?.giftCard 
    ? giftCardTransactions.filter(t => t.giftCardId === validationResult.giftCard.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Gift Cards
              </CardTitle>
              <CardDescription>
                Check your gift card balance or purchase new gift cards
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowPurchaseDialog(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Purchase Gift Card
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-3">Check Gift Card Balance</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="giftCardCode">Gift Card Code</Label>
                <Input
                  id="giftCardCode"
                  placeholder="Enter your gift card code (e.g., GIFT-1234-5678-9012)"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleCheckBalance()}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCheckBalance} disabled={isChecking} variant="outline">
                  {isChecking ? (
                    "Checking..."
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Check Balance
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {validationResult && (
            <div className="space-y-4">
              {validationResult.valid && validationResult.giftCard ? (
                <div className="space-y-4">
                  {/* Gift Card Details */}
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Gift Card Code</span>
                          <span className="font-mono font-medium">{validationResult.giftCard.code}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current Balance</span>
                          <span className="text-2xl font-bold text-green-600">
                            <CurrencyDisplay amount={validationResult.giftCard.currentBalance} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Original Amount</span>
                          <span className="font-medium">
                            <CurrencyDisplay amount={validationResult.giftCard.originalAmount} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge 
                            variant={
                              validationResult.giftCard.status === GiftCardStatus.ACTIVE ? "default" :
                              validationResult.giftCard.status === GiftCardStatus.REDEEMED ? "secondary" :
                              "destructive"
                            }
                          >
                            {validationResult.giftCard.status}
                          </Badge>
                        </div>
                        {validationResult.giftCard.expirationDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Expires</span>
                            <span className="font-medium">
                              {format(new Date(validationResult.giftCard.expirationDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Issued Date</span>
                          <span className="font-medium">
                            {format(new Date(validationResult.giftCard.issuedDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Usage Instructions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">How to Use Your Gift Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full" />
                          Present this code at checkout when booking services or purchasing products
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full" />
                          Gift cards can be used for partial payments - any remaining balance stays on the card
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full" />
                          Valid at all salon locations and for online purchases
                        </li>
                        {validationResult.giftCard.expirationDate && (
                          <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full" />
                            <span className="text-orange-600">
                              Remember to use before expiration date: {format(new Date(validationResult.giftCard.expirationDate), 'MMM d, yyyy')}
                            </span>
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Transaction History */}
                  {giftCardHistory.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Transaction History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Balance After</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {giftCardHistory.map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>
                                  {format(new Date(transaction.createdAt), 'MMM d, yyyy HH:mm')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {transaction.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className={transaction.type === 'redemption' ? 'text-red-600' : 'text-green-600'}>
                                    {transaction.type === 'redemption' ? '-' : '+'}
                                    <CurrencyDisplay amount={transaction.amount} />
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <CurrencyDisplay amount={transaction.balanceAfter} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Gift className="h-12 w-12 text-red-400 mx-auto mb-2" />
                      <h3 className="font-medium text-red-800">Gift Card Not Found</h3>
                      <p className="text-sm text-red-600 mt-1">{validationResult.message}</p>
                      <div className="mt-4 text-xs text-red-500">
                        <p>Please check your gift card code and try again.</p>
                        <p>If you continue to have issues, please contact customer support.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gift Card Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gift Card Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Terms & Conditions</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Gift cards are non-refundable</li>
                <li>• Cannot be exchanged for cash</li>
                <li>• Valid for services and products only</li>
                <li>• Can be used for partial payments</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Need Help?</h4>
              <ul className="space-y-1 text-muted-foreground">
                {businessSettings?.phone && (
                  <li>• Contact us at {businessSettings.phone}</li>
                )}
                {businessSettings?.email && (
                  <li>• Email: {businessSettings.email}</li>
                )}
                <li>• Visit any salon location</li>
                {businessSettings?.liveChat?.enabled && (
                  <li>
                    {businessSettings.liveChat.serviceUrl ? (
                      <a
                        href={businessSettings.liveChat.serviceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700 hover:underline cursor-pointer"
                      >
                        • {LiveChatUtils.getLiveChatText(businessSettings)}
                      </a>
                    ) : (
                      <span>• {LiveChatUtils.getLiveChatText(businessSettings)}</span>
                    )}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Dialog */}
      <GiftCardPurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        onSuccess={() => {
          toast({
            title: "Gift Card Purchased!",
            description: "Your gift card has been successfully purchased."
          })
        }}
      />
    </div>
  )
}
