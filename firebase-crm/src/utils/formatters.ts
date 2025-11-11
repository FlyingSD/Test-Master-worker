import { format, formatDistance } from 'date-fns'
import { bg } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'
import { CURRENCY } from '@/constants/appConstants'

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Date | Timestamp): Date {
  if (timestamp instanceof Date) {
    return timestamp
  }
  return timestamp?.toDate()
}

/**
 * Format date to Bulgarian locale
 */
export function formatDate(date: Date | Timestamp, formatStr: string = 'dd?.MM.yyyy'): string {
  const dateObj = timestampToDate(date)
  return format(dateObj, formatStr, { locale: bg })
}

/**
 * Format date to time ago (relative)
 */
export function formatTimeAgo(date: Date | Timestamp): string {
  const dateObj = timestampToDate(date)
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: bg })
}

/**
 * Format currency in BGN
 */
export function formatCurrency(amount: number, currency: 'BGN' | 'EUR' = 'BGN'): string {
  return new Intl?.NumberFormat('bg-BG', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Convert BGN to EUR
 * Uses official EUR/BGN exchange rate from Bulgarian National Bank
 */
export function bgnToEur(bgn: number): number {
  return Number((bgn / CURRENCY.BGN_TO_EUR_RATE).toFixed(2))
}

/**
 * Convert EUR to BGN
 * Uses official EUR/BGN exchange rate from Bulgarian National Bank
 */
export function eurToBgn(eur: number): number {
  return Number((eur * CURRENCY.BGN_TO_EUR_RATE).toFixed(2))
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone?.replace(/\D/g, '')

  // Format as Bulgarian phone: +359 XX XXX XXXX
  if (cleaned?.startsWith('359')) {
    return `+${cleaned?.slice(0, 3)} ${cleaned?.slice(3, 5)} ${cleaned?.slice(5, 8)} ${cleaned?.slice(8)}`
  }

  // Format as: 0XX XXX XXX
  if (cleaned?.startsWith('0')) {
    return `${cleaned?.slice(0, 3)} ${cleaned?.slice(3, 6)} ${cleaned?.slice(6)}`
  }

  return phone
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text?.length <= maxLength) return text
  return text?.slice(0, maxLength) + '...'
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  const parts = name?.trim().split(' ')
  if (parts?.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name?.slice(0, 2).toUpperCase()
}

/**
 * Check if date is overdue
 */
export function isOverdue(dueDate: Date | Timestamp): boolean {
  const date = timestampToDate(dueDate)
  return date < new Date()
}

/**
 * Get status color class
 */
export function getStatusColor(status: 'active' | 'inactive'): string {
  return status === 'active' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
}

/**
 * Get status badge text
 */
export function getStatusText(status: 'active' | 'inactive'): string {
  return status === 'active' ? 'Активен' : 'Неактивен'
}
