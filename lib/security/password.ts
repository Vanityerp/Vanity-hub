import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Password strength requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

// Common weak passwords to reject
const commonWeakPasswords = new Set([
  'password', 'password123', '123456', '123456789', 'qwerty',
  'abc123', 'password1', 'admin', 'letmein', 'welcome',
  'monkey', '1234567890', 'dragon', 'master', 'hello',
  'freedom', 'whatever', 'qazwsx', 'trustno1', 'jordan23'
])

// Password strength levels
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  FAIR = 2,
  GOOD = 3,
  STRONG = 4,
  VERY_STRONG = 5
}

export interface PasswordValidationResult {
  isValid: boolean
  strength: PasswordStrength
  score: number
  errors: string[]
  suggestions: string[]
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  try {
    // Validate password first
    const validation = validatePassword(password)
    if (!validation.isValid) {
      throw new Error(`Password validation failed: ${validation.errors.join(', ')}`)
    }

    // Use a high salt rounds for security (12 is a good balance)
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  } catch (error) {
    console.error('Password hashing error:', error)
    throw new Error('Failed to hash password')
  }
}

// Compare password with hash
export async function comparePassword(
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword)
  } catch (error) {
    console.error('Password comparison error:', error)
    return false
  }
}

// Comprehensive password validation
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  const suggestions: string[] = []
  let score = 0

  // Basic validation
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else if (password.length >= 8) {
    score += 1
  }

  if (password.length >= 12) {
    score += 1
  }

  // Character type checks
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /[0-9]/.test(password)
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password)

  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter')
    suggestions.push('Add uppercase letters (A-Z)')
  } else {
    score += 1
  }

  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter')
    suggestions.push('Add lowercase letters (a-z)')
  } else {
    score += 1
  }

  if (!hasNumbers) {
    errors.push('Password must contain at least one number')
    suggestions.push('Add numbers (0-9)')
  } else {
    score += 1
  }

  if (!hasSpecialChars) {
    errors.push('Password must contain at least one special character')
    suggestions.push('Add special characters (!@#$%^&*)')
  } else {
    score += 1
  }

  // Advanced checks
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters')
  }

  // Check for common weak passwords
  if (commonWeakPasswords.has(password.toLowerCase())) {
    errors.push('This password is too common and easily guessed')
    suggestions.push('Use a unique password that is not commonly used')
    score = Math.max(0, score - 2)
  }

  // Check for repeated characters
  const repeatedChars = /(.)\1{2,}/.test(password)
  if (repeatedChars) {
    suggestions.push('Avoid repeating the same character multiple times')
    score = Math.max(0, score - 1)
  }

  // Check for sequential characters
  const sequential = hasSequentialChars(password)
  if (sequential) {
    suggestions.push('Avoid sequential characters (abc, 123, qwerty)')
    score = Math.max(0, score - 1)
  }

  // Check for dictionary words (simplified check)
  const commonWords = ['admin', 'user', 'login', 'system', 'computer', 'internet']
  const containsCommonWord = commonWords.some(word => 
    password.toLowerCase().includes(word)
  )
  if (containsCommonWord) {
    suggestions.push('Avoid using common words')
    score = Math.max(0, score - 1)
  }

  // Bonus points for variety
  const charTypes = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars]
  const typeCount = charTypes.filter(Boolean).length
  if (typeCount >= 3) {
    score += 1
  }

  // Length bonus
  if (password.length >= 16) {
    score += 1
  }

  // Determine strength
  let strength: PasswordStrength
  if (score <= 1) {
    strength = PasswordStrength.VERY_WEAK
  } else if (score <= 2) {
    strength = PasswordStrength.WEAK
  } else if (score <= 3) {
    strength = PasswordStrength.FAIR
  } else if (score <= 4) {
    strength = PasswordStrength.GOOD
  } else if (score <= 5) {
    strength = PasswordStrength.STRONG
  } else {
    strength = PasswordStrength.VERY_STRONG
  }

  // Add suggestions for improvement
  if (strength < PasswordStrength.GOOD) {
    if (password.length < 12) {
      suggestions.push('Make your password longer (12+ characters)')
    }
    if (typeCount < 4) {
      suggestions.push('Use a mix of uppercase, lowercase, numbers, and symbols')
    }
    suggestions.push('Consider using a passphrase with multiple words')
  }

  return {
    isValid: errors.length === 0 && strength >= PasswordStrength.FAIR,
    strength,
    score,
    errors,
    suggestions
  }
}

// Check for sequential characters
function hasSequentialChars(password: string): boolean {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiopasdfghjklzxcvbnm'
  ]

  for (const sequence of sequences) {
    for (let i = 0; i <= sequence.length - 3; i++) {
      const subseq = sequence.substring(i, i + 3)
      if (password.toLowerCase().includes(subseq)) {
        return true
      }
    }
  }

  return false
}

// Generate a secure random password
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Check if password needs to be changed (age-based)
export function shouldChangePassword(lastChanged: Date, maxAgeInDays: number = 90): boolean {
  const now = new Date()
  const daysSinceChange = Math.floor((now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60 * 24))
  return daysSinceChange >= maxAgeInDays
}

// Password strength meter for UI
export function getPasswordStrengthInfo(strength: PasswordStrength) {
  switch (strength) {
    case PasswordStrength.VERY_WEAK:
      return { label: 'Very Weak', color: '#ff4444', percentage: 10 }
    case PasswordStrength.WEAK:
      return { label: 'Weak', color: '#ff8800', percentage: 25 }
    case PasswordStrength.FAIR:
      return { label: 'Fair', color: '#ffaa00', percentage: 50 }
    case PasswordStrength.GOOD:
      return { label: 'Good', color: '#88cc00', percentage: 75 }
    case PasswordStrength.STRONG:
      return { label: 'Strong', color: '#44aa00', percentage: 90 }
    case PasswordStrength.VERY_STRONG:
      return { label: 'Very Strong', color: '#00aa44', percentage: 100 }
    default:
      return { label: 'Unknown', color: '#cccccc', percentage: 0 }
  }
}
