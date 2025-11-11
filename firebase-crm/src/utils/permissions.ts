import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types'

/**
 * Check if a user role has a specific permission
 *
 * @param role - User role to check
 * @param permission - Permission to verify
 * @returns true if role has the permission
 *
 * @example
 * ```ts
 * if (hasPermission(user.role, 'students:delete')) {
 *   // Show delete button
 * }
 * ```
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Check if a user role has ANY of the specified permissions
 * Returns true if at least one permission matches
 *
 * @param role - User role to check
 * @param permissions - Array of permissions to verify
 * @returns true if role has at least one permission
 *
 * @example
 * ```ts
 * if (hasAnyPermission(user.role, ['students:edit', 'students:view'])) {
 *   // User can edit OR view students
 * }
 * ```
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions?.some((permission) => hasPermission(role, permission))
}

/**
 * Check if a user role has ALL of the specified permissions
 * Returns true only if all permissions match
 *
 * @param role - User role to check
 * @param permissions - Array of permissions to verify
 * @returns true if role has all permissions
 *
 * @example
 * ```ts
 * if (hasAllPermissions(user.role, ['payments:create', 'payments:view'])) {
 *   // User can both create AND view payments
 * }
 * ```
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions?.every((permission) => hasPermission(role, permission))
}

/**
 * Get all permissions for a specific role
 *
 * @param role - User role
 * @returns Array of all permissions for that role
 *
 * @example
 * ```ts
 * const adminPerms = getRolePermissions('admin')
 * console.log(adminPerms) // ['students:create', 'students:edit', ...]
 * ```
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if user role is admin
 *
 * @param role - User role to check
 * @returns true if role is 'admin'
 *
 * @example
 * ```ts
 * if (isAdmin(user.role)) {
 *   // Show admin panel
 * }
 * ```
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if user role is teacher (NOT including admin)
 * Use isTeacherOrAbove() if you want to include admin
 *
 * @param role - User role to check
 * @returns true if role is exactly 'teacher'
 *
 * @example
 * ```ts
 * if (isTeacher(user.role)) {
 *   // Show features for teachers only (not admins)
 * }
 * ```
 */
export function isTeacher(role: UserRole): boolean {
  return role === 'teacher'
}

/**
 * Check if user role is teacher OR admin
 * Use this for features accessible by both teachers and admins
 *
 * @param role - User role to check
 * @returns true if role is 'teacher' or 'admin'
 *
 * @example
 * ```ts
 * if (isTeacherOrAbove(user.role)) {
 *   // Show groups management (accessible by teachers and admins)
 * }
 * ```
 */
export function isTeacherOrAbove(role: UserRole): boolean {
  return role === 'teacher' || role === 'admin'
}

/**
 * Check if user role is parent
 *
 * @param role - User role to check
 * @returns true if role is 'parent'
 *
 * @example
 * ```ts
 * if (isParent(user.role)) {
 *   // Show "My Children" page
 * }
 * ```
 */
export function isParent(role: UserRole): boolean {
  return role === 'parent'
}

/**
 * Get localized display name for user role
 *
 * @param role - User role
 * @returns Bulgarian display name for the role
 *
 * @example
 * ```tsx
 * <Badge>{getRoleDisplayName(user.role)}</Badge>
 * // Renders: "Администратор", "Учител", or "Родител"
 * ```
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
 * Get Tailwind CSS classes for role badge styling
 *
 * @param role - User role
 * @returns Tailwind CSS classes for badge background and text color
 *
 * @example
 * ```tsx
 * <span className={`px-2 py-1 rounded ${getRoleBadgeColor(user.role)}`}>
 *   {getRoleDisplayName(user.role)}
 * </span>
 * ```
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-800',
    teacher: 'bg-blue-100 text-blue-800',
    parent: 'bg-green-100 text-green-800',
  }
  return colors[role]
}
