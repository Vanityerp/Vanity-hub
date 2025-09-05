"use client"

interface ErrorReport {
  message: string
  filename?: string
  lineno?: number
  colno?: number
  error?: {
    name?: string
    message?: string
    stack?: string
  }
  url: string
  userAgent: string
  timestamp: string
  userId?: string
  sessionId?: string
}

interface UnhandledRejectionReport {
  reason: any
  promise: Promise<any>
  url: string
  userAgent: string
  timestamp: string
  userId?: string
  sessionId?: string
}

class ClientErrorHandler {
  private isInitialized = false
  private errorQueue: ErrorReport[] = []
  private rejectionQueue: UnhandledRejectionReport[] = []
  private maxQueueSize = 50
  private flushInterval = 5000 // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize()
    }
  }

  private initialize(): void {
    if (this.isInitialized) return

    // Handle JavaScript errors
    window.addEventListener('error', this.handleError.bind(this))
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))
    
    // Handle React error boundaries (if needed)
    this.setupReactErrorHandler()
    
    // Start periodic flushing
    this.startFlushTimer()
    
    // Flush on page unload
    window.addEventListener('beforeunload', this.flush.bind(this))
    
    this.isInitialized = true
    console.log('Client error handler initialized')
  }

  private handleError(event: ErrorEvent): void {
    try {
      const errorReport: ErrorReport = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? {
          name: event.error.name,
          message: event.error.message,
          stack: event.error.stack,
        } : undefined,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
      }

      this.queueError(errorReport)
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Client error captured:', errorReport)
      }
    } catch (handlerError) {
      console.error('Error in error handler:', handlerError)
    }
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    try {
      const rejectionReport: UnhandledRejectionReport = {
        reason: this.serializeReason(event.reason),
        promise: event.promise,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
      }

      this.queueRejection(rejectionReport)
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Unhandled promise rejection captured:', rejectionReport)
      }
    } catch (handlerError) {
      console.error('Error in rejection handler:', handlerError)
    }
  }

  private setupReactErrorHandler(): void {
    // This would be called by React error boundaries
    // We'll expose a method for error boundaries to call
    (window as any).__reportReactError = (error: Error, errorInfo: any) => {
      const errorReport: ErrorReport = {
        message: error.message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
      }

      this.queueError(errorReport)
    }
  }

  private serializeReason(reason: any): any {
    if (reason instanceof Error) {
      return {
        name: reason.name,
        message: reason.message,
        stack: reason.stack,
      }
    }
    
    if (typeof reason === 'object' && reason !== null) {
      try {
        return JSON.parse(JSON.stringify(reason))
      } catch {
        return { message: 'Unable to serialize rejection reason' }
      }
    }
    
    return { message: String(reason) }
  }

  private getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      // From session storage
      const userId = sessionStorage.getItem('userId')
      if (userId) return userId

      // From local storage
      const localUserId = localStorage.getItem('userId')
      if (localUserId) return localUserId

      // From global variable (if set by auth system)
      if ((window as any).__USER_ID__) {
        return (window as any).__USER_ID__
      }

      return undefined
    } catch {
      return undefined
    }
  }

  private getSessionId(): string | undefined {
    try {
      // Try to get session ID from session storage
      let sessionId = sessionStorage.getItem('sessionId')
      
      if (!sessionId) {
        // Generate a new session ID
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('sessionId', sessionId)
      }
      
      return sessionId
    } catch {
      return undefined
    }
  }

  private queueError(errorReport: ErrorReport): void {
    this.errorQueue.push(errorReport)
    
    // Limit queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize)
    }
    
    // Flush immediately for critical errors
    if (this.isCriticalError(errorReport)) {
      this.flush()
    }
  }

  private queueRejection(rejectionReport: UnhandledRejectionReport): void {
    this.rejectionQueue.push(rejectionReport)
    
    // Limit queue size
    if (this.rejectionQueue.length > this.maxQueueSize) {
      this.rejectionQueue = this.rejectionQueue.slice(-this.maxQueueSize)
    }
  }

  private isCriticalError(errorReport: ErrorReport): boolean {
    const criticalPatterns = [
      /chunk.*failed/i,
      /network.*error/i,
      /script.*error/i,
      /security.*error/i,
    ]
    
    return criticalPatterns.some(pattern => 
      pattern.test(errorReport.message) || 
      pattern.test(errorReport.error?.message || '')
    )
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  private async flush(): Promise<void> {
    if (this.errorQueue.length === 0 && this.rejectionQueue.length === 0) {
      return
    }

    try {
      // Send errors
      if (this.errorQueue.length > 0) {
        const errors = [...this.errorQueue]
        this.errorQueue = []
        
        await this.sendErrors(errors)
      }

      // Send rejections
      if (this.rejectionQueue.length > 0) {
        const rejections = [...this.rejectionQueue]
        this.rejectionQueue = []
        
        await this.sendRejections(rejections)
      }
    } catch (error) {
      console.error('Failed to flush error reports:', error)
      // Don't re-queue errors to avoid infinite loops
    }
  }

  private async sendErrors(errors: ErrorReport[]): Promise<void> {
    for (const error of errors) {
      try {
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(error),
        })
      } catch (sendError) {
        console.error('Failed to send error report:', sendError)
        // Try fallback GET method for simple cases
        this.sendErrorViaGet(error)
      }
    }
  }

  private async sendRejections(rejections: UnhandledRejectionReport[]): Promise<void> {
    for (const rejection of rejections) {
      try {
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Unhandled Promise Rejection: ${rejection.reason.message || 'Unknown'}`,
            url: rejection.url,
            userAgent: rejection.userAgent,
            timestamp: rejection.timestamp,
            userId: rejection.userId,
            sessionId: rejection.sessionId,
            error: rejection.reason,
          }),
        })
      } catch (sendError) {
        console.error('Failed to send rejection report:', sendError)
      }
    }
  }

  private sendErrorViaGet(error: ErrorReport): void {
    try {
      const params = new URLSearchParams({
        message: error.message,
        url: error.url,
        ...(error.filename && { filename: error.filename }),
        ...(error.lineno && { line: error.lineno.toString() }),
        ...(error.colno && { col: error.colno.toString() }),
      })

      // Use image request as fallback
      const img = new Image()
      img.src = `/api/errors/report?${params.toString()}`
    } catch {
      // Silent fail for fallback method
    }
  }

  // Public methods
  public reportError(error: Error, context?: Record<string, any>): void {
    const errorReport: ErrorReport = {
      message: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
    }

    this.queueError(errorReport)
  }

  public setUserId(userId: string): void {
    try {
      sessionStorage.setItem('userId', userId)
    } catch {
      // Silent fail
    }
  }

  public clearUserId(): void {
    try {
      sessionStorage.removeItem('userId')
    } catch {
      // Silent fail
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    
    // Final flush
    this.flush()
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this.handleError.bind(this))
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))
      window.removeEventListener('beforeunload', this.flush.bind(this))
    }
    
    this.isInitialized = false
  }
}

// Export singleton instance
export const clientErrorHandler = new ClientErrorHandler()

// Export for manual error reporting
export const reportError = (error: Error, context?: Record<string, any>) => {
  clientErrorHandler.reportError(error, context)
}

// Export user management functions
export const setErrorUserId = (userId: string) => {
  clientErrorHandler.setUserId(userId)
}

export const clearErrorUserId = () => {
  clientErrorHandler.clearUserId()
}
