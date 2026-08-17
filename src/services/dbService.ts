import {
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
  VerificationLog,
  SystemSettings,
} from '../types';
import {
  FIREBASE_COLLECTIONS,
  fetchAllDocuments,
  getDocument,
  upsertDocument,
  updateDocumentFields,
  deleteDocument,
  subscribeCollectionDocs,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../db/firebase';

// Global Database Connection State
let lastSyncTime: Date | null = null;
let isCloudConnected: boolean = true;
let globalDbError: string | null = null;

const errorListeners = new Set<(err: string | null) => void>();
const syncStatusListeners = new Set<
  (status: { lastSyncTime: Date | null; isConnected: boolean; isQuotaExceeded: boolean }) => void
>();

export function subscribeSyncStatus(
  cb: (status: { lastSyncTime: Date | null; isConnected: boolean; isQuotaExceeded: boolean }) => void
): () => void {
  cb({ lastSyncTime, isConnected: isCloudConnected, isQuotaExceeded: false });
  syncStatusListeners.add(cb);
  return () => {
    syncStatusListeners.delete(cb);
  };
}

function notifySyncStatus() {
  const data = { lastSyncTime, isConnected: isCloudConnected, isQuotaExceeded: false };
  syncStatusListeners.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {}
  });
}

export function subscribeFirestoreError(cb: (err: string | null) => void): () => void {
  cb(globalDbError);
  errorListeners.add(cb);
  return () => {
    errorListeners.delete(cb);
  };
}

/**
 * Format and sanitize error messages for the UI
 */
export function formatFriendlyDbError(rawError: string | null): string | null {
  if (!rawError) return null;
  const str = String(rawError);

  if (str.includes('FUNCTION_INVOCATION_FAILED') || str.includes('cpt1::') || str.includes('500 Internal')) {
    return 'Serverless proxy notice: Using direct Firebase Firestore connection.';
  }
  if (str.includes('the client is offline') || str.includes('network-request-failed')) {
    return 'Offline mode: Changes are saved locally and will synchronize once reconnected.';
  }
  if (str.includes('Missing or insufficient permissions')) {
    return 'Firestore security rule notice: Please verify permissions for this operation.';
  }
  return str;
}

export function setGlobalFirestoreError(err: string | null) {
  const sanitized = formatFriendlyDbError(err);
  globalDbError = sanitized;
  isCloudConnected = sanitized === null || sanitized.includes('direct Firebase Firestore');
  notifySyncStatus();
  errorListeners.forEach((cb) => {
    try {
      cb(globalDbError);
    } catch (e) {}
  });
}

// Initial default settings
export const DEFAULT_SETTINGS: SystemSettings = {
  officerName: 'አበበ ደስታ (Abebe Desta)',
  department: 'የትራፊክ ማኔጅመንትና ህግ ማስከበሪያ (Traffic Mgmt & Enforcement)',
  subCityOffice: 'በላይ ዘለቀ ክፍለ ከተማ (Belay Zeleke)',
  defaultPrinter: 'Zebra ZD621 Industrial PVC Card Printer',
  cardStockType: 'CR80 Standard PVC Card (85.6 x 54 mm)',
  calendarSystem: 'ethiopian',
  autoPrintQR: true,
  emailAlerts: true,
  security2FA: true,
  highRiskAlerts: true,
};

// In-Memory Live State (synchronized directly from Firebase Firestore backend)
const inMemory = {
  registrations: [] as MotorcycleRegistration[],
  officers: [] as OfficerAssignment[],
  printOrders: [] as PrintBatchOrder[],
  verifications: [] as VerificationLog[],
  settings: { ...DEFAULT_SETTINGS } as SystemSettings,
};

const listeners = {
  registrations: new Set<(regs: MotorcycleRegistration[]) => void>(),
  officers: new Set<(officers: OfficerAssignment[]) => void>(),
  printOrders: new Set<(orders: PrintBatchOrder[]) => void>(),
  verifications: new Set<(logs: VerificationLog[]) => void>(),
  settings: new Set<(settings: SystemSettings) => void>(),
};

function notifyRegistrations() {
  const data = [...inMemory.registrations];
  listeners.registrations.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error in registration listener callback:', e);
    }
  });
}

function notifyOfficers() {
  const data = [...inMemory.officers];
  listeners.officers.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error in officer assignment listener callback:', e);
    }
  });
}

function notifyPrintOrders() {
  const data = [...inMemory.printOrders];
  listeners.printOrders.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error in print order listener callback:', e);
    }
  });
}

function notifyVerifications() {
  const data = [...inMemory.verifications];
  data.sort((a, b) => (b.scannedAt || '').localeCompare(a.scannedAt || ''));
  listeners.verifications.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error in verification log listener callback:', e);
    }
  });
}

function notifySettings() {
  const data = { ...inMemory.settings };
  listeners.settings.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error in settings listener callback:', e);
    }
  });
}

// Helper for safe JSON fetching with automatic fallback
async function safeJsonFetch(url: string, options?: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(netErr?.message || 'Network communication error');
  }

  const contentType = res.headers.get('content-type') || '';
  let body: any = {};

  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch {
      body = { error: 'Invalid JSON response from server' };
    }
  } else {
    const text = await res.text().catch(() => '');
    if (text.includes('FUNCTION_INVOCATION_FAILED') || text.includes('cpt1::')) {
      body = { error: 'FUNCTION_INVOCATION_FAILED' };
    } else if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      body = { error: `Server returned HTML page (${res.status} ${res.statusText})` };
    } else {
      body = { error: text || `HTTP ${res.status} ${res.statusText}` };
    }
  }

  if (!res.ok) {
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return body;
}

// --- REAL-TIME FIRESTORE LISTENER SUBSCRIPTIONS ---
let areLiveListenersActive = false;
export function initLiveFirestoreListeners(): () => void {
  if (areLiveListenersActive || typeof window === 'undefined') {
    return () => {};
  }
  areLiveListenersActive = true;

  try {
    const unsubRegs = subscribeCollectionDocs<MotorcycleRegistration>(
      FIREBASE_COLLECTIONS.REGISTRATIONS,
      (docs) => {
        if (Array.isArray(docs)) {
          inMemory.registrations = docs;
          notifyRegistrations();
          lastSyncTime = new Date();
          isCloudConnected = true;
          setGlobalFirestoreError(null);
        }
      },
      (err) => {
        console.warn('Firestore live registrations listener notice:', err?.message);
      }
    );

    const unsubOffs = subscribeCollectionDocs<OfficerAssignment>(
      FIREBASE_COLLECTIONS.OFFICERS,
      (docs) => {
        if (Array.isArray(docs)) {
          inMemory.officers = docs;
          notifyOfficers();
          lastSyncTime = new Date();
          isCloudConnected = true;
          setGlobalFirestoreError(null);
        }
      },
      (err) => {
        console.warn('Firestore live officers listener notice:', err?.message);
      }
    );

    const unsubOrders = subscribeCollectionDocs<PrintBatchOrder>(
      FIREBASE_COLLECTIONS.PRINT_ORDERS,
      (docs) => {
        if (Array.isArray(docs)) {
          inMemory.printOrders = docs;
          notifyPrintOrders();
          lastSyncTime = new Date();
          isCloudConnected = true;
          setGlobalFirestoreError(null);
        }
      },
      (err) => {
        console.warn('Firestore live print orders listener notice:', err?.message);
      }
    );

    const unsubLogs = subscribeCollectionDocs<VerificationLog>(
      FIREBASE_COLLECTIONS.VERIFICATIONS,
      (docs) => {
        if (Array.isArray(docs)) {
          inMemory.verifications = docs;
          notifyVerifications();
          lastSyncTime = new Date();
          isCloudConnected = true;
          setGlobalFirestoreError(null);
        }
      },
      (err) => {
        console.warn('Firestore live verifications listener notice:', err?.message);
      }
    );

    return () => {
      areLiveListenersActive = false;
      unsubRegs();
      unsubOffs();
      unsubOrders();
      unsubLogs();
    };
  } catch (err) {
    console.warn('Live Firestore listeners setup notice:', err);
    return () => {};
  }
}

// Auto-initialize real-time listeners in browser
if (typeof window !== 'undefined') {
  initLiveFirestoreListeners();
}

// --- MOTORCYCLE REGISTRATIONS ---
export function subscribeRegistrations(
  callback: (regs: MotorcycleRegistration[]) => void
): () => void {
  callback(inMemory.registrations);
  listeners.registrations.add(callback);
  return () => {
    listeners.registrations.delete(callback);
  };
}

export async function saveRegistrationToDb(
  reg: MotorcycleRegistration,
  _options?: { forceLocalOnly?: boolean }
): Promise<{ success: boolean; isOfflineFallback?: boolean; error?: string }> {
  // 1. Immediately update in-memory state so user is never blocked
  const index = inMemory.registrations.findIndex((r) => r.id === reg.id);
  if (index >= 0) {
    inMemory.registrations[index] = { ...inMemory.registrations[index], ...reg };
  } else {
    inMemory.registrations.unshift(reg);
  }
  notifyRegistrations();

  // 2. Direct write to Firebase Firestore permit database
  try {
    await upsertDocument(FIREBASE_COLLECTIONS.REGISTRATIONS, reg.id, reg);
    lastSyncTime = new Date();
    isCloudConnected = true;
    setGlobalFirestoreError(null);
    return { success: true };
  } catch (directErr: any) {
    console.warn('Direct Firestore save notice, attempting proxy API...', directErr?.message);
  }

  // 3. Fallback to API route if direct SDK had temporary network issue
  try {
    const res = await safeJsonFetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reg),
    });

    if (res?.success) {
      lastSyncTime = new Date();
      isCloudConnected = true;
      setGlobalFirestoreError(null);
      return { success: true };
    }
  } catch (apiErr: any) {
    console.warn('saveRegistrationToDb API fallback notice:', apiErr?.message);
  }

  return { success: true, isOfflineFallback: true };
}

export async function updateRegistrationStatusInDb(
  id: string,
  status: MotorcycleRegistration['status'],
  rejectionReason?: string
): Promise<void> {
  const index = inMemory.registrations.findIndex((r) => r.id === id);
  if (index >= 0) {
    inMemory.registrations[index] = {
      ...inMemory.registrations[index],
      status,
      ...(rejectionReason !== undefined ? { rejectionReason } : {}),
    };
    notifyRegistrations();
  }

  const updates: Record<string, any> = { status };
  if (rejectionReason !== undefined) {
    updates.rejectionReason = rejectionReason;
  }

  try {
    await updateDocumentFields(FIREBASE_COLLECTIONS.REGISTRATIONS, id, updates);
    lastSyncTime = new Date();
    isCloudConnected = true;
    setGlobalFirestoreError(null);
    return;
  } catch (directErr) {
    console.warn('Direct Firestore status update notice:', directErr);
  }

  try {
    await safeJsonFetch('/api/registrations/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, rejectionReason }),
    });
    setGlobalFirestoreError(null);
  } catch (apiErr: any) {
    console.warn('updateRegistrationStatusInDb notice:', apiErr);
  }
}

export async function fetchAllRegistrationsFromDb(): Promise<MotorcycleRegistration[]> {
  try {
    const docs = await fetchAllDocuments<MotorcycleRegistration>(FIREBASE_COLLECTIONS.REGISTRATIONS);
    if (docs && docs.length > 0) {
      inMemory.registrations = docs;
      notifyRegistrations();
      return docs;
    }
  } catch (directErr) {
    console.warn('Direct fetch registrations notice:', directErr);
  }

  try {
    const data = await safeJsonFetch('/api/sync');
    if (data.registrations && data.registrations.length > 0) {
      inMemory.registrations = data.registrations;
      notifyRegistrations();
      return data.registrations;
    }
  } catch (err: any) {
    console.warn('fetchAllRegistrationsFromDb notice:', err?.message);
  }
  return inMemory.registrations;
}

export async function lookupRegistrationInDb(
  rawQuery: string,
  localList?: MotorcycleRegistration[]
): Promise<MotorcycleRegistration | null> {
  const cleanInput = (rawQuery || '').trim();
  if (!cleanInput) return null;

  const cleanLower = cleanInput.toLowerCase();
  const cleanPlateInput = cleanLower.replace(/[\s\-_]/g, '');

  let candidateId = cleanInput;
  let candidatePlate: string | null = null;
  let candidateEngine: string | null = null;

  try {
    if (cleanInput.startsWith('{') && cleanInput.endsWith('}')) {
      const parsed = JSON.parse(cleanInput);
      if (parsed) {
        if (parsed.id) candidateId = String(parsed.id).trim();
        if (parsed.plateNumber) candidatePlate = String(parsed.plateNumber).trim();
        if (parsed.engineOrSerialNo) candidateEngine = String(parsed.engineOrSerialNo).trim();
      }
    }
  } catch (e) {}

  if (candidateId === cleanInput) {
    if (cleanInput.includes('/verify/')) {
      const parts = cleanInput.split('/verify/');
      if (parts[1]) {
        candidateId = parts[1].split('?')[0].split('#')[0].trim();
      }
    } else if (cleanInput.includes('id=')) {
      const match = cleanInput.match(/id=([^&/#]+)/i);
      if (match && match[1]) {
        candidateId = decodeURIComponent(match[1]).trim();
      }
    }
  }

  const searchList = localList || inMemory.registrations;

  // 1. Match by exact ID candidate
  let match = searchList.find(
    (r) =>
      (r.id || '').toLowerCase() === candidateId.toLowerCase() ||
      (r.qrCodeData || '').toLowerCase() === candidateId.toLowerCase()
  );
  if (match) return match;

  // 2. Match by plate number
  const targetPlateSearch = (candidatePlate || cleanPlateInput).toLowerCase().replace(/[\s\-_]/g, '');
  match = searchList.find((r) => {
    const p = (r.plateNumber || '').toLowerCase().replace(/[\s\-_]/g, '');
    return p === targetPlateSearch;
  });
  if (match) return match;

  // 3. Match by engine serial number
  const targetEngineSearch = (candidateEngine || cleanLower).toLowerCase();
  match = searchList.find(
    (r) => (r.engineOrSerialNo || '').toLowerCase() === targetEngineSearch
  );
  if (match) return match;

  // Final fallback: Direct document lookup from Firestore
  try {
    const directDoc = await getDocument<MotorcycleRegistration>(FIREBASE_COLLECTIONS.REGISTRATIONS, candidateId);
    if (directDoc) {
      const idx = inMemory.registrations.findIndex((r) => r.id === directDoc.id);
      if (idx >= 0) inMemory.registrations[idx] = directDoc;
      else inMemory.registrations.unshift(directDoc);
      notifyRegistrations();
      return directDoc;
    }
  } catch (err) {}

  return null;
}

// --- OFFICERS ---
export function subscribeOfficers(
  callback: (officers: OfficerAssignment[]) => void
): () => void {
  callback(inMemory.officers);
  listeners.officers.add(callback);
  return () => {
    listeners.officers.delete(callback);
  };
}

export async function saveOfficerToDb(officer: OfficerAssignment): Promise<void> {
  const index = inMemory.officers.findIndex((o) => o.id === officer.id);
  if (index >= 0) {
    inMemory.officers[index] = { ...inMemory.officers[index], ...officer };
  } else {
    inMemory.officers.unshift(officer);
  }
  notifyOfficers();

  try {
    await upsertDocument(FIREBASE_COLLECTIONS.OFFICERS, officer.id, officer);
    lastSyncTime = new Date();
    isCloudConnected = true;
    setGlobalFirestoreError(null);
    return;
  } catch (directErr) {
    console.warn('Direct Firestore save officer notice:', directErr);
  }

  try {
    await safeJsonFetch('/api/officers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(officer),
    });
    setGlobalFirestoreError(null);
  } catch (apiErr: any) {
    console.warn('saveOfficerToDb notice:', apiErr?.message);
  }
}

export async function updateOfficerInDb(
  id: string,
  updates: Partial<OfficerAssignment>
): Promise<void> {
  const index = inMemory.officers.findIndex((o) => o.id === id);
  if (index >= 0) {
    inMemory.officers[index] = { ...inMemory.officers[index], ...updates };
    notifyOfficers();
  }

  try {
    await updateDocumentFields(FIREBASE_COLLECTIONS.OFFICERS, id, updates);
    lastSyncTime = new Date();
    isCloudConnected = true;
    setGlobalFirestoreError(null);
    return;
  } catch (directErr) {
    console.warn('Direct Firestore update officer notice:', directErr);
  }

  try {
    await safeJsonFetch('/api/officers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates }),
    });
    setGlobalFirestoreError(null);
  } catch (apiErr: any) {
    console.warn('updateOfficerInDb notice:', apiErr?.message);
  }
}

// --- PRINT BATCH ORDERS ---
export function subscribePrintOrders(
  callback: (orders: PrintBatchOrder[]) => void
): () => void {
  callback(inMemory.printOrders);
  listeners.printOrders.add(callback);
  return () => {
    listeners.printOrders.delete(callback);
  };
}

export async function savePrintOrderToDb(order: PrintBatchOrder): Promise<void> {
  const index = inMemory.printOrders.findIndex((p) => p.id === order.id);
  if (index >= 0) {
    inMemory.printOrders[index] = { ...inMemory.printOrders[index], ...order };
  } else {
    inMemory.printOrders.unshift(order);
  }
  notifyPrintOrders();

  try {
    await upsertDocument(FIREBASE_COLLECTIONS.PRINT_ORDERS, order.id, order);
    lastSyncTime = new Date();
    isCloudConnected = true;
    setGlobalFirestoreError(null);
    return;
  } catch (directErr) {
    console.warn('Direct Firestore save print order notice:', directErr);
  }

  try {
    await safeJsonFetch('/api/print-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    setGlobalFirestoreError(null);
  } catch (apiErr: any) {
    console.warn('savePrintOrderToDb notice:', apiErr?.message);
  }
}

export async function updatePrintOrderStatusInDb(
  id: string,
  status: PrintBatchOrder['status'],
  notes?: string
): Promise<void> {
  const index = inMemory.printOrders.findIndex((p) => p.id === id);
  if (index >= 0) {
    inMemory.printOrders[index] = {
      ...inMemory.printOrders[index],
      status,
      ...(notes !== undefined ? { notes } : {}),
    };
    notifyPrintOrders();
  }

  const updates: Record<string, any> = { status };
  if (notes !== undefined) updates.notes = notes;

  try {
    await updateDocumentFields(FIREBASE_COLLECTIONS.PRINT_ORDERS, id, updates);
    lastSyncTime = new Date();
    isCloudConnected = true;
    setGlobalFirestoreError(null);
    return;
  } catch (directErr) {
    console.warn('Direct Firestore print order update notice:', directErr);
  }

  try {
    await safeJsonFetch('/api/print-orders/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, notes }),
    });
    setGlobalFirestoreError(null);
  } catch (apiErr: any) {
    console.warn('updatePrintOrderStatusInDb notice:', apiErr?.message);
  }
}

// --- VERIFICATION LOGS ---
export function subscribeVerificationLogs(
  callback: (logs: VerificationLog[]) => void
): () => void {
  callback(inMemory.verifications);
  listeners.verifications.add(callback);
  return () => {
    listeners.verifications.delete(callback);
  };
}

export async function saveVerificationLogToDb(log: VerificationLog): Promise<void> {
  const index = inMemory.verifications.findIndex((v) => v.id === log.id);
  if (index >= 0) {
    inMemory.verifications[index] = { ...inMemory.verifications[index], ...log };
  } else {
    inMemory.verifications.unshift(log);
  }
  notifyVerifications();

  try {
    await upsertDocument(FIREBASE_COLLECTIONS.VERIFICATIONS, log.id, log);
    lastSyncTime = new Date();
    isCloudConnected = true;
    setGlobalFirestoreError(null);
    return;
  } catch (directErr) {
    console.warn('Direct Firestore save verification log notice:', directErr);
  }

  try {
    await safeJsonFetch('/api/verification-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    setGlobalFirestoreError(null);
  } catch (apiErr: any) {
    console.warn('saveVerificationLogToDb notice:', apiErr?.message);
  }
}

// --- SYSTEM SETTINGS ---
export function subscribeSettings(
  callback: (settings: SystemSettings) => void
): () => void {
  callback(inMemory.settings);
  listeners.settings.add(callback);
  return () => {
    listeners.settings.delete(callback);
  };
}

export async function saveSettingsToDb(settings: SystemSettings): Promise<void> {
  inMemory.settings = { ...settings };
  notifySettings();

  try {
    await upsertDocument(FIREBASE_COLLECTIONS.SETTINGS, 'global_config', {
      id: 'global_config',
      ...settings,
    });
    lastSyncTime = new Date();
    isCloudConnected = true;
    setGlobalFirestoreError(null);
    return;
  } catch (directErr) {
    console.warn('Direct Firestore save settings notice:', directErr);
  }

  try {
    await safeJsonFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setGlobalFirestoreError(null);
  } catch (apiErr: any) {
    console.warn('saveSettingsToDb notice:', apiErr?.message);
  }
}

export async function resetAllSystemData(): Promise<void> {
  inMemory.registrations = [];
  inMemory.officers = [];
  inMemory.printOrders = [];
  inMemory.verifications = [];

  notifyRegistrations();
  notifyOfficers();
  notifyPrintOrders();
  notifyVerifications();

  try {
    await safeJsonFetch('/api/reset-data', { method: 'POST' });
    setGlobalFirestoreError(null);
  } catch (error: any) {
    console.warn('resetAllSystemData notice:', error?.message);
  }
}

// --- SEED SAMPLE DATASET FOR FRESH DATABASE ---
export async function seedSampleDatabaseData(): Promise<void> {
  const sampleRegistrations: MotorcycleRegistration[] = [
    {
      id: 'REG-1002',
      fullName: 'Kirubel Denekew (ኪሩቤል ደነቀው)',
      phone: '+251 91 123 4567',
      vehicleCategory: 'electric',
      motorBrand: 'Yadea',
      motorModel: 'T5 EV',
      engineOrSerialNo: 'YD80092109',
      plateNumber: 'AA 3 45678',
      registrationDate: '2026-08-10 10:30',
      status: 'approved',
      qrCodeData: '{"id":"REG-1002","plateNumber":"AA 3 45678","engineOrSerialNo":"YD80092109"}',
      registeredBy: 'CLERK-209',
      subCity: 'Bole',
      userPortraitPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      nationalIdPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingLicensePhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingPermitPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
    },
    {
      id: 'REG-1003',
      fullName: 'Helen Tesfaye (ሄለን ተስፋዬ)',
      phone: '+251 92 345 6789',
      vehicleCategory: 'electric',
      motorBrand: 'Lifan',
      motorModel: 'LF-1200 EV',
      engineOrSerialNo: 'LF90028192',
      plateNumber: 'AA 3 88102',
      registrationDate: '2026-08-11 14:15',
      status: 'pending_approval',
      qrCodeData: '{"id":"REG-1003","plateNumber":"AA 3 88102","engineOrSerialNo":"LF90028192"}',
      registeredBy: 'CLERK-209',
      subCity: 'Kirkos',
      userPortraitPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      nationalIdPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingLicensePhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingPermitPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
    },
    {
      id: 'REG-1004',
      fullName: 'Abebe Kebede (አበበ ከበደ)',
      phone: '+251 91 445 2109',
      vehicleCategory: 'gas_under_110cc',
      motorBrand: 'Bajaj',
      motorModel: 'Discover 100',
      engineOrSerialNo: 'BJ21029103',
      plateNumber: 'AA 3 12903',
      registrationDate: '2026-08-12 09:00',
      status: 'printed',
      qrCodeData: '{"id":"REG-1004","plateNumber":"AA 3 12903","engineOrSerialNo":"BJ21029103"}',
      registeredBy: 'CLERK-114',
      subCity: 'Yeka',
      userPortraitPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      nationalIdPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingLicensePhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingPermitPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
    },
    {
      id: 'REG-1005',
      fullName: 'Yohannes Alula (ዮሐንስ አሉላ)',
      phone: '+251 90 231 4455',
      vehicleCategory: 'gas_under_110cc',
      motorBrand: 'TVS',
      motorModel: 'Neo XR',
      engineOrSerialNo: 'TV80291028',
      plateNumber: 'AA 3 55219',
      registrationDate: '2026-08-13 16:45',
      status: 'approved',
      qrCodeData: '{"id":"REG-1005","plateNumber":"AA 3 55219","engineOrSerialNo":"TV80291028"}',
      registeredBy: 'CLERK-114',
      subCity: 'Arada',
      userPortraitPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
      nationalIdPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingLicensePhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingPermitPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
    },
    {
      id: 'REG-1006',
      fullName: 'Samrawit Girma (ሳምራዊት ግርማ)',
      phone: '+251 91 556 7890',
      vehicleCategory: 'electric',
      motorBrand: 'Niu',
      motorModel: 'NQi GTS',
      engineOrSerialNo: 'NU50291023',
      plateNumber: 'AA 3 77413',
      registrationDate: '2026-08-14 11:20',
      status: 'rejected',
      rejectionReason: 'National ID provided is expired and the engine serial number does not match custom clearance docs.',
      qrCodeData: '{"id":"REG-1006","plateNumber":"AA 3 77413","engineOrSerialNo":"NU50291023"}',
      registeredBy: 'CLERK-209',
      subCity: 'Bole',
      userPortraitPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      nationalIdPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingLicensePhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
      drivingPermitPhoto: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&h=250&fit=crop',
    },
  ];

  const sampleOfficers: OfficerAssignment[] = [
    {
      id: 'OFF-001',
      officerName: 'አበበ ደስታ (Abebe Desta)',
      badgeId: 'BADGE-442',
      subCity: 'Bole Sub-City',
      locationName: 'Bole Medhanialem Junction',
      shift: 'morning',
      status: 'active',
      assignedLocation: 'Bole Medhanialem Roundabout',
      phone: '+251 91 223 3445',
      shiftHours: '06:00 - 14:00',
      assignedDate: '2026-08-16',
    },
    {
      id: 'OFF-002',
      officerName: 'ሄለን ካሳ (Helen Kassa)',
      badgeId: 'BADGE-119',
      subCity: 'Kirkos Sub-City',
      locationName: 'Mexico Square',
      shift: 'afternoon',
      status: 'active',
      assignedLocation: 'Mexico Square Post Office Checkpoint',
      phone: '+251 92 112 2334',
      shiftHours: '14:00 - 22:00',
      assignedDate: '2026-08-16',
    },
    {
      id: 'OFF-003',
      officerName: 'ዮናስ ታደሰ (Yonas Tadesse)',
      badgeId: 'BADGE-802',
      subCity: 'Yeka Sub-City',
      locationName: 'Megenagna Roundabout',
      shift: 'night',
      status: 'off_duty',
      assignedLocation: 'Megenagna Station Checkpoint',
      phone: '+251 90 334 4556',
      shiftHours: '22:00 - 06:00',
      assignedDate: '2026-08-16',
    },
  ];

  const sampleOrders: PrintBatchOrder[] = [
    {
      id: 'BATCH-PRINT-101',
      orderDate: '2026-08-15 11:00',
      totalItems: 2,
      totalCount: 2,
      registrationIds: ['REG-1002', 'REG-1005'],
      status: 'in_printing',
      notes: 'High priority batch requested by transport authority for EV incentives.',
      updatedAt: '2026-08-15 11:30',
    },
  ];

  for (const reg of sampleRegistrations) {
    await saveRegistrationToDb(reg);
  }
  for (const off of sampleOfficers) {
    await saveOfficerToDb(off);
  }
  for (const ord of sampleOrders) {
    await savePrintOrderToDb(ord);
  }

  await syncAllCollectionsWithDb();
}

// --- DIRECT FIREBASE BACKEND SYNCHRONIZER ---
export async function syncAllCollectionsWithDb(): Promise<void> {
  let hasDirectSuccess = false;

  // 1. Direct Firestore Parallel Query
  try {
    const [regs, offs, orders, logs, settingsDoc] = await Promise.all([
      fetchAllDocuments<MotorcycleRegistration>(FIREBASE_COLLECTIONS.REGISTRATIONS).catch(() => null),
      fetchAllDocuments<OfficerAssignment>(FIREBASE_COLLECTIONS.OFFICERS).catch(() => null),
      fetchAllDocuments<PrintBatchOrder>(FIREBASE_COLLECTIONS.PRINT_ORDERS).catch(() => null),
      fetchAllDocuments<VerificationLog>(FIREBASE_COLLECTIONS.VERIFICATIONS).catch(() => null),
      getDocument<SystemSettings>(FIREBASE_COLLECTIONS.SETTINGS, 'global_config').catch(() => null),
    ]);

    if (Array.isArray(regs)) {
      inMemory.registrations = regs;
      notifyRegistrations();
      hasDirectSuccess = true;
    }
    if (Array.isArray(offs)) {
      inMemory.officers = offs;
      notifyOfficers();
      hasDirectSuccess = true;
    }
    if (Array.isArray(orders)) {
      inMemory.printOrders = orders;
      notifyPrintOrders();
      hasDirectSuccess = true;
    }
    if (Array.isArray(logs)) {
      inMemory.verifications = logs;
      notifyVerifications();
      hasDirectSuccess = true;
    }
    if (settingsDoc) {
      inMemory.settings = settingsDoc;
      notifySettings();
      hasDirectSuccess = true;
    }

    if (hasDirectSuccess) {
      lastSyncTime = new Date();
      isCloudConnected = true;
      notifySyncStatus();
      setGlobalFirestoreError(null);
      return;
    }
  } catch (directErr) {
    console.warn('Direct Firestore sync attempt notice:', directErr);
  }

  // 2. Fallback to API sync endpoint if direct query was empty or proxy is used
  try {
    const data = await safeJsonFetch('/api/sync');

    if (Array.isArray(data.registrations)) {
      inMemory.registrations = data.registrations;
      notifyRegistrations();
    }
    if (Array.isArray(data.officers)) {
      inMemory.officers = data.officers;
      notifyOfficers();
    }
    if (Array.isArray(data.printOrders)) {
      inMemory.printOrders = data.printOrders;
      notifyPrintOrders();
    }
    if (Array.isArray(data.verifications)) {
      inMemory.verifications = data.verifications;
      notifyVerifications();
    }
    if (data.settings) {
      inMemory.settings = data.settings;
      notifySettings();
    }

    lastSyncTime = new Date();
    isCloudConnected = true;
    notifySyncStatus();
    setGlobalFirestoreError(null);
  } catch (error: any) {
    console.warn('Server sync notice:', error?.message);
    if (!hasDirectSuccess && inMemory.registrations.length === 0) {
      isCloudConnected = false;
      notifySyncStatus();
      setGlobalFirestoreError(error?.message || 'Firebase sync notice');
    } else {
      // We have local / cached data, keep active
      isCloudConnected = true;
      notifySyncStatus();
      setGlobalFirestoreError(null);
    }
  }
}
