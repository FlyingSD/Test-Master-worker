/**
 * 🔔 useNotifications Hook
 *
 * Provides notification count for parents based on:
 * - Overdue homework
 * - Critical homework (due today or tomorrow)
 * - Overdue payments
 *
 * @module hooks/useNotifications
 */

import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { useStudentsByParent } from './useStudents'
import { useHomework } from './useHomework'
import { getDueDateStatus } from '@/utils/date'

export interface NotificationCounts {
  total: number
  overdueHomework: number
  criticalHomework: number
  overduePayments: number
  hasNotifications: boolean
}

/**
 * Get notification counts for parent users
 * Counts urgent items that need attention
 *
 * @returns Notification counts object
 *
 * @example
 * const { total, hasNotifications } = useNotifications()
 * {hasNotifications && <Badge>{total}</Badge>}
 */
export function useNotifications(): NotificationCounts {
  const { user, isParent } = useAuth()
  const { students } = useStudentsByParent(user?.uid || '')
  const { homework } = useHomework()

  const counts = useMemo(() => {
    if (!isParent || !user) {
      return {
        total: 0,
        overdueHomework: 0,
        criticalHomework: 0,
        overduePayments: 0,
        hasNotifications: false,
      }
    }

    // Get student IDs for this parent
    const studentIds = students?.map(s => s?.id)

    // Filter homework for parent's children
    const parentHomework = homework?.filter(hw =>
      studentIds?.includes(hw?.studentId) && hw?.status === 'assigned'
    )

    // Count overdue homework
    const overdueHomework = parentHomework?.filter(hw => {
      const status = getDueDateStatus(hw?.dueDate)
      return status?.status === 'overdue'
    }).length

    // Count critical homework (today or tomorrow)
    const criticalHomework = parentHomework?.filter(hw => {
      const status = getDueDateStatus(hw?.dueDate)
      return status?.status === 'critical'
    }).length

    // Count overdue payments
    const today = new Date()
    today?.setHours(0, 0, 0, 0)

    const overduePayments = students?.filter(student => {
      if (!student?.dueDate) return false
      const dueDate = student?.dueDate instanceof Date
        ? student?.dueDate
        : student?.dueDate?.toDate?.()

      if (!dueDate) return false

      const dueDateOnly = new Date(dueDate)
      dueDateOnly?.setHours(0, 0, 0, 0)

      return dueDateOnly < today
    }).length

    const total = overdueHomework + criticalHomework + overduePayments

    return {
      total,
      overdueHomework,
      criticalHomework,
      overduePayments,
      hasNotifications: total > 0,
    }
  }, [isParent, user, students, homework])

  return counts
}
