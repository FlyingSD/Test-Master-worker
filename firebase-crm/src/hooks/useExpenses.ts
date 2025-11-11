import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Expense, ExpenseFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { COLLECTIONS } from '@/lib/collections'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { validateDocumentOwnership } from '@/utils/security'
import { toTimestamp } from '@/utils/date'
import { QUERY_KEYS } from '@/constants/queryKeys'

const expensesCollection = collection(db, COLLECTIONS?.EXPENSES)

/**
 * Hook to get all expenses with real-time updates
 *
 * @description Fetches all expense records with real-time synchronization using Firestore onSnapshot.
 * Orders expenses by date in descending order (newest first).
 *
 * @returns {{expenses: Expense[], loading: boolean, error: Error | null}} Object containing:
 *   - expenses: Array of all expense records
 *   - loading: True while fetching data
 *   - error: Error object if fetch fails, null otherwise
 *
 * @example
 * ```tsx
 * function ExpensesList() {
 *   const { expenses, loading, error } = useExpenses()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <Error message={error?.message} />
 *
 *   return expenses?.map(expense => <ExpenseCard key={expense?.id} {...expense} />)
 * }
 * ```
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const q = query(expensesCollection, orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const expensesData: Expense[] = []
        snapshot?.forEach((doc) => {
          expensesData?.push({ id: doc?.id, ...doc?.data() } as Expense)
        })
        setExpenses(expensesData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console?.error('Error fetching expenses:', err)
        setError(err as Error)
        setLoading(false)
        toast?.error(ERROR_MESSAGES?.LOAD_EXPENSES_ERROR || 'Error loading expenses')
      }
    )
    return () => unsubscribe()
  }, [])

  return { expenses, loading, error }
}

/**
 * Hook to add a new expense
 *
 * @description Creates a new expense record with automatic timestamp conversion and ownership tracking.
 * Converts Date objects to Firestore Timestamps and populates createdBy field.
 *
 * @returns {UseMutationResult} React Query mutation object with:
 *   - mutate/mutateAsync: Function to trigger expense creation
 *   - isPending: True while request is in progress
 *   - isSuccess/isError: Status flags
 *
 * @security Populates createdBy field with current user?.uid for ownership tracking
 *
 * @example
 * ```tsx
 * function ExpenseForm() {
 *   const addExpense = useAddExpense()
 *
 *   const handleSubmit = async (data: ExpenseFormValues) => {
 *     await addExpense?.mutateAsync(data)
 *     onClose()
 *   }
 *
 *   return <Form onSubmit={handleSubmit} loading={addExpense?.isPending} />
 * }
 * ```
 */
export function useAddExpense() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      const expense = {
        ...data,
        date: toTimestamp(data?.date),
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(expensesCollection, expense)
      return docRef?.id
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.expenses })
      toast?.success(SUCCESS_MESSAGES?.EXPENSE_ADDED)
    },
  })
}

/**
 * Hook to update an expense
 *
 * @description Updates an existing expense record after validating ownership.
 * Converts Date objects to Firestore Timestamps if present.
 *
 * @param {object} params - Update parameters
 * @param {string} params?.id - The expense ID to update
 * @param {Partial<ExpenseFormValues>} params?.data - Partial expense data to update
 *
 * @returns {UseMutationResult} React Query mutation object for expense update
 *
 * @security 🔒 Validates ownership before update using validateDocumentOwnership:
 * - **Admins**: Can update any expense
 * - **Teachers/Others**: Can only update expenses THEY created
 *
 * @example
 * ```tsx
 * function EditExpenseForm({ expense }: { expense: Expense }) {
 *   const updateExpense = useUpdateExpense()
 *
 *   const handleSubmit = async (data: Partial<ExpenseFormValues>) => {
 *     await updateExpense?.mutateAsync({ id: expense?.id, data })
 *   }
 *
 *   return <Form initialValues={expense} onSubmit={handleSubmit} />
 * }
 * ```
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExpenseFormValues> }) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership using centralized utility
      await validateDocumentOwnership(COLLECTIONS?.EXPENSES, id, userData, ERROR_MESSAGES?.EXPENSE_NOT_FOUND)

      const updateData: any = { ...data }
      if (updateData?.date) {
        updateData?.date = toTimestamp(updateData?.date)
      }
      const docRef = doc(db, COLLECTIONS?.EXPENSES, id)
      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.expenses })
      toast?.success(SUCCESS_MESSAGES?.EXPENSE_UPDATED)
    },
    onError: (error: Error) => {
      console?.error('Error updating expense:', error)
      toast?.error(ERROR_MESSAGES?.UPDATE_EXPENSE_ERROR + ': ' + error?.message)
    },
  })
}

/**
 * Hook to delete an expense
 *
 * @description Deletes an expense record after validating ownership.
 *
 * @param {string} id - The unique identifier of the expense to delete
 *
 * @returns {UseMutationResult} React Query mutation object for expense deletion
 *
 * @security 🔒 Validates ownership before deletion using validateDocumentOwnership:
 * - **Admins**: Can delete any expense
 * - **Teachers/Others**: Can only delete expenses THEY created
 *
 * @example
 * ```tsx
 * function ExpenseRow({ expense }: { expense: Expense }) {
 *   const deleteExpense = useDeleteExpense()
 *
 *   const handleDelete = async () => {
 *     if (confirm('Delete this expense?')) {
 *       await deleteExpense?.mutateAsync(expense?.id)
 *     }
 *   }
 *
 *   return <Button onClick={handleDelete}>Delete</Button>
 * }
 * ```
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership using centralized utility
      await validateDocumentOwnership(COLLECTIONS?.EXPENSES, id, userData, ERROR_MESSAGES?.EXPENSE_NOT_FOUND)

      // Delete expense
      const docRef = doc(db, COLLECTIONS?.EXPENSES, id)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.expenses })
      toast?.success(SUCCESS_MESSAGES?.EXPENSE_DELETED)
    },
    onError: (error: Error) => {
      console?.error('Error deleting expense:', error)
      toast?.error(ERROR_MESSAGES?.DELETE_EXPENSE_ERROR + ': ' + error?.message)
    },
  })
}

/**
 * Hook to get total expenses
 *
 * @description Calculates total expenses by summing all expense amounts.
 * Uses the base useExpenses hook and reduces the array.
 *
 * @returns {number} Total sum of all expense amounts
 *
 * @example
 * ```tsx
 * function ExpenseStats() {
 *   const totalExpenses = useTotalExpenses()
 *
 *   return (
 *     <Card>
 *       <h3>Total Expenses</h3>
 *       <p className="text-red-600">{totalExpenses?.toFixed(2)} BGN</p>
 *     </Card>
 *   )
 * }
 * ```
 */
export function useTotalExpenses() {
  const { expenses } = useExpenses()
  return expenses?.reduce((sum, e) => sum + e?.amount, 0)
}
