import { useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Attendance } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { COLLECTIONS } from '@/lib/collections'
import { validateDocumentOwnership } from '@/utils/security'

const attendanceCollection = collection(db, COLLECTIONS.ATTENDANCE)

/**
 * Hook to get all attendance records with real-time updates
 * 🔒 SECURITY FIX: Now filters attendance by role (PoLP)
 * - Admins see ALL attendance records
 * - Teachers see ALL attendance records (for their assigned groups)
 * - Parents see ONLY attendance for THEIR children (userData.studentIds)
 * - Batches queries for 10+ students (Firestore 'in' operator limit)
 */
export function useAttendance() {
  const { userData, isAdmin, isTeacher, isParent } = useAuth()
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userData) {
      setAttendance([])
      setLoading(false)
      return
    }

    setLoading(true)

    // 🔒 SECURITY: Parents can only see attendance for THEIR children (PoLP)
    // Uses userData.studentIds for server-side filtering
    if (isParent) {
      const studentIds = userData.studentIds || []

      // Handle parents with no children assigned
      if (studentIds.length === 0) {
        setAttendance([])
        setLoading(false)
        return
      }

      // Batch studentIds for Firestore 'in' operator (max 10 items)
      const batchSize = 10
      const batches: string[][] = []
      for (let i = 0; i < studentIds.length; i += batchSize) {
        batches.push(studentIds.slice(i, i + batchSize))
      }

      const unsubscribeAttendance: (() => void)[] = []
      const allAttendance = new Map<string, Attendance>()

      batches.forEach((batch) => {
        const attendanceQuery = query(
          attendanceCollection,
          where('studentId', 'in', batch),
          orderBy('date', 'desc')
        )

        const unsubscribe = onSnapshot(
          attendanceQuery,
          (snapshot) => {
            snapshot.forEach((doc) => {
              allAttendance.set(doc.id, { id: doc.id, ...doc.data() } as Attendance)
            })
            setAttendance(Array.from(allAttendance.values()))
            setLoading(false)
            setError(null)
          },
          (err) => {
            console.error('Error fetching parent attendance:', err)
            setError(err as Error)
            setLoading(false)
            toast.error(ERROR_MESSAGES.LOAD_ATTENDANCE_ERROR)
          }
        )

        unsubscribeAttendance.push(unsubscribe)
      })

      return () => unsubscribeAttendance.forEach((unsub) => unsub())
    }

    // 🔒 SECURITY: Admins and teachers see all attendance records
    const q = query(attendanceCollection, orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const attendanceData: Attendance[] = []
        snapshot.forEach((doc) => {
          attendanceData.push({ id: doc.id, ...doc.data() } as Attendance)
        })
        setAttendance(attendanceData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching attendance:', err)
        setError(err as Error)
        setLoading(false)
        toast.error(ERROR_MESSAGES.LOAD_ATTENDANCE_ERROR)
      }
    )

    return () => unsubscribe()
  }, [userData, isAdmin, isTeacher, isParent])

  return { attendance, loading, error }
}

/**
 * Hook to get attendance records for a specific date
 */
export function useAttendanceByDate(date: Date) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!date) {
      setAttendance([])
      setLoading(false)
      return
    }

    // Create start and end of day
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const q = query(
      attendanceCollection,
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('date')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendanceData: Attendance[] = []
      snapshot.forEach((doc) => {
        attendanceData.push({ id: doc.id, ...doc.data() } as Attendance)
      })
      setAttendance(attendanceData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [date.toISOString()])

  return { attendance, loading }
}

/**
 * Hook to get attendance records for a specific student
 */
export function useAttendanceByStudent(studentId: string) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setAttendance([])
      setLoading(false)
      return
    }

    const q = query(
      attendanceCollection,
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendanceData: Attendance[] = []
      snapshot.forEach((doc) => {
        attendanceData.push({ id: doc.id, ...doc.data() } as Attendance)
      })
      setAttendance(attendanceData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [studentId])

  return { attendance, loading }
}

/**
 * Hook to add attendance record
 */
export function useAddAttendance() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: Omit<Attendance, 'id' | 'createdAt' | 'createdBy'>) => {
      const attendanceData = {
        ...data,
        date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
        createdBy: user?.uid || 'unknown',
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(attendanceCollection, attendanceData)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(SUCCESS_MESSAGES.ATTENDANCE_ADDED)
    },
  })
}

/**
 * Hook to update attendance record
 *
 * Security: Validates document ownership before update
 * - Admins can update any attendance record
 * - Teachers/Users can only update records they created
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<Attendance, 'id' | 'createdAt' | 'createdBy'>>
    }) => {
      // Security: Validate document ownership and fetch current document
      // This ensures only owners (or admins) can update attendance records
      await validateDocumentOwnership(
        COLLECTIONS.ATTENDANCE,
        id,
        user!,
        ERROR_MESSAGES.ATTENDANCE_NOT_FOUND
      )

      const docRef = doc(db, COLLECTIONS.ATTENDANCE, id)
      const updateData = {
        ...data,
        date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
      }
      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(SUCCESS_MESSAGES.ATTENDANCE_UPDATED)
    },
  })
}

/**
 * Hook to delete attendance record
 *
 * Security: Validates document ownership before deletion
 * - Admins can delete any attendance record
 * - Teachers/Users can only delete records they created
 */
export function useDeleteAttendance() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      // Security: Validate document ownership before deletion
      // This ensures only owners (or admins) can delete attendance records
      await validateDocumentOwnership(
        COLLECTIONS.ATTENDANCE,
        id,
        user!,
        ERROR_MESSAGES.ATTENDANCE_NOT_FOUND
      )

      await deleteDoc(doc(db, COLLECTIONS.ATTENDANCE, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(SUCCESS_MESSAGES.ATTENDANCE_DELETED)
    },
  })
}

/**
 * Hook to bulk add attendance for multiple students
 */
export function useBulkAddAttendance() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (
      records: Array<Omit<Attendance, 'id' | 'createdAt' | 'createdBy'>>
    ) => {
      const promises = records.map((data) => {
        const attendanceData = {
          ...data,
          date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
          createdBy: user?.uid || 'unknown',
          createdAt: serverTimestamp(),
        }
        return addDoc(attendanceCollection, attendanceData)
      })
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success(SUCCESS_MESSAGES.BULK_ATTENDANCE_ADDED)
    },
    onError: (error) => {
      console.error('Error bulk adding attendance:', error)
      toast.error(ERROR_MESSAGES.BULK_ATTENDANCE_ERROR)
    },
  })
}

/**
 * Hook to calculate attendance statistics for a student
 */
export function useAttendanceStats(studentId: string) {
  const { attendance } = useAttendanceByStudent(studentId)

  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    absent: attendance.filter((a) => a.status === 'absent').length,
    late: attendance.filter((a) => a.status === 'late').length,
    excused: attendance.filter((a) => a.status === 'excused').length,
    attendanceRate:
      attendance.length > 0
        ? ((attendance.filter((a) => a.status === 'present' || a.status === 'late').length /
            attendance.length) *
            100).toFixed(1)
        : '0',
  }

  return stats
}
