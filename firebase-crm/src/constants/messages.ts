/**
 * 🎯 SSOT (Single Source of Truth) - User-Facing Messages
 *
 * Centralizes all toast messages, error messages, and success messages.
 * Benefits:
 * - Consistent messaging across the application
 * - Easy localization/translation in the future
 * - Single place to update messages
 * - Reduces typos and inconsistencies
 */

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  // Authentication & Authorization
  NOT_LOGGED_IN: 'Не сте влезли в системата',
  NO_PERMISSION: 'Нямате права за тази операция',
  NO_PERMISSION_EDIT_STUDENT: 'Нямате права да променяте този ученик',
  NO_PERMISSION_DELETE_STUDENT: 'Нямате права да изтриете този ученик',
  NO_PERMISSION_EDIT_PAYMENT: 'Нямате права да променяте това плащане',
  NO_PERMISSION_DELETE_PAYMENT: 'Нямате права да изтриете това плащане',
  NO_PERMISSION_EDIT_EXPENSE: 'Нямате права да променяте този разход',
  NO_PERMISSION_DELETE_EXPENSE: 'Нямате права да изтриете този разход',
  NO_PERMISSION_EDIT_HOMEWORK: 'Нямате права да променяте това домашно',
  NO_PERMISSION_DELETE_HOMEWORK: 'Нямате права да изтриете това домашно',
  NO_PERMISSION_EDIT_INVENTORY: 'Нямате права да променяте този артикул',
  NO_PERMISSION_DELETE_INVENTORY: 'Нямате права да изтриете този артикул',
  NO_PERMISSION_EDIT_INVOICE: 'Нямате права да променяте този документ',
  NO_PERMISSION_DELETE_INVOICE: 'Нямате права да изтриете този документ',
  NO_PERMISSION_EDIT_STUDENTS: 'Нямате права да променяте ученици',

  // Not Found Errors
  STUDENT_NOT_FOUND: 'Ученикът не е намерен',
  PAYMENT_NOT_FOUND: 'Плащането не е намерено',
  EXPENSE_NOT_FOUND: 'Разходът не е намерен',
  HOMEWORK_NOT_FOUND: 'Домашното не е намерено',
  INVENTORY_NOT_FOUND: 'Артикулът не е намерен',
  INVOICE_NOT_FOUND: 'Документът не е намерен',

  // Data Loading Errors
  LOAD_STUDENTS_ERROR: 'Грешка при зареждане на ученици',
  LOAD_PAYMENTS_ERROR: 'Грешка при зареждане на плащания',
  LOAD_EXPENSES_ERROR: 'Грешка при зареждане на разходи',
  LOAD_HOMEWORK_ERROR: 'Грешка при зареждане на домашни',
  LOAD_INVENTORY_ERROR: 'Грешка при зареждане на склада',
  LOAD_INVOICES_ERROR: 'Грешка при зареждане на фактури',
  LOAD_PARENTS_ERROR: 'Грешка при зареждане на родители',
  LOAD_EVENTS_ERROR: 'Грешка при зареждане на събития',
  LOAD_DISCOUNTS_ERROR: 'Грешка при зареждане на отстъпки',
  LOAD_ATTENDANCE_ERROR: 'Грешка при зареждане на присъствия',
  LOAD_GRADES_ERROR: 'Грешка при зареждане на оценки',
  LOAD_DATA_ERROR: 'Грешка при зареждане на данни',
  LOAD_DOCUMENT_ERROR: 'Грешка при зареждане на документ',

  // CRUD Operation Errors
  ADD_STUDENT_ERROR: 'Грешка при добавяне на ученик',
  UPDATE_STUDENT_ERROR: 'Грешка при обновяване на ученик',
  DELETE_STUDENT_ERROR: 'Грешка при изтриване на ученик',
  IMPORT_STUDENTS_ERROR: 'Грешка при импортиране на ученици',

  ADD_PAYMENT_ERROR: 'Грешка при добавяне на плащане',
  UPDATE_PAYMENT_ERROR: 'Грешка при обновяване на плащане',
  DELETE_PAYMENT_ERROR: 'Грешка при изтриване на плащане',

  ADD_EXPENSE_ERROR: 'Грешка при добавяне на разход',
  UPDATE_EXPENSE_ERROR: 'Грешка при обновяване на разход',
  DELETE_EXPENSE_ERROR: 'Грешка при изтриване на разход',

  ADD_HOMEWORK_ERROR: 'Грешка при добавяне на домашно',
  UPDATE_HOMEWORK_ERROR: 'Грешка при обновяване на домашно',
  DELETE_HOMEWORK_ERROR: 'Грешка при изтриване на домашно',

  ADD_INVENTORY_ERROR: 'Грешка при добавяне на артикул',
  UPDATE_INVENTORY_ERROR: 'Грешка при обновяване на артикул',
  DELETE_INVENTORY_ERROR: 'Грешка при изтриване на артикул',

  ADD_INVOICE_ERROR: 'Грешка при създаване на документ',
  UPDATE_INVOICE_ERROR: 'Грешка при обновяване на документ',
  DELETE_INVOICE_ERROR: 'Грешка при изтриване на документ',

  ADD_PARENT_ERROR: 'Грешка при добавяне на родител',
  UPDATE_PARENT_ERROR: 'Грешка при обновяване на родител',
  DELETE_PARENT_ERROR: 'Грешка при изтриване на родител',

  ADD_EVENT_ERROR: 'Грешка при добавяне на събитие',
  UPDATE_EVENT_ERROR: 'Грешка при обновяване на събитие',
  DELETE_EVENT_ERROR: 'Грешка при изтриване на събитие',

  ADD_DISCOUNT_ERROR: 'Грешка при добавяне на отстъпка',
  UPDATE_DISCOUNT_ERROR: 'Грешка при обновяване на отстъпка',
  DELETE_DISCOUNT_ERROR: 'Грешка при изтриване на отстъпка',

  ADD_ATTENDANCE_ERROR: 'Грешка при добавяне на присъствие',
  UPDATE_ATTENDANCE_ERROR: 'Грешка при обновяване на присъствие',
  DELETE_ATTENDANCE_ERROR: 'Грешка при изтриване на присъствие',
  BULK_ATTENDANCE_ERROR: 'Грешка при записване на присъствия',

  ADD_GRADE_ERROR: 'Грешка при добавяне на оценка',
  UPDATE_GRADE_ERROR: 'Грешка при обновяване на оценка',
  DELETE_GRADE_ERROR: 'Грешка при изтриване на оценка',

  // Authentication Errors
  LOGIN_ERROR: 'Грешка при вход в системата',
  LOGOUT_ERROR: 'Грешка при изход от системата',
  REGISTER_ERROR: 'Грешка при регистрация',
  INVALID_EMAIL: 'Невалиден имейл адрес',
  INVALID_PASSWORD: 'Невалидна парола',
  WEAK_PASSWORD: 'Паролата е твърде слаба (минимум 6 символа)',
  EMAIL_IN_USE: 'Този имейл вече се използва',
  WRONG_PASSWORD: 'Грешна парола',
  USER_NOT_FOUND: 'Потребителят не е намерен',
  TOO_MANY_REQUESTS: 'Твърде много опити. Моля опитайте по-късно',

  // Business Logic Errors
  INSUFFICIENT_STOCK: 'Недостатъчно количество на склад!',
  SYNC_DATA_ERROR: 'Грешка при синхронизиране на данните',
  PARENT_NOT_FOUND: 'Родителят не е намерен',
  EVENT_NOT_FOUND: 'Събитието не е намерено',
  DISCOUNT_NOT_FOUND: 'Отстъпката не е намерена',
  ATTENDANCE_NOT_FOUND: 'Присъствието не е намерено',
  GRADE_NOT_FOUND: 'Оценката не е намерена',

  // Generic Fallback
  GENERIC_ERROR: 'Възникна грешка',
} as const

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  // Student Operations
  STUDENT_ADDED: 'Ученикът беше добавен успешно!',
  STUDENT_UPDATED: 'Ученикът беше обновен успешно!',
  STUDENT_DELETED: 'Ученикът беше изтрит успешно!',
  STUDENTS_IMPORTED: 'Учениците бяха импортирани успешно!',

  // Payment Operations
  PAYMENT_ADDED: 'Плащането беше добавено успешно!',
  PAYMENT_UPDATED: 'Плащането беше обновено успешно!',
  PAYMENT_DELETED: 'Плащането беше изтрито успешно!',

  // Expense Operations
  EXPENSE_ADDED: 'Разходът беше добавен успешно!',
  EXPENSE_UPDATED: 'Разходът беше обновен успешно!',
  EXPENSE_DELETED: 'Разходът беше изтрит успешно!',

  // Homework Operations
  HOMEWORK_ADDED: 'Домашното беше добавено успешно!',
  HOMEWORK_UPDATED: 'Домашното беше обновено успешно!',
  HOMEWORK_DELETED: 'Домашното беше изтрито успешно!',

  // Inventory Operations
  INVENTORY_ADDED: 'Артикулът беше добавен успешно!',
  INVENTORY_UPDATED: 'Артикулът беше обновен успешно!',
  INVENTORY_DELETED: 'Артикулът беше изтрит успешно!',
  STOCK_TRANSACTION_ADDED: 'Движението беше записано успешно! Плащането е създадено автоматично.',

  // Invoice Operations
  INVOICE_ADDED: 'Документът беше създаден успешно!',
  INVOICE_UPDATED: 'Документът беше обновен успешно!',
  INVOICE_DELETED: 'Документът беше изтрит успешно!',
  INVOICE_MARKED_PAID: 'Документът беше маркиран като платен!',

  // Parent Operations
  PARENT_ADDED: 'Родителят беше добавен успешно!',
  PARENT_UPDATED: 'Родителят беше обновен успешно!',
  PARENT_DELETED: 'Родителят беше изтрит успешно!',

  // Event Operations
  EVENT_ADDED: 'Събитието беше добавено успешно!',
  EVENT_UPDATED: 'Събитието беше обновено успешно!',
  EVENT_DELETED: 'Събитието беше изтрито успешно!',

  // Discount Operations
  DISCOUNT_ADDED: 'Отстъпката беше добавена успешно!',
  DISCOUNT_UPDATED: 'Отстъпката беше обновена успешно!',
  DISCOUNT_DELETED: 'Отстъпката беше изтрита успешно!',

  // Attendance Operations
  ATTENDANCE_ADDED: 'Присъствието беше записано успешно!',
  ATTENDANCE_UPDATED: 'Присъствието беше обновено успешно!',
  ATTENDANCE_DELETED: 'Присъствието беше изтрито успешно!',
  BULK_ATTENDANCE_ADDED: 'Присъствията бяха записани успешно!',

  // Grade Operations
  GRADE_ADDED: 'Оценката беше добавена успешно!',
  GRADE_UPDATED: 'Оценката беше обновена успешно!',
  GRADE_DELETED: 'Оценката беше изтрита успешно!',

  // Authentication
  LOGIN_SUCCESS: 'Успешен вход в системата',
  LOGOUT_SUCCESS: 'Успешен изход от системата',
  REGISTER_SUCCESS: 'Регистрацията беше успешна',

  // Data Sync
  DATA_SYNCED: (count: number) => `Обновени ${count} записа с новото име на ученика`,
  INVENTORY_SYNCED: (count: number) => `Обновени ${count} складови транзакции с новото име`,
} as const

// ============================================================================
// TYPE EXPORTS (for TypeScript autocomplete)
// ============================================================================

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES
export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES
