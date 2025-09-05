"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Referral } from "@/lib/types/loyalty"
import { Share2, Copy, Mail, Users, TrendingUp, Gift, Eye, CheckCircle, Clock, XCircle } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReferralManagementProps {
  clientId: string
  clientName: string
  referralCode: string
  referrals: Referral[]
  onSendReferral: (email: string) => void
  onGenerateNewCode: () => void
}

export function ReferralManagement({ 
  clientId,
  clientName,
  referralCode,
  referrals,
  onSendReferral,
  onGenerateNewCode
}: ReferralManagementProps) {
  const { toast } = useToast()
  const [isReferralDialogOpen, setIsReferralDialogOpen] = useState(false)
  const [referralEmail, setReferralEmail] = useState("")
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard.",
    })
  }

  const handleCopyReferralLink = () => {
    const referralLink = `${window.location.origin}/client-portal?ref=${referralCode}`
    navigator.clipboard.writeText(referralLink)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    })
  }

  const handleSendReferral = () => {
    if (!referralEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter an email address.",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(referralEmail)) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address.",
      })
      return
    }

    onSendReferral(referralEmail)
    setReferralEmail("")
    setIsReferralDialogOpen(false)
    
    toast({
      title: "Referral Sent!",
      description: `Referral invitation sent to ${referralEmail}.`,
    })
  }

  const handleGenerateNewCode = async () => {
    setIsGeneratingCode(true)
    try {
      await onGenerateNewCode()
      toast({
        title: "New Code Generated",
        description: "Your referral code has been updated.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate new code. Please try again.",
      })
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "expired":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const completedReferrals = referrals.filter(r => r.status === "completed")
  const pendingReferrals = referrals.filter(r => r.status === "pending")
  const totalPointsEarned = completedReferrals.reduce((sum, r) => sum + r.pointsAwarded, 0)

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold">{referrals.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Successful Referrals</p>
                <p className="text-2xl font-bold text-green-600">{completedReferrals.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Points Earned</p>
                <p className="text-2xl font-bold text-purple-600">{totalPointsEarned}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>
            Share your unique referral code with friends and family to earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-lg font-bold text-center">
              {referralCode}
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyReferralCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleCopyReferralLink} className="flex-1">
              <Share2 className="mr-2 h-4 w-4" />
              Copy Referral Link
            </Button>
            
            <Dialog open={isReferralDialogOpen} onOpenChange={setIsReferralDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Referral Invitation</DialogTitle>
                  <DialogDescription>
                    Send a referral invitation to a friend via email
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Friend's Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={referralEmail}
                      onChange={(e) => setReferralEmail(e.target.value)}
                      placeholder="friend@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsReferralDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendReferral}>
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              onClick={handleGenerateNewCode}
              disabled={isGeneratingCode}
            >
              {isGeneratingCode ? "Generating..." : "New Code"}
            </Button>
          </div>

          <Alert>
            <Gift className="h-4 w-4" />
            <AlertDescription>
              You earn 200 points for each successful referral, and your friend gets 100 points when they make their first purchase!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            Track your referrals and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No referrals yet</p>
              <p className="text-sm">Start referring friends to earn rewards!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Friend's Email</TableHead>
                    <TableHead>Date Sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points Earned</TableHead>
                    <TableHead>Completed Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">
                        {referral.refereeName || referral.refereeEmail}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(referral.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(referral.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(referral.status)}
                            {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={referral.status === "completed" ? "text-green-600 font-medium" : "text-gray-500"}>
                          {referral.status === "completed" ? `+${referral.pointsAwarded}` : "0"} points
                        </span>
                      </TableCell>
                      <TableCell>
                        {referral.completedAt 
                          ? format(parseISO(referral.completedAt), "MMM dd, yyyy")
                          : "-"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
