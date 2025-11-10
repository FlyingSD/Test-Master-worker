/**
 * 🎯 SSOT (Single Source of Truth) - React Query Keys
 *
 * Centralized query keys for all React Query operations.
 * Benefits:
 * - Type safety with autocomplete
 * - Consistent cache invalidation
 * - Easy refactoring
 * - Clear data dependency structure
 */

export const QUERY_KEYS = {
  // Students
  students: ['students'] as const,
  student: (id: string) => ['student', id] as const,
  studentsByParent: (parentId: string) => ['students', 'byParent', parentId] as const,

  // Parents
  parents: ['parents'] as const,
  parent: (id: string) => ['parent', id] as const,
  parentsByStudent: (studentId: string) => ['parents', 'byStudent', studentId] as const,

  // Payments
  payments: ['payments'] as const,
  payment: (id: string) => ['payment', id] as const,
  paymentsByStudent: (studentId: string) => ['payments', 'byStudent', studentId] as const,
  paymentsByParent: (parentId: string) => ['payments', 'byParent', parentId] as const,

  // Payment Plans
  paymentPlans: ['paymentPlans'] as const,
  paymentPlan: (id: string) => ['paymentPlan', id] as const,
  paymentPlansByStudent: (studentId: string) => ['paymentPlans', 'byStudent', studentId] as const,

  // Expenses
  expenses: ['expenses'] as const,
  expense: (id: string) => ['expense', id] as const,

  // Events
  events: ['events'] as const,
  event: (id: string) => ['event', id] as const,
  eventsByGroup: (group: string) => ['events', 'byGroup', group] as const,
  todayEvents: ['events', 'today'] as const,

  // Homework
  homework: ['homework'] as const,
  homeworkItem: (id: string) => ['homework', id] as const,
  homeworkByStudent: (studentId: string) => ['homework', 'byStudent', studentId] as const,

  // Attendance
  attendance: ['attendance'] as const,
  attendanceByEvent: (eventId: string) => ['attendance', 'byEvent', eventId] as const,
  attendanceByStudent: (studentId: string) => ['attendance', 'byStudent', studentId] as const,

  // Discounts
  discounts: ['discounts'] as const,
  discount: (id: string) => ['discount', id] as const,
  discountsByStudent: (studentId: string) => ['discounts', 'byStudent', studentId] as const,

  // Inventory
  inventory: ['inventory'] as const,
  inventoryItem: (id: string) => ['inventoryItem', id] as const,
  stockTransactions: ['stockTransactions'] as const,
  stockTransactionsByItem: (itemId: string) => ['stockTransactions', 'byItem', itemId] as const,

  // Invoices
  invoices: ['invoices'] as const,
  invoice: (id: string) => ['invoice', id] as const,
  invoicesByParent: (parentId: string) => ['invoices', 'byParent', parentId] as const,

  // Grades
  grades: ['grades'] as const,
  gradesByStudent: (studentId: string) => ['grades', 'byStudent', studentId] as const,

  // Settings
  settings: ['settings'] as const,

  // Reports
  reports: ['reports'] as const,
  report: (id: string) => ['report', id] as const,
} as const

export type QueryKey = typeof QUERY_KEYS[keyof typeof QUERY_KEYS]
