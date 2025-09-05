/**
 * Date validation utilities for staff management
 */

/**
 * Validate date of birth
 * @param dateOfBirth - Date string in DD-MM-YY format
 * @returns Validation result with error message if invalid
 */
export function validateDateOfBirth(dateOfBirth: string): { isValid: boolean; error?: string } {
  if (!dateOfBirth) {
    return { isValid: true } // Optional field
  }

  // Check if date is in valid DD-MM-YY format
  const dateRegex = /^\d{2}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateOfBirth)) {
    return { isValid: false, error: "Date must be in DD-MM-YY format" }
  }

  // Parse DD-MM-YY format
  const [day, month, year] = dateOfBirth.split('-').map(Number)

  // Basic validation
  if (month < 1 || month > 12) {
    return { isValid: false, error: "Invalid month (must be 01-12)" }
  }

  if (day < 1 || day > 31) {
    return { isValid: false, error: "Invalid day (must be 01-31)" }
  }

  // Convert 2-digit year to 4-digit year
  const fullYear = year < 50 ? 2000 + year : 1900 + year // Assume years 00-49 are 2000s, 50-99 are 1900s

  if (fullYear < 1900 || fullYear > new Date().getFullYear()) {
    return { isValid: false, error: "Invalid year" }
  }

  // Create date object (month is 0-indexed in JavaScript)
  const birthDate = new Date(fullYear, month - 1, day)
  const today = new Date()

  // Check if date is valid (handles invalid dates like Feb 30)
  if (birthDate.getFullYear() !== fullYear ||
      birthDate.getMonth() !== month - 1 ||
      birthDate.getDate() !== day) {
    return { isValid: false, error: "Invalid date" }
  }

  // Check if date is not in the future
  if (birthDate > today) {
    return { isValid: false, error: "Date of birth cannot be in the future" }
  }

  // Calculate age
  const age = calculateAge(birthDate, today)

  // Check minimum age (16 years)
  if (age < 16) {
    return { isValid: false, error: "Staff member must be at least 16 years old" }
  }

  // Check maximum age (80 years)
  if (age > 80) {
    return { isValid: false, error: "Staff member cannot be older than 80 years" }
  }

  return { isValid: true }
}

/**
 * Calculate age from birth date
 * @param birthDate - Birth date
 * @param currentDate - Current date (defaults to today)
 * @returns Age in years
 */
export function calculateAge(birthDate: Date, currentDate: Date = new Date()): number {
  const age = currentDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = currentDate.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
    return age - 1
  }
  
  return age
}

/**
 * Format date of birth for display (DD-MM-YY format)
 * @param dateOfBirth - Date string in various formats
 * @returns Formatted date string in DD-MM-YY format
 */
export function formatDateOfBirth(dateOfBirth: string): string {
  if (!dateOfBirth) return ""

  // If it's already in DD-MM-YY format, return as is
  if (/^\d{2}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return dateOfBirth
  }

  // If it's in MM-DD-YY format, convert to DD-MM-YY
  if (/^\d{2}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    const [first, second, year] = dateOfBirth.split('-')
    // Assume input might be MM-DD-YY, convert to DD-MM-YY
    return `${second}-${first}-${year}`
  }

  // If it's in MM-DD-YYYY format, convert to DD-MM-YY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateOfBirth)) {
    const [month, day, year] = dateOfBirth.split('-')
    const shortYear = year.slice(-2) // Get last 2 digits
    return `${day}-${month}-${shortYear}`
  }

  // If it's in YYYY-MM-DD format (from database), convert to DD-MM-YY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    const [year, month, day] = dateOfBirth.split('-')
    const shortYear = year.slice(-2) // Get last 2 digits
    return `${day}-${month}-${shortYear}`
  }

  // Try to parse as a date object and format
  try {
    const date = new Date(dateOfBirth)
    if (isNaN(date.getTime())) return dateOfBirth

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2) // Get last 2 digits

    return `${day}-${month}-${year}`
  } catch {
    return dateOfBirth
  }
}

/**
 * Convert DD-MM-YY format to YYYY-MM-DD format for database storage
 * @param displayDate - Date string in DD-MM-YY format
 * @returns Date string in YYYY-MM-DD format
 */
export function convertDisplayDateToISO(displayDate: string): string {
  if (!displayDate) return ""

  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) {
    return displayDate
  }

  // Convert DD-MM-YY to YYYY-MM-DD
  if (/^\d{2}-\d{2}-\d{2}$/.test(displayDate)) {
    const [day, month, year] = displayDate.split('-')
    const fullYear = parseInt(year) < 50 ? 2000 + parseInt(year) : 1900 + parseInt(year)
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Convert MM-DD-YYYY to YYYY-MM-DD (for backward compatibility)
  if (/^\d{2}-\d{2}-\d{4}$/.test(displayDate)) {
    const [month, day, year] = displayDate.split('-')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Convert DD-MM-YYYY to YYYY-MM-DD (for backward compatibility)
  if (/^\d{2}-\d{2}-\d{4}$/.test(displayDate)) {
    const [day, month, year] = displayDate.split('-')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return displayDate
}

/**
 * Get age from date of birth string
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Age in years or null if invalid date
 */
export function getAgeFromDateOfBirth(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null
  
  try {
    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) return null
    
    return calculateAge(birthDate)
  } catch {
    return null
  }
}
