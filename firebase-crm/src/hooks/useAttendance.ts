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

const attendanceCollection = collection(db, 'attendance')

/**
 * Hook to get all attendance records with real-time updates
 */
export function useAttendance() {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(attendanceCollection, orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendanceData: Attendance[] = []
      snapshot.forEach((doc) => {
        attendanceData.push({ id: doc.id, ...doc.data() } as Attendance)
      })
      setAttendance(attendanceData)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { attendance, loading }
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
      toast.success('Присъствието беше записано!')
    },
  })
}

/**
 * Hook to update attendance record
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<Attendance, 'id' | 'createdAt' | 'createdBy'>>
    }) => {
      const docRef = doc(db, 'attendance', id)
      const updateData = {
        ...data,
        date: data.date instanceof Date ? Timestamp.fromDate(data.date) : data.date,
      }
      await updateDoc(docRef, updateData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Присъствието беше обновено!')
    },
  })
}

/**
 * Hook to delete attendance record
 */
export function useDeleteAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'attendance', id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Записът беше изтрит!')
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
      toast.success('Присъствията бяха записани успешно!')
    },
    onError: (error) => {
      console.error('Error bulk adding attendance:', error)
      toast.error('Грешка при записване на присъствия')
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
