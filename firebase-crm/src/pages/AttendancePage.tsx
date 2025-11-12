import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Save, FileDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStudents } from '@/hooks/useStudents'
import { useAttendanceByDate, useBulkAddAttendance } from '@/hooks/useAttendance'
import { formatDate } from '@/utils/formatters'
import { exportAttendanceToExcel } from '@/utils/excelExport'
import { Attendance } from '@/types'

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

interface StudentAttendance {
  studentId: string
  studentName: string
  status: AttendanceStatus | null
  notes: string
}

export default function AttendancePage() {
  const { userData } = useAuth()
  const { students } = useStudents()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const { attendance: existingAttendance } = useAttendanceByDate(selectedDate)
  const bulkAddAttendance = useBulkAddAttendance()

  // 🔒 SECURITY: Only teachers and admins can mark attendance
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }

  // Get unique groups
  const groups = Array.from(new Set(students?.map((s) => s?.group).filter(Boolean)))

  // Filter students by group and active status
  const filteredStudents = students?.filter(
    (student) =>
      student?.status === 'active' &&
      (selectedGroup === 'all' || student?.group === selectedGroup)
  )

  // Initialize attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendance[]>(
    filteredStudents?.map((student) => {
      // Check if attendance already exists for this student on this date
      const existing = existingAttendance?.find((a) => a?.studentId === student?.id)
      return {
        studentId: student?.id,
        studentName: student?.name,
        status: existing ? existing?.status : null,
        notes: existing ? existing?.notes || '' : '',
      }
    })
  )

  // Update attendance records when students or date changes
  useState(() => {
    setAttendanceRecords(
      filteredStudents?.map((student) => {
        const existing = existingAttendance?.find((a) => a?.studentId === student?.id)
        return {
          studentId: student?.id,
          studentName: student?.name,
          status: existing ? existing?.status : null,
          notes: existing ? existing?.notes || '' : '',
        }
      })
    )
  })

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) =>
      prev?.map((record) =>
        record?.studentId === studentId ? { ...record, status } : record
      )
    )
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceRecords((prev) =>
      prev?.map((record) =>
        record?.studentId === studentId ? { ...record, notes } : record
      )
    )
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    setAttendanceRecords((prev) =>
      prev?.map((record) => ({ ...record, status }))
    )
  }

  const handleSave = async () => {
    const recordsToSave = attendanceRecords
      .filter((record) => record?.status !== null)
      .map((record) => ({
        studentId: record?.studentId,
        studentName: record?.studentName,
        eventId: '', // Can be linked to specific event if needed
        date: selectedDate,
        status: record?.status!,
        notes: record?.notes,
      }))

    if (recordsToSave?.length === 0) {
      alert('Моля отбележете поне един ученик')
      return
    }

    await bulkAddAttendance?.mutateAsync(recordsToSave)
  }

  const getStatusIcon = (status: AttendanceStatus | null) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'late':
        return <Clock className="w-5 h-5 text-orange-600" />
      case 'excused':
        return <AlertCircle className="w-5 h-5 text-blue-600" />
      default:
        return <div className="w-5 h-5 bg-gray-200 rounded-full" />
    }
  }

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-green-500 hover:bg-green-600'
      case 'absent':
        return 'bg-red-500 hover:bg-red-600'
      case 'late':
        return 'bg-orange-500 hover:bg-orange-600'
      case 'excused':
        return 'bg-blue-500 hover:bg-blue-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  // Calculate stats
  const stats = {
    total: attendanceRecords?.length,
    present: attendanceRecords?.filter((r) => r?.status === 'present').length,
    absent: attendanceRecords?.filter((r) => r?.status === 'absent').length,
    late: attendanceRecords?.filter((r) => r?.status === 'late').length,
    excused: attendanceRecords?.filter((r) => r?.status === 'excused').length,
    unmarked: attendanceRecords?.filter((r) => r?.status === null).length,
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Присъствия</h1>
          <p className="text-gray-600 mt-1">Отбелязване на присъствия по групи</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportAttendanceToExcel(existingAttendance)}
            className="btn btn-ghost"
            disabled={existingAttendance?.length === 0}
          >
            <FileDown className="w-5 h-5" />
            Експорт Excel
          </button>
          <button
            onClick={handleSave}
            disabled={bulkAddAttendance?.isPending || stats?.unmarked === stats?.total}
            className="btn btn-primary"
          >
            {bulkAddAttendance?.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Запазване...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Запази присъствия
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card">
          <p className="text-sm text-gray-600">Всички</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.total}</p>
        </div>
        <div className="card bg-green-50">
          <p className="text-sm text-green-600">Присъстват</p>
          <p className="text-2xl font-bold text-green-700">{stats?.present}</p>
        </div>
        <div className="card bg-red-50">
          <p className="text-sm text-red-600">Отсъстват</p>
          <p className="text-2xl font-bold text-red-700">{stats?.absent}</p>
        </div>
        <div className="card bg-orange-50">
          <p className="text-sm text-orange-600">Закъснели</p>
          <p className="text-2xl font-bold text-orange-700">{stats?.late}</p>
        </div>
        <div className="card bg-blue-50">
          <p className="text-sm text-blue-600">Оправдани</p>
          <p className="text-2xl font-bold text-blue-700">{stats?.excused}</p>
        </div>
        <div className="card bg-gray-50">
          <p className="text-sm text-gray-600">Неотбелязани</p>
          <p className="text-2xl font-bold text-gray-700">{stats?.unmarked}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Date picker */}
          <div>
            <label className="label">Дата</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                className="input pl-10"
                value={selectedDate?.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e?.target.value))}
              />
            </div>
          </div>

          {/* Group selector */}
          <div className="flex-1">
            <label className="label">Група</label>
            <select
              className="input"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e?.target.value)}
            >
              <option value="all">Всички групи</option>
              {groups?.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Mark All buttons */}
          <div>
            <label className="label">Бързо отбелязване</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAll('present')}
                className="btn bg-green-500 hover:bg-green-600 text-white"
                title="Отбележи всички като присъстващи"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMarkAll('absent')}
                className="btn bg-red-500 hover:bg-red-600 text-white"
                title="Отбележи всички като отсъстващи"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="card">
        {filteredStudents?.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Няма ученици в тази група
            </h3>
            <p className="text-gray-600">
              Изберете друга група или добавете ученици
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendanceRecords?.map((record) => (
              <div
                key={record?.studentId}
                className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors"
              >
                {/* Student Name */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {record?.studentName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record?.studentName}</p>
                    <p className="text-sm text-gray-500">
                      {students?.find((s) => s?.id === record?.studentId)?.group}
                    </p>
                  </div>
                  {getStatusIcon(record?.status)}
                </div>

                {/* Status Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(record?.studentId, 'present')}
                    className={`btn ${
                      record?.status === 'present'
                        ? 'bg-green-500 text-white'
                        : 'btn-ghost'
                    }`}
                    title="Присъства"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden md:inline">Присъства</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(record?.studentId, 'absent')}
                    className={`btn ${
                      record?.status === 'absent' ? 'bg-red-500 text-white' : 'btn-ghost'
                    }`}
                    title="Отсъства"
                  >
                    <XCircle className="w-4 h-4" />
                    <span className="hidden md:inline">Отсъства</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(record?.studentId, 'late')}
                    className={`btn ${
                      record?.status === 'late'
                        ? 'bg-orange-500 text-white'
                        : 'btn-ghost'
                    }`}
                    title="Закъснял"
                  >
                    <Clock className="w-4 h-4" />
                    <span className="hidden md:inline">Закъснял</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange(record?.studentId, 'excused')}
                    className={`btn ${
                      record?.status === 'excused'
                        ? 'bg-blue-500 text-white'
                        : 'btn-ghost'
                    }`}
                    title="Оправдан"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span className="hidden md:inline">Оправдан</span>
                  </button>
                </div>

                {/* Notes */}
                <div className="flex-1">
                  <input
                    type="text"
                    className="input text-sm"
                    placeholder="Бележки..."
                    value={record?.notes}
                    onChange={(e) => handleNotesChange(record?.studentId, e?.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button (Mobile) */}
      <div className="block md:hidden">
        <button
          onClick={handleSave}
          disabled={bulkAddAttendance?.isPending || stats?.unmarked === stats?.total}
          className="btn btn-primary w-full"
        >
          {bulkAddAttendance?.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Запазване...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Запази присъствия ({stats?.total - stats?.unmarked} от {stats?.total})
            </>
          )}
        </button>
      </div>
    </div>
  )
}
