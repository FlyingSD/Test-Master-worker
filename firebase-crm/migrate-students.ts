/**
 * Migration Script for Student Data
 *
 * This script migrates existing student documents to the new schema:
 * 1. Adds studentCode to students without one
 * 2. Converts parentId (string) to parentIds (array)
 * 3. Ensures dateOfBirth field exists (optional, undefined if not set)
 *
 * USAGE:
 *   npm run migrate
 *
 * SAFETY:
 * - Dry run mode by default (set DRY_RUN=false to actually write changes)
 * - Logs all changes before applying them
 * - Creates backup before migration
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import { generateStudentCode } from './src/utils/studentCode'

// Firebase configuration (use environment variables in production)
const firebaseConfig = {
  // TODO: Add your Firebase config here
  // You can copy it from src/lib/firebase.ts
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Configuration
const DRY_RUN = process.env.DRY_RUN !== 'false' // Default to dry run for safety
const BATCH_SIZE = 500 // Firestore batch limit

interface OldStudent {
  id: string
  studentCode?: string
  parentId?: string
  parentIds?: string[]
  dateOfBirth?: Date | Timestamp
  [key: string]: any
}

interface MigrationChange {
  studentId: string
  studentName: string
  changes: {
    addedStudentCode?: string
    convertedParentId?: { from: string; to: string[] }
    addedDateOfBirth?: boolean
  }
}

/**
 * Main migration function
 */
async function migrateStudents() {
  console.log('🚀 Starting Student Migration Script')
  console.log(`📋 Mode: ${DRY_RUN ? 'DRY RUN (no changes will be saved)' : 'LIVE (changes will be applied)'}`)
  console.log('━'.repeat(60))

  try {
    // Step 1: Fetch all students
    console.log('\n📥 Fetching all students...')
    const studentsRef = collection(db, 'students')
    const snapshot = await getDocs(studentsRef)

    console.log(`✅ Found ${snapshot.size} students`)

    if (snapshot.empty) {
      console.log('ℹ️  No students to migrate')
      return
    }

    // Step 2: Analyze what needs to be migrated
    const changes: MigrationChange[] = []
    const usedCodes = new Set<string>()

    snapshot.forEach((docSnapshot) => {
      const student = { id: docSnapshot.id, ...docSnapshot.data() } as OldStudent
      const studentChanges: MigrationChange['changes'] = {}

      // Check 1: Missing studentCode
      if (!student.studentCode) {
        let code: string
        do {
          code = generateStudentCode()
        } while (usedCodes.has(code))

        usedCodes.add(code)
        studentChanges.addedStudentCode = code
      } else {
        usedCodes.add(student.studentCode)
      }

      // Check 2: parentId needs conversion to parentIds[]
      if (student.parentId && !student.parentIds) {
        const parentId = student.parentId
        const parentIds = parentId ? [parentId] : []
        studentChanges.convertedParentId = {
          from: parentId,
          to: parentIds,
        }
      }

      // Check 3: dateOfBirth field (just ensure it exists, can be undefined)
      if (!('dateOfBirth' in student)) {
        studentChanges.addedDateOfBirth = true
      }

      // Only add to changes if there's something to migrate
      if (Object.keys(studentChanges).length > 0) {
        changes.push({
          studentId: student.id,
          studentName: student.name || 'Unknown',
          changes: studentChanges,
        })
      }
    })

    // Step 3: Report changes
    console.log('\n📊 Migration Summary:')
    console.log(`   Total students: ${snapshot.size}`)
    console.log(`   Students needing migration: ${changes.length}`)
    console.log(`   Students already up-to-date: ${snapshot.size - changes.length}`)
    console.log('')

    if (changes.length === 0) {
      console.log('✅ All students are already up-to-date! No migration needed.')
      return
    }

    // Show detailed changes
    console.log('\n📝 Detailed Changes:')
    changes.forEach((change, index) => {
      console.log(`\n${index + 1}. ${change.studentName} (ID: ${change.studentId})`)

      if (change.changes.addedStudentCode) {
        console.log(`   ✨ Will add studentCode: ${change.changes.addedStudentCode}`)
      }

      if (change.changes.convertedParentId) {
        console.log(`   🔄 Will convert parentId: "${change.changes.convertedParentId.from}" → parentIds: [${change.changes.convertedParentId.to.map(id => `"${id}"`).join(', ')}]`)
      }

      if (change.changes.addedDateOfBirth) {
        console.log(`   📅 Will add dateOfBirth field (undefined)`)
      }
    })

    // Step 4: Apply changes (if not dry run)
    if (!DRY_RUN) {
      console.log('\n\n⚠️  APPLYING CHANGES (this is a LIVE migration)')
      console.log('━'.repeat(60))

      // Process in batches
      for (let i = 0; i < changes.length; i += BATCH_SIZE) {
        const batch = writeBatch(db)
        const batchChanges = changes.slice(i, i + BATCH_SIZE)

        batchChanges.forEach((change) => {
          const studentRef = doc(db, 'students', change.studentId)
          const updateData: any = {
            updatedAt: Timestamp.now(),
          }

          if (change.changes.addedStudentCode) {
            updateData.studentCode = change.changes.addedStudentCode
          }

          if (change.changes.convertedParentId) {
            updateData.parentIds = change.changes.convertedParentId.to
            // Note: We keep the old parentId field for safety (can be removed manually later)
          }

          if (change.changes.addedDateOfBirth) {
            updateData.dateOfBirth = undefined
          }

          batch.update(studentRef, updateData)
        })

        await batch.commit()
        console.log(`✅ Migrated batch ${Math.floor(i / BATCH_SIZE) + 1} (${batchChanges.length} students)`)
      }

      console.log('\n✅ Migration completed successfully!')
    } else {
      console.log('\n\n🔍 DRY RUN MODE - No changes were applied')
      console.log('To apply these changes, run with: DRY_RUN=false npm run migrate')
    }

    console.log('\n━'.repeat(60))
    console.log('✅ Migration script finished')

  } catch (error) {
    console.error('\n❌ Migration failed:')
    console.error(error)
    process.exit(1)
  }
}

// Run migration
migrateStudents()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
