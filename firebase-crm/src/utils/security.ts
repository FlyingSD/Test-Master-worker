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
