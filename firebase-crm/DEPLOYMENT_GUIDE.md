# Svetlinki CRM - Deployment Guide

## 🎯 Overview

This guide outlines all steps needed to set up and deploy the Svetlinki CRM system, with emphasis on **areas requiring manual configuration**.

---

## ⚠️ REQUIRES YOUR MANUAL INTERVENTION

### 1. Firebase Configuration ⚠️
**Location:** `/src/lib/firebase.ts`

Replace with your Firebase project credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // ⚠️ CHANGE THIS
  authDomain: "YOUR_PROJECT.firebaseapp.com",  // ⚠️ CHANGE THIS
  projectId: "YOUR_PROJECT_ID",         // ⚠️ CHANGE THIS
  storageBucket: "YOUR_PROJECT.appspot.com",   // ⚠️ CHANGE THIS
  messagingSenderId: "YOUR_SENDER_ID",  // ⚠️ CHANGE THIS
  appId: "YOUR_APP_ID"                  // ⚠️ CHANGE THIS
}
```

**How to obtain:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing
3. Project Settings > Your apps > Web App
4. Copy configuration object

### 2. EmailJS Configuration ⚠️
**Location:** `/src/utils/emailService.ts` (line 3)

```typescript
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'      // ⚠️ CHANGE THIS
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'    // ⚠️ CHANGE THIS
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'      // ⚠️ CHANGE THIS
```

**How to obtain:**
1. Sign up at [EmailJS.com](https://www.emailjs.com/)
2. Create Email Service (Gmail/Outlook/etc)
3. Create Email Templates
4. Copy Service ID, Template ID, Public Key

**Template Variables to use:**
- `{{to_name}}` - Recipient name
- `{{student_name}}` - Student name
- `{{amount}}` - Payment amount
- `{{due_date}}` - Due date
- `{{message}}` - Custom message
- `{{invoice_number}}` - Invoice number

### 3. Firebase Firestore Setup ⚠️

1. Go to Firebase Console > Firestore Database
2. Click "Create Database"
3. Select Production mode
4. Choose region (Europe-West recommended for Bulgaria)

**Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Firebase Authentication Setup ⚠️

1. Go to Firebase Console > Authentication
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Create admin user account

### 5. SMS Service (Currently Placeholder) ⚠️
**Location:** `/src/utils/smsService.ts`

**To Enable:**
1. Sign up at [Twilio.com](https://www.twilio.com/) or alternative
2. Get credentials (Account SID, Auth Token, Phone Number)
3. Replace placeholder implementation in `smsService.ts`

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Steps
```bash
cd firebase-crm
npm install
npm run dev        # Development
npm run build      # Production build
npm run preview    # Preview build
```

---

## 🚀 Deployment

### Option 1: Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy --only hosting
```

### Option 2: Vercel
1. Import Git repository at [Vercel.com](https://vercel.com/)
2. Build: `npm run build`
3. Output: `dist`
4. Add environment variables
5. Deploy

### Option 3: Netlify
1. Connect repository at [Netlify.com](https://www.netlify.com/)
2. Build: `npm run build`
3. Publish: `dist`

---

## 📊 Firestore Collections Structure

### students
```javascript
{
  name: string,
  group: string,
  studyType: 'Абакус' | 'Ментална аритметика' | 'Скоростно четене',
  fee: number,
  feeEUR: number,
  dueDate: Timestamp,
  status: 'active' | 'inactive',
  parentId: string,
  notes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### payments
```javascript
{
  studentId: string,
  studentName: string,
  amount: number,
  amountEUR: number,
  date: Timestamp,
  method: 'Кеш' | 'ПОС' | 'Банков път' | 'Фактура',
  article: string,
  notes: string,
  documentNumber: string,
  createdAt: Timestamp
}
```

### expenses
```javascript
{
  date: Timestamp,
  category: string,
  description: string,
  amount: number,
  receiptNumber: string,
  notes: string,
  createdAt: Timestamp
}
```

### parents
```javascript
{
  name: string,
  phone: string,
  email: string,
  address: string,
  notes: string,
  createdAt: Timestamp
}
```

### invoices
```javascript
{
  invoiceNumber: string,
  type: 'Фактура' | 'Проформа',
  issueDate: Timestamp,
  dueDate: Timestamp,
  clientName: string,
  clientAddress: string,
  clientEIK: string,
  items: Array<{
    description: string,
    quantity: number,
    unitPrice: number,
    total: number
  }>,
  subtotal: number,
  vatRate: number,
  vatAmount: number,
  total: number,
  notes: string,
  status: 'draft' | 'sent' | 'paid',
  createdAt: Timestamp
}
```

### attendance
```javascript
{
  studentId: string,
  studentName: string,
  date: Timestamp,
  status: 'present' | 'absent' | 'late',
  notes: string,
  createdAt: Timestamp
}
```

### settings
```javascript
{
  schoolName: string,
  address: string,
  phone: string,
  email: string,
  website: string,
  eik: string,
  currency: 'BGN' | 'EUR',
  language: 'bg' | 'en',
  timezone: string,
  emailNotifications: boolean,
  smsNotifications: boolean,
  theme: 'light' | 'dark'
}
```

---

## ✅ Pre-Launch Checklist

- [ ] Firebase configuration updated
- [ ] Firestore database created
- [ ] Firestore security rules configured
- [ ] Firebase Authentication enabled
- [ ] EmailJS configured
- [ ] Email templates created
- [ ] Tested email functionality
- [ ] SMS service configured (if needed)
- [ ] Build completes without errors: `npm run build`
- [ ] All pages load in production build
- [ ] Forms submit successfully
- [ ] PDF generation works
- [ ] Excel export works
- [ ] CSV import works
- [ ] Charts display correctly
- [ ] Mobile responsiveness tested
- [ ] Cross-browser tested (Chrome, Firefox, Safari)

---

## 🐛 Troubleshooting

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Firebase Connection Issues
- Verify configuration in `/src/lib/firebase.ts`
- Check Firestore rules
- Ensure Firestore is enabled

### Email Not Sending
- Verify EmailJS credentials
- Check quota limits (free: 200/month)
- Ensure template is published

### Charts Not Displaying
- Ensure Chart.js installed
- Check if data exists in Firestore
- Verify container has dimensions

### CSV Import Fails
- Use template CSV format
- Check date format: YYYY-MM-DD
- Verify required fields filled

---

## 📱 Features Implemented

### Week 1 - Must-Have
- ✅ Expenses management
- ✅ Settings page
- ✅ Attendance tracking
- ✅ Invoice generation

### Week 2 - Advanced
- ✅ Dashboard charts
- ✅ Excel export (all pages)
- ✅ PDF generation (invoices)
- ✅ Email integration
- ⚠️ SMS (placeholder only)

### Week 3 - Bulk & Performance
- ✅ CSV import (students)
- ✅ Bulk payments
- ✅ Pagination (20 items/page)
- ✅ Date range filters (Payments & Expenses)
- ✅ Animations & transitions
- ✅ Mobile responsiveness

### Core Features
- ✅ Students management
- ✅ Parents management
- ✅ Payments tracking
- ✅ Dashboard with real-time stats
- ✅ Inventory management

---

## 🔐 Security Best Practices

1. Never commit `.env` to Git
2. Implement Firebase Authentication
3. Configure Firestore security rules
4. Use environment variables for sensitive data
5. Always deploy production builds

---

## 📞 Maintenance

### Monthly
- Check Firebase quotas
- Review EmailJS usage
- Backup Firestore data
- Update dependencies

### Quarterly
- Review security rules
- Test all features
- Check vulnerabilities: `npm audit`

---

## 📚 Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [EmailJS Docs](https://www.emailjs.com/docs/)
- [Chart.js Docs](https://www.chartjs.org/docs/)

---

## 🎉 Ready to Launch!

Complete all ⚠️ items and your Svetlinki CRM is production-ready!
