import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCe3HkkFFtUtalPK5xA5E1J4JkjIJyWn70",
  authDomain: "svetlinki-7911c?.firebaseapp.com",
  projectId: "svetlinki-7911c",
  storageBucket: "svetlinki-7911c?.firebasestorage.app",
  messagingSenderId: "362553535023",
  appId: "1:362553535023:web:f87e811f9349414f69b4da"
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider?.setCustomParameters({
  prompt: 'select_account',
})

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err?.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console?.warn('⚠️ Offline persistence failed: Multiple tabs open')
  } else if (err?.code === 'unimplemented') {
    // The current browser doesn't support persistence
    console?.warn('⚠️ Offline persistence not supported by this browser')
  }
})

console?.log('🔥 Firebase initialized successfully')
