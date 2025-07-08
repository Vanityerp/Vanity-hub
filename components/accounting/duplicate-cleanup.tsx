"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTransactions } from "@/lib/transaction-provider"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DuplicateCleanup() {
  const { transactions, cleanupAllDuplicates, cleanupAppointmentDuplicates } = useTransactions()
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [duplicateStats, setDuplicateStats] = useState<{
    appointmentDuplicates: number
    similarDuplicates: number
    totalTransactions: number
  } | null>(null)

  // Analyze for duplicates without removing them
  const analyzeDuplicates = () => {
    setIsAnalyzing(true)
    
    try {
      const appointmentGroups = new Map<string, any[]>()
      const similarGroups = new Map<string, any[]>()
      
      // Group by appointment reference
      transactions.forEach(tx => {
        if (tx.reference?.type === 'appointment' && tx.reference?.id) {
          const appointmentId = tx.reference.id
          if (!appointmentGroups.has(appointmentId)) {
            appointmentGroups.set(appointmentId, [])
          }
          appointmentGroups.get(appointmentId)!.push(tx)
        }
      })
      
      // Group similar transactions
      transactions.forEach(tx => {
        if (tx.clientId && tx.amount && (tx.category === "Appointment Service" || tx.source === "calendar")) {
          const txDate = new Date(tx.date)
          const similarityKey = `${tx.clientId}-${tx.amount}-${txDate.toDateString()}-service`
          
          if (!similarGroups.has(similarityKey)) {
            similarGroups.set(similarityKey, [])
          }
          similarGroups.get(similarityKey)!.push(tx)
        }
      })
      
      // Count duplicates
      let appointmentDuplicates = 0
      appointmentGroups.forEach(group => {
        if (group.length > 1) {
          appointmentDuplicates += group.length - 1
        }
      })
      
      let similarDuplicates = 0
      similarGroups.forEach(group => {
        if (group.length > 1) {
          // Don't double-count appointment duplicates
          const nonAppointmentDuplicates = group.filter(tx => 
            !tx.reference?.type || tx.reference?.type !== 'appointment'
          )
          if (nonAppointmentDuplicates.length > 1) {
            similarDuplicates += nonAppointmentDuplicates.length - 1
          }
        }
      })
      
      setDuplicateStats({
        appointmentDuplicates,
        similarDuplicates,
        totalTransactions: transactions.length
      })
      
      toast({
        title: "Analysis Complete",
        description: `Found ${appointmentDuplicates + similarDuplicates} potential duplicates`,
      })
    } catch (error) {
      console.error('Error analyzing duplicates:', error)
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Failed to analyze transactions for duplicates",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Clean up all duplicates
  const handleCleanup = async () => {
    setIsCleaningUp(true)

    try {
      const removedCount = cleanupAllDuplicates()

      // Re-analyze after cleanup
      setTimeout(() => {
        analyzeDuplicates()
      }, 500)

      toast({
        title: "Cleanup Complete",
        description: `Successfully removed ${removedCount} duplicate transactions`,
        variant: removedCount > 0 ? "default" : "destructive"
      })
    } catch (error) {
      console.error('Error cleaning up duplicates:', error)
      toast({
        variant: "destructive",
        title: "Cleanup Failed",
        description: "Failed to clean up duplicate transactions",
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  // Clean up appointment duplicates specifically
  const handleAppointmentCleanup = async () => {
    setIsCleaningUp(true)

    try {
      const removedCount = cleanupAppointmentDuplicates()

      // Re-analyze after cleanup
      setTimeout(() => {
        analyzeDuplicates()
      }, 500)

      toast({
        title: "Appointment Cleanup Complete",
        description: `Successfully removed ${removedCount} duplicate appointment transactions`,
        variant: removedCount > 0 ? "default" : "destructive"
      })
    } catch (error) {
      console.error('Error cleaning up appointment duplicates:', error)
      toast({
        variant: "destructive",
        title: "Cleanup Failed",
        description: "Failed to clean up duplicate appointment transactions",
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Duplicate Transaction Cleanup
        </CardTitle>
        <CardDescription>
          Analyze and remove duplicate transactions to maintain data integrity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Results */}
        {duplicateStats && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Analysis Results:</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Transactions:</span>
                    <Badge variant="outline" className="ml-2">
                      {duplicateStats.totalTransactions}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Appointment Duplicates:</span>
                    <Badge variant={duplicateStats.appointmentDuplicates > 0 ? "destructive" : "secondary"} className="ml-2">
                      {duplicateStats.appointmentDuplicates}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Similar Duplicates:</span>
                    <Badge variant={duplicateStats.similarDuplicates > 0 ? "destructive" : "secondary"} className="ml-2">
                      {duplicateStats.similarDuplicates}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Duplicates:</span>
                    <Badge variant={duplicateStats.appointmentDuplicates + duplicateStats.similarDuplicates > 0 ? "destructive" : "default"} className="ml-2">
                      {duplicateStats.appointmentDuplicates + duplicateStats.similarDuplicates}
                    </Badge>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={analyzeDuplicates}
            disabled={isAnalyzing || isCleaningUp}
            variant="outline"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Analyze Duplicates
              </>
            )}
          </Button>

          <Button
            onClick={handleAppointmentCleanup}
            disabled={isCleaningUp || isAnalyzing || !duplicateStats || duplicateStats.appointmentDuplicates === 0}
            variant={duplicateStats && duplicateStats.appointmentDuplicates > 0 ? "destructive" : "default"}
            size="sm"
          >
            {isCleaningUp ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Cleaning...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Fix Appointment Duplicates
              </>
            )}
          </Button>

          <Button
            onClick={handleCleanup}
            disabled={isCleaningUp || isAnalyzing || !duplicateStats || (duplicateStats.appointmentDuplicates + duplicateStats.similarDuplicates === 0)}
            variant={duplicateStats && (duplicateStats.appointmentDuplicates + duplicateStats.similarDuplicates > 0) ? "destructive" : "default"}
          >
            {isCleaningUp ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Cleaning Up...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove All Duplicates
              </>
            )}
          </Button>
        </div>

        {/* Information */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• <strong>Appointment Duplicates:</strong> Multiple transactions for the same appointment (common with discount applications)</p>
          <p>• <strong>Similar Duplicates:</strong> Transactions with same client, amount, and date</p>
          <p>• <strong>Fix Appointment Duplicates:</strong> Specifically targets duplicate appointment transactions (recommended for discount issues)</p>
          <p>• <strong>Remove All Duplicates:</strong> Comprehensive cleanup of all duplicate types</p>
          <p>• The cleanup process keeps the most recent transaction and removes older duplicates</p>
          <p>• Always analyze before cleaning to see what will be removed</p>
        </div>
      </CardContent>
    </Card>
  )
}
