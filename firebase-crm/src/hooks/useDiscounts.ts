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

const discountsCollection = collection(db, COLLECTIONS.DISCOUNTS)

export function useDiscounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(discountsCollection, orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const discountsData: Discount[] = []
      snapshot.forEach((doc) => {
        discountsData.push({ id: doc.id, ...doc.data() } as Discount)
      })
      setDiscounts(discountsData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { discounts, loading }
}

export function useActiveDiscounts() {
  const { discounts } = useDiscounts()
  const now = new Date()

  return discounts.filter(d => {
    const endDate = d.endDate instanceof Date ? d.endDate : d.endDate.toDate()
    return d.isActive && endDate >= now
  })
}

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
      snapshot.forEach((doc) => {
        discountsData.push({ id: doc.id, ...doc.data() } as Discount)
      })
      setDiscounts(discountsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [studentId])

  return { discounts, loading }
}

export function useAddDiscount() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: DiscountFormValues) => {
      const discount = {
        ...data,
        startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate,
        endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : data.endDate,
        createdBy: user?.uid || 'unknown',
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(discountsCollection, discount)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success(SUCCESS_MESSAGES.DISCOUNT_ADDED)
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
        throw new Error(ERROR_MESSAGES.NO_PERMISSION)
      }

      await validateDocumentOwnership(
        COLLECTIONS.DISCOUNTS,
        id,
        userData,
        ERROR_MESSAGES.NOT_FOUND || 'Discount not found'
      )

      const docRef = doc(db, COLLECTIONS.DISCOUNTS, id)
      const updateData = {
        ...data,
        startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate,
        endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : data.endDate,
        updatedAt: serverTimestamp(),
      }
      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success(SUCCESS_MESSAGES.DISCOUNT_UPDATED)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.NO_PERMISSION)
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
        throw new Error(ERROR_MESSAGES.NO_PERMISSION)
      }

      await validateDocumentOwnership(
        COLLECTIONS.DISCOUNTS,
        id,
        userData,
        ERROR_MESSAGES.NOT_FOUND || 'Discount not found'
      )

      await deleteDoc(doc(db, COLLECTIONS.DISCOUNTS, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success(SUCCESS_MESSAGES.DISCOUNT_DELETED)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.NO_PERMISSION)
    },
  })
}
