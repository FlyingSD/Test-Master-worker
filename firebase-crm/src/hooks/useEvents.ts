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
import { Event, EventFormValues } from '@/types'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './useAuth'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'
import { COLLECTIONS } from '@/lib/collections'
import { validateDocumentOwnership } from '@/utils/security'
import { toTimestamp } from '@/utils/date'
import { QUERY_KEYS } from '@/constants/queryKeys'

// Collection reference
const eventsCollection = collection(db, COLLECTIONS?.EVENTS)

/**
 * Hook to get all events with real-time updates
 * 🔒 SECURITY FIX: Now handles event visibility by role
 * - Admins see ALL events
 * - Teachers see ALL events
 * - Parents see ALL events (need to see class schedule for their children's groups)
 *
 * DECISION: Parents see ALL events instead of filtering by studentIds because:
 * 1. Parents need visibility into the class schedule (holidays, class times, etc.)
 * 2. Events can be group-based (linked to student's group) or student-specific (studentIds field)
 * 3. Filtering by only studentIds would miss important group-based events
 * 4. Admins/teachers manage event visibility settings, parents can just view all
 *
 * NOTE: For fine-grained filtering by student/group at component level, use separate hooks like
 * useEventsByGroup() or implement client-side filtering if needed.
 */
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    // Real-time listener - All users see all events (parents need full schedule visibility)
    // Security is enforced at creation/update/delete level via ownership validation
    const q = query(eventsCollection, orderBy('startTime', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsData: Event[] = []
        snapshot?.forEach((doc) => {
          eventsData?.push({
            id: doc?.id,
            ...doc?.data(),
          } as Event)
        })
        setEvents(eventsData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console?.error('Error fetching events:', err)
        setError(err as Error)
        setLoading(false)
        toast?.error(ERROR_MESSAGES?.LOAD_EVENTS_ERROR)
      }
    )

    return () => unsubscribe()
  }, [])

  return { events, loading, error }
}

/**
 * Hook to get a single event by ID
 *
 * @description Fetches a single event record by its unique ID using React Query.
 * Provides caching and automatic refetching capabilities.
 *
 * @param {string} eventId - The unique identifier of the event to fetch
 *
 * @returns {UseQueryResult<Event>} React Query result object with:
 *   - data: Event object if found
 *   - isLoading: True while fetching
 *   - error: Error object if fetch fails
 *
 * @example
 * ```tsx
 * function EventDetails({ eventId }: { eventId: string }) {
 *   const { data: event, isLoading, error } = useEvent(eventId)
 *
 *   if (isLoading) return <Spinner />
 *   if (error || !event) return <NotFound />
 *
 *   return <EventCard {...event} />
 * }
 * ```
 */
export function useEvent(eventId: string) {
  return useQuery({
    queryKey: QUERY_KEYS?.event(eventId),
    queryFn: async () => {
      const docRef = doc(db, COLLECTIONS?.EVENTS, eventId)
      const docSnap = await getDoc(docRef)

      if (!docSnap?.exists()) {
        throw new Error(ERROR_MESSAGES?.EVENT_NOT_FOUND)
      }

      return {
        id: docSnap?.id,
        ...docSnap?.data(),
      } as Event
    },
    enabled: !!eventId,
  })
}

/**
 * Hook to get events by date range
 *
 * @description Fetches events within a specified date range with real-time updates.
 * Uses server-side filtering with Firestore where clauses for performance.
 *
 * @param {Date} startDate - Start date of the range (inclusive)
 * @param {Date} endDate - End date of the range (inclusive)
 *
 * @returns {{events: Event[], loading: boolean}} Object containing:
 *   - events: Array of events within the specified date range
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function WeeklyEvents() {
 *   const weekStart = new Date()
 *   const weekEnd = new Date(Date?.now() + 7 * 24 * 60 * 60 * 1000)
 *   const { events, loading } = useEventsByDateRange(weekStart, weekEnd)
 *
 *   return <EventsCalendar events={events} loading={loading} />
 * }
 * ```
 */
export function useEventsByDateRange(startDate: Date, endDate: Date) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      eventsCollection,
      where('startTime', '>=', Timestamp?.fromDate(startDate)),
      where('startTime', '<=', Timestamp?.fromDate(endDate)),
      orderBy('startTime')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData: Event[] = []
      snapshot?.forEach((doc) => {
        eventsData?.push({
          id: doc?.id,
          ...doc?.data(),
        } as Event)
      })
      setEvents(eventsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [startDate, endDate])

  return { events, loading }
}

/**
 * Hook to get today's events
 *
 * @description Convenience hook that fetches today's events (from 00:00 to 23:59).
 * Internally uses useEventsByDateRange with today's date boundaries.
 *
 * @returns {{events: Event[], loading: boolean}} Object containing today's events
 *
 * @example
 * ```tsx
 * function TodaySchedule() {
 *   const { events, loading } = useTodayEvents()
 *
 *   return (
 *     <Card>
 *       <h3>Today's Schedule</h3>
 *       {loading ? <Spinner /> : events?.map(e => <EventRow key={e?.id} {...e} />)}
 *     </Card>
 *   )
 * }
 * ```
 */
export function useTodayEvents() {
  const today = new Date()
  today?.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow?.setDate(tomorrow?.getDate() + 1)

  return useEventsByDateRange(today, tomorrow)
}

/**
 * Hook to add a new event
 *
 * @description Creates a new event record with automatic timestamp conversion and ownership tracking.
 * Converts startTime and endTime Date objects to Firestore Timestamps.
 *
 * @returns {UseMutationResult} React Query mutation object with:
 *   - mutate/mutateAsync: Function to trigger event creation
 *   - isPending: True while request is in progress
 *   - isSuccess/isError: Status flags
 *
 * @security Populates createdBy field with current user?.uid for ownership tracking
 *
 * @example
 * ```tsx
 * function AddEventForm() {
 *   const addEvent = useAddEvent()
 *
 *   const handleSubmit = async (data: EventFormValues) => {
 *     await addEvent?.mutateAsync(data)
 *     toast?.success('Event created!')
 *     onClose()
 *   }
 *
 *   return <Form onSubmit={handleSubmit} loading={addEvent?.isPending} />
 * }
 * ```
 */
export function useAddEvent() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (eventData: EventFormValues) => {
      if (!user) {
        throw new Error(ERROR_MESSAGES?.NOT_LOGGED_IN)
      }

      // Convert dates to Timestamps
      const data = {
        ...eventData,
        startTime: toTimestamp(eventData?.startTime),
        endTime: toTimestamp(eventData?.endTime),
        createdBy: user?.uid,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(eventsCollection, data)
      return docRef?.id
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.events })
      toast?.success(SUCCESS_MESSAGES?.EVENT_ADDED)
    },
    onError: (error: Error) => {
      console?.error('Error adding event:', error)
      toast?.error(ERROR_MESSAGES?.ADD_EVENT_ERROR)
    },
  })
}

/**
 * Hook to update an event
 *
 * @description Updates an existing event record after validating ownership.
 * Converts Date objects to Firestore Timestamps if present.
 *
 * @param {object} params - Update parameters
 * @param {string} params?.id - The event ID to update
 * @param {Partial<EventFormValues>} params?.data - Partial event data to update
 *
 * @returns {UseMutationResult} React Query mutation object for event update
 *
 * @security 🔒 Validates ownership before update using validateDocumentOwnership:
 * - **Admins**: Can update any event
 * - **Teachers**: Can only update events THEY created
 * - **Parents**: Cannot update events
 *
 * @example
 * ```tsx
 * function EditEventForm({ event }: { event: Event }) {
 *   const updateEvent = useUpdateEvent()
 *
 *   const handleSubmit = async (data: Partial<EventFormValues>) => {
 *     await updateEvent?.mutateAsync({ id: event?.id, data })
 *   }
 *
 *   return <Form initialValues={event} onSubmit={handleSubmit} />
 * }
 * ```
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventFormValues> }) => {
      // 🔒 SECURITY: Validate ownership before update
      // Ensures user has permission to modify this event
      await validateDocumentOwnership(
        COLLECTIONS?.EVENTS,
        id,
        userData!,
        ERROR_MESSAGES?.EVENT_NOT_FOUND
      )

      const docRef = doc(db, COLLECTIONS?.EVENTS, id)

      // Convert dates to Timestamps
      const updateData: Record<string, any> = { ...data }
      if (updateData?.startTime) {
        updateData?.startTime = toTimestamp(updateData?.startTime)
      }
      if (updateData?.endTime) {
        updateData?.endTime = toTimestamp(updateData?.endTime)
      }

      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.events })
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.event(variables?.id) })
      toast?.success(SUCCESS_MESSAGES?.EVENT_UPDATED)
    },
    onError: (error: Error) => {
      console?.error('Error updating event:', error)
      toast?.error(ERROR_MESSAGES?.UPDATE_EVENT_ERROR)
    },
  })
}

/**
 * Hook to delete an event
 *
 * @description Deletes an event record after validating ownership.
 *
 * @param {string} eventId - The unique identifier of the event to delete
 *
 * @returns {UseMutationResult} React Query mutation object for event deletion
 *
 * @security 🔒 Validates ownership before deletion using validateDocumentOwnership:
 * - **Admins**: Can delete any event
 * - **Teachers**: Can only delete events THEY created
 * - **Parents**: Cannot delete events
 *
 * @example
 * ```tsx
 * function EventRow({ event }: { event: Event }) {
 *   const deleteEvent = useDeleteEvent()
 *
 *   const handleDelete = async () => {
 *     if (confirm('Delete this event?')) {
 *       await deleteEvent?.mutateAsync(event?.id)
 *     }
 *   }
 *
 *   return <Button onClick={handleDelete}>Delete</Button>
 * }
 * ```
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient()
  const { userData } = useAuth()

  return useMutation({
    mutationFn: async (eventId: string) => {
      // 🔒 SECURITY: Validate ownership before delete
      // Ensures user has permission to remove this event
      await validateDocumentOwnership(
        COLLECTIONS?.EVENTS,
        eventId,
        userData!,
        ERROR_MESSAGES?.EVENT_NOT_FOUND
      )

      const docRef = doc(db, COLLECTIONS?.EVENTS, eventId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: QUERY_KEYS?.events })
      toast?.success(SUCCESS_MESSAGES?.EVENT_DELETED)
    },
    onError: (error: Error) => {
      console?.error('Error deleting event:', error)
      toast?.error(ERROR_MESSAGES?.DELETE_EVENT_ERROR)
    },
  })
}

/**
 * Hook to get events by group
 *
 * @description Fetches all events assigned to a specific group with real-time updates.
 * Useful for displaying group-specific schedules.
 *
 * @param {string} group - The group identifier to filter events by
 *
 * @returns {{events: Event[], loading: boolean}} Object containing:
 *   - events: Array of events for the specified group
 *   - loading: True while fetching data
 *
 * @example
 * ```tsx
 * function GroupSchedule({ groupId }: { groupId: string }) {
 *   const { events, loading } = useEventsByGroup(groupId)
 *
 *   return (
 *     <div>
 *       <h3>Group Schedule</h3>
 *       {loading ? <Spinner /> : events?.map(e => <EventCard key={e?.id} {...e} />)}
 *     </div>
 *   )
 * }
 * ```
 */
export function useEventsByGroup(group: string) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!group) {
      setEvents([])
      setLoading(false)
      return
    }

    const q = query(
      eventsCollection,
      where('group', '==', group),
      orderBy('startTime', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData: Event[] = []
      snapshot?.forEach((doc) => {
        eventsData?.push({
          id: doc?.id,
          ...doc?.data(),
        } as Event)
      })
      setEvents(eventsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [group])

  return { events, loading }
}
