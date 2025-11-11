/**
 * Firestore Security Rules Tests
 *
 * These tests verify that the Firestore security rules properly enforce:
 * - Authentication requirements
 * - Role-based access control (RBAC)
 * - Data ownership rules
 * - Principle of Least Privilege (PoLP)
 *
 * To run these tests:
 * npm run test:rules
 *
 * Prerequisites:
 * - Firebase project with Firestore
 * - firestore.rules file deployed
 * - @firebase/rules-unit-testing installed
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { describe, it, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  // Read Firestore rules
  const rulesContent = fs.readFileSync(
    path.resolve(__dirname, 'firestore.rules'),
    'utf8'
  )

  // Initialize test environment
  testEnv = await initializeTestEnvironment({
    projectId: 'test-svetlinki-crm',
    firestore: {
      rules: rulesContent,
      host: 'localhost',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

describe('Firestore Security Rules - Authentication', () => {
  it('should deny access to unauthenticated users', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore()

    await assertFails(
      getDoc(doc(unauthedDb, 'students/student-1'))
    )
  })

  it('should allow access to authenticated users', async () => {
    const authedDb = testEnv.authenticatedContext('user-1').firestore()

    // Set up test data first
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'Test Student',
        createdBy: 'user-1',
      })
    })

    await assertSucceeds(
      getDoc(doc(authedDb, 'students/student-1'))
    )
  })
})

describe('Firestore Security Rules - Students Collection', () => {
  it('admin can create students', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    await assertSucceeds(
      setDoc(doc(adminDb, 'students/new-student'), {
        name: 'New Student',
        group: 'Група 1',
        fee: 100,
        status: 'active',
        createdBy: 'admin-1',
        createdAt: new Date(),
      })
    )
  })

  it('teacher can create students', async () => {
    const teacherDb = testEnv.authenticatedContext('teacher-1', {
      role: 'teacher',
    }).firestore()

    await assertSucceeds(
      setDoc(doc(teacherDb, 'students/new-student'), {
        name: 'New Student',
        group: 'Група 1',
        fee: 100,
        status: 'active',
        createdBy: 'teacher-1',
        createdAt: new Date(),
      })
    )
  })

  it('parent cannot create students', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    await assertFails(
      setDoc(doc(parentDb, 'students/new-student'), {
        name: 'New Student',
        group: 'Група 1',
        fee: 100,
        status: 'active',
        createdBy: 'parent-1',
        createdAt: new Date(),
      })
    )
  })

  it('admin can read all students', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'Student 1',
        createdBy: 'other-user',
      })
    })

    await assertSucceeds(
      getDoc(doc(adminDb, 'students/student-1'))
    )
  })

  it('teacher can only read students from assigned groups', async () => {
    const teacherDb = testEnv.authenticatedContext('teacher-1', {
      role: 'teacher',
      assignedGroups: ['Група 1'],
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'Student 1',
        group: 'Група 1',
        createdBy: 'admin-1',
      })

      await setDoc(doc(context.firestore(), 'students/student-2'), {
        name: 'Student 2',
        group: 'Група 2',
        createdBy: 'admin-1',
      })
    })

    // Should succeed for assigned group
    await assertSucceeds(
      getDoc(doc(teacherDb, 'students/student-1'))
    )

    // Should fail for non-assigned group
    await assertFails(
      getDoc(doc(teacherDb, 'students/student-2'))
    )
  })

  it('parent can only read their own children', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'My Child',
        parentIds: ['parent-1'],
        createdBy: 'admin-1',
      })

      await setDoc(doc(context.firestore(), 'students/student-2'), {
        name: 'Other Child',
        parentIds: ['parent-2'],
        createdBy: 'admin-1',
      })
    })

    // Should succeed for own child
    await assertSucceeds(
      getDoc(doc(parentDb, 'students/student-1'))
    )

    // Should fail for other child
    await assertFails(
      getDoc(doc(parentDb, 'students/student-2'))
    )
  })

  it('admin can update any student', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'Student 1',
        createdBy: 'other-user',
      })
    })

    await assertSucceeds(
      updateDoc(doc(adminDb, 'students/student-1'), {
        name: 'Updated Name',
      })
    )
  })

  it('parent cannot update students', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'My Child',
        parentIds: ['parent-1'],
        createdBy: 'admin-1',
      })
    })

    await assertFails(
      updateDoc(doc(parentDb, 'students/student-1'), {
        name: 'Attempted Update',
      })
    )
  })

  it('admin can delete students', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'Student 1',
        createdBy: 'admin-1',
      })
    })

    await assertSucceeds(
      deleteDoc(doc(adminDb, 'students/student-1'))
    )
  })

  it('teacher cannot delete students', async () => {
    const teacherDb = testEnv.authenticatedContext('teacher-1', {
      role: 'teacher',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'Student 1',
        createdBy: 'teacher-1',
      })
    })

    await assertFails(
      deleteDoc(doc(teacherDb, 'students/student-1'))
    )
  })
})

describe('Firestore Security Rules - Payments Collection', () => {
  it('admin can create payments', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    await assertSucceeds(
      setDoc(doc(adminDb, 'payments/payment-1'), {
        studentId: 'student-1',
        amount: 100,
        method: 'Кеш',
        date: new Date(),
        createdBy: 'admin-1',
      })
    )
  })

  it('teacher can create payments', async () => {
    const teacherDb = testEnv.authenticatedContext('teacher-1', {
      role: 'teacher',
    }).firestore()

    await assertSucceeds(
      setDoc(doc(teacherDb, 'payments/payment-1'), {
        studentId: 'student-1',
        amount: 100,
        method: 'Кеш',
        date: new Date(),
        createdBy: 'teacher-1',
      })
    )
  })

  it('parent cannot create payments', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    await assertFails(
      setDoc(doc(parentDb, 'payments/payment-1'), {
        studentId: 'student-1',
        amount: 100,
        method: 'Кеш',
        date: new Date(),
        createdBy: 'parent-1',
      })
    )
  })

  it('parent can read payments for their children', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      // Create student first
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'My Child',
        parentIds: ['parent-1'],
        createdBy: 'admin-1',
      })

      // Create payment
      await setDoc(doc(context.firestore(), 'payments/payment-1'), {
        studentId: 'student-1',
        amount: 100,
        createdBy: 'admin-1',
      })
    })

    await assertSucceeds(
      getDoc(doc(parentDb, 'payments/payment-1'))
    )
  })

  it('parent cannot read payments for other children', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      // Create other parent's student
      await setDoc(doc(context.firestore(), 'students/student-2'), {
        name: 'Other Child',
        parentIds: ['parent-2'],
        createdBy: 'admin-1',
      })

      // Create payment
      await setDoc(doc(context.firestore(), 'payments/payment-2'), {
        studentId: 'student-2',
        amount: 100,
        createdBy: 'admin-1',
      })
    })

    await assertFails(
      getDoc(doc(parentDb, 'payments/payment-2'))
    )
  })
})

describe('Firestore Security Rules - Homework Collection', () => {
  it('teacher can create homework', async () => {
    const teacherDb = testEnv.authenticatedContext('teacher-1', {
      role: 'teacher',
    }).firestore()

    await assertSucceeds(
      setDoc(doc(teacherDb, 'homework/homework-1'), {
        studentId: 'student-1',
        title: 'Math Homework',
        dueDate: new Date(),
        status: 'assigned',
        createdBy: 'teacher-1',
      })
    )
  })

  it('parent cannot create homework', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    await assertFails(
      setDoc(doc(parentDb, 'homework/homework-1'), {
        studentId: 'student-1',
        title: 'Math Homework',
        dueDate: new Date(),
        status: 'assigned',
        createdBy: 'parent-1',
      })
    )
  })

  it('parent can read homework for their children', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      // Create student
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'My Child',
        parentIds: ['parent-1'],
        createdBy: 'admin-1',
      })

      // Create homework
      await setDoc(doc(context.firestore(), 'homework/homework-1'), {
        studentId: 'student-1',
        title: 'Math Homework',
        createdBy: 'teacher-1',
      })
    })

    await assertSucceeds(
      getDoc(doc(parentDb, 'homework/homework-1'))
    )
  })

  it('teacher can update homework', async () => {
    const teacherDb = testEnv.authenticatedContext('teacher-1', {
      role: 'teacher',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'homework/homework-1'), {
        studentId: 'student-1',
        title: 'Math Homework',
        status: 'assigned',
        createdBy: 'teacher-1',
      })
    })

    await assertSucceeds(
      updateDoc(doc(teacherDb, 'homework/homework-1'), {
        status: 'completed',
        grade: 95,
      })
    )
  })

  it('parent cannot update homework', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'students/student-1'), {
        name: 'My Child',
        parentIds: ['parent-1'],
        createdBy: 'admin-1',
      })

      await setDoc(doc(context.firestore(), 'homework/homework-1'), {
        studentId: 'student-1',
        title: 'Math Homework',
        createdBy: 'teacher-1',
      })
    })

    await assertFails(
      updateDoc(doc(parentDb, 'homework/homework-1'), {
        grade: 100,
      })
    )
  })
})

describe('Firestore Security Rules - Settings Collection', () => {
  it('admin can read settings', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'settings/system'), {
        schoolName: 'Svetlinki',
        currency: 'BGN',
      })
    })

    await assertSucceeds(
      getDoc(doc(adminDb, 'settings/system'))
    )
  })

  it('admin can update settings', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'settings/system'), {
        schoolName: 'Svetlinki',
        currency: 'BGN',
      })
    })

    await assertSucceeds(
      updateDoc(doc(adminDb, 'settings/system'), {
        schoolName: 'New Name',
      })
    )
  })

  it('teacher cannot update settings', async () => {
    const teacherDb = testEnv.authenticatedContext('teacher-1', {
      role: 'teacher',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'settings/system'), {
        schoolName: 'Svetlinki',
        currency: 'BGN',
      })
    })

    await assertFails(
      updateDoc(doc(teacherDb, 'settings/system'), {
        schoolName: 'Hacked',
      })
    )
  })

  it('parent cannot read settings', async () => {
    const parentDb = testEnv.authenticatedContext('parent-1', {
      role: 'parent',
    }).firestore()

    // Set up test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'settings/system'), {
        schoolName: 'Svetlinki',
        currency: 'BGN',
      })
    })

    await assertFails(
      getDoc(doc(parentDb, 'settings/system'))
    )
  })
})

describe('Firestore Security Rules - Data Validation', () => {
  it('should enforce createdBy field', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    await assertFails(
      setDoc(doc(adminDb, 'students/student-1'), {
        name: 'Test Student',
        // Missing createdBy field
      })
    )
  })

  it('should enforce valid status values', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    await assertFails(
      setDoc(doc(adminDb, 'students/student-1'), {
        name: 'Test Student',
        status: 'invalid-status', // Invalid status
        createdBy: 'admin-1',
      })
    )
  })

  it('should enforce positive amounts in payments', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
    }).firestore()

    await assertFails(
      setDoc(doc(adminDb, 'payments/payment-1'), {
        studentId: 'student-1',
        amount: -100, // Negative amount
        method: 'Кеш',
        createdBy: 'admin-1',
      })
    )
  })
})
