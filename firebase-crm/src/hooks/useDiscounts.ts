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

const discountsCollection = collection(db, 'discounts')

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
      toast.success('Отстъпката беше добавена успешно!')
    },
  })
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DiscountFormValues> }) => {
      const docRef = doc(db, 'discounts', id)
      const updateData = {
        ...data,
        startDate: data.startDate instanceof Date ? Timestamp.fromDate(data.startDate) : data.startDate,
        endDate: data.endDate instanceof Date ? Timestamp.fromDate(data.endDate) : data.endDate,
      }
      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success('Отстъпката беше обновена успешно!')
    },
  })
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'discounts', id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
      toast.success('Отстъпката беше изтрита успешно!')
    },
  })
}
