# Student Data Migration Guide

## Overview

This migration script updates existing student records to match the new schema:

### Changes Applied

1. **studentCode** - Auto-generates unique 6-character code for students without one
2. **parentId → parentIds** - Converts single parent ID to array format
3. **dateOfBirth** - Ensures field exists (optional, can be undefined)

## Schema Changes

### Before (Old Schema)
```typescript
{
  id: string
  name: string
  parentId: string  // ❌ Single parent
  // ❌ No studentCode
  // ❌ No dateOfBirth
  ...
}
```

### After (New Schema)
```typescript
{
  id: string
  studentCode: string  // ✅ Auto-generated "K8M2B6"
  name: string
  parentIds: string[]  // ✅ Array of parent IDs
  dateOfBirth?: Date   // ✅ Optional field
  ...
}
```

## Usage

### Step 1: Dry Run (Recommended First!)

Test the migration without making changes:

```bash
cd firebase-crm
npm run migrate
```

This will:
- ✅ Analyze all students
- ✅ Show what changes will be made
- ❌ **NOT apply any changes**

### Step 2: Review Output

The script will show you:
- Total students found
- How many need migration
- Detailed changes for each student

Example output:
```
📊 Migration Summary:
   Total students: 150
   Students needing migration: 145
   Students already up-to-date: 5

📝 Detailed Changes:

1. Иван Петров (ID: abc123)
   ✨ Will add studentCode: K8M2B6
   🔄 Will convert parentId: "parent_xyz" → parentIds: ["parent_xyz"]
   📅 Will add dateOfBirth field (undefined)
```

### Step 3: Run Live Migration

Once you're satisfied with the dry run, apply the changes:

```bash
npm run migrate:live
```

⚠️ **IMPORTANT**: This will make actual changes to your database!

## Safety Features

1. **Dry Run by Default** - Never makes changes unless explicitly told
2. **Detailed Logging** - Shows exactly what will change before applying
3. **Batch Processing** - Handles large datasets efficiently (500 students/batch)
4. **Collision Prevention** - Ensures generated studentCodes are unique
5. **Preserves Old Data** - Keeps old `parentId` field for safety (can be removed manually later)

## Environment Setup

The migration script uses Firebase configuration from environment variables. Make sure your `.env` file contains:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## What to Do After Migration

1. ✅ Verify students in the app have studentCodes
2. ✅ Test QR code generation for existing students
3. ✅ Verify parentIds are correctly converted
4. ✅ Create new students and verify auto-generation works
5. ⚠️ (Optional) Remove old `parentId` field from Firestore manually after confirming everything works

## Troubleshooting

### "Migration failed: Permission denied"
- Ensure your Firebase credentials have write access
- Check Firestore security rules allow admin operations

### "No students to migrate"
- Verify you're connected to the correct Firebase project
- Check the students collection exists

### "DRY_RUN environment variable"
- Windows: Use `set DRY_RUN=false && npm run migrate`
- Mac/Linux: Use `DRY_RUN=false npm run migrate`
- Or just use: `npm run migrate:live`

## Rollback Plan

If something goes wrong:

1. The old `parentId` field is NOT deleted, only new `parentIds` is added
2. You can manually revert by removing the new fields
3. Consider backing up your Firestore database before migration

## Support

For issues or questions:
- Check this README first
- Review the migration script: `migrate-students.ts`
- Contact: Kristian (System Admin)
