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
import { validateDocumentOwnership } from '@/utils/security'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { QUERY_KEYS } from '@/constants/queryKeys'

// Collection reference
const parentsCollection = collection(db, COLLECTIONS.PARENTS)

/**
 * Hook to get all parents with real-time updates
 *
 * @description Fetches all parent records with real-time synchronization using Firestore onSnapshot.
 * Orders parents by name alphabetically for consistent display.
 *
 * @returns {{parents: Parent[], loading: boolean, error: Error | null}} Object containing:
 *   - parents: Array of all parent records
 *   - loading: True while fetching data
 *   - error: Error object if fetch fails, null otherwise
 *
 * @example
 * ```tsx
 * function ParentsList() {
 *   const { parents, loading, error } = useParents()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <Error message={error.message} />
 *
 *   return parents.map(parent => <ParentCard key={parent.id} {...parent} />)
 * }
 * ```
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
 *
 * @description Fetches a single parent record by its unique ID using React Query.
 * Provides caching and automatic refetching capabilities.
 *
 * @param {string} parentId - The unique identifier of the parent to fetch
 *
 * @returns {UseQueryResult<Parent>} React Query result object with:
 *   - data: Parent object if found
 *   - isLoading: True while fetching
 *   - error: Error object if fetch fails
 *
 * @example
 * ```tsx
 * function ParentDetails({ parentId }: { parentId: string }) {
 *   const { data: parent, isLoading, error } = useParent(parentId)
 *
 *   if (isLoading) return <Spinner />
 *   if (error || !parent) return <NotFound />
 *
 *   return <ParentProfile {...parent} />
 * }
 * ```
 */
export function useParent(parentId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.parent(parentId),
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
 *
 * @description Finds a parent record by searching for a student ID in their studentIds array.
 * Uses Firestore array-contains query for efficient server-side filtering.
 *
 * @param {string} studentId - The unique identifier of the student
 *
 * @returns {{parent: Parent | null, loading: boolean}} Object containing:
 *   - parent: Parent object if found, null otherwise
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function StudentParentInfo({ studentId }: { studentId: string }) {
 *   const { parent, loading } = useParentByStudentId(studentId)
 *
 *   if (loading) return <Spinner />
 *   if (!parent) return <NoParent />
 *
 *   return <ParentContactCard {...parent} />
 * }
 * ```
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
 *
 * @description Creates a new parent record with automatic initialization and ownership tracking.
 * Initializes empty studentIds and videoUrls arrays, populates timestamps and createdBy field.
 *
 * @returns {UseMutationResult} React Query mutation object with:
 *   - mutate/mutateAsync: Function to trigger parent creation
 *   - isPending: True while request is in progress
 *   - isSuccess/isError: Status flags
 *
 * @security Populates createdBy field with current user.uid for ownership tracking
 *
 * @example
 * ```tsx
 * function AddParentForm() {
 *   const addParent = useAddParent()
 *
 *   const handleSubmit = async (data: ParentFormValues) => {
 *     const parentId = await addParent.mutateAsync(data)
 *     toast.success('Parent added!')
 *     navigate(`/parents/${parentId}`)
 *   }
 *
 *   return <Form onSubmit={handleSubmit} loading={addParent.isPending} />
 * }
 * ```
 */
export function useAddParent() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (parentData: ParentFormValues) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      const data = {
        ...parentData,
        studentIds: [], // Initialize empty, will be added when creating students
        videoUrls: [], // Initialize empty videos array
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(parentsCollection, data)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parents })
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
 *
 * @description Updates an existing parent record after validating ownership.
 * Automatically updates updatedAt timestamp.
 *
 * @param {object} params - Update parameters
 * @param {string} params.id - The parent ID to update
 * @param {Partial<ParentFormValues>} params.data - Partial parent data to update
 *
 * @returns {UseMutationResult} React Query mutation object for parent update
 *
 * @security 🔒 Validates ownership before update using validateDocumentOwnership:
 * - **Admins**: Can update any parent
 * - **Teachers**: Can only update parents THEY created
 * - **Parents**: Cannot update other parents
 *
 * @example
 * ```tsx
 * function EditParentForm({ parent }: { parent: Parent }) {
 *   const updateParent = useUpdateParent()
 *
 *   const handleSubmit = async (data: Partial<ParentFormValues>) => {
 *     await updateParent.mutateAsync({ id: parent.id, data })
 *   }
 *
 *   return <Form initialValues={parent} onSubmit={handleSubmit} />
 * }
 * ```
 */
export function useUpdateParent() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ParentFormValues> }) => {
      // 🔒 SECURITY: Validate ownership before update
      // - Admins can update any parent
      // - Teachers can only update parents THEY created
      // - Parents cannot update other parents
      if (!userData) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      await validateDocumentOwnership(
        COLLECTIONS.PARENTS,
        id,
        userData,
        ERROR_MESSAGES.PARENT_NOT_FOUND
      )

      const docRef = doc(db, COLLECTIONS.PARENTS, id)

      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parents })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parent(variables.id) })
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
 *
 * @description Deletes a parent record after validating ownership.
 * Automatically deletes all associated videos from Firebase Storage.
 *
 * @param {string} parentId - The unique identifier of the parent to delete
 *
 * @returns {UseMutationResult} React Query mutation object for parent deletion
 *
 * @security 🔒 Validates ownership before deletion using validateDocumentOwnership:
 * - **Admins**: Can delete any parent
 * - **Teachers**: Can only delete parents THEY created
 * - **Parents**: Cannot delete other parents
 *
 * @note Automatically cleans up all associated videos from Firebase Storage
 *
 * @example
 * ```tsx
 * function ParentRow({ parent }: { parent: Parent }) {
 *   const deleteParent = useDeleteParent()
 *
 *   const handleDelete = async () => {
 *     if (confirm('Delete this parent and all their videos?')) {
 *       await deleteParent.mutateAsync(parent.id)
 *     }
 *   }
 *
 *   return <Button onClick={handleDelete}>Delete</Button>
 * }
 * ```
 */
export function useDeleteParent() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async (parentId: string) => {
      // 🔒 SECURITY: Validate ownership before deletion
      // - Admins can delete any parent
      // - Teachers can only delete parents THEY created
      // - Parents cannot delete other parents
      if (!userData) {
        throw new Error(ERROR_MESSAGES.NOT_LOGGED_IN)
      }

      const parentData = await validateDocumentOwnership(
        COLLECTIONS.PARENTS,
        parentId,
        userData,
        ERROR_MESSAGES.PARENT_NOT_FOUND
      )

      const docRef = doc(db, COLLECTIONS.PARENTS, parentId)

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

      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parents })
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parents })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parent(variables.parentId) })
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parents })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parent(variables.parentId) })
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parents })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parent(variables.parentId) })
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parents })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.parent(variables.parentId) })
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
 *
 * @description Filters parents by search term matching name, phone, phone2, or email.
 * Search is case-insensitive and uses client-side filtering.
 *
 * @param {string} searchTerm - The search term to filter by
 *
 * @returns {{parents: Parent[], loading: boolean}} Object containing:
 *   - parents: Array of parents matching the search term
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function ParentSearch() {
 *   const [search, setSearch] = useState('')
 *   const { parents, loading } = useSearchParents(search)
 *
 *   return (
 *     <>
 *       <SearchInput value={search} onChange={setSearch} />
 *       {loading ? <Spinner /> : parents.map(p => <ParentRow key={p.id} {...p} />)}
 *     </>
 *   )
 * }
 * ```
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
