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
import { useAuth } from './useAuth'
import { COLLECTIONS } from '@/lib/collections'

// Collection reference
const studentsCollection = collection(db, COLLECTIONS.STUDENTS)

/**
 * Hook to get all students with real-time updates
 * 🔒 SECURITY FIX: Now filters students by role
 * - Admins see ALL students
 * - Teachers see ONLY students in their assigned groups
 * - Parents should use useStudentsByParent() instead
 */
export function useStudents() {
  const { userData, isAdmin, isTeacher, isParent } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userData) {
      setStudents([])
      setLoading(false)
      return
    }

    // 🔒 SECURITY: Parents should use useStudentsByParent() instead
    if (isParent) {
      setStudents([])
      setLoading(false)
      return
    }

    setLoading(true)

    // Real-time listener (fetches all students, then filters client-side for teachers)
    const q = query(studentsCollection, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let studentsData: Student[] = []
        snapshot.forEach((doc) => {
          studentsData.push({
            id: doc.id,
            ...doc.data(),
          } as Student)
        })

        // 🔒 SECURITY: Filter for teachers by assignedGroups
        if (isTeacher && userData.assignedGroups && userData.assignedGroups.length > 0) {
          studentsData = studentsData.filter(s =>
            userData.assignedGroups?.includes(s.group)
          )
        }
        // Admins see all students (no filtering)

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
  }, [userData, isAdmin, isTeacher, isParent])

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
 * 🔒 SECURITY FIX: Now populates createdBy field for ownership tracking
 */
export function useAddStudent() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (studentData: StudentFormValues) => {
      if (!user) {
        throw new Error('Не сте влезли в системата')
      }

      // Convert dueDate to Timestamp if it's a Date
      const data = {
        ...studentData,
        dueDate: studentData.dueDate instanceof Date
          ? Timestamp.fromDate(studentData.dueDate)
          : studentData.dueDate,
        createdBy: user.uid, // 🔒 SECURITY: Track who created this student
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
 * 🔒 SECURITY FIX: Now validates group ownership before update
 * - Admins can update any student
 * - Teachers can only update students in their assigned groups
 * - Parents cannot update students
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudentFormValues> }) => {
      if (!userData) {
        throw new Error('Не сте влезли в системата')
      }

      // 🔒 SECURITY: Fetch student first to check group ownership
      const docRef = doc(db, COLLECTIONS.STUDENTS, id)
      const studentSnap = await getDoc(docRef)

      if (!studentSnap.exists()) {
        throw new Error('Ученикът не е намерен')
      }

      const student = studentSnap.data() as Student

      // 🔒 SECURITY: Group ownership validation
      if (!isAdmin) {
        // Teachers can only update students in their assigned groups
        if (userData.role === 'teacher') {
          if (!userData.assignedGroups || !userData.assignedGroups.includes(student.group)) {
            throw new Error('Нямате права да променяте този ученик')
          }
        } else {
          // Parents and other roles cannot update students
          throw new Error('Нямате права да променяте ученици')
        }
      }

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
 * 🔒 SECURITY FIX: Now validates ownership before deletion
 * - Admins can delete any student
 * - Teachers can only delete students THEY created
 * - Parents cannot delete students
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()
  const { user, userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async (studentId: string) => {
      if (!userData) {
        throw new Error('Не сте влезли в системата')
      }

      // 🔒 SECURITY: Fetch student first to check ownership
      const docRef = doc(db, COLLECTIONS.STUDENTS, studentId)
      const studentSnap = await getDoc(docRef)

      if (!studentSnap.exists()) {
        throw new Error('Ученикът не е намерен')
      }

      const student = studentSnap.data() as Student

      // 🔒 SECURITY: Ownership validation
      if (!isAdmin) {
        // Only admins OR student creator can delete
        if (student.createdBy !== userData.id) {
          throw new Error('Нямате права да изтриете този ученик')
        }
      }

      // Delete student
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
 * 🔒 SECURITY FIX: Now uses actual user ID for createdBy field
 */
export function useBulkAddStudents() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (students: Array<Omit<Student, 'id' | 'createdAt' | 'createdBy'>>) => {
      if (!user) {
        throw new Error('Не сте влезли в системата')
      }

      const promises = students.map((studentData) => {
        const data = {
          ...studentData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user.uid, // 🔒 SECURITY: Track who imported these students
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
