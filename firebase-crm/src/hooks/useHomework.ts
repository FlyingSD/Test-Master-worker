import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
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
import { Homework, HomeworkFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { COLLECTIONS } from '@/lib/collections'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'

// Collection reference
const homeworkCollection = collection(db, COLLECTIONS.HOMEWORK)

/**
 * Hook to get all homework with real-time updates
 * 🔒 SECURITY FIX: Now filters homework by role (PoLP)
 * - Admins see ALL homework
 * - Teachers see ONLY homework they created (ownership-based filtering)
 * - Parents see ONLY homework for THEIR children (userData.studentIds)
 * - Batches queries for 10+ students (Firestore 'in' operator limit)
 *
 * NOTE: For teachers, we filter by ownership (createdBy) rather than by group,
 * because homework is created by specific teachers
 */
export function useHomework() {
  const { userData, isAdmin, isTeacher, isParent } = useAuth()
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userData) {
      setHomework([])
      setLoading(false)
      return
    }

    setLoading(true)

    // 🔒 SECURITY: Parents can only see homework for THEIR children (PoLP)
    // Uses userData.studentIds for server-side filtering
    if (isParent) {
      const studentIds = userData.studentIds || []

      // Handle parents with no children assigned
      if (studentIds.length === 0) {
        setHomework([])
        setLoading(false)
        return
      }

      // Batch studentIds for Firestore 'in' operator (max 10 items)
      const batchSize = 10
      const batches: string[][] = []
      for (let i = 0; i < studentIds.length; i += batchSize) {
        batches.push(studentIds.slice(i, i + batchSize))
      }

      const unsubscribeHomework: (() => void)[] = []
      const allHomework = new Map<string, Homework>()

      batches.forEach((batch) => {
        const homeworkQuery = query(
          homeworkCollection,
          where('studentId', 'in', batch),
          orderBy('dueDate', 'desc')
        )

        const unsubscribe = onSnapshot(
          homeworkQuery,
          (snapshot) => {
            snapshot.forEach((doc) => {
              allHomework.set(doc.id, { id: doc.id, ...doc.data() } as Homework)
            })
            setHomework(Array.from(allHomework.values()))
            setLoading(false)
            setError(null)
          },
          (err) => {
            console.error('Error fetching parent homework:', err)
            setError(err as Error)
            setLoading(false)
            toast.error(ERROR_MESSAGES.LOAD_HOMEWORK_ERROR)
          }
        )

        unsubscribeHomework.push(unsubscribe)
      })

      return () => unsubscribeHomework.forEach((unsub) => unsub())
    }

    // Real-time listener
    const q = query(homeworkCollection, orderBy('dueDate', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let homeworkData: Homework[] = []
        snapshot.forEach((doc) => {
          homeworkData.push({
            id: doc.id,
            ...doc.data(),
          } as Homework)
        })

        // 🔒 SECURITY: Filter for teachers - only show homework they created
        if (isTeacher) {
          homeworkData = homeworkData.filter(hw => hw.createdBy === userData.id)
        }
        // Admins see all homework (no filtering)

        setHomework(homeworkData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching homework:', err)
        setError(err as Error)
        setLoading(false)
        toast.error(ERROR_MESSAGES.LOAD_HOMEWORK_ERROR)
      }
    )

    return () => unsubscribe()
  }, [userData, isAdmin, isTeacher, isParent])

  return { homework, loading, error }
}

/**
 * Hook to get homework by student ID
 */
export function useHomeworkByStudent(studentId: string) {
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setHomework([])
      setLoading(false)
      return
    }

    const q = query(
      homeworkCollection,
      where('studentId', '==', studentId),
      orderBy('dueDate', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const homeworkData: Homework[]  = []
      snapshot.forEach((doc) => {
        homeworkData.push({
          id: doc.id,
          ...doc.data(),
        } as Homework)
      })
      setHomework(homeworkData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [studentId])

  return { homework, loading }
}

/**
 * Hook to add new homework
 */
export function useAddHomework() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (homeworkData: HomeworkFormValues) => {
      // Convert dates to Timestamp
      const data = {
        ...homeworkData,
        assignedDate: homeworkData.assignedDate instanceof Date
          ? Timestamp.fromDate(homeworkData.assignedDate)
          : homeworkData.assignedDate,
        dueDate: homeworkData.dueDate instanceof Date
          ? Timestamp.fromDate(homeworkData.dueDate)
          : homeworkData.dueDate,
        completedDate: homeworkData.completedDate
          ? homeworkData.completedDate instanceof Date
            ? Timestamp.fromDate(homeworkData.completedDate)
            : homeworkData.completedDate
          : undefined,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(homeworkCollection, data)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] })
      toast.success(SUCCESS_MESSAGES.HOMEWORK_ADDED)
    },
    onError: (error: Error) => {
      console.error('Error adding homework:', error)
      toast.error(ERROR_MESSAGES.ADD_HOMEWORK_ERROR)
    },
  })
}

/**
 * Hook to update homework
 * 🔒 SECURITY FIX: Now validates ownership before update
 * - Admins can update any homework
 * - Teachers can only update homework THEY created
 * - Parents cannot update homework
 */
export function useUpdateHomework() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HomeworkFormValues> }) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Fetch homework first to check ownership
      const docRef = doc(db, COLLECTIONS.HOMEWORK, id)
      const homeworkSnap = await getDoc(docRef)

      if (!homeworkSnap.exists()) {
        throw new Error(ERROR_MESSAGES.HOMEWORK_NOT_FOUND)
      }

      const homework = homeworkSnap.data() as Homework

      // 🔒 SECURITY: Ownership validation
      if (!isAdmin) {
        if (homework.createdBy !== userData.id) {
          throw new Error(ERROR_MESSAGES.NO_PERMISSION_EDIT_HOMEWORK)
        }
      }

      // Convert dates to Timestamp
      const updateData: any = { ...data }

      if (updateData.assignedDate instanceof Date) {
        updateData.assignedDate = Timestamp.fromDate(updateData.assignedDate)
      }
      if (updateData.dueDate instanceof Date) {
        updateData.dueDate = Timestamp.fromDate(updateData.dueDate)
      }
      if (updateData.completedDate instanceof Date) {
        updateData.completedDate = Timestamp.fromDate(updateData.completedDate)
      }

      updateData.updatedAt = serverTimestamp()

      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] })
      toast.success(SUCCESS_MESSAGES.HOMEWORK_UPDATED)
    },
    onError: (error: Error) => {
      console.error('Error updating homework:', error)
      toast.error(ERROR_MESSAGES.UPDATE_HOMEWORK_ERROR)
    },
  })
}

/**
 * Hook to delete homework
 * 🔒 SECURITY FIX: Now validates ownership before deletion
 * - Admins can delete any homework
 * - Teachers can only delete homework THEY created
 * - Parents cannot delete homework
 */
export function useDeleteHomework() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async (homeworkId: string) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Fetch homework first to check ownership
      const docRef = doc(db, COLLECTIONS.HOMEWORK, homeworkId)
      const homeworkSnap = await getDoc(docRef)

      if (!homeworkSnap.exists()) {
        throw new Error(ERROR_MESSAGES.HOMEWORK_NOT_FOUND)
      }

      const homework = homeworkSnap.data() as Homework

      // 🔒 SECURITY: Ownership validation
      if (!isAdmin) {
        // Only admins OR homework creator can delete
        if (homework.createdBy !== userData.id) {
          throw new Error(ERROR_MESSAGES.NO_PERMISSION_DELETE_HOMEWORK)
        }
      }

      // Delete homework
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] })
      toast.success(SUCCESS_MESSAGES.HOMEWORK_DELETED)
    },
    onError: (error: Error) => {
      console.error('Error deleting homework:', error)
      toast.error(ERROR_MESSAGES.DELETE_HOMEWORK_ERROR)
    },
  })
}

/**
 * Hook to mark homework as completed
 */
export function useCompleteHomework() {
  const updateHomework = useUpdateHomework()

  return useMutation({
    mutationFn: async ({ id, grade, teacherNotes }: { id: string; grade?: number; teacherNotes?: string }) => {
      await updateHomework.mutateAsync({
        id,
        data: {
          status: 'completed',
          completedDate: new Date(),
          grade,
          teacherNotes,
        },
      })
    },
  })
}
