import { describe, it, expect, beforeEach } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import {
  toTimestamp,
  toDate,
  convertDatesToTimestamps,
  startOfDay,
  endOfDay,
  addDays,
  subtractDays,
  addMonths,
  subtractMonths,
  diffInDays,
  diffInMonths,
  isToday,
  isFuture,
  isPast,
  isSameDay,
  isSameMonth,
  isWeekend,
  isWithinRange,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  formatDate,
  formatDateTime,
  formatTime,
  formatDateISO,
  formatMonth,
  formatYear,
  parseDate,
  parseDateSafe,
  getMonthName,
  getDayName,
  getWeekNumber,
  getQuarter,
  getAge,
  getDaysInMonth,
  isLeapYear,
  getBusinessDays,
  addBusinessDays,
} from './date'

describe('Date Utilities - Conversion', () => {
  describe('toTimestamp', () => {
    it('converts Date to Timestamp', () => {
      const date = new Date('2024-01-15')
      const timestamp = toTimestamp(date)

      expect(timestamp).toBeInstanceOf(Timestamp)
      expect(timestamp.toDate().toDateString()).toBe(date.toDateString())
    })

    it('returns Timestamp unchanged', () => {
      const timestamp = Timestamp.fromDate(new Date('2024-01-15'))
      const result = toTimestamp(timestamp)

      expect(result).toBe(timestamp)
    })
  })

  describe('toDate', () => {
    it('converts Timestamp to Date', () => {
      const originalDate = new Date('2024-01-15')
      const timestamp = Timestamp.fromDate(originalDate)
      const result = toDate(timestamp)

      expect(result).toBeInstanceOf(Date)
      expect(result.toDateString()).toBe(originalDate.toDateString())
    })

    it('returns Date unchanged', () => {
      const date = new Date('2024-01-15')
      const result = toDate(date)

      expect(result).toBe(date)
    })
  })

  describe('convertDatesToTimestamps', () => {
    it('converts specified date fields to timestamps', () => {
      const obj = {
        name: 'John',
        dueDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        description: 'Test'
      }

      const result = convertDatesToTimestamps(obj, ['dueDate', 'createdAt'])

      expect(result.name).toBe('John')
      expect(result.description).toBe('Test')
      expect(result.dueDate).toBeInstanceOf(Timestamp)
      expect(result.createdAt).toBeInstanceOf(Timestamp)
    })

    it('handles non-Date values gracefully', () => {
      const obj = {
        name: 'John',
        dueDate: null,
        createdAt: undefined
      }

      const result = convertDatesToTimestamps(obj, ['dueDate', 'createdAt'])

      expect(result.name).toBe('John')
      expect(result.dueDate).toBeNull()
      expect(result.createdAt).toBeUndefined()
    })
  })
})

describe('Date Utilities - Calculations', () => {
  describe('startOfDay', () => {
    it('returns start of day (00:00:00)', () => {
      const date = new Date('2024-01-15 15:30:45')
      const result = startOfDay(date)

      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
      expect(result.getMilliseconds()).toBe(0)
    })

    it('defaults to today', () => {
      const result = startOfDay()
      const today = new Date()

      expect(result.getDate()).toBe(today.getDate())
      expect(result.getMonth()).toBe(today.getMonth())
      expect(result.getFullYear()).toBe(today.getFullYear())
      expect(result.getHours()).toBe(0)
    })
  })

  describe('endOfDay', () => {
    it('returns end of day (23:59:59)', () => {
      const date = new Date('2024-01-15 10:30:45')
      const result = endOfDay(date)

      expect(result.getHours()).toBe(23)
      expect(result.getMinutes()).toBe(59)
      expect(result.getSeconds()).toBe(59)
      expect(result.getMilliseconds()).toBe(999)
    })
  })

  describe('addDays', () => {
    it('adds days correctly', () => {
      const date = new Date('2024-01-15')
      const result = addDays(date, 5)

      expect(result.getDate()).toBe(20)
    })

    it('handles month overflow', () => {
      const date = new Date('2024-01-30')
      const result = addDays(date, 5)

      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(4)
    })
  })

  describe('subtractDays', () => {
    it('subtracts days correctly', () => {
      const date = new Date('2024-01-15')
      const result = subtractDays(date, 5)

      expect(result.getDate()).toBe(10)
    })

    it('handles month underflow', () => {
      const date = new Date('2024-02-05')
      const result = subtractDays(date, 10)

      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(26)
    })
  })

  describe('diffInDays', () => {
    it('calculates difference in days', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-15')

      expect(diffInDays(date2, date1)).toBe(14)
      expect(diffInDays(date1, date2)).toBe(-14)
    })

    it('returns 0 for same day', () => {
      const date = new Date('2024-01-15')

      expect(diffInDays(date, date)).toBe(0)
    })
  })
})

describe('Date Utilities - Comparison', () => {
  let today: Date
  let yesterday: Date
  let tomorrow: Date

  beforeEach(() => {
    today = new Date()
    yesterday = subtractDays(today, 1)
    tomorrow = addDays(today, 1)
  })

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(today)).toBe(true)
    })

    it('returns false for other days', () => {
      expect(isToday(yesterday)).toBe(false)
      expect(isToday(tomorrow)).toBe(false)
    })
  })

  describe('isFuture', () => {
    it('returns true for future dates', () => {
      expect(isFuture(tomorrow)).toBe(true)
    })

    it('returns false for past dates', () => {
      expect(isFuture(yesterday)).toBe(false)
    })
  })

  describe('isPast', () => {
    it('returns true for past dates', () => {
      expect(isPast(yesterday)).toBe(true)
    })

    it('returns false for future dates', () => {
      expect(isPast(tomorrow)).toBe(false)
    })
  })

  describe('isSameDay', () => {
    it('returns true for same day', () => {
      const date1 = new Date('2024-01-15 10:00:00')
      const date2 = new Date('2024-01-15 18:00:00')

      expect(isSameDay(date1, date2)).toBe(true)
    })

    it('returns false for different days', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-16')

      expect(isSameDay(date1, date2)).toBe(false)
    })
  })

  describe('isWithinRange', () => {
    it('returns true for date within range', () => {
      const date = new Date('2024-01-15')
      const start = new Date('2024-01-10')
      const end = new Date('2024-01-20')

      expect(isWithinRange(date, start, end)).toBe(true)
    })

    it('returns false for date outside range', () => {
      const date = new Date('2024-01-25')
      const start = new Date('2024-01-10')
      const end = new Date('2024-01-20')

      expect(isWithinRange(date, start, end)).toBe(false)
    })
  })
})

describe('Date Utilities - Formatting', () => {
  const testDate = new Date('2024-01-15 14:30:45')

  describe('formatDate', () => {
    it('formats date in Bulgarian format', () => {
      const result = formatDate(testDate)

      expect(result).toMatch(/15\.01\.2024/)
    })
  })

  describe('formatDateTime', () => {
    it('formats date and time', () => {
      const result = formatDateTime(testDate)

      expect(result).toContain('15.01.2024')
      expect(result).toContain('14:30')
    })
  })

  describe('formatTime', () => {
    it('formats time only', () => {
      const result = formatTime(testDate)

      expect(result).toBe('14:30')
    })
  })

  describe('formatDateISO', () => {
    it('formats date in ISO format', () => {
      const result = formatDateISO(testDate)

      expect(result).toBe('2024-01-15')
    })
  })

  describe('formatMonth', () => {
    it('formats month and year', () => {
      const result = formatMonth(testDate)

      expect(result).toMatch(/януари 2024/i)
    })
  })
})

describe('Date Utilities - Parsing', () => {
  describe('parseDate', () => {
    it('parses ISO date string', () => {
      const result = parseDate('2024-01-15')

      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(15)
    })

    it('returns Date unchanged', () => {
      const date = new Date('2024-01-15')
      const result = parseDate(date)

      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('parseDateSafe', () => {
    it('parses valid date string', () => {
      const result = parseDateSafe('2024-01-15')

      expect(result).toBeInstanceOf(Date)
    })

    it('returns null for invalid date string', () => {
      const result = parseDateSafe('invalid-date')

      expect(result).toBeNull()
    })
  })
})

describe('Date Utilities - Helpers', () => {
  describe('getAge', () => {
    it('calculates age correctly', () => {
      const birthDate = new Date('2010-01-15')
      const now = new Date('2024-01-15')

      const age = getAge(birthDate, now)

      expect(age).toBe(14)
    })

    it('handles birthday not yet passed this year', () => {
      const birthDate = new Date('2010-06-15')
      const now = new Date('2024-01-15')

      const age = getAge(birthDate, now)

      expect(age).toBe(13)
    })
  })

  describe('getDaysInMonth', () => {
    it('returns correct days for regular month', () => {
      const date = new Date('2024-01-15')

      expect(getDaysInMonth(date)).toBe(31)
    })

    it('returns correct days for February in leap year', () => {
      const date = new Date('2024-02-15')

      expect(getDaysInMonth(date)).toBe(29)
    })

    it('returns correct days for February in non-leap year', () => {
      const date = new Date('2023-02-15')

      expect(getDaysInMonth(date)).toBe(28)
    })
  })

  describe('isLeapYear', () => {
    it('returns true for leap year', () => {
      expect(isLeapYear(2024)).toBe(true)
      expect(isLeapYear(2000)).toBe(true)
    })

    it('returns false for non-leap year', () => {
      expect(isLeapYear(2023)).toBe(false)
      expect(isLeapYear(1900)).toBe(false)
    })
  })

  describe('getQuarter', () => {
    it('returns correct quarter', () => {
      expect(getQuarter(new Date('2024-01-15'))).toBe(1)
      expect(getQuarter(new Date('2024-04-15'))).toBe(2)
      expect(getQuarter(new Date('2024-07-15'))).toBe(3)
      expect(getQuarter(new Date('2024-10-15'))).toBe(4)
    })
  })

  describe('getWeekNumber', () => {
    it('returns week number', () => {
      const week = getWeekNumber(new Date('2024-01-15'))

      expect(week).toBeGreaterThan(0)
      expect(week).toBeLessThanOrEqual(53)
    })
  })

  describe('isWeekend', () => {
    it('returns true for Saturday and Sunday', () => {
      const saturday = new Date('2024-01-13') // Saturday
      const sunday = new Date('2024-01-14')   // Sunday

      expect(isWeekend(saturday)).toBe(true)
      expect(isWeekend(sunday)).toBe(true)
    })

    it('returns false for weekdays', () => {
      const monday = new Date('2024-01-15')

      expect(isWeekend(monday)).toBe(false)
    })
  })
})

describe('Date Utilities - Business Days', () => {
  describe('getBusinessDays', () => {
    it('counts business days excluding weekends', () => {
      const start = new Date('2024-01-08') // Monday
      const end = new Date('2024-01-12')   // Friday

      // Monday to Friday = 5 business days
      const result = getBusinessDays(start, end)

      expect(result).toBe(5)
    })

    it('excludes weekends from count', () => {
      const start = new Date('2024-01-08') // Monday
      const end = new Date('2024-01-15')   // Next Monday

      // 2 weeks = 10 business days (excluding 2 weekends)
      const result = getBusinessDays(start, end)

      expect(result).toBe(6) // Mon-Fri (5) + Mon (1)
    })
  })

  describe('addBusinessDays', () => {
    it('adds business days excluding weekends', () => {
      const start = new Date('2024-01-08') // Monday
      const result = addBusinessDays(start, 5)

      // Adding 5 business days to Monday = next Monday
      expect(result.getDay()).toBe(1) // Monday
    })

    it('skips weekends', () => {
      const friday = new Date('2024-01-12') // Friday
      const result = addBusinessDays(friday, 1)

      // Friday + 1 business day = Monday
      expect(result.getDay()).toBe(1) // Monday
      expect(result.getDate()).toBe(15)
    })
  })
})

describe('Date Utilities - Range Helpers', () => {
  describe('getStartOfWeek', () => {
    it('returns Monday of the week', () => {
      const wednesday = new Date('2024-01-17') // Wednesday
      const result = getStartOfWeek(wednesday)

      expect(result.getDay()).toBe(1) // Monday
      expect(result.getDate()).toBe(15)
    })
  })

  describe('getEndOfWeek', () => {
    it('returns Sunday of the week', () => {
      const wednesday = new Date('2024-01-17') // Wednesday
      const result = getEndOfWeek(wednesday)

      expect(result.getDay()).toBe(0) // Sunday
      expect(result.getDate()).toBe(21)
    })
  })

  describe('getStartOfMonth', () => {
    it('returns first day of month', () => {
      const date = new Date('2024-01-15')
      const result = getStartOfMonth(date)

      expect(result.getDate()).toBe(1)
      expect(result.getMonth()).toBe(0)
    })
  })

  describe('getEndOfMonth', () => {
    it('returns last day of month', () => {
      const date = new Date('2024-01-15')
      const result = getEndOfMonth(date)

      expect(result.getDate()).toBe(31)
      expect(result.getMonth()).toBe(0)
    })
  })
})
