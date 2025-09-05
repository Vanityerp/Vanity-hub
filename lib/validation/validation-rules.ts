// Custom Validation Rules and Business Logic Validators
import { z } from 'zod'

// Business validation rules
export const businessRules = {
  /**
   * Validate appointment scheduling rules
   */
  appointmentScheduling: {
    // Check if appointment is within business hours
    withinBusinessHours: (date: string, locationId: string) => {
      return z.string().refine(async (dateStr) => {
        // This would check against location business hours
        // For now, just check if it's during reasonable hours (9 AM - 6 PM)
        const appointmentDate = new Date(dateStr)
        const hour = appointmentDate.getHours()
        return hour >= 9 && hour <= 18
      }, 'Appointment must be within business hours')
    },

    // Check for staff availability
    staffAvailable: (staffId: string, date: string, duration: number) => {
      return z.object({
        staffId: z.string(),
        date: z.string(),
        duration: z.number()
      }).refine(async (data) => {
        // This would check staff schedule and existing appointments
        // For now, just a placeholder
        return true
      }, 'Staff member is not available at this time')
    },

    // Check for service availability at location
    serviceAvailable: (serviceId: string, locationId: string) => {
      return z.object({
        serviceId: z.string(),
        locationId: z.string()
      }).refine(async (data) => {
        // This would check if service is offered at location
        // For now, just a placeholder
        return true
      }, 'Service is not available at this location')
    },

    // Check minimum advance booking time
    minimumAdvanceBooking: (hours: number = 2) => {
      return z.string().refine((dateStr) => {
        const appointmentDate = new Date(dateStr)
        const now = new Date()
        const diffHours = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        return diffHours >= hours
      }, `Appointment must be booked at least ${hours} hours in advance`)
    },

    // Check maximum advance booking time
    maximumAdvanceBooking: (days: number = 90) => {
      return z.string().refine((dateStr) => {
        const appointmentDate = new Date(dateStr)
        const now = new Date()
        const diffDays = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays <= days
      }, `Appointment cannot be booked more than ${days} days in advance`)
    }
  },

  /**
   * Validate inventory management rules
   */
  inventory: {
    // Check if sufficient stock is available
    sufficientStock: (productId: string, quantity: number) => {
      return z.object({
        productId: z.string(),
        quantity: z.number()
      }).refine(async (data) => {
        // This would check current inventory levels
        // For now, just a placeholder
        return true
      }, 'Insufficient stock available')
    },

    // Check if stock level is below minimum
    belowMinimumStock: (currentStock: number, minimumStock: number) => {
      return z.number().refine((stock) => {
        return stock >= minimumStock
      }, `Stock level is below minimum threshold of ${minimumStock}`)
    },

    // Validate stock adjustment reasons
    stockAdjustmentReason: z.enum([
      'damaged',
      'expired',
      'theft',
      'correction',
      'return',
      'promotion',
      'other'
    ], { errorMap: () => ({ message: 'Invalid stock adjustment reason' }) })
  },

  /**
   * Validate financial transaction rules
   */
  financial: {
    // Check if payment amount matches total
    paymentAmountMatch: z.object({
      total: z.number(),
      paymentAmount: z.number()
    }).refine((data) => {
      return Math.abs(data.total - data.paymentAmount) < 0.01
    }, 'Payment amount must match transaction total'),

    // Validate discount limits
    discountLimit: (maxPercentage: number = 50) => {
      return z.number().refine((discount) => {
        return discount <= maxPercentage
      }, `Discount cannot exceed ${maxPercentage}%`)
    },

    // Check for suspicious transaction amounts
    suspiciousAmount: z.number().refine((amount) => {
      // Flag transactions over $10,000 for review
      return amount <= 10000
    }, 'Large transaction amount requires manager approval'),

    // Validate refund eligibility
    refundEligible: (originalDate: string, refundPolicy: number = 30) => {
      return z.string().refine((dateStr) => {
        const originalTransaction = new Date(dateStr)
        const now = new Date()
        const diffDays = (now.getTime() - originalTransaction.getTime()) / (1000 * 60 * 60 * 24)
        return diffDays <= refundPolicy
      }, `Refund must be requested within ${refundPolicy} days`)
    }
  },

  /**
   * Validate client management rules
   */
  client: {
    // Check for duplicate clients
    noDuplicateClient: (email: string, phone: string) => {
      return z.object({
        email: z.string().optional(),
        phone: z.string()
      }).refine(async (data) => {
        // This would check existing clients
        // For now, just a placeholder
        return true
      }, 'Client with this email or phone already exists')
    },

    // Validate client age for certain services
    minimumAge: (serviceId: string, dateOfBirth: string) => {
      return z.object({
        serviceId: z.string(),
        dateOfBirth: z.string()
      }).refine((data) => {
        const birth = new Date(data.dateOfBirth)
        const now = new Date()
        const age = now.getFullYear() - birth.getFullYear()
        
        // Example: Some services require minimum age of 18
        const restrictedServices = ['tattoo', 'piercing']
        if (restrictedServices.includes(data.serviceId)) {
          return age >= 18
        }
        
        return age >= 13 // General minimum age
      }, 'Client does not meet minimum age requirement for this service')
    },

    // Validate emergency contact
    validEmergencyContact: z.object({
      name: z.string().min(1),
      phone: z.string().min(1),
      relationship: z.string().min(1)
    }).refine((contact) => {
      // Emergency contact cannot be the same as client
      return contact.name.trim().length > 0
    }, 'Emergency contact information is required')
  },

  /**
   * Validate staff management rules
   */
  staff: {
    // Check staff qualifications for services
    qualifiedForService: (staffId: string, serviceId: string) => {
      return z.object({
        staffId: z.string(),
        serviceId: z.string()
      }).refine(async (data) => {
        // This would check staff certifications and specialties
        // For now, just a placeholder
        return true
      }, 'Staff member is not qualified to perform this service')
    },

    // Validate work schedule
    validWorkSchedule: z.object({
      start: z.string(),
      end: z.string()
    }).refine((schedule) => {
      const start = new Date(`2000-01-01T${schedule.start}`)
      const end = new Date(`2000-01-01T${schedule.end}`)
      return start < end
    }, 'End time must be after start time'),

    // Check maximum working hours per day
    maximumWorkingHours: (maxHours: number = 12) => {
      return z.object({
        start: z.string(),
        end: z.string()
      }).refine((schedule) => {
        const start = new Date(`2000-01-01T${schedule.start}`)
        const end = new Date(`2000-01-01T${schedule.end}`)
        const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        return diffHours <= maxHours
      }, `Working hours cannot exceed ${maxHours} hours per day`)
    }
  }
}

// Data integrity validators
export const dataIntegrityRules = {
  /**
   * Cross-reference validation
   */
  crossReference: {
    // Validate foreign key relationships
    foreignKeyExists: (table: string, id: string) => {
      return z.string().refine(async (value) => {
        // This would check if the referenced record exists
        // For now, just validate UUID format
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
      }, `Invalid reference to ${table}`)
    },

    // Validate circular references
    noCircularReference: (parentId: string, childId: string) => {
      return z.object({
        parentId: z.string(),
        childId: z.string()
      }).refine((data) => {
        return data.parentId !== data.childId
      }, 'Circular reference detected')
    }
  },

  /**
   * Data consistency validation
   */
  consistency: {
    // Validate date ranges
    validDateRange: z.object({
      startDate: z.string(),
      endDate: z.string()
    }).refine((data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return start <= end
    }, 'End date must be after start date'),

    // Validate numeric ranges
    validNumericRange: (min: number, max: number) => {
      return z.object({
        min: z.number(),
        max: z.number()
      }).refine((data) => {
        return data.min <= data.max
      }, 'Maximum value must be greater than or equal to minimum value')
    },

    // Validate required fields based on conditions
    conditionalRequired: (condition: (data: any) => boolean, field: string) => {
      return z.any().refine((data) => {
        if (condition(data)) {
          return data[field] !== undefined && data[field] !== null && data[field] !== ''
        }
        return true
      }, `${field} is required when condition is met`)
    }
  }
}

// Security validation rules
export const securityRules = {
  /**
   * Input sanitization validators
   */
  sanitization: {
    // Prevent XSS attacks
    noXSS: z.string().refine((value) => {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ]
      return !xssPatterns.some(pattern => pattern.test(value))
    }, 'Potentially dangerous content detected'),

    // Prevent SQL injection
    noSQLInjection: z.string().refine((value) => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        /(--|\/\*|\*\/)/g
      ]
      return !sqlPatterns.some(pattern => pattern.test(value))
    }, 'Potentially dangerous SQL content detected'),

    // Validate file uploads
    safeFileUpload: z.object({
      name: z.string(),
      type: z.string(),
      size: z.number()
    }).refine((file) => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain'
      ]
      return allowedTypes.includes(file.type)
    }, 'File type not allowed').refine((file) => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      return file.size <= maxSize
    }, 'File size too large')
  },

  /**
   * Access control validators
   */
  accessControl: {
    // Validate user permissions
    hasPermission: (requiredPermission: string) => {
      return z.any().refine(async (context) => {
        // This would check user permissions
        // For now, just a placeholder
        return true
      }, `Insufficient permissions: ${requiredPermission} required`)
    },

    // Validate resource ownership
    ownsResource: (userId: string, resourceOwnerId: string) => {
      return z.object({
        userId: z.string(),
        resourceOwnerId: z.string()
      }).refine((data) => {
        return data.userId === data.resourceOwnerId
      }, 'Access denied: You do not own this resource')
    },

    // Validate rate limiting
    withinRateLimit: (maxRequests: number, timeWindow: number) => {
      return z.any().refine(async (context) => {
        // This would check rate limiting
        // For now, just a placeholder
        return true
      }, `Rate limit exceeded: Maximum ${maxRequests} requests per ${timeWindow} seconds`)
    }
  }
}

// Performance validation rules
export const performanceRules = {
  /**
   * Data size validators
   */
  dataSize: {
    // Limit array sizes
    maxArraySize: (maxSize: number) => {
      return z.array(z.any()).max(maxSize, `Array cannot contain more than ${maxSize} items`)
    },

    // Limit string lengths
    maxStringLength: (maxLength: number) => {
      return z.string().max(maxLength, `String cannot exceed ${maxLength} characters`)
    },

    // Limit object depth
    maxObjectDepth: (maxDepth: number) => {
      return z.any().refine((value) => {
        const getDepth = (obj: any, depth = 0): number => {
          if (depth > maxDepth) return depth
          if (obj && typeof obj === 'object') {
            return Math.max(...Object.values(obj).map(v => getDepth(v, depth + 1)))
          }
          return depth
        }
        return getDepth(value) <= maxDepth
      }, `Object depth cannot exceed ${maxDepth} levels`)
    }
  },

  /**
   * Query optimization validators
   */
  queryOptimization: {
    // Validate pagination parameters
    validPagination: z.object({
      page: z.number().min(1).max(1000),
      limit: z.number().min(1).max(100)
    }),

    // Validate search parameters
    validSearch: z.object({
      query: z.string().min(1).max(100),
      filters: z.record(z.any()).optional()
    }).refine((data) => {
      // Prevent overly complex searches
      const filterCount = data.filters ? Object.keys(data.filters).length : 0
      return filterCount <= 10
    }, 'Too many search filters')
  }
}

// Export all validation rules
export const validationRules = {
  business: businessRules,
  dataIntegrity: dataIntegrityRules,
  security: securityRules,
  performance: performanceRules
}

// Utility functions for creating custom validators
export const validatorUtils = {
  /**
   * Create a conditional validator
   */
  conditional: <T>(
    condition: (data: any) => boolean,
    validator: z.ZodSchema<T>,
    message?: string
  ) => {
    return z.any().refine((data) => {
      if (condition(data)) {
        const result = validator.safeParse(data)
        return result.success
      }
      return true
    }, message || 'Conditional validation failed')
  },

  /**
   * Create an async validator
   */
  async: <T>(
    validator: (data: T) => Promise<boolean>,
    message: string
  ) => {
    return z.any().refine(validator, message)
  },

  /**
   * Create a cross-field validator
   */
  crossField: <T>(
    fields: string[],
    validator: (values: any[]) => boolean,
    message: string
  ) => {
    return z.any().refine((data) => {
      const values = fields.map(field => data[field])
      return validator(values)
    }, message)
  },

  /**
   * Create a regex validator with custom message
   */
  regex: (pattern: RegExp, message: string) => {
    return z.string().regex(pattern, message)
  },

  /**
   * Create a length validator
   */
  length: (min: number, max: number, message?: string) => {
    return z.string()
      .min(min, message || `Must be at least ${min} characters`)
      .max(max, message || `Must not exceed ${max} characters`)
  }
}
