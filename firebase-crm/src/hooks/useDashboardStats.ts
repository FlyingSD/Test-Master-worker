import { useMemo } from 'react'
import { usePayments } from './usePayments'
import { useExpenses } from './useExpenses'
import { useStudents } from './useStudents'
import { DashboardStats } from '@/types'

/**
 * 🎯 SoC (Separation of Concerns) - Dashboard Statistics Hook
 *
 * Centralizes all dashboard business logic calculations.
 * Moves financial calculations from DashboardPage component to reusable hook.
 *
 * @example
 * const stats = useDashboardStats()
 * console.log(stats.profit) // totalRevenue - totalExpenses
 */
export function useDashboardStats(): DashboardStats & { loading: boolean } {
  const { payments, loading: paymentsLoading } = usePayments()
  const { expenses, loading: expensesLoading } = useExpenses()
  const { students, loading: studentsLoading } = useStudents()

  const loading = paymentsLoading || expensesLoading || studentsLoading

  // Total revenue (all payments)
  const totalRevenue = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  )

  // Total expenses
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )

  // Profit = Revenue - Expenses
  const profit = useMemo(
    () => totalRevenue - totalExpenses,
    [totalRevenue, totalExpenses]
  )

  // Active students count
  const activeStudents = useMemo(
    () => students.filter((s) => s.status === 'active').length,
    [students]
  )

  // Total students count
  const totalStudents = students.length

  // Overdue payments (students whose dueDate has passed)
  const overduePayments = useMemo(() => {
    const now = new Date()
    return students.filter((s) => {
      if (s.status !== 'active') return false

      const dueDate = s.dueDate instanceof Date ? s.dueDate : s.dueDate.toDate()
      return dueDate < now
    }).length
  }, [students])

  // Upcoming payments (due in next 7 days)
  const upcomingPayments = useMemo(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return students.filter((s) => {
      if (s.status !== 'active') return false

      const dueDate = s.dueDate instanceof Date ? s.dueDate : s.dueDate.toDate()
      return dueDate >= now && dueDate <= nextWeek
    }).length
  }, [students])

  // Today's classes (would need events data - returning 0 for now)
  // TODO: Implement when events hook is available
  const todayClasses = 0

  return {
    totalRevenue,
    totalExpenses,
    profit,
    activeStudents,
    totalStudents,
    overduePayments,
    upcomingPayments,
    todayClasses,
    loading,
  }
}

/**
 * 🎯 SoC - Monthly Revenue Comparison
 *
 * Compares current month revenue to previous month.
 */
export function useMonthlyRevenueComparison() {
  const { payments } = usePayments()

  const comparison = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Previous month calculation (handling year boundary)
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // Current month revenue
    const currentMonthRevenue = payments
      .filter((p) => {
        const paymentDate = p.date instanceof Date ? p.date : p.date.toDate()
        return (
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, p) => sum + p.amount, 0)

    // Previous month revenue
    const previousMonthRevenue = payments
      .filter((p) => {
        const paymentDate = p.date instanceof Date ? p.date : p.date.toDate()
        return (
          paymentDate.getMonth() === prevMonth &&
          paymentDate.getFullYear() === prevYear
        )
      })
      .reduce((sum, p) => sum + p.amount, 0)

    // Calculate percentage change
    const percentageChange =
      previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0

    return {
      currentMonthRevenue,
      previousMonthRevenue,
      difference: currentMonthRevenue - previousMonthRevenue,
      percentageChange,
      isIncrease: currentMonthRevenue > previousMonthRevenue,
    }
  }, [payments])

  return comparison
}

/**
 * 🎯 SoC - Financial Health Indicator
 *
 * Provides financial health metrics for the business.
 */
export function useFinancialHealth() {
  const { totalRevenue, totalExpenses, profit } = useDashboardStats()

  const healthMetrics = useMemo(() => {
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0

    let healthStatus: 'excellent' | 'good' | 'warning' | 'critical'
    if (profitMargin >= 30) healthStatus = 'excellent'
    else if (profitMargin >= 15) healthStatus = 'good'
    else if (profitMargin >= 0) healthStatus = 'warning'
    else healthStatus = 'critical'

    return {
      profitMargin,
      expenseRatio,
      healthStatus,
      isProfitable: profit > 0,
    }
  }, [totalRevenue, totalExpenses, profit])

  return healthMetrics
}
