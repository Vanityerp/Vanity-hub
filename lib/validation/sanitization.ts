// Enhanced Data Sanitization Service
import DOMPurify from 'isomorphic-dompurify'
import { logger } from '@/lib/error-handling/logger'

// Sanitization options interface
export interface SanitizationOptions {
  allowHtml?: boolean
  allowedTags?: string[]
  allowedAttributes?: string[]
  maxLength?: number
  trimWhitespace?: boolean
  removeControlChars?: boolean
  normalizeUnicode?: boolean
  preventXSS?: boolean
  preventSQLInjection?: boolean
}

// Sanitization result interface
export interface SanitizationResult {
  original: any
  sanitized: any
  changed: boolean
  warnings: string[]
  removedContent?: string[]
}

// Enhanced sanitization service
class SanitizationService {
  private defaultOptions: SanitizationOptions = {
    allowHtml: false,
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: [],
    maxLength: 10000,
    trimWhitespace: true,
    removeControlChars: true,
    normalizeUnicode: true,
    preventXSS: true,
    preventSQLInjection: true
  }

  /**
   * Sanitize any data type
   */
  sanitize(data: any, options: SanitizationOptions = {}): SanitizationResult {
    const opts = { ...this.defaultOptions, ...options }
    const warnings: string[] = []
    const removedContent: string[] = []

    try {
      const sanitized = this.sanitizeValue(data, opts, warnings, removedContent)
      
      return {
        original: data,
        sanitized,
        changed: JSON.stringify(data) !== JSON.stringify(sanitized),
        warnings,
        removedContent
      }
    } catch (error) {
      logger.error('Sanitization error', error)
      return {
        original: data,
        sanitized: data,
        changed: false,
        warnings: ['Sanitization failed, using original data']
      }
    }
  }

  /**
   * Sanitize a single value
   */
  private sanitizeValue(
    value: any,
    options: SanitizationOptions,
    warnings: string[],
    removedContent: string[]
  ): any {
    if (value === null || value === undefined) {
      return value
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value, options, warnings, removedContent)
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item, options, warnings, removedContent))
    }

    if (typeof value === 'object') {
      const sanitized: any = {}
      for (const [key, val] of Object.entries(value)) {
        const sanitizedKey = this.sanitizeString(key, options, warnings, removedContent)
        sanitized[sanitizedKey] = this.sanitizeValue(val, options, warnings, removedContent)
      }
      return sanitized
    }

    return value
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(
    input: string,
    options: SanitizationOptions,
    warnings: string[],
    removedContent: string[]
  ): string {
    let sanitized = input

    // Remove control characters
    if (options.removeControlChars) {
      const original = sanitized
      sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')
      if (original !== sanitized) {
        warnings.push('Removed control characters')
        removedContent.push('Control characters')
      }
    }

    // Trim whitespace
    if (options.trimWhitespace) {
      const original = sanitized
      sanitized = sanitized.trim()
      if (original !== sanitized) {
        warnings.push('Trimmed whitespace')
      }
    }

    // Normalize unicode
    if (options.normalizeUnicode) {
      const original = sanitized
      sanitized = sanitized.normalize('NFC')
      if (original !== sanitized) {
        warnings.push('Normalized unicode characters')
      }
    }

    // Prevent XSS
    if (options.preventXSS) {
      sanitized = this.preventXSS(sanitized, options, warnings, removedContent)
    }

    // Prevent SQL injection
    if (options.preventSQLInjection) {
      sanitized = this.preventSQLInjection(sanitized, warnings, removedContent)
    }

    // Handle HTML content
    if (options.allowHtml) {
      sanitized = this.sanitizeHtml(sanitized, options, warnings, removedContent)
    } else {
      // Remove all HTML tags if not allowed
      const original = sanitized
      sanitized = sanitized.replace(/<[^>]*>/g, '')
      if (original !== sanitized) {
        warnings.push('Removed HTML tags')
        removedContent.push('HTML tags')
      }
    }

    // Enforce maximum length
    if (options.maxLength && sanitized.length > options.maxLength) {
      const original = sanitized
      sanitized = sanitized.substring(0, options.maxLength)
      warnings.push(`Truncated to ${options.maxLength} characters`)
      removedContent.push(`${original.length - sanitized.length} characters`)
    }

    return sanitized
  }

  /**
   * Prevent XSS attacks
   */
  private preventXSS(
    input: string,
    options: SanitizationOptions,
    warnings: string[],
    removedContent: string[]
  ): string {
    const xssPatterns = [
      {
        pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        name: 'Script tags'
      },
      {
        pattern: /javascript:/gi,
        name: 'JavaScript URLs'
      },
      {
        pattern: /on\w+\s*=/gi,
        name: 'Event handlers'
      },
      {
        pattern: /<iframe[^>]*>/gi,
        name: 'Iframe tags'
      },
      {
        pattern: /<object[^>]*>/gi,
        name: 'Object tags'
      },
      {
        pattern: /<embed[^>]*>/gi,
        name: 'Embed tags'
      },
      {
        pattern: /<link[^>]*>/gi,
        name: 'Link tags'
      },
      {
        pattern: /<meta[^>]*>/gi,
        name: 'Meta tags'
      }
    ]

    let sanitized = input

    for (const { pattern, name } of xssPatterns) {
      const original = sanitized
      sanitized = sanitized.replace(pattern, '')
      if (original !== sanitized) {
        warnings.push(`Removed potential XSS: ${name}`)
        removedContent.push(name)
      }
    }

    return sanitized
  }

  /**
   * Prevent SQL injection
   */
  private preventSQLInjection(
    input: string,
    warnings: string[],
    removedContent: string[]
  ): string {
    const sqlPatterns = [
      {
        pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        replacement: '',
        name: 'SQL keywords'
      },
      {
        pattern: /(--|\/\*|\*\/)/g,
        replacement: '',
        name: 'SQL comments'
      },
      {
        pattern: /(\b(OR|AND)\b\s*=\s*)/gi,
        replacement: '',
        name: 'SQL injection patterns'
      }
    ]

    let sanitized = input

    for (const { pattern, replacement, name } of sqlPatterns) {
      const original = sanitized
      sanitized = sanitized.replace(pattern, replacement)
      if (original !== sanitized) {
        warnings.push(`Removed potential SQL injection: ${name}`)
        removedContent.push(name)
      }
    }

    return sanitized
  }

  /**
   * Sanitize HTML content
   */
  private sanitizeHtml(
    input: string,
    options: SanitizationOptions,
    warnings: string[],
    removedContent: string[]
  ): string {
    const original = input

    const sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: options.allowedTags || this.defaultOptions.allowedTags,
      ALLOWED_ATTR: options.allowedAttributes || this.defaultOptions.allowedAttributes,
      REMOVE_DATA_ATTRIBUTES: true,
      REMOVE_UNKNOWN_PROTOCOLS: true,
      USE_PROFILES: { html: true }
    })

    if (original !== sanitized) {
      warnings.push('Sanitized HTML content')
      
      // Try to identify what was removed
      const removedTags = this.findRemovedTags(original, sanitized)
      if (removedTags.length > 0) {
        removedContent.push(...removedTags)
      }
    }

    return sanitized
  }

  /**
   * Find removed HTML tags
   */
  private findRemovedTags(original: string, sanitized: string): string[] {
    const originalTags = original.match(/<[^>]+>/g) || []
    const sanitizedTags = sanitized.match(/<[^>]+>/g) || []
    
    const removed: string[] = []
    
    for (const tag of originalTags) {
      if (!sanitizedTags.includes(tag)) {
        const tagName = tag.match(/<\/?(\w+)/)?.[1]
        if (tagName && !removed.includes(tagName)) {
          removed.push(tagName)
        }
      }
    }
    
    return removed
  }

  /**
   * Sanitize file names
   */
  sanitizeFileName(fileName: string): SanitizationResult {
    const warnings: string[] = []
    const removedContent: string[] = []
    
    let sanitized = fileName

    // Remove dangerous characters
    const original = sanitized
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')
    if (original !== sanitized) {
      warnings.push('Removed dangerous characters from filename')
      removedContent.push('Special characters')
    }

    // Remove consecutive underscores
    sanitized = sanitized.replace(/_{2,}/g, '_')

    // Limit length
    if (sanitized.length > 255) {
      const extension = sanitized.split('.').pop()
      const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
      const maxNameLength = 255 - (extension ? extension.length + 1 : 0)
      sanitized = nameWithoutExt.substring(0, maxNameLength) + (extension ? `.${extension}` : '')
      warnings.push('Truncated filename to 255 characters')
    }

    // Prevent reserved names
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ]
    
    const nameWithoutExt = sanitized.split('.')[0].toUpperCase()
    if (reservedNames.includes(nameWithoutExt)) {
      sanitized = `file_${sanitized}`
      warnings.push('Renamed reserved filename')
    }

    return {
      original: fileName,
      sanitized,
      changed: fileName !== sanitized,
      warnings,
      removedContent
    }
  }

  /**
   * Sanitize email addresses
   */
  sanitizeEmail(email: string): SanitizationResult {
    const warnings: string[] = []
    const removedContent: string[] = []
    
    let sanitized = email.toLowerCase().trim()

    // Remove dangerous characters
    const original = sanitized
    sanitized = sanitized.replace(/[^a-zA-Z0-9@._-]/g, '')
    if (original !== sanitized) {
      warnings.push('Removed invalid characters from email')
      removedContent.push('Invalid characters')
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
      warnings.push('Email format may be invalid')
    }

    return {
      original: email,
      sanitized,
      changed: email !== sanitized,
      warnings,
      removedContent
    }
  }

  /**
   * Sanitize phone numbers
   */
  sanitizePhone(phone: string): SanitizationResult {
    const warnings: string[] = []
    const removedContent: string[] = []
    
    let sanitized = phone

    // Remove all non-digit characters except + at the beginning
    const original = sanitized
    sanitized = sanitized.replace(/[^\d+]/g, '')
    if (original !== sanitized) {
      warnings.push('Removed non-digit characters from phone number')
      removedContent.push('Non-digit characters')
    }

    // Ensure + is only at the beginning
    if (sanitized.includes('+')) {
      const parts = sanitized.split('+')
      sanitized = '+' + parts.join('')
      if (sanitized !== `+${parts.join('')}`) {
        warnings.push('Moved + to beginning of phone number')
      }
    }

    return {
      original: phone,
      sanitized,
      changed: phone !== sanitized,
      warnings,
      removedContent
    }
  }

  /**
   * Sanitize URLs
   */
  sanitizeUrl(url: string): SanitizationResult {
    const warnings: string[] = []
    const removedContent: string[] = []
    
    let sanitized = url.trim()

    try {
      const parsed = new URL(sanitized)
      
      // Only allow safe protocols
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:']
      if (!allowedProtocols.includes(parsed.protocol)) {
        sanitized = `https://${sanitized.replace(/^[^:]+:\/\//, '')}`
        warnings.push('Changed protocol to HTTPS')
      }

      // Remove dangerous parameters
      const dangerousParams = ['javascript', 'vbscript', 'data']
      const searchParams = new URLSearchParams(parsed.search)
      
      for (const [key, value] of searchParams.entries()) {
        if (dangerousParams.some(dangerous => 
          key.toLowerCase().includes(dangerous) || 
          value.toLowerCase().includes(dangerous)
        )) {
          searchParams.delete(key)
          warnings.push(`Removed dangerous parameter: ${key}`)
          removedContent.push(`Parameter: ${key}`)
        }
      }
      
      parsed.search = searchParams.toString()
      sanitized = parsed.toString()
      
    } catch (error) {
      warnings.push('Invalid URL format')
    }

    return {
      original: url,
      sanitized,
      changed: url !== sanitized,
      warnings,
      removedContent
    }
  }

  /**
   * Batch sanitization
   */
  sanitizeBatch(
    data: Record<string, any>,
    fieldOptions: Record<string, SanitizationOptions> = {}
  ): Record<string, SanitizationResult> {
    const results: Record<string, SanitizationResult> = {}

    for (const [field, value] of Object.entries(data)) {
      const options = fieldOptions[field] || this.defaultOptions
      results[field] = this.sanitize(value, options)
    }

    return results
  }
}

// Export singleton instance
export const sanitizationService = new SanitizationService()

// Export convenience functions
export const sanitize = (data: any, options?: SanitizationOptions) => 
  sanitizationService.sanitize(data, options)

export const sanitizeFileName = (fileName: string) => 
  sanitizationService.sanitizeFileName(fileName)

export const sanitizeEmail = (email: string) => 
  sanitizationService.sanitizeEmail(email)

export const sanitizePhone = (phone: string) => 
  sanitizationService.sanitizePhone(phone)

export const sanitizeUrl = (url: string) => 
  sanitizationService.sanitizeUrl(url)

export const sanitizeBatch = (data: Record<string, any>, fieldOptions?: Record<string, SanitizationOptions>) => 
  sanitizationService.sanitizeBatch(data, fieldOptions)
