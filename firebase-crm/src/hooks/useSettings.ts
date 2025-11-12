import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * System settings type
 */
export interface SystemSettings {
  logoUrl?: string
  schoolName?: string
  primaryColor?: string
  secondaryColor?: string
  [key: string]: any
}

/**
 * Hook to get system settings
 *
 * @description Fetches system-wide settings from Firestore 'settings/system' document.
 * Used in Layout for logo, branding, and theme configuration.
 *
 * @returns {{settings: SystemSettings | null, loading: boolean, error: Error | null}} Object containing:
 *   - settings: System settings object with logo, school name, colors, etc.
 *   - loading: True while fetching data
 *   - error: Error object if fetch fails, null otherwise
 *
 * @example
 * ```tsx
 * function Layout() {
 *   const { settings, loading } = useSettings()
 *
 *   if (loading) return <Spinner />
 *
 *   return (
 *     <div style={{ backgroundColor: settings?.primaryColor }}>
 *       {settings?.logoUrl && <img src={settings?.logoUrl} alt="Logo" />}
 *       <h1>{settings?.schoolName}</h1>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const docRef = doc(db, 'settings', 'system')
        const docSnap = await getDoc(docRef)

        if (docSnap?.exists()) {
          setSettings(docSnap?.data() as SystemSettings)
          setError(null)
        } else {
          setSettings(null)
          setError(new Error('Settings document not found'))
        }
      } catch (err) {
        console.error('Error loading settings:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  return { settings, loading, error }
}
