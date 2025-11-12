import { useEffect, useState, useMemo } from 'react'
import {
  collection,
  query,
  onSnapshot,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'
import { CollectionName } from '@/lib/collections'

/**
 * 🎯 DRY (Don't Repeat Yourself) - Generic Real-Time Collection Hook
 *
 * Eliminates ~200 lines of duplicated onSnapshot code across multiple hooks.
 *
 * @param collectionName - Name of the Firestore collection
 * @param queryConstraints - Optional Firestore query constraints (orderBy, where, limit, etc.)
 * @param enabled - Optional flag to enable/disable the listener (default: true)
 * @param errorMessage - Custom error message to display on failure
 *
 * @example
 * // Simple usage
 * const { data: payments, loading } = useRealtimeCollection<Payment>(
 *   COLLECTIONS?.PAYMENTS,
 *   [orderBy('date', 'desc')]
 * )
 *
 * @example
 * // With conditional enabling
 * const { data: students } = useRealtimeCollection<Student>(
 *   COLLECTIONS?.STUDENTS,
 *   [where('parentId', '==', parentId)],
 *   !!parentId, // Only fetch if parentId exists
 *   'Грешка при зареждане на ученици'
 * )
 */
export function useRealtimeCollection<T extends DocumentData>(
  collectionName: CollectionName,
  queryConstraints: QueryConstraint[] = [],
  enabled: boolean = true,
  errorMessage: string = 'Грешка при зареждане на данни'
) {
  const [data, setData] = useState<(T & { id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Memoize the query to prevent infinite re-renders
  // Serialize queryConstraints for stable comparison
  const queryKey = useMemo(
    () => JSON.stringify(queryConstraints.map(c => c.toString())),
    [queryConstraints]
  )

  useEffect(() => {
    if (!enabled) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)

    // Build Firestore query
    const collectionRef = collection(db, collectionName)
    const q = queryConstraints?.length > 0
      ? query(collectionRef, ...queryConstraints)
      : collectionRef

    // Real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: (T & { id: string })[] = []
        snapshot?.forEach((doc) => {
          items?.push({
            id: doc?.id,
            ...doc?.data() as T,
          })
        })
        setData(items)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err)
        setError(err as Error)
        setLoading(false)
        toast?.error(errorMessage)
      }
    )

    return () => unsubscribe()
    // Use queryKey instead of spreading queryConstraints (CRITICAL FIX: removed queryConstraints to prevent infinite re-renders)
  }, [collectionName, enabled, errorMessage, queryKey])

  return { data, loading, error }
}

/**
 * 🎯 DRY - Generic Real-Time Document Hook
 *
 * For fetching a single document with real-time updates.
 *
 * @example
 * const { data: student, loading } = useRealtimeDocument<Student>(
 *   COLLECTIONS?.STUDENTS,
 *   studentId
 * )
 */
export function useRealtimeDocument<T extends DocumentData>(
  collectionName: CollectionName,
  documentId: string,
  enabled: boolean = true,
  errorMessage: string = 'Грешка при зареждане на документ'
) {
  const [data, setData] = useState<(T & { id: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !documentId) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const docRef = collection(db, collectionName)
    const q = query(docRef)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const doc = snapshot?.docs.find(d => d?.id === documentId)
        if (doc) {
          setData({
            id: doc?.id,
            ...doc?.data() as T,
          })
        } else {
          setData(null)
          setError(new Error('Document not found'))
        }
        setLoading(false)
      },
      (err) => {
        console.error(`Error fetching document from ${collectionName}:`, err)
        setError(err as Error)
        setLoading(false)
        toast?.error(errorMessage)
      }
    )

    return () => unsubscribe()
  }, [collectionName, documentId, enabled, errorMessage])

  return { data, loading, error }
}
