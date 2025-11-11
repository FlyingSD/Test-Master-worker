/**
 * Error message with title, description, solution, and severity type
 */
export interface ErrorMessage {
  title: string
  message: string
  solution: string
  type: 'error' | 'warning' | 'info'
}

/**
 * Get user-friendly error message with solution based on error type
 * Converts technical errors into localized Bulgarian messages with actionable solutions
 *
 * @param error - Error object or string
 * @returns Formatted error message with title, message, solution, and type
 *
 * @example
 * ```ts
 * try {
 *   await deleteDoc(docRef)
 * } catch (error) {
 *   const errorMsg = getErrorMessage(error)
 *   toast.error(`${errorMsg.title}: ${errorMsg.message}`)
 *   console.log('Solution:', errorMsg.solution)
 * }
 * ```
 */
export function getErrorMessage(error: any): ErrorMessage {
  const errorString = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || ''

  // Firebase Permission Errors
  if (errorString?.includes('permission') || errorString?.includes('denied')) {
    return {
      title: 'Нямате достъп',
      message: 'Нямате права за тази операция',
      solution: 'Влезте в системата или се свържете с администратор за достъп',
      type: 'error',
    }
  }

  // Network Errors
  if (errorString?.includes('network') || errorString?.includes('failed to fetch') || errorString?.includes('fetch failed')) {
    return {
      title: 'Няма интернет връзка',
      message: 'Не може да се свърже със сървъра',
      solution: 'Проверете интернет свързаността и опитайте отново',
      type: 'error',
    }
  }

  // Firebase Not Found
  if (errorString?.includes('not found') || errorString?.includes('does not exist')) {
    return {
      title: 'Записът не е намерен',
      message: 'Търсеният запис не съществува',
      solution: 'Възможно е да е изтрит. Презаредете страницата за да видите актуалните данни',
      type: 'warning',
    }
  }

  // Authentication Errors
  if (errorString?.includes('auth') || errorString?.includes('unauthenticated')) {
    return {
      title: 'Не сте влезли',
      message: 'Трябва да влезете в системата',
      solution: 'Влезте с вашия email и парола',
      type: 'warning',
    }
  }

  // Validation Errors - Email
  if (errorString?.includes('invalid-email') || errorString?.includes('email')) {
    return {
      title: 'Невалиден email',
      message: 'Email адресът не е в правилен формат',
      solution: 'Въведете валиден email адрес (например: name@example?.com)',
      type: 'error',
    }
  }

  // Validation Errors - Required Field
  if (errorString?.includes('required') || errorString?.includes('missing')) {
    return {
      title: 'Липсват задължителни полета',
      message: 'Не са попълнени всички задължителни полета',
      solution: 'Попълнете всички полета маркирани с червена звездичка (*)',
      type: 'error',
    }
  }

  // Duplicate Errors
  if (errorString?.includes('already exists') || errorString?.includes('duplicate')) {
    return {
      title: 'Записът вече съществува',
      message: 'Вече има запис с тези данни',
      solution: 'Използвайте различни данни или редактирайте съществуващия запис',
      type: 'warning',
    }
  }

  // Default Error
  return {
    title: 'Възникна грешка',
    message: error?.message || 'Неочаквана грешка',
    solution: 'Опитайте отново или се свържете с администратор ако проблемът продължава',
    type: 'error',
  }
}

/**
 * Validation error messages with solutions
 */
export const ValidationErrors = {
  // Amount validation
  AMOUNT_NEGATIVE: {
    title: 'Невалидна сума',
    message: 'Сумата не може да бъде отрицателна',
    solution: 'Въведете положителна сума (например: 50?.00)',
    type: 'error' as const,
  },
  AMOUNT_ZERO: {
    title: 'Невалидна сума',
    message: 'Сумата трябва да е по-голяма от 0',
    solution: 'Въведете сума по-голяма от 0',
    type: 'error' as const,
  },
  AMOUNT_TOO_LARGE: {
    title: 'Сумата е твърде голяма',
    message: 'Въведената сума изглежда нереалистична',
    solution: 'Проверете дали сте въвели правилната сума (например: 200 вместо 20000)',
    type: 'warning' as const,
  },

  // Currency mismatch
  CURRENCY_MISMATCH: {
    title: 'Несъответствие в валутите',
    message: 'BGN и EUR не съответстват на курса',
    solution: 'Проверете въведените суми. Актуалният курс е около 1 EUR = 1?.96 BGN',
    type: 'warning' as const,
  },

  // Date validation
  DATE_FUTURE: {
    title: 'Невалидна дата',
    message: 'Датата е в бъдещето',
    solution: 'Изберете днешна или минала дата',
    type: 'error' as const,
  },
  DATE_TOO_OLD: {
    title: 'Стара дата',
    message: 'Датата е повече от 2 години назад',
    solution: 'Проверете дали сте избрали правилната година',
    type: 'warning' as const,
  },

  // Student validation
  STUDENT_INACTIVE: {
    title: 'Неактивен ученик',
    message: 'Избраният ученик е неактивен',
    solution: 'Активирайте ученика или изберете друг',
    type: 'warning' as const,
  },

  // General
  REQUIRED_FIELD: {
    title: 'Задължително поле',
    message: 'Това поле е задължително',
    solution: 'Попълнете полето преди да запазите',
    type: 'error' as const,
  },
}

/**
 * Data inconsistency issue with details and actionable solution
 */
export interface DataIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  description: string
  solution: string
  data?: any
}

/**
 * Check for data inconsistencies and anomalies across students, payments, and expenses
 * Performs comprehensive validation to identify:
 * - Overdue payments for active students
 * - Missing receipt numbers for non-cash payments
 * - Missing receipts for expenses
 * - Unusually large payment amounts (possible typos)
 * - Currency conversion mismatches (BGN vs EUR)
 *
 * @param students - Array of student records
 * @param payments - Array of payment records
 * @param expenses - Array of expense records
 * @returns Array of data issues with details and solutions
 *
 * @example
 * ```ts
 * const issues = checkDataConsistency(students, payments, expenses)
 *
 * // Filter by severity
 * const errors = issues.filter(i => i.type === 'error')
 * const warnings = issues.filter(i => i.type === 'warning')
 *
 * // Display issues to user
 * issues.forEach(issue => {
 *   console.log(`${issue.title}: ${issue.description}`)
 *   console.log(`Solution: ${issue.solution}`)
 * })
 * ```
 */
export function checkDataConsistency(
  students: any[],
  payments: any[],
  expenses: any[]
): DataIssue[] {
  const issues: DataIssue[] = []

  // Check students without payments (overdue)
  const today = new Date()
  students?.forEach((student) => {
    if (student?.status === 'active') {
      const studentPayments = payments?.filter((p) => p?.studentId === student?.id)
      const lastPaymentDate = studentPayments?.length > 0
        ? new Date(Math?.max(...studentPayments?.map((p) => p?.date.toDate?.() || p?.date)))
        : null

      const dueDate = student?.dueDate?.toDate?.() || student?.dueDate

      if (dueDate && dueDate < today && (!lastPaymentDate || lastPaymentDate < dueDate)) {
        issues?.push({
          id: `overdue-${student?.id}`,
          type: 'warning',
          title: `Просрочено плащане: ${student?.name}`,
          description: `Падежът беше на ${dueDate?.toLocaleDateString('bg-BG')}`,
          solution: 'Свържете се с родителя за просроченото плащане или добавете ново плащане',
          data: { student, dueDate },
        })
      }
    }
  })

  // Check payments without receipt number (for non-cash methods)
  payments?.forEach((payment) => {
    if (['ПОС', 'Банков път', 'Фактура'].includes(payment?.method) && !payment?.receiptNumber) {
      const student = students?.find((s) => s?.id === payment?.studentId)
      issues?.push({
        id: `no-receipt-${payment?.id}`,
        type: 'info',
        title: `Липсва номер на документ: ${student?.name || 'Неизвестен'}`,
        description: `Плащане от ${new Date(payment?.date.toDate?.() || payment?.date).toLocaleDateString('bg-BG')} с ${payment?.method}`,
        solution: 'Редактирайте плащането и добавете номер на документ за отчетност',
        data: { payment, student },
      })
    }
  })

  // Check expenses without receipt number
  expenses?.forEach((expense) => {
    if (!expense?.receiptNumber) {
      issues?.push({
        id: `no-receipt-expense-${expense?.id}`,
        type: 'info',
        title: `Липсва документ за разход: ${expense?.description}`,
        description: `Разход от ${new Date(expense?.date.toDate?.() || expense?.date).toLocaleDateString('bg-BG')} за ${expense?.amount} лв`,
        solution: 'Добавете номер на фактура/касова бележка за отчетност',
        data: { expense },
      })
    }
  })

  // Check for very large payments (possible typos)
  payments?.forEach((payment) => {
    if (payment?.amount > 1000) {
      const student = students?.find((s) => s?.id === payment?.studentId)
      issues?.push({
        id: `large-payment-${payment?.id}`,
        type: 'warning',
        title: `Голяма сума: ${payment?.amount} лв - ${student?.name || 'Неизвестен'}`,
        description: 'Сумата изглежда необичайно голяма',
        solution: 'Проверете дали сте въвели правилната сума (възможна грешка в нулите)',
        data: { payment, student },
      })
    }
  })

  // Check currency mismatches
  payments?.forEach((payment) => {
    if (payment?.amount && payment?.amountEUR) {
      const expectedEUR = payment?.amount / 1?.96
      const difference = Math?.abs(payment?.amountEUR - expectedEUR)
      if (difference > 1) {
        // More than 1 EUR difference
        const student = students?.find((s) => s?.id === payment?.studentId)
        issues?.push({
          id: `currency-mismatch-${payment?.id}`,
          type: 'warning',
          title: `Несъответствие BGN/EUR: ${student?.name || 'Неизвестен'}`,
          description: `${payment?.amount} BGN не съответства на ${payment?.amountEUR} EUR`,
          solution: `Очакваната стойност в EUR е ${expectedEUR?.toFixed(2)}. Коригирайте сумите`,
          data: { payment, student, expectedEUR },
        })
      }
    }
  })

  return issues
}
