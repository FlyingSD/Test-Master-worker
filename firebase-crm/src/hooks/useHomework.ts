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
import { validateDocumentOwnership } from '@/utils/security'
import { toTimestamp } from '@/utils/date'
import { QUERY_KEYS } from '@/constants/queryKeys'

// Collection reference
const homeworkCollection = collection(db, COLLECTIONS?.HOMEWORK)

/**
 * Hook to get all homework with real-time updates
 * 🔒 SECURITY FIX: Now filters homework by role (PoLP)
 * - Admins see ALL homework
 * - Teachers see ONLY homework they created (ownership-based filtering)
 * - Parents see ONLY homework for THEIR children (userData?.studentIds)
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
    // Uses userData?.studentIds for server-side filtering
    if (isParent) {
      const studentIds = userData?.studentIds || []

      // Handle parents with no children assigned
      if (studentIds?.length === 0) {
        setHomework([])
        setLoading(false)
        return
      }

      // Batch studentIds for Firestore 'in' operator (max 10 items)
      const batchSize = 10
      const batches: string[][] = []
      for (let i = 0; i < studentIds?.length; i += batchSize) {
        batches?.push(studentIds?.slice(i, i + batchSize))
      }

      const unsubscribeHomework: (() => void)[] = []
      const allHomework = new Map<string, Homework>()

      batches?.forEach((batch) => {
        const homeworkQuery = query(
          homeworkCollection,
          where('studentId', 'in', batch),
          orderBy('dueDate', 'desc')
        )

        const unsubscribe = onSnapshot(
          homeworkQuery,
          (snapshot) => {
            snapshot?.forEach((doc) => {
              allHomework?.set(doc?.id, { id: doc?.id, ...doc?.data() } as Homework)
            })
            setHomework(Array?.from(allHomework?.values()))
            setLoading(false)
            setError(null)
          },
          (err) => {
            console?.error('Error fetching parent homework:', err)
            setError(err as Error)
            setLoading(false)
            toast?.error(ERROR_MESSAGES?.LOAD_HOMEWORK_ERROR)
          }
        )

        unsubscribeHomework?.push(unsubscribe)
      })

      return () => unsubscribeHomework?.forEach((unsub) => unsub())
    }

    // Real-time listener
    const q = query(homeworkCollection, orderBy('dueDate', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let homeworkData: Homework[] = []
        snapshot?.forEach((doc) => {
          homeworkData?.push({
            id: doc?.id,
            ...doc?.data(),
          } as Homework)
        })

        // 🔒 SECURITY: Filter for teachers - only show homework they created
        if (isTeacher) {
          homeworkData = homeworkData?.filter(hw => hw?.createdBy === userData?.id)
        }
        // Admins see all homework (no filtering)

        setHomework(homeworkData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console?.error('Error fetching homework:', err)
        setError(err as Error)
        setLoading(false)
        toast?.error(ERROR_MESSAGES?.LOAD_HOMEWORK_ERROR)
      }
    )

    return () => unsubscribe()
  }, [userData, isAdmin, isTeacher, isParent])

  return { homework, loading, error }
}

/**
 * Hook to get homework by student ID
 *
 * @description Fetches all homework assignments for a specific student with real-time updates.
 * Orders homework by due date in descending order (newest/furthest first).
 *
 * @param {string} studentId - The unique identifier of the student
 *
 * @returns {{homework: Homework[], loading: boolean}} Object containing:
 *   - homework: Array of homework assignments for the specified student
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function StudentHomework({ studentId }: { studentId: string }) {
 *   const { homework, loading } = useHomeworkByStudent(studentId)
 *
 *   if (loading) return <Spinner />
 *
 *   return homework?.map(hw => <HomeworkCard key={hw?.id} {...hw} />)
 * }
 * ```
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
      snapshot?.forEach((doc) => {
        homeworkData?.push({
          id: doc?.id,
          ...doc?.data(),
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
 *
 * @description Creates a new homework assignment with automatic timestamp conversion and ownership tracking.
 * Converts Date objects to Firestore Timestamps for assignedDate, dueDate, and optionally completedDate.
 *
 * @returns {UseMutationResult} React Query mutation object with:
 *   - mutate/mutateAsync: Function to trigger homework creation
 *   - isPending: True while request is in progress
 *   - isSuccess/isError: Status flags
 *
 * @security Populates createdBy field with current user?.uid for ownership tracking
 *
 * @example
 * ```tsx
 * function HomeworkForm() {
 *   const addHomework = useAddHomework()
 *
 *   const handleSubmit = async (data: HomeworkFormValues) => {
 *     await addHomework?.mutateAsync(data)
 *     toast?.success('Homework assigned!')
 *     onClose()
 *   }
 *
 *   return <Form onSubmit={handleSubmit} loading={addHomework?.isPending} />
 * }
 * ```
 */
export function useAddHomework() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (homeworkData: HomeworkFormValues) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // Convert dates to Timestamp
      const data = {
        ...homeworkData,
        assignedDate: toTimestamp(homeworkData?.assignedDate),
        dueDate: toTimestamp(homeworkData?.dueDate),
        completedDate: homeworkData?.completedDate
          ? toTimestamp(homeworkData?.completedDate)
          : undefined,
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(homeworkCollection, data)
      return docRef?.id
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.homework })
      toast?.success(SUCCESS_MESSAGES?.HOMEWORK_ADDED)
    },
    onError: (error: Error) => {
      console?.error('Error adding homework:', error)
      toast?.error(ERROR_MESSAGES?.ADD_HOMEWORK_ERROR)
    },
  })
}

/**
 * Hook to update homework
 *
 * @description Updates an existing homework assignment after validating ownership.
 * Converts Date objects to Firestore Timestamps if present.
 *
 * @param {object} params - Update parameters
 * @param {string} params?.id - The homework ID to update
 * @param {Partial<HomeworkFormValues>} params?.data - Partial homework data to update
 *
 * @returns {UseMutationResult} React Query mutation object for homework update
 *
 * @security 🔒 Validates ownership before update using validateDocumentOwnership:
 * - **Admins**: Can update any homework
 * - **Teachers**: Can only update homework THEY created
 * - **Parents**: Cannot update homework
 *
 * @example
 * ```tsx
 * function EditHomeworkForm({ homework }: { homework: Homework }) {
 *   const updateHomework = useUpdateHomework()
 *
 *   const handleSubmit = async (data: Partial<HomeworkFormValues>) => {
 *     await updateHomework?.mutateAsync({ id: homework?.id, data })
 *   }
 *
 *   return <Form initialValues={homework} onSubmit={handleSubmit} />
 * }
 * ```
 */
export function useUpdateHomework() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HomeworkFormValues> }) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership before update
      await validateDocumentOwnership(
        COLLECTIONS?.HOMEWORK,
        id,
        userData,
        ERROR_MESSAGES?.HOMEWORK_NOT_FOUND
      )

      // Convert dates to Timestamp
      const updateData: Record<string, any> = { ...data }

      if (updateData?.assignedDate) {
        updateData?.assignedDate = toTimestamp(updateData?.assignedDate)
      }
      if (updateData?.dueDate) {
        updateData?.dueDate = toTimestamp(updateData?.dueDate)
      }
      if (updateData?.completedDate) {
        updateData?.completedDate = toTimestamp(updateData?.completedDate)
      }

      updateData?.updatedAt = serverTimestamp()

      const docRef = doc(db, COLLECTIONS?.HOMEWORK, id)
      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.homework })
      toast?.success(SUCCESS_MESSAGES?.HOMEWORK_UPDATED)
    },
    onError: (error: Error) => {
      console?.error('Error updating homework:', error)
      toast?.error(ERROR_MESSAGES?.UPDATE_HOMEWORK_ERROR)
    },
  })
}

/**
 * Hook to delete homework
 *
 * @description Deletes a homework assignment after validating ownership.
 *
 * @param {string} homeworkId - The unique identifier of the homework to delete
 *
 * @returns {UseMutationResult} React Query mutation object for homework deletion
 *
 * @security 🔒 Validates ownership before deletion using validateDocumentOwnership:
 * - **Admins**: Can delete any homework
 * - **Teachers**: Can only delete homework THEY created
 * - **Parents**: Cannot delete homework
 *
 * @example
 * ```tsx
 * function HomeworkRow({ homework }: { homework: Homework }) {
 *   const deleteHomework = useDeleteHomework()
 *
 *   const handleDelete = async () => {
 *     if (confirm('Delete this homework assignment?')) {
 *       await deleteHomework?.mutateAsync(homework?.id)
 *     }
 *   }
 *
 *   return <Button onClick={handleDelete}>Delete</Button>
 * }
 * ```
 */
export function useDeleteHomework() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async (homeworkId: string) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership before deletion
      await validateDocumentOwnership(
        COLLECTIONS?.HOMEWORK,
        homeworkId,
        userData,
        ERROR_MESSAGES?.HOMEWORK_NOT_FOUND
      )

      // Delete homework
      const docRef = doc(db, COLLECTIONS?.HOMEWORK, homeworkId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.homework })
      toast?.success(SUCCESS_MESSAGES?.HOMEWORK_DELETED)
    },
    onError: (error: Error) => {
      console?.error('Error deleting homework:', error)
      toast?.error(ERROR_MESSAGES?.DELETE_HOMEWORK_ERROR)
    },
  })
}

/**
 * Hook to mark homework as completed
 *
 * @description Convenience hook that marks homework as completed with optional grade and teacher notes.
 * Internally uses useUpdateHomework with specific update data.
 *
 * @param {object} params - Completion parameters
 * @param {string} params?.id - The homework ID to mark as completed
 * @param {number} [params?.grade] - Optional grade for the homework
 * @param {string} [params?.teacherNotes] - Optional teacher notes/feedback
 *
 * @returns {UseMutationResult} React Query mutation object
 *
 * @example
 * ```tsx
 * function HomeworkGrading({ homework }: { homework: Homework }) {
 *   const completeHomework = useCompleteHomework()
 *
 *   const handleGrade = async (grade: number, notes: string) => {
 *     await completeHomework?.mutateAsync({
 *       id: homework?.id,
 *       grade,
 *       teacherNotes: notes
 *     })
 *     toast?.success('Homework graded!')
 *   }
 *
 *   return <GradingForm onSubmit={handleGrade} />
 * }
 * ```
 */
export function useCompleteHomework() {
  const updateHomework = useUpdateHomework()

  return useMutation({
    mutationFn: async ({ id, grade, teacherNotes }: { id: string; grade?: number; teacherNotes?: string }) => {
      await updateHomework?.mutateAsync({
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
