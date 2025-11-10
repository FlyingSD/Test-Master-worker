/**
 * Firestore collection name constants
 * SSOT for all collection names used throughout the app
 *
 * Benefits:
 * - Type safety with autocomplete
 * - No typo risk
 * - Easy refactoring (change in one place)
 * - Clear overview of database structure
 */

export const COLLECTIONS = {
  // User management
  USERS: 'users',

  // Student management
  STUDENTS: 'students',
  PARENTS: 'parents',

  // Financial
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  INVOICES: 'invoices',
  DISCOUNTS: 'discounts',

  // Inventory
  INVENTORY: 'inventory',
  STOCK_TRANSACTIONS: 'stockTransactions',

  // Academic
  EVENTS: 'events',
  HOMEWORK: 'homework',
  ATTENDANCE: 'attendance',
  GRADES: 'grades',

  // System
  SETTINGS: 'settings',
  ACTIVITY_LOG: 'activityLog',
  ERROR_LOG: 'errorLog',
} as const

// Export type for TypeScript autocomplete
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]

/**
 * Helper function to get collection name with type safety
 */
export function getCollectionName(key: keyof typeof COLLECTIONS): string {
  return COLLECTIONS[key]
}
