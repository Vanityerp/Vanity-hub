// Enhanced Error Tracking Service
import { monitoringService, MonitoringEventType } from './monitoring-service'
import { logger } from '@/lib/error-handling/logger'

// Error tracking interfaces
export interface ErrorReport {
  id: string
  message: string
  stack?: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  url?: string
  userAgent?: string
  userId?: string
  sessionId?: string
  locationId?: string
  component?: string
  props?: Record<string, any>
  breadcrumbs: Breadcrumb[]
  tags: Record<string, string>
  fingerprint: string
  count: number
  firstSeen: Date
  lastSeen: Date
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

export interface Breadcrumb {
  timestamp: Date
  category: string
  message: string
  level: 'info' | 'warning' | 'error'
  data?: Record<string, any>
}

export interface ErrorContext {
  user?: {
    id: string
    email?: string
    role?: string
  }
  request?: {
    url: string
    method: string
    headers: Record<string, string>
    body?: any
  }
  environment: {
    userAgent: string
    url: string
    timestamp: Date
    sessionId?: string
  }
  extra?: Record<string, any>
}

// Error aggregation and deduplication
export interface ErrorGroup {
  fingerprint: string
  title: string
  message: string
  type: string
  count: number
  userCount: number
  firstSeen: Date
  lastSeen: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'unresolved' | 'resolved' | 'ignored'
  assignee?: string
  tags: string[]
  events: ErrorReport[]
}

class ErrorTrackingService {
  private errors: Map<string, ErrorReport> = new Map()
  private errorGroups: Map<string, ErrorGroup> = new Map()
  private breadcrumbs: Breadcrumb[] = []
  private maxBreadcrumbs = 100
  private maxErrors = 10000

  /**
   * Capture and track an error
   */
  captureError(
    error: Error,
    context?: Partial<ErrorContext>,
    tags?: Record<string, string>
  ): string {
    const errorReport = this.createErrorReport(error, context, tags)
    
    // Store the error
    this.errors.set(errorReport.id, errorReport)
    
    // Group similar errors
    this.groupError(errorReport)
    
    // Log to monitoring service
    monitoringService.recordEvent({
      type: MonitoringEventType.ERROR,
      category: 'error-tracking',
      message: error.message,
      severity: errorReport.severity,
      source: 'error-tracker',
      userId: context?.user?.id,
      locationId: context?.extra?.locationId as string,
      metadata: {
        errorId: errorReport.id,
        fingerprint: errorReport.fingerprint,
        component: errorReport.component,
        url: errorReport.url
      }
    })
    
    // Log to application logger
    logger.error(`Error tracked: ${error.message}`, error, {
      errorId: errorReport.id,
      fingerprint: errorReport.fingerprint,
      userId: context?.user?.id,
      metadata: context?.extra
    })
    
    // Clean up old errors
    this.cleanup()
    
    return errorReport.id
  }

  /**
   * Create an error report from an error and context
   */
  private createErrorReport(
    error: Error,
    context?: Partial<ErrorContext>,
    tags?: Record<string, string>
  ): ErrorReport {
    const id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fingerprint = this.generateFingerprint(error, context)
    const severity = this.determineSeverity(error, context)
    
    return {
      id,
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      severity,
      timestamp: new Date(),
      url: context?.environment?.url || context?.request?.url,
      userAgent: context?.environment?.userAgent,
      userId: context?.user?.id,
      sessionId: context?.environment?.sessionId,
      locationId: context?.extra?.locationId as string,
      component: context?.extra?.component as string,
      props: context?.extra?.props as Record<string, any>,
      breadcrumbs: [...this.breadcrumbs],
      tags: tags || {},
      fingerprint,
      count: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      resolved: false
    }
  }

  /**
   * Generate a fingerprint for error grouping
   */
  private generateFingerprint(error: Error, context?: Partial<ErrorContext>): string {
    // Create a fingerprint based on error type, message, and stack trace
    const components = [
      error.constructor.name,
      error.message.replace(/\d+/g, 'X'), // Replace numbers with X for grouping
      context?.extra?.component || 'unknown'
    ]
    
    // Add stack trace information (first few lines)
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 3)
      components.push(...stackLines.map(line => 
        line.replace(/:\d+:\d+/g, ':X:X') // Replace line numbers
      ))
    }
    
    return btoa(components.join('|')).substring(0, 16)
  }

  /**
   * Determine error severity based on error type and context
   */
  private determineSeverity(error: Error, context?: Partial<ErrorContext>): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors
    if (error.name === 'SecurityError' || 
        error.message.includes('authentication') ||
        error.message.includes('authorization')) {
      return 'critical'
    }
    
    // High severity errors
    if (error.name === 'DatabaseError' ||
        error.name === 'NetworkError' ||
        error.message.includes('payment') ||
        error.message.includes('transaction')) {
      return 'high'
    }
    
    // Medium severity errors
    if (error.name === 'ValidationError' ||
        error.name === 'BusinessLogicError' ||
        context?.request?.method === 'POST') {
      return 'medium'
    }
    
    // Default to low severity
    return 'low'
  }

  /**
   * Group similar errors together
   */
  private groupError(errorReport: ErrorReport) {
    const existingGroup = this.errorGroups.get(errorReport.fingerprint)
    
    if (existingGroup) {
      // Update existing group
      existingGroup.count++
      existingGroup.lastSeen = errorReport.timestamp
      existingGroup.events.push(errorReport)
      
      // Update severity if this error is more severe
      if (this.getSeverityLevel(errorReport.severity) > this.getSeverityLevel(existingGroup.severity)) {
        existingGroup.severity = errorReport.severity
      }
      
      // Keep only recent events in the group
      if (existingGroup.events.length > 100) {
        existingGroup.events = existingGroup.events.slice(-100)
      }
    } else {
      // Create new group
      const newGroup: ErrorGroup = {
        fingerprint: errorReport.fingerprint,
        title: this.generateErrorTitle(errorReport),
        message: errorReport.message,
        type: errorReport.type,
        count: 1,
        userCount: errorReport.userId ? 1 : 0,
        firstSeen: errorReport.timestamp,
        lastSeen: errorReport.timestamp,
        severity: errorReport.severity,
        status: 'unresolved',
        tags: Object.keys(errorReport.tags),
        events: [errorReport]
      }
      
      this.errorGroups.set(errorReport.fingerprint, newGroup)
    }
  }

  /**
   * Generate a human-readable title for an error
   */
  private generateErrorTitle(errorReport: ErrorReport): string {
    if (errorReport.component) {
      return `${errorReport.type} in ${errorReport.component}`
    }
    
    if (errorReport.url) {
      const path = new URL(errorReport.url).pathname
      return `${errorReport.type} at ${path}`
    }
    
    return `${errorReport.type}: ${errorReport.message.substring(0, 50)}...`
  }

  /**
   * Get numeric severity level for comparison
   */
  private getSeverityLevel(severity: string): number {
    switch (severity) {
      case 'low': return 1
      case 'medium': return 2
      case 'high': return 3
      case 'critical': return 4
      default: return 1
    }
  }

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>) {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date()
    })
    
    // Keep breadcrumbs within limit
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs)
    }
  }

  /**
   * Get error groups with filtering and sorting
   */
  getErrorGroups(options: {
    status?: 'unresolved' | 'resolved' | 'ignored'
    severity?: 'low' | 'medium' | 'high' | 'critical'
    limit?: number
    sortBy?: 'count' | 'lastSeen' | 'firstSeen'
    sortOrder?: 'asc' | 'desc'
  } = {}): ErrorGroup[] {
    let groups = Array.from(this.errorGroups.values())
    
    // Filter by status
    if (options.status) {
      groups = groups.filter(g => g.status === options.status)
    }
    
    // Filter by severity
    if (options.severity) {
      groups = groups.filter(g => g.severity === options.severity)
    }
    
    // Sort
    const sortBy = options.sortBy || 'lastSeen'
    const sortOrder = options.sortOrder || 'desc'
    
    groups.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'count':
          aValue = a.count
          bValue = b.count
          break
        case 'firstSeen':
          aValue = a.firstSeen.getTime()
          bValue = b.firstSeen.getTime()
          break
        case 'lastSeen':
        default:
          aValue = a.lastSeen.getTime()
          bValue = b.lastSeen.getTime()
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
    
    // Limit results
    if (options.limit) {
      groups = groups.slice(0, options.limit)
    }
    
    return groups
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number
    totalGroups: number
    unresolvedGroups: number
    criticalErrors: number
    highSeverityErrors: number
    errorsLast24h: number
    topErrorTypes: Array<{ type: string; count: number }>
  } {
    const groups = Array.from(this.errorGroups.values())
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Count errors by type
    const errorTypeCounts = new Map<string, number>()
    groups.forEach(group => {
      errorTypeCounts.set(group.type, (errorTypeCounts.get(group.type) || 0) + group.count)
    })
    
    const topErrorTypes = Array.from(errorTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return {
      totalErrors: groups.reduce((sum, g) => sum + g.count, 0),
      totalGroups: groups.length,
      unresolvedGroups: groups.filter(g => g.status === 'unresolved').length,
      criticalErrors: groups.filter(g => g.severity === 'critical').length,
      highSeverityErrors: groups.filter(g => g.severity === 'high').length,
      errorsLast24h: groups.filter(g => g.lastSeen > last24h).reduce((sum, g) => sum + g.count, 0),
      topErrorTypes
    }
  }

  /**
   * Resolve an error group
   */
  resolveErrorGroup(fingerprint: string, resolvedBy?: string): boolean {
    const group = this.errorGroups.get(fingerprint)
    if (!group) return false
    
    group.status = 'resolved'
    group.resolvedAt = new Date()
    group.resolvedBy = resolvedBy
    
    // Mark all errors in the group as resolved
    group.events.forEach(error => {
      error.resolved = true
      error.resolvedAt = new Date()
      error.resolvedBy = resolvedBy
    })
    
    return true
  }

  /**
   * Get error details by ID
   */
  getError(errorId: string): ErrorReport | undefined {
    return this.errors.get(errorId)
  }

  /**
   * Get error group by fingerprint
   */
  getErrorGroup(fingerprint: string): ErrorGroup | undefined {
    return this.errorGroups.get(fingerprint)
  }

  /**
   * Clean up old errors and breadcrumbs
   */
  private cleanup() {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    
    // Clean up old errors
    for (const [id, error] of this.errors) {
      if (error.timestamp < cutoffDate) {
        this.errors.delete(id)
      }
    }
    
    // Clean up old breadcrumbs
    this.breadcrumbs = this.breadcrumbs.filter(b => b.timestamp > cutoffDate)
    
    // Keep error count within limits
    if (this.errors.size > this.maxErrors) {
      const sortedErrors = Array.from(this.errors.entries())
        .sort(([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime())
      
      this.errors.clear()
      sortedErrors.slice(0, this.maxErrors).forEach(([id, error]) => {
        this.errors.set(id, error)
      })
    }
  }

  /**
   * Clear all error data
   */
  clear() {
    this.errors.clear()
    this.errorGroups.clear()
    this.breadcrumbs = []
  }
}

// Export singleton instance
export const errorTracking = new ErrorTrackingService()

// Export error tracking utilities
export function captureError(error: Error, context?: Partial<ErrorContext>, tags?: Record<string, string>): string {
  return errorTracking.captureError(error, context, tags)
}

export function addBreadcrumb(category: string, message: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) {
  errorTracking.addBreadcrumb({ category, message, level, data })
}

// Error boundary integration
export function withErrorTracking(Component: React.ComponentType<any>) {
  const React = require('react')

  return class extends React.Component {
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      captureError(error, {
        extra: {
          component: Component.name,
          props: this.props,
          errorInfo
        },
        environment: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          timestamp: new Date()
        }
      })
    }

    render() {
      return React.createElement(Component, this.props)
    }
  }
}
