import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/lib/collections'
import toast from 'react-hot-toast'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/messages'

/**
 * 🎯 SSOT (Single Source of Truth) - Denormalized Data Sync
 *
 * Maintains data integrity for denormalized fields.
 * When primary data changes (e?.g., Student?.name), automatically updates all copies (e?.g., Payment?.studentName).
 *
 * Denormalized fields in the system:
 * - Payment?.studentName (copy of Student?.name)
 * - Discount?.studentName (copy of Student?.name)
 * - StockTransaction?.inventoryItemName (copy of InventoryItem?.name)
 *
 * Without this sync mechanism, historical data would become incorrect and inconsistent.
 */

/**
 * Updates all payments when a student's name changes
 *
 * @param studentId - ID of the student whose name changed
 * @param newStudentName - New name of the student
 *
 * @example
 * // After updating student name from "Иван Петров" to "Иван Георгиев"
 * await syncStudentNameInPayments(studentId, "Иван Георгиев")
 * // All payments for this student now show "Иван Георгиев"
 */
export async function syncStudentNameInPayments(
  studentId: string,
  newStudentName: string
): Promise<number> {
  try {
    // Find all payments for this student
    const paymentsQuery = query(
      collection(db, COLLECTIONS?.PAYMENTS),
      where('studentId', '==', studentId)
    )

    const paymentsSnapshot = await getDocs(paymentsQuery)

    if (paymentsSnapshot?.empty) {
      console.log(`No payments found for student ${studentId}`)
      return 0
    }

    // Use batch for efficient updates (max 500 per batch)
    const batch = writeBatch(db)
    let updateCount = 0

    paymentsSnapshot?.forEach((paymentDoc) => {
      const paymentRef = doc(db, COLLECTIONS?.PAYMENTS, paymentDoc?.id)
      batch?.update(paymentRef, { studentName: newStudentName })
      updateCount++
    })

    await batch?.commit()

    console.log(`✅ Updated studentName in ${updateCount} payments`)
    return updateCount
  } catch (error) {
    console.error('Error syncing student name in payments:', error)
    throw error
  }
}

/**
 * Updates all discounts when a student's name changes
 */
export async function syncStudentNameInDiscounts(
  studentId: string,
  newStudentName: string
): Promise<number> {
  try {
    const discountsQuery = query(
      collection(db, COLLECTIONS?.DISCOUNTS),
      where('studentId', '==', studentId)
    )

    const discountsSnapshot = await getDocs(discountsQuery)

    if (discountsSnapshot?.empty) {
      console.log(`No discounts found for student ${studentId}`)
      return 0
    }

    const batch = writeBatch(db)
    let updateCount = 0

    discountsSnapshot?.forEach((discountDoc) => {
      const discountRef = doc(db, COLLECTIONS?.DISCOUNTS, discountDoc?.id)
      batch?.update(discountRef, { studentName: newStudentName })
      updateCount++
    })

    await batch?.commit()

    console.log(`✅ Updated studentName in ${updateCount} discounts`)
    return updateCount
  } catch (error) {
    console.error('Error syncing student name in discounts:', error)
    throw error
  }
}

/**
 * Updates all stock transactions when an inventory item's name changes
 */
export async function syncInventoryNameInTransactions(
  inventoryItemId: string,
  newItemName: string
): Promise<number> {
  try {
    const transactionsQuery = query(
      collection(db, COLLECTIONS?.STOCK_TRANSACTIONS),
      where('inventoryItemId', '==', inventoryItemId)
    )

    const transactionsSnapshot = await getDocs(transactionsQuery)

    if (transactionsSnapshot?.empty) {
      console.log(`No transactions found for inventory item ${inventoryItemId}`)
      return 0
    }

    const batch = writeBatch(db)
    let updateCount = 0

    transactionsSnapshot?.forEach((transactionDoc) => {
      const transactionRef = doc(db, COLLECTIONS?.STOCK_TRANSACTIONS, transactionDoc?.id)
      batch?.update(transactionRef, { inventoryItemName: newItemName })
      updateCount++
    })

    await batch?.commit()

    console.log(`✅ Updated inventoryItemName in ${updateCount} stock transactions`)
    return updateCount
  } catch (error) {
    console.error('Error syncing inventory name in transactions:', error)
    throw error
  }
}

/**
 * 🎯 MASTER SYNC FUNCTION
 *
 * Syncs all denormalized data for a student
 * Call this after updating a student's name
 *
 * @example
 * // In useUpdateStudent hook, after successful update:
 * if (data?.name) {
 *   await syncAllStudentData(id, data?.name)
 * }
 */
export async function syncAllStudentData(
  studentId: string,
  newStudentName: string
): Promise<void> {
  try {
    const [paymentsUpdated, discountsUpdated] = await Promise?.all([
      syncStudentNameInPayments(studentId, newStudentName),
      syncStudentNameInDiscounts(studentId, newStudentName),
    ])

    const totalUpdated = paymentsUpdated + discountsUpdated

    if (totalUpdated > 0) {
      toast?.success(
        SUCCESS_MESSAGES?.DATA_SYNCED(totalUpdated),
        { duration: 3000 }
      )
    }

    console.log(`✅ Student data sync complete: ${totalUpdated} records updated`)
  } catch (error) {
    console.error('Error syncing student data:', error)
    toast?.error(ERROR_MESSAGES?.SYNC_DATA_ERROR)
    throw error
  }
}

/**
 * 🎯 MASTER SYNC FUNCTION
 *
 * Syncs all denormalized data for an inventory item
 * Call this after updating an inventory item's name
 *
 * @example
 * // In useUpdateInventoryItem hook, after successful update:
 * if (data?.name) {
 *   await syncAllInventoryData(id, data?.name)
 * }
 */
export async function syncAllInventoryData(
  inventoryItemId: string,
  newItemName: string
): Promise<void> {
  try {
    const transactionsUpdated = await syncInventoryNameInTransactions(
      inventoryItemId,
      newItemName
    )

    if (transactionsUpdated > 0) {
      toast?.success(
        SUCCESS_MESSAGES?.INVENTORY_SYNCED(transactionsUpdated),
        { duration: 3000 }
      )
    }

    console.log(`✅ Inventory data sync complete: ${transactionsUpdated} records updated`)
  } catch (error) {
    console.error('Error syncing inventory data:', error)
    toast?.error(ERROR_MESSAGES?.SYNC_DATA_ERROR)
    throw error
  }
}
