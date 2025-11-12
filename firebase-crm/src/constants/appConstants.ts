/**
 * 🎯 SSOT (Single Source of Truth) - Application Constants
 *
 * Centralized constants for business logic, configuration, and domain values.
 * Benefits:
 * - Single source of truth for all magic numbers
 * - Easy configuration changes
 * - Type safety with const assertions
 * - Clear business rules documentation
 */

// ============================================================================
// MAGIC NUMBERS & CONFIGURATION
// ============================================================================

/**
 * Currency and Financial Constants
 */
export const CURRENCY = {
  /**
   * BGN to EUR conversion rate (fixed by Bulgarian National Bank)
   * 1 EUR = 1.95583 BGN
   */
  BGN_TO_EUR_RATE: 1.95583,

  /**
   * Default currency for the system
   */
  DEFAULT_CURRENCY: 'BGN',

  /**
   * Supported currencies
   */
  SUPPORTED_CURRENCIES: ['BGN', 'EUR'] as const,
} as const

/**
 * Pagination Constants
 */
export const PAGINATION = {
  /**
   * Default page size for lists/tables
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * Maximum items to show per page
   */
  MAX_PAGE_SIZE: 100,

  /**
   * Page size options for dropdowns
   */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
} as const

/**
 * Firestore Query Limits
 */
export const FIRESTORE = {
  /**
   * Maximum items for 'in' query operator
   * Firestore limit is 10 items per 'in' query
   */
  MAX_IN_QUERY_SIZE: 10,

  /**
   * Maximum items per batch write
   * Firestore limit is 500 writes per batch
   */
  MAX_BATCH_SIZE: 500,

  /**
   * Default query limit for lists
   */
  DEFAULT_QUERY_LIMIT: 100,
} as const

/**
 * Date/Time Constants
 */
export const DATE_TIME = {
  /**
   * Milliseconds in a day
   */
  MS_PER_DAY: 24 * 60 * 60 * 1000,

  /**
   * Days to consider payment as "upcoming"
   */
  UPCOMING_DAYS: 7,

  /**
   * Default time for due dates (end of day)
   */
  DEFAULT_DUE_TIME: '23:59',
} as const

// ============================================================================
// DOMAIN VALUES & STATUS ENUMS
// ============================================================================

/**
 * Student Status Values
 */
export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export const STUDENT_STATUS_LABELS = {
  [STUDENT_STATUS?.ACTIVE]: 'Активен',
  [STUDENT_STATUS?.INACTIVE]: 'Неактивен',
} as const

/**
 * Student Study Types
 */
export const STUDY_TYPES = {
  GROUP: 'Групово',
  INDIVIDUAL: 'Индивидуално',
} as const

export const STUDY_TYPE_OPTIONS = [
  STUDY_TYPES?.GROUP,
  STUDY_TYPES?.INDIVIDUAL,
] as const

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  CASH: 'Кеш',
  POS: 'ПОС',
  BANK_TRANSFER: 'Банков път',
  INVOICE: 'Фактура',
} as const

export const PAYMENT_METHOD_OPTIONS = [
  PAYMENT_METHODS?.CASH,
  PAYMENT_METHODS?.POS,
  PAYMENT_METHODS?.BANK_TRANSFER,
  PAYMENT_METHODS?.INVOICE,
] as const

/**
 * Payment Article Types
 */
export const ARTICLE_TYPES = {
  NONE: '',
  ABACUS: 'Абакус',
  WORKBOOK: 'Учебна тетрадка',
  OTHER: 'Други',
} as const

export const ARTICLE_TYPE_OPTIONS = [
  ARTICLE_TYPES?.NONE,
  ARTICLE_TYPES?.ABACUS,
  ARTICLE_TYPES?.WORKBOOK,
  ARTICLE_TYPES?.OTHER,
] as const

/**
 * Expense Categories
 */
export const EXPENSE_CATEGORIES = {
  RENT: 'Наем',
  ELECTRICITY: 'Ток',
  WATER: 'Вода',
  INTERNET: 'Интернет',
  SALARIES: 'Заплати',
  MATERIALS: 'Материали',
  ADVERTISING: 'Реклама',
  OTHER: 'Други',
} as const

export const EXPENSE_CATEGORY_OPTIONS = [
  EXPENSE_CATEGORIES?.RENT,
  EXPENSE_CATEGORIES?.ELECTRICITY,
  EXPENSE_CATEGORIES?.WATER,
  EXPENSE_CATEGORIES?.INTERNET,
  EXPENSE_CATEGORIES?.SALARIES,
  EXPENSE_CATEGORIES?.MATERIALS,
  EXPENSE_CATEGORIES?.ADVERTISING,
  EXPENSE_CATEGORIES?.OTHER,
] as const

/**
 * Attendance Status Values
 */
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
} as const

export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS?.PRESENT]: 'Присъства',
  [ATTENDANCE_STATUS?.ABSENT]: 'Отсъства',
  [ATTENDANCE_STATUS?.LATE]: 'Закъснял',
  [ATTENDANCE_STATUS?.EXCUSED]: 'Извинено',
} as const

export const ATTENDANCE_STATUS_OPTIONS = [
  ATTENDANCE_STATUS?.PRESENT,
  ATTENDANCE_STATUS?.ABSENT,
  ATTENDANCE_STATUS?.LATE,
  ATTENDANCE_STATUS?.EXCUSED,
] as const

/**
 * Homework Status Values
 */
export const HOMEWORK_STATUS = {
  ASSIGNED: 'assigned',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
} as const

export const HOMEWORK_STATUS_LABELS = {
  [HOMEWORK_STATUS?.ASSIGNED]: 'Зададено',
  [HOMEWORK_STATUS?.COMPLETED]: 'Завършено',
  [HOMEWORK_STATUS?.OVERDUE]: 'Просрочено',
} as const

/**
 * Event Types
 */
export const EVENT_TYPES = {
  LESSON: 'Урок',
  EVENT: 'Събитие',
  VACATION: 'Ваканция',
  OTHER: 'Друго',
} as const

export const EVENT_TYPE_OPTIONS = [
  EVENT_TYPES?.LESSON,
  EVENT_TYPES?.EVENT,
  EVENT_TYPES?.VACATION,
  EVENT_TYPES?.OTHER,
] as const

/**
 * Invoice Types
 */
export const INVOICE_TYPES = {
  INVOICE: 'Фактура',
  RECEIPT: 'Касова бележка',
  NOTE: 'Разписка',
} as const

export const INVOICE_TYPE_OPTIONS = [
  INVOICE_TYPES?.INVOICE,
  INVOICE_TYPES?.RECEIPT,
  INVOICE_TYPES?.NOTE,
] as const

/**
 * Invoice Status Values
 */
export const INVOICE_STATUS = {
  DRAFT: 'Чернова',
  ISSUED: 'Издадена',
  CANCELLED: 'Анулирана',
} as const

export const INVOICE_STATUS_OPTIONS = [
  INVOICE_STATUS?.DRAFT,
  INVOICE_STATUS?.ISSUED,
  INVOICE_STATUS?.CANCELLED,
] as const

/**
 * Client Types (for invoices)
 */
export const CLIENT_TYPES = {
  INDIVIDUAL: 'Физическо лице',
  COMPANY: 'Фирма',
} as const

export const CLIENT_TYPE_OPTIONS = [
  CLIENT_TYPES?.INDIVIDUAL,
  CLIENT_TYPES?.COMPANY,
] as const

/**
 * Inventory Categories
 */
export const INVENTORY_CATEGORIES = {
  ABACUSES: 'Абакуси',
  TEXTBOOKS: 'Учебници',
  WORKBOOKS: 'Тетрадки',
  MATERIALS: 'Материали',
  OTHER: 'Други',
} as const

export const INVENTORY_CATEGORY_OPTIONS = [
  INVENTORY_CATEGORIES?.ABACUSES,
  INVENTORY_CATEGORIES?.TEXTBOOKS,
  INVENTORY_CATEGORIES?.WORKBOOKS,
  INVENTORY_CATEGORIES?.MATERIALS,
  INVENTORY_CATEGORIES?.OTHER,
] as const

/**
 * Stock Transaction Types
 */
export const STOCK_TRANSACTION_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
} as const

/**
 * Stock Transaction Reasons
 */
export const STOCK_TRANSACTION_REASONS = {
  PURCHASE: 'Покупка от доставчик',
  SALE: 'Продажба на ученик',
  DEFECT: 'Брак',
  INVENTORY: 'Инвентаризация',
  OTHER: 'Друго',
} as const

export const STOCK_TRANSACTION_REASON_OPTIONS = [
  STOCK_TRANSACTION_REASONS?.PURCHASE,
  STOCK_TRANSACTION_REASONS?.SALE,
  STOCK_TRANSACTION_REASONS?.DEFECT,
  STOCK_TRANSACTION_REASONS?.INVENTORY,
  STOCK_TRANSACTION_REASONS?.OTHER,
] as const

/**
 * Parent Relationship Types
 */
export const PARENT_RELATIONSHIPS = {
  MOTHER: 'Майка',
  FATHER: 'Баща',
  GUARDIAN: 'Настойник',
  OTHER: 'Друго',
} as const

export const PARENT_RELATIONSHIP_OPTIONS = [
  PARENT_RELATIONSHIPS?.MOTHER,
  PARENT_RELATIONSHIPS?.FATHER,
  PARENT_RELATIONSHIPS?.GUARDIAN,
  PARENT_RELATIONSHIPS?.OTHER,
] as const

/**
 * Discount Types
 */
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'Процент',
  FIXED: 'Фиксирана сума',
} as const

export const DISCOUNT_TYPE_OPTIONS = [
  DISCOUNT_TYPES?.PERCENTAGE,
  DISCOUNT_TYPES?.FIXED,
] as const

/**
 * User Roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
} as const

export const USER_ROLE_LABELS = {
  [USER_ROLES?.ADMIN]: 'Администратор',
  [USER_ROLES?.TEACHER]: 'Учител',
  [USER_ROLES?.PARENT]: 'Родител',
} as const

/**
 * Group Status Values
 */
export const GROUP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const

export const GROUP_STATUS_LABELS = {
  [GROUP_STATUS?.ACTIVE]: 'Активна',
  [GROUP_STATUS?.INACTIVE]: 'Неактивна',
  [GROUP_STATUS?.ARCHIVED]: 'Архивирана',
} as const

export const GROUP_STATUS_OPTIONS = [
  GROUP_STATUS?.ACTIVE,
  GROUP_STATUS?.INACTIVE,
  GROUP_STATUS?.ARCHIVED,
] as const

/**
 * Group Level Values
 */
export const GROUP_LEVELS = {
  BEGINNER: 'Начинаещи',
  ADVANCED: 'Напреднали',
  EXPERT: 'Експерти',
  MIXED: 'Смесено',
} as const

export const GROUP_LEVEL_OPTIONS = [
  GROUP_LEVELS?.BEGINNER,
  GROUP_LEVELS?.ADVANCED,
  GROUP_LEVELS?.EXPERT,
  GROUP_LEVELS?.MIXED,
] as const

/**
 * Days of Week (Bulgarian)
 */
export const DAYS_OF_WEEK = {
  MONDAY: 'Понеделник',
  TUESDAY: 'Вторник',
  WEDNESDAY: 'Сряда',
  THURSDAY: 'Четвъртък',
  FRIDAY: 'Петък',
  SATURDAY: 'Събота',
  SUNDAY: 'Неделя',
} as const

export const DAYS_OF_WEEK_OPTIONS = [
  DAYS_OF_WEEK?.MONDAY,
  DAYS_OF_WEEK?.TUESDAY,
  DAYS_OF_WEEK?.WEDNESDAY,
  DAYS_OF_WEEK?.THURSDAY,
  DAYS_OF_WEEK?.FRIDAY,
  DAYS_OF_WEEK?.SATURDAY,
  DAYS_OF_WEEK?.SUNDAY,
] as const

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validation Constants
 */
export const VALIDATION = {
  /**
   * Minimum password length
   */
  MIN_PASSWORD_LENGTH: 6,

  /**
   * Maximum file upload size (in bytes)
   * Default: 5MB
   */
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  /**
   * Maximum text field length
   */
  MAX_TEXT_LENGTH: 1000,

  /**
   * Phone number regex (Bulgarian format)
   */
  PHONE_REGEX: /^(\+359|0)[0-9]{9}$/,

  /**
   * Email regex
   */
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /**
   * Bulgarian VAT/EIK regex
   */
  VAT_REGEX: /^[0-9]{9,13}$/,
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type StudentStatus = typeof STUDENT_STATUS[keyof typeof STUDENT_STATUS]
export type StudyType = typeof STUDY_TYPES[keyof typeof STUDY_TYPES]
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS]
export type ArticleType = typeof ARTICLE_TYPES[keyof typeof ARTICLE_TYPES]
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[keyof typeof EXPENSE_CATEGORIES]
export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS]
export type HomeworkStatus = typeof HOMEWORK_STATUS[keyof typeof HOMEWORK_STATUS]
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]
export type InvoiceType = typeof INVOICE_TYPES[keyof typeof INVOICE_TYPES]
export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS]
export type ClientType = typeof CLIENT_TYPES[keyof typeof CLIENT_TYPES]
export type InventoryCategory = typeof INVENTORY_CATEGORIES[keyof typeof INVENTORY_CATEGORIES]
export type StockTransactionType = typeof STOCK_TRANSACTION_TYPES[keyof typeof STOCK_TRANSACTION_TYPES]
export type StockTransactionReason = typeof STOCK_TRANSACTION_REASONS[keyof typeof STOCK_TRANSACTION_REASONS]
export type ParentRelationship = typeof PARENT_RELATIONSHIPS[keyof typeof PARENT_RELATIONSHIPS]
export type DiscountType = typeof DISCOUNT_TYPES[keyof typeof DISCOUNT_TYPES]
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type GroupStatus = typeof GROUP_STATUS[keyof typeof GROUP_STATUS]
export type GroupLevel = typeof GROUP_LEVELS[keyof typeof GROUP_LEVELS]
export type DayOfWeek = typeof DAYS_OF_WEEK[keyof typeof DAYS_OF_WEEK]
