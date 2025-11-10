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
import { Student, StudentFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Collection reference
const studentsCollection = collection(db, 'students')

/**
 * Hook to get all students with real-time updates
 */
export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    // Real-time listener
    const q = query(studentsCollection, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const studentsData: Student[] = []
        snapshot.forEach((doc) => {
          studentsData.push({
            id: doc.id,
            ...doc.data(),
          } as Student)
        })
        setStudents(studentsData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching students:', err)
        setError(err as Error)
        setLoading(false)
        toast.error('Грешка при зареждане на ученици')
      }
    )

    return () => unsubscribe()
  }, [])

  return { students, loading, error }
}

/**
 * Hook to get a single student by ID
 */
export function useStudent(studentId: string) {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const docRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error('Student not found')
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Student
    },
    enabled: !!studentId,
  })
}

/**
 * Hook to get students by parent ID
 */
export function useStudentsByParent(parentId: string) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!parentId) {
      setStudents([])
      setLoading(false)
      return
    }

    const q = query(
      studentsCollection,
      where('parentId', '==', parentId),
      orderBy('name')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentsData: Student[] = []
      snapshot.forEach((doc) => {
        studentsData.push({
          id: doc.id,
          ...doc.data(),
        } as Student)
      })
      setStudents(studentsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [parentId])

  return { students, loading }
}

/**
 * Hook to add a new student
 */
export function useAddStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (studentData: StudentFormValues) => {
      // Convert dueDate to Timestamp if it's a Date
      const data = {
        ...studentData,
        dueDate: studentData.dueDate instanceof Date
          ? Timestamp.fromDate(studentData.dueDate)
          : studentData.dueDate,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(studentsCollection, data)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Ученикът беше добавен успешно!')
    },
    onError: (error: Error) => {
      console.error('Error adding student:', error)
      toast.error('Грешка при добавяне на ученик: ' + error.message)
    },
  })
}

/**
 * Hook to update a student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudentFormValues> }) => {
      const docRef = doc(db, 'students', id)

      // Convert dueDate to Timestamp if it's a Date
      const updateData = {
        ...data,
        dueDate: data.dueDate instanceof Date
          ? Timestamp.fromDate(data.dueDate)
          : data.dueDate,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] })
      toast.success('Ученикът беше обновен успешно!')
    },
    onError: (error: Error) => {
      console.error('Error updating student:', error)
      toast.error('Грешка при обновяване на ученик: ' + error.message)
    },
  })
}

/**
 * Hook to delete a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (studentId: string) => {
      const docRef = doc(db, 'students', studentId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Ученикът беше изтрит успешно!')
    },
    onError: (error: Error) => {
      console.error('Error deleting student:', error)
      toast.error('Грешка при изтриване на ученик: ' + error.message)
    },
  })
}

/**
 * Hook to get active students count
 */
export function useActiveStudentsCount() {
  const { students } = useStudents()
  return students.filter((s) => s.status === 'active').length
}

/**
 * Hook to search students by name
 */
export function useSearchStudents(searchTerm: string) {
  const { students, loading } = useStudents()

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return { students: filteredStudents, loading }
}

/**
 * Hook to bulk add students (for CSV import)
 */
export function useBulkAddStudents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (students: Array<Omit<Student, 'id' | 'createdAt' | 'createdBy'>>) => {
      const promises = students.map((studentData) => {
        const data = {
          ...studentData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: 'admin', // TODO: get from auth context
        }
        return addDoc(studentsCollection, data)
      })

      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Учениците бяха импортирани успешно!')
    },
    onError: (error: Error) => {
      console.error('Error bulk adding students:', error)
      toast.error('Грешка при импортиране на ученици: ' + error.message)
    },
  })
}
