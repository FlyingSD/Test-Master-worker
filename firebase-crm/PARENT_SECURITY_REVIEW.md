# 🔐 Parent Role Security Review

## 🔴 CRITICAL: Privacy & Security Violations for Parents

---

## 1. ⚠️ **PoLP VIOLATION - DATA LEAKAGE (SEVERITY: CRITICAL)**

### Problem: Parents Load ALL Payments (Not Just Their Children's)

**Location**:
- `MyChildrenPage.tsx:14`
- `ParentDashboardPage.tsx:14`

**Code**:
```typescript
// MyChildrenPage.tsx line 14
const { payments, loading: paymentsLoading } = usePayments()

// Line 34-35: Filters AFTER loading
const myStudentIds = students.map(s => s.id)
const myPayments = payments.filter(p => myStudentIds.includes(p.studentId))
```

### Why This Is CRITICAL:

1. **Privacy Violation**: Parent downloads ALL payments from ALL families
2. **Network Inspection**: Technical parent can open DevTools → Network tab and see:
   ```json
   {
     "payments": [
       {"studentName": "Иван Петров", "amount": 120, ...},    // Their child
       {"studentName": "Мария Иванова", "amount": 150, ...},  // NOT their child!
       {"studentName": "Георги Димитров", "amount": 100, ...} // NOT their child!
     ]
   }
   ```
3. **GDPR Violation**: Parent has access to other families' financial data
4. **Performance**: Downloading 1000+ payments when they need only 5

### Impact:
- **Privacy**: 🔴 CRITICAL - Other families' data exposed
- **GDPR**: 🔴 CRITICAL - Personal data leakage
- **Performance**: 🟡 MEDIUM - Slow load times

---

## 2. 📋 **SSOT VIOLATION - Duplicate Filtering Logic**

### Problem: Same Filtering Code Repeated 3+ Times

**Locations**:
- `MyChildrenPage.tsx:33-35`
- `ParentDashboardPage.tsx:32-34`
- `PaymentsPage.tsx:30-37`

**Code Duplication**:
```typescript
// MyChildrenPage.tsx:33-35
const myStudentIds = students.map(s => s.id)
const myPayments = payments.filter(p => myStudentIds.includes(p.studentId))

// ParentDashboardPage.tsx:32-34 - EXACT SAME CODE!
const myStudentIds = students.map(s => s.id)
const myPayments = payments.filter(p => myStudentIds.includes(p.studentId))

// PaymentsPage.tsx:30-37 - SIMILAR PATTERN
const myChildrenIds = isParent ? myChildren.map(s => s.id) : []
if (isParent && !myChildrenIds.includes(payment.studentId)) {
  return false
}
```

### Why This Violates SSOT:
- Same business logic in 3 different places
- If filtering logic changes → must update 3 files
- Risk of inconsistency

### Impact:
- **Maintainability**: 🟡 MEDIUM - Bug risk
- **Code Quality**: 🟢 LOW - But annoying

---

## 3. 🔗 **LOOSE COUPLING - Missing Specialized Hooks**

### Problem: No Parent-Specific Data Hooks

**Missing Hooks**:

1. **usePaymentsByParent()** - Doesn't exist!
   ```typescript
   // Should be:
   const { payments } = usePaymentsByParent(user.uid)

   // Instead of:
   const { payments } = usePayments()  // ALL payments
   const myPayments = payments.filter(...)  // Manual filter
   ```

2. **useHomeworkByParent()** - Doesn't exist!
   ```typescript
   // Parent wants to see homework for ALL their children
   // Currently: Must call useHomeworkByStudent() for each child separately
   // Should be: useHomeworkByParent(parentId) → returns homework for all children
   ```

3. **useStudentsByParent()** - ✅ EXISTS! (Good example)
   ```typescript
   // This one is done correctly:
   const { students } = useStudentsByParent(user.uid)
   // Filters in Firestore query, not in UI
   ```

### Why This Is Bad:
- Every component must manually filter
- No centralized filtering logic
- Performance waste (download all, filter client-side)

### Impact:
- **Architecture**: 🟡 MEDIUM - Poor coupling
- **Performance**: 🟡 MEDIUM - Wasted bandwidth
- **DRY Violation**: 🟡 MEDIUM - Duplicate code

---

## 4. 🧹 **CLEAN CODE - Inconsistent Patterns**

### Problem: Parent Data Access Is Inconsistent

**Good Pattern** (useStudentsByParent):
```typescript
// hooks/useStudents.ts:93-126
export function useStudentsByParent(parentId: string) {
  // Filters in Firestore query ✅
  const q = query(
    studentsCollection,
    where('parentId', '==', parentId),  // SERVER-SIDE FILTER ✅
    orderBy('name')
  )
  // Only downloads parent's students ✅
}
```

**Bad Pattern** (parent payments):
```typescript
// MyChildrenPage.tsx:14,34-35
const { payments } = usePayments()  // Downloads ALL ❌
const myPayments = payments.filter(...)  // CLIENT-SIDE FILTER ❌
```

### Why Inconsistent:
- Students: Server-side filtering ✅
- Payments: Client-side filtering ❌
- Homework: Per-student only (no parent aggregate) ❌

### Impact:
- **Confusion**: 🟢 LOW - But inconsistent
- **Security**: 🔴 CRITICAL - When combined with privacy issue

---

## 📊 Summary Table

| Issue | Category | Severity | Location |
|-------|----------|----------|----------|
| Parents download ALL payments | PoLP | 🔴 CRITICAL | MyChildrenPage, ParentDashboardPage |
| Duplicate filtering logic | SSOT | 🟡 MEDIUM | 3 pages |
| No usePaymentsByParent hook | Loose Coupling | 🟡 MEDIUM | hooks/usePayments.ts |
| No useHomeworkByParent hook | Loose Coupling | 🟡 MEDIUM | hooks/useHomework.ts |
| Inconsistent filter patterns | Clean Code | 🟢 LOW | Multiple files |

---

## 🛠️ RECOMMENDED FIXES

### Priority 1: CRITICAL (Do Immediately!)

#### Fix 1: Create usePaymentsByParent Hook

**File**: `hooks/usePayments.ts`

```typescript
/**
 * Hook to get payments for all children of a parent (server-side filtered)
 * SECURITY: Only downloads payment data for parent's children
 */
export function usePaymentsByParent(parentId: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  // First, get parent's students
  const { students } = useStudentsByParent(parentId)
  const studentIds = students.map(s => s.id)

  useEffect(() => {
    if (studentIds.length === 0) {
      setPayments([])
      setLoading(false)
      return
    }

    // 🔒 SECURITY: Only query payments for parent's children
    // Firestore 'in' operator limits to 10 items, handle larger arrays
    const chunks = []
    for (let i = 0; i < studentIds.length; i += 10) {
      chunks.push(studentIds.slice(i, i + 10))
    }

    const unsubscribes: (() => void)[] = []
    const allPayments: Payment[] = []

    chunks.forEach((chunk) => {
      const q = query(
        paymentsCollection,
        where('studentId', 'in', chunk),  // SERVER-SIDE FILTER ✅
        orderBy('date', 'desc')
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Merge payments from all chunks
        snapshot.forEach((doc) => {
          const payment = { id: doc.id, ...doc.data() } as Payment
          // Avoid duplicates
          const exists = allPayments.find(p => p.id === payment.id)
          if (!exists) {
            allPayments.push(payment)
          }
        })
        setPayments([...allPayments])
        setLoading(false)
      })

      unsubscribes.push(unsubscribe)
    })

    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [parentId, studentIds.join(',')])

  return { payments, loading }
}
```

#### Fix 2: Update MyChildrenPage to Use New Hook

**File**: `pages/MyChildrenPage.tsx`

```typescript
// BEFORE (line 14):
const { payments, loading: paymentsLoading } = usePayments()
const myStudentIds = students.map(s => s.id)
const myPayments = payments.filter(p => myStudentIds.includes(p.studentId))

// AFTER:
const { payments: myPayments, loading: paymentsLoading } = usePaymentsByParent(user?.uid || '')
// No manual filtering needed! ✅
```

#### Fix 3: Update ParentDashboardPage

**File**: `pages/ParentDashboardPage.tsx`

```typescript
// BEFORE (line 14, 32-34):
const { payments, loading: paymentsLoading } = usePayments()
const myStudentIds = students.map(s => s.id)
const myPayments = payments.filter(p => myStudentIds.includes(p.studentId))

// AFTER:
const { payments: myPayments, loading: paymentsLoading } = usePaymentsByParent(user?.uid || '')
```

---

### Priority 2: MEDIUM (Do Soon)

#### Fix 4: Create useHomeworkByParent Hook

**File**: `hooks/useHomework.ts`

```typescript
/**
 * Hook to get homework for all children of a parent
 */
export function useHomeworkByParent(parentId: string) {
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)

  const { students } = useStudentsByParent(parentId)
  const studentIds = students.map(s => s.id)

  useEffect(() => {
    if (studentIds.length === 0) {
      setHomework([])
      setLoading(false)
      return
    }

    // Query homework for all children
    const chunks = []
    for (let i = 0; i < studentIds.length; i += 10) {
      chunks.push(studentIds.slice(i, i + 10))
    }

    const unsubscribes: (() => void)[] = []
    const allHomework: Homework[] = []

    chunks.forEach((chunk) => {
      const q = query(
        homeworkCollection,
        where('studentId', 'in', chunk),
        orderBy('dueDate', 'desc')
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.forEach((doc) => {
          const hw = { id: doc.id, ...doc.data() } as Homework
          const exists = allHomework.find(h => h.id === hw.id)
          if (!exists) {
            allHomework.push(hw)
          }
        })
        setHomework([...allHomework])
        setLoading(false)
      })

      unsubscribes.push(unsubscribe)
    })

    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [parentId, studentIds.join(',')])

  return { homework, loading }
}
```

---

## 🎯 IMPACT OF FIXES

| Metric | Before | After |
|--------|--------|-------|
| **Privacy** | ❌ Parents see ALL family data | ✅ Only own children |
| **Network Data** | ❌ 1000+ payments | ✅ 5-10 payments |
| **GDPR Compliance** | ❌ Data leakage | ✅ Compliant |
| **Code Duplication** | ❌ 3 copies of filter logic | ✅ Single hook |
| **Performance** | ❌ Slow (filter 1000 items) | ✅ Fast (query 10 items) |

---

## 📋 TESTING CHECKLIST

After implementing fixes:

### Parent Role Tests:
- [ ] Parent logs in → only sees their children's payments (not others)
- [ ] Parent opens DevTools → Network tab → payments query returns only their data
- [ ] Parent tries to access `/my-children/:otherId` → gets error (not their child)
- [ ] Multiple parents → each sees only their own data
- [ ] Parent with 0 children → sees empty state (not all data)
- [ ] Parent with 15 children → pagination works (Firestore 'in' operator handles >10)

### Performance Tests:
- [ ] Database: Check if queries use indexes (composite index for studentId + date)
- [ ] Network: Verify only relevant data is transferred
- [ ] Speed: Page loads in <2 seconds even with slow connection

---

*Generated: 2025-11-10*
*Priority: CRITICAL - Implement ASAP*
