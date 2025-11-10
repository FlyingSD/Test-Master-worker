# 🏗️ Architecture Review Report - Svetlinki CRM

## Executive Summary

Comprehensive code review based on 4 key principles:
- ✅ **SSOT (Single Source of Truth)**: Found 3 critical violations
- ⚠️ **PoLP (Principle of Least Privilege)**: Found 3 security issues
- 🔗 **Loose Coupling**: Found 3 architectural problems
- 🧹 **Clean Code**: Found 4 naming/structure issues

**Total Issues Found: 13**

---

## 🔴 CRITICAL: Single Source of Truth (SSOT) Violations

### ❌ Problem 1: Contradictory Role Checking Logic

**Location**: `hooks/useAuth.ts:181` vs `utils/permissions.ts:41-43`

**Issue**:
```typescript
// useAuth.ts line 181
isTeacher = userData?.role === 'teacher' || userData?.role === 'admin'

// permissions.ts line 41-43
export function isTeacher(role: UserRole): boolean {
  return role === 'teacher'  // Does NOT include admin!
}
```

**Problem**: Two different definitions of "isTeacher" in the codebase!
- `useAuth.isTeacher` returns TRUE for admins
- `permissions.isTeacher()` returns FALSE for admins

**Impact**:
- Confusion for developers
- Potential security bugs when wrong function is used
- Inconsistent behavior across the app

**Fix Priority**: 🔴 CRITICAL

---

### ❌ Problem 2: Denormalized Data Without Update Mechanism

**Location**: `types/index.ts:57, 136, 172`

**Issue**:
```typescript
// Payment interface (line 57)
studentName: string // Denormalized for faster queries

// Discount interface (line 136)
studentName: string

// StockTransaction interface (line 172)
inventoryItemName: string // Denormalized
```

**Problem**: Student names and inventory names are copied (denormalized) but there's NO mechanism to update them when the original changes!

**Impact**:
- If student "Иван Петров" changes name to "Иван Георгиев", all old payments will still show "Иван Петров"
- Historical data becomes incorrect
- No referential integrity

**Fix Priority**: 🟡 MEDIUM

---

### ❌ Problem 3: Permission System is Dead Code

**Location**: `types/index.ts:292-402` vs actual usage in pages

**Issue**:
```typescript
// types/index.ts defines comprehensive permission system
export type Permission = 'view_dashboard' | 'view_students' | 'create_students' ...

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  teacher: ['view_dashboard', 'view_students', 'edit_students', ...],
  ...
}

// BUT in actual pages (e.g., ReportsPage.tsx:19):
if (userData?.role !== 'admin') { return <Navigate to="/" /> }

// Permission system is NEVER used!
```

**Problem**:
- Entire permission system (110+ lines) is defined but NEVER used
- Pages use direct role checks instead
- Misleading for developers who think permissions are enforced

**Impact**:
- Dead code maintenance burden
- False sense of security
- Confusion about access control implementation

**Fix Priority**: 🟡 MEDIUM

---

## ⚠️ SECURITY: Principle of Least Privilege (PoLP) Violations

### 🔐 Problem 1: Teacher Can Edit ALL Students (Not Just Their Groups)

**Location**: `types/index.ts:387` comment vs actual implementation

**Issue**:
```typescript
// types/index.ts line 387
teacher: [
  'view_students',
  'edit_students', // Може да редактира САМО своите групи <- COMMENT LIE!
  ...
]
```

**Problem**: Comment says teachers can only edit "their groups" BUT:
- No group filtering is implemented in `StudentsPage.tsx`
- Teachers have full access to ALL students
- No `assignedGroups` validation anywhere

**Impact**:
- Teachers can modify students from other teachers' groups
- Privacy violation
- Potential data tampering

**Fix Priority**: 🔴 CRITICAL

---

### 🔐 Problem 2: `isTeacher` Includes Admins (Dangerous)

**Location**: `hooks/useAuth.ts:181`

**Issue**:
```typescript
const isTeacher = userData?.role === 'teacher' || userData?.role === 'admin'
```

**Problem**: If developer writes:
```typescript
if (isTeacher) {
  // Restrict to teacher-only features
}
```

This will ALSO allow admins, which may not be intended!

**Impact**:
- Confusing behavior
- Potential permission escalation bugs
- Hard to debug

**Fix Priority**: 🟡 MEDIUM

---

### 🔐 Problem 3: No Ownership Validation on Mutations

**Location**: `hooks/usePayments.ts`, `hooks/useInventory.ts`

**Issue**:
```typescript
// useDeletePayment (line 197-214)
export function useDeletePayment() {
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const docRef = doc(db, 'payments', paymentId)
      await deleteDoc(docRef)  // NO ownership check!
    },
  })
}
```

**Problem**:
- Any authenticated user can delete ANY payment
- No check if payment belongs to user's students
- No role validation before delete

**Impact**:
- Data manipulation vulnerability
- Teachers can delete admin payments
- No audit trail protection

**Fix Priority**: 🔴 CRITICAL

---

## 🔗 ARCHITECTURE: Loose Coupling Violations

### 🔌 Problem 1: Inventory Sales Don't Create Payments (Data Integrity)

**Location**: `hooks/useInventory.ts:252-308` vs `hooks/usePayments.ts`

**Issue**:
```typescript
// useAddStockTransaction (line 255-308)
// When teacher sells item from inventory:
export function useAddStockTransaction() {
  return useMutation({
    mutationFn: async ({ data, userId, inventoryItem }) => {
      // Updates inventory stock
      await updateDoc(inventoryRef, { currentStock: newStock })

      // BUT does NOT create Payment record!
      // Even though StockTransaction has relatedPaymentId field (line 179)
    },
  })
}
```

**Problem**:
- Teacher sells "Абакус 13 реда" for 50 BGN
- Inventory stock decreases ✅
- Payment record is NOT created ❌
- Revenue is not tracked ❌

**Impact**:
- Financial reports are WRONG (missing inventory sales)
- Manual reconciliation needed
- Data integrity broken

**Fix Priority**: 🔴 CRITICAL

**Recommended Fix**:
```typescript
// When OUT transaction with reason "Продажба на ученик":
if (data.type === 'OUT' && data.reason === 'Продажба на ученик' && data.relatedStudentId) {
  // Create Payment record automatically
  const paymentData = {
    studentId: data.relatedStudentId,
    amount: data.totalPrice,
    article: inventoryItem.name,
    method: 'Кеш', // or from form
    // ...
  }
  const paymentRef = await addDoc(paymentsCollection, paymentData)

  // Link transaction to payment
  transactionData.relatedPaymentId = paymentRef.id
}
```

---

### 🔌 Problem 2: Duplicate Real-Time Listener Logic

**Location**: Multiple hooks

**Issue**:
```typescript
// useInventory.ts lines 34-62
useEffect(() => {
  const q = query(inventoryCollection, orderBy('name'))
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const inventoryData: InventoryItem[] = []
    snapshot.forEach((doc) => {
      inventoryData.push({ id: doc.id, ...doc.data() } as InventoryItem)
    })
    setInventory(inventoryData)
    setLoading(false)
  })
  return () => unsubscribe()
}, [])

// usePayments.ts lines 34-63 - EXACT SAME PATTERN!
// useStockTransactions.ts lines 191-209 - EXACT SAME PATTERN!
// useExpenses.ts - SAME!
// useEvents.ts - SAME!
```

**Problem**:
- Same boilerplate code repeated 10+ times
- Violates DRY (Don't Repeat Yourself)
- Hard to maintain (fix bug in one place → must fix everywhere)

**Impact**:
- Code duplication (200+ lines)
- Maintenance burden
- Inconsistent error handling

**Fix Priority**: 🟡 MEDIUM

**Recommended Fix**:
```typescript
// hooks/useRealtimeCollection.ts
export function useRealtimeCollection<T>(
  collectionName: string,
  queryConstraints: QueryConstraint[] = []
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const collectionRef = collection(db, collectionName)
    const q = query(collectionRef, ...queryConstraints)

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T))
        setData(items)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err as Error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [collectionName])

  return { data, loading, error }
}

// Usage:
export function usePayments() {
  return useRealtimeCollection<Payment>('payments', [orderBy('date', 'desc')])
}
```

---

### 🔌 Problem 3: Stats Calculation in Components Instead of Hooks

**Location**: `pages/DashboardPage.tsx:26-44`, `pages/PaymentsPage.tsx:68-75`

**Issue**:
```typescript
// DashboardPage.tsx lines 26-44
const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
const profit = totalRevenue - totalExpenses

// PaymentsPage.tsx lines 68-75
const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
const thisMonth = payments.filter((p) => {
  const paymentDate = p.date instanceof Date ? p.date : p.date.toDate()
  const now = new Date()
  return paymentDate.getMonth() === now.getMonth()
})
const monthRevenue = thisMonth.reduce((sum, p) => sum + p.amount, 0)
```

**Problem**:
- Business logic in UI components
- Duplicated revenue calculation
- Hard to test
- Can't reuse in other components

**Impact**:
- Code duplication
- Testing difficulty
- Maintenance burden

**Fix Priority**: 🟢 LOW

**Recommended Fix**:
```typescript
// hooks/usePaymentStats.ts
export function usePaymentStats() {
  const { payments } = usePayments()

  const totalRevenue = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  )

  const monthRevenue = useMemo(() => {
    const now = new Date()
    return payments
      .filter((p) => {
        const paymentDate = p.date instanceof Date ? p.date : p.date.toDate()
        return paymentDate.getMonth() === now.getMonth() &&
               paymentDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }, [payments])

  return { totalRevenue, monthRevenue }
}
```

---

## 🧹 MAINTENANCE: Clean Code Violations

### 🏷️ Problem 1: Misleading Helper Function Name

**Location**: `hooks/useAuth.ts:181`

**Issue**:
```typescript
const isTeacher = userData?.role === 'teacher' || userData?.role === 'admin'
```

**Problem**: Name says `isTeacher` but it's actually `isTeacherOrAdmin`!

**Impact**:
- Confusing for developers
- Code reads incorrectly
- Potential bugs when developers assume it's teacher-only

**Fix Priority**: 🟢 LOW

**Recommended Fix**:
```typescript
const isTeacher = userData?.role === 'teacher'
const isTeacherOrAbove = userData?.role === 'teacher' || userData?.role === 'admin'
const isAdmin = userData?.role === 'admin'
```

---

### 🏷️ Problem 2: Magic Strings for Collection Names

**Location**: All hooks

**Issue**:
```typescript
// useInventory.ts line 23
const inventoryCollection = collection(db, 'inventory')

// usePayments.ts line 24
const paymentsCollection = collection(db, 'payments')

// Repeated in 10+ files!
```

**Problem**:
- Typo risk
- Hard to refactor
- No autocomplete

**Impact**:
- Potential runtime errors from typos
- Refactoring difficulty

**Fix Priority**: 🟢 LOW

**Recommended Fix**:
```typescript
// lib/collections.ts
export const COLLECTIONS = {
  USERS: 'users',
  STUDENTS: 'students',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  INVENTORY: 'inventory',
  STOCK_TRANSACTIONS: 'stockTransactions',
  INVOICES: 'invoices',
  EVENTS: 'events',
  PARENTS: 'parents',
  DISCOUNTS: 'discounts',
  ATTENDANCE: 'attendance',
  HOMEWORK: 'homework',
} as const

// Usage:
const paymentsCollection = collection(db, COLLECTIONS.PAYMENTS)
```

---

### 🏷️ Problem 3: Error Messages Hardcoded

**Location**: Multiple hooks

**Issue**:
```typescript
// useInventory.ts line 58
toast.error('Грешка при зареждане на склада')

// usePayments.ts line 58
toast.error('Грешка при зареждане на плащания')

// Repeated 50+ times across the app!
```

**Problem**:
- No i18n support
- Hard to change wording
- Inconsistent messaging

**Impact**:
- Future i18n difficulty
- Maintenance burden

**Fix Priority**: 🟢 LOW

**Recommended Fix**:
```typescript
// utils/errorMessages.ts
export const ERROR_MESSAGES = {
  INVENTORY: {
    LOAD_FAILED: 'Грешка при зареждане на склада',
    ADD_FAILED: 'Грешка при добавяне на артикул',
    UPDATE_FAILED: 'Грешка при обновяване на артикул',
    DELETE_FAILED: 'Грешка при изтриване на артикул',
  },
  PAYMENTS: {
    LOAD_FAILED: 'Грешка при зареждане на плащания',
    ADD_FAILED: 'Грешка при добавяне на плащане',
    // ...
  },
} as const
```

---

### 🏷️ Problem 4: Inconsistent Type Naming

**Location**: `types/index.ts`

**Issue**:
```typescript
// Good naming:
export interface InventoryItem { ... }
export interface StockTransaction { ... }
export interface SystemSettings { ... }

// Bad naming:
export interface Payment { ... }  // Should be PaymentTransaction or StudentPayment
export interface Event { ... }    // Too generic! Should be ClassEvent or ScheduleEvent
export interface User { ... }     // Conflicts with Firebase's User type
```

**Problem**:
- Inconsistent naming convention
- Generic names cause conflicts
- Hard to understand at a glance

**Impact**:
- Code confusion
- Import conflicts
- Developer friction

**Fix Priority**: 🟢 LOW

---

## 📊 Summary

| Category | Critical | Medium | Low | Total |
|----------|----------|--------|-----|-------|
| SSOT | 1 | 2 | 0 | 3 |
| PoLP | 2 | 1 | 0 | 3 |
| Loose Coupling | 1 | 1 | 1 | 3 |
| Clean Code | 0 | 0 | 4 | 4 |
| **TOTAL** | **4** | **4** | **5** | **13** |

---

## 🎯 Recommended Fix Priority

### Phase 1: CRITICAL Fixes (Do First!)
1. ✅ Fix inventory sales → payment integration (Loose Coupling #1)
2. ✅ Fix contradictory role checking logic (SSOT #1)
3. ✅ Add ownership validation to mutations (PoLP #3)
4. ✅ Implement teacher group filtering (PoLP #1)

### Phase 2: MEDIUM Fixes (Do Soon)
5. ⚠️ Implement denormalized data update mechanism (SSOT #2)
6. ⚠️ Remove unused permission system OR implement it (SSOT #3)
7. ⚠️ Fix isTeacher includes admin (PoLP #2)
8. ⚠️ Create generic useRealtimeCollection hook (Loose Coupling #2)

### Phase 3: LOW Priority (Nice to Have)
9. 🟢 Rename isTeacher → isTeacherOrAbove (Clean Code #1)
10. 🟢 Extract collection names to constants (Clean Code #2)
11. 🟢 Extract error messages to constants (Clean Code #3)
12. 🟢 Rename generic types (Clean Code #4)
13. 🟢 Move stats to hooks (Loose Coupling #3)

---

## 🛠️ Implementation Plan

See `ARCHITECTURE_FIXES.md` for step-by-step implementation guide.

---

*Generated: 2025-11-10*
*Reviewed by: Claude (AI Architecture Specialist)*
