import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
  VerificationLog,
} from '../types';
import { SystemSettings } from '../utils/storage';

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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'badge_authenticated_user',
    },
    operationType,
    path,
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const COLLECTIONS = {
  REGISTRATIONS: 'motorcycle_registrations',
  OFFICERS: 'officer_assignments',
  PRINT_ORDERS: 'print_batch_orders',
  VERIFICATIONS: 'verification_logs',
  SETTINGS: 'system_settings',
};

// --- MOTORCYCLE REGISTRATIONS ---
export function subscribeRegistrations(
  callback: (regs: MotorcycleRegistration[]) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.REGISTRATIONS);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      const regs: MotorcycleRegistration[] = snapshot.docs.map(
        (d) => ({ ...d.data(), id: d.id } as MotorcycleRegistration)
      );
      callback(regs);
    },
    (err) => {
      console.error('Error listening to motorcycle_registrations:', err);
    }
  );
}

export async function saveRegistrationToDb(reg: MotorcycleRegistration): Promise<void> {
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, reg.id);
  try {
    await setDoc(docRef, reg, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.REGISTRATIONS}/${reg.id}`);
  }
}

export async function updateRegistrationStatusInDb(
  id: string,
  status: MotorcycleRegistration['status'],
  rejectionReason?: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, id);
  const updates: Record<string, any> = { status };
  if (rejectionReason !== undefined) {
    updates.rejectionReason = rejectionReason;
  }
  try {
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.REGISTRATIONS}/${id}`);
  }
}

// --- OFFICER ASSIGNMENTS ---
export function subscribeOfficers(
  callback: (officers: OfficerAssignment[]) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.OFFICERS);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      const officers: OfficerAssignment[] = snapshot.docs.map(
        (d) => ({ ...d.data(), id: d.id } as OfficerAssignment)
      );
      callback(officers);
    },
    (err) => {
      console.error('Error listening to officer_assignments:', err);
    }
  );
}

export async function saveOfficerToDb(officer: OfficerAssignment): Promise<void> {
  const docRef = doc(db, COLLECTIONS.OFFICERS, officer.id);
  try {
    await setDoc(docRef, officer, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.OFFICERS}/${officer.id}`);
  }
}

export async function updateOfficerInDb(
  id: string,
  updates: Partial<OfficerAssignment>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.OFFICERS, id);
  try {
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.OFFICERS}/${id}`);
  }
}

// --- PRINT BATCH ORDERS ---
export function subscribePrintOrders(
  callback: (orders: PrintBatchOrder[]) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.PRINT_ORDERS);

  return onSnapshot(
    colRef,
    async (snapshot) => {
      const orders: PrintBatchOrder[] = snapshot.docs.map(
        (d) => ({ ...d.data(), id: d.id } as PrintBatchOrder)
      );
      callback(orders);
    },
    (err) => {
      console.error('Error listening to print_batch_orders:', err);
    }
  );
}

export async function savePrintOrderToDb(order: PrintBatchOrder): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PRINT_ORDERS, order.id);
  try {
    await setDoc(docRef, order, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.PRINT_ORDERS}/${order.id}`);
  }
}

export async function updatePrintOrderStatusInDb(
  id: string,
  status: PrintBatchOrder['status'],
  notes?: string
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.PRINT_ORDERS, id);
  const updates: Record<string, any> = { status };
  if (notes !== undefined) {
    updates.notes = notes;
  }
  try {
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.PRINT_ORDERS}/${id}`);
  }
}

// --- VERIFICATION LOGS ---
export function subscribeVerificationLogs(
  callback: (logs: VerificationLog[]) => void
): () => void {
  const colRef = collection(db, COLLECTIONS.VERIFICATIONS);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const logs: VerificationLog[] = snapshot.docs.map(
        (d) => ({ ...d.data(), id: d.id } as VerificationLog)
      );
      // Sort newest first
      logs.sort((a, b) => (b.scannedAt || '').localeCompare(a.scannedAt || ''));
      callback(logs);
    },
    (err) => {
      console.error('Error listening to verification_logs:', err);
    }
  );
}

export async function saveVerificationLogToDb(log: VerificationLog): Promise<void> {
  const docRef = doc(db, COLLECTIONS.VERIFICATIONS, log.id);
  try {
    await setDoc(docRef, log, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.VERIFICATIONS}/${log.id}`);
  }
}

// --- SYSTEM SETTINGS ---
const DEFAULT_SETTINGS: SystemSettings = {
  officerName: 'አበበ ደስታ (Abebe Desta)',
  department: 'የትራፊክ ማኔጅመንትና ህግ ማስከበሪያ (Traffic Mgmt & Enforcement)',
  subCityOffice: 'ኮልፌ ቀራኒዮ ክፍለ ከተማ (Kolfe Keraniyo)',
  defaultPrinter: 'Zebra ZD621 Industrial PVC Card Printer',
  cardStockType: 'CR80 Standard PVC Card (85.6 x 54 mm)',
  calendarSystem: 'ethiopian',
  autoPrintQR: true,
  emailAlerts: true,
  security2FA: true,
  highRiskAlerts: true,
};

export function subscribeSettings(
  callback: (settings: SystemSettings) => void
): () => void {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'global_config');

  return onSnapshot(
    docRef,
    async (snapshot) => {
      if (!snapshot.exists()) {
        try {
          await setDoc(docRef, DEFAULT_SETTINGS);
        } catch (error) {
          console.error('Error initializing system_settings:', error);
        }
        callback(DEFAULT_SETTINGS);
      } else {
        callback(snapshot.data() as SystemSettings);
      }
    },
    (err) => {
      console.error('Error listening to system_settings:', err);
    }
  );
}

export async function saveSettingsToDb(settings: SystemSettings): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'global_config');
  try {
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SETTINGS}/global_config`);
  }
}

export async function resetAllSystemData(): Promise<void> {
  const collectionsToClear = [
    COLLECTIONS.REGISTRATIONS,
    COLLECTIONS.PRINT_ORDERS,
    COLLECTIONS.VERIFICATIONS
  ];

  try {
    for (const colName of collectionsToClear) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      for (const d of snapshot.docs) {
        await deleteDoc(d.ref);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `all_system_data`);
  }
}
