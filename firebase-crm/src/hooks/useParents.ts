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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { Parent, ParentFormValues } from '@/types'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { COLLECTIONS } from '@/lib/collections'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

// Collection reference
const parentsCollection = collection(db, COLLECTIONS.PARENTS)

/**
 * Hook to get all parents with real-time updates
 */
export function useParents() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    // Real-time listener
    const q = query(parentsCollection, orderBy('name'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const parentsData: Parent[] = []
        snapshot.forEach((doc) => {
          parentsData.push({
            id: doc.id,
            ...doc.data(),
          } as Parent)
        })
        setParents(parentsData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching parents:', err)
        setError(err as Error)
        setLoading(false)
        toast.error(ERROR_MESSAGES.LOAD_PARENTS_ERROR)
      }
    )

    return () => unsubscribe()
  }, [])

  return { parents, loading, error }
}

/**
 * Hook to get a single parent by ID
 */
export function useParent(parentId: string) {
  return useQuery({
    queryKey: ['parent', parentId],
    queryFn: async () => {
      const docRef = doc(db, COLLECTIONS.PARENTS, parentId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error(ERROR_MESSAGES.PARENT_NOT_FOUND)
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Parent
    },
    enabled: !!parentId,
  })
}

/**
 * Hook to find parent by student ID
 */
export function useParentByStudentId(studentId: string) {
  const [parent, setParent] = useState<Parent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentId) {
      setParent(null)
      setLoading(false)
      return
    }

    const q = query(
      parentsCollection,
      where('studentIds', 'array-contains', studentId)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        setParent({
          id: doc.id,
          ...doc.data(),
        } as Parent)
      } else {
        setParent(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [studentId])

  return { parent, loading }
}

/**
 * Hook to add a new parent
 */
export function useAddParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (parentData: ParentFormValues) => {
      const data = {
        ...parentData,
        studentIds: [], // Initialize empty, will be added when creating students
        videoUrls: [], // Initialize empty videos array
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(parentsCollection, data)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      toast.success(SUCCESS_MESSAGES.PARENT_ADDED)
    },
    onError: (error: Error) => {
      console.error('Error adding parent:', error)
      toast.error(ERROR_MESSAGES.ADD_PARENT_ERROR)
    },
  })
}

/**
 * Hook to update a parent
 */
export function useUpdateParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ParentFormValues> }) => {
      const docRef = doc(db, COLLECTIONS.PARENTS, id)

      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      queryClient.invalidateQueries({ queryKey: ['parent', variables.id] })
      toast.success(SUCCESS_MESSAGES.PARENT_UPDATED)
    },
    onError: (error: Error) => {
      console.error('Error updating parent:', error)
      toast.error(ERROR_MESSAGES.UPDATE_PARENT_ERROR)
    },
  })
}

/**
 * Hook to delete a parent
 */
export function useDeleteParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (parentId: string) => {
      const docRef = doc(db, COLLECTIONS.PARENTS, parentId)

      // Get parent data to delete videos from storage
      const parentSnap = await getDoc(docRef)
      if (parentSnap.exists()) {
        const parentData = parentSnap.data() as Parent

        // Delete all videos from Firebase Storage
        if (parentData.videoUrls && parentData.videoUrls.length > 0) {
          const deletePromises = parentData.videoUrls.map(async (videoUrl) => {
            try {
              const videoRef = ref(storage, videoUrl)
              await deleteObject(videoRef)
            } catch (error) {
              console.error('Error deleting video:', error)
            }
          })
          await Promise.all(deletePromises)
        }
      }

      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      toast.success(SUCCESS_MESSAGES.PARENT_DELETED)
    },
    onError: (error: Error) => {
      console.error('Error deleting parent:', error)
      toast.error(ERROR_MESSAGES.DELETE_PARENT_ERROR)
    },
  })
}

/**
 * Hook to add student ID to parent's studentIds array
 */
export function useAddStudentToParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ parentId, studentId }: { parentId: string; studentId: string }) => {
      const docRef = doc(db, COLLECTIONS.PARENTS, parentId)
      const parentSnap = await getDoc(docRef)

      if (!parentSnap.exists()) {
        throw new Error(ERROR_MESSAGES.PARENT_NOT_FOUND)
      }

      const parentData = parentSnap.data() as Parent
      const studentIds = parentData.studentIds || []

      if (studentIds.includes(studentId)) {
        return // Already added
      }

      await updateDoc(docRef, {
        studentIds: [...studentIds, studentId],
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      queryClient.invalidateQueries({ queryKey: ['parent', variables.parentId] })
    },
    onError: (error: Error) => {
      console.error('Error adding student to parent:', error)
      toast.error(ERROR_MESSAGES.ADD_STUDENT_ERROR)
    },
  })
}

/**
 * Hook to remove student ID from parent's studentIds array
 */
export function useRemoveStudentFromParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ parentId, studentId }: { parentId: string; studentId: string }) => {
      const docRef = doc(db, COLLECTIONS.PARENTS, parentId)
      const parentSnap = await getDoc(docRef)

      if (!parentSnap.exists()) {
        throw new Error(ERROR_MESSAGES.PARENT_NOT_FOUND)
      }

      const parentData = parentSnap.data() as Parent
      const studentIds = parentData.studentIds || []

      await updateDoc(docRef, {
        studentIds: studentIds.filter((id) => id !== studentId),
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      queryClient.invalidateQueries({ queryKey: ['parent', variables.parentId] })
    },
    onError: (error: Error) => {
      console.error('Error removing student from parent:', error)
      toast.error(ERROR_MESSAGES.DELETE_STUDENT_ERROR)
    },
  })
}

/**
 * Hook to upload video to parent profile
 */
export function useUploadVideoToParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ parentId, videoFile }: { parentId: string; videoFile: File }) => {
      // Validate file type
      if (!videoFile.type.startsWith('video/')) {
        throw new Error('Файлът трябва да е видео')
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (videoFile.size > maxSize) {
        throw new Error('Видеото е твърде голямо (макс. 100MB)')
      }

      // Create unique filename
      const timestamp = Date.now()
      const filename = `parents/${parentId}/videos/${timestamp}_${videoFile.name}`
      const videoRef = ref(storage, filename)

      // Upload video
      const snapshot = await uploadBytes(videoRef, videoFile)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Update parent document with video URL
      const parentDocRef = doc(db, COLLECTIONS.PARENTS, parentId)
      const parentSnap = await getDoc(parentDocRef)

      if (!parentSnap.exists()) {
        throw new Error(ERROR_MESSAGES.PARENT_NOT_FOUND)
      }

      const parentData = parentSnap.data() as Parent
      const videoUrls = parentData.videoUrls || []

      await updateDoc(parentDocRef, {
        videoUrls: [...videoUrls, downloadURL],
        updatedAt: serverTimestamp(),
      })

      return downloadURL
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      queryClient.invalidateQueries({ queryKey: ['parent', variables.parentId] })
      toast.success('Видеото беше качено успешно!')
    },
    onError: (error: Error) => {
      console.error('Error uploading video:', error)
      toast.error('Грешка при качване на видео: ' + error.message)
    },
  })
}

/**
 * Hook to delete video from parent profile
 */
export function useDeleteVideoFromParent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ parentId, videoUrl }: { parentId: string; videoUrl: string }) => {
      // Delete from Firebase Storage
      const videoRef = ref(storage, videoUrl)
      await deleteObject(videoRef)

      // Remove URL from parent document
      const parentDocRef = doc(db, COLLECTIONS.PARENTS, parentId)
      const parentSnap = await getDoc(parentDocRef)

      if (!parentSnap.exists()) {
        throw new Error(ERROR_MESSAGES.PARENT_NOT_FOUND)
      }

      const parentData = parentSnap.data() as Parent
      const videoUrls = parentData.videoUrls || []

      await updateDoc(parentDocRef, {
        videoUrls: videoUrls.filter((url) => url !== videoUrl),
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      queryClient.invalidateQueries({ queryKey: ['parent', variables.parentId] })
      toast.success('Видеото беше изтрито успешно!')
    },
    onError: (error: Error) => {
      console.error('Error deleting video:', error)
      toast.error('Грешка при изтриване на видео: ' + error.message)
    },
  })
}

/**
 * Hook to search parents by name, phone, or email
 */
export function useSearchParents(searchTerm: string) {
  const { parents, loading } = useParents()

  const filteredParents = parents.filter((parent) => {
    const term = searchTerm.toLowerCase()
    return (
      parent.name.toLowerCase().includes(term) ||
      parent.phone?.toLowerCase().includes(term) ||
      parent.phone2?.toLowerCase().includes(term) ||
      parent.email?.toLowerCase().includes(term)
    )
  })

  return { parents: filteredParents, loading }
}
