import { describe, it, expect } from 'vitest'
import {
  generateStudentCode,
  isValidStudentCode,
  formatStudentCode,
  normalizeStudentCode,
  TOTAL_COMBINATIONS,
} from './studentCode'

describe('studentCode utils', () => {
  describe('generateStudentCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateStudentCode()
      expect(code).toHaveLength(6)
    })

    it('should only contain valid characters (A-Z excl O/I, 2-9 excl 0/1)', () => {
      const code = generateStudentCode()
      const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/
      expect(code).toMatch(validChars)
    })

    it('should not contain confusing characters (O, I, 0, 1)', () => {
      const code = generateStudentCode()
      expect(code).not.toContain('O')
      expect(code).not.toContain('I')
      expect(code).not.toContain('0')
      expect(code).not.toContain('1')
    })

    it('should generate different codes (randomness check)', () => {
      const codes = new Set()
      for (let i = 0; i < 100; i++) {
        codes.add(generateStudentCode())
      }
      // Should have high uniqueness (at least 95% unique)
      expect(codes.size).toBeGreaterThan(95)
    })
  })

  describe('isValidStudentCode', () => {
    it('should validate correct codes', () => {
      expect(isValidStudentCode('K8M2B6')).toBe(true)
      expect(isValidStudentCode('R7P3D9')).toBe(true)
      expect(isValidStudentCode('F5T4N8')).toBe(true)
    })

    it('should reject codes with invalid length', () => {
      expect(isValidStudentCode('K8M2B')).toBe(false) // Too short
      expect(isValidStudentCode('K8M2B67')).toBe(false) // Too long
      expect(isValidStudentCode('')).toBe(false) // Empty
    })

    it('should reject codes with invalid characters', () => {
      expect(isValidStudentCode('K8M2BO')).toBe(false) // Contains O
      expect(isValidStudentCode('K8M2B1')).toBe(false) // Contains 1
      expect(isValidStudentCode('K8M2B0')).toBe(false) // Contains 0
      expect(isValidStudentCode('K8M2BI')).toBe(false) // Contains I
    })

    it('should handle lowercase input', () => {
      expect(isValidStudentCode('k8m2b6')).toBe(true) // Should convert to uppercase
    })

    it('should reject null/undefined', () => {
      expect(isValidStudentCode(null as any)).toBe(false)
      expect(isValidStudentCode(undefined as any)).toBe(false)
    })
  })

  describe('formatStudentCode', () => {
    it('should format 6-char code with space in middle', () => {
      expect(formatStudentCode('K8M2B6')).toBe('K8M 2B6')
      expect(formatStudentCode('R7P3D9')).toBe('R7P 3D9')
    })

    it('should return unformatted if length is not 6', () => {
      expect(formatStudentCode('K8M2B')).toBe('K8M2B')
      expect(formatStudentCode('K8M2B67')).toBe('K8M2B67')
    })

    it('should handle empty string', () => {
      expect(formatStudentCode('')).toBe('')
    })
  })

  describe('normalizeStudentCode', () => {
    it('should remove spaces', () => {
      expect(normalizeStudentCode('K8M 2B6')).toBe('K8M2B6')
      expect(normalizeStudentCode('K 8 M 2 B 6')).toBe('K8M2B6')
    })

    it('should convert to uppercase', () => {
      expect(normalizeStudentCode('k8m2b6')).toBe('K8M2B6')
      expect(normalizeStudentCode('k8m 2b6')).toBe('K8M2B6')
    })

    it('should handle already normalized codes', () => {
      expect(normalizeStudentCode('K8M2B6')).toBe('K8M2B6')
    })
  })

  describe('TOTAL_COMBINATIONS', () => {
    it('should be over 1 billion combinations', () => {
      expect(TOTAL_COMBINATIONS).toBeGreaterThan(1_000_000_000)
      // 32^6 = 1,073,741,824
      expect(TOTAL_COMBINATIONS).toBe(1_073_741_824)
    })
  })
})
