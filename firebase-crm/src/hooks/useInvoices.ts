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
import { Invoice, InvoiceFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Collection reference
const invoicesCollection = collection(db, 'invoices')

/**
 * Hook to get all invoices with real-time updates
 */
export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    // Real-time listener
    const q = query(invoicesCollection, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const invoicesData: Invoice[] = []
        snapshot.forEach((doc) => {
          invoicesData.push({
            id: doc.id,
            ...doc.data(),
          } as Invoice)
        })
        setInvoices(invoicesData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching invoices:', err)
        setError(err as Error)
        setLoading(false)
        toast.error('Грешка при зареждане на фактури')
      }
    )

    return () => unsubscribe()
  }, [])

  return { invoices, loading, error }
}

/**
 * Hook to get a single invoice by ID
 */
export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const docRef = doc(db, 'invoices', invoiceId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Invoice not found')
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Invoice
    },
    enabled: !!invoiceId,
  })
}

/**
 * Hook to get invoices by parent ID
 */
export function useInvoicesByParent(parentId: string) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!parentId) {
      setInvoices([])
      setLoading(false)
      return
    }

    const q = query(
      invoicesCollection,
      where('parentId', '==', parentId),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData: Invoice[] = []
      snapshot.forEach((doc) => {
        invoicesData.push({
          id: doc.id,
          ...doc.data(),
        } as Invoice)
      })
      setInvoices(invoicesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [parentId])

  return { invoices, loading }
}

/**
 * Hook to get next invoice number
 */
export async function getNextInvoiceNumber(): Promise<string> {
  const q = query(invoicesCollection, orderBy('invoiceNumber', 'desc'))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return '0000001'
  }

  const lastInvoice = snapshot.docs[0].data() as Invoice
  const lastNumber = parseInt(lastInvoice.invoiceNumber)
  const nextNumber = lastNumber + 1

  return nextNumber.toString().padStart(7, '0')
}

/**
 * Hook to add a new invoice
 */
export function useAddInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ data, userId }: { data: InvoiceFormValues; userId: string }) => {
      // Get next invoice number
      const invoiceNumber = await getNextInvoiceNumber()

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0)
      const vatAmount = subtotal * (data.vatRate / 100)
      const total = subtotal + vatAmount

      const invoiceData = {
        ...data,
        invoiceNumber,
        subtotal,
        vatAmount,
        total,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(invoicesCollection, invoiceData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Документът беше създаден успешно!')
    },
    onError: (error: Error) => {
      console.error('Error adding invoice:', error)
      toast.error('Грешка при създаване на документ: ' + error.message)
    },
  })
}

/**
 * Hook to update an invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceFormValues> }) => {
      const docRef = doc(db, 'invoices', id)

      // Recalculate totals if items changed
      let updateData: any = { ...data }
      if (data.items) {
        const subtotal = data.items.reduce((sum, item) => sum + item.total, 0)
        const vatRate = data.vatRate || 0
        const vatAmount = subtotal * (vatRate / 100)
        const total = subtotal + vatAmount

        updateData = {
          ...updateData,
          subtotal,
          vatAmount,
          total,
        }
      }

      updateData.updatedAt = serverTimestamp()

      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] })
      toast.success('Документът беше обновен успешно!')
    },
    onError: (error: Error) => {
      console.error('Error updating invoice:', error)
      toast.error('Грешка при обновяване на документ: ' + error.message)
    },
  })
}

/**
 * Hook to delete an invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const docRef = doc(db, 'invoices', invoiceId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Документът беше изтрит успешно!')
    },
    onError: (error: Error) => {
      console.error('Error deleting invoice:', error)
      toast.error('Грешка при изтриване на документ: ' + error.message)
    },
  })
}

/**
 * Hook to mark invoice as paid
 */
export function useMarkInvoicePaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const docRef = doc(db, 'invoices', invoiceId)
      await updateDoc(docRef, {
        isPaid: true,
        paidAt: serverTimestamp(),
        status: 'Издадена',
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      toast.success('Документът беше маркиран като платен!')
    },
    onError: (error: Error) => {
      console.error('Error marking invoice as paid:', error)
      toast.error('Грешка: ' + error.message)
    },
  })
}

/**
 * Hook to get invoice statistics
 */
export function useInvoiceStats() {
  const { invoices } = useInvoices()

  const stats = {
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter((inv) => inv.isPaid).length,
    unpaidInvoices: invoices.filter((inv) => !inv.isPaid && inv.status !== 'Анулирана').length,
    totalRevenue: invoices
      .filter((inv) => inv.isPaid)
      .reduce((sum, inv) => sum + inv.total, 0),
    pendingRevenue: invoices
      .filter((inv) => !inv.isPaid && inv.status !== 'Анулирана')
      .reduce((sum, inv) => sum + inv.total, 0),
  }

  return stats
}
