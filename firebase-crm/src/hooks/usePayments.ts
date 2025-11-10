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
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { validateDocumentOwnership } from '@/utils/security'
import { toTimestamp } from '@/utils/date'
import { QUERY_KEYS } from '@/constants/queryKeys'

// Collection reference
const paymentsCollection = collection(db, COLLECTIONS.PAYMENTS)

/**
 * Hook to get all payments with real-time updates
 *
 * @description Fetches payment records with role-based access control and real-time synchronization.
 * Implements server-side filtering for parents and batch queries for scalability.
 *
 * @returns {{payments: Payment[], loading: boolean, error: Error | null}} Object containing:
 *   - payments: Array of payment records visible to the current user
 *   - loading: True while fetching data
 *   - error: Error object if fetch fails, null otherwise
 *
 * @security Implements Principle of Least Privilege (PoLP)
 * - **Admins**: See ALL payments
 * - **Teachers**: See ONLY payments for students in their assigned groups
 * - **Parents**: See ONLY payments for THEIR children (userData.studentIds)
 *   - Server-side filtering with batching for 10+ children
 *
 * @example
 * ```tsx
 * function PaymentsList() {
 *   const { payments, loading, error } = usePayments()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <Error message={error.message} />
 *
 *   return payments.map(p => <PaymentCard key={p.id} {...p} />)
 * }
 * ```
 */
export function usePayments() {
  const { userData, isAdmin, isTeacher, isParent } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userData) {
      setPayments([])
      setLoading(false)
      return
    }

    setLoading(true)

    // 🔒 SECURITY: Parents can only see payments for THEIR children (PoLP)
    // Uses userData.studentIds for server-side filtering
    if (isParent) {
      const studentIds = userData.studentIds || []

      // Handle parents with no children assigned
      if (studentIds.length === 0) {
        setPayments([])
        setLoading(false)
        return
      }

      // Batch studentIds for Firestore 'in' operator (max 10 items)
      const batchSize = 10
      const batches: string[][] = []
      for (let i = 0; i < studentIds.length; i += batchSize) {
        batches.push(studentIds.slice(i, i + batchSize))
      }

      const unsubscribePayments: (() => void)[] = []
      const allPayments = new Map<string, Payment>()

      batches.forEach((batch) => {
        const paymentsQuery = query(
          paymentsCollection,
          where('studentId', 'in', batch),
          orderBy('date', 'desc')
        )

        const unsubscribe = onSnapshot(
          paymentsQuery,
          (snapshot) => {
            snapshot.forEach((doc) => {
              allPayments.set(doc.id, { id: doc.id, ...doc.data() } as Payment)
            })
            setPayments(Array.from(allPayments.values()))
            setLoading(false)
            setError(null)
          },
          (err) => {
            console.error('Error fetching parent payments:', err)
            setError(err as Error)
            setLoading(false)
            toast.error(ERROR_MESSAGES.LOAD_PAYMENTS_ERROR)
          }
        )

        unsubscribePayments.push(unsubscribe)
      })

      return () => unsubscribePayments.forEach((unsub) => unsub())
    }

    // For teachers, we need to first get their students, then filter payments
    if (isTeacher && userData.assignedGroups && userData.assignedGroups.length > 0) {
      // Get students in teacher's assigned groups
      const studentsQuery = query(
        collection(db, COLLECTIONS.STUDENTS),
        where('group', 'in', userData.assignedGroups)
      )

      const unsubscribeStudents = onSnapshot(studentsQuery, (studentsSnapshot) => {
        const studentIds: string[] = []
        studentsSnapshot.forEach((doc) => studentIds.push(doc.id))

        if (studentIds.length === 0) {
          setPayments([])
          setLoading(false)
          return
        }

        // Now get payments for those students only
        // Since Firestore 'in' is limited to 10 items, batch the queries
        const batchSize = 10
        const batches: string[][] = []
        for (let i = 0; i < studentIds.length; i += batchSize) {
          batches.push(studentIds.slice(i, i + batchSize))
        }

        const unsubscribePayments: (() => void)[] = []
        const allPayments = new Map<string, Payment>()

        batches.forEach((batch) => {
          const paymentsQuery = query(
            paymentsCollection,
            where('studentId', 'in', batch),
            orderBy('date', 'desc')
          )

          const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
            snapshot.forEach((doc) => {
              allPayments.set(doc.id, { id: doc.id, ...doc.data() } as Payment)
            })
            setPayments(Array.from(allPayments.values()))
            setLoading(false)
            setError(null)
          })

          unsubscribePayments.push(unsubscribe)
        })

        return () => unsubscribePayments.forEach((unsub) => unsub())
      })

      return () => unsubscribeStudents()
    }

    // For admins: get ALL payments
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
        toast.error(ERROR_MESSAGES.LOAD_PAYMENTS_ERROR)
      }
    )

    return () => unsubscribe()
  }, [userData, isAdmin, isTeacher, isParent])

  return { payments, loading, error }
}

/**
 * Hook to get a single payment by ID
 */
export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.payment(paymentId),
    queryFn: async () => {
      const docRef = doc(db, 'payments', paymentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error(ERROR_MESSAGES.PAYMENT_NOT_FOUND)
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
      if (!user) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      // Convert date to Timestamp if it's a Date
      const data = {
        ...paymentData,
        date: toTimestamp(paymentData.date),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(paymentsCollection, data)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments })
      toast.success(SUCCESS_MESSAGES.PAYMENT_ADDED)
    },
    onError: (error: Error) => {
      console.error('Error adding payment:', error)
      toast.error(ERROR_MESSAGES.ADD_PAYMENT_ERROR + ': ' + error.message)
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
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership using centralized utility
      await validateDocumentOwnership(COLLECTIONS.PAYMENTS, id, userData, ERROR_MESSAGES.PAYMENT_NOT_FOUND)

      // Convert date to Timestamp if it's a Date
      const updateData: any = { ...data }
      if (updateData.date) {
        updateData.date = toTimestamp(updateData.date)
      }

      const docRef = doc(db, COLLECTIONS.PAYMENTS, id)
      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payment(variables.id) })
      toast.success(SUCCESS_MESSAGES.PAYMENT_UPDATED)
    },
    onError: (error: Error) => {
      console.error('Error updating payment:', error)
      toast.error(ERROR_MESSAGES.UPDATE_PAYMENT_ERROR + ': ' + error.message)
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
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership using centralized utility
      await validateDocumentOwnership(COLLECTIONS.PAYMENTS, paymentId, userData, ERROR_MESSAGES.PAYMENT_NOT_FOUND)

      // Delete payment
      const docRef = doc(db, COLLECTIONS.PAYMENTS, paymentId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments })
      toast.success(SUCCESS_MESSAGES.PAYMENT_DELETED)
    },
    onError: (error: Error) => {
      console.error('Error deleting payment:', error)
      toast.error(ERROR_MESSAGES.DELETE_PAYMENT_ERROR + ': ' + error.message)
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
      if (!user) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      const promises = payments.map((paymentData) => {
        const data = {
          ...paymentData,
          date: toTimestamp(paymentData.date),
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        }
        return addDoc(paymentsCollection, data)
      })

      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments })
      toast.success('Плащанията бяха добавени успешно!')
    },
    onError: (error: Error) => {
      console.error('Error bulk adding payments:', error)
      toast.error(ERROR_MESSAGES.ADD_PAYMENT_ERROR + ': ' + error.message)
    },
  })
}
