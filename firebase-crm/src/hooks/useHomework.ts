import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Homework, HomeworkFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Collection reference
const homeworkCollection = collection(db, 'homework')

/**
 * Hook to get all homework with real-time updates
 */
export function useHomework() {
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    // Real-time listener
    const q = query(homeworkCollection, orderBy('dueDate', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const homeworkData: Homework[] = []
        snapshot.forEach((doc) => {
          homeworkData.push({
            id: doc.id,
            ...doc.data(),
          } as Homework)
        })
        setHomework(homeworkData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching homework:', err)
        setError(err as Error)
        setLoading(false)
        toast.error('Грешка при зареждане на домашни')
      }
    )

    return () => unsubscribe()
  }, [])

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
      toast.success('Домашното беше добавено успешно!')
    },
    onError: (error: Error) => {
      console.error('Error adding homework:', error)
      toast.error('Грешка при добавяне на домашно: ' + error.message)
    },
  })
}

/**
 * Hook to update homework
 */
export function useUpdateHomework() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HomeworkFormValues> }) => {
      const docRef = doc(db, 'homework', id)

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
      toast.success('Домашното беше обновено успешно!')
    },
    onError: (error: Error) => {
      console.error('Error updating homework:', error)
      toast.error('Грешка при обновяване на домашно: ' + error.message)
    },
  })
}

/**
 * Hook to delete homework
 */
export function useDeleteHomework() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (homeworkId: string) => {
      const docRef = doc(db, 'homework', homeworkId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] })
      toast.success('Домашното беше изтрито успешно!')
    },
    onError: (error: Error) => {
      console.error('Error deleting homework:', error)
      toast.error('Грешка при изтриване на домашно: ' + error.message)
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
