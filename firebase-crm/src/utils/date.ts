/**
 * 🎯 Date Utilities
 *
 * Centralized date manipulation and conversion utilities.
 * Eliminates code duplication for common date operations.
 *
 * @module utils/date
 */

import { Timestamp } from 'firebase/firestore'
import { DATE_TIME } from '@/constants/appConstants'

/**
 * Converts JavaScript Date to Firestore Timestamp
 * Handles both Date objects and already-converted Timestamps
 *
 * @param date - Date or Timestamp to convert
 * @returns Firestore Timestamp
 *
 * @example
 * const data = {
 *   dueDate: toTimestamp(formValues.dueDate),
 *   createdAt: serverTimestamp()
 * }
 */
export function toTimestamp(date: Date | Timestamp): Timestamp {
  if (date instanceof Date) {
    return Timestamp.fromDate(date)
  }
  return date
}

/**
 * Converts Firestore Timestamp to JavaScript Date
 *
 * @param timestamp - Firestore Timestamp
 * @returns JavaScript Date
 *
 * @example
 * const dueDate = toDate(student.dueDate)
 * console.log(dueDate.toLocaleDateString())
 */
export function toDate(timestamp: Date | Timestamp): Date {
  if (timestamp instanceof Date) {
    return timestamp
  }
  return timestamp.toDate()
}

/**
 * Converts all Date fields in an object to Firestore Timestamps
 * Useful for form data before saving to Firestore
 *
 * @param obj - Object with potential Date fields
 * @param dateFields - Array of field names that should be converted
 * @returns Object with converted Timestamps
 *
 * @example
 * const formData = { name: 'John', dueDate: new Date(), createdAt: new Date() }
 * const firestoreData = convertDatesToTimestamps(formData, ['dueDate', 'createdAt'])
 */
export function convertDatesToTimestamps<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[]
): T {
  const result = { ...obj }

  dateFields.forEach((field) => {
    if (result[field] instanceof Date) {
      result[field] = Timestamp.fromDate(result[field] as Date) as any
    }
  })

  return result
}

// ============================================================================
// DATE CALCULATIONS
// ============================================================================

/**
 * Gets start of day (00:00:00)
 *
 * @param date - Optional date (defaults to today)
 * @returns Date at start of day
 *
 * @example
 * const today = startOfDay() // Today at 00:00:00
 * const date = startOfDay(new Date('2024-01-15')) // 2024-01-15 at 00:00:00
 */
export function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Gets end of day (23:59:59)
 *
 * @param date - Optional date (defaults to today)
 * @returns Date at end of day
 *
 * @example
 * const endToday = endOfDay() // Today at 23:59:59
 */
export function endOfDay(date: Date = new Date()): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Adds days to a date
 *
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date
 *
 * @example
 * const nextWeek = addDays(new Date(), 7)
 * const yesterday = addDays(new Date(), -1)
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Subtracts days from a date
 *
 * @param date - Starting date
 * @param days - Number of days to subtract
 * @returns New date
 *
 * @example
 * const lastWeek = subtractDays(new Date(), 7)
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

/**
 * Gets date N days from now
 *
 * @param days - Number of days in the future
 * @returns Future date
 *
 * @example
 * const nextWeek = daysFromNow(7)
 * const upcomingDeadline = daysFromNow(DATE_TIME.UPCOMING_DAYS)
 */
export function daysFromNow(days: number): Date {
  return addDays(new Date(), days)
}

/**
 * Checks if date is in the past
 *
 * @param date - Date to check
 * @returns true if date is before now
 *
 * @example
 * if (isPast(student.dueDate)) {
 *   console.log('Payment is overdue!')
 * }
 */
export function isPast(date: Date | Timestamp): boolean {
  const compareDate = toDate(date)
  return compareDate < new Date()
}

/**
 * Checks if date is in the future
 *
 * @param date - Date to check
 * @returns true if date is after now
 */
export function isFuture(date: Date | Timestamp): boolean {
  const compareDate = toDate(date)
  return compareDate > new Date()
}

/**
 * Checks if date is today
 *
 * @param date - Date to check
 * @returns true if date is today
 *
 * @example
 * if (isToday(event.startTime)) {
 *   console.log('Event is today!')
 * }
 */
export function isToday(date: Date | Timestamp): boolean {
  const compareDate = toDate(date)
  const today = new Date()

  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  )
}

/**
 * Checks if date is within N days from now
 *
 * @param date - Date to check
 * @param days - Number of days
 * @returns true if date is within the range
 *
 * @example
 * if (isWithinDays(student.dueDate, DATE_TIME.UPCOMING_DAYS)) {
 *   console.log('Payment due soon!')
 * }
 */
export function isWithinDays(date: Date | Timestamp, days: number): boolean {
  const compareDate = toDate(date)
  const now = new Date()
  const future = daysFromNow(days)

  return compareDate >= now && compareDate <= future
}

/**
 * Checks if date is overdue (past and not completed)
 *
 * @param dueDate - Due date
 * @param completedDate - Optional completion date
 * @returns true if overdue
 *
 * @example
 * if (isOverdue(homework.dueDate, homework.completedDate)) {
 *   homework.status = 'overdue'
 * }
 */
export function isOverdue(
  dueDate: Date | Timestamp,
  completedDate?: Date | Timestamp | null
): boolean {
  if (completedDate) {
    return false // Already completed
  }
  return isPast(dueDate)
}

// ============================================================================
// DATE RANGE UTILITIES
// ============================================================================

/**
 * Gets start and end of current month
 *
 * @returns Object with start and end dates
 *
 * @example
 * const { start, end } = getCurrentMonthRange()
 * const monthPayments = payments.filter(p =>
 *   p.date >= start && p.date <= end
 * )
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  return { start, end }
}

/**
 * Gets start and end of previous month
 *
 * @returns Object with start and end dates
 */
export function getPreviousMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

  const start = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0)
  const end = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999)

  return { start, end }
}

/**
 * Gets start and end of current year
 *
 * @returns Object with start and end dates
 */
export function getCurrentYearRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)

  return { start, end }
}

/**
 * Gets date range for last N days
 *
 * @param days - Number of days
 * @returns Object with start and end dates
 */
export function getLastNDaysRange(days: number): { start: Date; end: Date } {
  const end = new Date()
  const start = subtractDays(end, days)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Formats date for display (Bulgarian format: DD.MM.YYYY)
 *
 * @param date - Date to format
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()) // "15.01.2024"
 */
export function formatDate(date: Date | Timestamp): string {
  const d = toDate(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}.${month}.${year}`
}

/**
 * Formats datetime for display (Bulgarian format: DD.MM.YYYY HH:mm)
 *
 * @param date - Date to format
 * @returns Formatted datetime string
 *
 * @example
 * formatDateTime(new Date()) // "15.01.2024 14:30"
 */
export function formatDateTime(date: Date | Timestamp): string {
  const d = toDate(date)
  const dateStr = formatDate(d)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${dateStr} ${hours}:${minutes}`
}

/**
 * Formats relative time (e.g., "2 дни", "1 седмица")
 *
 * @param date - Date to format
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime(daysFromNow(3)) // "след 3 дни"
 * formatRelativeTime(subtractDays(new Date(), 2)) // "преди 2 дни"
 */
export function formatRelativeTime(date: Date | Timestamp): string {
  const d = toDate(date)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / DATE_TIME.MS_PER_DAY)

  if (diffDays === 0) return 'днес'
  if (diffDays === 1) return 'утре'
  if (diffDays === -1) return 'вчера'
  if (diffDays > 0) return `след ${diffDays} дни`
  return `преди ${Math.abs(diffDays)} дни`
}

// ============================================================================
// DUE DATE WARNINGS
// ============================================================================

/**
 * Due date status type
 */
export type DueDateStatus = 'overdue' | 'critical' | 'warning' | 'safe'

/**
 * Due date info with warning level
 */
export interface DueDateInfo {
  status: DueDateStatus
  daysUntil: number
  message: string
  color: 'red' | 'orange' | 'yellow' | 'green'
  bgColor: string
  textColor: string
  borderColor: string
}

/**
 * Gets due date status with warning level
 * - overdue: Past due date (red)
 * - critical: 1 day or less until due (orange)
 * - warning: 2-3 days until due (yellow)
 * - safe: More than 3 days or no due date (green)
 *
 * @param dueDate - The due date to check
 * @returns Due date info with status and styling
 *
 * @example
 * const info = getDueDateStatus(homework.dueDate)
 * if (info.status === 'overdue') {
 *   console.log('Просрочено!')
 * }
 * // Use styling: <div className={info.bgColor}>
 */
export function getDueDateStatus(dueDate: Date | Timestamp | null | undefined): DueDateInfo {
  if (!dueDate) {
    return {
      status: 'safe',
      daysUntil: 999,
      message: 'Няма краен срок',
      color: 'green',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300',
    }
  }

  const d = toDate(dueDate)
  const today = startOfDay(new Date())
  const due = startOfDay(d)
  const diffMs = due.getTime() - today.getTime()
  const daysUntil = Math.floor(diffMs / DATE_TIME.MS_PER_DAY)

  // Overdue - past due date
  if (daysUntil < 0) {
    return {
      status: 'overdue',
      daysUntil,
      message: `Просрочено с ${Math.abs(daysUntil)} дни`,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
      borderColor: 'border-red-500',
    }
  }

  // Due today
  if (daysUntil === 0) {
    return {
      status: 'critical',
      daysUntil,
      message: 'Краен срок днес!',
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-500',
    }
  }

  // Critical - 1 day left
  if (daysUntil === 1) {
    return {
      status: 'critical',
      daysUntil,
      message: 'Краен срок утре!',
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-500',
    }
  }

  // Warning - 2-3 days left
  if (daysUntil <= 3) {
    return {
      status: 'warning',
      daysUntil,
      message: `Краен срок след ${daysUntil} дни`,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-500',
    }
  }

  // Safe - more than 3 days
  return {
    status: 'safe',
    daysUntil,
    message: `Краен срок след ${daysUntil} дни`,
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-500',
  }
}
