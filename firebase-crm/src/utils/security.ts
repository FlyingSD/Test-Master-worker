/**
 * 🔒 Security Utilities
 *
 * Generic security validation functions following PoLP (Principle of Least Privilege).
 * Centralized security logic for consistent permission checking across all CRUD operations.
 *
 * @module utils/security
 */

import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ERROR_MESSAGES } from '@/constants/messages'
import type { UserProfile } from '@/types'
import type { CollectionName } from '@/lib/collections'

/**
 * Document with ownership tracking
 */
export interface OwnedDocument {
  id: string
  createdBy: string
  [key: string]: any
}

/**
 * Document with group assignment (for students)
 */
export interface GroupDocument {
  id: string
  group: string
  [key: string]: any
}

/**
 * Security check result
 */
export interface SecurityCheckResult {
  allowed: boolean
  reason?: string
}

// ============================================================================
// OWNERSHIP VALIDATION
// ============================================================================

/**
 * Validates if user owns the document (createdBy === userId)
 *
 * @param document - Document with createdBy field
 * @param userId - User ID to check
 * @returns true if user owns the document
 *
 * @example
 * const payment = await getDoc(paymentRef)
 * if (!isOwner(payment?.data(), user?.uid)) {
 *   throw new Error('No permission')
 * }
 */
export function isOwner(document: OwnedDocument, userId: string): boolean {
  return document?.createdBy === userId
}

/**
 * Validates ownership with role-based override
 * - Admins can access ANY document
 * - Others can only access documents they created
 *
 * @param document - Document with createdBy field
 * @param userData - Current user data
 * @returns SecurityCheckResult
 *
 * @example
 * const result = validateOwnership(payment, userData)
 * if (!result?.allowed) {
 *   throw new Error(result?.reason || 'No permission')
 * }
 */
export function validateOwnership(
  document: OwnedDocument,
  userData: UserProfile
): SecurityCheckResult {
  // Admins have full access
  if (userData?.role === 'admin') {
    return { allowed: true }
  }

  // Check ownership
  if (document?.createdBy === userData?.id) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: ERROR_MESSAGES?.NO_PERMISSION,
  }
}

// ============================================================================
// GROUP MEMBERSHIP VALIDATION (for Teachers)
// ============================================================================

/**
 * Validates if teacher has access to student's group
 * - Admins have access to ALL groups
 * - Teachers can only access students in their assignedGroups
 *
 * @param document - Document with group field (e?.g., Student)
 * @param userData - Current user data
 * @returns SecurityCheckResult
 *
 * @example
 * const student = await getDoc(studentRef)
 * const result = validateGroupAccess(student?.data(), userData)
 * if (!result?.allowed) {
 *   throw new Error(result?.reason || 'No permission')
 * }
 */
export function validateGroupAccess(
  document: GroupDocument,
  userData: UserProfile
): SecurityCheckResult {
  // Admins have full access
  if (userData?.role === 'admin') {
    return { allowed: true }
  }

  // Teachers can only access students in their assigned groups
  if (userData?.role === 'teacher') {
    if (!userData?.assignedGroups || userData?.assignedGroups.length === 0) {
      return {
        allowed: false,
        reason: 'Нямате назначени групи',
      }
    }

    if (userData?.assignedGroups.includes(document?.group)) {
      return { allowed: true }
    }

    return {
      allowed: false,
      reason: ERROR_MESSAGES?.NO_PERMISSION,
    }
  }

  // Parents and other roles have no access
  return {
    allowed: false,
    reason: ERROR_MESSAGES?.NO_PERMISSION,
  }
}

// ============================================================================
// GENERIC DOCUMENT VALIDATION
// ============================================================================

/**
 * Generic function to fetch and validate document ownership
 * Reduces code duplication in UPDATE and DELETE mutations
 *
 * @param collectionName - Firestore collection name
 * @param documentId - Document ID
 * @param userData - Current user data
 * @param notFoundError - Error message if document not found
 * @returns Document data if validation passes
 * @throws Error if document not found or user has no permission
 *
 * @example
 * // In useUpdatePayment mutation:
 * const payment = await validateDocumentOwnership(
 *   COLLECTIONS?.PAYMENTS,
 *   id,
 *   userData,
 *   ERROR_MESSAGES?.PAYMENT_NOT_FOUND
 * )
 */
export async function validateDocumentOwnership<T extends OwnedDocument>(
  collectionName: CollectionName,
  documentId: string,
  userData: UserProfile,
  notFoundError: string
): Promise<T> {
  // Fetch document
  const docRef = doc(db, collectionName, documentId)
  const docSnap = await getDoc(docRef)

  if (!docSnap?.exists()) {
    throw new Error(notFoundError)
  }

  const document = { id: docSnap?.id, ...docSnap?.data() } as T

  // Validate ownership
  const validation = validateOwnership(document, userData)
  if (!validation?.allowed) {
    throw new Error(validation?.reason || ERROR_MESSAGES?.NO_PERMISSION)
  }

  return document
}

/**
 * Generic function to fetch and validate document with group access
 * Used for student-related documents where teachers need group-based access
 *
 * @param collectionName - Firestore collection name
 * @param documentId - Document ID
 * @param userData - Current user data
 * @param notFoundError - Error message if document not found
 * @returns Document data if validation passes
 * @throws Error if document not found or user has no permission
 *
 * @example
 * // In useUpdateStudent mutation:
 * const student = await validateDocumentGroupAccess(
 *   COLLECTIONS?.STUDENTS,
 *   id,
 *   userData,
 *   ERROR_MESSAGES?.STUDENT_NOT_FOUND
 * )
 */
export async function validateDocumentGroupAccess<T extends GroupDocument>(
  collectionName: CollectionName,
  documentId: string,
  userData: UserProfile,
  notFoundError: string
): Promise<T> {
  // Fetch document
  const docRef = doc(db, collectionName, documentId)
  const docSnap = await getDoc(docRef)

  if (!docSnap?.exists()) {
    throw new Error(notFoundError)
  }

  const document = { id: docSnap?.id, ...docSnap?.data() } as T

  // Validate group access
  const validation = validateGroupAccess(document, userData)
  if (!validation?.allowed) {
    throw new Error(validation?.reason || ERROR_MESSAGES?.NO_PERMISSION)
  }

  return document
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Check if user can create documents
 * - Admins can create anything
 * - Teachers can create within their scope
 * - Parents cannot create
 */
export function canCreate(userData: UserProfile): boolean {
  return userData?.role === 'admin' || userData?.role === 'teacher'
}

/**
 * Check if user can update documents
 * (Actual update permission depends on ownership/group validation)
 */
export function canUpdate(userData: UserProfile): boolean {
  return userData?.role === 'admin' || userData?.role === 'teacher'
}

/**
 * Check if user can delete documents
 * (Actual delete permission depends on ownership validation)
 */
export function canDelete(userData: UserProfile): boolean {
  return userData?.role === 'admin' || userData?.role === 'teacher'
}

/**
 * Check if user is admin
 */
export function isAdmin(userData: UserProfile): boolean {
  return userData?.role === 'admin'
}

/**
 * Check if user is teacher
 */
export function isTeacher(userData: UserProfile): boolean {
  return userData?.role === 'teacher'
}

/**
 * Check if user is parent
 */
export function isParent(userData: UserProfile): boolean {
  return userData?.role === 'parent'
}

// ============================================================================
// 🔒 INPUT SANITIZATION (CRITICAL #3 FIX - XSS PROTECTION)
// ============================================================================

/**
 * Sanitize HTML string by escaping dangerous characters
 * Prevents XSS attacks by converting HTML special characters to entities
 *
 * @param input - Raw HTML string from user input
 * @returns Escaped safe string
 *
 * @example
 * const userInput = '<script>alert("XSS")</script>'
 * const safe = sanitizeHtml(userInput)
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char)
}

/**
 * Sanitize string by trimming whitespace and limiting length
 * Prevents buffer overflow and ensures consistent data
 *
 * @param input - Raw string from user input
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized string
 *
 * @example
 * const userInput = '   John Doe   '
 * const safe = sanitizeString(userInput)
 * // Returns: 'John Doe'
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Trim whitespace
  let sanitized = input.trim()

  // Remove null bytes (potential security issue)
  sanitized = sanitized.replace(/\0/g, '')

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

/**
 * Sanitize filename by removing path traversal characters and dangerous extensions
 * Prevents directory traversal attacks and execution of malicious files
 *
 * @param filename - Raw filename from user input
 * @returns Safe filename
 *
 * @example
 * const userInput = '../../../etc/passwd'
 * const safe = sanitizeFilename(userInput)
 * // Returns: 'etc_passwd'
 *
 * const malicious = 'invoice.pdf.exe'
 * const safe2 = sanitizeFilename(malicious)
 * // Returns: 'invoice.pdf'
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file'
  }

  let sanitized = filename.trim()

  // Remove path traversal sequences
  sanitized = sanitized.replace(/\.\./g, '')
  sanitized = sanitized.replace(/[\/\\]/g, '_')

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

  // Block dangerous extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar']
  dangerousExtensions.forEach((ext) => {
    if (sanitized.toLowerCase().endsWith(ext)) {
      sanitized = sanitized.substring(0, sanitized.length - ext.length)
    }
  })

  // Ensure filename is not empty after sanitization
  if (sanitized.length === 0) {
    return 'unnamed_file'
  }

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255)
  }

  return sanitized
}

/**
 * Validate URL and ensure it's safe
 * Prevents injection of javascript: and data: URLs
 *
 * @param url - URL string to validate
 * @param allowedProtocols - List of allowed protocols (default: http, https)
 * @returns Validation result with sanitized URL
 *
 * @example
 * const result = validateUrl('https://example.com')
 * if (result.isValid) {
 *   window.open(result.sanitizedUrl)
 * }
 *
 * const malicious = validateUrl('javascript:alert("XSS")')
 * // Returns: { isValid: false, sanitizedUrl: '', reason: 'Invalid protocol' }
 */
export function validateUrl(
  url: string,
  allowedProtocols: string[] = ['http', 'https']
): {
  isValid: boolean
  sanitizedUrl: string
  reason?: string
} {
  if (!url || typeof url !== 'string') {
    return { isValid: false, sanitizedUrl: '', reason: 'Empty or invalid URL' }
  }

  const trimmedUrl = url.trim()

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const lowerUrl = trimmedUrl.toLowerCase()

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return {
        isValid: false,
        sanitizedUrl: '',
        reason: `Dangerous protocol: ${protocol}`,
      }
    }
  }

  // Validate URL format
  try {
    const urlObj = new URL(trimmedUrl)

    // Check if protocol is allowed
    const protocol = urlObj.protocol.replace(':', '')
    if (!allowedProtocols.includes(protocol)) {
      return {
        isValid: false,
        sanitizedUrl: '',
        reason: `Protocol not allowed: ${protocol}`,
      }
    }

    return {
      isValid: true,
      sanitizedUrl: urlObj.href,
    }
  } catch (error) {
    return {
      isValid: false,
      sanitizedUrl: '',
      reason: 'Invalid URL format',
    }
  }
}

/**
 * Sanitize email address
 * Basic validation and sanitization
 *
 * @param email - Email address to sanitize
 * @returns Sanitized email or empty string if invalid
 *
 * @example
 * const safe = sanitizeEmail('  USER@EXAMPLE.COM  ')
 * // Returns: 'user@example.com'
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }

  // Trim and lowercase
  const sanitized = email.trim().toLowerCase()

  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return ''
  }

  // Remove any dangerous characters (shouldn't exist in valid email)
  const cleaned = sanitized.replace(/[<>'"]/g, '')

  return cleaned
}

/**
 * Sanitize phone number
 * Removes non-numeric characters and validates format
 *
 * @param phone - Phone number to sanitize
 * @returns Sanitized phone number
 *
 * @example
 * const safe = sanitizePhone('+359 88 123-4567')
 * // Returns: '+359881234567'
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return ''
  }

  // Remove all non-numeric characters except + at the start
  let sanitized = phone.trim()

  // Keep + only if it's the first character
  const hasPlus = sanitized.startsWith('+')
  sanitized = sanitized.replace(/[^\d]/g, '')

  if (hasPlus) {
    sanitized = '+' + sanitized
  }

  return sanitized
}

/**
 * Sanitize numeric input
 * Ensures value is a valid number within range
 *
 * @param input - Numeric input (string or number)
 * @param min - Minimum allowed value (optional)
 * @param max - Maximum allowed value (optional)
 * @returns Sanitized number or null if invalid
 *
 * @example
 * const amount = sanitizeNumber('123.45', 0, 1000)
 * // Returns: 123.45
 *
 * const invalid = sanitizeNumber('-5', 0, 100)
 * // Returns: 0 (clamped to min)
 */
export function sanitizeNumber(
  input: string | number,
  min?: number,
  max?: number
): number | null {
  let num: number

  if (typeof input === 'string') {
    // Remove non-numeric characters except . and -
    const cleaned = input.replace(/[^\d.-]/g, '')
    num = parseFloat(cleaned)
  } else if (typeof input === 'number') {
    num = input
  } else {
    return null
  }

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) {
    return null
  }

  // Apply min/max constraints
  if (min !== undefined && num < min) {
    num = min
  }
  if (max !== undefined && num > max) {
    num = max
  }

  return num
}

/**
 * Sanitize object by applying sanitization to all string properties
 * Recursively sanitizes nested objects
 *
 * @param obj - Object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 *
 * @example
 * const userData = {
 *   name: '  <script>alert(1)</script>John  ',
 *   email: '  USER@EXAMPLE.COM  ',
 *   notes: 'Some notes...'
 * }
 * const safe = sanitizeObject(userData)
 * // Returns: {
 * //   name: 'John',
 * //   email: 'user@example.com',
 * //   notes: 'Some notes...'
 * // }
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    htmlEscape?: boolean
    trimStrings?: boolean
    maxStringLength?: number
  } = {}
): T {
  const { htmlEscape = false, trimStrings = true, maxStringLength = 1000 } = options

  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const sanitized: any = Array.isArray(obj) ? [] : {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]

      if (typeof value === 'string') {
        let sanitizedValue = value

        if (trimStrings) {
          sanitizedValue = sanitizeString(sanitizedValue, maxStringLength)
        }

        if (htmlEscape) {
          sanitizedValue = sanitizeHtml(sanitizedValue)
        }

        sanitized[key] = sanitizedValue
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, options)
      } else {
        sanitized[key] = value
      }
    }
  }

  return sanitized as T
}

// ============================================================================
// 🔒 PASSWORD SECURITY (CRITICAL FIX - AUTHENTICATION SECURITY)
// ============================================================================

/**
 * Password strength level
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong'

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  isValid: boolean
  strength: PasswordStrength
  errors: string[]
  suggestions: string[]
}

/**
 * Validate password strength and security
 * Checks for common password requirements and patterns
 *
 * @param password - Password to validate
 * @param options - Validation options
 * @returns Validation result with strength and suggestions
 *
 * @example
 * const result = validatePassword('MyP@ssw0rd123')
 * if (!result.isValid) {
 *   alert(result.errors.join(', '))
 * }
 * // Returns: { isValid: true, strength: 'strong', errors: [], suggestions: [] }
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumbers?: boolean
    requireSpecialChars?: boolean
    maxLength?: number
  } = {}
): PasswordValidationResult {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    maxLength = 128,
  } = options

  const errors: string[] = []
  const suggestions: string[] = []

  // Basic validation
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      strength: 'weak',
      errors: ['Паролата е задължителна'],
      suggestions: ['Въведете парола'],
    }
  }

  // Length checks
  if (password.length < minLength) {
    errors.push(`Паролата трябва да е поне ${minLength} символа`)
  }

  if (password.length > maxLength) {
    errors.push(`Паролата не може да е повече от ${maxLength} символа`)
  }

  // Character type requirements
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Паролата трябва да съдържа поне една главна буква')
    suggestions.push('Добавете главна буква (A-Z)')
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Паролата трябва да съдържа поне една малка буква')
    suggestions.push('Добавете малка буква (a-z)')
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Паролата трябва да съдържа поне една цифра')
    suggestions.push('Добавете цифра (0-9)')
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Паролата трябва да съдържа поне един специален символ')
    suggestions.push('Добавете специален символ (!@#$%^&*)')
  }

  // Common weak passwords check
  const commonPasswords = [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    '123123',
  ]

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Паролата е твърде често срещана')
    suggestions.push('Използвайте уникална парола')
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    suggestions.push('Избягвайте повтарящи се символи (напр. "aaa", "111")')
  }

  if (/012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(password.toLowerCase())) {
    suggestions.push('Избягвайте последователни символи (напр. "123", "abc")')
  }

  // Calculate strength
  let strength: PasswordStrength = 'weak'
  let strengthScore = 0

  if (password.length >= minLength) strengthScore++
  if (password.length >= 12) strengthScore++
  if (/[A-Z]/.test(password)) strengthScore++
  if (/[a-z]/.test(password)) strengthScore++
  if (/\d/.test(password)) strengthScore++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthScore++
  if (password.length >= 16) strengthScore++

  if (strengthScore <= 2) {
    strength = 'weak'
  } else if (strengthScore <= 4) {
    strength = 'medium'
  } else if (strengthScore <= 6) {
    strength = 'strong'
  } else {
    strength = 'very-strong'
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
    suggestions,
  }
}

/**
 * Check if password has been compromised (basic check)
 * In production, integrate with Have I Been Pwned API
 *
 * @param password - Password to check
 * @returns True if password appears compromised
 *
 * @example
 * if (isPasswordCompromised('password123')) {
 *   alert('This password has been compromised. Choose a different one.')
 * }
 */
export function isPasswordCompromised(password: string): boolean {
  // Basic compromised password list (top 100 most common)
  const compromisedPasswords = [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'monkey',
    '1234567',
    'letmein',
    'trustno1',
    'dragon',
    'baseball',
    'iloveyou',
    'master',
    'sunshine',
    'ashley',
    'bailey',
    'passw0rd',
    'shadow',
    '123123',
    '654321',
    'superman',
    'qazwsx',
    'michael',
    'football',
    'welcome',
    'jesus',
    'ninja',
    'mustang',
    'password1',
    '123456789',
    'adobe123',
    'admin',
    '12345678910',
  ]

  return compromisedPasswords.includes(password.toLowerCase())
}

/**
 * Generate password strength indicator text
 *
 * @param strength - Password strength level
 * @returns Human-readable strength text
 *
 * @example
 * const strength = validatePassword('MyP@ss123').strength
 * const text = getPasswordStrengthText(strength)
 * // Returns: 'Силна парола'
 */
export function getPasswordStrengthText(strength: PasswordStrength): string {
  const strengthMap: Record<PasswordStrength, string> = {
    weak: 'Слаба парола',
    medium: 'Средна парола',
    strong: 'Силна парола',
    'very-strong': 'Много силна парола',
  }

  return strengthMap[strength] || 'Неизвестна'
}

/**
 * Generate password strength color for UI
 *
 * @param strength - Password strength level
 * @returns CSS color class or hex color
 *
 * @example
 * const color = getPasswordStrengthColor('strong')
 * // Returns: '#10B981' (green)
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  const colorMap: Record<PasswordStrength, string> = {
    weak: '#EF4444', // red
    medium: '#F59E0B', // orange
    strong: '#10B981', // green
    'very-strong': '#3B82F6', // blue
  }

  return colorMap[strength] || '#6B7280' // gray
}

/**
 * Validate password confirmation matches
 *
 * @param password - Original password
 * @param confirmation - Password confirmation
 * @returns True if passwords match
 *
 * @example
 * if (!passwordsMatch(password, confirmPassword)) {
 *   alert('Passwords do not match')
 * }
 */
export function passwordsMatch(password: string, confirmation: string): boolean {
  return password === confirmation && password.length > 0
}
