import { logger, ErrorCategory } from './logger'

// Base application error class
export abstract class AppError extends Error {
  abstract readonly statusCode: number
  abstract readonly category: ErrorCategory
  abstract readonly isOperational: boolean
  
  public readonly timestamp: string
  public readonly errorId: string

  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date().toISOString()
    this.errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      category: this.category,
      timestamp: this.timestamp,
      errorId: this.errorId,
      context: this.context,
      stack: this.stack,
    }
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  readonly statusCode = 401
  readonly category = ErrorCategory.AUTHENTICATION
  readonly isOperational = true

  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, context)
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(context?: Record<string, any>) {
    super('Invalid email or password', context)
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(context?: Record<string, any>) {
    super('Authentication token has expired', context)
  }
}

export class AccountInactiveError extends AuthenticationError {
  constructor(context?: Record<string, any>) {
    super('Account is inactive or suspended', context)
  }
}

// Authorization errors
export class AuthorizationError extends AppError {
  readonly statusCode = 403
  readonly category = ErrorCategory.AUTHORIZATION
  readonly isOperational = true

  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, context)
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(requiredPermission?: string, context?: Record<string, any>) {
    const message = requiredPermission 
      ? `Missing required permission: ${requiredPermission}`
      : 'Insufficient permissions to perform this action'
    super(message, context)
  }
}

// Validation errors
export class ValidationError extends AppError {
  readonly statusCode = 400
  readonly category = ErrorCategory.VALIDATION
  readonly isOperational = true

  constructor(
    message: string = 'Validation failed',
    public readonly errors: string[] = [],
    context?: Record<string, any>
  ) {
    super(message, context)
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    }
  }
}

export class InvalidInputError extends ValidationError {
  constructor(field: string, value?: any, context?: Record<string, any>) {
    super(`Invalid value for field: ${field}`, [`${field}: invalid value`], {
      ...context,
      field,
      value,
    })
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(field: string, context?: Record<string, any>) {
    super(`Required field missing: ${field}`, [`${field}: required`], {
      ...context,
      field,
    })
  }
}

// Database errors
export class DatabaseError extends AppError {
  readonly statusCode = 500
  readonly category = ErrorCategory.DATABASE
  readonly isOperational = true

  constructor(message: string = 'Database operation failed', context?: Record<string, any>) {
    super(message, context)
  }
}

export class RecordNotFoundError extends DatabaseError {
  readonly statusCode = 404

  constructor(resource: string, id?: string, context?: Record<string, any>) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`
    super(message, { ...context, resource, id })
  }
}

export class DuplicateRecordError extends DatabaseError {
  readonly statusCode = 409

  constructor(resource: string, field: string, value: any, context?: Record<string, any>) {
    super(`${resource} with ${field} '${value}' already exists`, {
      ...context,
      resource,
      field,
      value,
    })
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(context?: Record<string, any>) {
    super('Unable to connect to database', context)
  }
}

// Business logic errors
export class BusinessLogicError extends AppError {
  readonly statusCode = 422
  readonly category = ErrorCategory.BUSINESS_LOGIC
  readonly isOperational = true

  constructor(message: string, context?: Record<string, any>) {
    super(message, context)
  }
}

export class InsufficientStockError extends BusinessLogicError {
  constructor(productName: string, requested: number, available: number, context?: Record<string, any>) {
    super(`Insufficient stock for ${productName}. Requested: ${requested}, Available: ${available}`, {
      ...context,
      productName,
      requested,
      available,
    })
  }
}

export class AppointmentConflictError extends BusinessLogicError {
  constructor(staffName: string, dateTime: string, context?: Record<string, any>) {
    super(`${staffName} is not available at ${dateTime}`, {
      ...context,
      staffName,
      dateTime,
    })
  }
}

export class PaymentProcessingError extends BusinessLogicError {
  constructor(reason: string, context?: Record<string, any>) {
    super(`Payment processing failed: ${reason}`, context)
  }
}

// Network errors
export class NetworkError extends AppError {
  readonly statusCode = 503
  readonly category = ErrorCategory.NETWORK
  readonly isOperational = true

  constructor(message: string = 'Network error occurred', context?: Record<string, any>) {
    super(message, context)
  }
}

export class ExternalServiceError extends NetworkError {
  constructor(serviceName: string, context?: Record<string, any>) {
    super(`External service ${serviceName} is unavailable`, {
      ...context,
      serviceName,
    })
  }
}

export class TimeoutError extends NetworkError {
  constructor(operation: string, timeout: number, context?: Record<string, any>) {
    super(`Operation ${operation} timed out after ${timeout}ms`, {
      ...context,
      operation,
      timeout,
    })
  }
}

// Rate limiting errors
export class RateLimitError extends AppError {
  readonly statusCode = 429
  readonly category = ErrorCategory.SECURITY
  readonly isOperational = true

  constructor(
    public readonly retryAfter: number,
    context?: Record<string, any>
  ) {
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds`, {
      ...context,
      retryAfter,
    })
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    }
  }
}

// System errors (non-operational)
export class SystemError extends AppError {
  readonly statusCode = 500
  readonly category = ErrorCategory.SYSTEM
  readonly isOperational = false

  constructor(message: string = 'Internal system error', context?: Record<string, any>) {
    super(message, context)
  }
}

export class ConfigurationError extends SystemError {
  constructor(setting: string, context?: Record<string, any>) {
    super(`Configuration error: ${setting}`, { ...context, setting })
  }
}

// Error handling utilities
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

export function getErrorStatusCode(error: Error): number {
  if (error instanceof AppError) {
    return error.statusCode
  }
  return 500
}

export function getErrorCategory(error: Error): ErrorCategory {
  if (error instanceof AppError) {
    return error.category
  }
  return ErrorCategory.SYSTEM
}

// Error logging helper
export function logError(error: Error, context?: Record<string, any>): void {
  if (error instanceof AppError) {
    const logContext = { ...error.context, ...context }
    
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        logger.authError(error.message, error, logContext)
        break
      case ErrorCategory.AUTHORIZATION:
        logger.authzError(error.message, error, logContext)
        break
      case ErrorCategory.VALIDATION:
        logger.validationError(error.message, error, logContext)
        break
      case ErrorCategory.DATABASE:
        logger.databaseError(error.message, error, logContext)
        break
      case ErrorCategory.NETWORK:
        logger.networkError(error.message, error, logContext)
        break
      case ErrorCategory.BUSINESS_LOGIC:
        logger.businessLogicError(error.message, error, logContext)
        break
      case ErrorCategory.SECURITY:
        logger.securityError(error.message, error, logContext)
        break
      default:
        logger.error(error.message, error, logContext)
    }
  } else {
    logger.error(error.message, error, context)
  }
}

// Error response formatter for APIs
export function formatErrorResponse(error: Error) {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.name,
        statusCode: error.statusCode,
        category: error.category,
        errorId: error.errorId,
        timestamp: error.timestamp,
        ...(error instanceof ValidationError && { errors: error.errors }),
        ...(error instanceof RateLimitError && { retryAfter: error.retryAfter }),
      }
    }
  }

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    error: {
      message: isProduction ? 'Internal server error' : error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      category: ErrorCategory.SYSTEM,
      timestamp: new Date().toISOString(),
    }
  }
}

// Async error wrapper
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error as Error)
      throw error
    }
  }
}
