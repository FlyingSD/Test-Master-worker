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
