import { Timestamp } from 'firebase/firestore'
import { User, UserProfile, UserRole } from '@/types'

/**
 * Type Guards for Firebase CRM
 *
 * Provides runtime type checking for TypeScript types.
 * Helps prevent runtime errors and improves type safety.
 */

// ============================================================================
// Date/Timestamp Type Guards
// ============================================================================

/**
 * Check if value is a Firestore Timestamp
 *
 * @param value - Value to check
 * @returns True if value is a Firestore Timestamp
 *
 * @example
 * ```ts
 * if (isTimestamp(payment?.date)) {
 *   const jsDate = payment?.date.toDate()
 * }
 * ```
 */
export function isTimestamp(value: any): value is Timestamp {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'seconds' in value &&
    'nanoseconds' in value &&
    typeof value?.seconds === 'number' &&
    typeof value?.nanoseconds === 'number' &&
    typeof value?.toDate === 'function'
  )
}

/**
 * Check if value is a JavaScript Date object
 *
 * @param value - Value to check
 * @returns True if value is a Date
 *
 * @example
 * ```ts
 * if (isDate(student?.dateOfBirth)) {
 *   const age = calculateAge(student?.dateOfBirth)
 * }
 * ```
 */
export function isDate(value: any): value is Date {
  return value instanceof Date && !isNaN(value?.getTime())
}

/**
 * Check if value is either a Date or Timestamp
 *
 * @param value - Value to check
 * @returns True if value is a Date or Timestamp
 *
 * @example
 * ```ts
 * if (isDateOrTimestamp(payment?.date)) {
 *   const jsDate = toDate(payment?.date)
 * }
 * ```
 */
export function isDateOrTimestamp(value: any): value is Date | Timestamp {
  return isDate(value) || isTimestamp(value)
}

/**
 * Convert Date | Timestamp to JavaScript Date
 *
 * @param value - Date or Timestamp to convert
 * @returns JavaScript Date object
 *
 * @example
 * ```ts
 * const payment = { date: serverTimestamp() }
 * const jsDate = toDate(payment?.date) // Always returns Date
 * ```
 */
export function toDate(value: Date | Timestamp | null | undefined): Date {
  if (!value) {
    return new Date()
  }

  if (isTimestamp(value)) {
    return value?.toDate()
  }

  if (isDate(value)) {
    return value
  }

  // Fallback: try to create Date from value
  return new Date(value as any)
}

/**
 * Convert Date | Timestamp to Firestore Timestamp
 *
 * @param value - Date or Timestamp to convert
 * @returns Firestore Timestamp object
 *
 * @example
 * ```ts
 * const formData = { date: new Date() }
 * await updateDoc(docRef, { date: toTimestamp(formData?.date) })
 * ```
 */
export function toTimestamp(value: Date | Timestamp | null | undefined): Timestamp {
  if (!value) {
    return Timestamp.now()
  }

  if (isTimestamp(value)) {
    return value
  }

  if (isDate(value)) {
    return Timestamp.fromDate(value)
  }

  // Fallback: try to create Timestamp from value
  return Timestamp.fromDate(new Date(value as any))
}

// ============================================================================
// User Type Guards
// ============================================================================

/**
 * Valid user roles in the system
 */
const VALID_ROLES: UserRole[] = ['admin', 'teacher', 'parent']

/**
 * Check if value is a valid UserRole
 *
 * @param value - Value to check
 * @returns True if value is a valid UserRole
 *
 * @example
 * ```ts
 * if (isUserRole(userData?.role)) {
 *   // TypeScript knows userData.role is 'admin' | 'teacher' | 'parent'
 * }
 * ```
 */
export function isUserRole(value: any): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.includes(value as UserRole)
}

/**
 * Check if value is a User object
 *
 * @param value - Value to check
 * @returns True if value has all required User properties
 *
 * @example
 * ```ts
 * const data = await getDoc(docRef)
 * if (isUser(data)) {
 *   console.log(data?.name) // TypeScript knows all User properties exist
 * }
 * ```
 */
export function isUser(value: any): value is User {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    typeof value?.id === 'string' &&
    typeof value?.email === 'string' &&
    typeof value?.name === 'string' &&
    isUserRole(value?.role) &&
    (value?.phone === undefined || typeof value?.phone === 'string') &&
    (isDateOrTimestamp(value?.createdAt)) &&
    (value?.lastLogin === undefined || isDateOrTimestamp(value?.lastLogin))
  )
}

/**
 * Check if value is a UserProfile object (User with extended fields)
 *
 * @param value - Value to check
 * @returns True if value has all required UserProfile properties
 *
 * @example
 * ```ts
 * const user = await getUserProfile(userId)
 * if (isUserProfile(user)) {
 *   // Can access user?.assignedGroups, user?.studentIds
 *   if (user?.assignedGroups) {
 *     console.log('Teacher groups:', user?.assignedGroups)
 *   }
 * }
 * ```
 */
export function isUserProfile(value: any): value is UserProfile {
  return (
    isUser(value) &&
    typeof value?.isActive === 'boolean' &&
    (value?.assignedGroups === undefined || Array.isArray(value?.assignedGroups)) &&
    (value?.studentIds === undefined || Array.isArray(value?.studentIds))
  )
}

/**
 * Assert value is a User (throws error if not)
 *
 * @param value - Value to check
 * @param errorMessage - Custom error message
 * @throws Error if value is not a User
 *
 * @example
 * ```ts
 * function processUser(data: any) {
 *   assertIsUser(data, 'Invalid user data from API')
 *   // TypeScript now knows 'data' is User
 *   console.log(data?.name)
 * }
 * ```
 */
export function assertIsUser(value: any, errorMessage?: string): asserts value is User {
  if (!isUser(value)) {
    throw new Error(errorMessage || 'Value is not a valid User object')
  }
}

/**
 * Assert value is a UserProfile (throws error if not)
 *
 * @param value - Value to check
 * @param errorMessage - Custom error message
 * @throws Error if value is not a UserProfile
 *
 * @example
 * ```ts
 * function processProfile(data: any) {
 *   assertIsUserProfile(data, 'Invalid user profile from admin panel')
 *   // TypeScript now knows 'data' is UserProfile
 *   if (data?.assignedGroups) {
 *     console.log('Groups:', data?.assignedGroups)
 *   }
 * }
 * ```
 */
export function assertIsUserProfile(value: any, errorMessage?: string): asserts value is UserProfile {
  if (!isUserProfile(value)) {
    throw new Error(errorMessage || 'Value is not a valid UserProfile object')
  }
}

// ============================================================================
// Utility Type Guards
// ============================================================================

/**
 * Check if value is a non-empty string
 *
 * @param value - Value to check
 * @returns True if value is a non-empty string
 *
 * @example
 * ```ts
 * if (isNonEmptyString(student?.name)) {
 *   // Safe to use student.name
 * }
 * ```
 */
export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value?.trim().length > 0
}

/**
 * Check if value is a non-empty array
 *
 * @param value - Value to check
 * @returns True if value is a non-empty array
 *
 * @example
 * ```ts
 * if (isNonEmptyArray(parent?.studentIds)) {
 *   console.log('Parent has', parent?.studentIds.length, 'children')
 * }
 * ```
 */
export function isNonEmptyArray<T = any>(value: any): value is T[] {
  return Array.isArray(value) && value?.length > 0
}

/**
 * Check if value is null or undefined
 *
 * @param value - Value to check
 * @returns True if value is null or undefined
 *
 * @example
 * ```ts
 * if (isNullOrUndefined(student?.notes)) {
 *   student.notes = ''
 * }
 * ```
 */
export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Check if value exists (not null or undefined)
 *
 * @param value - Value to check
 * @returns True if value is not null or undefined
 *
 * @example
 * ```ts
 * const validStudents = students?.filter(isDefined)
 * // Now validStudents has type Student[] (not (Student | null | undefined)[])
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
