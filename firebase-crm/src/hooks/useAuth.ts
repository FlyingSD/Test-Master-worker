import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import { User } from '@/types'
import toast from 'react-hot-toast'

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid)
        const userDoc = await getDoc(userDocRef)

        if (userDoc.exists()) {
          setUserData(userDoc.data() as User)
        } else {
          // Create user document if it doesn't exist
          const newUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            role: 'teacher', // Default role
            createdAt: serverTimestamp(),
          }
          await setDoc(userDocRef, newUser)
          setUserData(newUser)
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
      const userDocRef = doc(db, 'users', result.user.uid)
      await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true })

      toast.success('Влизането беше успешно!')
      return result.user
    } catch (error: any) {
      console.error('Sign in error:', error)

      // User-friendly error messages
      if (error.code === 'auth/user-not-found') {
        toast.error('Потребителят не е намерен')
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Грешна парола')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Невалиден имейл адрес')
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Твърде много опити. Опитайте по-късно')
      } else {
        toast.error('Грешка при влизане: ' + error.message)
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

      // Check if user document exists, if not create it
      const userDocRef = doc(db, 'users', result.user.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        const newUser: User = {
          id: result.user.uid,
          email: result.user.email!,
          name: result.user.displayName || result.user.email!.split('@')[0],
          role: 'teacher', // Default role
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        }
        await setDoc(userDocRef, newUser)
      } else {
        // Update last login
        await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true })
      }

      toast.success('Влизането с Google беше успешно!')
      return result.user
    } catch (error: any) {
      console.error('Google sign in error:', error)

      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Влизането беше отменено')
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup прозорецът беше блокиран от браузъра')
      } else {
        toast.error('Грешка при влизане с Google: ' + error.message)
      }

      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true)
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document
      const newUser: User = {
        id: result.user.uid,
        email: email,
        name: name,
        role: 'teacher', // Default role
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }

      const userDocRef = doc(db, 'users', result.user.uid)
      await setDoc(userDocRef, newUser)

      toast.success('Регистрацията беше успешна!')
      return result.user
    } catch (error: any) {
      console.error('Sign up error:', error)

      if (error.code === 'auth/email-already-in-use') {
        toast.error('Имейлът вече е използван')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Паролата трябва да е поне 6 символа')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Невалиден имейл адрес')
      } else {
        toast.error('Грешка при регистрация: ' + error.message)
      }

      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      toast.success('Излязохте успешно')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Грешка при излизане')
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
    isAdmin,
    isTeacher,
    isTeacherOrAbove, // NEW: Use this for teacher OR admin access
    isParent,
  }
}
