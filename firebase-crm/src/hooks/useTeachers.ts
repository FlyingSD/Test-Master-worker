import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/lib/collections'

/**
 * Teacher type (minimal user info)
 */
export interface Teacher {
  id: string
  name: string
  email: string
}

/**
 * Hook to get all teachers
 *
 * @description Fetches all users with role='teacher' for teacher selection dropdowns.
 * Used in GroupModal, HomeworkModal, and other components that need teacher lists.
 *
 * @returns {{teachers: Teacher[], loading: boolean, error: Error | null}} Object containing:
 *   - teachers: Array of teacher objects with id, name, email
 *   - loading: True while fetching data
 *   - error: Error object if fetch fails, null otherwise
 *
 * @example
 * ```tsx
 * function GroupModal() {
 *   const { teachers, loading } = useTeachers()
 *
 *   if (loading) return <Spinner />
 *
 *   return (
 *     <select>
 *       {teachers?.map(t => <option key={t?.id} value={t?.id}>{t?.name}</option>)}
 *     </select>
 *   )
 * }
 * ```
 */
export function useTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true)
        const usersRef = collection(db, COLLECTIONS?.USERS)
        const q = query(usersRef, where('role', '==', 'teacher'))
        const snapshot = await getDocs(q)

        const teachersList: Teacher[] = []
        snapshot?.forEach((doc) => {
          const data = doc?.data()
          teachersList?.push({
            id: doc?.id,
            name: data?.name || data?.email,
            email: data?.email,
          })
        })

        setTeachers(teachersList)
        setError(null)
      } catch (err) {
        console.error('Error fetching teachers:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  return { teachers, loading, error }
}
