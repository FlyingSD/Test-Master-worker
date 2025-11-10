import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { InventoryItem, StockTransaction, InventoryFormValues, StockTransactionFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { COLLECTIONS } from '@/lib/collections'

// Collection references
const inventoryCollection = collection(db, COLLECTIONS.INVENTORY)
const stockTransactionsCollection = collection(db, COLLECTIONS.STOCK_TRANSACTIONS)

/**
 * Hook to get all inventory items with real-time updates
 */
export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    // Real-time listener
    const q = query(inventoryCollection, orderBy('name'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const inventoryData: InventoryItem[] = []
        snapshot.forEach((doc) => {
          inventoryData.push({
            id: doc.id,
            ...doc.data(),
          } as InventoryItem)
        })
        setInventory(inventoryData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching inventory:', err)
        setError(err as Error)
        setLoading(false)
        toast.error('Грешка при зареждане на склада')
      }
    )

    return () => unsubscribe()
  }, [])

  return { inventory, loading, error }
}

/**
 * Hook to get a single inventory item by ID
 */
export function useInventoryItem(itemId: string) {
  return useQuery({
    queryKey: ['inventoryItem', itemId],
    queryFn: async () => {
      const docRef = doc(db, 'inventory', itemId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Inventory item not found')
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as InventoryItem
    },
    enabled: !!itemId,
  })
}

/**
 * Hook to get low stock items (below minimum)
 */
export function useLowStockItems() {
  const { inventory } = useInventory()

  const lowStockItems = inventory.filter(
    (item) => item.isActive && item.currentStock <= item.minimumStock
  )

  return { lowStockItems, count: lowStockItems.length }
}

/**
 * Hook to add a new inventory item
 */
export function useAddInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, userId }: { data: InventoryFormValues; userId: string }) => {
      const itemData = {
        ...data,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(inventoryCollection, itemData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Артикулът беше добавен успешно!')
    },
    onError: (error: Error) => {
      console.error('Error adding inventory item:', error)
      toast.error('Грешка при добавяне на артикул: ' + error.message)
    },
  })
}

/**
 * Hook to update an inventory item
 */
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryFormValues> }) => {
      const docRef = doc(db, 'inventory', id)

      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['inventoryItem', variables.id] })
      toast.success('Артикулът беше обновен успешно!')
    },
    onError: (error: Error) => {
      console.error('Error updating inventory item:', error)
      toast.error('Грешка при обновяване на артикул: ' + error.message)
    },
  })
}

/**
 * Hook to delete an inventory item
 * 🔒 SECURITY FIX: Now validates ownership before deletion
 * - Admins can delete any inventory item
 * - Teachers/others can only delete items THEY created
 */
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!userData) {
        throw new Error('Не сте влезли в системата')
      }

      // 🔒 SECURITY: Fetch inventory item first to check ownership
      const docRef = doc(db, COLLECTIONS.INVENTORY, itemId)
      const itemSnap = await getDoc(docRef)

      if (!itemSnap.exists()) {
        throw new Error('Артикулът не е намерен')
      }

      const item = itemSnap.data() as InventoryItem

      // 🔒 SECURITY: Ownership validation
      if (!isAdmin) {
        // Only admins OR item creator can delete
        if (item.createdBy !== userData.id) {
          throw new Error('Нямате права да изтриете този артикул')
        }
      }

      // Delete inventory item
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Артикулът беше изтрит успешно!')
    },
    onError: (error: Error) => {
      console.error('Error deleting inventory item:', error)
      toast.error('Грешка при изтриване на артикул: ' + error.message)
    },
  })
}

/**
 * Hook to get all stock transactions
 */
export function useStockTransactions() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    const q = query(stockTransactionsCollection, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData: StockTransaction[] = []
      snapshot.forEach((doc) => {
        transactionsData.push({
          id: doc.id,
          ...doc.data(),
        } as StockTransaction)
      })
      setTransactions(transactionsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { transactions, loading }
}

/**
 * Hook to get stock transactions for a specific inventory item
 */
export function useStockTransactionsByItem(itemId: string) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!itemId) {
      setTransactions([])
      setLoading(false)
      return
    }

    const q = query(
      stockTransactionsCollection,
      where('inventoryItemId', '==', itemId),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData: StockTransaction[]  = []
      snapshot.forEach((doc) => {
        transactionsData.push({
          id: doc.id,
          ...doc.data(),
        } as StockTransaction)
      })
      setTransactions(transactionsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [itemId])

  return { transactions, loading }
}

/**
 * Hook to add a stock transaction and update inventory
 * IMPORTANT: If it's a sale (OUT + student), automatically creates Payment record
 */
export function useAddStockTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      data,
      userId,
      inventoryItem
    }: {
      data: StockTransactionFormValues
      userId: string
      inventoryItem: InventoryItem
    }) => {
      // Calculate new stock level
      const newStock = data.type === 'IN'
        ? inventoryItem.currentStock + data.quantity
        : inventoryItem.currentStock - data.quantity

      if (newStock < 0) {
        throw new Error('Недостатъчно количество на склад!')
      }

      // Create transaction
      const transactionData: any = {
        ...data,
        inventoryItemName: inventoryItem.name,
        totalPrice: data.quantity * data.pricePerUnit,
        createdBy: userId,
        createdAt: serverTimestamp(),
      }

      const transactionRef = await addDoc(stockTransactionsCollection, transactionData)

      // 🔗 CRITICAL FIX: If selling to student, auto-create Payment record!
      if (
        data.type === 'OUT' &&
        data.reason === 'Продажба на ученик' &&
        data.relatedStudentId
      ) {
        // Get student name for payment record
        const studentRef = doc(db, COLLECTIONS.STUDENTS, data.relatedStudentId)
        const studentSnap = await getDoc(studentRef)

        if (studentSnap.exists()) {
          const student = studentSnap.data()

          // Create linked payment automatically
          const paymentData = {
            studentId: data.relatedStudentId,
            studentName: student.name,
            amount: data.totalPrice,
            article: inventoryItem.name, // Inventory item name
            method: 'Кеш', // Default to cash, can be customized
            date: serverTimestamp(),
            notes: `Автоматично създадено от складова продажба: ${inventoryItem.name} x${data.quantity}`,
            createdBy: userId,
            createdAt: serverTimestamp(),
          }

          const paymentRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), paymentData)

          // Link payment to transaction
          await updateDoc(transactionRef, {
            relatedPaymentId: paymentRef.id
          })

          // Link transaction to payment (for reverse lookup)
          await updateDoc(paymentRef, {
            relatedStockTransactionId: transactionRef.id
          })
        }
      }

      // Update inventory item stock
      const inventoryRef = doc(db, 'inventory', inventoryItem.id)
      await updateDoc(inventoryRef, {
        currentStock: newStock,
        lastRestockDate: data.type === 'IN' ? serverTimestamp() : inventoryItem.lastRestockDate,
        updatedAt: serverTimestamp(),
      })

      return { newStock }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['stockTransactions'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] }) // NEW: Invalidate payments too!
      toast.success('Движението беше записано успешно! Плащането е създадено автоматично.')
    },
    onError: (error: Error) => {
      console.error('Error adding stock transaction:', error)
      toast.error('Грешка: ' + error.message)
    },
  })
}

/**
 * Hook to get inventory statistics
 */
export function useInventoryStats() {
  const { inventory } = useInventory()

  const stats = {
    totalItems: inventory.filter((item) => item.isActive).length,
    totalValue: inventory
      .filter((item) => item.isActive)
      .reduce((sum, item) => sum + (item.currentStock * item.purchasePrice), 0),
    lowStockCount: inventory.filter(
      (item) => item.isActive && item.currentStock <= item.minimumStock
    ).length,
    outOfStockCount: inventory.filter(
      (item) => item.isActive && item.currentStock === 0
    ).length,
  }

  return stats
}

/**
 * Hook to search inventory items
 */
export function useSearchInventory(searchTerm: string) {
  const { inventory, loading } = useInventory()

  const filteredInventory = inventory.filter((item) => {
    const term = searchTerm.toLowerCase()
    return (
      item.name.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    )
  })

  return { inventory: filteredInventory, loading }
}
