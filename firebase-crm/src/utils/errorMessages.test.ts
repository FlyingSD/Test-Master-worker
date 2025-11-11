import { describe, it, expect } from 'vitest'
import {
  getFirebaseErrorMessage,
  getValidationErrorMessage,
  getCRUDErrorMessage,
  getPaymentErrorMessage,
} from './errorMessages'

describe('Error Messages - Firebase Auth', () => {
  it('returns user-friendly message for auth/user-not-found', () => {
    const message = getFirebaseErrorMessage('auth/user-not-found')

    expect(message).toContain('Потребителят не е намерен')
  })

  it('returns user-friendly message for auth/wrong-password', () => {
    const message = getFirebaseErrorMessage('auth/wrong-password')

    expect(message).toContain('Грешна парола')
  })

  it('returns user-friendly message for auth/email-already-in-use', () => {
    const message = getFirebaseErrorMessage('auth/email-already-in-use')

    expect(message).toContain('вече съществува')
  })

  it('returns user-friendly message for auth/weak-password', () => {
    const message = getFirebaseErrorMessage('auth/weak-password')

    expect(message).toContain('слаба парола')
  })

  it('returns user-friendly message for auth/invalid-email', () => {
    const message = getFirebaseErrorMessage('auth/invalid-email')

    expect(message).toContain('Невалиден email')
  })

  it('returns user-friendly message for auth/too-many-requests', () => {
    const message = getFirebaseErrorMessage('auth/too-many-requests')

    expect(message).toContain('Твърде много опити')
  })
})

describe('Error Messages - Firestore', () => {
  it('returns user-friendly message for permission-denied', () => {
    const message = getFirebaseErrorMessage('permission-denied')

    expect(message).toContain('Нямате права')
  })

  it('returns user-friendly message for not-found', () => {
    const message = getFirebaseErrorMessage('not-found')

    expect(message).toContain('не съществува')
  })

  it('returns user-friendly message for already-exists', () => {
    const message = getFirebaseErrorMessage('already-exists')

    expect(message).toContain('вече съществува')
  })

  it('returns user-friendly message for failed-precondition', () => {
    const message = getFirebaseErrorMessage('failed-precondition')

    expect(message).toContain('Невалидна операция')
  })

  it('returns user-friendly message for unavailable', () => {
    const message = getFirebaseErrorMessage('unavailable')

    expect(message).toContain('временно недостъпна')
  })
})

describe('Error Messages - Network', () => {
  it('returns user-friendly message for network errors', () => {
    const message = getFirebaseErrorMessage('unavailable')

    expect(message).toContain('недостъпна')
  })

  it('returns generic message for unknown errors', () => {
    const message = getFirebaseErrorMessage('unknown-error-code')

    expect(message).toContain('Възникна грешка')
  })
})

describe('Error Messages - Validation', () => {
  it('returns message for required field', () => {
    const message = getValidationErrorMessage('required', 'name')

    expect(message).toContain('задължително')
    expect(message).toContain('name')
  })

  it('returns message for invalid email', () => {
    const message = getValidationErrorMessage('invalid-email')

    expect(message).toContain('Невалиден email')
  })

  it('returns message for invalid phone', () => {
    const message = getValidationErrorMessage('invalid-phone')

    expect(message).toContain('телефонен номер')
  })

  it('returns message for min length', () => {
    const message = getValidationErrorMessage('min-length', undefined, { min: 6 })

    expect(message).toContain('поне 6 символа')
  })

  it('returns message for max length', () => {
    const message = getValidationErrorMessage('max-length', undefined, { max: 100 })

    expect(message).toContain('максимум 100 символа')
  })

  it('returns message for invalid amount', () => {
    const message = getValidationErrorMessage('invalid-amount')

    expect(message).toContain('положително число')
  })

  it('returns message for future date', () => {
    const message = getValidationErrorMessage('future-date')

    expect(message).toContain('не може да бъде в бъдещето')
  })

  it('returns message for past date', () => {
    const message = getValidationErrorMessage('past-date')

    expect(message).toContain('не може да бъде в миналото')
  })
})

describe('Error Messages - CRUD Operations', () => {
  it('returns message for create success', () => {
    const message = getCRUDErrorMessage('create', 'student', 'success')

    expect(message).toContain('успешно')
    expect(message).toContain('добавен')
  })

  it('returns message for update success', () => {
    const message = getCRUDErrorMessage('update', 'student', 'success')

    expect(message).toContain('успешно')
    expect(message).toContain('обновен')
  })

  it('returns message for delete success', () => {
    const message = getCRUDErrorMessage('delete', 'student', 'success')

    expect(message).toContain('успешно')
    expect(message).toContain('изтрит')
  })

  it('returns message for create error', () => {
    const message = getCRUDErrorMessage('create', 'student', 'error')

    expect(message).toContain('Грешка')
    expect(message).toContain('добавяне')
  })

  it('returns message for update error', () => {
    const message = getCRUDErrorMessage('update', 'student', 'error')

    expect(message).toContain('Грешка')
    expect(message).toContain('обновяване')
  })

  it('returns message for delete error', () => {
    const message = getCRUDErrorMessage('delete', 'student', 'error')

    expect(message).toContain('Грешка')
    expect(message).toContain('изтриване')
  })
})

describe('Error Messages - Payment Validation', () => {
  it('returns message for amount too low', () => {
    const message = getPaymentErrorMessage('amount-too-low')

    expect(message).toContain('по-голяма от 0')
  })

  it('returns message for amount too high', () => {
    const message = getPaymentErrorMessage('amount-too-high')

    expect(message).toContain('твърде голяма')
  })

  it('returns message for currency mismatch', () => {
    const message = getPaymentErrorMessage('currency-mismatch')

    expect(message).toContain('Несъответствие')
    expect(message).toContain('валута')
  })

  it('returns message for missing receipt', () => {
    const message = getPaymentErrorMessage('missing-receipt')

    expect(message).toContain('номер на документ')
  })

  it('returns message for invalid date', () => {
    const message = getPaymentErrorMessage('invalid-date')

    expect(message).toContain('Невалидна дата')
  })

  it('returns message for student not found', () => {
    const message = getPaymentErrorMessage('student-not-found')

    expect(message).toContain('Ученикът не е намерен')
  })

  it('returns message for duplicate payment', () => {
    const message = getPaymentErrorMessage('duplicate-payment')

    expect(message).toContain('вече съществува')
  })
})

describe('Error Messages - Solutions', () => {
  it('includes solution for permission errors', () => {
    const message = getFirebaseErrorMessage('permission-denied')

    expect(message).toContain('Влезте в профила си')
  })

  it('includes solution for network errors', () => {
    const message = getFirebaseErrorMessage('unavailable')

    expect(message).toContain('интернет връзката')
  })

  it('includes solution for validation errors', () => {
    const message = getValidationErrorMessage('required', 'name')

    expect(message).toContain('Попълнете')
  })

  it('includes solution for payment errors', () => {
    const message = getPaymentErrorMessage('amount-too-low')

    expect(message).toContain('Въведете')
  })
})

describe('Error Messages - Multilingual Support', () => {
  it('returns Bulgarian messages by default', () => {
    const message = getFirebaseErrorMessage('auth/user-not-found')

    expect(message).toMatch(/[а-яА-Я]/) // Contains Cyrillic
  })

  it('returns consistent Bulgarian terminology', () => {
    const message1 = getCRUDErrorMessage('create', 'student', 'success')
    const message2 = getCRUDErrorMessage('update', 'student', 'success')
    const message3 = getCRUDErrorMessage('delete', 'student', 'success')

    // All should use "успешно"
    expect(message1).toContain('успешно')
    expect(message2).toContain('успешно')
    expect(message3).toContain('успешно')
  })
})

describe('Error Messages - Edge Cases', () => {
  it('handles empty error code', () => {
    const message = getFirebaseErrorMessage('')

    expect(message).toBeTruthy()
    expect(message.length).toBeGreaterThan(0)
  })

  it('handles null error code', () => {
    const message = getFirebaseErrorMessage(null as any)

    expect(message).toBeTruthy()
    expect(message.length).toBeGreaterThan(0)
  })

  it('handles undefined error code', () => {
    const message = getFirebaseErrorMessage(undefined as any)

    expect(message).toBeTruthy()
    expect(message.length).toBeGreaterThan(0)
  })

  it('handles special characters in field names', () => {
    const message = getValidationErrorMessage('required', 'first-name')

    expect(message).toContain('first-name')
  })

  it('handles very long field names', () => {
    const longFieldName = 'a'.repeat(100)
    const message = getValidationErrorMessage('required', longFieldName)

    expect(message).toContain(longFieldName)
  })
})

describe('Error Messages - Context Awareness', () => {
  it('provides context-specific messages for students', () => {
    const message = getCRUDErrorMessage('create', 'student', 'success')

    expect(message).toContain('Ученик')
  })

  it('provides context-specific messages for payments', () => {
    const message = getCRUDErrorMessage('create', 'payment', 'success')

    expect(message).toContain('Плащане')
  })

  it('provides context-specific messages for parents', () => {
    const message = getCRUDErrorMessage('create', 'parent', 'success')

    expect(message).toContain('Родител')
  })

  it('provides context-specific messages for expenses', () => {
    const message = getCRUDErrorMessage('create', 'expense', 'success')

    expect(message).toContain('Разход')
  })
})
