import { useState, useEffect, useMemo } from 'react'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEFAULT_LABELS, Labels } from '@/constants/defaultLabels'
import { COLLECTIONS } from '@/lib/collections'
import toast from 'react-hot-toast'

/**
 * Deep merge two objects
 * Recursively merges customLabels into defaultLabels
 */
function deepMerge<T extends Record<string, any>>(
  defaultObj: T,
  customObj: Partial<T> | undefined
): T {
  if (!customObj) return defaultObj

  const result = { ...defaultObj }

  for (const key in customObj) {
    const defaultValue = defaultObj[key]
    const customValue = customObj[key]

    if (
      customValue !== null &&
      customValue !== undefined &&
      typeof customValue === 'object' &&
      !Array.isArray(customValue) &&
      typeof defaultValue === 'object' &&
      !Array.isArray(defaultValue)
    ) {
      // Recursively merge nested objects
      result[key] = deepMerge(defaultValue, customValue) as any
    } else if (customValue !== null && customValue !== undefined) {
      // Override with custom value
      result[key] = customValue
    }
  }

  return result
}

/**
 * Hook to get UI labels from Firestore with real-time updates
 *
 * @description Loads custom labels from Firestore and merges with default labels.
 * Provides real-time updates when admin changes labels.
 *
 * @returns {{labels: Labels, loading: boolean, updateLabels: (labels: Partial<Labels>) => Promise<void>}}
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { labels, loading } = useLabels()
 *
 *   if (loading) return <Spinner />
 *
 *   return <h1>{labels?.pages.students?.title}</h1>
 * }
 * ```
 */
export function useLabels() {
  const [customLabels, setCustomLabels] = useState<Partial<Labels> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Real-time listener for labels document
    const docRef = doc(db, COLLECTIONS?.SETTINGS, 'labels')

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap?.exists()) {
          setCustomLabels(docSnap?.data() as Partial<Labels>)
        } else {
          setCustomLabels(null)
        }
        setLoading(false)
      },
      (error) => {
        console.error('Error loading labels:', error)
        setCustomLabels(null)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Merge custom labels with default labels
  const labels = useMemo(() => {
    return deepMerge(DEFAULT_LABELS, customLabels || {})
  }, [customLabels])

  return {
    labels,
    loading,
  }
}

/**
 * Hook to update labels in Firestore (admin only)
 *
 * @description Provides a function to update custom labels in Firestore.
 * Should only be used by admin users.
 *
 * @returns {{updateLabels: (labels: Partial<Labels>) => Promise<void>, saving: boolean}}
 *
 * @example
 * ```tsx
 * function LabelsEditor() {
 *   const { updateLabels, saving } = useUpdateLabels()
 *
 *   const handleSave = async () => {
 *     await updateLabels({
 *       navigation: { students: 'Учащиеся' }
 *     })
 *   }
 *
 *   return <button onClick={handleSave} disabled={saving}>Save</button>
 * }
 * ```
 */
export function useUpdateLabels() {
  const [saving, setSaving] = useState(false)

  const updateLabels = async (labels: Partial<Labels>) => {
    setSaving(true)
    try {
      const docRef = doc(db, COLLECTIONS?.SETTINGS, 'labels')

      // Merge with existing labels
      const existingDoc = await getDoc(docRef)
      const existingLabels = existingDoc?.exists() ? existingDoc?.data() : {}

      const merged = deepMerge(existingLabels as Partial<Labels>, labels)

      await setDoc(docRef, merged)

      toast?.success('Етикетите са запазени успешно')
    } catch (error) {
      console.error('Error updating labels:', error)
      toast?.error('Грешка при запазване на етикети')
      throw error
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    setSaving(true)
    try {
      const docRef = doc(db, COLLECTIONS?.SETTINGS, 'labels')
      await setDoc(docRef, {})
      toast?.success('Етикетите са върнати към стойностите по подразбиране')
    } catch (error) {
      console.error('Error resetting labels:', error)
      toast?.error('Грешка при нулиране на етикети')
      throw error
    } finally {
      setSaving(false)
    }
  }

  return {
    updateLabels,
    resetToDefaults,
    saving,
  }
}

/**
 * Hook to get a specific label by path
 *
 * @description Helper hook to get a specific label value by dot-notation path.
 *
 * @param path - Dot-notation path to label (e?.g., 'pages?.students.title')
 * @returns {string} The label value
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const title = useLabel('pages?.students.title')
 *   return <h1>{title}</h1>
 * }
 * ```
 */
export function useLabel(path: string): string {
  const { labels } = useLabels()

  return useMemo(() => {
    const keys = path?.split('.')
    let value: any = labels

    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) break
    }

    return value ?? path
  }, [labels, path])
}
