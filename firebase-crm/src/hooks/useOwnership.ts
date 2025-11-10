import { useAuth } from './useAuth'
import { useStudentsByParent } from './useStudents'
import { Payment, Student, Homework } from '@/types'

/**
 * 🔒 SECURITY: Ownership validation hooks
 *
 * CRITICAL FIX: Prevents users from modifying/deleting data that doesn't belong to them
 *
 * Examples:
 * - Teacher cannot delete admin's payments
 * - Parent cannot access other parents' children
 * - Parent cannot modify homework for other children
 */

/**
 * Check if current user owns/can modify a payment
 */
export function useCanModifyPayment(payment?: Payment): boolean {
  const { userData, isAdmin } = useAuth()

  if (!userData || !payment) return false

  // Admins can modify anything
  if (isAdmin) return true

  // Teachers can modify payments they created
  if (userData.role === 'teacher') {
    return payment.createdBy === userData.id
  }

  // Parents cannot modify payments
  return false
}

/**
 * Check if current user can view a payment
 */
export function useCanViewPayment(payment?: Payment): boolean {
  const { user, userData, isParent } = useAuth()
  const { students: myChildren } = useStudentsByParent(user?.uid || '')

  if (!userData || !payment) return false

  // Admins and teachers can view all payments
  if (userData.role === 'admin' || userData.role === 'teacher') {
    return true
  }

  // Parents can only view payments for their children
  if (isParent) {
    return myChildren.some(child => child.id === payment.studentId)
  }

  return false
}

/**
 * Check if current user can modify a student
 * 🔒 SECURITY FIX: Now validates teacher's assigned groups
 */
export function useCanModifyStudent(student?: Student): boolean {
  const { userData, isAdmin } = useAuth()

  if (!userData || !student) return false

  // Admins can modify anything
  if (isAdmin) return true

  // Teachers can modify students ONLY in their assigned groups
  if (userData.role === 'teacher') {
    // Check if teacher has assigned groups and student is in one of them
    if (userData.assignedGroups && userData.assignedGroups.length > 0) {
      return userData.assignedGroups.includes(student.group)
    }
    // If teacher has no assigned groups, they can't modify any students
    return false
  }

  // Parents cannot modify students
  return false
}

/**
 * Check if current user can view a student
 * 🔒 SECURITY FIX: Now validates teacher's assigned groups
 */
export function useCanViewStudent(student?: Student): boolean {
  const { user, userData, isParent, isAdmin } = useAuth()

  if (!userData || !student) return false

  // Admins can view all students
  if (isAdmin) return true

  // Teachers can view students ONLY in their assigned groups
  if (userData.role === 'teacher') {
    if (userData.assignedGroups && userData.assignedGroups.length > 0) {
      return userData.assignedGroups.includes(student.group)
    }
    return false
  }

  // Parents can only view their own children
  if (isParent && user) {
    return student.parentId === user.uid
  }

  return false
}

/**
 * Check if current user can modify homework
 */
export function useCanModifyHomework(homework?: Homework): boolean {
  const { userData, isAdmin } = useAuth()

  if (!userData || !homework) return false

  // Admins can modify anything
  if (isAdmin) return true

  // Teachers can modify homework they created
  if (userData.role === 'teacher') {
    return homework.createdBy === userData.id
  }

  // Parents cannot modify homework
  return false
}

/**
 * Check if current user can view homework
 */
export function useCanViewHomework(homework?: Homework): boolean {
  const { user, userData, isParent } = useAuth()
  const { students: myChildren } = useStudentsByParent(user?.uid || '')

  if (!userData || !homework) return false

  // Admins and teachers can view all homework
  if (userData.role === 'admin' || userData.role === 'teacher') {
    return true
  }

  // Parents can view homework for their children only
  if (isParent) {
    return myChildren.some(child => child.id === homework.studentId)
  }

  return false
}

/**
 * Generic ownership checker
 * Checks if entity.createdBy matches current user OR if user is admin
 */
export function useCanModifyEntity(entity?: { createdBy?: string }): boolean {
  const { userData, isAdmin } = useAuth()

  if (!userData || !entity) return false

  // Admins can modify anything
  if (isAdmin) return true

  // Check if user created this entity
  return entity.createdBy === userData.id
}

/**
 * Hook to get all ownership permissions for current user
 * Useful for bulk operations
 */
export function useOwnershipPermissions() {
  const { userData, isAdmin, isTeacher, isParent } = useAuth()

  return {
    // Role-based permissions
    isAdmin,
    isTeacher,
    isParent,

    // General permissions
    canModifyAny: isAdmin,
    canViewAll: isAdmin || isTeacher,
    needsOwnershipCheck: isTeacher || isParent,

    // Specific permissions
    canManageUsers: isAdmin,
    canManageSettings: isAdmin,
    canViewReports: isAdmin,
    canViewExpenses: isAdmin,
    canManageInventory: isAdmin,
    canSellInventory: isAdmin || isTeacher,
    canCreateInvoices: isAdmin || isTeacher,
    canEditInvoices: isAdmin,
  }
}
