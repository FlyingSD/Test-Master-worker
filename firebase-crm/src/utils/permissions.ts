import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types'

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Check if a user role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions?.some((permission) => hasPermission(role, permission))
}

/**
 * Check if a user role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions?.every((permission) => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if user is teacher (NOT including admin)
 * Use isTeacherOrAbove() if you want to include admin
 */
export function isTeacher(role: UserRole): boolean {
  return role === 'teacher'
}

/**
 * Check if user is teacher OR admin
 * Use this for features accessible by both teachers and admins
 */
export function isTeacherOrAbove(role: UserRole): boolean {
  return role === 'teacher' || role === 'admin'
}

/**
 * Check if user is parent
 */
export function isParent(role: UserRole): boolean {
  return role === 'parent'
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'Администратор',
    teacher: 'Учител',
    parent: 'Родител',
  }
  return roleNames[role]
}

/**
 * Get user role badge color
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-800',
    teacher: 'bg-blue-100 text-blue-800',
    parent: 'bg-green-100 text-green-800',
  }
  return colors[role]
}
