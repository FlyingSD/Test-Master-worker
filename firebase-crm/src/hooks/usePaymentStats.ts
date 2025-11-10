import { useMemo } from 'react'
import { Payment } from '@/types'
import { usePayments } from './usePayments'

/**
 * 🎯 SoC (Separation of Concerns) - Payment Statistics Hook
 *
 * Moves business logic from UI components to reusable hooks.
 * Eliminates duplicated revenue calculation code across multiple pages.
 *
 * @example
 * const { totalRevenue, monthRevenue, yearRevenue, averagePayment } = usePaymentStats()
 */
export function usePaymentStats() {
  const { payments, loading } = usePayments()

  // Total revenue (all time)
  const totalRevenue = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  )

  // Revenue for current month
  const monthRevenue = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return payments
      .filter((p) => {
        const paymentDate = p.date instanceof Date ? p.date : p.date.toDate()
        return (
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }, [payments])

  // Revenue for current year
  const yearRevenue = useMemo(() => {
    const currentYear = new Date().getFullYear()

    return payments
      .filter((p) => {
        const paymentDate = p.date instanceof Date ? p.date : p.date.toDate()
        return paymentDate.getFullYear() === currentYear
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }, [payments])

  // Average payment amount
  const averagePayment = useMemo(
    () => (payments.length > 0 ? totalRevenue / payments.length : 0),
    [totalRevenue, payments.length]
  )

  // Payments count by month (last 12 months)
  const monthlyPaymentCounts = useMemo(() => {
    const now = new Date()
    const last12Months: { month: string; count: number; total: number }[] = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('bg-BG', { month: 'short', year: 'numeric' })

      const monthPayments = payments.filter((p) => {
        const paymentDate = p.date instanceof Date ? p.date : p.date.toDate()
        return (
          paymentDate.getMonth() === date.getMonth() &&
          paymentDate.getFullYear() === date.getFullYear()
        )
      })

      last12Months.push({
        month: monthName,
        count: monthPayments.length,
        total: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      })
    }

    return last12Months
  }, [payments])

  // Recent payments (last 10)
  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : a.date.toDate()
          const dateB = b.date instanceof Date ? b.date : b.date.toDate()
          return dateB.getTime() - dateA.getTime()
        })
        .slice(0, 10),
    [payments]
  )

  // Payment methods breakdown
  const paymentMethodBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; total: number }> = {}

    payments.forEach((p) => {
      if (!breakdown[p.method]) {
        breakdown[p.method] = { count: 0, total: 0 }
      }
      breakdown[p.method].count++
      breakdown[p.method].total += p.amount
    })

    return breakdown
  }, [payments])

  return {
    totalRevenue,
    monthRevenue,
    yearRevenue,
    averagePayment,
    monthlyPaymentCounts,
    recentPayments,
    paymentMethodBreakdown,
    loading,
    totalPayments: payments.length,
  }
}

/**
 * 🎯 SoC - Payment Statistics for Specific Student
 *
 * @param studentId - ID of the student
 */
export function useStudentPaymentStats(studentId: string) {
  const { payments, loading } = usePayments()

  const studentPayments = useMemo(
    () => payments.filter((p) => p.studentId === studentId),
    [payments, studentId]
  )

  const totalPaid = useMemo(
    () => studentPayments.reduce((sum, p) => sum + p.amount, 0),
    [studentPayments]
  )

  const lastPayment = useMemo(() => {
    if (studentPayments.length === 0) return null

    return [...studentPayments].sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : a.date.toDate()
      const dateB = b.date instanceof Date ? b.date : b.date.toDate()
      return dateB.getTime() - dateA.getTime()
    })[0]
  }, [studentPayments])

  return {
    studentPayments,
    totalPaid,
    lastPayment,
    paymentCount: studentPayments.length,
    loading,
  }
}
