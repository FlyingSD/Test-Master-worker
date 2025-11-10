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
import { COLLECTIONS } from '@/lib/collections'

// Collection reference
const paymentsCollection = collection(db, COLLECTIONS.PAYMENTS)

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
 * 🔒 SECURITY FIX: Now validates ownership before update
 * - Admins can update any payment
 * - Teachers can only update payments THEY created
 * - Parents cannot update payments
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PaymentFormValues> }) => {
      if (!userData) {
        throw new Error('Не сте влезли в системата')
      }

      // 🔒 SECURITY: Fetch payment first to check ownership
      const docRef = doc(db, COLLECTIONS.PAYMENTS, id)
      const paymentSnap = await getDoc(docRef)

      if (!paymentSnap.exists()) {
        throw new Error('Плащането не е намерено')
      }

      const payment = paymentSnap.data() as Payment

      // 🔒 SECURITY: Ownership validation
      if (!isAdmin) {
        // Only admins OR payment creator can update
        if (payment.createdBy !== userData.id) {
          throw new Error('Нямате права да променяте това плащане')
        }
      }

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
 * 🔒 SECURITY FIX: Now validates ownership before deletion
 * - Admins can delete any payment
 * - Teachers can only delete payments THEY created
 * - Parents cannot delete payments
 */
export function useDeletePayment() {
  const queryClient = useQueryClient()
  const { user, userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async (paymentId: string) => {
      if (!userData) {
        throw new Error('Не сте влезли в системата')
      }

      // 🔒 SECURITY: Fetch payment first to check ownership
      const docRef = doc(db, COLLECTIONS.PAYMENTS, paymentId)
      const paymentSnap = await getDoc(docRef)

      if (!paymentSnap.exists()) {
        throw new Error('Плащането не е намерено')
      }

      const payment = paymentSnap.data() as Payment

      // 🔒 SECURITY: Ownership validation
      if (!isAdmin) {
        // Only admins OR payment creator can delete
        if (payment.createdBy !== userData.id) {
          throw new Error('Нямате права да изтриете това плащане')
        }
      }

      // Delete payment
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

/**
 * 🔒 SECURITY FIX: Hook to get payments for parent's children only (server-side filtered)
 * CRITICAL: Only downloads payment data for parent's children, not ALL payments
 * This fixes the privacy/GDPR violation where parents could see other families' data
 */
export function usePaymentsByParent(parentId: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!parentId) {
      setPayments([])
      setLoading(false)
      return
    }

    setLoading(true)

    // First, we need to get the parent's students to know which studentIds to filter by
    // We'll query students and then query payments for those students
    const studentsQuery = query(
      collection(db, COLLECTIONS.STUDENTS),
      where('parentId', '==', parentId)
    )

    // Get students first
    const unsubscribeStudents = onSnapshot(
      studentsQuery,
      (studentsSnapshot) => {
        const studentIds: string[] = []
        studentsSnapshot.forEach((doc) => {
          studentIds.push(doc.id)
        })

        if (studentIds.length === 0) {
          setPayments([])
          setLoading(false)
          return
        }

        // 🔒 SECURITY: Only query payments for parent's children
        // Firestore 'in' operator supports up to 10 items, so we need to batch
        const batchSize = 10
        const batches: string[][] = []

        for (let i = 0; i < studentIds.length; i += batchSize) {
          batches.push(studentIds.slice(i, i + batchSize))
        }

        // Subscribe to payments for all batches
        const unsubscribePayments: (() => void)[] = []
        const allPayments = new Map<string, Payment>()

        batches.forEach((batch) => {
          const paymentsQuery = query(
            paymentsCollection,
            where('studentId', 'in', batch),  // SERVER-SIDE FILTER ✅
            orderBy('date', 'desc')
          )

          const unsubscribe = onSnapshot(
            paymentsQuery,
            (snapshot) => {
              snapshot.forEach((doc) => {
                allPayments.set(doc.id, {
                  id: doc.id,
                  ...doc.data(),
                } as Payment)
              })

              // Convert map to array and set state
              setPayments(Array.from(allPayments.values()))
              setLoading(false)
              setError(null)
            },
            (err) => {
              console.error('Error fetching parent payments:', err)
              setError(err as Error)
              setLoading(false)
            }
          )

          unsubscribePayments.push(unsubscribe)
        })

        // Cleanup function for payment subscriptions
        return () => {
          unsubscribePayments.forEach((unsub) => unsub())
        }
      },
      (err) => {
        console.error('Error fetching parent students:', err)
        setError(err as Error)
        setLoading(false)
      }
    )

    return () => {
      unsubscribeStudents()
    }
  }, [parentId])

  return { payments, loading, error }
}

/**
 * Hook to bulk add payments (for bulk payment modal)
 */
export function useBulkAddPayments() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (
      payments: Array<Omit<Payment, 'id' | 'createdAt' | 'createdBy'>>
    ) => {
      const promises = payments.map((paymentData) => {
        const data = {
          ...paymentData,
          date: paymentData.date instanceof Date
            ? Timestamp.fromDate(paymentData.date)
            : paymentData.date,
          createdBy: user?.uid || 'admin',
          createdAt: serverTimestamp(),
        }
        return addDoc(paymentsCollection, data)
      })

      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      toast.success('Плащанията бяха добавени успешно!')
    },
    onError: (error: Error) => {
      console.error('Error bulk adding payments:', error)
      toast.error('Грешка при добавяне на плащания: ' + error.message)
    },
  })
}
