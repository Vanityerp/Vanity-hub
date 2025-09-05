"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useServices } from "@/lib/service-provider"
import { useTransactions } from "@/lib/transaction-provider"
import { TransactionServiceMigration } from "@/lib/transaction-service-migration"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TransactionServiceValidationPage() {
  const { services } = useServices()
  const { transactions, addTransaction } = useTransactions()
  const { toast } = useToast()
  const [validationResults, setValidationResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [ignoreOldTransactions, setIgnoreOldTransactions] = useState(true)

  // Set cutoff date to 30 days ago for ignoring old transactions
  const cutoffDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date
  }, [])

  const runValidation = useCallback(() => {
    setIsRunning(true)

    try {
      console.log('🔍 Running transaction service validation...', {
        ignoreOldTransactions,
        cutoffDate: ignoreOldTransactions ? cutoffDate.toISOString() : 'none'
      })

      // Get statistics about service reference issues
      const stats = TransactionServiceMigration.getServiceReferenceStatistics(
        transactions,
        ignoreOldTransactions ? cutoffDate : undefined
      )

      // Filter transactions for detailed validation
      let serviceTransactions = transactions.filter(t => t.type === 'service_sale')

      if (ignoreOldTransactions) {
        serviceTransactions = serviceTransactions.filter(transaction => {
          const txDate = typeof transaction.date === 'string' ? new Date(transaction.date) : transaction.date
          return txDate >= cutoffDate
        })
      }

      const validationDetails = serviceTransactions.map(transaction => {
        const validation = TransactionServiceMigration.validateTransactionServiceReferences(transaction)
        const txDate = typeof transaction.date === 'string' ? new Date(transaction.date) : transaction.date

        return {
          transactionId: transaction.id,
          amount: transaction.amount,
          description: transaction.description,
          date: txDate,
          isValid: validation.isValid,
          issues: validation.issues,
          suggestions: validation.suggestions,
          hasMetadataServiceId: !!transaction.metadata?.serviceId,
          hasMetadataServiceIds: !!transaction.metadata?.serviceIds,
          hasServiceItems: transaction.items?.some(item =>
            (item.category === 'Service' || item.category === 'Additional Service') && item.serviceId
          ) || false
        }
      })

      setValidationResults({
        stats,
        details: validationDetails,
        totalServices: services.length,
        lastUpdated: new Date()
      })

      console.log('✅ Validation complete:', stats)

    } catch (error) {
      console.error('❌ Validation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast({
        title: "Validation Failed",
        description: `An error occurred during validation: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }, [transactions, services.length, ignoreOldTransactions, cutoffDate, toast])

  // Run validation on component mount and when data changes
  useEffect(() => {
    if (services.length > 0 && transactions.length > 0) {
      runValidation()
    }
  }, [services.length, transactions.length, runValidation])

  const fixTransactions = async () => {
    setIsRunning(true)
    
    try {
      console.log('🔧 Fixing transaction service references...')
      
      const fixedTransactions = TransactionServiceMigration.fixAllTransactionServiceReferences(transactions)
      
      // Check if any transactions were actually fixed
      const changedCount = fixedTransactions.filter((tx, index) => 
        JSON.stringify(tx) !== JSON.stringify(transactions[index])
      ).length
      
      if (changedCount > 0) {
        // Save the fixed transactions to localStorage
        localStorage.setItem('vanity_transactions', JSON.stringify(fixedTransactions))
        
        toast({
          title: "Transactions Fixed",
          description: `${changedCount} transactions were updated with proper service references.`,
        })
        
        // Refresh the page to reload the transaction provider
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          title: "No Changes Needed",
          description: "All transactions already have valid service references.",
        })
      }
      
    } catch (error) {
      console.error('❌ Fix failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast({
        title: "Fix Failed",
        description: `An error occurred while fixing transactions: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }

  const createTestTransaction = () => {
    // Create a test service transaction with proper service references
    const testService = services[0] // Use the first service
    if (!testService) {
      toast({
        title: "No Services Available",
        description: "Cannot create test transaction without services.",
        variant: "destructive"
      })
      return
    }

    const testTransaction = {
      date: new Date(),
      type: 'service_sale' as const,
      category: "Test Service Sale",
      description: `Test transaction - ${testService.name}`,
      amount: testService.price,
      paymentMethod: 'cash' as const,
      status: 'completed' as const,
      location: "loc1",
      source: 'calendar' as const,
      items: [{
        id: testService.id,
        name: testService.name,
        quantity: 1,
        unitPrice: testService.price,
        totalPrice: testService.price,
        category: 'Service',
        serviceId: testService.id
      }],
      metadata: {
        serviceId: testService.id,
        serviceIds: [testService.id],
        serviceName: testService.name,
        serviceNames: [testService.name],
        testTransaction: true
      }
    }

    addTransaction(testTransaction)
    
    toast({
      title: "Test Transaction Created",
      description: `Created test transaction for ${testService.name}`,
    })
  }

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />
  }

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction Service Validation</h1>
          <p className="text-muted-foreground">
            Validate and fix service references in transactions
          </p>
        </div>
      </div>

      {/* Validation Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Validation Options
          </CardTitle>
          <CardDescription>
            Configure how transactions are validated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="ignore-old"
              checked={ignoreOldTransactions}
              onCheckedChange={setIgnoreOldTransactions}
            />
            <Label htmlFor="ignore-old" className="text-sm">
              Ignore transactions older than 30 days
            </Label>
          </div>
          {ignoreOldTransactions && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              <strong>Cutoff Date:</strong> {cutoffDate.toLocaleDateString()}
              <br />
              <em>Past transactions are often missing service references due to system evolution.</em>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Run Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runValidation}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate Transactions'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fix Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fixTransactions}
              disabled={isRunning}
              variant="outline"
              className="w-full"
            >
              Fix Service References
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createTestTransaction}
              disabled={isRunning || services.length === 0}
              variant="secondary"
              className="w-full"
            >
              Create Test Transaction
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Services:</span>
              <Badge variant="outline">{services.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Total Transactions:</span>
              <Badge variant="outline">{transactions.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Service Transactions:</span>
              <Badge variant="outline">
                {transactions.filter(t => t.type === 'service_sale').length}
              </Badge>
            </div>
            {validationResults?.stats?.ignoredOldTransactions !== undefined && (
              <div className="flex justify-between">
                <span>Ignored (Old):</span>
                <Badge variant="secondary">
                  {validationResults.stats.ignoredOldTransactions}
                </Badge>
              </div>
            )}
            <div className="flex justify-between">
              <span>Last Validation:</span>
              <Badge variant="outline">
                {validationResults?.lastUpdated ?
                  validationResults.lastUpdated.toLocaleTimeString() :
                  'Never'
                }
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
              {validationResults.stats.ignoredOldTransactions > 0 && (
                <CardDescription>
                  {validationResults.stats.ignoredOldTransactions} old transactions were ignored (before {cutoffDate.toLocaleDateString()})
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {validationResults.stats.validTransactions}
                  </div>
                  <div className="text-sm text-muted-foreground">Valid Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {validationResults.stats.invalidTransactions}
                  </div>
                  <div className="text-sm text-muted-foreground">Invalid Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {validationResults.stats.totalServiceTransactions}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {ignoreOldTransactions ? 'Recent' : 'Total'} Service Transactions
                  </div>
                </div>
              </div>

              {validationResults.stats.ignoredOldTransactions > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {validationResults.stats.ignoredOldTransactions} old transactions ignored
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    These transactions are from before {cutoffDate.toLocaleDateString()} and are excluded from validation
                    as they may lack service references due to system evolution.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Results */}
          {validationResults.details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>
                  Detailed validation results for each service transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validationResults.details.map((detail: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getStatusColor(detail.isValid)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(detail.isValid)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{detail.transactionId}</h3>
                            <Badge variant={detail.isValid ? 'default' : 'destructive'}>
                              {detail.isValid ? 'VALID' : 'INVALID'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {detail.description} - QAR {detail.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Date: {detail.date.toLocaleDateString()}
                          </p>
                          
                          {/* Validation Details */}
                          <div className="mt-2 text-xs space-y-1">
                            <div className="flex gap-4">
                              <span className={detail.hasMetadataServiceId ? 'text-green-600' : 'text-red-600'}>
                                Metadata ServiceId: {detail.hasMetadataServiceId ? '✓' : '✗'}
                              </span>
                              <span className={detail.hasServiceItems ? 'text-green-600' : 'text-red-600'}>
                                Service Items: {detail.hasServiceItems ? '✓' : '✗'}
                              </span>
                            </div>
                          </div>
                          
                          {detail.issues.length > 0 && (
                            <ul className="text-xs text-red-600 mt-2 space-y-1">
                              {detail.issues.map((issue: string, idx: number) => (
                                <li key={idx}>• {issue}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
