// Comprehensive Monitoring and Observability Service
import { logger } from '../error-handling/logger'
import { redisCache } from '../redis-cache'
import { enhancedRateLimit } from '../enhanced-rate-limiting'
import { dbOptimization } from '../database-optimization'

// Monitoring event types
export enum MonitoringEventType {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  BUSINESS = 'business',
  SYSTEM = 'system'
}

// Monitoring event interface
export interface MonitoringEvent {
  id: string
  type: MonitoringEventType
  category: string
  message: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string
  metadata?: Record<string, any>
  userId?: string
  sessionId?: string
  locationId?: string
  resolved?: boolean
  resolvedAt?: Date
  resolvedBy?: string
}

// System health status
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    cache: ServiceHealth
    rateLimit: ServiceHealth
    api: ServiceHealth
  }
  metrics: {
    uptime: number
    responseTime: number
    errorRate: number
    throughput: number
    memoryUsage: number
    cpuUsage: number
  }
  lastChecked: Date
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency?: number
  errorRate?: number
  lastError?: string
  lastChecked: Date
}

// Performance metrics
export interface PerformanceMetrics {
  // Web Vitals
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  fcp: number | null // First Contentful Paint
  ttfb: number | null // Time to First Byte
  inp: number | null // Interaction to Next Paint

  // API Performance
  apiResponseTime: number
  databaseQueryTime: number
  cacheHitRatio: number
  
  // Resource Usage
  memoryUsage: number
  cpuUsage: number
  networkLatency: number
  
  // Business Metrics
  activeUsers: number
  requestsPerMinute: number
  errorsPerMinute: number
  
  timestamp: Date
}

// Alert configuration
export interface AlertRule {
  id: string
  name: string
  condition: string
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  channels: ('email' | 'slack' | 'webhook')[]
  cooldown: number // minutes
  lastTriggered?: Date
}

class MonitoringService {
  private events: MonitoringEvent[] = []
  private metrics: PerformanceMetrics[] = []
  private alertRules: AlertRule[] = []
  private maxEventHistory = 10000
  private maxMetricsHistory = 1000
  private healthCheckInterval: NodeJS.Timeout | null = null
  private metricsCollectionInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeDefaultAlerts()
    this.startHealthChecks()
    this.startMetricsCollection()
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts() {
    this.alertRules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'errorRate > threshold',
        threshold: 5, // 5% error rate
        severity: 'high',
        enabled: true,
        channels: ['email', 'slack'],
        cooldown: 15
      },
      {
        id: 'slow-response-time',
        name: 'Slow API Response Time',
        condition: 'apiResponseTime > threshold',
        threshold: 2000, // 2 seconds
        severity: 'medium',
        enabled: true,
        channels: ['slack'],
        cooldown: 10
      },
      {
        id: 'low-cache-hit-ratio',
        name: 'Low Cache Hit Ratio',
        condition: 'cacheHitRatio < threshold',
        threshold: 70, // 70%
        severity: 'medium',
        enabled: true,
        channels: ['email'],
        cooldown: 30
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        condition: 'memoryUsage > threshold',
        threshold: 85, // 85%
        severity: 'high',
        enabled: true,
        channels: ['email', 'slack'],
        cooldown: 20
      },
      {
        id: 'database-slow-queries',
        name: 'Database Slow Queries',
        condition: 'databaseQueryTime > threshold',
        threshold: 1000, // 1 second
        severity: 'medium',
        enabled: true,
        channels: ['slack'],
        cooldown: 15
      }
    ]
  }

  /**
   * Record a monitoring event
   */
  recordEvent(event: Omit<MonitoringEvent, 'id' | 'timestamp'>): string {
    const monitoringEvent: MonitoringEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    this.events.push(monitoringEvent)

    // Keep event history manageable
    if (this.events.length > this.maxEventHistory) {
      this.events = this.events.slice(-this.maxEventHistory)
    }

    // Log the event
    logger.info(`Monitoring event: ${event.message}`, {
      eventId: monitoringEvent.id,
      type: event.type,
      category: event.category,
      severity: event.severity,
      metadata: event.metadata
    })

    // Check if this event triggers any alerts
    this.checkAlerts(monitoringEvent)

    return monitoringEvent.id
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: Partial<PerformanceMetrics>) {
    const performanceMetrics: PerformanceMetrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      inp: null,
      apiResponseTime: 0,
      databaseQueryTime: 0,
      cacheHitRatio: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      activeUsers: 0,
      requestsPerMinute: 0,
      errorsPerMinute: 0,
      timestamp: new Date(),
      ...metrics
    }

    this.metrics.push(performanceMetrics)

    // Keep metrics history manageable
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    }

    // Check performance-based alerts
    this.checkPerformanceAlerts(performanceMetrics)
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const services = await this.checkAllServices()
    const metrics = await this.getCurrentMetrics()
    
    // Determine overall health
    const serviceStatuses = Object.values(services).map(s => s.status)
    const hasUnhealthy = serviceStatuses.includes('unhealthy')
    const hasDegraded = serviceStatuses.includes('degraded')
    
    let overall: 'healthy' | 'degraded' | 'unhealthy'
    if (hasUnhealthy) {
      overall = 'unhealthy'
    } else if (hasDegraded) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    return {
      overall,
      services,
      metrics,
      lastChecked: new Date()
    }
  }

  /**
   * Check health of all services
   */
  private async checkAllServices() {
    const [redisHealth, dbStats, rateLimitStats] = await Promise.all([
      redisCache.healthCheck(),
      dbOptimization.getQueryStats(),
      enhancedRateLimit.getStats()
    ])

    return {
      database: {
        status: (dbStats.averageDuration > 1000 ? 'degraded' : 'healthy') as 'healthy' | 'degraded' | 'unhealthy',
        latency: dbStats.averageDuration,
        errorRate: dbStats.slowQueries / Math.max(dbStats.totalQueries, 1) * 100,
        lastChecked: new Date()
      },
      redis: {
        status: (redisHealth.status || 'healthy') as 'healthy' | 'degraded' | 'unhealthy',
        latency: redisHealth.details?.latency || 0,
        lastChecked: new Date()
      },
      cache: {
        status: (redisCache.getHitRatio() > 0.7 ? 'healthy' : 'degraded') as 'healthy' | 'degraded' | 'unhealthy',
        lastChecked: new Date()
      },
      rateLimit: {
        status: (rateLimitStats.redisAvailable ? 'healthy' : 'degraded') as 'healthy' | 'degraded' | 'unhealthy',
        lastChecked: new Date()
      },
      api: {
        status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
        lastChecked: new Date()
      }
    }
  }

  /**
   * Get current system metrics
   */
  private async getCurrentMetrics() {
    const cacheStats = await redisCache.getStats()
    const dbStats = dbOptimization.getQueryStats()
    
    return {
      uptime: process.uptime(),
      responseTime: dbStats.averageDuration,
      errorRate: dbStats.slowQueries / Math.max(dbStats.totalQueries, 1) * 100,
      throughput: dbStats.totalQueries,
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100,
      cpuUsage: 0 // Would need additional monitoring for CPU usage
    }
  }

  /**
   * Check if any alerts should be triggered
   */
  private checkAlerts(event: MonitoringEvent) {
    // Implementation for event-based alerts
    if (event.severity === 'critical') {
      this.triggerAlert('critical-event', `Critical event: ${event.message}`, event.metadata)
    }
  }

  /**
   * Check performance-based alerts
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics) {
    this.alertRules.forEach(rule => {
      if (!rule.enabled) return
      
      // Check cooldown
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered.getTime() < rule.cooldown * 60 * 1000) {
        return
      }

      let shouldTrigger = false
      
      switch (rule.id) {
        case 'high-error-rate':
          shouldTrigger = metrics.errorsPerMinute / Math.max(metrics.requestsPerMinute, 1) * 100 > rule.threshold
          break
        case 'slow-response-time':
          shouldTrigger = metrics.apiResponseTime > rule.threshold
          break
        case 'low-cache-hit-ratio':
          shouldTrigger = metrics.cacheHitRatio < rule.threshold
          break
        case 'high-memory-usage':
          shouldTrigger = metrics.memoryUsage > rule.threshold
          break
        case 'database-slow-queries':
          shouldTrigger = metrics.databaseQueryTime > rule.threshold
          break
      }

      if (shouldTrigger) {
        this.triggerAlert(rule.id, rule.name, { metrics, rule })
        rule.lastTriggered = new Date()
      }
    })
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alertId: string, message: string, metadata?: any) {
    const alertEvent = this.recordEvent({
      type: MonitoringEventType.WARNING,
      category: 'alert',
      message: `ALERT: ${message}`,
      severity: 'high',
      source: 'monitoring-service',
      metadata: { alertId, ...metadata }
    })

    // In production, this would send notifications via configured channels
    console.warn(`🚨 ALERT TRIGGERED: ${message}`, { alertId, eventId: alertEvent })
    
    // TODO: Implement actual alert delivery (email, Slack, webhook)
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getSystemHealth()
        
        if (health.overall !== 'healthy') {
          this.recordEvent({
            type: MonitoringEventType.WARNING,
            category: 'health-check',
            message: `System health is ${health.overall}`,
            severity: health.overall === 'unhealthy' ? 'high' : 'medium',
            source: 'health-monitor',
            metadata: { health }
          })
        }
      } catch (error) {
        logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)))
      }
    }, 60000) // Every minute
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection() {
    this.metricsCollectionInterval = setInterval(async () => {
      try {
        const cacheStats = await redisCache.getStats()
        const dbStats = dbOptimization.getQueryStats()
        
        this.recordMetrics({
          apiResponseTime: dbStats.averageDuration,
          databaseQueryTime: dbStats.averageDuration,
          cacheHitRatio: redisCache.getHitRatio() * 100,
          memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100,
          requestsPerMinute: dbStats.totalQueries,
          errorsPerMinute: dbStats.slowQueries
        })
      } catch (error) {
        logger.error('Metrics collection failed', error instanceof Error ? error : new Error(String(error)))
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit = 100, type?: MonitoringEventType): MonitoringEvent[] {
    let filteredEvents = this.events
    
    if (type) {
      filteredEvents = this.events.filter(e => e.type === type)
    }
    
    return filteredEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit = 100): PerformanceMetrics[] {
    return this.metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId)
    if (ruleIndex === -1) return false
    
    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates }
    return true
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    
    this.events = this.events.filter(e => e.timestamp > cutoffDate)
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffDate)
  }

  /**
   * Shutdown monitoring service
   */
  shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval)
    }
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService()

// Export monitoring decorators
export function withMonitoring(operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      
      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime
        
        monitoringService.recordEvent({
          type: MonitoringEventType.INFO,
          category: 'operation',
          message: `${operationName} completed successfully`,
          severity: 'low',
          source: target.constructor.name,
          metadata: { duration, args: args.length }
        })
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        
        monitoringService.recordEvent({
          type: MonitoringEventType.ERROR,
          category: 'operation',
          message: `${operationName} failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'medium',
          source: target.constructor.name,
          metadata: { duration, error: error instanceof Error ? error.message : String(error), args: args.length }
        })
        
        throw error
      }
    }

    return descriptor
  }
}
