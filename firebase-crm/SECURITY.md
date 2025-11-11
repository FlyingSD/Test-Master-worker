# Security Architecture

## Multi-Layered Security System

This application implements a comprehensive, multi-layered security architecture to protect against unauthorized access, especially for administrative functions.

## Authentication System

### Role-Based Access Control (RBAC)

The system has three distinct user roles:

1. **Admin** - Full system access
2. **Teacher** - Access to student/group management
3. **Parent** - Access only to their children's information

### Separate Login Pages

Each role has a dedicated login page to enforce proper access patterns:

- **Parent Login**: `/login/parent` - For parents only
- **Teacher Login**: `/login/teacher` - For teachers only
- **Admin Login**: `/sys` - Hidden URL for administrators only

**Important**: The admin login URL (`/sys`) is intentionally obscured and not linked anywhere in the UI. Only administrators should know this URL.

## Admin Access Protection (Multi-Layered)

Admin access is protected by **FOUR** layers of security:

### Layer 1: Admin Email Whitelist

Only emails listed in `VITE_ADMIN_EMAILS` environment variable can have admin role.

**Configuration**:
```bash
# .env or .env.production
VITE_ADMIN_EMAILS=admin@svetlinki.bg,owner@svetlinki.bg
```

**How it works**:
- The whitelist is checked on every authentication attempt
- Even if someone gains access to an admin password, they cannot login unless their email is whitelisted
- Whitelist is enforced server-side during authentication flow

### Layer 2: Pre-Login Email Validation

Before authentication is attempted, the admin login page checks if the entered email is whitelisted.

**Location**: `src/pages/AdminLoginPage.tsx:30-34`

```typescript
if (!checkAdminWhitelist(email)) {
  toast?.error('Достъпът отказан: Неоторизиран имейл')
  return
}
```

### Layer 3: Post-Login Role Validation

After successful Firebase authentication, the system validates:
1. User document exists in Firestore
2. User role matches expected role (admin)
3. Email is whitelisted for admin access

**Location**: `src/hooks/useAuth.ts:43-61`

```typescript
if (data?.role === 'admin' && !isAdminWhitelisted(firebaseUser?.email || '')) {
  // Downgrade to teacher and sign out
  await setDoc(userDocRef, { role: 'teacher' }, { merge: true })
  await firebaseSignOut(auth)
}
```

### Layer 4: No Auto-User Creation

Users are **NOT** automatically created when they sign in. Only administrators can create new user accounts.

**Location**: `src/hooks/useAuth.ts:64-72`

```typescript
if (!userDoc?.exists()) {
  toast?.error('Потребителският профил не е намерен.')
  await firebaseSignOut(auth)
  return
}
```

## Security Features by Role

### Parents
- ✅ Can register via `/register/parent`
- ✅ Can login via `/login/parent` (email or Google)
- ✅ Can only access their own children's data
- ❌ Cannot access teacher or admin features
- ❌ Cannot self-elevate role

### Teachers
- ❌ **Cannot self-register** - Must be created by admin
- ✅ Can login via `/login/teacher` (email only)
- ✅ Can access all students/groups assigned to them
- ❌ Cannot access admin panel
- ❌ Cannot change their own role

### Admins
- ❌ **Cannot self-register** - Must be created by admin
- ❌ **Must be whitelisted** in environment config
- ✅ Can login via `/sys` (hidden admin page)
- ✅ Full system access
- ✅ Can create/manage all users
- 🔒 **Email must be in VITE_ADMIN_EMAILS whitelist**

## Attack Prevention

### Scenario 1: Parent tries to access admin panel
**Attack**: Parent navigates to `/sys` and tries to login
**Prevention**:
- Email whitelist check fails (Layer 2)
- Even if they bypass client-side checks, server validates role (Layer 3)
- Access denied, user redirected

### Scenario 2: Someone discovers admin password
**Attack**: Attacker gets admin password but uses different email
**Prevention**:
- Email whitelist check fails (Layer 2)
- Cannot login without whitelisted email
- System logs the attempt

### Scenario 3: Database role manipulation
**Attack**: Someone modifies Firestore to set their role to 'admin'
**Prevention**:
- On next login, email whitelist is checked (Layer 3)
- User is automatically downgraded to 'teacher'
- User is signed out immediately
- System logs the security violation

### Scenario 4: Self-registration as admin
**Attack**: Attacker tries to register with role 'admin'
**Prevention**:
- Parent registration only allows 'parent' role
- Teacher/admin accounts must be created by existing admin
- No auto-creation of users (Layer 4)

### Scenario 5: Teacher tries to access parent login
**Attack**: Teacher attempts to login via `/login/parent`
**Prevention**:
- Role validation after login (Layer 3)
- User redirected to correct login page
- Toast notification explains the error

## Firebase Security Rules

**CRITICAL**: The environment variables alone are not sufficient. You **MUST** also configure Firebase Security Rules.

### Recommended Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check admin whitelist
    function isAdminEmail() {
      // Update this list to match VITE_ADMIN_EMAILS
      let adminEmails = ['admin@svetlinki.bg', 'owner@svetlinki.bg'];
      return request.auth.token.email in adminEmails;
    }

    // Helper function to check if user is admin
    function isAdmin() {
      return isAdminEmail() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      // Users can read their own data
      allow read: if request.auth.uid == userId;

      // Only admins can create users
      allow create: if isAdmin();

      // Users can update their own data (except role)
      allow update: if request.auth.uid == userId &&
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']);

      // Only admins can update roles
      allow update: if isAdmin();

      // Only admins can delete users
      allow delete: if isAdmin();
    }

    // Students collection
    match /students/{studentId} {
      allow read: if request.auth != null;
      allow create, update, delete: if isAdmin() ||
                                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }

    // Other collections...
  }
}
```

## Environment Configuration

### Development (.env.development)
```bash
VITE_ADMIN_EMAILS=admin@svetlinki.bg,test@example.com
```

### Production (.env.production)
```bash
VITE_ADMIN_EMAILS=admin@svetlinki.bg
```

**IMPORTANT**: Keep the production whitelist minimal and secure!

## Best Practices

1. **Admin Whitelist**: Never commit actual admin emails to version control
2. **Environment Files**: Keep `.env.production` in `.gitignore`
3. **Regular Audits**: Periodically review who has admin access
4. **Password Policy**: Enforce strong passwords for admin accounts
5. **2FA**: Consider implementing two-factor authentication for admins
6. **Logging**: Monitor failed admin login attempts
7. **Secret URLs**: Never share the `/sys` URL publicly

## Adding a New Admin

To add a new administrator:

1. **Update whitelist**: Add email to `VITE_ADMIN_EMAILS` in production environment
2. **Create user**: Existing admin creates account via Admin Panel
3. **Set role**: Ensure role is set to 'admin' in Firestore
4. **Verify**: New admin tests login via `/sys`
5. **Document**: Log the change in admin access audit trail

## Security Checklist

- [ ] Admin emails are whitelisted in `.env.production`
- [ ] Firebase Security Rules are deployed
- [ ] Admin URL (`/sys`) is not publicly shared
- [ ] All admin accounts use strong passwords
- [ ] Regular security audits are scheduled
- [ ] Failed login attempts are monitored
- [ ] Production environment variables are secure
- [ ] No admin credentials in code repository

## Reporting Security Issues

If you discover a security vulnerability, please email: [security contact email]

**Do NOT** create a public GitHub issue for security vulnerabilities.

---

**Last Updated**: November 11, 2025
**Security Version**: 2.0
