import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FeatureName, RoleFeaturePermissions, UserRole } from '@/types'

/**
 * Default feature permissions
 * These are used when settings don't exist in database yet
 */
const DEFAULT_PERMISSIONS: RoleFeaturePermissions = {
  teacher: {
    dashboard: true,
    students: true,
    groups: true, // Teachers see their groups
    homework: true,
    parents: true,
    payments: true,
    expenses: false, // Only admins by default
    inventory: true,
    attendance: true,
    events: true,
    discounts: true,
    reports: false, // Only admins by default
    errors: true,
    'my-children': false, // Not applicable for teachers
  },
  parent: {
    dashboard: true, // Parent dashboard
    students: false, // Parents don't manage all students
    groups: false, // Parents see groups in my-children
    homework: false, // Parents see homework in my-children
    parents: false, // Parents don't manage other parents
    payments: true, // Parents see their payments
    expenses: false, // Parents don't see expenses
    inventory: false, // Parents don't manage inventory
    attendance: false, // Parents see attendance in my-children
    events: true, // Parents can see events
    discounts: false, // Parents don't manage discounts
    reports: false, // Parents don't see financial reports
    errors: false, // Parents don't see error dashboard
    'my-children': true, // Main page for parents
  },
}

/**
 * Hook to check if a feature is enabled for current user's role
 */
export function useFeaturePermissions() {
  const [permissions, setPermissions] = useState<RoleFeaturePermissions>(DEFAULT_PERMISSIONS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      const docRef = doc(db, 'settings', 'system')
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        if (data.featurePermissions) {
          setPermissions(data.featurePermissions as RoleFeaturePermissions)
        }
      }
    } catch (error) {
      console.error('Error loading feature permissions:', error)
      // Keep default permissions on error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check if a feature is enabled for a specific role
   */
  const hasFeatureAccess = (feature: FeatureName, role: UserRole): boolean => {
    // Admins always have access to everything
    if (role === 'admin') return true

    // Check role-specific permissions
    if (role === 'teacher' || role === 'parent') {
      return permissions[role][feature] ?? false
    }

    return false
  }

  /**
   * Get all enabled features for a role
   */
  const getEnabledFeatures = (role: UserRole): FeatureName[] => {
    if (role === 'admin') {
      // Admins have access to all features
      return Object.keys(DEFAULT_PERMISSIONS.teacher) as FeatureName[]
    }

    if (role === 'teacher' || role === 'parent') {
      return Object.entries(permissions[role])
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature as FeatureName)
    }

    return []
  }

  return {
    permissions,
    loading,
    hasFeatureAccess,
    getEnabledFeatures,
    reload: loadPermissions,
  }
}
