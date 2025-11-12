/**
 * Link Student Page
 * Allows parents to link students by scanning QR code or entering code manually
 * Updates both student's parentIds array and parent's studentIds array
 */

import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { QRScanner } from '@/components/QRScanner'
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { COLLECTIONS } from '@/lib/collections'
import { Student } from '@/types'
import { formatDate } from '@/utils/formatters'
import toast from 'react-hot-toast'
import { QrCode, Users, CheckCircle, X } from 'lucide-react'

export default function LinkStudentPage() {
  const { user, userData, isParent } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [showScanner, setShowScanner] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState(false)

  // Check for code in URL params (from QR scan)
  const codeFromUrl = searchParams?.get('code')

  // 🔒 SECURITY: Only authenticated parents can access
  if (userData && !isParent) {
    return <Navigate to="/" replace />
  }

  if (!user || !userData) {
    return <Navigate to="/login/parent" replace />
  }

  // Auto-scan if code is in URL
  if (codeFromUrl && !student && !loading) {
    handleCodeScanned(codeFromUrl)
  }

  // Handle scanned/entered code
  async function handleCodeScanned(code: string) {
    setLoading(true)
    setShowScanner(false)

    try {
      // Search for student by studentCode
      const studentsRef = doc(db, COLLECTIONS?.STUDENTS, code)

      // Try direct lookup by document ID first
      let studentDoc = await getDoc(studentsRef)

      // If not found by ID, need to query by studentCode field
      if (!studentDoc?.exists()) {
        // Import query functions
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        const studentsCollection = collection(db, COLLECTIONS?.STUDENTS)
        const q = query(studentsCollection, where('studentCode', '==', code))
        const snapshot = await getDocs(q)

        if (snapshot?.empty) {
          toast?.error('Ученик с този код не е намерен')
          setLoading(false)
          return
        }

        studentDoc = snapshot?.docs[0]
      }

      const studentData = {
        id: studentDoc?.id,
        ...studentDoc?.data()
      } as Student

      // Check if already linked
      if (studentData?.parentIds?.includes(user?.uid)) {
        toast?.error('Това дете вече е свързано с вашия профил')
        setLoading(false)
        return
      }

      setStudent(studentData)
    } catch (error: any) {
      console.error('Error fetching student:', error)
      toast?.error('Грешка при търсене на ученик: ' + error?.message)
    } finally {
      setLoading(false)
    }
  }

  // Confirm linking
  async function handleConfirmLink() {
    if (!student || !user) return

    setLinking(true)

    try {
      // Update student's parentIds array
      const studentRef = doc(db, COLLECTIONS?.STUDENTS, student?.id)
      await updateDoc(studentRef, {
        parentIds: arrayUnion(user?.uid)
      })

      // Update parent's studentIds array in users collection
      const userRef = doc(db, COLLECTIONS?.USERS, user?.uid)
      await updateDoc(userRef, {
        studentIds: arrayUnion(student?.id)
      })

      toast?.success(`${student?.name} е успешно свързано с вашия профил!`)

      // Redirect to my-children page
      navigate('/my-children')
    } catch (error: any) {
      console.error('Error linking student:', error)
      toast?.error('Грешка при свързване: ' + error?.message)
    } finally {
      setLinking(false)
    }
  }

  // Cancel confirmation
  function handleCancel() {
    setStudent(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Свържете вашето дете
            </h1>
            <p className="text-gray-600">
              Сканирайте QR кода или въведете кода от формуляра
            </p>
          </div>

          {student ? (
            // Confirmation View
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-white">
                      {student?.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {student?.name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>
                        <strong>Група:</strong> {student?.group}
                      </p>
                      {student?.dateOfBirth && (
                        <p>
                          <strong>Дата на раждане:</strong>{' '}
                          {formatDate(student?.dateOfBirth)}
                        </p>
                      )}
                      <p>
                        <strong>Тип обучение:</strong> {student?.studyType}
                      </p>
                      <p>
                        <strong>Код:</strong> {student?.studentCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  <strong>Потвърдете:</strong> Искате ли да свържете това дете
                  с вашия профил? След това ще имате достъп до информация за
                  плащания, домашни и събития.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={linking}
                  className="btn flex-1 border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Отказ
                </button>
                <button
                  onClick={handleConfirmLink}
                  disabled={linking}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {linking ? 'Свързване...' : 'Потвърди'}
                </button>
              </div>
            </div>
          ) : (
            // Scanner/Input View
            <div className="space-y-4">
              <button
                onClick={() => setShowScanner(true)}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
              >
                <QrCode className="w-6 h-6" />
                {loading ? 'Зареждане...' : 'Сканирай QR Код'}
              </button>

              <div className="text-center">
                <button
                  onClick={() => navigate('/my-children')}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Назад към моите деца
                </button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Как работи?</strong>
                  <br />
                  1. Натиснете "Сканирай QR Код"
                  <br />
                  2. Позволете достъп до камерата
                  <br />
                  3. Насочете камерата към QR кода от формуляра на детето
                  <br />
                  4. Потвърдете свързването
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleCodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
