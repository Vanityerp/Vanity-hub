export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  USER_INPUT = 'USER_INPUT',
}

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: ErrorCategory
  message: string
  error?: Error
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  requestId?: string
  url?: string
  userAgent?: string
  ipAddress?: string
  stack?: string
  fingerprint?: string
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  requestId?: string
  url?: string
  userAgent?: string
  ipAddress?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

class Logger {
  private logLevel: LogLevel
  private isDevelopment: boolean
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 100

  constructor() {
    this.logLevel = this.getLogLevelFromEnv()
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase()
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG
      case 'INFO': return LogLevel.INFO
      case 'WARN': return LogLevel.WARN
      case 'ERROR': return LogLevel.ERROR
      case 'CRITICAL': return LogLevel.CRITICAL
      default: return LogLevel.INFO
    }
  }

  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFingerprint(message: string, error?: Error): string {
    // Create a fingerprint for grouping similar errors
    const content = error ? `${message}:${error.name}:${error.message}` : message
    return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16)
  }

  private createLogEntry(
    level: LogLevel,
    category: ErrorCategory,
    message: string,
    error?: Error,
    context?: ErrorContext
  ): LogEntry {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      error,
      context,
      userId: context?.userId,
      sessionId: context?.sessionId,
      requestId: context?.requestId,
      url: context?.url,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
      stack: error?.stack,
      fingerprint: this.generateFingerprint(message, error),
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private formatConsoleOutput(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']
    const levelColors = [
      '\x1b[36m', // cyan
      '\x1b[32m', // green
      '\x1b[33m', // yellow
      '\x1b[31m', // red
      '\x1b[35m', // magenta
    ]
    const resetColor = '\x1b[0m'

    const color = levelColors[entry.level] || resetColor
    const levelName = levelNames[entry.level] || 'UNKNOWN'
    
    const prefix = `${color}[${entry.timestamp}] ${levelName}${resetColor}`
    const categoryPrefix = `[${entry.category}]`
    
    console.log(`${prefix} ${categoryPrefix} ${entry.message}`)
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('Context:', entry.context)
    }
    
    if (entry.error) {
      console.error('Error:', entry.error)
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry)
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize)
    }
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      // In production, send to logging service
      if (!this.isDevelopment) {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        })
      }
    } catch (error) {
      // Fallback: log to console if persistence fails
      console.error('Failed to persist log entry:', error)
    }
  }

  private log(
    level: LogLevel,
    category: ErrorCategory,
    message: string,
    error?: Error,
    context?: ErrorContext
  ): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, category, message, error, context)
    
    // Add to buffer
    this.addToBuffer(entry)
    
    // Console output in development
    if (this.isDevelopment) {
      this.formatConsoleOutput(entry)
    }
    
    // Persist to external service
    this.persistLog(entry).catch(() => {
      // Silent fail - already logged to console above
    })
  }

  // Public logging methods
  debug(message: string, context?: ErrorContext): void {
    this.log(LogLevel.DEBUG, ErrorCategory.SYSTEM, message, undefined, context)
  }

  info(message: string, context?: ErrorContext): void {
    this.log(LogLevel.INFO, ErrorCategory.SYSTEM, message, undefined, context)
  }

  warn(message: string, context?: ErrorContext): void {
    this.log(LogLevel.WARN, ErrorCategory.SYSTEM, message, undefined, context)
  }

  error(message: string, error?: Error, context?: ErrorContext): void {
    this.log(LogLevel.ERROR, ErrorCategory.SYSTEM, message, error, context)
  }

  critical(message: string, error?: Error, context?: ErrorContext): void {
    this.log(LogLevel.CRITICAL, ErrorCategory.SYSTEM, message, error, context)
  }

  // Category-specific logging methods
  authError(message: string, error?: Error, context?: ErrorContext): void {
    this.log(LogLevel.ERROR, ErrorCategory.AUTHENTICATION, message, error, context)
  }

  authzError(message: string, error?: Error, context?: ErrorContext): void {
    this.log(LogLevel.ERROR, ErrorCategory.AUTHORIZATION, message, error, context)
  }

  validationError(message: string, error?: Error, context?: ErrorContext): void {
    this.log(LogLevel.ERROR, ErrorCategory.VALIDATION, message, error, context)
  }

  databaseError(message: string, error?: Error, context?: ErrorContext): void {
    this.log(LogLevel.ERROR, ErrorCategory.DATABASE, message, error, context)
  }

  networkError(message: string, error?: Error, context?: ErrorContext): void {
    this.log(LogLevel.ERROR, ErrorCategory.NETWORK, message, error, context)
  }

  businessLogicError(message: string, error?: Error, context?: ErrorContext): void {
    this.log(LogLevel.ERROR, ErrorCategory.BUSINESS_LOGIC, message, error, context)
  }

  securityError(message: string, error?: Error, context?: ErrorContext): void {
    this.log(LogLevel.CRITICAL, ErrorCategory.SECURITY, message, error, context)
  }

  performanceWarn(message: string, context?: ErrorContext): void {
    this.log(LogLevel.WARN, ErrorCategory.PERFORMANCE, message, undefined, context)
  }

  // Utility methods
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count)
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logBuffer.filter(entry => entry.level === level)
  }

  getLogsByCategory(category: ErrorCategory): LogEntry[] {
    return this.logBuffer.filter(entry => entry.category === category)
  }

  clearBuffer(): void {
    this.logBuffer = []
  }

  // Performance monitoring
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }

  // Structured logging for API requests
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: ErrorContext
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`
    
    this.log(level, ErrorCategory.NETWORK, message, undefined, {
      ...context,
      metadata: {
        method,
        url,
        statusCode,
        duration,
        ...context?.metadata,
      },
    })
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    error?: Error,
    context?: ErrorContext
  ): void {
    const level = error ? LogLevel.ERROR : LogLevel.DEBUG
    const message = error 
      ? `Database ${operation} failed on ${table} (${duration}ms): ${error.message}`
      : `Database ${operation} on ${table} (${duration}ms)`
    
    this.log(level, ErrorCategory.DATABASE, message, error, {
      ...context,
      metadata: {
        operation,
        table,
        duration,
        ...context?.metadata,
      },
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types for external use
export type { LogEntry, ErrorContext }
