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

// Collection reference
const eventsCollection = collection(db, COLLECTIONS.EVENTS)

/**
 * Hook to get all events with real-time updates
 */
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    // Real-time listener
    const q = query(eventsCollection, orderBy('startTime', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsData: Event[] = []
        snapshot.forEach((doc) => {
          eventsData.push({
            id: doc.id,
            ...doc.data(),
          } as Event)
        })
        setEvents(eventsData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Error fetching events:', err)
        setError(err as Error)
        setLoading(false)
        toast.error(ERROR_MESSAGES.LOAD_EVENTS_ERROR)
      }
    )

    return () => unsubscribe()
  }, [])

  return { events, loading, error }
}

/**
 * Hook to get a single event by ID
 */
export function useEvent(eventId: string) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const docRef = doc(db, COLLECTIONS.EVENTS, eventId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        throw new Error(ERROR_MESSAGES.EVENT_NOT_FOUND)
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Event
    },
    enabled: !!eventId,
  })
}

/**
 * Hook to get events by date range
 */
export function useEventsByDateRange(startDate: Date, endDate: Date) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      eventsCollection,
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('startTime')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData: Event[] = []
      snapshot.forEach((doc) => {
        eventsData.push({
          id: doc.id,
          ...doc.data(),
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
 */
export function useTodayEvents() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return useEventsByDateRange(today, tomorrow)
}

/**
 * Hook to add a new event
 */
export function useAddEvent() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (eventData: EventFormValues) => {
      // Convert dates to Timestamps
      const data = {
        ...eventData,
        startTime: eventData.startTime instanceof Date
          ? Timestamp.fromDate(eventData.startTime)
          : eventData.startTime,
        endTime: eventData.endTime instanceof Date
          ? Timestamp.fromDate(eventData.endTime)
          : eventData.endTime,
        createdBy: user?.uid || 'unknown',
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(eventsCollection, data)
      return docRef.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(SUCCESS_MESSAGES.EVENT_ADDED)
    },
    onError: (error: Error) => {
      console.error('Error adding event:', error)
      toast.error(ERROR_MESSAGES.ADD_EVENT_ERROR)
    },
  })
}

/**
 * Hook to update an event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EventFormValues> }) => {
      const docRef = doc(db, COLLECTIONS.EVENTS, id)

      // Convert dates to Timestamps
      const updateData = {
        ...data,
        startTime: data.startTime instanceof Date
          ? Timestamp.fromDate(data.startTime)
          : data.startTime,
        endTime: data.endTime instanceof Date
          ? Timestamp.fromDate(data.endTime)
          : data.endTime,
      }

      await updateDoc(docRef, updateData)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] })
      toast.success(SUCCESS_MESSAGES.EVENT_UPDATED)
    },
    onError: (error: Error) => {
      console.error('Error updating event:', error)
      toast.error(ERROR_MESSAGES.UPDATE_EVENT_ERROR)
    },
  })
}

/**
 * Hook to delete an event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId: string) => {
      const docRef = doc(db, COLLECTIONS.EVENTS, eventId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success(SUCCESS_MESSAGES.EVENT_DELETED)
    },
    onError: (error: Error) => {
      console.error('Error deleting event:', error)
      toast.error(ERROR_MESSAGES.DELETE_EVENT_ERROR)
    },
  })
}

/**
 * Hook to get events by group
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
      snapshot.forEach((doc) => {
        eventsData.push({
          id: doc.id,
          ...doc.data(),
        } as Event)
      })
      setEvents(eventsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [group])

  return { events, loading }
}
