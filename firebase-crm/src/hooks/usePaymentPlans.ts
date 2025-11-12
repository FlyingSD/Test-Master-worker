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
import { PaymentPlan, Installment } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { COLLECTIONS } from '@/lib/collections'
import { validateDocumentOwnership } from '@/utils/security'
import { toTimestamp } from '@/utils/date'
import { QUERY_KEYS } from '@/constants/queryKeys'

const paymentPlansCollection = collection(db, COLLECTIONS?.PAYMENT_PLANS)

/**
 * Hook to get all payment plans with real-time updates
 */
export function usePaymentPlans() {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const q = query(paymentPlansCollection, orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plansData: PaymentPlan[] = []
        snapshot?.forEach((doc) => {
          plansData?.push({ id: doc?.id, ...doc?.data() } as PaymentPlan)
        })
        setPaymentPlans(plansData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching payment plans:', err)
        setError(err as Error)
        setLoading(false)
        toast?.error('Грешка при зареждане на планове за плащане')
      }
    )

    return () => unsubscribe()
  }, [])

  return { paymentPlans, loading, error }
}

/**
 * Hook to get payment plans for a specific student
 */
export function usePaymentPlansByStudent(studentId: string) {
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setPaymentPlans([])
      setLoading(false)
      return
    }

    const q = query(
      paymentPlansCollection,
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData: PaymentPlan[] = []
      snapshot?.forEach((doc) => {
        plansData?.push({ id: doc?.id, ...doc?.data() } as PaymentPlan)
      })
      setPaymentPlans(plansData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [studentId])

  return { paymentPlans, loading }
}

/**
 * Hook to add a payment plan
 */
export function useAddPaymentPlan() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: Omit<PaymentPlan, 'id' | 'createdAt' | 'createdBy'>) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // Convert dates to timestamps
      const planData = {
        ...data,
        startDate: toTimestamp(data?.startDate),
        installments: data?.installments.map((inst: Installment) => ({
          ...inst,
          dueDate: toTimestamp(inst?.dueDate),
          paidDate: inst?.paidDate ? toTimestamp(inst?.paidDate) : null,
        })),
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(paymentPlansCollection, planData)
      return docRef?.id
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.paymentPlans })
      toast?.success('Планът за плащане е създаден успешно!')
    },
    onError: (error) => {
      console.error('Error creating payment plan:', error)
      toast?.error('Грешка при създаване на план за плащане')
    },
  })
}

/**
 * Hook to update a payment plan
 */
export function useUpdatePaymentPlan() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<PaymentPlan, 'id' | 'createdAt' | 'createdBy'>>
    }) => {
      await validateDocumentOwnership(
        COLLECTIONS?.PAYMENT_PLANS,
        id,
        user!,
        'План за плащане не е намерен'
      )

      const docRef = doc(db, COLLECTIONS?.PAYMENT_PLANS, id)
      const updateData: Record<string, any> = { ...data, updatedAt: serverTimestamp() }

      if (updateData?.startDate) {
        updateData?.startDate = toTimestamp(updateData?.startDate)
      }

      if (updateData?.installments) {
        updateData?.installments = updateData?.installments.map((inst: Installment) => ({
          ...inst,
          dueDate: toTimestamp(inst?.dueDate),
          paidDate: inst?.paidDate ? toTimestamp(inst?.paidDate) : null,
        }))
      }

      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.paymentPlans })
      toast?.success('Планът за плащане е обновен успешно!')
    },
    onError: (error) => {
      console.error('Error updating payment plan:', error)
      toast?.error('Грешка при обновяване на план за плащане')
    },
  })
}

/**
 * Hook to delete a payment plan
 */
export function useDeletePaymentPlan() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      await validateDocumentOwnership(
        COLLECTIONS?.PAYMENT_PLANS,
        id,
        user!,
        'План за плащане не е намерен'
      )

      await deleteDoc(doc(db, COLLECTIONS?.PAYMENT_PLANS, id))
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.paymentPlans })
      toast?.success('Планът за плащане е изтрит успешно!')
    },
    onError: (error) => {
      console.error('Error deleting payment plan:', error)
      toast?.error('Грешка при изтриване на план за плащане')
    },
  })
}

/**
 * Hook to mark an installment as paid
 */
export function useMarkInstallmentPaid() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      planId,
      installmentNumber,
      relatedPaymentId,
    }: {
      planId: string
      installmentNumber: number
      relatedPaymentId?: string
    }) => {
      await validateDocumentOwnership(
        COLLECTIONS?.PAYMENT_PLANS,
        planId,
        user!,
        'План за плащане не е намерен'
      )

      const planRef = doc(db, COLLECTIONS?.PAYMENT_PLANS, planId)
      const planDoc = await validateDocumentOwnership(
        COLLECTIONS?.PAYMENT_PLANS,
        planId,
        user!,
        'План за плащане не е намерен'
      )

      const planData = planDoc?.data() as PaymentPlan

      // Update the installment status
      const updatedInstallments = planData?.installments.map((inst) => {
        if (inst?.installmentNumber === installmentNumber) {
          return {
            ...inst,
            status: 'paid' as const,
            paidDate: Timestamp?.now(),
            relatedPaymentId,
          }
        }
        return inst
      })

      // Check if all installments are paid
      const allPaid = updatedInstallments?.every((inst) => inst?.status === 'paid')
      const newStatus = allPaid ? 'completed' : 'active'

      await updateDoc(planRef, {
        installments: updatedInstallments,
        status: newStatus,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.paymentPlans })
      toast?.success('Вноската е маркирана като платена!')
    },
    onError: (error) => {
      console.error('Error marking installment as paid:', error)
      toast?.error('Грешка при маркиране на вноската')
    },
  })
}
