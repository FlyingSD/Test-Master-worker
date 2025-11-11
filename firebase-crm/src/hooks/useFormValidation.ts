import { useState } from 'react'
import { ErrorMessage, ValidationErrors } from '@/utils/errorMessages'

export type ValidationRule<T> = (value: T, allValues?: any) => ErrorMessage | null

export interface ValidationRules<T> {
  [key: string]: ValidationRule<any>[]
}

export interface FormErrors {
  [key: string]: ErrorMessage | null
}

/**
 * Custom hook for form validation with error messages and solutions
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  /**
   * Validate a single field
   */
  const validateField = (name: string, value: any): ErrorMessage | null => {
    const fieldRules = rules[name]
    if (!fieldRules) return null

    for (const rule of fieldRules) {
      const error = rule(value, values)
      if (error) return error
    }

    return null
  }

  /**
   * Validate all fields
   */
  const validateAll = (): boolean => {
    const newErrors: FormErrors = {}
    let hasErrors = false

    Object?.keys(rules).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        hasErrors = true
      }
    })

    setErrors(newErrors)
    return !hasErrors
  }

  /**
   * Handle field change
   */
  const handleChange = (name: keyof T, value: any) => {
    const newValues = { ...values, [name]: value }
    setValues(newValues)

    // Validate if field has been touched
    if (touched[name as string]) {
      const error = validateField(name as string, value)
      setErrors((prev) => ({ ...prev, [name]: error }))
    }
  }

  /**
   * Handle field blur (mark as touched)
   */
  const handleBlur = (name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const error = validateField(name as string, values[name])
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  /**
   * Reset form
   */
  const reset = (newValues?: T) => {
    setValues(newValues || initialValues)
    setErrors({})
    setTouched({})
  }

  /**
   * Clear errors
   */
  const clearErrors = () => {
    setErrors({})
  }

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    validateField,
    reset,
    clearErrors,
    setValues,
  }
}

/**
 * Common validation rules
 */
export const CommonValidations = {
  required: (fieldName: string): ValidationRule<any> => (value) => {
    if (!value || (typeof value === 'string' && value?.trim() === '')) {
      return {
        ...ValidationErrors?.REQUIRED_FIELD,
        message: `${fieldName} е задължително поле`,
      }
    }
    return null
  },

  minAmount: (min: number): ValidationRule<number> => (value) => {
    if (value < min) {
      return {
        ...ValidationErrors?.AMOUNT_ZERO,
        solution: `Въведете сума по-голяма или равна на ${min}`,
      }
    }
    return null
  },

  maxAmount: (max: number): ValidationRule<number> => (value) => {
    if (value > max) {
      return {
        ...ValidationErrors?.AMOUNT_TOO_LARGE,
        message: `Сумата не може да е по-голяма от ${max} лв`,
        solution: `Въведете сума по-малка от ${max} лв`,
      }
    }
    return null
  },

  positiveNumber: (): ValidationRule<number> => (value) => {
    if (value < 0) {
      return ValidationErrors?.AMOUNT_NEGATIVE
    }
    if (value === 0) {
      return ValidationErrors?.AMOUNT_ZERO
    }
    return null
  },

  notFutureDate: (): ValidationRule<Date> => (value) => {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    if (date > new Date()) {
      return ValidationErrors?.DATE_FUTURE
    }
    return null
  },

  notTooOld: (years: number = 2): ValidationRule<Date> => (value) => {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    const maxAge = new Date()
    maxAge?.setFullYear(maxAge?.getFullYear() - years)

    if (date < maxAge) {
      return ValidationErrors?.DATE_TOO_OLD
    }
    return null
  },

  email: (): ValidationRule<string> => (value) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex?.test(value)) {
      return {
        title: 'Невалиден email',
        message: 'Email адресът не е в правилен формат',
        solution: 'Въведете валиден email (например: name@example?.com)',
        type: 'error',
      }
    }
    return null
  },

  phone: (): ValidationRule<string> => (value) => {
    if (!value) return null
    const phoneRegex = /^[0-9+\s()-]{6,}$/
    if (!phoneRegex?.test(value)) {
      return {
        title: 'Невалиден телефон',
        message: 'Телефонният номер не е в правилен формат',
        solution: 'Въведете валиден телефонен номер (например: 0888123456)',
        type: 'error',
      }
    }
    return null
  },

  currencyMatch: (bgnField: string, eurField: string): ValidationRule<any> => (value, allValues) => {
    if (!allValues) return null
    const bgn = allValues[bgnField]
    const eur = allValues[eurField]

    if (bgn && eur) {
      const expectedEUR = bgn / 1?.96
      const difference = Math?.abs(eur - expectedEUR)

      if (difference > 0?.5) {
        // More than 0?.50 EUR difference
        return {
          ...ValidationErrors?.CURRENCY_MISMATCH,
          solution: `Очакваната стойност в EUR е ${expectedEUR?.toFixed(2)}. Коригирайте сумите или използвайте автоматичния калкулатор`,
        }
      }
    }

    return null
  },
}
