/**
 * Google Drive Integration for Svetlinki CRM
 *
 * Features:
 * - Automatic backups of Firestore data
 * - Export reports to Drive
 * - Archive old data
 *
 * Setup required:
 * 1. Enable Google Drive API in Firebase Console
 * 2. Add GOOGLE_DRIVE_API_KEY and GOOGLE_DRIVE_CLIENT_ID to .env
 */

import { gapi } from 'gapi-script'

const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']

// Google Drive configuration (will be set from .env)
const CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID || ''
const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || ''

let gapiInited = false
let gisInited = false

/**
 * Initialize Google Drive API
 */
export async function initGoogleDrive(): Promise<boolean> {
  if (!CLIENT_ID || !API_KEY) {
    console.warn('⚠️ Google Drive API credentials not configured')
    return false
  }

  try {
    await new Promise<void>((resolve) => {
      gapi.load('client:auth2', async () => {
        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES,
        })
        gapiInited = true
        resolve()
      })
    })

    console.log('✅ Google Drive API initialized')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize Google Drive:', error)
    return false
  }
}

/**
 * Sign in to Google Drive
 */
export async function signInToGoogleDrive(): Promise<boolean> {
  try {
    await gapi.auth2.getAuthInstance().signIn()
    return gapi.auth2.getAuthInstance().isSignedIn?.get()
  } catch (error) {
    console.error('❌ Failed to sign in to Google Drive:', error)
    return false
  }
}

/**
 * Sign out from Google Drive
 */
export async function signOutFromGoogleDrive(): Promise<void> {
  await gapi.auth2.getAuthInstance().signOut()
}

/**
 * Check if user is signed in to Google Drive
 */
export function isSignedInToGoogleDrive(): boolean {
  return gapi.auth2?.getAuthInstance()?.isSignedIn?.get() || false
}

/**
 * Create folder in Google Drive if it doesn't exist
 */
async function createFolderIfNotExists(folderName: string, parentId?: string): Promise<string> {
  // Search for existing folder
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${
    parentId ? ` and '${parentId}' in parents` : ''
  }`

  const response = await gapi.client.drive?.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  if (response?.result.files && response?.result.files?.length > 0) {
    return response?.result?.files[0].id!
  }

  // Create folder
  const folder = await gapi.client.drive?.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id',
  })

  return folder?.result.id!
}

/**
 * Get or create Svetlinki CRM folder structure
 */
async function getSvetlinkiFolders() {
  const rootFolder = await createFolderIfNotExists('Svetlinki-CRM')
  const backupsFolder = await createFolderIfNotExists('Backups', rootFolder)
  const reportsFolder = await createFolderIfNotExists('Reports', rootFolder)
  const archivesFolder = await createFolderIfNotExists('Archives', rootFolder)

  return {
    root: rootFolder,
    backups: backupsFolder,
    reports: reportsFolder,
    archives: archivesFolder,
  }
}

/**
 * Upload JSON backup to Google Drive
 */
export async function uploadBackupToDrive(data: any, filename: string): Promise<string | null> {
  try {
    if (!isSignedInToGoogleDrive()) {
      throw new Error('Not signed in to Google Drive')
    }

    const folders = await getSvetlinkiFolders()
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })

    const metadata = {
      name: filename,
      mimeType: 'application/json',
      parents: [folders?.backups],
    }

    const form = new FormData()
    form?.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form?.append('file', blob)

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
      },
      body: form,
    })

    const result = await response?.json()
    console.log('✅ Backup uploaded to Drive:', result?.id)
    return result?.id
  } catch (error) {
    console.error('❌ Failed to upload backup:', error)
    return null
  }
}

/**
 * Upload Excel report to Google Drive
 */
export async function uploadReportToDrive(blob: Blob, filename: string): Promise<string | null> {
  try {
    if (!isSignedInToGoogleDrive()) {
      throw new Error('Not signed in to Google Drive')
    }

    const folders = await getSvetlinkiFolders()

    const metadata = {
      name: filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      parents: [folders?.reports],
    }

    const form = new FormData()
    form?.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form?.append('file', blob)

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
      },
      body: form,
    })

    const result = await response?.json()
    console.log('✅ Report uploaded to Drive:', result?.id)
    return result?.id
  } catch (error) {
    console.error('❌ Failed to upload report:', error)
    return null
  }
}

/**
 * List recent backups from Google Drive
 */
export async function listBackupsFromDrive(): Promise<any[]> {
  try {
    if (!isSignedInToGoogleDrive()) {
      return []
    }

    const folders = await getSvetlinkiFolders()

    const response = await gapi.client.drive?.files.list({
      q: `'${folders?.backups}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime, size)',
      orderBy: 'createdTime desc',
      pageSize: 20,
    })

    return response?.result.files || []
  } catch (error) {
    console.error('❌ Failed to list backups:', error)
    return []
  }
}

/**
 * Download backup from Google Drive
 */
export async function downloadBackupFromDrive(fileId: string): Promise<any | null> {
  try {
    if (!isSignedInToGoogleDrive()) {
      throw new Error('Not signed in to Google Drive')
    }

    const response = await gapi.client.drive?.files.get({
      fileId: fileId,
      alt: 'media',
    })

    return JSON.parse(response?.body)
  } catch (error) {
    console.error('❌ Failed to download backup:', error)
    return null
  }
}
