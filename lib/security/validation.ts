import { z } from 'zod'
let DOMPurify: any;

if (typeof window !== 'undefined') {
  import('isomorphic-dompurify').then(module => {
    DOMPurify = module.default;
  });
}

// Password validation schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// Email validation schema
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email must not exceed 254 characters')
  .transform(email => email.toLowerCase().trim())

// Phone validation schema
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .transform(phone => phone.replace(/\s+/g, ''))

// Name validation schema
export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(name => name.trim())

// Address validation schema
export const addressSchema = z.string()
  .max(255, 'Address must not exceed 255 characters')
  .transform(address => address.trim())

// User registration schema
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User login schema
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

// Client creation schema
export const clientCreationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: addressSchema.optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  dateOfBirth: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  preferredLocation: z.string().uuid().optional(),
})

// Appointment creation schema
export const appointmentCreationSchema = z.object({
  clientId: z.string().uuid(),
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  locationId: z.string().uuid(),
  date: z.string().datetime(),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  notes: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
})

// Service creation schema
export const serviceCreationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid(),
  duration: z.number().min(15).max(480),
  price: z.number().min(0),
  locations: z.array(z.string().uuid()),
  isActive: z.boolean().default(true),
})

// Product creation schema
export const productCreationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid(),
  brand: z.string().max(100).optional(),
  sku: z.string().max(50).optional(),
  price: z.number().min(0),
  cost: z.number().min(0).optional(),
  stockQuantity: z.number().min(0).default(0),
  minStockLevel: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
})

// Transaction creation schema
export const transactionCreationSchema = z.object({
  clientId: z.string().uuid().optional(),
  locationId: z.string().uuid(),
  staffId: z.string().uuid(),
  items: z.array(z.object({
    type: z.enum(['SERVICE', 'PRODUCT']),
    id: z.string().uuid(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    discount: z.number().min(0).max(100).optional(),
  })),
  paymentMethod: z.enum(['CASH', 'CARD', 'GIFT_CARD', 'BANK_TRANSFER']),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
  notes: z.string().max(500).optional(),
})

// Input sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Limit length to prevent DoS
  sanitized = sanitized.substring(0, 10000)
  
  return sanitized
}

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';

  // Use DOMPurify to sanitize HTML only on the client side
  if (typeof window !== 'undefined' && DOMPurify) {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  } else {
    // On the server or if DOMPurify is not yet loaded, return input as is or handle differently
    // For now, returning input as is, but consider a more robust server-side sanitization if needed.
    return input;
  }
}

export function sanitizeFileName(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove dangerous characters from file names
  return input
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}

// SQL injection prevention (additional layer)
export function escapeSqlString(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\x00/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')
}

// XSS prevention helpers
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Validate and sanitize API input
export function validateAndSanitizeInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // First sanitize string inputs
    if (typeof input === 'object' && input !== null) {
      const sanitizedInput = sanitizeObjectStrings(input)
      const result = schema.parse(sanitizedInput)
      return { success: true, data: result }
    } else {
      const result = schema.parse(input)
      return { success: true, data: result }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Invalid input format']
    }
  }
}

// Recursively sanitize string properties in objects
function sanitizeObjectStrings(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectStrings)
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectStrings(value)
    }
    return sanitized
  }
  
  return obj
}

// Rate limiting helpers
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export const rateLimitConfigs = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  registration: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 registrations per hour
  api: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
  upload: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 uploads per hour
}
