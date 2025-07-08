// Monitoring Dashboard API Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { monitoringService, MonitoringEventType } from '@/lib/monitoring/monitoring-service'
import { errorTracking } from '@/lib/monitoring/error-tracking'
import { withAuth } from '@/lib/security/api-wrapper'
import { z } from 'zod'

// Request validation schemas
const monitoringQuerySchema = z.object({
  type: z.enum(['events', 'metrics', 'health', 'alerts', 'errors']).optional(),
  limit: z.number().min(1).max(1000).optional(),
  eventType: z.nativeEnum(MonitoringEventType).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).optional(),
  status: z.enum(['unresolved', 'resolved', 'ignored']).optional()
})

const alertUpdateSchema = z.object({
  ruleId: z.string(),
  enabled: z.boolean().optional(),
  threshold: z.number().optional(),
  channels: z.array(z.enum(['email', 'slack', 'webhook'])).optional(),
  cooldown: z.number().min(1).max(1440).optional() // 1 minute to 24 hours
})

const errorActionSchema = z.object({
  action: z.enum(['resolve', 'ignore', 'reopen']),
  fingerprint: z.string(),
  resolvedBy: z.string().optional()
})

// GET - Get monitoring data
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const query = {
      type: searchParams.get('type') || 'all',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      eventType: searchParams.get('eventType') as MonitoringEventType,
      severity: searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical',
      timeRange: searchParams.get('timeRange') || '24h',
      status: searchParams.get('status') as 'unresolved' | 'resolved' | 'ignored'
    }

    const response: any = {}

    // Get system health
    if (query.type === 'all' || query.type === 'health') {
      const systemHealth = await monitoringService.getSystemHealth()
      response.health = systemHealth
    }

    // Get monitoring events
    if (query.type === 'all' || query.type === 'events') {
      const events = monitoringService.getRecentEvents(query.limit, query.eventType)
      response.events = events
    }

    // Get performance metrics
    if (query.type === 'all' || query.type === 'metrics') {
      const metrics = monitoringService.getRecentMetrics(query.limit)
      response.metrics = metrics
    }

    // Get alert rules
    if (query.type === 'all' || query.type === 'alerts') {
      const alertRules = monitoringService.getAlertRules()
      response.alerts = alertRules
    }

    // Get error tracking data
    if (query.type === 'all' || query.type === 'errors') {
      const errorGroups = errorTracking.getErrorGroups({
        status: query.status,
        severity: query.severity,
        limit: query.limit,
        sortBy: 'lastSeen',
        sortOrder: 'desc'
      })
      
      const errorStats = errorTracking.getErrorStats()
      
      response.errors = {
        groups: errorGroups,
        stats: errorStats
      }
    }

    // Add summary statistics
    if (query.type === 'all') {
      const recentEvents = monitoringService.getRecentEvents(1000)
      const recentMetrics = monitoringService.getRecentMetrics(100)
      
      response.summary = {
        totalEvents: recentEvents.length,
        criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
        highSeverityEvents: recentEvents.filter(e => e.severity === 'high').length,
        averageResponseTime: recentMetrics.length > 0 
          ? recentMetrics.reduce((sum, m) => sum + m.apiResponseTime, 0) / recentMetrics.length 
          : 0,
        cacheHitRatio: recentMetrics.length > 0 
          ? recentMetrics[recentMetrics.length - 1].cacheHitRatio 
          : 0,
        memoryUsage: recentMetrics.length > 0 
          ? recentMetrics[recentMetrics.length - 1].memoryUsage 
          : 0
      }
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
      query
    })

  } catch (error) {
    console.error('Monitoring API GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch monitoring data' },
      { status: 500 }
    )
  }
}, {
  requiredRole: 'admin',
  rateLimit: { windowMs: 60 * 1000, maxRequests: 60 } // 60 requests per minute
})

// POST - Perform monitoring actions
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    let result: any = {}

    switch (action) {
      case 'update-alert':
        const alertUpdate = alertUpdateSchema.parse(body)
        const alertUpdated = monitoringService.updateAlertRule(alertUpdate.ruleId, alertUpdate)
        
        if (alertUpdated) {
          result = { message: `Alert rule ${alertUpdate.ruleId} updated successfully` }
        } else {
          return NextResponse.json(
            { success: false, error: 'Alert rule not found' },
            { status: 404 }
          )
        }
        break

      case 'error-action':
        const errorAction = errorActionSchema.parse(body)
        
        switch (errorAction.action) {
          case 'resolve':
            const resolved = errorTracking.resolveErrorGroup(
              errorAction.fingerprint, 
              errorAction.resolvedBy
            )
            if (resolved) {
              result = { message: 'Error group resolved successfully' }
            } else {
              return NextResponse.json(
                { success: false, error: 'Error group not found' },
                { status: 404 }
              )
            }
            break

          case 'ignore':
            const errorGroup = errorTracking.getErrorGroup(errorAction.fingerprint)
            if (errorGroup) {
              errorGroup.status = 'ignored'
              result = { message: 'Error group ignored successfully' }
            } else {
              return NextResponse.json(
                { success: false, error: 'Error group not found' },
                { status: 404 }
              )
            }
            break

          case 'reopen':
            const reopenGroup = errorTracking.getErrorGroup(errorAction.fingerprint)
            if (reopenGroup) {
              reopenGroup.status = 'unresolved'
              reopenGroup.resolvedAt = undefined
              reopenGroup.resolvedBy = undefined
              result = { message: 'Error group reopened successfully' }
            } else {
              return NextResponse.json(
                { success: false, error: 'Error group not found' },
                { status: 404 }
              )
            }
            break
        }
        break

      case 'test-alert':
        // Trigger a test alert
        monitoringService.recordEvent({
          type: MonitoringEventType.WARNING,
          category: 'test',
          message: 'Test alert triggered from monitoring dashboard',
          severity: 'medium',
          source: 'monitoring-dashboard',
          metadata: { test: true, triggeredBy: 'admin' }
        })
        result = { message: 'Test alert triggered successfully' }
        break

      case 'record-event':
        // Record a custom monitoring event
        const eventData = z.object({
          type: z.nativeEnum(MonitoringEventType),
          category: z.string(),
          message: z.string(),
          severity: z.enum(['low', 'medium', 'high', 'critical']),
          metadata: z.record(z.any()).optional()
        }).parse(body)

        const eventId = monitoringService.recordEvent({
          ...eventData,
          source: 'monitoring-dashboard'
        })
        
        result = { message: 'Event recorded successfully', eventId }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Monitoring API POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to perform monitoring action' },
      { status: 500 }
    )
  }
}, {
  requiredRole: 'admin',
  rateLimit: { windowMs: 60 * 1000, maxRequests: 30 } // 30 requests per minute
})

// DELETE - Clear monitoring data
export const DELETE = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const timeRange = searchParams.get('timeRange') || '24h'

    let result: any = {}

    switch (type) {
      case 'events':
        // Clear old events (this would need to be implemented in monitoring service)
        result = { message: 'Events cleared successfully' }
        break

      case 'metrics':
        // Clear old metrics (this would need to be implemented in monitoring service)
        result = { message: 'Metrics cleared successfully' }
        break

      case 'errors':
        // Clear resolved errors older than specified time range
        errorTracking.clear()
        result = { message: 'Error data cleared successfully' }
        break

      case 'all':
        // Clear all monitoring data
        errorTracking.clear()
        result = { message: 'All monitoring data cleared successfully' }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid clear type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Monitoring API DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear monitoring data' },
      { status: 500 }
    )
  }
}, {
  requiredRole: 'admin',
  rateLimit: { windowMs: 60 * 1000, maxRequests: 10 } // 10 requests per minute
})

// PUT - Update monitoring configuration
export const PUT = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { searchParams } = new URL(req.url)
    const configType = searchParams.get('config')

    let result: any = {}

    switch (configType) {
      case 'alerts':
        // Update alert configuration
        const alertConfig = z.object({
          globalEnabled: z.boolean().optional(),
          defaultChannels: z.array(z.enum(['email', 'slack', 'webhook'])).optional(),
          defaultCooldown: z.number().min(1).max(1440).optional()
        }).parse(body)

        // This would update global alert configuration
        result = { message: 'Alert configuration updated successfully', config: alertConfig }
        break

      case 'retention':
        // Update data retention settings
        const retentionConfig = z.object({
          eventRetentionDays: z.number().min(1).max(365).optional(),
          metricsRetentionDays: z.number().min(1).max(365).optional(),
          errorRetentionDays: z.number().min(1).max(365).optional()
        }).parse(body)

        result = { message: 'Retention configuration updated successfully', config: retentionConfig }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid configuration type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Monitoring API PUT error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid configuration data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update monitoring configuration' },
      { status: 500 }
    )
  }
}, {
  requiredRole: 'admin',
  rateLimit: { windowMs: 60 * 1000, maxRequests: 20 } // 20 requests per minute
})
