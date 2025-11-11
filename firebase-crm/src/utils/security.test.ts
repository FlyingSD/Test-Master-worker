import { describe, it, expect, beforeEach } from 'vitest'
import {
  sanitizeInput,
  validateEmail,
  validatePhone,
  validateBULSTAT,
  validateAmount,
  isValidURL,
  escapeHTML,
  hashPassword,
  comparePassword,
  generateToken,
  validateToken,
  checkRateLimit,
  isSecurePassword,
  hasSpecialChars,
  hasNumbers,
  hasUpperCase,
  hasLowerCase,
} from './security'

describe('Security - Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('removes script tags', () => {
      const input = '<script>alert("xss")</script>Hello'
      const result = sanitizeInput(input)

      expect(result).not.toContain('<script>')
      expect(result).toContain('Hello')
    })

    it('removes dangerous HTML', () => {
      const input = '<img src=x onerror="alert(1)">'
      const result = sanitizeInput(input)

      expect(result).not.toContain('onerror')
    })

    it('preserves safe text', () => {
      const input = 'Hello World 123'
      const result = sanitizeInput(input)

      expect(result).toBe(input)
    })

    it('removes SQL injection attempts', () => {
      const input = "'; DROP TABLE users; --"
      const result = sanitizeInput(input)

      expect(result).not.toContain('DROP TABLE')
    })

    it('trims whitespace', () => {
      const input = '   Hello World   '
      const result = sanitizeInput(input)

      expect(result).toBe('Hello World')
    })
  })

  describe('escapeHTML', () => {
    it('escapes special HTML characters', () => {
      const input = '<div>"Hello" & \'World\'</div>'
      const result = escapeHTML(input)

      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).toContain('&quot;')
      expect(result).toContain('&#39;')
      expect(result).toContain('&amp;')
    })

    it('handles empty string', () => {
      expect(escapeHTML('')).toBe('')
    })
  })
})

describe('Security - Validation', () => {
  describe('validateEmail', () => {
    it('returns true for valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@domain.co.uk')).toBe(true)
      expect(validateEmail('user+tag@example.com')).toBe(true)
    })

    it('returns false for invalid emails', () => {
      expect(validateEmail('notanemail')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('user @example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('returns true for valid Bulgarian phone numbers', () => {
      expect(validatePhone('0888123456')).toBe(true)
      expect(validatePhone('088 812 3456')).toBe(true)
      expect(validatePhone('+359 88 812 3456')).toBe(true)
      expect(validatePhone('02 123 4567')).toBe(true)
    })

    it('returns false for invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('abcd')).toBe(false)
      expect(validatePhone('')).toBe(false)
      expect(validatePhone('00000000')).toBe(false)
    })
  })

  describe('validateBULSTAT', () => {
    it('returns true for valid BULSTAT (9 digits)', () => {
      expect(validateBULSTAT('123456789')).toBe(true)
      expect(validateBULSTAT('831234567')).toBe(true)
    })

    it('returns true for valid BULSTAT (13 digits)', () => {
      expect(validateBULSTAT('1234567890123')).toBe(true)
    })

    it('returns false for invalid BULSTAT', () => {
      expect(validateBULSTAT('12345')).toBe(false)
      expect(validateBULSTAT('abcd')).toBe(false)
      expect(validateBULSTAT('')).toBe(false)
      expect(validateBULSTAT('12345678901234')).toBe(false) // Too long
    })
  })

  describe('validateAmount', () => {
    it('returns true for valid positive amounts', () => {
      expect(validateAmount(10)).toBe(true)
      expect(validateAmount(100.50)).toBe(true)
      expect(validateAmount(0.01)).toBe(true)
    })

    it('returns false for invalid amounts', () => {
      expect(validateAmount(0)).toBe(false)
      expect(validateAmount(-10)).toBe(false)
      expect(validateAmount(NaN)).toBe(false)
      expect(validateAmount(Infinity)).toBe(false)
    })

    it('validates max amount', () => {
      expect(validateAmount(10000, 0, 5000)).toBe(false)
      expect(validateAmount(4999, 0, 5000)).toBe(true)
    })

    it('validates min amount', () => {
      expect(validateAmount(5, 10)).toBe(false)
      expect(validateAmount(15, 10)).toBe(true)
    })
  })

  describe('isValidURL', () => {
    it('returns true for valid URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true)
      expect(isValidURL('http://test.org')).toBe(true)
      expect(isValidURL('https://sub.domain.com/path')).toBe(true)
    })

    it('returns false for invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false)
      expect(isValidURL('htp://wrong.com')).toBe(false)
      expect(isValidURL('')).toBe(false)
      expect(isValidURL('javascript:alert(1)')).toBe(false)
    })
  })
})

describe('Security - Password', () => {
  describe('isSecurePassword', () => {
    it('returns true for strong passwords', () => {
      expect(isSecurePassword('MySecure123!')).toBe(true)
      expect(isSecurePassword('P@ssw0rd2024')).toBe(true)
      expect(isSecurePassword('Test123!@#')).toBe(true)
    })

    it('returns false for weak passwords', () => {
      expect(isSecurePassword('12345')).toBe(false)       // Too short
      expect(isSecurePassword('password')).toBe(false)    // No numbers
      expect(isSecurePassword('PASSWORD')).toBe(false)    // No lowercase
      expect(isSecurePassword('Password')).toBe(false)    // No numbers
      expect(isSecurePassword('password123')).toBe(false) // No uppercase
    })

    it('enforces minimum length', () => {
      expect(isSecurePassword('Aa1!', 8)).toBe(false)
      expect(isSecurePassword('Aa1!Aa1!', 8)).toBe(true)
    })
  })

  describe('hasUpperCase', () => {
    it('returns true for strings with uppercase', () => {
      expect(hasUpperCase('Hello')).toBe(true)
      expect(hasUpperCase('WORLD')).toBe(true)
      expect(hasUpperCase('tEst')).toBe(true)
    })

    it('returns false for strings without uppercase', () => {
      expect(hasUpperCase('hello')).toBe(false)
      expect(hasUpperCase('123')).toBe(false)
      expect(hasUpperCase('')).toBe(false)
    })
  })

  describe('hasLowerCase', () => {
    it('returns true for strings with lowercase', () => {
      expect(hasLowerCase('hello')).toBe(true)
      expect(hasLowerCase('WORLD')).toBe(false)
      expect(hasLowerCase('Test')).toBe(true)
    })
  })

  describe('hasNumbers', () => {
    it('returns true for strings with numbers', () => {
      expect(hasNumbers('hello123')).toBe(true)
      expect(hasNumbers('test1')).toBe(true)
      expect(hasNumbers('999')).toBe(true)
    })

    it('returns false for strings without numbers', () => {
      expect(hasNumbers('hello')).toBe(false)
      expect(hasNumbers('TEST')).toBe(false)
    })
  })

  describe('hasSpecialChars', () => {
    it('returns true for strings with special characters', () => {
      expect(hasSpecialChars('hello!')).toBe(true)
      expect(hasSpecialChars('test@123')).toBe(true)
      expect(hasSpecialChars('p@ssw0rd')).toBe(true)
    })

    it('returns false for alphanumeric strings', () => {
      expect(hasSpecialChars('hello123')).toBe(false)
      expect(hasSpecialChars('TEST')).toBe(false)
    })
  })
})

describe('Security - Token Management', () => {
  describe('generateToken', () => {
    it('generates token of specified length', () => {
      const token = generateToken(32)

      expect(token).toBeTruthy()
      expect(token.length).toBeGreaterThanOrEqual(32)
    })

    it('generates unique tokens', () => {
      const token1 = generateToken(16)
      const token2 = generateToken(16)

      expect(token1).not.toBe(token2)
    })

    it('generates alphanumeric tokens', () => {
      const token = generateToken(20)

      expect(token).toMatch(/^[a-zA-Z0-9]+$/)
    })
  })

  describe('validateToken', () => {
    it('returns true for valid token format', () => {
      const token = 'abc123XYZ789'

      expect(validateToken(token)).toBe(true)
    })

    it('returns false for invalid tokens', () => {
      expect(validateToken('')).toBe(false)
      expect(validateToken('ab')).toBe(false) // Too short
      expect(validateToken('abc def')).toBe(false) // Contains space
      expect(validateToken('abc@123')).toBe(false) // Special chars
    })

    it('enforces minimum length', () => {
      expect(validateToken('abc', 5)).toBe(false)
      expect(validateToken('abcdef', 5)).toBe(true)
    })
  })
})

describe('Security - Rate Limiting', () => {
  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Clear rate limit storage before each test
      if (typeof window !== 'undefined') {
        window.sessionStorage.clear()
      }
    })

    it('allows requests within limit', () => {
      expect(checkRateLimit('test-action', 5, 60000)).toBe(true)
      expect(checkRateLimit('test-action', 5, 60000)).toBe(true)
      expect(checkRateLimit('test-action', 5, 60000)).toBe(true)
    })

    it('blocks requests exceeding limit', () => {
      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit('test-limit', 5, 60000)
      }

      // 6th request should be blocked
      expect(checkRateLimit('test-limit', 5, 60000)).toBe(false)
    })

    it('resets after time window', () => {
      checkRateLimit('test-reset', 1, 10) // 10ms window

      // First request succeeds
      expect(checkRateLimit('test-reset', 1, 10)).toBe(true)

      // Immediate next request fails
      expect(checkRateLimit('test-reset', 1, 10)).toBe(false)

      // Wait for window to pass
      return new Promise((resolve) => {
        setTimeout(() => {
          // After window, should succeed again
          expect(checkRateLimit('test-reset', 1, 10)).toBe(true)
          resolve(true)
        }, 15)
      })
    })

    it('tracks different actions separately', () => {
      checkRateLimit('action-1', 1, 60000)
      checkRateLimit('action-2', 1, 60000)

      // Both should still allow one more
      expect(checkRateLimit('action-1', 1, 60000)).toBe(false)
      expect(checkRateLimit('action-2', 1, 60000)).toBe(false)
    })
  })
})

describe('Security - Hash & Compare', () => {
  describe('hashPassword', () => {
    it('hashes password', async () => {
      const password = 'MyPassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeTruthy()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(password.length)
    })

    it('generates different hashes for same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      // Should be different due to salt
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('comparePassword', () => {
    it('returns true for matching password', async () => {
      const password = 'SecurePass123!'
      const hash = await hashPassword(password)
      const isMatch = await comparePassword(password, hash)

      expect(isMatch).toBe(true)
    })

    it('returns false for non-matching password', async () => {
      const password = 'SecurePass123!'
      const wrongPassword = 'WrongPass456!'
      const hash = await hashPassword(password)
      const isMatch = await comparePassword(wrongPassword, hash)

      expect(isMatch).toBe(false)
    })
  })
})

describe('Security - Edge Cases', () => {
  it('handles null and undefined gracefully', () => {
    expect(sanitizeInput(null as any)).toBe('')
    expect(sanitizeInput(undefined as any)).toBe('')
    expect(validateEmail(null as any)).toBe(false)
    expect(validatePhone(null as any)).toBe(false)
  })

  it('handles very long inputs', () => {
    const longString = 'a'.repeat(10000)
    const result = sanitizeInput(longString)

    expect(result.length).toBeLessThanOrEqual(10000)
  })

  it('handles special Unicode characters', () => {
    const unicode = '你好世界 🌍 Привет'
    const result = sanitizeInput(unicode)

    expect(result).toContain('你好')
    expect(result).toContain('Привет')
  })

  it('prevents prototype pollution attempts', () => {
    const malicious = '__proto__'
    const result = sanitizeInput(malicious)

    expect(result).not.toContain('__proto__')
  })
})
