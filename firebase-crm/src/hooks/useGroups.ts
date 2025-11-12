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
import { Group } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { COLLECTIONS } from '@/lib/collections'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { QUERY_KEYS } from '@/constants/queryKeys'

// Collection reference
const groupsCollection = collection(db, COLLECTIONS?.GROUPS)

/**
 * Hook to get all groups with real-time updates
 *
 * @description Fetches groups with role-based access control and real-time synchronization.
 *
 * @returns {{groups: Group[], loading: boolean, error: Error | null}} Object containing:
 *   - groups: Array of group records visible to the current user
 *   - loading: True while fetching data
 *   - error: Error object if fetch fails, null otherwise
 *
 * @security
 * - **Admins**: See ALL groups
 * - **Teachers**: See ONLY groups where teacherId matches their user ID
 * - **Parents**: Don't see groups (they see them via My Children page)
 *
 * @example
 * ```tsx
 * function GroupsList() {
 *   const { groups, loading, error } = useGroups()
 *
 *   if (loading) return <Spinner />
 *   if (error) return <Error message={error?.message} />
 *
 *   return groups?.map(group => <GroupCard key={group?.id} {...group} />)
 * }
 * ```
 */
export function useGroups() {
  const { userData, isAdmin, isTeacher } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userData) {
      setGroups([])
      setLoading(false)
      return
    }

    // 🔒 SECURITY: Parents don't see groups page (they see groups via My Children)
    if (!isAdmin && !isTeacher) {
      setGroups([])
      setLoading(false)
      return
    }

    setLoading(true)

    // 🔒 SECURITY: Teachers only see THEIR groups (filter by teacherId)
    let q = query(groupsCollection, orderBy('createdAt', 'desc'))
    if (isTeacher) {
      q = query(
        groupsCollection,
        where('teacherId', '==', userData?.uid),
        orderBy('createdAt', 'desc')
      )
    }

    // Real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groupsData: Group[] = []
        snapshot?.forEach((doc) => {
          groupsData?.push({
            id: doc?.id,
            ...doc?.data(),
          } as Group)
        })

        setGroups(groupsData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching groups:', err)
        setError(err as Error)
        setLoading(false)
        toast?.error('Грешка при зареждане на групи')
      }
    )

    return () => unsubscribe()
  }, [userData, isAdmin, isTeacher])

  return { groups, loading, error }
}

/**
 * Hook to get a single group by ID
 *
 * @description Fetches a single group record using React Query for caching and automatic refetching.
 *
 * @param {string} groupId - The unique identifier of the group
 * @returns {UseQueryResult<Group>} React Query result object with group data
 *
 * @example
 * ```tsx
 * function GroupProfile({ id }: { id: string }) {
 *   const { data: group, isLoading } = useGroup(id)
 *
 *   if (isLoading) return <Spinner />
 *   if (!group) return <NotFound />
 *
 *   return <Profile name={group?.name} teacher={group?.teacherName} />
 * }
 * ```
 */
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: QUERY_KEYS?.group(groupId),
    queryFn: async () => {
      const docRef = doc(db, COLLECTIONS?.GROUPS, groupId)
      const docSnap = await getDoc(docRef)

      if (!docSnap?.exists()) {
        throw new Error('Групата не е намерена')
      }

      return {
        id: docSnap?.id,
        ...docSnap?.data(),
      } as Group
    },
    enabled: !!groupId,
  })
}

/**
 * Hook to get groups by teacher ID with real-time updates
 *
 * @description Fetches all groups assigned to a specific teacher with live synchronization.
 *
 * @param {string} teacherId - The unique identifier of the teacher
 * @returns {{groups: Group[], loading: boolean}} Object containing:
 *   - groups: Array of groups assigned to this teacher
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function TeacherGroups({ teacherId }: { teacherId: string }) {
 *   const { groups, loading } = useGroupsByTeacher(teacherId)
 *
 *   return loading ? <Spinner /> : groups?.map(g => <GroupCard {...g} />)
 * }
 * ```
 */
export function useGroupsByTeacher(teacherId: string) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teacherId) {
      setGroups([])
      setLoading(false)
      return
    }

    const q = query(
      groupsCollection,
      where('teacherId', '==', teacherId),
      orderBy('name')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData: Group[] = []
      snapshot?.forEach((doc) => {
        groupsData?.push({
          id: doc?.id,
          ...doc?.data(),
        } as Group)
      })
      setGroups(groupsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [teacherId])

  return { groups, loading }
}

/**
 * Hook to add a new group
 *
 * @description Creates a new group record with automatic timestamp and ownership tracking.
 * Shows success/error toasts and invalidates the groups query cache.
 *
 * @returns {UseMutationResult} React Query mutation object with:
 *   - mutate/mutateAsync: Function to trigger group creation
 *   - isPending: True while request is in progress
 *   - isSuccess/isError: Status flags
 *
 * @security Populates createdBy field with current user?.uid for ownership tracking
 *
 * @example
 * ```tsx
 * function AddGroupForm() {
 *   const addGroup = useAddGroup()
 *
 *   const handleSubmit = async (data: Omit<Group, 'id' | 'createdAt' | 'createdBy'>) => {
 *     await addGroup?.mutateAsync(data)
 *     onClose()
 *   }
 *
 *   return <Form onSubmit={handleSubmit} loading={addGroup?.isPending} />
 * }
 * ```
 */
export function useAddGroup() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (groupData: Omit<Group, 'id' | 'createdAt' | 'createdBy' | 'updatedAt'>) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      const data = {
        ...groupData,
        createdBy: user?.uid, // 🔒 SECURITY: Track who created this group
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(groupsCollection, data)
      return docRef?.id
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.groups })
      toast?.success('Групата е добавена успешно')
    },
    onError: (error: Error) => {
      console.error('Error adding group:', error)
      toast?.error('Грешка при добавяне на група: ' + error?.message)
    },
  })
}

/**
 * Hook to update a group
 *
 * @description Updates an existing group record with security validation.
 *
 * @returns {UseMutationResult} React Query mutation object
 *
 * @security
 * - **Admins**: Can update any group
 * - **Teachers**: Can only update their own groups, and CANNOT change price/teacherId
 * - **Parents**: Cannot update groups
 *
 * @sideEffects
 * - Invalidates groups and individual group query caches
 *
 * @example
 * ```tsx
 * function EditGroupForm({ group }: { group: Group }) {
 *   const updateGroup = useUpdateGroup()
 *
 *   const handleSubmit = async (data: Partial<Group>) => {
 *     await updateGroup?.mutateAsync({ id: group?.id, data })
 *   }
 *
 *   return <Form onSubmit={handleSubmit} disabled={updateGroup?.isPending} />
 * }
 * ```
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient()
  const { userData, isAdmin, isTeacher } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Group> }) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Fetch the group to validate access
      const docRef = doc(db, COLLECTIONS?.GROUPS, id)
      const docSnap = await getDoc(docRef)

      if (!docSnap?.exists()) {
        throw new Error('Групата не е намерена')
      }

      const existingGroup = docSnap?.data() as Group

      // 🔒 SECURITY: Teachers can only edit THEIR groups
      if (isTeacher && existingGroup?.teacherId !== userData?.uid) {
        throw new Error('Нямате права да редактирате тази група')
      }

      // 🔒 SECURITY: Teachers CANNOT change price or teacherId
      const updateData: Record<string, any> = { ...data }
      if (isTeacher) {
        delete updateData?.price
        delete updateData?.priceEUR
        delete updateData?.teacherId
        delete updateData?.teacherName
      }

      updateData?.updatedAt = serverTimestamp()

      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.groups })
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.group(variables?.id) })
      toast?.success('Групата е актуализирана успешно')
    },
    onError: (error: Error) => {
      console.error('Error updating group:', error)
      toast?.error('Грешка при актуализиране на група: ' + error?.message)
    },
  })
}

/**
 * Hook to delete a group
 *
 * @description Permanently deletes a group record after permission validation.
 *
 * @returns {UseMutationResult} React Query mutation object
 *
 * @security
 * - **Admins**: Can delete any group
 * - **Teachers**: CANNOT delete groups
 * - **Parents**: Cannot delete groups
 *
 * @warning This is a destructive operation and cannot be undone
 *
 * @example
 * ```tsx
 * function DeleteGroupButton({ groupId }: { groupId: string }) {
 *   const deleteGroup = useDeleteGroup()
 *
 *   const handleDelete = () => {
 *     if (confirm('Сигурни ли сте?')) {
 *       deleteGroup?.mutate(groupId)
 *     }
 *   }
 *
 *   return <Button onClick={handleDelete} disabled={deleteGroup?.isPending} />
 * }
 * ```
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient()
  const { userData, isAdmin } = useAuth()

  return useMutation({
    mutationFn: async (groupId: string) => {
      if (!userData) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // 🔒 SECURITY: Only admins can delete groups
      if (!isAdmin) {
        throw new Error('Само администратори могат да изтриват групи')
      }

      // Delete group
      const docRef = doc(db, COLLECTIONS?.GROUPS, groupId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.groups })
      toast?.success('Групата е изтрита успешно')
    },
    onError: (error: Error) => {
      console.error('Error deleting group:', error)
      toast?.error('Грешка при изтриване на група: ' + error?.message)
    },
  })
}

/**
 * Hook to get active groups count
 *
 * @description Calculates the number of groups with 'active' status.
 * Uses the useGroups hook internally, so it respects RBAC filtering.
 *
 * @returns {number} Count of active groups visible to current user
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const activeCount = useActiveGroupsCount()
 *
 *   return <StatCard title="Active Groups" value={activeCount} />
 * }
 * ```
 */
export function useActiveGroupsCount() {
  const { groups } = useGroups()
  return groups?.filter((g) => g?.status === 'active').length
}
