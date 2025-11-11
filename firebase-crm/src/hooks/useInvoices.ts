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
import { useAuth } from './useAuth'
import { COLLECTIONS } from '@/lib/collections'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { validateDocumentOwnership } from '@/utils/security'
import { QUERY_KEYS } from '@/constants/queryKeys'

// Collection reference
const invoicesCollection = collection(db, COLLECTIONS?.INVOICES)

/**
 * Hook to get all invoices with real-time updates
 *
 * @description Fetches all invoice records with real-time synchronization using Firestore onSnapshot.
 * Orders invoices by creation date in descending order (newest first).
 *
 * @returns {{invoices: Invoice[], loading: boolean, error: Error | null}} Object containing:
 *   - invoices: Array of all invoice records
 *   - loading: True while fetching data
 *   - error: Error object if fetch fails, null otherwise
 *
 * @example
 * ```tsx
 * function InvoicesList() {
 *   const { invoices, loading, error } = useInvoices()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <Error message={error?.message} />
 *
 *   return invoices?.map(invoice => <InvoiceCard key={invoice?.id} {...invoice} />)
 * }
 * ```
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
        snapshot?.forEach((doc) => {
          invoicesData?.push({
            id: doc?.id,
            ...doc?.data(),
          } as Invoice)
        })
        setInvoices(invoicesData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console?.error('Error fetching invoices:', err)
        setError(err as Error)
        setLoading(false)
        toast?.error(ERROR_MESSAGES?.LOAD_INVOICES_ERROR)
      }
    )

    return () => unsubscribe()
  }, [])

  return { invoices, loading, error }
}

/**
 * Hook to get a single invoice by ID
 *
 * @description Fetches a single invoice record by its unique ID using React Query.
 * Provides caching and automatic refetching capabilities.
 *
 * @param {string} invoiceId - The unique identifier of the invoice to fetch
 *
 * @returns {UseQueryResult<Invoice>} React Query result object with:
 *   - data: Invoice object if found
 *   - isLoading: True while fetching
 *   - error: Error object if fetch fails
 *
 * @example
 * ```tsx
 * function InvoiceDetails({ invoiceId }: { invoiceId: string }) {
 *   const { data: invoice, isLoading, error } = useInvoice(invoiceId)
 *
 *   if (isLoading) return <Spinner />
 *   if (error || !invoice) return <NotFound />
 *
 *   return <InvoiceView {...invoice} />
 * }
 * ```
 */
export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: QUERY_KEYS?.invoice(invoiceId),
    queryFn: async () => {
      const docRef = doc(db, 'invoices', invoiceId)
      const docSnap = await getDoc(docRef)

      if (!docSnap?.exists()) {
        throw new Error('Invoice not found')
      }

      return {
        id: docSnap?.id,
        ...docSnap?.data(),
      } as Invoice
    },
    enabled: !!invoiceId,
  })
}

/**
 * Hook to get invoices by parent ID
 *
 * @description Fetches all invoices for a specific parent with real-time updates.
 * Orders invoices by creation date in descending order (newest first).
 *
 * @param {string} parentId - The unique identifier of the parent
 *
 * @returns {{invoices: Invoice[], loading: boolean}} Object containing:
 *   - invoices: Array of invoices for the specified parent
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function ParentInvoices({ parentId }: { parentId: string }) {
 *   const { invoices, loading } = useInvoicesByParent(parentId)
 *
 *   if (loading) return <Spinner />
 *
 *   return invoices?.map(inv => <InvoiceRow key={inv?.id} {...inv} />)
 * }
 * ```
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
      snapshot?.forEach((doc) => {
        invoicesData?.push({
          id: doc?.id,
          ...doc?.data(),
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

  if (snapshot?.empty) {
    return '0000001'
  }

  const lastInvoice = snapshot?.docs[0].data() as Invoice
  const lastNumber = parseInt(lastInvoice?.invoiceNumber)
  const nextNumber = lastNumber + 1

  return nextNumber?.toString().padStart(7, '0')
}

/**
 * Hook to add a new invoice
 *
 * @description Creates a new invoice with auto-generated invoice number and calculated totals.
 * Automatically calculates subtotal, VAT amount, and total from line items.
 *
 * @returns {UseMutationResult} React Query mutation object with:
 *   - mutate/mutateAsync: Function to trigger invoice creation
 *   - isPending: True while request is in progress
 *   - isSuccess/isError: Status flags
 *
 * @security Populates createdBy field with current user?.uid for ownership tracking
 *
 * @note Invoice number is auto-generated sequentially (7-digit padded format)
 *
 * @example
 * ```tsx
 * function InvoiceForm() {
 *   const addInvoice = useAddInvoice()
 *
 *   const handleSubmit = async (data: InvoiceFormValues) => {
 *     await addInvoice?.mutateAsync(data)
 *     toast?.success('Invoice created!')
 *     onClose()
 *   }
 *
 *   return <Form onSubmit={handleSubmit} loading={addInvoice?.isPending} />
 * }
 * ```
 */
export function useAddInvoice() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }
      // Get next invoice number
      const invoiceNumber = await getNextInvoiceNumber()

      // Calculate totals
      const subtotal = data?.items.reduce((sum, item) => sum + item?.total, 0)
      const vatAmount = subtotal * (data?.vatRate / 100)
      const total = subtotal + vatAmount

      const invoiceData = {
        ...data,
        invoiceNumber,
        subtotal,
        vatAmount,
        total,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(invoicesCollection, invoiceData)
      return docRef?.id
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.invoices })
      toast?.success(SUCCESS_MESSAGES?.INVOICE_ADDED)
    },
    onError: (error: Error) => {
      console?.error('Error adding invoice:', error)
      toast?.error(ERROR_MESSAGES?.ADD_INVOICE_ERROR + ': ' + error?.message)
    },
  })
}

/**
 * Hook to update an invoice
 * 🔒 SECURITY FIX: Now validates ownership before update
 * - Admins can update any invoice
 * - Teachers can only update invoices THEY created
 * - Parents cannot update invoices
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceFormValues> }) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership before update
      await validateDocumentOwnership(
        COLLECTIONS?.INVOICES,
        id,
        userData,
        ERROR_MESSAGES?.INVOICE_NOT_FOUND
      )

      // Recalculate totals if items changed
      let updateData: any = { ...data }
      if (data?.items) {
        const subtotal = data?.items.reduce((sum, item) => sum + item?.total, 0)
        const vatRate = data?.vatRate || 0
        const vatAmount = subtotal * (vatRate / 100)
        const total = subtotal + vatAmount

        updateData = {
          ...updateData,
          subtotal,
          vatAmount,
          total,
        }
      }

      updateData?.updatedAt = serverTimestamp()

      const docRef = doc(db, COLLECTIONS?.INVOICES, id)
      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.invoices })
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.invoice(variables?.id) })
      toast?.success(SUCCESS_MESSAGES?.INVOICE_UPDATED)
    },
    onError: (error: Error) => {
      console?.error('Error updating invoice:', error)
      toast?.error(ERROR_MESSAGES?.UPDATE_INVOICE_ERROR + ': ' + error?.message)
    },
  })
}

/**
 * Hook to delete an invoice
 * 🔒 SECURITY FIX: Now validates ownership before deletion
 * - Admins can delete any invoice
 * - Teachers can only delete invoices THEY created
 * - Parents cannot delete invoices
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership before deletion
      await validateDocumentOwnership(
        COLLECTIONS?.INVOICES,
        invoiceId,
        userData,
        ERROR_MESSAGES?.INVOICE_NOT_FOUND
      )

      // Delete invoice
      const docRef = doc(db, COLLECTIONS?.INVOICES, invoiceId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.invoices })
      toast?.success(SUCCESS_MESSAGES?.INVOICE_DELETED)
    },
    onError: (error: Error) => {
      console?.error('Error deleting invoice:', error)
      toast?.error(ERROR_MESSAGES?.DELETE_INVOICE_ERROR + ': ' + error?.message)
    },
  })
}

/**
 * Hook to mark invoice as paid
 *
 * @description Marks an invoice as paid with automatic timestamp and status update.
 * Sets isPaid to true, records paidAt timestamp, and updates status to 'Издадена'.
 *
 * @param {string} invoiceId - The unique identifier of the invoice to mark as paid
 *
 * @returns {UseMutationResult} React Query mutation object
 *
 * @example
 * ```tsx
 * function InvoiceActions({ invoice }: { invoice: Invoice }) {
 *   const markPaid = useMarkInvoicePaid()
 *
 *   const handleMarkPaid = async () => {
 *     await markPaid?.mutateAsync(invoice?.id)
 *     toast?.success('Invoice marked as paid!')
 *   }
 *
 *   if (invoice?.isPaid) return null
 *   return <Button onClick={handleMarkPaid}>Mark as Paid</Button>
 * }
 * ```
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
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.invoices })
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.invoice(invoiceId) })
      toast?.success(SUCCESS_MESSAGES?.INVOICE_MARKED_PAID)
    },
    onError: (error: Error) => {
      console?.error('Error marking invoice as paid:', error)
      toast?.error(ERROR_MESSAGES?.GENERIC_ERROR + ': ' + error?.message)
    },
  })
}

/**
 * Hook to get invoice statistics
 *
 * @description Calculates comprehensive invoice statistics including counts and revenue.
 * Provides breakdowns for paid, unpaid, and cancelled invoices.
 *
 * @returns {object} Statistics object containing:
 *   - totalInvoices: Total count of all invoices
 *   - paidInvoices: Count of paid invoices
 *   - unpaidInvoices: Count of unpaid invoices (excluding cancelled)
 *   - totalRevenue: Sum of all paid invoice totals
 *   - pendingRevenue: Sum of all unpaid invoice totals (excluding cancelled)
 *
 * @example
 * ```tsx
 * function InvoicesDashboard() {
 *   const stats = useInvoiceStats()
 *
 *   return (
 *     <div className="stats-grid">
 *       <StatCard label="Total Revenue" value={`${stats?.totalRevenue.toFixed(2)} BGN`} />
 *       <StatCard label="Pending" value={`${stats?.pendingRevenue.toFixed(2)} BGN`} />
 *       <StatCard label="Paid" value={stats?.paidInvoices} variant="success" />
 *       <StatCard label="Unpaid" value={stats?.unpaidInvoices} variant="warning" />
 *     </div>
 *   )
 * }
 * ```
 */
export function useInvoiceStats() {
  const { invoices } = useInvoices()

  const stats = {
    totalInvoices: invoices?.length,
    paidInvoices: invoices?.filter((inv) => inv?.isPaid).length,
    unpaidInvoices: invoices?.filter((inv) => !inv?.isPaid && inv?.status !== 'Анулирана').length,
    totalRevenue: invoices
      .filter((inv) => inv?.isPaid)
      .reduce((sum, inv) => sum + inv?.total, 0),
    pendingRevenue: invoices
      .filter((inv) => !inv?.isPaid && inv?.status !== 'Анулирана')
      .reduce((sum, inv) => sum + inv?.total, 0),
  }

  return stats
}
