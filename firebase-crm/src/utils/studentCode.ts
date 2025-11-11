/**
 * Student Code Generator
 * Generates unique 6-character codes for student identification
 * Format: 6 characters using A-Z (excluding O, I) and 2-9 (excluding 0, 1)
 * Example: K8M2B6, R7P3D9, F5T4N8
 */

// Character sets (excluding confusing characters)
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // 24 letters (no O, I)
const DIGITS = '23456789' // 8 digits (no 0, 1)
const CHARSET = LETTERS + DIGITS // Total: 32 characters

/**
 * Generates a random student code
 * @returns 6-character code (e.g., "K8M2B6")
 */
export function generateStudentCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length)
    code += CHARSET[randomIndex]
  }
  return code
}

/**
 * Validates if a student code has the correct format
 * @param code - Code to validate
 * @returns true if valid, false otherwise
 */
export function isValidStudentCode(code: string): boolean {
  if (!code || code.length !== 6) {
    return false
  }

  // Check if all characters are in the allowed charset
  for (let i = 0; i < code.length; i++) {
    if (!CHARSET.includes(code[i].toUpperCase())) {
      return false
    }
  }

  return true
}

/**
 * Formats a student code for display (adds spaces for readability)
 * @param code - Code to format
 * @returns Formatted code (e.g., "K8M 2B6")
 */
export function formatStudentCode(code: string): string {
  if (!code || code.length !== 6) {
    return code
  }
  return `${code.slice(0, 3)} ${code.slice(3)}`
}

/**
 * Normalizes a student code (removes spaces, converts to uppercase)
 * @param code - Code to normalize
 * @returns Normalized code
 */
export function normalizeStudentCode(code: string): string {
  return code.replace(/\s+/g, '').toUpperCase()
}

/**
 * Calculates total possible combinations
 * 32^6 = 1,073,741,824 (over 1 billion unique codes)
 */
export const TOTAL_COMBINATIONS = Math.pow(CHARSET.length, 6)
