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
  documentId,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Student, StudentFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { COLLECTIONS } from '@/lib/collections'
import { syncAllStudentData } from './useDenormalizedSync'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { validateDocumentGroupAccess, validateDocumentOwnership } from '@/utils/security'
import { toTimestamp } from '@/utils/date'
import { QUERY_KEYS } from '@/constants/queryKeys'

// Collection reference
const studentsCollection = collection(db, COLLECTIONS?.STUDENTS)

/**
 * Hook to get all students with real-time updates
 *
 * @description Fetches students with role-based access control and real-time synchronization.
 * Implements server-side filtering for parents and client-side filtering for teachers.
 *
 * @returns {{students: Student[], loading: boolean, error: Error | null}} Object containing:
 *   - students: Array of student records visible to the current user
 *   - loading: True while fetching data
 *   - error: Error object if fetch fails, null otherwise
 *
 * @security
 * - **Admins**: See ALL students
 * - **Teachers**: See ONLY students in their assigned groups (client-side filter)
 * - **Parents**: See ONLY their children via userData?.studentIds (server-side filter)
 *   - Implements batching for 10+ children (Firestore 'in' query limit)
 *   - Prevents data leakage even if parent knows other student IDs
 *
 * @example
 * ```tsx
 * function StudentsList() {
 *   const { students, loading, error } = useStudents()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <Error message={error?.message} />
 *
 *   return students?.map(student => <StudentCard key={student?.id} {...student} />)
 * }
 * ```
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

    // 🔒 SECURITY: Parents can ONLY see THEIR children (based on userData?.studentIds)
    // This prevents parents from accessing other students even if they know the IDs
    if (isParent) {
      if (!userData?.studentIds || userData?.studentIds.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      setLoading(true)

      // 🔒 SECURITY: Query students WHERE id IN userData?.studentIds
      // Firestore 'in' query limit is 10, so we need to batch if more studentIds exist
      const studentIdBatches: string[][] = []
      for (let i = 0; i < userData?.studentIds.length; i += 10) {
        studentIdBatches?.push(userData?.studentIds.slice(i, i + 10))
      }

      const unsubscribes: (() => void)[] = []
      const allStudents: Student[] = []

      studentIdBatches?.forEach((batch) => {
        const q = query(
          studentsCollection,
          where(documentId(), 'in', batch)
        )

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            // Collect students from this batch
            snapshot?.forEach((doc) => {
              const student = { id: doc?.id, ...doc?.data() } as Student
              // Check if already in array (avoid duplicates across batches)
              const existingIndex = allStudents?.findIndex(s => s?.id === student?.id)
              if (existingIndex >= 0) {
                allStudents[existingIndex] = student
              } else {
                allStudents?.push(student)
              }
            })

            setStudents([...allStudents])
            setLoading(false)
            setError(null)
          },
          (err) => {
            console?.error('Error fetching students for parent:', err)
            setError(err as Error)
            setLoading(false)
            toast?.error(ERROR_MESSAGES?.LOAD_STUDENTS_ERROR)
          }
        )

        unsubscribes?.push(unsubscribe)
      })

      return () => {
        unsubscribes?.forEach(unsub => unsub())
      }
    }

    setLoading(true)

    // Real-time listener (fetches all students, then filters client-side for teachers)
    const q = query(studentsCollection, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let studentsData: Student[] = []
        snapshot?.forEach((doc) => {
          studentsData?.push({
            id: doc?.id,
            ...doc?.data(),
          } as Student)
        })

        // 🔒 SECURITY: Filter for teachers by assignedGroups
        if (isTeacher && userData?.assignedGroups && userData?.assignedGroups.length > 0) {
          studentsData = studentsData?.filter(s =>
            userData?.assignedGroups?.includes(s?.group)
          )
        }
        // Admins see all students (no filtering)

        setStudents(studentsData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console?.error('Error fetching students:', err)
        setError(err as Error)
        setLoading(false)
        toast?.error(ERROR_MESSAGES?.LOAD_STUDENTS_ERROR)
      }
    )

    return () => unsubscribe()
  }, [userData, isAdmin, isTeacher, isParent])

  return { students, loading, error }
}

/**
 * Hook to get a single student by ID
 *
 * @description Fetches a single student record using React Query for caching and automatic refetching.
 *
 * @param {string} studentId - The unique identifier of the student
 * @returns {UseQueryResult<Student>} React Query result object with student data
 *
 * @example
 * ```tsx
 * function StudentProfile({ id }: { id: string }) {
 *   const { data: student, isLoading } = useStudent(id)
 *
 *   if (isLoading) return <Spinner />
 *   if (!student) return <NotFound />
 *
 *   return <Profile name={student?.name} group={student?.group} />
 * }
 * ```
 */
export function useStudent(studentId: string) {
  return useQuery({
    queryKey: QUERY_KEYS?.student(studentId),
    queryFn: async () => {
      const docRef = doc(db, 'students', studentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap?.exists()) {
        throw new Error('Student not found')
      }

      return {
        id: docSnap?.id,
        ...docSnap?.data(),
      } as Student
    },
    enabled: !!studentId,
  })
}

/**
 * Hook to get students by parent ID with real-time updates
 *
 * @description Fetches all students linked to a specific parent with live synchronization.
 *
 * @param {string} parentId - The unique identifier of the parent
 * @returns {{students: Student[], loading: boolean}} Object containing:
 *   - students: Array of students belonging to this parent
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function ParentStudents({ parentId }: { parentId: string }) {
 *   const { students, loading } = useStudentsByParent(parentId)
 *
 *   return loading ? <Spinner /> : students?.map(s => <StudentCard {...s} />)
 * }
 * ```
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
      snapshot?.forEach((doc) => {
        studentsData?.push({
          id: doc?.id,
          ...doc?.data(),
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
 *
 * @description Creates a new student record with automatic timestamp and ownership tracking.
 * Shows success/error toasts and invalidates the students query cache.
 *
 * @returns {UseMutationResult} React Query mutation object with:
 *   - mutate/mutateAsync: Function to trigger student creation
 *   - isPending: True while request is in progress
 *   - isSuccess/isError: Status flags
 *
 * @security Populates createdBy field with current user?.uid for ownership tracking
 *
 * @example
 * ```tsx
 * function AddStudentForm() {
 *   const addStudent = useAddStudent()
 *
 *   const handleSubmit = async (data: StudentFormValues) => {
 *     await addStudent?.mutateAsync(data)
 *     onClose()
 *   }
 *
 *   return <Form onSubmit={handleSubmit} loading={addStudent?.isPending} />
 * }
 * ```
 */
export function useAddStudent() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (studentData: StudentFormValues) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // Convert dueDate to Timestamp if it's a Date
      const data = {
        ...studentData,
        dueDate: toTimestamp(studentData?.dueDate),
        createdBy: user?.uid, // 🔒 SECURITY: Track who created this student
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(studentsCollection, data)
      return docRef?.id
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.students })
      toast?.success(SUCCESS_MESSAGES?.STUDENT_ADDED)
    },
    onError: (error: Error) => {
      console?.error('Error adding student:', error)
      toast?.error(ERROR_MESSAGES?.ADD_STUDENT_ERROR + ': ' + error?.message)
    },
  })
}

/**
 * Hook to update a student
 *
 * @description Updates an existing student record with security validation and denormalized data sync.
 *
 * @returns {UseMutationResult} React Query mutation object
 *
 * @security
 * - **Admins**: Can update any student
 * - **Teachers**: Can only update students in their assigned groups
 * - **Parents**: Cannot update students
 *
 * @sideEffects
 * - Syncs denormalized studentName across related collections if name changed
 * - Invalidates students and individual student query caches
 *
 * @example
 * ```tsx
 * function EditStudentForm({ student }: { student: Student }) {
 *   const updateStudent = useUpdateStudent()
 *
 *   const handleSubmit = async (data: Partial<StudentFormValues>) => {
 *     await updateStudent?.mutateAsync({ id: student?.id, data })
 *   }
 *
 *   return <Form onSubmit={handleSubmit} disabled={updateStudent?.isPending} />
 * }
 * ```
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StudentFormValues> }) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate group access using centralized utility
      await validateDocumentGroupAccess(COLLECTIONS?.STUDENTS, id, userData, ERROR_MESSAGES?.STUDENT_NOT_FOUND)

      // Convert dueDate to Timestamp if it's a Date
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      }
      if (updateData?.dueDate) {
        updateData?.dueDate = toTimestamp(updateData?.dueDate)
      }

      const docRef = doc(db, COLLECTIONS?.STUDENTS, id)
      await updateDoc(docRef, updateData)

      // 🎯 SSOT: Sync denormalized data if name changed
      if (data?.name) {
        await syncAllStudentData(id, data?.name)
      }
    },
    onSuccess: (_, variables) => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.students })
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.student(variables?.id) })
      toast?.success(SUCCESS_MESSAGES?.STUDENT_UPDATED)
    },
    onError: (error: Error) => {
      console?.error('Error updating student:', error)
      toast?.error(ERROR_MESSAGES?.UPDATE_STUDENT_ERROR + ': ' + error?.message)
    },
  })
}

/**
 * Hook to delete a student
 *
 * @description Permanently deletes a student record after ownership validation.
 *
 * @returns {UseMutationResult} React Query mutation object
 *
 * @security
 * - **Admins**: Can delete any student
 * - **Teachers**: Can only delete students THEY created (checks createdBy field)
 * - **Parents**: Cannot delete students
 *
 * @warning This is a destructive operation and cannot be undone
 *
 * @example
 * ```tsx
 * function DeleteStudentButton({ studentId }: { studentId: string }) {
 *   const deleteStudent = useDeleteStudent()
 *
 *   const handleDelete = () => {
 *     if (confirm('Are you sure?')) {
 *       deleteStudent?.mutate(studentId)
 *     }
 *   }
 *
 *   return <Button onClick={handleDelete} disabled={deleteStudent?.isPending} />
 * }
 * ```
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()
  const { user, userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async (studentId: string) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Validate ownership using centralized utility
      await validateDocumentOwnership(COLLECTIONS?.STUDENTS, studentId, userData, ERROR_MESSAGES?.STUDENT_NOT_FOUND)

      // Delete student
      const docRef = doc(db, COLLECTIONS?.STUDENTS, studentId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.students })
      toast?.success(SUCCESS_MESSAGES?.STUDENT_DELETED)
    },
    onError: (error: Error) => {
      console?.error('Error deleting student:', error)
      toast?.error(ERROR_MESSAGES?.DELETE_STUDENT_ERROR + ': ' + error?.message)
    },
  })
}

/**
 * Hook to get active students count
 *
 * @description Calculates the number of students with 'active' status.
 * Uses the useStudents hook internally, so it respects RBAC filtering.
 *
 * @returns {number} Count of active students visible to current user
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const activeCount = useActiveStudentsCount()
 *
 *   return <StatCard title="Active Students" value={activeCount} />
 * }
 * ```
 */
export function useActiveStudentsCount() {
  const { students } = useStudents()
  return students?.filter((s) => s?.status === 'active').length
}

/**
 * Hook to search students by name
 *
 * @description Filters students by name using case-insensitive search.
 * Uses the useStudents hook internally, so it respects RBAC filtering.
 *
 * @param {string} searchTerm - The search query (case-insensitive)
 * @returns {{students: Student[], loading: boolean}} Filtered students and loading state
 *
 * @example
 * ```tsx
 * function StudentSearch() {
 *   const [query, setQuery] = useState('')
 *   const { students, loading } = useSearchStudents(query)
 *
 *   return (
 *     <>
 *       <SearchInput value={query} onChange={setQuery} />
 *       {loading ? <Spinner /> : students?.map(s => <StudentCard {...s} />)}
 *     </>
 *   )
 * }
 * ```
 */
export function useSearchStudents(searchTerm: string) {
  const { students, loading } = useStudents()

  const filteredStudents = students?.filter((student) =>
    student?.name.toLowerCase().includes(searchTerm?.toLowerCase())
  )

  return { students: filteredStudents, loading }
}

/**
 * Hook to bulk add students (for CSV import)
 *
 * @description Creates multiple student records in a single operation.
 * Useful for CSV imports or batch student registration.
 *
 * @returns {UseMutationResult} React Query mutation object
 *
 * @security Each student record is stamped with current user?.uid as createdBy
 *
 * @performance Uses Promise?.all for parallel writes to Firestore
 *
 * @example
 * ```tsx
 * function CSVImport() {
 *   const bulkAdd = useBulkAddStudents()
 *
 *   const handleImport = async (csvData: Array<Omit<Student, 'id' | 'createdAt' | 'createdBy'>>) => {
 *     await bulkAdd?.mutateAsync(csvData)
 *     toast?.success(`Imported ${csvData?.length} students`)
 *   }
 *
 *   return <CSVUploader onParse={handleImport} />
 * }
 * ```
 */
export function useBulkAddStudents() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (students: Array<Omit<Student, 'id' | 'createdAt' | 'createdBy'>>) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      const promises = students?.map((studentData) => {
        const data = {
          ...studentData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user?.uid, // 🔒 SECURITY: Track who imported these students
        }
        return addDoc(studentsCollection, data)
      })

      await Promise?.all(promises)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.students })
      toast?.success(SUCCESS_MESSAGES?.STUDENTS_IMPORTED)
    },
    onError: (error: Error) => {
      console?.error('Error bulk adding students:', error)
      toast?.error(ERROR_MESSAGES?.IMPORT_STUDENTS_ERROR + ': ' + error?.message)
    },
  })
}
