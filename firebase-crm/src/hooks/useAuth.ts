import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import { User, UserRole } from '@/types'
import toast from 'react-hot-toast'

// Security: Admin Whitelist
// Only emails in this list can have admin role
const getAdminWhitelist = (): string[] => {
  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS || ''
  return adminEmails.split(',').map((email: string) => email.trim()).filter(Boolean)
}

// Security: Validate admin access
const isAdminWhitelisted = (email: string): boolean => {
  const whitelist = getAdminWhitelist()
  return whitelist.includes(email.toLowerCase())
}

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser?.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc?.exists()) {
          const data = userDoc?.data() as User

          // SECURITY: Admin Whitelist Validation
          // If user claims to be admin but email is not whitelisted, downgrade to teacher
          if (data?.role === 'admin' && !isAdminWhitelisted(firebaseUser?.email || '')) {
            console?.warn('Admin access denied for non-whitelisted email:', firebaseUser?.email)
            toast?.error('Достъпът до администраторски панел беше отказан')

            // Downgrade role to teacher in Firestore
            await setDoc(userDocRef, { role: 'teacher' }, { merge: true })
            setUserData({ ...data, role: 'teacher' })

            // Sign out the user for security
            await firebaseSignOut(auth)
            setUserData(null)
            setUser(null)
            return
          }

          setUserData(data)
        } else {
          // SECURITY: No auto-creation of users
          // Users MUST be created by admin through the admin panel
          console?.warn('User document not found for:', firebaseUser?.email)
          toast?.error('Потребителският профил не е намерен. Моля, свържете се с администратор.')
          await firebaseSignOut(auth)
          setUserData(null)
          setUser(null)
        }
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)

      // Update last login
      const userDocRef = doc(db, 'users', result?.user.uid)
      await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true })

      toast?.success('Влизането беше успешно!')
      return result?.user
    } catch (error: any) {
      console?.error('Sign in error:', error)

      // User-friendly error messages
      if (error?.code === 'auth/user-not-found') {
        toast?.error('Потребителят не е намерен')
      } else if (error?.code === 'auth/wrong-password') {
        toast?.error('Грешна парола')
      } else if (error?.code === 'auth/invalid-email') {
        toast?.error('Невалиден имейл адрес')
      } else if (error?.code === 'auth/too-many-requests') {
        toast?.error('Твърде много опити. Опитайте по-късно')
      } else {
        toast?.error('Грешка при влизане: ' + error?.message)
      }

      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const result = await signInWithPopup(auth, googleProvider)

      // Check if user document exists
      const userDocRef = doc(db, 'users', result?.user.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc?.exists()) {
        // SECURITY: No auto-creation for Google sign-in
        // User must be created by admin first
        toast?.error('Профилът не е намерен. Моля, свържете се с администратор.')
        await firebaseSignOut(auth)
        throw new Error('User profile not found')
      }

      const userData = userDoc?.data() as User

      // SECURITY: Admin Whitelist Validation
      if (userData?.role === 'admin' && !isAdminWhitelisted(result?.user.email || '')) {
        console?.warn('Admin access denied for non-whitelisted email:', result?.user.email)
        toast?.error('Достъпът до администраторски панел беше отказан')
        await firebaseSignOut(auth)
        throw new Error('Admin access denied')
      }

      // Update last login
      await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true })

      toast?.success('Влизането с Google беше успешно!')
      return result?.user
    } catch (error: any) {
      console?.error('Google sign in error:', error)

      if (error?.code === 'auth/popup-closed-by-user') {
        toast?.error('Влизането беше отменено')
      } else if (error?.code === 'auth/popup-blocked') {
        toast?.error('Popup прозорецът беше блокиран от браузъра')
      } else if (error?.message === 'User profile not found' || error?.message === 'Admin access denied') {
        // Already handled above
      } else {
        toast?.error('Грешка при влизане с Google: ' + error?.message)
      }

      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = 'parent',
    additionalData?: Partial<User>
  ) => {
    try {
      setLoading(true)
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document
      const newUser: User = {
        id: result?.user.uid,
        email: email,
        name: name,
        role: role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        ...additionalData,
      }

      const userDocRef = doc(db, 'users', result?.user.uid)
      await setDoc(userDocRef, newUser)

      toast?.success('Регистрацията беше успешна!')
      return result?.user
    } catch (error: any) {
      console?.error('Sign up error:', error)

      if (error?.code === 'auth/email-already-in-use') {
        toast?.error('Имейлът вече е използван')
      } else if (error?.code === 'auth/weak-password') {
        toast?.error('Паролата трябва да е поне 6 символа')
      } else if (error?.code === 'auth/invalid-email') {
        toast?.error('Невалиден имейл адрес')
      } else {
        toast?.error('Грешка при регистрация: ' + error?.message)
      }

      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast?.success('Имейл за възстановяване на парола беше изпратен')
    } catch (error: any) {
      console?.error('Password reset error:', error)

      if (error?.code === 'auth/user-not-found') {
        toast?.error('Потребителят не е намерен')
      } else if (error?.code === 'auth/invalid-email') {
        toast?.error('Невалиден имейл адрес')
      } else {
        toast?.error('Грешка при изпращане на имейл: ' + error?.message)
      }

      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      toast?.success('Излязохте успешно')
    } catch (error: any) {
      console?.error('Sign out error:', error)
      toast?.error('Грешка при излизане')
      throw error
    }
  }

  // Helper functions for role checking
  // IMPORTANT: Be explicit about role checks to avoid confusion
  const isAdmin = userData?.role === 'admin'
  const isTeacher = userData?.role === 'teacher' // Teacher ONLY (not admin)
  const isTeacherOrAbove = userData?.role === 'teacher' || userData?.role === 'admin'
  const isParent = userData?.role === 'parent'

  return {
    user,
    userData,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    isAdmin,
    isTeacher,
    isTeacherOrAbove, // NEW: Use this for teacher OR admin access
    isParent,
  }
}

// SECURITY: Role Validation Helper
// Use this in login pages to validate that the logged-in user has the expected role
export const validateRoleAccess = (
  expectedRole: UserRole,
  actualRole: UserRole | undefined
): boolean => {
  if (!actualRole) return false

  // Exact match for parent and teacher
  if (expectedRole === 'parent' || expectedRole === 'teacher') {
    return actualRole === expectedRole
  }

  // Admin can only access admin routes
  if (expectedRole === 'admin') {
    return actualRole === 'admin'
  }

  return false
}

// SECURITY: Check if email is admin whitelisted (for external use)
export const checkAdminWhitelist = (email: string): boolean => {
  return isAdminWhitelisted(email)
}
