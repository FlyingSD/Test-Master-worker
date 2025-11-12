import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
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
import { Discount, DiscountFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { COLLECTIONS } from '@/lib/collections'
import { validateDocumentOwnership } from '@/utils/security'
import { toTimestamp } from '@/utils/date'
import { QUERY_KEYS } from '@/constants/queryKeys'

const discountsCollection = collection(db, COLLECTIONS?.DISCOUNTS)

/**
 * Hook to get all discounts with real-time updates
 * 🔒 SECURITY FIX: Now filters discounts by role (PoLP)
 * - Admins see ALL discounts
 * - Teachers see ALL discounts (they manage them)
 * - Parents see ONLY discounts for THEIR children (userData?.studentIds)
 * - Batches queries for 10+ students (Firestore 'in' operator limit)
 */
export function useDiscounts() {
  const { userData, isAdmin, isTeacher, isParent } = useAuth()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userData) {
      setDiscounts([])
      setLoading(false)
      return
    }

    setLoading(true)

    // 🔒 SECURITY: Parents can only see discounts for THEIR children (PoLP)
    // Uses userData?.studentIds for server-side filtering
    if (isParent) {
      const studentIds = userData?.studentIds || []

      // Handle parents with no children assigned
      if (studentIds?.length === 0) {
        setDiscounts([])
        setLoading(false)
        return
      }

      // Batch studentIds for Firestore 'in' operator (max 10 items)
      const batchSize = 10
      const batches: string[][] = []
      for (let i = 0; i < studentIds?.length; i += batchSize) {
        batches?.push(studentIds?.slice(i, i + batchSize))
      }

      const unsubscribeDiscounts: (() => void)[] = []
      const allDiscounts = new Map<string, Discount>()

      batches?.forEach((batch) => {
        const discountsQuery = query(
          discountsCollection,
          where('studentId', 'in', batch),
          orderBy('createdAt', 'desc')
        )

        const unsubscribe = onSnapshot(
          discountsQuery,
          (snapshot) => {
            snapshot?.forEach((doc) => {
              allDiscounts?.set(doc?.id, { id: doc?.id, ...doc?.data() } as Discount)
            })
            setDiscounts(Array.from(allDiscounts?.values()))
            setLoading(false)
            setError(null)
          },
          (err) => {
            console.error('Error fetching parent discounts:', err)
            setError(err as Error)
            setLoading(false)
            toast?.error(ERROR_MESSAGES?.LOAD_DISCOUNTS_ERROR || 'Error loading discounts')
          }
        )

        unsubscribeDiscounts?.push(unsubscribe)
      })

      return () => unsubscribeDiscounts?.forEach((unsub) => unsub())
    }

    // For admins and teachers: get ALL discounts
    const q = query(discountsCollection, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const discountsData: Discount[] = []
        snapshot?.forEach((doc) => {
          discountsData?.push({ id: doc?.id, ...doc?.data() } as Discount)
        })
        setDiscounts(discountsData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching discounts:', err)
        setError(err as Error)
        setLoading(false)
        toast?.error(ERROR_MESSAGES?.LOAD_DISCOUNTS_ERROR || 'Error loading discounts')
      }
    )

    return () => unsubscribe()
  }, [userData, isAdmin, isTeacher, isParent])

  return { discounts, loading, error }
}

/**
 * Hook to get active discounts
 *
 * @description Filters discounts to show only active ones that haven't expired yet.
 * Compares discount endDate with current date.
 *
 * @returns {Discount[]} Array of active and non-expired discount records
 *
 * @example
 * ```tsx
 * function ActiveDiscountsWidget() {
 *   const activeDiscounts = useActiveDiscounts()
 *
 *   return (
 *     <Card>
 *       <h3>Active Discounts: {activeDiscounts?.length}</h3>
 *       {activeDiscounts?.map(d => <DiscountBadge key={d?.id} {...d} />)}
 *     </Card>
 *   )
 * }
 * ```
 */
export function useActiveDiscounts() {
  const { discounts } = useDiscounts()
  const now = new Date()

  return discounts?.filter(d => {
    const endDate = d?.endDate instanceof Date ? d?.endDate : d?.endDate.toDate()
    return d?.isActive && endDate >= now
  })
}

/**
 * Hook to get discounts by student ID
 *
 * @description Fetches all discounts for a specific student with real-time updates.
 * Orders discounts by creation date in descending order (newest first).
 *
 * @param {string} studentId - The unique identifier of the student
 *
 * @returns {{discounts: Discount[], loading: boolean}} Object containing:
 *   - discounts: Array of discounts for the specified student
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function StudentDiscounts({ studentId }: { studentId: string }) {
 *   const { discounts, loading } = useDiscountsByStudent(studentId)
 *
 *   if (loading) return <Spinner />
 *
 *   return discounts?.map(d => <DiscountCard key={d?.id} {...d} />)
 * }
 * ```
 */
export function useDiscountsByStudent(studentId: string) {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setDiscounts([])
      setLoading(false)
      return
    }

    const q = query(
      discountsCollection,
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const discountsData: Discount[] = []
      snapshot?.forEach((doc) => {
        discountsData?.push({ id: doc?.id, ...doc?.data() } as Discount)
      })
      setDiscounts(discountsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [studentId])

  return { discounts, loading }
}

/**
 * Hook to add a new discount
 *
 * @description Creates a new discount record with automatic timestamp conversion and ownership tracking.
 * Converts startDate and endDate Date objects to Firestore Timestamps.
 *
 * @returns {UseMutationResult} React Query mutation object with:
 *   - mutate/mutateAsync: Function to trigger discount creation
 *   - isPending: True while request is in progress
 *   - isSuccess/isError: Status flags
 *
 * @security Populates createdBy field with current user?.uid for ownership tracking
 *
 * @example
 * ```tsx
 * function DiscountForm() {
 *   const addDiscount = useAddDiscount()
 *
 *   const handleSubmit = async (data: DiscountFormValues) => {
 *     await addDiscount?.mutateAsync(data)
 *     toast?.success('Discount added!')
 *     onClose()
 *   }
 *
 *   return <Form onSubmit={handleSubmit} loading={addDiscount?.isPending} />
 * }
 * ```
 */
export function useAddDiscount() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: DiscountFormValues) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      const discount = {
        ...data,
        startDate: toTimestamp(data?.startDate),
        endDate: toTimestamp(data?.endDate),
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(discountsCollection, discount)
      return docRef?.id
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.discounts })
      toast?.success(SUCCESS_MESSAGES?.DISCOUNT_ADDED)
    },
  })
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DiscountFormValues> }) => {
      // 🔒 SECURITY: Validate ownership before allowing update
      // This ensures users can only update discounts they created (or admins can update any)
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NO_PERMISSION)
      }

      await validateDocumentOwnership(
        COLLECTIONS?.DISCOUNTS,
        id,
        userData,
        ERROR_MESSAGES?.NOT_FOUND || 'Discount not found'
      )

      const docRef = doc(db, COLLECTIONS?.DISCOUNTS, id)
      const updateData: Record<string, any> = {
        ...data,
        updatedAt: serverTimestamp(),
      }
      if (updateData?.startDate) {
        updateData?.startDate = toTimestamp(updateData?.startDate)
      }
      if (updateData?.endDate) {
        updateData?.endDate = toTimestamp(updateData?.endDate)
      }
      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.discounts })
      toast?.success(SUCCESS_MESSAGES?.DISCOUNT_UPDATED)
    },
    onError: (error) => {
      toast?.error(error instanceof Error ? error?.message : ERROR_MESSAGES?.NO_PERMISSION)
    },
  })
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      // 🔒 SECURITY: Validate ownership before allowing deletion
      // This ensures users can only delete discounts they created (or admins can delete any)
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NO_PERMISSION)
      }

      await validateDocumentOwnership(
        COLLECTIONS?.DISCOUNTS,
        id,
        userData,
        ERROR_MESSAGES?.NOT_FOUND || 'Discount not found'
      )

      await deleteDoc(doc(db, COLLECTIONS?.DISCOUNTS, id))
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.discounts })
      toast?.success(SUCCESS_MESSAGES?.DISCOUNT_DELETED)
    },
    onError: (error) => {
      toast?.error(error instanceof Error ? error?.message : ERROR_MESSAGES?.NO_PERMISSION)
    },
  })
}
