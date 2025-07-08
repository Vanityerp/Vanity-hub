'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  Server,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react'

// Monitoring data interfaces
interface SystemHealth {
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

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency?: number
  errorRate?: number
  lastError?: string
  lastChecked: Date
}

interface MonitoringEvent {
  id: string
  type: string
  category: string
  message: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string
  metadata?: Record<string, any>
}

interface ErrorGroup {
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
}

export function MonitoringDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [events, setEvents] = useState<MonitoringEvent[]>([])
  const [errors, setErrors] = useState<{ groups: ErrorGroup[], stats: any }>({ groups: [], stats: {} })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/monitoring?type=all')
      const data = await response.json()

      if (data.success) {
        setHealth(data.data.health)
        setEvents(data.data.events || [])
        setErrors(data.data.errors || { groups: [], stats: {} })
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh data
  useEffect(() => {
    fetchMonitoringData()
    const interval = setInterval(fetchMonitoringData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'unhealthy': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // Get severity badge variant
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button onClick={fetchMonitoringData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
              {getStatusIcon(health.overall)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(health.overall)}`}>
                {health.overall.charAt(0).toUpperCase() + health.overall.slice(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Uptime: {formatUptime(health.metrics.uptime)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {health.metrics.responseTime.toFixed(0)}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Average API response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {health.metrics.errorRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Errors per total requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {health.metrics.memoryUsage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                System memory utilization
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>
              Health status of individual system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(health.services).map(([service, status]) => (
                <div key={service} className="flex items-center space-x-2">
                  {getStatusIcon(status.status)}
                  <div>
                    <div className="font-medium capitalize">{service}</div>
                    <div className="text-xs text-muted-foreground">
                      {status.latency && `${status.latency}ms`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Recent Events */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>
                Latest system events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {events.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={getSeverityVariant(event.severity)}>
                        {event.severity}
                      </Badge>
                      <div>
                        <div className="font-medium">{event.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {event.source} • {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent events
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Tracking */}
        <TabsContent value="errors">
          <div className="space-y-4">
            {/* Error Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{errors.stats.totalErrors || 0}</div>
                  <p className="text-xs text-muted-foreground">Total Errors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{errors.stats.unresolvedGroups || 0}</div>
                  <p className="text-xs text-muted-foreground">Unresolved Groups</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{errors.stats.criticalErrors || 0}</div>
                  <p className="text-xs text-muted-foreground">Critical Errors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{errors.stats.errorsLast24h || 0}</div>
                  <p className="text-xs text-muted-foreground">Last 24 Hours</p>
                </CardContent>
              </Card>
            </div>

            {/* Error Groups */}
            <Card>
              <CardHeader>
                <CardTitle>Error Groups</CardTitle>
                <CardDescription>
                  Grouped errors by similarity and frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {errors.groups.slice(0, 10).map((group) => (
                    <div key={group.fingerprint} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getSeverityVariant(group.severity)}>
                          {group.severity}
                        </Badge>
                        <div>
                          <div className="font-medium">{group.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.message.substring(0, 100)}...
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {group.count} occurrences • Last seen: {new Date(group.lastSeen).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={group.status === 'unresolved' ? 'destructive' : 'secondary'}>
                          {group.status}
                        </Badge>
                        <Badge variant="outline">{group.type}</Badge>
                      </div>
                    </div>
                  ))}
                  {errors.groups.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No error groups found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                System performance and resource utilization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance charts and metrics will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>
                Manage alert rules and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Alert configuration interface will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
