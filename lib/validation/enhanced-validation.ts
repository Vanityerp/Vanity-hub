// Enhanced Data Validation System
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { logger } from '@/lib/error-handling/logger'

// Validation result interface
export interface ValidationResult<T = any> {
  success: boolean
  data?: T
  errors?: ValidationError[]
  warnings?: ValidationWarning[]
  sanitized?: boolean
}

// Validation error interface
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
  severity: 'error' | 'warning' | 'info'
}

// Validation warning interface
export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// Validation options
export interface ValidationOptions {
  sanitize?: boolean
  strict?: boolean
  allowUnknown?: boolean
  stripUnknown?: boolean
  abortEarly?: boolean
  context?: Record<string, any>
}

// Real-time validation configuration
export interface RealTimeValidationConfig {
  debounceMs?: number
  validateOnChange?: boolean
  validateOnBlur?: boolean
  showWarnings?: boolean
  showSuggestions?: boolean
}

// Enhanced validation service
class EnhancedValidationService {
  private validationCache = new Map<string, ValidationResult>()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  /**
   * Validate data with enhanced features
   */
  async validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    options: ValidationOptions = {}
  ): Promise<ValidationResult<T>> {
    const {
      sanitize = true,
      strict = false,
      allowUnknown = false,
      stripUnknown = true,
      abortEarly = false,
      context = {}
    } = options

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(schema, data, options)
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      // Pre-process data
      let processedData = data
      if (sanitize && typeof data === 'object' && data !== null) {
        processedData = this.sanitizeData(data)
      }

      // Validate with Zod
      const result = await this.validateWithZod(schema, processedData, {
        strict,
        allowUnknown,
        stripUnknown,
        abortEarly
      })

      // Post-process result
      const enhancedResult = await this.enhanceValidationResult(result, context)

      // Cache result
      this.cacheResult(cacheKey, enhancedResult)

      return enhancedResult
    } catch (error) {
      logger.error('Validation service error', error)
      return {
        success: false,
        errors: [{
          field: 'root',
          message: 'Validation service error',
          code: 'VALIDATION_SERVICE_ERROR',
          severity: 'error'
        }]
      }
    }
  }

  /**
   * Real-time field validation
   */
  async validateField<T>(
    schema: z.ZodSchema<T>,
    fieldName: string,
    value: any,
    config: RealTimeValidationConfig = {}
  ): Promise<ValidationResult> {
    try {
      // Extract field schema if possible
      const fieldSchema = this.extractFieldSchema(schema, fieldName)
      if (!fieldSchema) {
        return { success: true }
      }

      // Validate single field
      const result = await fieldSchema.safeParseAsync(value)
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          warnings: this.generateFieldWarnings(fieldName, value, config)
        }
      } else {
        return {
          success: false,
          errors: result.error.errors.map(err => ({
            field: fieldName,
            message: err.message,
            code: err.code,
            value,
            severity: 'error' as const
          }))
        }
      }
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: fieldName,
          message: 'Field validation error',
          code: 'FIELD_VALIDATION_ERROR',
          severity: 'error'
        }]
      }
    }
  }

  /**
   * Batch validation for multiple schemas
   */
  async validateBatch(
    validations: Array<{
      schema: z.ZodSchema<any>
      data: unknown
      name: string
      options?: ValidationOptions
    }>
  ): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {}

    await Promise.all(
      validations.map(async ({ schema, data, name, options }) => {
        results[name] = await this.validate(schema, data, options)
      })
    )

    return results
  }

  /**
   * Validate with Zod schema
   */
  private async validateWithZod<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    options: {
      strict: boolean
      allowUnknown: boolean
      stripUnknown: boolean
      abortEarly: boolean
    }
  ): Promise<ValidationResult<T>> {
    try {
      const result = await schema.safeParseAsync(data)
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          sanitized: true
        }
      } else {
        return {
          success: false,
          errors: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            value: err.received,
            severity: 'error' as const
          }))
        }
      }
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'root',
          message: 'Schema validation error',
          code: 'SCHEMA_ERROR',
          severity: 'error'
        }]
      }
    }
  }

  /**
   * Enhance validation result with additional checks
   */
  private async enhanceValidationResult<T>(
    result: ValidationResult<T>,
    context: Record<string, any>
  ): Promise<ValidationResult<T>> {
    if (!result.success) return result

    // Add business logic validations
    const businessValidation = await this.performBusinessValidation(result.data, context)
    
    // Add security validations
    const securityValidation = this.performSecurityValidation(result.data)

    // Combine results
    return {
      ...result,
      warnings: [
        ...(result.warnings || []),
        ...businessValidation.warnings,
        ...securityValidation.warnings
      ],
      errors: [
        ...(result.errors || []),
        ...businessValidation.errors,
        ...securityValidation.errors
      ]
    }
  }

  /**
   * Perform business logic validation
   */
  private async performBusinessValidation(
    data: any,
    context: Record<string, any>
  ): Promise<{ warnings: ValidationWarning[], errors: ValidationError[] }> {
    const warnings: ValidationWarning[] = []
    const errors: ValidationError[] = []

    // Example business validations
    if (data && typeof data === 'object') {
      // Check for appointment conflicts
      if (data.date && data.staffId && context.checkConflicts) {
        // This would check against existing appointments
        // For now, just a placeholder
      }

      // Check inventory levels
      if (data.productId && data.quantity && context.checkInventory) {
        // This would check current inventory
        // For now, just a placeholder
      }

      // Check client credit limits
      if (data.clientId && data.total && context.checkCredit) {
        // This would check client credit status
        // For now, just a placeholder
      }
    }

    return { warnings, errors }
  }

  /**
   * Perform security validation
   */
  private performSecurityValidation(
    data: any
  ): { warnings: ValidationWarning[], errors: ValidationError[] } {
    const warnings: ValidationWarning[] = []
    const errors: ValidationError[] = []

    if (data && typeof data === 'object') {
      // Check for potential XSS
      this.checkForXSS(data, warnings, errors)
      
      // Check for SQL injection patterns
      this.checkForSQLInjection(data, warnings, errors)
      
      // Check for suspicious patterns
      this.checkForSuspiciousPatterns(data, warnings, errors)
    }

    return { warnings, errors }
  }

  /**
   * Check for XSS patterns
   */
  private checkForXSS(
    data: any,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ]

    this.traverseObject(data, (key, value) => {
      if (typeof value === 'string') {
        for (const pattern of xssPatterns) {
          if (pattern.test(value)) {
            errors.push({
              field: key,
              message: 'Potential XSS attack detected',
              code: 'XSS_DETECTED',
              value,
              severity: 'error'
            })
            break
          }
        }
      }
    })
  }

  /**
   * Check for SQL injection patterns
   */
  private checkForSQLInjection(
    data: any,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|\/\*|\*\/)/g,
      /(\b(OR|AND)\b.*=.*)/gi
    ]

    this.traverseObject(data, (key, value) => {
      if (typeof value === 'string') {
        for (const pattern of sqlPatterns) {
          if (pattern.test(value)) {
            warnings.push({
              field: key,
              message: 'Potential SQL injection pattern detected',
              suggestion: 'Use parameterized queries'
            })
            break
          }
        }
      }
    })
  }

  /**
   * Check for suspicious patterns
   */
  private checkForSuspiciousPatterns(
    data: any,
    warnings: ValidationWarning[],
    errors: ValidationError[]
  ) {
    const suspiciousPatterns = [
      /\b(eval|exec|system|shell_exec)\b/gi,
      /\b(file_get_contents|fopen|fread)\b/gi,
      /\b(base64_decode|hex2bin)\b/gi
    ]

    this.traverseObject(data, (key, value) => {
      if (typeof value === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            warnings.push({
              field: key,
              message: 'Suspicious code pattern detected',
              suggestion: 'Review input for potential security risks'
            })
            break
          }
        }
      }
    })
  }

  /**
   * Sanitize data recursively
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data)
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item))
    }
    
    if (data && typeof data === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value)
      }
      return sanitized
    }
    
    return data
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(input: string): string {
    if (typeof input !== 'string') return input

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '')
    
    // Trim whitespace
    sanitized = sanitized.trim()
    
    // Sanitize HTML if it looks like HTML
    if (/<[^>]*>/.test(sanitized)) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: []
      })
    }
    
    return sanitized
  }

  /**
   * Extract field schema from object schema
   */
  private extractFieldSchema(schema: z.ZodSchema<any>, fieldName: string): z.ZodSchema<any> | null {
    try {
      // This is a simplified implementation
      // In practice, you'd need more sophisticated schema introspection
      if (schema instanceof z.ZodObject) {
        const shape = (schema as any)._def.shape()
        return shape[fieldName] || null
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Generate field warnings
   */
  private generateFieldWarnings(
    fieldName: string,
    value: any,
    config: RealTimeValidationConfig
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = []

    if (!config.showWarnings) return warnings

    // Example warnings
    if (typeof value === 'string') {
      if (value.length > 100) {
        warnings.push({
          field: fieldName,
          message: 'Value is quite long',
          suggestion: 'Consider shortening for better readability'
        })
      }
      
      if (/^\s+|\s+$/.test(value)) {
        warnings.push({
          field: fieldName,
          message: 'Value has leading or trailing whitespace',
          suggestion: 'Whitespace will be automatically trimmed'
        })
      }
    }

    return warnings
  }

  /**
   * Traverse object recursively
   */
  private traverseObject(obj: any, callback: (key: string, value: any) => void, path = '') {
    if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        callback(currentPath, value)
        
        if (typeof value === 'object' && value !== null) {
          this.traverseObject(value, callback, currentPath)
        }
      }
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(schema: z.ZodSchema<any>, data: unknown, options: ValidationOptions): string {
    const schemaHash = JSON.stringify(schema._def).substring(0, 16)
    const dataHash = JSON.stringify(data).substring(0, 16)
    const optionsHash = JSON.stringify(options).substring(0, 16)
    return `${schemaHash}:${dataHash}:${optionsHash}`
  }

  /**
   * Get result from cache
   */
  private getFromCache(key: string): ValidationResult | null {
    const cached = this.validationCache.get(key)
    if (cached && Date.now() - (cached as any).timestamp < this.cacheTimeout) {
      return cached
    }
    this.validationCache.delete(key)
    return null
  }

  /**
   * Cache validation result
   */
  private cacheResult(key: string, result: ValidationResult) {
    (result as any).timestamp = Date.now()
    this.validationCache.set(key, result)
    
    // Clean up old cache entries
    if (this.validationCache.size > 1000) {
      const entries = Array.from(this.validationCache.entries())
      entries.sort(([, a], [, b]) => (b as any).timestamp - (a as any).timestamp)
      this.validationCache.clear()
      entries.slice(0, 500).forEach(([k, v]) => this.validationCache.set(k, v))
    }
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear()
  }
}

// Export singleton instance
export const enhancedValidation = new EnhancedValidationService()

// Export validation utilities
export * from './validation-schemas'
export * from './validation-rules'
export * from './sanitization'
