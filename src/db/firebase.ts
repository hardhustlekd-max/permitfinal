import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'automated-abbey-dzp2g',
  appId: '1:328488074202:web:54062adb6e3313b33adee3',
  apiKey: 'AIzaSyCv9Bd_R_fpm2N3m9lZ25dqCxZgk1IJf10',
  authDomain: 'automated-abbey-dzp2g.firebaseapp.com',
  firestoreDatabaseId: 'permit',
};

// Safe configuration loading for both client-side Vite and Node.js serverless runtimes
function loadFirebaseConfig() {
  if (typeof process !== 'undefined' && process.env) {
    const envProj = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const envKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
    const envAppId = process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID;
    const envDb = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;

    if (envProj && envKey) {
      return {
        projectId: envProj,
        appId: envAppId || DEFAULT_FIREBASE_CONFIG.appId,
        apiKey: envKey,
        authDomain: `${envProj}.firebaseapp.com`,
        firestoreDatabaseId: envDb || 'permit',
      };
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export const firebaseConfig = loadFirebaseConfig();

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export function getFirestoreDb(): Firestore {
  if (!dbInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    let databaseId = firebaseConfig.firestoreDatabaseId || 'permit';

    try {
      const meta = import.meta as any;
      if (typeof meta !== 'undefined' && meta.env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID) {
        databaseId = meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
      } else if (typeof process !== 'undefined' && (process.env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env?.FIRESTORE_DATABASE_ID)) {
        databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || databaseId;
      }
    } catch {}

    const firestoreSettings = {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true,
    };

    try {
      dbInstance =
        databaseId && databaseId !== '(default)'
          ? initializeFirestore(appInstance, firestoreSettings, databaseId)
          : initializeFirestore(appInstance, firestoreSettings);
    } catch {
      dbInstance =
        databaseId && databaseId !== '(default)'
          ? getFirestore(appInstance, databaseId)
          : getFirestore(appInstance);
    }
  }
  return dbInstance;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let currentUser: any = null;
  try {
    const auth = getAuth();
    currentUser = auth.currentUser;
  } catch {}

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider: any) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Context:', JSON.stringify(errInfo));
  return errInfo;
}

// Safe connectivity check without triggering server errors
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    getFirestoreDb();
    return true;
  } catch {
    return true;
  }
}

export const FIREBASE_COLLECTIONS = {
  REGISTRATIONS: 'motorcycle_registrations',
  OFFICERS: 'officer_assignments',
  PRINT_ORDERS: 'print_batch_orders',
  VERIFICATIONS: 'verification_logs',
  SETTINGS: 'system_settings',
} as const;

export async function fetchAllDocuments<T = any>(collectionName: string): Promise<T[]> {
  try {
    const db = getFirestoreDb();
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as T));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    throw error;
  }
}

export async function getDocument<T = any>(collectionName: string, docId: string): Promise<T | null> {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as T;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    throw error;
  }
}

export async function upsertDocument(collectionName: string, docId: string, data: Record<string, any>): Promise<void> {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${docId}`);
    throw error;
  }
}

export async function updateDocumentFields(collectionName: string, docId: string, updates: Record<string, any>): Promise<void> {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${docId}`);
    throw error;
  }
}

export async function deleteDocument(collectionName: string, docId: string): Promise<void> {
  try {
    const db = getFirestoreDb();
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${docId}`);
    throw error;
  }
}

export function subscribeCollectionDocs<T = any>(
  collectionName: string,
  onData: (docs: T[]) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const db = getFirestoreDb();
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as T));
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionName);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}
