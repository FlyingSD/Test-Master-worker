import { format, formatDistance } from 'date-fns'
import { bg } from 'date-fns/locale'
import { Timestamp } from 'firebase/firestore'
import { CURRENCY } from '@/constants/appConstants'

/**
 * Convert Firestore Timestamp to Date
 *
 * @param timestamp - Firestore Timestamp or Date object
 * @returns JavaScript Date object
 *
 * @example
 * ```ts
 * const payment = { date: serverTimestamp() }
 * const jsDate = timestampToDate(payment.date)
 * ```
 */
export function timestampToDate(timestamp: Date | Timestamp): Date {
  if (timestamp instanceof Date) {
    return timestamp
  }
  return timestamp?.toDate()
}

/**
 * Format date to Bulgarian locale
 *
 * @param date - Date or Timestamp to format
 * @param formatStr - Format string (default: 'dd.MM.yyyy')
 * @returns Formatted date string
 *
 * @example
 * ```ts
 * formatDate(new Date()) // "15.01.2024"
 * formatDate(new Date(), 'dd MMM yyyy') // "15 яну 2024"
 * ```
 */
export function formatDate(date: Date | Timestamp, formatStr: string = 'dd?.MM.yyyy'): string {
  const dateObj = timestampToDate(date)
  return format(dateObj, formatStr, { locale: bg })
}

/**
 * Format date to relative time ago (e.g., "преди 2 дни")
 *
 * @param date - Date or Timestamp to format
 * @returns Relative time string in Bulgarian
 *
 * @example
 * ```ts
 * formatTimeAgo(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)) // "преди 2 дни"
 * formatTimeAgo(new Date(Date.now() - 5 * 60 * 1000)) // "преди 5 минути"
 * ```
 */
export function formatTimeAgo(date: Date | Timestamp): string {
  const dateObj = timestampToDate(date)
  return formatDistance(dateObj, new Date(), { addSuffix: true, locale: bg })
}

/**
 * Format currency with proper locale formatting
 *
 * @param amount - Amount to format
 * @param currency - Currency code ('BGN' or 'EUR')
 * @returns Formatted currency string
 *
 * @example
 * ```ts
 * formatCurrency(1250.50) // "1 250,50 BGN"
 * formatCurrency(100, 'EUR') // "100,00 EUR"
 * ```
 */
export function formatCurrency(amount: number, currency: 'BGN' | 'EUR' = 'BGN'): string {
  return new Intl?.NumberFormat('bg-BG', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Convert BGN to EUR
 * Uses official EUR/BGN exchange rate from Bulgarian National Bank (1.95583)
 *
 * @param bgn - Amount in BGN
 * @returns Amount in EUR (rounded to 2 decimals)
 *
 * @example
 * ```ts
 * bgnToEur(195.58) // 100.00
 * bgnToEur(1000) // 511.29
 * ```
 */
export function bgnToEur(bgn: number): number {
  return Number((bgn / CURRENCY.BGN_TO_EUR_RATE).toFixed(2))
}

/**
 * Convert EUR to BGN
 * Uses official EUR/BGN exchange rate from Bulgarian National Bank (1.95583)
 *
 * @param eur - Amount in EUR
 * @returns Amount in BGN (rounded to 2 decimals)
 *
 * @example
 * ```ts
 * eurToBgn(100) // 195.58
 * eurToBgn(50) // 97.79
 * ```
 */
export function eurToBgn(eur: number): number {
  return Number((eur * CURRENCY.BGN_TO_EUR_RATE).toFixed(2))
}

/**
 * Format phone number to Bulgarian standard
 * Handles both international (+359) and local (0XX) formats
 *
 * @param phone - Phone number string
 * @returns Formatted phone number
 *
 * @example
 * ```ts
 * formatPhone('359888123456') // "+359 88 812 3456"
 * formatPhone('0888123456') // "088 812 3456"
 * formatPhone('888-123-456') // "088 812 3456" (cleaned)
 * ```
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
 * Truncate text to specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with '...' if needed
 *
 * @example
 * ```ts
 * truncate('This is a very long text', 10) // "This is a..."
 * truncate('Short', 10) // "Short"
 * ```
 */
export function truncate(text: string, maxLength: number): string {
  if (text?.length <= maxLength) return text
  return text?.slice(0, maxLength) + '...'
}

/**
 * Extract initials from full name
 * Returns first letters of first and last name, or first 2 letters if single word
 *
 * @param name - Full name
 * @returns Initials (2 uppercase letters)
 *
 * @example
 * ```ts
 * getInitials('Иван Петров') // "ИП"
 * getInitials('Мария') // "МА"
 * getInitials('John Doe') // "JD"
 * ```
 */
export function getInitials(name: string): string {
  const parts = name?.trim().split(' ')
  if (parts?.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name?.slice(0, 2).toUpperCase()
}

/**
 * Check if due date has passed (is overdue)
 *
 * @param dueDate - Due date to check
 * @returns true if date is in the past
 *
 * @example
 * ```ts
 * if (isOverdue(homework.dueDate)) {
 *   console.log('Homework is overdue!')
 * }
 * ```
 */
export function isOverdue(dueDate: Date | Timestamp): boolean {
  const date = timestampToDate(dueDate)
  return date < new Date()
}

/**
 * Get Tailwind CSS classes for status badge color
 *
 * @param status - Status ('active' or 'inactive')
 * @returns Tailwind CSS classes for text and background
 *
 * @example
 * ```tsx
 * <span className={getStatusColor(student.status)}>
 *   {getStatusText(student.status)}
 * </span>
 * ```
 */
export function getStatusColor(status: 'active' | 'inactive'): string {
  return status === 'active' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
}

/**
 * Get localized text for status
 *
 * @param status - Status ('active' or 'inactive')
 * @returns Bulgarian status text
 *
 * @example
 * ```tsx
 * <Badge>{getStatusText(student.status)}</Badge>
 * // Renders: "Активен" or "Неактивен"
 * ```
 */
export function getStatusText(status: 'active' | 'inactive'): string {
  return status === 'active' ? 'Активен' : 'Неактивен'
}
