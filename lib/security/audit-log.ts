import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export enum AuditAction {
  // Authentication
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  
  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  
  // Client Management
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  CLIENT_DELETED = 'CLIENT_DELETED',
  CLIENT_VIEWED = 'CLIENT_VIEWED',
  
  // Appointment Management
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_NO_SHOW = 'APPOINTMENT_NO_SHOW',
  
  // Transaction Management
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_UPDATED = 'TRANSACTION_UPDATED',
  TRANSACTION_REFUNDED = 'TRANSACTION_REFUNDED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  
  // Inventory Management
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  STOCK_ADJUSTED = 'STOCK_ADJUSTED',
  STOCK_LOW_ALERT = 'STOCK_LOW_ALERT',
  
  // Service Management
  SERVICE_CREATED = 'SERVICE_CREATED',
  SERVICE_UPDATED = 'SERVICE_UPDATED',
  SERVICE_DELETED = 'SERVICE_DELETED',
  
  // Staff Management
  STAFF_CREATED = 'STAFF_CREATED',
  STAFF_UPDATED = 'STAFF_UPDATED',
  STAFF_DELETED = 'STAFF_DELETED',
  STAFF_SCHEDULE_UPDATED = 'STAFF_SCHEDULE_UPDATED',
  
  // Security Events
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_EXPORT = 'DATA_EXPORT',
  BULK_OPERATION = 'BULK_OPERATION',
  
  // System Events
  SYSTEM_BACKUP = 'SYSTEM_BACKUP',
  SYSTEM_RESTORE = 'SYSTEM_RESTORE',
  CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogEntry {
  action: AuditAction
  userId?: string
  userEmail?: string
  userRole?: string
  resourceType?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  location?: string
  severity?: AuditSeverity
  metadata?: Record<string, any>
}

// Get client information from request
function getClientInfo(request?: NextRequest) {
  if (!request) return {}
  
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('remote-addr')
  
  const ipAddress = forwarded?.split(',')[0].trim() || realIP || remoteAddr || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return { ipAddress, userAgent }
}

// Determine severity based on action
function getActionSeverity(action: AuditAction): AuditSeverity {
  const criticalActions = [
    AuditAction.USER_DELETED,
    AuditAction.SYSTEM_RESTORE,
    AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
    AuditAction.SUSPICIOUS_ACTIVITY,
  ]
  
  const highActions = [
    AuditAction.PASSWORD_CHANGED,
    AuditAction.USER_CREATED,
    AuditAction.USER_DEACTIVATED,
    AuditAction.TRANSACTION_REFUNDED,
    AuditAction.DATA_EXPORT,
    AuditAction.CONFIGURATION_CHANGED,
  ]
  
  const mediumActions = [
    AuditAction.LOGIN_FAILED,
    AuditAction.RATE_LIMIT_EXCEEDED,
    AuditAction.APPOINTMENT_CANCELLED,
    AuditAction.STOCK_ADJUSTED,
  ]
  
  if (criticalActions.includes(action)) return AuditSeverity.CRITICAL
  if (highActions.includes(action)) return AuditSeverity.HIGH
  if (mediumActions.includes(action)) return AuditSeverity.MEDIUM
  return AuditSeverity.LOW
}

// Main audit logging function
export async function auditLog(
  entry: AuditLogEntry,
  request?: NextRequest
): Promise<void> {
  try {
    const clientInfo = getClientInfo(request)
    const severity = entry.severity || getActionSeverity(entry.action)
    
    // Create audit log entry in database
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId,
        userEmail: entry.userEmail,
        userRole: entry.userRole,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ipAddress: entry.ipAddress || clientInfo.ipAddress,
        userAgent: entry.userAgent || clientInfo.userAgent,
        location: entry.location,
        severity,
        metadata: JSON.stringify({
          ...entry.metadata,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        }),
        createdAt: new Date(),
      },
    })
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${severity} - ${entry.action}:`, {
        user: entry.userEmail || entry.userId,
        resource: entry.resourceType ? `${entry.resourceType}:${entry.resourceId}` : undefined,
        details: entry.details,
        ip: entry.ipAddress || clientInfo.ipAddress,
      })
    }
    
    // Send alerts for critical events
    if (severity === AuditSeverity.CRITICAL) {
      await sendSecurityAlert(entry, clientInfo)
    }
    
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw error to avoid breaking the main operation
  }
}

// Send security alerts for critical events
async function sendSecurityAlert(
  entry: AuditLogEntry,
  clientInfo: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  try {
    // In production, this would send emails, Slack notifications, etc.
    console.warn(`🚨 SECURITY ALERT: ${entry.action}`, {
      user: entry.userEmail || entry.userId,
      ip: entry.ipAddress || clientInfo.ipAddress,
      details: entry.details,
      timestamp: new Date().toISOString(),
    })
    
    // TODO: Implement actual alerting mechanism
    // - Email notifications
    // - Slack/Discord webhooks
    // - SMS alerts
    // - Integration with security monitoring tools
    
  } catch (error) {
    console.error('Failed to send security alert:', error)
  }
}

// Convenience functions for common audit events
export const auditAuth = {
  loginSuccess: (userId: string, userEmail: string, userRole: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.LOGIN_SUCCESS,
      userId,
      userEmail,
      userRole,
      details: { timestamp: new Date().toISOString() },
    }, request),
    
  loginFailed: (email: string, reason: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.LOGIN_FAILED,
      userEmail: email,
      details: { reason, timestamp: new Date().toISOString() },
      severity: AuditSeverity.MEDIUM,
    }, request),
    
  logout: (userId: string, userEmail: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.LOGOUT,
      userId,
      userEmail,
      details: { timestamp: new Date().toISOString() },
    }, request),
    
  passwordChanged: (userId: string, userEmail: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.PASSWORD_CHANGED,
      userId,
      userEmail,
      details: { timestamp: new Date().toISOString() },
      severity: AuditSeverity.HIGH,
    }, request),
}

export const auditUser = {
  created: (createdUserId: string, createdUserEmail: string, creatorId: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.USER_CREATED,
      userId: creatorId,
      resourceType: 'User',
      resourceId: createdUserId,
      details: { createdUserEmail, timestamp: new Date().toISOString() },
    }, request),
    
  updated: (updatedUserId: string, updatedFields: string[], updaterId: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.USER_UPDATED,
      userId: updaterId,
      resourceType: 'User',
      resourceId: updatedUserId,
      details: { updatedFields, timestamp: new Date().toISOString() },
    }, request),
    
  deleted: (deletedUserId: string, deletedUserEmail: string, deleterId: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.USER_DELETED,
      userId: deleterId,
      resourceType: 'User',
      resourceId: deletedUserId,
      details: { deletedUserEmail, timestamp: new Date().toISOString() },
      severity: AuditSeverity.CRITICAL,
    }, request),
}

export const auditSecurity = {
  unauthorizedAccess: (attemptedResource: string, userId?: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
      userId,
      details: { attemptedResource, timestamp: new Date().toISOString() },
      severity: AuditSeverity.CRITICAL,
    }, request),
    
  rateLimitExceeded: (endpoint: string, userId?: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      userId,
      details: { endpoint, timestamp: new Date().toISOString() },
      severity: AuditSeverity.MEDIUM,
    }, request),
    
  suspiciousActivity: (description: string, userId?: string, request?: NextRequest) =>
    auditLog({
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      userId,
      details: { description, timestamp: new Date().toISOString() },
      severity: AuditSeverity.CRITICAL,
    }, request),
}

// Query audit logs with filtering
export async function getAuditLogs(filters: {
  userId?: string
  action?: AuditAction
  severity?: AuditSeverity
  resourceType?: string
  resourceId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}
  
  if (filters.userId) where.userId = filters.userId
  if (filters.action) where.action = filters.action
  if (filters.severity) where.severity = filters.severity
  if (filters.resourceType) where.resourceType = filters.resourceType
  if (filters.resourceId) where.resourceId = filters.resourceId
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }
  
  return await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  })
}
