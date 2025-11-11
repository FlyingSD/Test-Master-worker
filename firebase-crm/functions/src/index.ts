/**
 * 🔒 Firebase Cloud Functions for Custom Claims (CRITICAL #1 FIX)
 *
 * Implements Firebase Auth custom claims to:
 * - Avoid getUserData() Firestore reads in security rules (DoS vulnerability)
 * - Store user roles in JWT tokens for instant validation
 * - Improve performance and security
 *
 * Functions:
 * - onUserCreate: Sets initial custom claims when user is created
 * - setUserRole: Admin callable function to update user roles
 *
 * @security Custom claims are signed by Firebase and cannot be tampered with
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = 'admin' | 'teacher' | 'parent'

export interface CustomClaims {
  role: UserRole
  groups?: string[] // For teachers: assigned groups
  studentIds?: string[] // For parents: linked students
}

export interface SetUserRoleRequest {
  userId: string
  role: UserRole
  groups?: string[]
  studentIds?: string[]
}

// ============================================================================
// ON USER CREATE - Set Initial Custom Claims
// ============================================================================

/**
 * Cloud Function triggered when a new user is created
 * Sets initial custom claims based on user document
 *
 * @security Only runs after Firestore user document is created
 */
export const onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId
    const userData = snap.data()

    try {
      // Extract role and metadata from user document
      const role: UserRole = userData?.role || 'parent'
      const groups: string[] = userData?.assignedGroups || userData?.groups || []
      const studentIds: string[] = userData?.studentIds || []

      // Set custom claims
      const customClaims: CustomClaims = {
        role,
        ...(groups.length > 0 && { groups }),
        ...(studentIds.length > 0 && { studentIds }),
      }

      await admin.auth().setCustomUserClaims(userId, customClaims)

      functions.logger.info(`Custom claims set for user ${userId}:`, customClaims)

      // Update user document to trigger token refresh
      await snap.ref.update({
        customClaimsSet: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } catch (error) {
      functions.logger.error(`Error setting custom claims for user ${userId}:`, error)
      throw error
    }
  })

// ============================================================================
// ON USER UPDATE - Update Custom Claims
// ============================================================================

/**
 * Cloud Function triggered when user document is updated
 * Updates custom claims if role/groups/studentIds changed
 *
 * @security Ensures custom claims stay in sync with Firestore
 */
export const onUserUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId
    const beforeData = change.before.data()
    const afterData = change.after.data()

    // Check if role, groups, or studentIds changed
    const roleChanged = beforeData?.role !== afterData?.role
    const groupsChanged = JSON.stringify(beforeData?.assignedGroups) !== JSON.stringify(afterData?.assignedGroups)
    const studentIdsChanged = JSON.stringify(beforeData?.studentIds) !== JSON.stringify(afterData?.studentIds)

    if (!roleChanged && !groupsChanged && !studentIdsChanged) {
      return null
    }

    try {
      const role: UserRole = afterData?.role || 'parent'
      const groups: string[] = afterData?.assignedGroups || afterData?.groups || []
      const studentIds: string[] = afterData?.studentIds || []

      const customClaims: CustomClaims = {
        role,
        ...(groups.length > 0 && { groups }),
        ...(studentIds.length > 0 && { studentIds }),
      }

      await admin.auth().setCustomUserClaims(userId, customClaims)

      functions.logger.info(`Custom claims updated for user ${userId}:`, customClaims)

      // Update timestamp to trigger client token refresh
      await change.after.ref.update({
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } catch (error) {
      functions.logger.error(`Error updating custom claims for user ${userId}:`, error)
      throw error
    }

    return null
  })

// ============================================================================
// CALLABLE FUNCTION - Set User Role (Admin Only)
// ============================================================================

/**
 * Callable Cloud Function to set user role and custom claims
 * Can only be called by admins
 *
 * @param data - {userId, role, groups?, studentIds?}
 * @returns {success: boolean, message: string}
 *
 * @security Validates caller is admin before allowing role changes
 *
 * @example
 * ```typescript
 * const setUserRole = httpsCallable(functions, 'setUserRole')
 * await setUserRole({
 *   userId: 'abc123',
 *   role: 'teacher',
 *   groups: ['Group 1', 'Group 2']
 * })
 * ```
 */
export const setUserRole = functions.https.onCall(async (data: SetUserRoleRequest, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to set roles'
    )
  }

  // Check if caller is admin
  const callerToken = context.auth.token
  if (callerToken?.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set user roles'
    )
  }

  // Validate request data
  if (!data?.userId || !data?.role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId and role are required'
    )
  }

  const validRoles: UserRole[] = ['admin', 'teacher', 'parent']
  if (!validRoles.includes(data?.role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid role. Must be one of: ${validRoles.join(', ')}`
    )
  }

  try {
    const { userId, role, groups = [], studentIds = [] } = data

    // Set custom claims in Auth
    const customClaims: CustomClaims = {
      role,
      ...(groups.length > 0 && { groups }),
      ...(studentIds.length > 0 && { studentIds }),
    }

    await admin.auth().setCustomUserClaims(userId, customClaims)

    // Update Firestore user document
    await admin.firestore().collection('users').doc(userId).update({
      role,
      ...(groups.length > 0 && { assignedGroups: groups }),
      ...(studentIds.length > 0 && { studentIds }),
      customClaimsSet: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    functions.logger.info(`Role set for user ${userId} by ${context.auth.uid}:`, customClaims)

    return {
      success: true,
      message: `Role '${role}' successfully set for user ${userId}`,
    }
  } catch (error) {
    functions.logger.error(`Error setting role for user ${data?.userId}:`, error)

    throw new functions.https.HttpsError(
      'internal',
      `Failed to set role: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
})

// ============================================================================
// CALLABLE FUNCTION - Refresh Custom Claims (User Self-Service)
// ============================================================================

/**
 * Callable function for users to refresh their own custom claims
 * Useful after admin changes their role/permissions
 *
 * @returns {success: boolean, claims: CustomClaims}
 */
export const refreshCustomClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    )
  }

  const userId = context.auth.uid

  try {
    // Fetch latest user data from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get()

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User document not found'
      )
    }

    const userData = userDoc.data()!
    const role: UserRole = userData?.role || 'parent'
    const groups: string[] = userData?.assignedGroups || userData?.groups || []
    const studentIds: string[] = userData?.studentIds || []

    // Update custom claims
    const customClaims: CustomClaims = {
      role,
      ...(groups.length > 0 && { groups }),
      ...(studentIds.length > 0 && { studentIds }),
    }

    await admin.auth().setCustomUserClaims(userId, customClaims)

    functions.logger.info(`Custom claims refreshed for user ${userId}`)

    return {
      success: true,
      claims: customClaims,
      message: 'Custom claims refreshed. Please sign out and sign in again to apply changes.',
    }
  } catch (error) {
    functions.logger.error(`Error refreshing claims for user ${userId}:`, error)

    throw new functions.https.HttpsError(
      'internal',
      `Failed to refresh claims: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
})
