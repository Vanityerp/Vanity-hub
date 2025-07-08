"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  level?: 'page' | 'component' | 'critical'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log error details
    console.error('Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      level: this.props.level || 'component',
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Send error to monitoring service
    this.reportError(error, errorInfo)

    // Show user-friendly toast notification
    toast({
      title: "Something went wrong",
      description: this.getUserFriendlyMessage(error),
      variant: "destructive",
    })
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In production, send to error monitoring service (Sentry, LogRocket, etc.)
      if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureException(error, { extra: errorInfo })
        
        // For now, send to our own error logging endpoint
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorId: this.state.errorId,
            timestamp: new Date().toISOString(),
            level: this.props.level || 'component',
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        })
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private getUserFriendlyMessage = (error: Error): string => {
    // Map technical errors to user-friendly messages
    const errorMessage = error.message.toLowerCase()
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection.'
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return 'You don\'t have permission to perform this action.'
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return 'Please check your input and try again.'
    }
    
    if (errorMessage.includes('timeout')) {
      return 'The request took too long. Please try again.'
    }
    
    // Default message
    return 'An unexpected error occurred. Our team has been notified.'
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      })
      
      toast({
        title: "Retrying...",
        description: `Attempt ${this.retryCount} of ${this.maxRetries}`,
      })
    } else {
      toast({
        title: "Maximum retries reached",
        description: "Please refresh the page or contact support.",
        variant: "destructive",
      })
    }
  }

  private handleRefresh = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`)
    const body = encodeURIComponent(`
Error Details:
- Error ID: ${this.state.errorId}
- Message: ${this.state.error?.message}
- Timestamp: ${new Date().toISOString()}
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
[Your description here]
    `)
    
    window.open(`mailto:support@vanityhub.com?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Determine error severity and UI
      const isCritical = this.props.level === 'critical'
      const isPageLevel = this.props.level === 'page'

      return (
        <div className={`flex items-center justify-center ${isPageLevel ? 'min-h-screen' : 'min-h-[400px]'} p-4`}>
          <Card className={`w-full max-w-md ${isCritical ? 'border-destructive' : ''}`}>
            <CardHeader className="text-center">
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                isCritical ? 'bg-destructive/10' : 'bg-orange-100'
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  isCritical ? 'text-destructive' : 'text-orange-600'
                }`} />
              </div>
              <CardTitle className={isCritical ? 'text-destructive' : ''}>
                {isCritical ? 'Critical Error' : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {this.getUserFriendlyMessage(this.state.error!)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {this.props.showDetails && this.state.error && (
                <details className="rounded border p-3 text-sm">
                  <summary className="cursor-pointer font-medium">
                    Technical Details
                  </summary>
                  <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 overflow-auto whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2">
                {this.retryCount < this.maxRetries && (
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={this.handleRefresh}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Page
                  </Button>
                  
                  {isPageLevel && (
                    <Button 
                      variant="outline" 
                      onClick={this.handleGoHome}
                      className="flex-1"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Go Home
                    </Button>
                  )}
                </div>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={this.handleReportBug}
                  className="w-full"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Report Bug (Error ID: {this.state.errorId})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Convenience wrapper components
export const PageErrorBoundary = ({ children, ...props }: Omit<Props, 'level'>) => (
  <ErrorBoundary level="page" {...props}>
    {children}
  </ErrorBoundary>
)

export const ComponentErrorBoundary = ({ children, ...props }: Omit<Props, 'level'>) => (
  <ErrorBoundary level="component" {...props}>
    {children}
  </ErrorBoundary>
)

export const CriticalErrorBoundary = ({ children, ...props }: Omit<Props, 'level'>) => (
  <ErrorBoundary level="critical" showDetails {...props}>
    {children}
  </ErrorBoundary>
)
