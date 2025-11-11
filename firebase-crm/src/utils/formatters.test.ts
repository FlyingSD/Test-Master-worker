import { describe, it, expect } from 'vitest'
import { bgnToEur, eurToBgn, formatCurrency, formatDate } from './formatters'

describe('formatters utils', () => {
  describe('bgnToEur', () => {
    it('should convert BGN to EUR correctly', () => {
      expect(bgnToEur(195.58)).toBeCloseTo(100, 2)
      expect(bgnToEur(1955.8)).toBeCloseTo(1000, 2)
      expect(bgnToEur(0)).toBe(0)
    })

    it('should handle decimal numbers', () => {
      expect(bgnToEur(97.79)).toBeCloseTo(50, 2)
      expect(bgnToEur(48.895)).toBeCloseTo(25, 2)
    })

    it('should return 0 for negative numbers', () => {
      expect(bgnToEur(-100)).toBe(0)
    })
  })

  describe('eurToBgn', () => {
    it('should convert EUR to BGN correctly', () => {
      expect(eurToBgn(100)).toBeCloseTo(195.58, 2)
      expect(eurToBgn(1000)).toBeCloseTo(1955.8, 2)
      expect(eurToBgn(0)).toBe(0)
    })

    it('should handle decimal numbers', () => {
      expect(eurToBgn(50)).toBeCloseTo(97.79, 2)
      expect(eurToBgn(25)).toBeCloseTo(48.895, 2)
    })

    it('should return 0 for negative numbers', () => {
      expect(eurToBgn(-100)).toBe(0)
    })
  })

  describe('formatCurrency', () => {
    it('should format BGN currency correctly', () => {
      expect(formatCurrency(100, 'BGN')).toBe('100.00 лв')
      expect(formatCurrency(1000, 'BGN')).toBe('1,000.00 лв')
      expect(formatCurrency(0, 'BGN')).toBe('0.00 лв')
    })

    it('should format EUR currency correctly', () => {
      expect(formatCurrency(100, 'EUR')).toBe('€100.00')
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00')
      expect(formatCurrency(0, 'EUR')).toBe('€0.00')
    })

    it('should handle decimal numbers', () => {
      expect(formatCurrency(123.45, 'BGN')).toBe('123.45 лв')
      expect(formatCurrency(123.456, 'EUR')).toBe('€123.46') // Rounds to 2 decimals
    })

    it('should default to BGN if currency not specified', () => {
      expect(formatCurrency(100)).toBe('100.00 лв')
    })
  })

  describe('formatDate', () => {
    it('should format Date objects correctly', () => {
      const date = new Date('2025-11-11')
      expect(formatDate(date)).toMatch(/11\.11\.2025/)
    })

    it('should format string dates correctly', () => {
      expect(formatDate('2025-11-11')).toMatch(/11\.11\.2025/)
    })

    it('should handle Firestore Timestamps', () => {
      const timestamp = {
        toDate: () => new Date('2025-11-11'),
      }
      expect(formatDate(timestamp as any)).toMatch(/11\.11\.2025/)
    })

    it('should return empty string for invalid dates', () => {
      expect(formatDate(null as any)).toBe('')
      expect(formatDate(undefined as any)).toBe('')
      expect(formatDate('invalid' as any)).toBe('')
    })

    it('should handle different date formats', () => {
      const isoDate = '2025-11-11T10:30:00Z'
      expect(formatDate(isoDate)).toMatch(/11\.11\.2025/)
    })
  })
})
