/**
 * Centralized error and success messages
 * SSOT for all user-facing messages
 *
 * Benefits:
 * - Consistent messaging
 * - Easy i18n preparation
 * - No duplicate strings
 * - Easy to update wording
 */

export const ERROR_MESSAGES = {
  // General errors
  GENERAL: {
    UNKNOWN: 'Възникна неочаквана грешка',
    NETWORK: 'Проблем с мрежата. Проверете интернет връзката',
    PERMISSION_DENIED: 'Нямате права за това действие',
    NOT_FOUND: 'Ресурсът не е намерен',
  },

  // Auth errors
  AUTH: {
    LOAD_FAILED: 'Грешка при зареждане на потребителски данни',
    LOGIN_FAILED: 'Грешка при влизане',
    USER_NOT_FOUND: 'Потребителят не е намерен',
    WRONG_PASSWORD: 'Грешна парола',
    INVALID_EMAIL: 'Невалиден имейл адрес',
    TOO_MANY_REQUESTS: 'Твърде много опити. Опитайте по-късно',
    EMAIL_IN_USE: 'Имейлът вече е използван',
    WEAK_PASSWORD: 'Паролата трябва да е поне 6 символа',
  },

  // Students
  STUDENTS: {
    LOAD_FAILED: 'Грешка при зареждане на ученици',
    ADD_FAILED: 'Грешка при добавяне на ученик',
    UPDATE_FAILED: 'Грешка при обновяване на ученик',
    DELETE_FAILED: 'Грешка при изтриване на ученик',
    NOT_FOUND: 'Ученикът не е намерен',
    IMPORT_FAILED: 'Грешка при импортиране на ученици',
  },

  // Payments
  PAYMENTS: {
    LOAD_FAILED: 'Грешка при зареждане на плащания',
    ADD_FAILED: 'Грешка при добавяне на плащане',
    UPDATE_FAILED: 'Грешка при обновяване на плащане',
    DELETE_FAILED: 'Грешка при изтриване на плащане',
    BULK_ADD_FAILED: 'Грешка при добавяне на плащания',
  },

  // Expenses
  EXPENSES: {
    LOAD_FAILED: 'Грешка при зареждане на разходи',
    ADD_FAILED: 'Грешка при добавяне на разход',
    UPDATE_FAILED: 'Грешка при обновяване на разход',
    DELETE_FAILED: 'Грешка при изтриване на разход',
  },

  // Inventory
  INVENTORY: {
    LOAD_FAILED: 'Грешка при зареждане на склада',
    ADD_FAILED: 'Грешка при добавяне на артикул',
    UPDATE_FAILED: 'Грешка при обновяване на артикул',
    DELETE_FAILED: 'Грешка при изтриване на артикул',
    INSUFFICIENT_STOCK: 'Недостатъчно количество на склад',
    TRANSACTION_FAILED: 'Грешка при записване на движението',
  },

  // Invoices
  INVOICES: {
    LOAD_FAILED: 'Грешка при зареждане на фактури',
    ADD_FAILED: 'Грешка при създаване на фактура',
    UPDATE_FAILED: 'Грешка при обновяване на фактура',
    DELETE_FAILED: 'Грешка при изтриване на фактура',
    MARK_PAID_FAILED: 'Грешка при маркиране като платена',
  },

  // Events
  EVENTS: {
    LOAD_FAILED: 'Грешка при зареждане на събития',
    ADD_FAILED: 'Грешка при създаване на събитие',
    UPDATE_FAILED: 'Грешка при обновяване на събитие',
    DELETE_FAILED: 'Грешка при изтриване на събитие',
  },

  // Homework
  HOMEWORK: {
    LOAD_FAILED: 'Грешка при зареждане на домашни',
    ADD_FAILED: 'Грешка при добавяне на домашно',
    UPDATE_FAILED: 'Грешка при обновяване на домашно',
    DELETE_FAILED: 'Грешка при изтриване на домашно',
  },

  // Parents
  PARENTS: {
    LOAD_FAILED: 'Грешка при зареждане на родители',
    ADD_FAILED: 'Грешка при добавяне на родител',
    UPDATE_FAILED: 'Грешка при обновяване на родител',
    DELETE_FAILED: 'Грешка при изтриване на родител',
  },

  // Discounts
  DISCOUNTS: {
    LOAD_FAILED: 'Грешка при зареждане на отстъпки',
    ADD_FAILED: 'Грешка при добавяне на отстъпка',
    UPDATE_FAILED: 'Грешка при обновяване на отстъпка',
    DELETE_FAILED: 'Грешка при изтриване на отстъпка',
  },

  // Attendance
  ATTENDANCE: {
    LOAD_FAILED: 'Грешка при зареждане на присъствия',
    SAVE_FAILED: 'Грешка при записване на присъствие',
  },
} as const

export const SUCCESS_MESSAGES = {
  // Auth
  AUTH: {
    LOGIN_SUCCESS: 'Влизането беше успешно',
    LOGIN_GOOGLE_SUCCESS: 'Влизането с Google беше успешно',
    SIGNUP_SUCCESS: 'Регистрацията беше успешна',
    LOGOUT_SUCCESS: 'Излязохте успешно',
  },

  // Students
  STUDENTS: {
    ADDED: 'Ученикът беше добавен успешно',
    UPDATED: 'Ученикът беше обновен успешно',
    DELETED: 'Ученикът беше изтрит успешно',
    IMPORTED: 'Учениците бяха импортирани успешно',
  },

  // Payments
  PAYMENTS: {
    ADDED: 'Плащането беше добавено успешно',
    UPDATED: 'Плащането беше обновено успешно',
    DELETED: 'Плащането беше изтрито успешно',
    BULK_ADDED: 'Плащанията бяха добавени успешно',
  },

  // Expenses
  EXPENSES: {
    ADDED: 'Разходът беше добавен успешно',
    UPDATED: 'Разходът беше обновен успешно',
    DELETED: 'Разходът беше изтрит успешно',
  },

  // Inventory
  INVENTORY: {
    ITEM_ADDED: 'Артикулът беше добавен успешно',
    ITEM_UPDATED: 'Артикулът беше обновен успешно',
    ITEM_DELETED: 'Артикулът беше изтрит успешно',
    TRANSACTION_ADDED: 'Движението беше записано успешно',
    TRANSACTION_WITH_PAYMENT: 'Движението беше записано успешно! Плащането е създадено автоматично.',
  },

  // Invoices
  INVOICES: {
    ADDED: 'Фактурата беше създадена успешно',
    UPDATED: 'Фактурата беше обновена успешно',
    DELETED: 'Фактурата беше изтрита успешно',
    MARKED_PAID: 'Фактурата беше маркирана като платена',
  },

  // Events
  EVENTS: {
    ADDED: 'Събитието беше създадено успешно',
    UPDATED: 'Събитието беше обновено успешно',
    DELETED: 'Събитието беше изтрито успешно',
  },

  // Homework
  HOMEWORK: {
    ADDED: 'Домашното беше добавено успешно',
    UPDATED: 'Домашното беше обновено успешно',
    DELETED: 'Домашното беше изтрито успешно',
  },

  // Parents
  PARENTS: {
    ADDED: 'Родителят беше добавен успешно',
    UPDATED: 'Родителят беше обновен успешно',
    DELETED: 'Родителят беше изтрит успешно',
  },

  // Discounts
  DISCOUNTS: {
    ADDED: 'Отстъпката беше добавена успешно',
    UPDATED: 'Отстъпката беше обновена успешно',
    DELETED: 'Отстъпката беше изтрита успешно',
  },

  // Attendance
  ATTENDANCE: {
    SAVED: 'Присъствието беше записано успешно',
  },

  // General
  GENERAL: {
    SAVED: 'Промените бяха запазени успешно',
    EXPORTED: 'Данните бяха експортирани успешно',
  },
} as const

/**
 * Helper to get error message with dynamic content
 */
export function getErrorMessage(error: Error): string {
  return error.message || ERROR_MESSAGES.GENERAL.UNKNOWN
}
