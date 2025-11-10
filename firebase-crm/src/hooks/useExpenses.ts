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

const expensesCollection = collection(db, COLLECTIONS.EXPENSES)

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
        snapshot.forEach((doc) => {
          expensesData.push({ id: doc.id, ...doc.data() } as Expense)
        })
        setExpenses(expensesData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching expenses:', err)
        setError(err as Error)
        setLoading(false)
        toast.error(ERROR_MESSAGES.LOAD_EXPENSES_ERROR || 'Error loading expenses')
      }
    )
    return () => unsubscribe()
  }, [])

  return { expenses, loading, error }
}

export function useAddExpense() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      const expense = {
        ...data,
        date: toTimestamp(data.date),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(expensesCollection, expense)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success(SUCCESS_MESSAGES.EXPENSE_ADDED)
    },
  })
}

/**
 * Hook to update an expense
 * 🔒 SECURITY FIX: Now validates ownership before update
 * - Admins can update any expense
 * - Teachers can only update expenses THEY created
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExpenseFormValues> }) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership using centralized utility
      await validateDocumentOwnership(COLLECTIONS.EXPENSES, id, userData, ERROR_MESSAGES.EXPENSE_NOT_FOUND)

      const updateData: any = { ...data }
      if (updateData.date) {
        updateData.date = toTimestamp(updateData.date)
      }
      const docRef = doc(db, COLLECTIONS.EXPENSES, id)
      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success(SUCCESS_MESSAGES.EXPENSE_UPDATED)
    },
    onError: (error: Error) => {
      console.error('Error updating expense:', error)
      toast.error(ERROR_MESSAGES.UPDATE_EXPENSE_ERROR + ': ' + error.message)
    },
  })
}

/**
 * Hook to delete an expense
 * 🔒 SECURITY FIX: Now validates ownership before deletion
 * - Admins can delete any expense
 * - Teachers/others can only delete expenses THEY created
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership using centralized utility
      await validateDocumentOwnership(COLLECTIONS.EXPENSES, id, userData, ERROR_MESSAGES.EXPENSE_NOT_FOUND)

      // Delete expense
      const docRef = doc(db, COLLECTIONS.EXPENSES, id)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success(SUCCESS_MESSAGES.EXPENSE_DELETED)
    },
    onError: (error: Error) => {
      console.error('Error deleting expense:', error)
      toast.error(ERROR_MESSAGES.DELETE_EXPENSE_ERROR + ': ' + error.message)
    },
  })
}

export function useTotalExpenses() {
  const { expenses } = useExpenses()
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}
