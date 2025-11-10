# RBAC Quick Reference Guide

## Pages Overview

### All 18 Pages Status

| # | Page | Route | File | Role Protection | Data Filter | Status | Fix Priority |
|---|------|-------|------|-----------------|-------------|--------|--------------|
| 1 | Login | /login | LoginPage.tsx | ✓ Good | N/A | ✓ Secure | - |
| 2 | Dashboard | / | DashboardPage.tsx | ❌ None | No | 🔴 CRITICAL | 1-2 weeks |
| 3 | Parent Dashboard | / | ParentDashboardPage.tsx | ⚠️ Implicit | Yes | 🟡 Needs explicit check | 2-3 weeks |
| 4 | Students | /students | StudentsPage.tsx | ❌ None | No | 🔴 CRITICAL | 1-2 weeks |
| 5 | Payments | /payments | PaymentsPage.tsx | ⚠️ Partial | Partial | 🟡 Medium | 2-3 weeks |
| 6 | Events | /events | EventsPage.tsx | ⚠️ Partial | No | 🟡 Medium | 2-3 weeks |
| 7 | Attendance | /attendance | AttendancePage.tsx | ❌ NONE | No | 🔴 CRITICAL | **WEEK 1** |
| 8 | Parents | /parents | ParentsPage.tsx | ❌ NONE | No | 🔴 CRITICAL | **WEEK 1** |
| 9 | Inventory | /inventory | InventoryPage.tsx | ❌ None | No | 🔴 CRITICAL | 1-2 weeks |
| 10 | Discounts | /discounts | DiscountsPage.tsx | ❌ None | No | 🔴 HIGH | 2-3 weeks |
| 11 | Expenses | /expenses | ExpensesPage.tsx | ❌ None | No | 🔴 HIGH | 2-3 weeks |
| 12 | Invoices | /invoices | InvoicesPage.tsx | ❌ NONE | No | 🔴 CRITICAL | **WEEK 1** |
| 13 | Reports | /reports | ReportsPage.tsx | ❌ None | No | 🔴 HIGH | 2-3 weeks |
| 14 | Settings | /settings | SettingsPage.tsx | ❌ NONE | No | 🔴 CRITICAL | **WEEK 1** |
| 15 | Admin Panel | /admin | AdminPanelPage.tsx | ✓ Good | Yes | ✓ Secure | - |
| 16 | Error Dashboard | /errors | ErrorDashboardPage.tsx | ❌ None | No | 🟡 MEDIUM | 2-3 weeks |
| 17 | My Children | /my-children | MyChildrenPage.tsx | ⚠️ Implicit | Yes | 🟡 Needs explicit check | 3-4 weeks |
| 18 | Child Details | /my-children/:id | MyChildDetailPage.tsx | ⚠️ Implicit | Yes | 🟡 Needs explicit check | 3-4 weeks |

## Week 1 (CRITICAL) - 4 Pages

These must be fixed immediately - they allow data manipulation:

1. **AttendancePage.tsx** - Parents can fraudulently mark attendance
2. **InvoicesPage.tsx** - Parents can create fraudulent invoices
3. **ParentsPage.tsx** - Parents can see all family contact information
4. **SettingsPage.tsx** - Parents can modify system configuration

### Code to Add (Week 1)

```typescript
// AttendancePage.tsx - Line 18 after function declaration
import { Navigate } from 'react-router-dom'

export default function AttendancePage() {
  const { students } = useStudents()
  const { userData } = useAuth() // Add this line
  
  // Add this check right after line 18
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }
  
  // ... rest of component
}
```

Repeat pattern for:
- InvoicesPage.tsx: `if (userData?.role !== 'admin')`
- ParentsPage.tsx: `if (userData?.role === 'parent')`
- SettingsPage.tsx: `if (userData?.role !== 'admin')`

## Week 2-3 (HIGH) - 7 Pages

Pages that expose sensitive data:

- DashboardPage.tsx
- StudentsPage.tsx
- ExpensesPage.tsx
- DiscountsPage.tsx
- InventoryPage.tsx
- ReportsPage.tsx
- ErrorDashboardPage.tsx

**Code Pattern:** Add `if (userData?.role === 'parent') return <Navigate to="/" />`

## Week 3-4 (MEDIUM) - 4 Pages

Pages needing improvement:

- EventsPage.tsx - Add data filtering for parents
- PaymentsPage.tsx - Refine filtering
- MyChildrenPage.tsx - Add explicit role check
- MyChildDetailPage.tsx - Add explicit role check

## Role Definitions

```javascript
// From hooks/useAuth.ts
const isAdmin = userData?.role === 'admin'
const isTeacher = userData?.role === 'teacher' || userData?.role === 'admin'
const isParent = userData?.role === 'parent'

// Roles allowed per page:
Teacher/Admin pages: StudentsPage, ParentsPage, AttendancePage, InventoryPage, 
                     DiscountsPage, ExpensesPage, ReportsPage, ErrorDashboardPage
Admin-only pages: SettingsPage, InvoicesPage
Parent-only pages: MyChildrenPage, MyChildDetailPage
All users: EventsPage, PaymentsPage, DashboardPage
```

## Quick Fix Template

For each page, add at the top of component after const declarations:

```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function PageName() {
  const { userData } = useAuth()
  
  // Add 1-2 lines based on page purpose:
  // Option 1: Block parents from teacher pages
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }
  
  // Option 2: Only allow admins
  if (userData?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  // Option 3: Block specific role
  if (userData?.role === 'parent') {
    return <Navigate to="/" replace />
  }
  
  // Rest of component unchanged...
}
```

## Testing Checklist

After fixing each page, test with:
1. Parent account - should be redirected for blocked pages
2. Teacher account - should have access to allowed pages
3. Admin account - should have access to all pages

## Files to Modify

Main directory: `/home/user/Test-Master-worker/firebase-crm/src/pages/`

Week 1 fixes:
- [ ] AttendancePage.tsx
- [ ] InvoicesPage.tsx
- [ ] ParentsPage.tsx
- [ ] SettingsPage.tsx

Week 2-3 fixes:
- [ ] DashboardPage.tsx
- [ ] StudentsPage.tsx
- [ ] ExpensesPage.tsx
- [ ] DiscountsPage.tsx
- [ ] InventoryPage.tsx
- [ ] ReportsPage.tsx
- [ ] ErrorDashboardPage.tsx

Week 3-4 improvements:
- [ ] EventsPage.tsx (add data filtering)
- [ ] PaymentsPage.tsx (improve filtering)
- [ ] MyChildrenPage.tsx (add explicit check)
- [ ] MyChildDetailPage.tsx (add explicit check)

## Configuration Files Referenced

- `/home/user/Test-Master-worker/firebase-crm/src/App.tsx` - Route definitions
- `/home/user/Test-Master-worker/firebase-crm/src/components/Layout.tsx` - Navigation filtering
- `/home/user/Test-Master-worker/firebase-crm/src/hooks/useAuth.ts` - Auth logic
- `/home/user/Test-Master-worker/firebase-crm/src/types/index.ts` - Permission definitions

## Key Findings Summary

- **Total vulnerability points:** 14+ pages without proper role checks
- **Critical data exposed:** Attendance, Invoices, Parent contact info, System settings
- **Root cause:** Reliance on navigation filtering instead of route-level protection
- **Solution:** Add role checks to each page component + implement Firestore security rules

## Follow-up Tasks

After fixing pages:
1. Create reusable ProtectedRoute component
2. Implement Firestore security rules
3. Add integration tests for RBAC
4. Review and test with different user roles
5. Document security requirements
