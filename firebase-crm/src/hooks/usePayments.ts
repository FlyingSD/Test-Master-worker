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
import { Payment, PaymentFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'

// Collection reference
const paymentsCollection = collection(db, 'payments')

/**
 * Hook to get all payments with real-time updates
 */
export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    // Real-time listener
    const q = query(paymentsCollection, orderBy('date', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const paymentsData: Payment[] = []
        snapshot.forEach((doc) => {
          paymentsData.push({
            id: doc.id,
            ...doc.data(),
          } as Payment)
        })
        setPayments(paymentsData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching payments:', err)
        setError(err as Error)
        setLoading(false)
        toast.error('Грешка при зареждане на плащания')
      }
    )

    return () => unsubscribe()
  }, [])

  return { payments, loading, error }
}

/**
 * Hook to get a single payment by ID
 */
export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      const docRef = doc(db, 'payments', paymentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Payment not found')
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Payment
    },
    enabled: !!paymentId,
  })
}

/**
 * Hook to get payments by student ID
 */
export function usePaymentsByStudent(studentId: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setPayments([])
      setLoading(false)
      return
    }

    const q = query(
      paymentsCollection,
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const paymentsData: Payment[] = []
      snapshot.forEach((doc) => {
        paymentsData.push({
          id: doc.id,
          ...doc.data(),
        } as Payment)
      })
      setPayments(paymentsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [studentId])

  return { payments, loading }
}

/**
 * Hook to add a new payment
 */
export function useAddPayment() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (paymentData: PaymentFormValues) => {
      // Convert date to Timestamp if it's a Date
      const data = {
        ...paymentData,
        date: paymentData.date instanceof Date
          ? Timestamp.fromDate(paymentData.date)
          : paymentData.date,
        createdBy: user?.uid || 'unknown',
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(paymentsCollection, data)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Плащането беше добавено успешно!')
    },
    onError: (error: Error) => {
      console.error('Error adding payment:', error)
      toast.error('Грешка при добавяне на плащане: ' + error.message)
    },
  })
}

/**
 * Hook to update a payment
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentFormValues> }) => {
      const docRef = doc(db, 'payments', id)

      // Convert date to Timestamp if it's a Date
      const updateData = {
        ...data,
        date: data.date instanceof Date
          ? Timestamp.fromDate(data.date)
          : data.date,
      }

      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment', variables.id] })
      toast.success('Плащането беше обновено успешно!')
    },
    onError: (error: Error) => {
      console.error('Error updating payment:', error)
      toast.error('Грешка при обновяване на плащане: ' + error.message)
    },
  })
}

/**
 * Hook to delete a payment
 */
export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const docRef = doc(db, 'payments', paymentId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Плащането беше изтрито успешно!')
    },
    onError: (error: Error) => {
      console.error('Error deleting payment:', error)
      toast.error('Грешка при изтриване на плащане: ' + error.message)
    },
  })
}

/**
 * Hook to get total revenue
 */
export function useTotalRevenue() {
  const { payments } = usePayments()
  return payments.reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Hook to get payments by date range
 */
export function usePaymentsByDateRange(startDate: Date, endDate: Date) {
  const { payments } = usePayments()

  const filteredPayments = payments.filter((payment) => {
    const paymentDate = payment.date instanceof Timestamp
      ? payment.date.toDate()
      : payment.date

    return paymentDate >= startDate && paymentDate <= endDate
  })

  return { payments: filteredPayments }
}
