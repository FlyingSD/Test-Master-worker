/**
 * Firestore Helper Utilities
 *
 * Extracts common Firestore operations to reduce code duplication across hooks.
 * Provides standardized patterns for document updates and data mapping.
 */

import { serverTimestamp, QuerySnapshot, DocumentData } from 'firebase/firestore'
import { toTimestamp } from './date'

/**
 * Prepare update data by converting Date fields to Timestamps and adding updatedAt
 *
 * @param data - Partial data object with potential Date fields
 * @param dateFields - Array of field names that should be converted to Timestamps
 * @returns Update data ready for Firestore with converted dates and updatedAt
 *
 * @example
 * ```ts
 * const updateData = prepareUpdateData(formData, ['dueDate', 'startTime'])
 * await updateDoc(docRef, updateData)
 * // Result: { ...formData, dueDate: Timestamp, startTime: Timestamp, updatedAt: serverTimestamp() }
 * ```
 */
export function prepareUpdateData<T extends Record<string, any>>(
  data: Partial<T>,
  dateFields: (keyof T)[] = []
): Record<string, any> {
  const updateData: Record<string, any> = { ...data }

  // Convert specified date fields to Timestamps
  dateFields.forEach((field) => {
    if (updateData[field as string] instanceof Date) {
      updateData[field as string] = toTimestamp(updateData[field as string] as Date)
    }
  })

  // Add updatedAt timestamp
  updateData.updatedAt = serverTimestamp()

  return updateData
}

/**
 * Map Firestore QuerySnapshot to typed array of documents
 * Automatically includes document ID in each object
 *
 * @param snapshot - Firestore QuerySnapshot
 * @returns Array of documents with id field
 *
 * @example
 * ```ts
 * onSnapshot(query, (snapshot) => {
 *   const students = mapSnapshotToArray<Student>(snapshot)
 *   setStudents(students)
 * })
 * ```
 */
export function mapSnapshotToArray<T>(snapshot: QuerySnapshot<DocumentData>): T[] {
  const result: T[] = []
  snapshot.forEach((doc) => {
    result.push({
      id: doc.id,
      ...doc.data(),
    } as T)
  })
  return result
}

/**
 * Prepare create data by converting Date fields to Timestamps and adding metadata
 *
 * @param data - Data object with potential Date fields
 * @param dateFields - Array of field names that should be converted to Timestamps
 * @param userId - User ID for createdBy field
 * @returns Create data ready for Firestore with converted dates and metadata
 *
 * @example
 * ```ts
 * const createData = prepareCreateData(formData, ['dueDate', 'startTime'], user.uid)
 * await addDoc(collection, createData)
 * // Result: { ...formData, dueDate: Timestamp, startTime: Timestamp, createdBy: user.uid, createdAt: serverTimestamp() }
 * ```
 */
export function prepareCreateData<T extends Record<string, any>>(
  data: T,
  dateFields: (keyof T)[] = [],
  userId?: string
): Record<string, any> {
  const createData: Record<string, any> = { ...data }

  // Convert specified date fields to Timestamps
  dateFields.forEach((field) => {
    if (createData[field as string] instanceof Date) {
      createData[field as string] = toTimestamp(createData[field as string] as Date)
    }
  })

  // Add metadata
  if (userId) {
    createData.createdBy = userId
  }
  createData.createdAt = serverTimestamp()
  createData.updatedAt = serverTimestamp()

  return createData
}

/**
 * Batch convert multiple date fields in an object
 * Useful for complex objects with nested dates
 *
 * @param obj - Object with date fields
 * @param dateFields - Array of field names to convert
 * @returns Object with converted Timestamps
 *
 * @example
 * ```ts
 * const plan = {
 *   startDate: new Date(),
 *   installments: [
 *     { dueDate: new Date(), paidDate: new Date() }
 *   ]
 * }
 * const converted = convertDatesToTimestamps(plan, ['startDate'])
 * ```
 */
export function convertDatesToTimestamps<T extends Record<string, any>>(
  obj: T,
  dateFields: (keyof T)[]
): T {
  const result = { ...obj }

  dateFields.forEach((field) => {
    const value = result[field as string]

    // Handle Date objects
    if (value instanceof Date) {
      result[field as string] = toTimestamp(value) as any
    }

    // Handle arrays of objects with dates
    if (Array.isArray(value)) {
      result[field as string] = value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          // Recursively convert dates in array items
          return Object.keys(item).reduce((acc, key) => {
            if (item[key] instanceof Date) {
              acc[key] = toTimestamp(item[key])
            } else {
              acc[key] = item[key]
            }
            return acc
          }, {} as any)
        }
        return item
      }) as any
    }
  })

  return result
}
