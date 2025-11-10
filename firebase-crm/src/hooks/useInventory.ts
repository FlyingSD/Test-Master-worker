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
import { syncAllInventoryData } from './useDenormalizedSync'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { validateDocumentOwnership } from '@/utils/security'
import { QUERY_KEYS } from '@/constants/queryKeys'

// Collection references
const inventoryCollection = collection(db, COLLECTIONS.INVENTORY)
const stockTransactionsCollection = collection(db, COLLECTIONS.STOCK_TRANSACTIONS)

/**
 * Hook to get all inventory items with real-time updates
 *
 * @description Fetches all inventory items with real-time synchronization using Firestore onSnapshot.
 * Orders items by name alphabetically for consistent display.
 *
 * @returns {{inventory: InventoryItem[], loading: boolean, error: Error | null}} Object containing:
 *   - inventory: Array of all inventory items
 *   - loading: True while fetching data
 *   - error: Error object if fetch fails, null otherwise
 *
 * @example
 * ```tsx
 * function InventoryList() {
 *   const { inventory, loading, error } = useInventory()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <Error message={error.message} />
 *
 *   return inventory.map(item => <InventoryCard key={item.id} {...item} />)
 * }
 * ```
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
        toast.error(ERROR_MESSAGES.LOAD_INVENTORY_ERROR)
      }
    )

    return () => unsubscribe()
  }, [])

  return { inventory, loading, error }
}

/**
 * Hook to get a single inventory item by ID
 *
 * @description Fetches a single inventory item by its unique ID using React Query.
 * Provides caching and automatic refetching capabilities.
 *
 * @param {string} itemId - The unique identifier of the inventory item to fetch
 *
 * @returns {UseQueryResult<InventoryItem>} React Query result object with:
 *   - data: InventoryItem object if found
 *   - isLoading: True while fetching
 *   - error: Error object if fetch fails
 *
 * @example
 * ```tsx
 * function ItemDetails({ itemId }: { itemId: string }) {
 *   const { data: item, isLoading, error } = useInventoryItem(itemId)
 *
 *   if (isLoading) return <Spinner />
 *   if (error || !item) return <NotFound />
 *
 *   return <ItemDetailsView {...item} />
 * }
 * ```
 */
export function useInventoryItem(itemId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventoryItem(itemId),
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
 *
 * @description Filters active inventory items that have stock levels at or below their minimum threshold.
 * Useful for inventory alerts and restock reminders.
 *
 * @returns {{lowStockItems: InventoryItem[], count: number}} Object containing:
 *   - lowStockItems: Array of items needing restock
 *   - count: Number of low stock items
 *
 * @example
 * ```tsx
 * function LowStockAlert() {
 *   const { lowStockItems, count } = useLowStockItems()
 *
 *   if (count === 0) return null
 *
 *   return (
 *     <Alert type="warning">
 *       {count} items need restocking!
 *       {lowStockItems.map(item => <LowStockRow key={item.id} {...item} />)}
 *     </Alert>
 *   )
 * }
 * ```
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
 *
 * @description Creates a new inventory item with automatic timestamp and ownership tracking.
 * Populates createdBy, createdAt, and updatedAt fields automatically.
 *
 * @returns {UseMutationResult} React Query mutation object with:
 *   - mutate/mutateAsync: Function to trigger item creation
 *   - isPending: True while request is in progress
 *   - isSuccess/isError: Status flags
 *
 * @security Populates createdBy field with current user.uid for ownership tracking
 *
 * @example
 * ```tsx
 * function AddItemForm() {
 *   const addItem = useAddInventoryItem()
 *
 *   const handleSubmit = async (data: InventoryFormValues) => {
 *     await addItem.mutateAsync(data)
 *     toast.success('Item added!')
 *     onClose()
 *   }
 *
 *   return <Form onSubmit={handleSubmit} loading={addItem.isPending} />
 * }
 * ```
 */
export function useAddInventoryItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: InventoryFormValues) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      const itemData = {
        ...data,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(inventoryCollection, itemData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory })
      toast.success(SUCCESS_MESSAGES.INVENTORY_ADDED)
    },
    onError: (error: Error) => {
      console.error('Error adding inventory item:', error)
      toast.error(ERROR_MESSAGES.ADD_INVENTORY_ERROR + ': ' + error.message)
    },
  })
}

/**
 * Hook to update an inventory item
 *
 * @description Updates an existing inventory item after validating ownership.
 * Automatically syncs denormalized data if item name changes.
 *
 * @param {object} params - Update parameters
 * @param {string} params.id - The inventory item ID to update
 * @param {Partial<InventoryFormValues>} params.data - Partial inventory data to update
 *
 * @returns {UseMutationResult} React Query mutation object for item update
 *
 * @security 🔒 Validates ownership before update using validateDocumentOwnership:
 * - **Admins**: Can update any inventory item
 * - **Teachers**: Can only update items THEY created
 *
 * @note If item name changes, automatically syncs denormalized data across stock transactions
 *
 * @example
 * ```tsx
 * function EditItemForm({ item }: { item: InventoryItem }) {
 *   const updateItem = useUpdateInventoryItem()
 *
 *   const handleSubmit = async (data: Partial<InventoryFormValues>) => {
 *     await updateItem.mutateAsync({ id: item.id, data })
 *   }
 *
 *   return <Form initialValues={item} onSubmit={handleSubmit} />
 * }
 * ```
 */
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryFormValues> }) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership before update
      await validateDocumentOwnership(
        COLLECTIONS.INVENTORY,
        id,
        userData,
        ERROR_MESSAGES.INVENTORY_NOT_FOUND
      )

      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      }

      const docRef = doc(db, COLLECTIONS.INVENTORY, id)
      await updateDoc(docRef, updateData)

      // 🎯 SSOT: Sync denormalized data if name changed
      if (data.name) {
        await syncAllInventoryData(id, data.name)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventoryItem(variables.id) })
      toast.success(SUCCESS_MESSAGES.INVENTORY_UPDATED)
    },
    onError: (error: Error) => {
      console.error('Error updating inventory item:', error)
      toast.error(ERROR_MESSAGES.UPDATE_INVENTORY_ERROR + ': ' + error.message)
    },
  })
}

/**
 * Hook to delete an inventory item
 *
 * @description Deletes an inventory item after validating ownership.
 *
 * @param {string} itemId - The unique identifier of the inventory item to delete
 *
 * @returns {UseMutationResult} React Query mutation object for item deletion
 *
 * @security 🔒 Validates ownership before deletion using validateDocumentOwnership:
 * - **Admins**: Can delete any inventory item
 * - **Teachers/Others**: Can only delete items THEY created
 *
 * @example
 * ```tsx
 * function ItemRow({ item }: { item: InventoryItem }) {
 *   const deleteItem = useDeleteInventoryItem()
 *
 *   const handleDelete = async () => {
 *     if (confirm('Delete this item?')) {
 *       await deleteItem.mutateAsync(item.id)
 *     }
 *   }
 *
 *   return <Button onClick={handleDelete}>Delete</Button>
 * }
 * ```
 */
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership before deletion
      await validateDocumentOwnership(
        COLLECTIONS.INVENTORY,
        itemId,
        userData,
        ERROR_MESSAGES.INVENTORY_NOT_FOUND
      )

      // Delete inventory item
      const docRef = doc(db, COLLECTIONS.INVENTORY, itemId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory })
      toast.success(SUCCESS_MESSAGES.INVENTORY_DELETED)
    },
    onError: (error: Error) => {
      console.error('Error deleting inventory item:', error)
      toast.error(ERROR_MESSAGES.DELETE_INVENTORY_ERROR + ': ' + error.message)
    },
  })
}

/**
 * Hook to get all stock transactions
 *
 * @description Fetches all stock transactions (IN/OUT) with real-time updates.
 * Orders transactions by creation date in descending order (newest first).
 *
 * @returns {{transactions: StockTransaction[], loading: boolean}} Object containing:
 *   - transactions: Array of all stock transactions
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function TransactionHistory() {
 *   const { transactions, loading } = useStockTransactions()
 *
 *   if (loading) return <Spinner />
 *
 *   return transactions.map(tx => <TransactionRow key={tx.id} {...tx} />)
 * }
 * ```
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
 *
 * @description Fetches all stock transactions for a specific inventory item with real-time updates.
 * Orders transactions by creation date in descending order (newest first).
 *
 * @param {string} itemId - The unique identifier of the inventory item
 *
 * @returns {{transactions: StockTransaction[], loading: boolean}} Object containing:
 *   - transactions: Array of transactions for the specified item
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function ItemHistory({ itemId }: { itemId: string }) {
 *   const { transactions, loading } = useStockTransactionsByItem(itemId)
 *
 *   return (
 *     <Card>
 *       <h3>Transaction History</h3>
 *       {loading ? <Spinner /> : transactions.map(tx => <TxRow key={tx.id} {...tx} />)}
 *     </Card>
 *   )
 * }
 * ```
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
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      data,
      inventoryItem
    }: {
      data: StockTransactionFormValues
      inventoryItem: InventoryItem
    }) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }
      // Calculate new stock level
      const newStock = data.type === 'IN'
        ? inventoryItem.currentStock + data.quantity
        : inventoryItem.currentStock - data.quantity

      if (newStock < 0) {
        throw new Error(ERROR_MESSAGES.INSUFFICIENT_STOCK)
      }

      // Create transaction
      const transactionData: any = {
        ...data,
        inventoryItemName: inventoryItem.name,
        totalPrice: data.quantity * data.pricePerUnit,
        createdBy: user.uid,
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
            createdBy: user.uid,
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockTransactions })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments }) // NEW: Invalidate payments too!
      toast.success(SUCCESS_MESSAGES.STOCK_TRANSACTION_ADDED)
    },
    onError: (error: Error) => {
      console.error('Error adding stock transaction:', error)
      toast.error(ERROR_MESSAGES.GENERIC_ERROR + ': ' + error.message)
    },
  })
}

/**
 * Hook to get inventory statistics
 *
 * @description Calculates comprehensive inventory statistics including total items, value, and stock alerts.
 * All calculations are performed on active items only.
 *
 * @returns {object} Statistics object containing:
 *   - totalItems: Count of active inventory items
 *   - totalValue: Total value of all active stock (quantity × purchase price)
 *   - lowStockCount: Number of items at or below minimum stock level
 *   - outOfStockCount: Number of items with zero stock
 *
 * @example
 * ```tsx
 * function InventoryDashboard() {
 *   const stats = useInventoryStats()
 *
 *   return (
 *     <div className="stats-grid">
 *       <StatCard label="Total Items" value={stats.totalItems} />
 *       <StatCard label="Total Value" value={`${stats.totalValue.toFixed(2)} BGN`} />
 *       <StatCard label="Low Stock" value={stats.lowStockCount} variant="warning" />
 *       <StatCard label="Out of Stock" value={stats.outOfStockCount} variant="error" />
 *     </div>
 *   )
 * }
 * ```
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
 *
 * @description Filters inventory items by search term matching name, SKU, or category.
 * Search is case-insensitive and uses client-side filtering.
 *
 * @param {string} searchTerm - The search term to filter by
 *
 * @returns {{inventory: InventoryItem[], loading: boolean}} Object containing:
 *   - inventory: Array of items matching the search term
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function InventorySearch() {
 *   const [search, setSearch] = useState('')
 *   const { inventory, loading } = useSearchInventory(search)
 *
 *   return (
 *     <>
 *       <SearchInput value={search} onChange={setSearch} />
 *       {loading ? <Spinner /> : inventory.map(item => <ItemRow key={item.id} {...item} />)}
 *     </>
 *   )
 * }
 * ```
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
