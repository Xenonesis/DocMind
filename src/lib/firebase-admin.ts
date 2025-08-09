// Firebase Admin SDK imports - commented out as project uses Supabase
// import { App, getApps, initializeApp } from 'firebase-admin/app'
// import { cert } from 'firebase-admin/app'
// import { getStorage, Storage, Bucket } from 'firebase-admin/storage'

// Type definitions for compatibility
type App = any
type Storage = any
type Bucket = any

// Optional Firebase Admin initialization for server-side Storage/Firestore
// Uses service account credentials if provided via environment variables.

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

let adminApp: App | null = null
let adminStorage: Storage | null = null
let adminBucket: Bucket | null = null

try {
  if (projectId && clientEmail && rawPrivateKey) {
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n')

    adminApp = getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          storageBucket: storageBucketName,
        })
      : getApps()[0]!

    adminStorage = getStorage(adminApp)
    adminBucket = adminStorage.bucket()
  }
} catch (err) {
  // Fail soft: if admin cannot initialize, leave exports as null so callers can fallback
  // eslint-disable-next-line no-console
  console.warn('Firebase Admin not initialized. Falling back to local storage if implemented.', err)
  adminApp = null
  adminStorage = null
  adminBucket = null
}

export const isFirebaseAdminEnabled = !!adminApp
export { adminApp, adminStorage, adminBucket }


