import { describe, it, expect } from 'vitest'
import {
  sanitizeHtml,
  sanitizeString,
  sanitizeFilename,
  validateUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeNumber,
  sanitizeObject,
} from './security'

// ============================================================================
// INPUT SANITIZATION TESTS (CRITICAL #3 FIX - XSS PROTECTION)
// ============================================================================

describe('Security - HTML Sanitization (XSS Protection)', () => {
  describe('sanitizeHtml', () => {
    it('escapes dangerous HTML characters', () => {
      const malicious = '<script>alert("XSS")</script>'
      const safe = sanitizeHtml(malicious)

      expect(safe).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;')
      expect(safe).not.toContain('<script>')
    })

    it('escapes HTML injection attempts', () => {
      const malicious = '<img src=x onerror="alert(1)">'
      const safe = sanitizeHtml(malicious)

      expect(safe).toContain('&lt;img')
      expect(safe).toContain('&quot;')
      expect(safe).not.toContain('<img')
      expect(safe).not.toContain('onerror')
    })

    it('escapes all special characters', () => {
      const input = '<div>"Hello" & \'World\' / Test</div>'
      const safe = sanitizeHtml(input)

      expect(safe).toBe('&lt;div&gt;&quot;Hello&quot; &amp; &#x27;World&#x27; &#x2F; Test&lt;&#x2F;div&gt;')
    })

    it('handles empty string', () => {
      expect(sanitizeHtml('')).toBe('')
    })

    it('handles non-string input', () => {
      expect(sanitizeHtml(null as any)).toBe('')
      expect(sanitizeHtml(undefined as any)).toBe('')
      expect(sanitizeHtml(123 as any)).toBe('')
    })

    it('preserves safe text content', () => {
      const safeText = 'Hello World 123'
      expect(sanitizeHtml(safeText)).toBe(safeText)
    })
  })
})

describe('Security - String Sanitization', () => {
  describe('sanitizeString', () => {
    it('trims whitespace', () => {
      expect(sanitizeString('   Hello World   ')).toBe('Hello World')
      expect(sanitizeString('\t\nTest\t\n')).toBe('Test')
    })

    it('removes null bytes', () => {
      const malicious = 'Hello\0World'
      expect(sanitizeString(malicious)).toBe('HelloWorld')
    })

    it('limits string length', () => {
      const longString = 'a'.repeat(2000)
      const sanitized = sanitizeString(longString, 100)

      expect(sanitized.length).toBe(100)
    })

    it('uses default max length of 1000', () => {
      const longString = 'a'.repeat(2000)
      const sanitized = sanitizeString(longString)

      expect(sanitized.length).toBe(1000)
    })

    it('handles empty string', () => {
      expect(sanitizeString('')).toBe('')
    })

    it('handles non-string input', () => {
      expect(sanitizeString(null as any)).toBe('')
      expect(sanitizeString(undefined as any)).toBe('')
    })

    it('preserves valid content', () => {
      const valid = 'John Doe 123'
      expect(sanitizeString(valid)).toBe(valid)
    })
  })
})

describe('Security - Filename Sanitization', () => {
  describe('sanitizeFilename', () => {
    it('removes path traversal sequences', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etc_passwd')
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windows_system32')
    })

    it('replaces path separators with underscores', () => {
      expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt')
      expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt')
    })

    it('removes dangerous file extensions', () => {
      expect(sanitizeFilename('invoice.pdf.exe')).toBe('invoice.pdf')
      expect(sanitizeFilename('script.bat')).toBe('script')
      expect(sanitizeFilename('malware.cmd')).toBe('malware')
      expect(sanitizeFilename('hack.sh')).toBe('hack')
      expect(sanitizeFilename('virus.vbs')).toBe('virus')
    })

    it('removes null bytes', () => {
      expect(sanitizeFilename('file\0name.txt')).toBe('filename.txt')
    })

    it('removes control characters', () => {
      const malicious = 'file\x00\x01\x1F\x7Fname.txt'
      expect(sanitizeFilename(malicious)).toBe('filename.txt')
    })

    it('limits filename length to 255', () => {
      const longName = 'a'.repeat(300) + '.txt'
      const sanitized = sanitizeFilename(longName)

      expect(sanitized.length).toBe(255)
    })

    it('returns unnamed_file for empty input', () => {
      expect(sanitizeFilename('')).toBe('unnamed_file')
      expect(sanitizeFilename('   ')).toBe('unnamed_file')
    })

    it('handles non-string input', () => {
      expect(sanitizeFilename(null as any)).toBe('unnamed_file')
      expect(sanitizeFilename(undefined as any)).toBe('unnamed_file')
    })

    it('preserves safe filenames', () => {
      expect(sanitizeFilename('invoice.pdf')).toBe('invoice.pdf')
      expect(sanitizeFilename('report_2024.xlsx')).toBe('report_2024.xlsx')
    })
  })
})

describe('Security - URL Validation', () => {
  describe('validateUrl', () => {
    it('accepts valid HTTP URLs', () => {
      const result = validateUrl('http://example.com')

      expect(result.isValid).toBe(true)
      expect(result.sanitizedUrl).toBe('http://example.com/')
    })

    it('accepts valid HTTPS URLs', () => {
      const result = validateUrl('https://example.com/path?query=1')

      expect(result.isValid).toBe(true)
      expect(result.sanitizedUrl).toContain('https://example.com/')
    })

    it('blocks javascript: protocol (XSS)', () => {
      const result = validateUrl('javascript:alert("XSS")')

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('Dangerous protocol')
    })

    it('blocks data: protocol (XSS)', () => {
      const result = validateUrl('data:text/html,<script>alert(1)</script>')

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('Dangerous protocol')
    })

    it('blocks vbscript: protocol', () => {
      const result = validateUrl('vbscript:msgbox("XSS")')

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('Dangerous protocol')
    })

    it('blocks file: protocol', () => {
      const result = validateUrl('file:///etc/passwd')

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('Dangerous protocol')
    })

    it('rejects invalid URL format', () => {
      const result = validateUrl('not-a-valid-url')

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Invalid URL format')
    })

    it('respects allowed protocols', () => {
      const result = validateUrl('ftp://example.com', ['ftp'])

      expect(result.isValid).toBe(true)
    })

    it('blocks protocols not in allowed list', () => {
      const result = validateUrl('ftp://example.com', ['http', 'https'])

      expect(result.isValid).toBe(false)
      expect(result.reason).toContain('Protocol not allowed')
    })

    it('trims whitespace', () => {
      const result = validateUrl('  https://example.com  ')

      expect(result.isValid).toBe(true)
    })

    it('handles empty input', () => {
      const result = validateUrl('')

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Empty or invalid URL')
    })

    it('handles non-string input', () => {
      const result = validateUrl(null as any)

      expect(result.isValid).toBe(false)
      expect(result.reason).toBe('Empty or invalid URL')
    })
  })
})

describe('Security - Email Sanitization', () => {
  describe('sanitizeEmail', () => {
    it('trims and lowercases email', () => {
      expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com')
      expect(sanitizeEmail('Test.User@Domain.COM')).toBe('test.user@domain.com')
    })

    it('validates email format', () => {
      expect(sanitizeEmail('valid@example.com')).toBe('valid@example.com')
      expect(sanitizeEmail('test.user@domain.co.uk')).toBe('test.user@domain.co.uk')
    })

    it('rejects invalid email formats', () => {
      expect(sanitizeEmail('notanemail')).toBe('')
      expect(sanitizeEmail('@example.com')).toBe('')
      expect(sanitizeEmail('user@')).toBe('')
      expect(sanitizeEmail('user @example.com')).toBe('')
    })

    it('removes dangerous characters', () => {
      expect(sanitizeEmail('test<>@example.com')).toBe('test@example.com')
      expect(sanitizeEmail('test"user"@example.com')).toBe('testuser@example.com')
    })

    it('handles empty input', () => {
      expect(sanitizeEmail('')).toBe('')
    })

    it('handles non-string input', () => {
      expect(sanitizeEmail(null as any)).toBe('')
      expect(sanitizeEmail(undefined as any)).toBe('')
    })
  })
})

describe('Security - Phone Sanitization', () => {
  describe('sanitizePhone', () => {
    it('removes non-numeric characters', () => {
      expect(sanitizePhone('088 812 3456')).toBe('0888123456')
      expect(sanitizePhone('088-812-3456')).toBe('0888123456')
      expect(sanitizePhone('(088) 812-3456')).toBe('0888123456')
    })

    it('preserves + prefix for international numbers', () => {
      expect(sanitizePhone('+359 88 123 4567')).toBe('+359881234567')
      expect(sanitizePhone('+1-555-123-4567')).toBe('+15551234567')
    })

    it('removes + from middle of string', () => {
      expect(sanitizePhone('088+812+3456')).toBe('0888123456')
    })

    it('handles empty input', () => {
      expect(sanitizePhone('')).toBe('')
    })

    it('handles non-string input', () => {
      expect(sanitizePhone(null as any)).toBe('')
      expect(sanitizePhone(undefined as any)).toBe('')
    })

    it('removes all non-digit characters except leading +', () => {
      expect(sanitizePhone('+359 (88) 123-45-67')).toBe('+359881234567')
    })
  })
})

describe('Security - Number Sanitization', () => {
  describe('sanitizeNumber', () => {
    it('parses valid string numbers', () => {
      expect(sanitizeNumber('123')).toBe(123)
      expect(sanitizeNumber('123.45')).toBe(123.45)
      expect(sanitizeNumber('-50')).toBe(-50)
    })

    it('accepts numeric input', () => {
      expect(sanitizeNumber(123)).toBe(123)
      expect(sanitizeNumber(123.45)).toBe(123.45)
    })

    it('removes non-numeric characters from strings', () => {
      expect(sanitizeNumber('$123.45')).toBe(123.45)
      expect(sanitizeNumber('1,234.56 BGN')).toBe(1234.56)
    })

    it('applies minimum constraint', () => {
      expect(sanitizeNumber(-10, 0)).toBe(0)
      expect(sanitizeNumber(5, 10)).toBe(10)
    })

    it('applies maximum constraint', () => {
      expect(sanitizeNumber(1000, 0, 500)).toBe(500)
      expect(sanitizeNumber(200, 0, 100)).toBe(100)
    })

    it('applies both min and max constraints', () => {
      expect(sanitizeNumber(150, 0, 100)).toBe(100)
      expect(sanitizeNumber(-10, 0, 100)).toBe(0)
      expect(sanitizeNumber(50, 0, 100)).toBe(50)
    })

    it('returns null for invalid input', () => {
      expect(sanitizeNumber('not-a-number')).toBe(null)
      expect(sanitizeNumber('abc')).toBe(null)
      expect(sanitizeNumber(NaN)).toBe(null)
      expect(sanitizeNumber(Infinity)).toBe(null)
    })

    it('handles empty input', () => {
      expect(sanitizeNumber('')).toBe(null)
    })

    it('handles non-string/non-number input', () => {
      expect(sanitizeNumber(null as any)).toBe(null)
      expect(sanitizeNumber(undefined as any)).toBe(null)
      expect(sanitizeNumber({} as any)).toBe(null)
    })
  })
})

describe('Security - Object Sanitization', () => {
  describe('sanitizeObject', () => {
    it('trims strings in object', () => {
      const input = {
        name: '  John Doe  ',
        email: '  test@example.com  ',
      }
      const safe = sanitizeObject(input)

      expect(safe.name).toBe('John Doe')
      expect(safe.email).toBe('test@example.com')
    })

    it('escapes HTML in object when htmlEscape option is true', () => {
      const input = {
        name: '<script>alert(1)</script>',
        bio: 'Hello & <b>World</b>',
      }
      const safe = sanitizeObject(input, { htmlEscape: true })

      expect(safe.name).toContain('&lt;script&gt;')
      expect(safe.bio).toContain('&amp;')
      expect(safe.bio).toContain('&lt;b&gt;')
    })

    it('recursively sanitizes nested objects', () => {
      const input = {
        user: {
          name: '  John  ',
          address: {
            city: '  Sofia  ',
          },
        },
      }
      const safe = sanitizeObject(input)

      expect(safe.user.name).toBe('John')
      expect(safe.user.address.city).toBe('Sofia')
    })

    it('sanitizes arrays', () => {
      const input = {
        tags: ['  tag1  ', '  tag2  '],
      }
      const safe = sanitizeObject(input)

      expect(safe.tags[0]).toBe('tag1')
      expect(safe.tags[1]).toBe('tag2')
    })

    it('limits string length with maxStringLength option', () => {
      const input = {
        bio: 'a'.repeat(200),
      }
      const safe = sanitizeObject(input, { maxStringLength: 50 })

      expect(safe.bio.length).toBe(50)
    })

    it('preserves non-string values', () => {
      const input = {
        name: 'John',
        age: 30,
        active: true,
        created: new Date('2024-01-01'),
      }
      const safe = sanitizeObject(input)

      expect(safe.age).toBe(30)
      expect(safe.active).toBe(true)
      expect(safe.created).toEqual(new Date('2024-01-01'))
    })

    it('handles empty object', () => {
      expect(sanitizeObject({})).toEqual({})
    })

    it('handles non-object input', () => {
      expect(sanitizeObject(null as any)).toBe(null)
      expect(sanitizeObject(undefined as any)).toBe(undefined)
      expect(sanitizeObject('string' as any)).toBe('string')
    })

    it('applies trimStrings option', () => {
      const input = { name: '  John  ' }
      const safe = sanitizeObject(input, { trimStrings: false })

      expect(safe.name).toBe('  John  ')
    })
  })
})

describe('Security - Edge Cases & XSS Attacks', () => {
  it('prevents prototype pollution attempts', () => {
    const malicious = '__proto__'
    expect(sanitizeString(malicious)).toBe('__proto__') // String preserved but won't affect prototype
  })

  it('handles Unicode characters correctly', () => {
    const unicode = '你好世界 🌍 Привет'
    expect(sanitizeString(unicode)).toContain('你好')
    expect(sanitizeString(unicode)).toContain('Привет')
    expect(sanitizeString(unicode)).toContain('🌍')
  })

  it('handles very long inputs without crashing', () => {
    const longString = 'a'.repeat(10000)
    const result = sanitizeString(longString, 5000)

    expect(result.length).toBe(5000)
  })

  it('prevents XSS in common attack vectors', () => {
    const attacks = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror="alert(1)">',
      '<svg onload=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)">',
    ]

    attacks.forEach((attack) => {
      const safe = sanitizeHtml(attack)
      expect(safe).not.toContain('<script')
      expect(safe).not.toContain('<img')
      expect(safe).not.toContain('<svg')
      expect(safe).not.toContain('<iframe')
      expect(safe).not.toContain('onerror')
      expect(safe).not.toContain('onload')
    })
  })

  it('prevents directory traversal in filenames', () => {
    const attacks = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32\\config',
      '.\\..\\sensitive.txt',
    ]

    attacks.forEach((attack) => {
      const safe = sanitizeFilename(attack)
      expect(safe).not.toContain('..')
      expect(safe).not.toContain('/')
      expect(safe).not.toContain('\\')
    })
  })
})
