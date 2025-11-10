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

  // Business Logic Errors
  INSUFFICIENT_STOCK: 'Недостатъчно количество на склад!',
  SYNC_DATA_ERROR: 'Грешка при синхронизиране на данните',

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

  // Data Sync
  DATA_SYNCED: (count: number) => `Обновени ${count} записа с новото име на ученика`,
  INVENTORY_SYNCED: (count: number) => `Обновени ${count} складови транзакции с новото име`,
} as const

// ============================================================================
// TYPE EXPORTS (for TypeScript autocomplete)
// ============================================================================

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES
export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES
