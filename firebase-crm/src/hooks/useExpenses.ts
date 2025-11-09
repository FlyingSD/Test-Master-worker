import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
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

const expensesCollection = collection(db, 'expenses')

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(expensesCollection, orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData: Expense[] = []
      snapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() } as Expense)
      })
      setExpenses(expensesData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { expenses, loading }
}

export function useAddExpense() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: ExpenseFormValues) => {
      const expense = {
        ...data,
        date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
        createdBy: user?.uid || 'unknown',
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(expensesCollection, expense)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Разходът беше добавен успешно!')
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ExpenseFormValues> }) => {
      const docRef = doc(db, 'expenses', id)
      const updateData = {
        ...data,
        date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
      }
      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Разходът беше обновен успешно!')
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'expenses', id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Разходът беше изтрит успешно!')
    },
  })
}

export function useTotalExpenses() {
  const { expenses } = useExpenses()
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}
