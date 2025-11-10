# RBAC Analysis Report - Светлинки CRM System

**Analysis Date:** November 10, 2025
**Total Pages:** 18 pages
**Pages with Explicit Role Checks:** 3 pages
**Pages WITHOUT Role Checks:** 15 pages

---

## SECTION 1: AUTHENTICATION & AUTHORIZATION FRAMEWORK

### Role Definition (types/index.ts)
```
- Admin: Full access to all features
- Teacher: Can manage students, payments, events, attendance
- Parent: Can only see their own children, payments, and events
```

### Permission System (types/index.ts)
**Role Permissions Mapping:**
- **Admin:** 42 permissions (full access)
- **Teacher:** 8 permissions (view_dashboard, view_students, edit_students, view_payments, create_payments, view_events, create_events, edit_events, view_discounts, view_parents)
- **Parent:** 4 permissions (view_dashboard, view_students [own only], view_payments [own only], view_events)

### Authentication Hook (hooks/useAuth.ts)
```javascript
const isAdmin = userData?.role === 'admin'
const isTeacher = userData?.role === 'teacher' || userData?.role === 'admin'
const isParent = userData?.role === 'parent'
```
⚠️ **Issue Found:** `isTeacher` includes admin (true), but in permissions system, admin has separate entry. This creates inconsistency.

---

## SECTION 2: ROUTE-LEVEL ACCESS CONTROL

### App.tsx Route Configuration
```
LOGIN ROUTE:
✓ Redirects to "/" if already logged in

PROTECTED ROUTES (All require user to be logged in):
/ - Root dashboard
  - Shows ParentDashboardPage if isParent
  - Shows DashboardPage for teachers/admins
/my-children - Parent portal for viewing children
/my-children/:id - Parent portal for specific child details
/students - Student management
/payments - Payment tracking and management
/expenses - Expense management
/events - Event/class management
/attendance - Attendance tracking
/parents - Parent management
/inventory - Inventory management
/discounts - Discount management
/reports - Financial reports
/settings - System settings
/admin - Admin panel
/errors - Error dashboard
```

### Route Protection Assessment

🟢 **GOOD - Routes with Proper Protection:**
1. `/admin` - Has explicit `isAdmin(user.role)` check with Navigate redirect

🔴 **CRITICAL - Routes WITHOUT Role Checks:**
1. `/students` - No role check (accessible to parents!)
2. `/payments` - Has role-based filtering but no route-level protection
3. `/expenses` - No role check (accessible to parents!)
4. `/attendance` - No role check (accessible to parents!)
5. `/parents` - No role check (accessible to parents!)
6. `/inventory` - No role check (accessible to parents!)
7. `/discounts` - No role check (accessible to parents!)
8. `/reports` - No role check (accessible to parents!)
9. `/settings` - No role check (accessible to parents!)
10. `/errors` - No role check (accessible to parents!)

---

## SECTION 3: PAGE-BY-PAGE ACCESS CONTROL ANALYSIS

### 1. DashboardPage.tsx
**Role:** All users
**Current Protection:** None
**Issue:** Shows all students, payments, expenses data regardless of role
**Data Access:** 
- All active students (not filtered by parent)
- All payments (not filtered by parent)
- All expenses (not filtered by user)
- Today's events (all events)
**Missing:** Role-based dashboard (should show different data for parents vs teachers/admins)
**Recommendation:** Add role check, show teacher/admin dashboard only for non-parents

### 2. ParentDashboardPage.tsx
**Role:** Parents only (implicit)
**Current Protection:** Indirect - uses `useStudentsByParent(user?.uid)` hook
**Data Filtering:**
✓ Only shows parent's own children
✓ Only shows payments for parent's children
✓ Filters homework for parent's children
**Issue:** No explicit role check - relies on hook data filtering
**Recommendation:** Add explicit `if (!isParent)` check at top of component

### 3. StudentsPage.tsx
**Role:** Teachers/Admins only
**Current Protection:** NONE
**Data Access:** All students in system
**Issue:** Parents can directly navigate to /students and see all students
**Data Exposed:** Student names, groups, fees, status, study type, due dates
**Recommendation:** Add explicit role check at top of component

### 4. PaymentsPage.tsx
**Role:** All users
**Current Protection:** Partial
**Role-Based Filtering:**
✓ Parents: Only see payments for their own children (line 36: `if (isParent && !myChildrenIds.includes(payment.studentId)`)
- Teachers/Admins: See all payments
**Buttons Hidden:**
✓ "Add Payment" button hidden for parents (line 126)
✓ "Bulk Payment" button hidden for parents (line 126)
**Issue:** Parent can still navigate to page and see filtered data, but no UI button to add payments
**Data Exposure:** LOW (data is filtered properly)
**Recommendation:** Add explicit parent role check at top to only show payment stats for own children

### 5. EventsPage.tsx
**Role:** All users
**Current Protection:** Partial
**Role-Based UI:**
✓ Page title changes based on role (line 87)
✓ "Add Event" button hidden for parents (line 90)
✓ Edit/Delete buttons hidden for parents (line 298)
✓ Events visible to parents (read-only view)
**Issue:** Parents can access page and see all events (not filtered to their children)
**Data Exposure:** MEDIUM (parents see all events, not just for their children)
**Recommendation:** Filter events to only show those relevant to parent's children

### 6. AdminPanelPage.tsx
**Role:** Admins only
**Current Protection:** EXCELLENT
```javascript
if (!user || !isAdmin(user.role)) {
  return <Navigate to="/" replace />
}
```
**Status:** ✓ Properly protected
**Tabs:** Users, Settings, Audit, Export

### 7. SettingsPage.tsx
**Role:** Should be admins only
**Current Protection:** NONE
**Data Access:** System-wide settings (school name, email, phone, address, timezone, currency, language preferences)
**Issue:** Any logged-in user can access and modify system settings
**Severity:** CRITICAL
**Recommendation:** Add `if (!isAdmin)` check at top of component

### 8. ReportsPage.tsx
**Role:** Should be teachers/admins only
**Current Protection:** NONE
**Data Access:** All financial reports (revenues, expenses, monthly data)
**Issue:** Any logged-in user can access financial data
**Severity:** HIGH
**Recommendation:** Add role check for teachers/admins only

### 9. ErrorDashboardPage.tsx
**Role:** Should be teachers/admins only
**Current Protection:** NONE
**Data Access:** System error logs and data consistency issues
**Issue:** Any logged-in user can access error dashboard
**Severity:** MEDIUM
**Recommendation:** Add role check for teachers/admins only

### 10. ParentsPage.tsx
**Role:** Teachers/Admins only
**Current Protection:** NONE
**Data Access:** All parents and their children in system
**Data Exposed:** Names, phones, emails, addresses, student relationships, payment preferences
**Severity:** CRITICAL
**Issue:** Parents can navigate to /parents and see all other parents' contact information
**Buttons:**
- Add Parent (always visible)
- Edit Parent (always visible)
- Delete Parent (always visible)
- Upload Video (always visible)
**Recommendation:** Add explicit role check, hide all action buttons for non-teachers

### 11. InventoryPage.tsx
**Role:** Teachers/Admins only
**Current Protection:** NONE
**Data Access:** All inventory items, stock levels, prices
**Issue:** Parents can navigate to /inventory and see all inventory
**Buttons visible to all:** Add item, Edit, Delete, Add stock, Remove stock
**Severity:** HIGH
**Recommendation:** Add role check for teachers/admins only

### 12. AttendancePage.tsx
**Role:** Teachers/Admins only
**Current Protection:** NONE
**Data Access:** All student attendance records, can bulk mark attendance
**Issue:** Parents can navigate to /attendance and see/modify all student attendance
**Severity:** CRITICAL
**Buttons visible to all:** Save attendance changes, bulk mark all present/absent
**Recommendation:** Add role check for teachers/admins only

### 13. DiscountsPage.tsx
**Role:** Teachers/Admins only
**Current Protection:** NONE
**Data Access:** All discounts for all students
**Issue:** Parents can navigate to /discounts and see all student discounts
**Buttons visible to all:** Add, Edit, Delete discounts
**Severity:** HIGH
**Recommendation:** Add role check for teachers/admins only

### 14. ExpensesPage.tsx
**Role:** Teachers/Admins only
**Current Protection:** NONE
**Data Access:** All expense records and categories
**Issue:** Parents can navigate to /expenses and see all business expenses
**Buttons visible to all:** Add, Edit, Delete expenses
**Severity:** HIGH
**Recommendation:** Add role check for teachers/admins only

### 15. InvoicesPage.tsx
**Role:** Admins only
**Current Protection:** NONE
**Data Access:** All invoices and financial documents
**Issue:** Any user (including parents) can access and manage invoices
**Buttons visible to all:** Create, Edit, Delete, Mark paid, Print, Export
**Severity:** CRITICAL
**Recommendation:** Add role check for admins only

### 16. MyChildrenPage.tsx
**Role:** Parents only
**Current Protection:** Implicit (uses `useStudentsByParent(user?.uid)`)
**Data Filtering:** ✓ Only shows user's own children
**Issue:** No explicit role check - relies on hook filtering
**Validation:** Checks if student belongs to parent before showing details
**Recommendation:** Add explicit `if (!isParent)` check at top

### 17. MyChildDetailPage.tsx
**Role:** Parents only (implicit)
**Current Protection:** Implicit
**Data Validation:**
✓ Uses `useStudentsByParent(user?.uid)` to get parent's children
✓ Checks if student exists in parent's children (line 31)
✓ Shows error message if student not found or doesn't belong to parent
✓ Filters payments for this student only
✓ Filters homework for this student only
**Issue:** No explicit role check at top
**Recommendation:** Add explicit parent role check and refactor to use parent context

### 18. LoginPage.tsx
**Role:** Public
**Current Protection:** Redirects to "/" if already logged in
**Authentication Methods:**
- Email/Password
- Google OAuth
**Default Role:** New users get 'teacher' role by default
**Issue:** No admin approval for role assignment
**Recommendation:** Consider requiring admin approval for new accounts

---

## SECTION 4: DATA FILTERING ISSUES

### Parent Data Access
**Problem:** Data filtering is done at component/hook level, not at database level
**Risk:** If someone modifies the client code, they could access other parents' data

**Parent-Specific Data Filtering:**
1. Students - Uses `useStudentsByParent(parentId)` hook ✓
2. Payments - Filtered in PaymentsPage component ✓
3. Homework - Uses `useHomeworkByStudent` hook ✓
4. Events - NOT FILTERED (shows all events to parents) ✗

### Teachers vs Admins
**Problem:** No distinction between teacher and admin capabilities in most pages
**Current:** Teachers/Admins treated same in role checks
**Issue:** Teachers might need different data access than admins

---

## SECTION 5: ACTION BUTTON VISIBILITY

### Buttons Without Role Checks
**Critical Issues:**

| Page | Button | Issue | Visible To |
|------|--------|-------|-----------|
| ParentsPage | Add/Edit/Delete | No role check | All users |
| ParentsPage | Upload Video | No role check | All users |
| AttendancePage | Mark attendance | No role check | All users |
| AttendancePage | Bulk mark all | No role check | All users |
| InventoryPage | Add/Edit/Delete item | No role check | All users |
| InventoryPage | Add/Remove stock | No role check | All users |
| DiscountsPage | Add/Edit/Delete | No role check | All users |
| ExpensesPage | Add/Edit/Delete | No role check | All users |
| InvoicesPage | All actions | No role check | All users |

---

## SECTION 6: LAYOUT & NAVIGATION

### Layout.tsx Navigation Filtering
**Status:** ✓ Good
**Implementation:** Filters navigation menu based on user role

**Navigation by Role:**

**Parent Navigation:**
- Начало (Home/Dashboard)
- Моите деца (My Children)
- Плащания (Payments)
- Acontecimientos (Events)

**Teacher/Admin Navigation:**
- Dashboard
- Ученици (Students)
- Родители (Parents)
- Плащания (Payments)
- Разходи (Expenses)
- Склад (Inventory)
- Присъствия (Attendance)
- События (Events)
- Отстъпки (Discounts)
- Репорти (Reports)
- Настройки (Settings) [Admin only]
- ⚠️ Грешки (Errors) [Admin/Teacher]

**Issue:** Navigation is filtered, but direct URL navigation bypasses these filters!

---

## SECTION 7: IDENTIFIED PROBLEMS

### CRITICAL ISSUES (⚠️ Security Risk)

1. **AttendancePage - Parents can modify attendance**
   - Severity: CRITICAL
   - Impact: Parents can fraudulently mark attendance
   - Fix: Add admin/teacher-only role check

2. **InvoicesPage - Parents can create/modify invoices**
   - Severity: CRITICAL
   - Impact: Parents could create fraudulent invoices
   - Fix: Add admin-only role check

3. **SettingsPage - Any user can modify system settings**
   - Severity: CRITICAL
   - Impact: Parents could change system configuration
   - Fix: Add admin-only role check

4. **ParentsPage - Parents can see all parent contact info**
   - Severity: CRITICAL
   - Impact: Privacy breach of other families
   - Fix: Add teacher/admin role check

5. **Attendance & Inventory accessible to parents**
   - Severity: CRITICAL
   - Impact: Unauthorized data modification
   - Fix: Add role checks

### HIGH PRIORITY ISSUES (🔴 Should Fix Soon)

6. **DashboardPage shows all system data to parents**
   - All students, all payments, all expenses visible
   - Fix: Create role-specific dashboards

7. **ReportsPage accessible to all users**
   - Financial data exposed
   - Fix: Add admin/teacher check

8. **ErrorDashboardPage accessible to all users**
   - System error logs visible to parents
   - Fix: Add admin/teacher check

9. **ExpensesPage accessible to all users**
   - Business expenses visible to parents
   - Fix: Add teacher/admin check

10. **DiscountsPage accessible to all users**
    - All student discounts visible
    - Fix: Add teacher/admin check

11. **InventoryPage accessible to all users**
    - Stock levels and prices visible to parents
    - Fix: Add teacher/admin check

### MEDIUM PRIORITY ISSUES (🟡 Polish)

12. **EventsPage - Parents see all events**
    - Should only see events for their children
    - Not just hidden buttons, but filtered data
    - Fix: Filter events by parent's children

13. **No explicit role checks in parent-only pages**
    - Relies on hook filtering
    - Should have explicit guards
    - Fix: Add checks at top of MyChildrenPage, MyChildDetailPage

14. **Inconsistent isTeacher logic**
    - `isTeacher = teacher || admin` in hook
    - But admin is separate in permissions
    - Fix: Clarify teacher vs admin distinction

15. **Default role is 'teacher' for new users**
    - Should require admin approval
    - Fix: Set default to 'parent' or require explicit assignment

---

## SECTION 8: COMPONENT-LEVEL CHECKS

### Modal Components
All modals (StudentModal, PaymentModal, etc.) have NO role checks. They rely on parent component visibility.

**Risk:** If modal is opened directly, anyone could use it.

---

## SECTION 9: FIRESTORE SECURITY RULES

**Note:** No Firestore security rules were analyzed. Database-level RBAC may provide additional protection, but client-side validation is still necessary.

---

## SECTION 10: RECOMMENDATIONS FOR FIXES

### Priority 1: Immediate Security Fixes (Do First)

```typescript
// PATTERN TO ADD TO ALL PAGES

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function PageName() {
  const { userData } = useAuth()
  
  // Add appropriate check:
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }
  
  // Or for admin-only:
  if (userData?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  // Rest of component...
}
```

### Pages Needing Role Checks (In Order of Priority)

**CRITICAL - Add admin-only check:**
1. SettingsPage.tsx - `if (userData?.role !== 'admin')`
2. InvoicesPage.tsx - `if (userData?.role !== 'admin')`
3. AttendancePage.tsx - `if (userData?.role === 'parent')`
4. ParentsPage.tsx - `if (userData?.role === 'parent')`

**HIGH - Add teacher/admin check:**
5. ReportsPage.tsx - `if (userData?.role === 'parent')`
6. ErrorDashboardPage.tsx - `if (userData?.role === 'parent')`
7. ExpensesPage.tsx - `if (userData?.role === 'parent')`
8. DiscountsPage.tsx - `if (userData?.role === 'parent')`
9. InventoryPage.tsx - `if (userData?.role === 'parent')`
10. StudentsPage.tsx - `if (userData?.role === 'parent')`
11. DashboardPage.tsx - `if (userData?.role === 'parent')`

**MEDIUM - Improve data filtering:**
12. EventsPage.tsx - Add event filtering for parents (only show events for their children)
13. MyChildrenPage.tsx - Add explicit parent role check
14. MyChildDetailPage.tsx - Add explicit parent role check

### Priority 2: Data Filtering Improvements

**EventsPage.tsx Enhancement:**
```typescript
// Current: Shows all events to parents
// Should: Filter events to only show those relevant to parent's children

const parentStudentIds = isParent ? myChildren.map(s => s.id) : []
const filteredEvents = events.filter(event => {
  if (isParent && event.studentIds?.length > 0) {
    return event.studentIds.some(id => parentStudentIds.includes(id))
  }
  return true
})
```

### Priority 3: Code Quality Improvements

1. **Refactor useAuth to be more explicit:**
   ```typescript
   // Change from:
   const isTeacher = userData?.role === 'teacher' || userData?.role === 'admin'
   
   // To:
   const isTeacher = userData?.role === 'teacher'
   const canManageTeachers = userData?.role === 'admin'
   const hasTeacherPermissions = isTeacher || isAdmin
   ```

2. **Create a ProtectedRoute component:**
   ```typescript
   function ProtectedRoute({ component: Component, allowedRoles }) {
     const { userData } = useAuth()
     
     if (!allowedRoles.includes(userData?.role)) {
       return <Navigate to="/" replace />
     }
     
     return <Component />
   }
   ```

3. **Use Firestore security rules** for database-level protection

---

## SECTION 11: SUMMARY TABLE

| Page | Route | Role Check | Data Filtering | Issue Level |
|------|-------|------------|-----------------|-------------|
| DashboardPage | / | No | No | 🔴 HIGH |
| ParentDashboardPage | / | Implicit | Yes | 🟡 MEDIUM |
| StudentsPage | /students | No | No | 🔴 HIGH |
| PaymentsPage | /payments | Partial | Partial | 🟡 MEDIUM |
| EventsPage | /events | Partial | No | 🟡 MEDIUM |
| AttendancePage | /attendance | **NO** | No | 🔴 CRITICAL |
| ParentsPage | /parents | **NO** | No | 🔴 CRITICAL |
| InventoryPage | /inventory | No | No | 🔴 HIGH |
| DiscountsPage | /discounts | No | No | 🔴 HIGH |
| ExpensesPage | /expenses | No | No | 🔴 HIGH |
| InvoicesPage | /invoices | **NO** | No | 🔴 CRITICAL |
| ReportsPage | /reports | No | No | 🔴 HIGH |
| SettingsPage | /settings | **NO** | No | 🔴 CRITICAL |
| ErrorDashboardPage | /errors | No | No | 🟡 MEDIUM |
| AdminPanelPage | /admin | **YES** ✓ | Yes | ✓ GOOD |
| MyChildrenPage | /my-children | Implicit | Yes | 🟡 MEDIUM |
| MyChildDetailPage | /my-children/:id | Implicit | Yes | 🟡 MEDIUM |
| LoginPage | /login | N/A | N/A | ✓ GOOD |

---

## SECTION 12: ACTION ITEMS CHECKLIST

- [ ] Add admin-only role check to SettingsPage
- [ ] Add admin-only role check to InvoicesPage
- [ ] Add teacher/admin check to AttendancePage
- [ ] Add teacher/admin check to ParentsPage
- [ ] Add teacher/admin check to ReportsPage
- [ ] Add teacher/admin check to ErrorDashboardPage
- [ ] Add teacher/admin check to ExpensesPage
- [ ] Add teacher/admin check to DiscountsPage
- [ ] Add teacher/admin check to InventoryPage
- [ ] Add teacher/admin check to StudentsPage
- [ ] Add teacher/admin check to DashboardPage
- [ ] Filter EventsPage data for parents
- [ ] Add explicit role check to MyChildrenPage
- [ ] Add explicit role check to MyChildDetailPage
- [ ] Implement ProtectedRoute component
- [ ] Refactor useAuth for clarity
- [ ] Implement Firestore security rules
- [ ] Test each page with different roles
- [ ] Add integration tests for access control
- [ ] Document RBAC in code comments

