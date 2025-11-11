import { describe, it, expect } from 'vitest'
import {
  isAdmin,
  isTeacher,
  isParent,
  getRoleDisplayName,
  getRoleBadgeColor,
  canAccessRoute,
} from './permissions'

describe('permissions utils', () => {
  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      const user = { role: 'admin' } as any
      expect(isAdmin(user)).toBe(true)
    })

    it('should return false for non-admin roles', () => {
      expect(isAdmin({ role: 'teacher' } as any)).toBe(false)
      expect(isAdmin({ role: 'parent' } as any)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(isAdmin(null as any)).toBe(false)
      expect(isAdmin(undefined as any)).toBe(false)
    })
  })

  describe('isTeacher', () => {
    it('should return true for teacher role', () => {
      const user = { role: 'teacher' } as any
      expect(isTeacher(user)).toBe(true)
    })

    it('should return false for non-teacher roles', () => {
      expect(isTeacher({ role: 'admin' } as any)).toBe(false)
      expect(isTeacher({ role: 'parent' } as any)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(isTeacher(null as any)).toBe(false)
    })
  })

  describe('isParent', () => {
    it('should return true for parent role', () => {
      const user = { role: 'parent' } as any
      expect(isParent(user)).toBe(true)
    })

    it('should return false for non-parent roles', () => {
      expect(isParent({ role: 'admin' } as any)).toBe(false)
      expect(isParent({ role: 'teacher' } as any)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(isParent(null as any)).toBe(false)
    })
  })

  describe('getRoleDisplayName', () => {
    it('should return correct display names', () => {
      expect(getRoleDisplayName('admin')).toBe('Администратор')
      expect(getRoleDisplayName('teacher')).toBe('Учител')
      expect(getRoleDisplayName('parent')).toBe('Родител')
    })

    it('should return role itself for unknown roles', () => {
      expect(getRoleDisplayName('unknown' as any)).toBe('Unknown')
    })

    it('should handle null/undefined', () => {
      expect(getRoleDisplayName(null as any)).toBe('')
      expect(getRoleDisplayName(undefined as any)).toBe('')
    })
  })

  describe('getRoleBadgeColor', () => {
    it('should return correct badge colors', () => {
      expect(getRoleBadgeColor('admin')).toBe('badge-error') // Red
      expect(getRoleBadgeColor('teacher')).toBe('badge-primary') // Blue
      expect(getRoleBadgeColor('parent')).toBe('badge-success') // Green
    })

    it('should return default color for unknown roles', () => {
      expect(getRoleBadgeColor('unknown' as any)).toBe('badge-ghost')
    })
  })

  describe('canAccessRoute', () => {
    it('should allow admin to access all routes', () => {
      const admin = { role: 'admin' } as any
      expect(canAccessRoute('/admin', admin)).toBe(true)
      expect(canAccessRoute('/students', admin)).toBe(true)
      expect(canAccessRoute('/my-children', admin)).toBe(true)
    })

    it('should allow teacher to access teacher routes', () => {
      const teacher = { role: 'teacher' } as any
      expect(canAccessRoute('/students', teacher)).toBe(true)
      expect(canAccessRoute('/groups', teacher)).toBe(true)
      expect(canAccessRoute('/payments', teacher)).toBe(true)
    })

    it('should deny teacher access to admin routes', () => {
      const teacher = { role: 'teacher' } as any
      expect(canAccessRoute('/admin', teacher)).toBe(false)
      expect(canAccessRoute('/settings', teacher)).toBe(false)
    })

    it('should allow parent to access parent routes', () => {
      const parent = { role: 'parent' } as any
      expect(canAccessRoute('/my-children', parent)).toBe(true)
      expect(canAccessRoute('/payments', parent)).toBe(true)
    })

    it('should deny parent access to admin/teacher routes', () => {
      const parent = { role: 'parent' } as any
      expect(canAccessRoute('/admin', parent)).toBe(false)
      expect(canAccessRoute('/students', parent)).toBe(false)
      expect(canAccessRoute('/groups', parent)).toBe(false)
    })

    it('should allow everyone to access dashboard', () => {
      expect(canAccessRoute('/', { role: 'admin' } as any)).toBe(true)
      expect(canAccessRoute('/', { role: 'teacher' } as any)).toBe(true)
      expect(canAccessRoute('/', { role: 'parent' } as any)).toBe(true)
    })
  })
})
