import {
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
  VerificationLog,
  UnregisteredVehicleReport,
  PaymentReceipt,
  SystemSettings,
  SystemUser,
  SystemAuditLog,
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
import { uploadDocumentPhoto } from './storageService';
import { trackGlobalAction } from './actionTracker';
import {
  KEYS,
  getStoredLastAckResetEpoch,
  saveStoredLastAckResetEpoch,
  clearAllLocalStoredData,
} from '../utils/storage';

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
  const isQuotaError = Boolean(globalDbError && globalDbError.includes('Quota Exceeded'));
  const data = { lastSyncTime, isConnected: isCloudConnected, isQuotaExceeded: isQuotaError };
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

  if (
    str.includes('FUNCTION_INVOCATION_FAILED') ||
    str.includes('cpt1::') ||
    str.includes('500 Internal') ||
    str.includes('Server returned HTML') ||
    str.includes('Failed to fetch') ||
    str.includes('Could not reach Cloud Firestore backend')
  ) {
    return null; // Suppress connection timeout warnings as local storage handles sync seamlessly
  }
  if (str.includes('the client is offline') || str.includes('network-request-failed')) {
    return 'Offline mode: Changes are saved locally and will synchronize once reconnected.';
  }
  if (str.includes('Quota limit exceeded')) {
    return 'Firebase Free Tier Quota Exceeded. The database is currently in read-only/offline mode until the daily reset.';
  }
  if (str.includes('Missing or insufficient permissions')) {
    return 'Firestore security rule notice: Please verify permissions for this operation.';
  }
  return str;
}

export function setGlobalFirestoreError(err: string | null) {
  const sanitized = formatFriendlyDbError(err);
  globalDbError = sanitized;
  
  const isQuotaError = Boolean(err && String(err).includes('Quota limit exceeded'));
  isCloudConnected = sanitized === null || sanitized.includes('direct Firebase Firestore') && !isQuotaError;
  
  const data = { 
    lastSyncTime, 
    isConnected: isCloudConnected, 
    isQuotaExceeded: isQuotaError 
  };
  
  syncStatusListeners.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {}
  });

  errorListeners.forEach((cb) => {
    try {
      cb(globalDbError);
    } catch (e) {}
  });
}

// Initial default settings
export const DEFAULT_SETTINGS: SystemSettings = {
  officerName: 'አበበ ደስታ',
  department: 'የትራፊክ ማኔጅመንትና ህግ ማስከበሪያ',
  subCityOffice: 'በላይ ዘለቀ ክፍለ ከተማ',
  defaultPrinter: 'Zebra ZD621 Industrial PVC Card Printer',
  cardStockType: 'CR80 Standard PVC Card (85.6 x 54 mm)',
  calendarSystem: 'ethiopian',
  autoPrintQR: true,
  emailAlerts: true,
  security2FA: true,
  highRiskAlerts: true,
  showClerkPermitStatus: false,
  showClerkSubmissionsAction: false,
  showClerkApprovedVehiclesAction: false,
  showClerkPaymentKPIs: false,
  showClerkPaymentRecordsTable: false,
  clerkPaymentKPIPermission: 'deny',
  clerkPaymentTablePermission: 'deny',
  frozenSubCities: {},
  systemResetEpoch: 0,
  lastSystemResetAt: '',
};

export const DEFAULT_SAMPLE_VERIFICATIONS: VerificationLog[] = [];

export const DEFAULT_SAMPLE_UNREGISTERED_REPORTS: UnregisteredVehicleReport[] = [];

// In-Memory Live State (synchronized directly from Firebase Firestore backend)
const inMemory = {
  registrations: [] as MotorcycleRegistration[],
  officers: [] as OfficerAssignment[],
  printOrders: [] as PrintBatchOrder[],
  verifications: [...DEFAULT_SAMPLE_VERIFICATIONS] as VerificationLog[],
  unregisteredReports: [...DEFAULT_SAMPLE_UNREGISTERED_REPORTS] as UnregisteredVehicleReport[],
  paymentReceipts: [] as PaymentReceipt[],
  users: [] as SystemUser[],
  auditLogs: [] as SystemAuditLog[],
  settings: { ...DEFAULT_SETTINGS } as SystemSettings,
};

const STATE_CACHE_KEY = 'bd_motor_app_state_cache';

export function mergeById<T extends { id?: string; uid?: string }>(incoming: T[], existing: T[]): T[] {
  const map = new Map<string, T>();
  if (Array.isArray(existing)) {
    for (const item of existing) {
      const key = item?.id || item?.uid;
      if (item && key) map.set(key, item);
    }
  }
  if (Array.isArray(incoming)) {
    for (const item of incoming) {
      const key = item?.id || item?.uid;
      if (item && key) map.set(key, item);
    }
  }
  return Array.from(map.values());
}

export function saveStateToLocalStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      registrations: inMemory.registrations,
      officers: inMemory.officers,
      printOrders: inMemory.printOrders,
      verifications: inMemory.verifications,
      unregisteredReports: inMemory.unregisteredReports,
      paymentReceipts: inMemory.paymentReceipts,
      settings: inMemory.settings,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STATE_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save state to LocalStorage:', err);
  }
}

export function applySystemResetLocally(resetEpoch: number, resetTimestamp?: string): void {
  console.log(`[System Reset] Applying local system reset purge (Epoch: ${resetEpoch})...`);
  inMemory.registrations = [];
  inMemory.officers = [];
  inMemory.printOrders = [];
  inMemory.verifications = [];
  inMemory.unregisteredReports = [];
  inMemory.paymentReceipts = [];
  inMemory.auditLogs = [];
  inMemory.settings = {
    ...DEFAULT_SETTINGS,
    systemResetEpoch: resetEpoch,
    lastSystemResetAt: resetTimestamp || new Date().toISOString(),
  };

  saveStoredLastAckResetEpoch(resetEpoch);
  clearAllLocalStoredData();
  saveStateToLocalStorage();

  notifyRegistrations();
  notifyOfficers();
  notifyPrintOrders();
  notifyVerifications();
  notifyUnregisteredReports();
  notifyPaymentReceipts();
  notifyAuditLogs();
  notifySettings();
}

export function checkAndApplySystemResetIfNewer(remoteSettings?: SystemSettings | null): boolean {
  if (!remoteSettings) return false;
  const remoteEpoch = Number(remoteSettings.systemResetEpoch) || 0;
  const localAckEpoch = getStoredLastAckResetEpoch();

  if (remoteEpoch > 0 && remoteEpoch > localAckEpoch) {
    console.log(
      `[System Reset] Newer remote system reset detected (Remote: ${remoteEpoch}, Local Acknowledged: ${localAckEpoch}). Purging local storage and state...`
    );
    applySystemResetLocally(remoteEpoch, remoteSettings.lastSystemResetAt);
    return true;
  }
  return false;
}

export function loadStateFromLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STATE_CACHE_KEY);
    if (!raw) {
      saveStateToLocalStorage();
      return true;
    }
    const parsed = JSON.parse(raw);
    let loaded = false;

    if (Array.isArray(parsed.registrations)) {
      inMemory.registrations = parsed.registrations;
      notifyRegistrations();
      loaded = true;
    }
    if (Array.isArray(parsed.officers)) {
      inMemory.officers = parsed.officers;
      notifyOfficers();
      loaded = true;
    }
    if (Array.isArray(parsed.printOrders)) {
      inMemory.printOrders = parsed.printOrders;
      notifyPrintOrders();
      loaded = true;
    }
    if (Array.isArray(parsed.verifications) && parsed.verifications.length > 0) {
      inMemory.verifications = parsed.verifications;
      notifyVerifications();
      loaded = true;
    } else if (inMemory.verifications.length === 0) {
      inMemory.verifications = [...DEFAULT_SAMPLE_VERIFICATIONS];
      notifyVerifications();
      loaded = true;
    }
    if (Array.isArray(parsed.unregisteredReports)) {
      inMemory.unregisteredReports = parsed.unregisteredReports;
      notifyUnregisteredReports();
      loaded = true;
    }
    if (Array.isArray(parsed.paymentReceipts)) {
      inMemory.paymentReceipts = parsed.paymentReceipts;
      notifyPaymentReceipts();
      loaded = true;
    }
    if (parsed.settings) {
      const localAckEpoch = getStoredLastAckResetEpoch();
      const settingsEpoch = Number(parsed.settings.systemResetEpoch) || 0;
      if (settingsEpoch > localAckEpoch) {
        saveStoredLastAckResetEpoch(settingsEpoch);
      }
      inMemory.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
      notifySettings();
      loaded = true;
    }
    return loaded;
  } catch (err) {
    console.warn('Failed to load state from LocalStorage:', err);
    return false;
  }
}

const listeners = {
  registrations: new Set<(regs: MotorcycleRegistration[]) => void>(),
  officers: new Set<(officers: OfficerAssignment[]) => void>(),
  printOrders: new Set<(orders: PrintBatchOrder[]) => void>(),
  verifications: new Set<(logs: VerificationLog[]) => void>(),
  unregisteredReports: new Set<(reports: UnregisteredVehicleReport[]) => void>(),
  paymentReceipts: new Set<(receipts: PaymentReceipt[]) => void>(),
  users: new Set<(users: SystemUser[]) => void>(),
  auditLogs: new Set<(logs: SystemAuditLog[]) => void>(),
  settings: new Set<(settings: SystemSettings) => void>(),
};

function notifyUsers() {
  const data = [...inMemory.users];
  listeners.users.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {}
  });
  saveStateToLocalStorage();
}

function notifyAuditLogs() {
  const data = [...inMemory.auditLogs];
  listeners.auditLogs.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {}
  });
  saveStateToLocalStorage();
}

function notifyRegistrations() {
  const data = [...inMemory.registrations];
  listeners.registrations.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error in registration listener callback:', e);
    }
  });
  saveStateToLocalStorage();
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
  saveStateToLocalStorage();
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
  saveStateToLocalStorage();
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
  saveStateToLocalStorage();
}

function notifyUnregisteredReports() {
  const data = [...inMemory.unregisteredReports];
  data.sort((a, b) => (b.reportedAt || '').localeCompare(a.reportedAt || ''));
  listeners.unregisteredReports.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error in unregistered report listener callback:', e);
    }
  });
  saveStateToLocalStorage();
}

function notifyPaymentReceipts() {
  const data = [...inMemory.paymentReceipts];
  data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  listeners.paymentReceipts.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('Error in payment receipt listener callback:', e);
    }
  });
  saveStateToLocalStorage();
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
  saveStateToLocalStorage();
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
    if (body.error?.includes('Quota limit exceeded') || body.warning?.includes('Firebase quota exceeded')) {
      console.warn(`[API] Quota limit exceeded on ${url}, falling back.`);
      return { success: true, isOfflineFallback: true, warning: 'Quota exceeded' };
    }
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return body;
}

// --- REAL-TIME FIRESTORE LISTENER SUBSCRIPTIONS ---
let areLiveListenersActive = false;
export function initLiveFirestoreListeners(): () => void {
  // Local-only mode: Load state directly from LocalStorage and stop Firebase live subscriptions
  loadStateFromLocalStorage();
  return () => {};
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
  return trackGlobalAction(
    async () => {
      // 1. Update in-memory state and persist directly to LocalStorage
      const index = inMemory.registrations.findIndex((r) => r.id === reg.id);
      if (index >= 0) {
        inMemory.registrations[index] = { ...inMemory.registrations[index], ...reg };
      } else {
        inMemory.registrations.unshift(reg);
      }
      notifyRegistrations();
      saveStateToLocalStorage();
      lastSyncTime = new Date();
      isCloudConnected = true;
      setGlobalFirestoreError(null);

      // 2. Persist to Cloud Firestore database with lightweight storage URLs
      try {
        if (!_options?.forceLocalOnly) {
          // If any photo fields are still raw base64 data, convert them in parallel
          const optimizedReg = { ...reg };
          const [
            upPortrait,
            upNatIdFront,
            upNatIdBack,
            upLicense,
            upPermit,
            upReceipt,
          ] = await Promise.all([
            optimizedReg.userPortraitPhoto?.startsWith('data:image/')
              ? uploadDocumentPhoto(optimizedReg.userPortraitPhoto, 'permits/portraits')
              : Promise.resolve(optimizedReg.userPortraitPhoto),
            optimizedReg.nationalIdPhoto?.startsWith('data:image/')
              ? uploadDocumentPhoto(optimizedReg.nationalIdPhoto, 'permits/national_ids')
              : Promise.resolve(optimizedReg.nationalIdPhoto),
            optimizedReg.nationalIdBackPhoto?.startsWith('data:image/')
              ? uploadDocumentPhoto(optimizedReg.nationalIdBackPhoto, 'permits/national_ids')
              : Promise.resolve(optimizedReg.nationalIdBackPhoto),
            optimizedReg.drivingLicensePhoto?.startsWith('data:image/')
              ? uploadDocumentPhoto(optimizedReg.drivingLicensePhoto, 'permits/licenses')
              : Promise.resolve(optimizedReg.drivingLicensePhoto),
            optimizedReg.drivingPermitPhoto?.startsWith('data:image/')
              ? uploadDocumentPhoto(optimizedReg.drivingPermitPhoto, 'permits/police_permits')
              : Promise.resolve(optimizedReg.drivingPermitPhoto),
            optimizedReg.receiptScreenshot?.startsWith('data:image/')
              ? uploadDocumentPhoto(optimizedReg.receiptScreenshot, 'permits/receipts')
              : Promise.resolve(optimizedReg.receiptScreenshot),
          ]);

          optimizedReg.userPortraitPhoto = upPortrait;
          optimizedReg.nationalIdPhoto = upNatIdFront;
          optimizedReg.nationalIdBackPhoto = upNatIdBack;
          optimizedReg.drivingLicensePhoto = upLicense;
          optimizedReg.drivingPermitPhoto = upPermit;
          optimizedReg.receiptScreenshot = upReceipt;

          await upsertDocument(FIREBASE_COLLECTIONS.REGISTRATIONS, optimizedReg.id, optimizedReg);
        }
        return { success: true, isOfflineFallback: false };
      } catch (directErr: any) {
        console.warn('Direct Firestore save registration notice:', directErr);
        return { success: true, isOfflineFallback: true, error: directErr?.message };
      }
    },
    'ምዝገባው በዳታቤዝ እየተቀመጠ ነው...',
    'Saving registration to database...'
  );
}

export async function updateRegistrationStatusInDb(
  id: string,
  status: MotorcycleRegistration['status'],
  rejectionReason?: string
): Promise<void> {
  return trackGlobalAction(
    async () => {
      const index = inMemory.registrations.findIndex((r) => r.id === id);
      if (index >= 0) {
        inMemory.registrations[index] = {
          ...inMemory.registrations[index],
          status,
          ...(rejectionReason !== undefined ? { rejectionReason } : {}),
        };
        notifyRegistrations();
        saveStateToLocalStorage();
        lastSyncTime = new Date();
        isCloudConnected = true;
        setGlobalFirestoreError(null);
      }

      try {
        const updates: Record<string, any> = { status };
        if (rejectionReason !== undefined) updates.rejectionReason = rejectionReason;
        await updateDocumentFields(FIREBASE_COLLECTIONS.REGISTRATIONS, id, updates);
      } catch (err) {
        console.warn('Direct Firestore update registration status notice:', err);
      }
    },
    'የምዝገባ ሁኔታ እየተዘመነ ነው...',
    'Updating registration status...'
  );
}

export async function updateRegistrationInDb(
  id: string,
  updates: Partial<MotorcycleRegistration>
): Promise<void> {
  return trackGlobalAction(
    async () => {
      const index = inMemory.registrations.findIndex((r) => r.id === id);
      if (index >= 0) {
        inMemory.registrations[index] = {
          ...inMemory.registrations[index],
          ...updates,
        };
        notifyRegistrations();
        saveStateToLocalStorage();
        lastSyncTime = new Date();
        isCloudConnected = true;
        setGlobalFirestoreError(null);
      }

      try {
        await updateDocumentFields(FIREBASE_COLLECTIONS.REGISTRATIONS, id, updates);
      } catch (err) {
        console.warn('Direct Firestore update registration notice:', err);
      }
    },
    'መረጃው እየተዘመነ ነው...',
    'Updating registration record...'
  );
}

export async function deleteRegistrationFromDb(id: string): Promise<void> {
  return trackGlobalAction(
    async () => {
      const index = inMemory.registrations.findIndex((r) => r.id === id);
      if (index >= 0) {
        inMemory.registrations.splice(index, 1);
        notifyRegistrations();
        saveStateToLocalStorage();
        lastSyncTime = new Date();
        isCloudConnected = true;
        setGlobalFirestoreError(null);
      }

      try {
        await deleteDocument(FIREBASE_COLLECTIONS.REGISTRATIONS, id);
      } catch (err) {
        console.warn('Direct Firestore delete registration notice:', err);
      }
    },
    'ምዝገባው እየተሰረዘ ነው...',
    'Deleting registration...'
  );
}

export async function fetchAllRegistrationsFromDb(): Promise<MotorcycleRegistration[]> {
  loadStateFromLocalStorage();
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
  return trackGlobalAction(
    async () => {
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
    },
    'የኦፊሰር ምደባ እየተቀመጠ ነው...',
    'Saving officer assignment...'
  );
}

export async function updateOfficerInDb(
  id: string,
  updates: Partial<OfficerAssignment>
): Promise<void> {
  return trackGlobalAction(
    async () => {
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
    },
    'የኦፊሰር መረጃ እየተዘመነ ነው...',
    'Updating officer assignment...'
  );
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
  return trackGlobalAction(
    async () => {
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
    },
    'የሕትመት ትዕዛዝ እየተፈጠረ ነው...',
    'Creating print batch order...'
  );
}

export async function updatePrintOrderStatusInDb(
  id: string,
  status: PrintBatchOrder['status'],
  notes?: string
): Promise<void> {
  return trackGlobalAction(
    async () => {
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
    },
    'የሕትመት ሁኔታ እየተዘመነ ነው...',
    'Updating print order status...'
  );
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

// --- UNREGISTERED VEHICLE REPORTS ---
export function subscribeUnregisteredReports(
  callback: (reports: UnregisteredVehicleReport[]) => void
): () => void {
  callback(inMemory.unregisteredReports);
  listeners.unregisteredReports.add(callback);
  return () => {
    listeners.unregisteredReports.delete(callback);
  };
}

export async function saveUnregisteredReportToDb(report: UnregisteredVehicleReport): Promise<void> {
  return trackGlobalAction(
    async () => {
      const index = inMemory.unregisteredReports.findIndex((r) => r.id === report.id);
      if (index >= 0) {
        inMemory.unregisteredReports[index] = { ...inMemory.unregisteredReports[index], ...report };
      } else {
        inMemory.unregisteredReports.unshift(report);
      }
      notifyUnregisteredReports();

      try {
        await upsertDocument(FIREBASE_COLLECTIONS.UNREGISTERED_REPORTS, report.id, report);
        lastSyncTime = new Date();
        isCloudConnected = true;
        setGlobalFirestoreError(null);
        return;
      } catch (directErr) {
        console.warn('Direct Firestore save unregistered report notice:', directErr);
      }

      try {
        await safeJsonFetch('/api/unregistered-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
        setGlobalFirestoreError(null);
      } catch (apiErr: any) {
        console.warn('saveUnregisteredReportToDb notice:', apiErr?.message);
      }
    },
    'የህገወጥ ሪፖርት እየተቀመጠ ነው...',
    'Saving unregistered report...'
  );
}

export async function updateUnregisteredReportStatusInDb(
  id: string,
  status: UnregisteredVehicleReport['status'],
  resolutionNotes?: string
): Promise<void> {
  return trackGlobalAction(
    async () => {
      const index = inMemory.unregisteredReports.findIndex((r) => r.id === id);
      if (index >= 0) {
        inMemory.unregisteredReports[index] = {
          ...inMemory.unregisteredReports[index],
          status,
          resolutionNotes: resolutionNotes || inMemory.unregisteredReports[index].resolutionNotes,
        };
        notifyUnregisteredReports();
      }

      try {
        await updateDocumentFields(FIREBASE_COLLECTIONS.UNREGISTERED_REPORTS, id, {
          status,
          resolutionNotes,
        });
        setGlobalFirestoreError(null);
      } catch (e: any) {
        console.warn('updateUnregisteredReportStatusInDb notice:', e?.message);
      }
    },
    'የሪፖርት ሁኔታ እየተዘመነ ነው...',
    'Updating report status...'
  );
}

export async function saveVerificationLogToDb(log: VerificationLog): Promise<void> {
  return trackGlobalAction(
    async () => {
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
    },
    'የፍተሻ መረጃ እየተመዘገበ ነው...',
    'Logging inspection record...'
  );
}

// --- PAYMENT RECEIPTS ---
export function subscribePaymentReceipts(
  callback: (receipts: PaymentReceipt[]) => void
): () => void {
  callback([...inMemory.paymentReceipts].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
  listeners.paymentReceipts.add(callback);
  return () => {
    listeners.paymentReceipts.delete(callback);
  };
}

export async function savePaymentReceiptToDb(receipt: PaymentReceipt): Promise<void> {
  return trackGlobalAction(
    async () => {
      const index = inMemory.paymentReceipts.findIndex((p) => p.id === receipt.id);
      if (index >= 0) {
        inMemory.paymentReceipts[index] = { ...receipt };
      } else {
        inMemory.paymentReceipts.unshift(receipt);
      }
      notifyPaymentReceipts();

      try {
        await upsertDocument(FIREBASE_COLLECTIONS.PAYMENT_RECEIPTS, receipt.id, receipt);
        lastSyncTime = new Date();
        isCloudConnected = true;
        setGlobalFirestoreError(null);
      } catch (directErr) {
        console.warn('Direct Firestore save payment receipt notice:', directErr);
      }
    },
    'የክፍያ ደረሰኝ እየተቀመጠ ነው...',
    'Saving payment receipt...'
  );
}

export async function deletePaymentReceiptFromDb(id: string): Promise<void> {
  return trackGlobalAction(
    async () => {
      inMemory.paymentReceipts = inMemory.paymentReceipts.filter((p) => p.id !== id);
      notifyPaymentReceipts();

      try {
        await deleteDocument(FIREBASE_COLLECTIONS.PAYMENT_RECEIPTS, id);
        setGlobalFirestoreError(null);
      } catch (e: any) {
        console.warn('deletePaymentReceiptFromDb notice:', e?.message);
      }
    },
    'የክፍያ ደረሰኝ እየተሰረዘ ነው...',
    'Deleting payment receipt...'
  );
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
  return trackGlobalAction(
    async () => {
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
    },
    'የሲስተም ቅንብሮች እየተቀመጡ ነው...',
    'Saving system settings...'
  );
}

export async function resetAllSystemData(): Promise<void> {
  inMemory.registrations = [];
  inMemory.officers = [];
  inMemory.printOrders = [];
  inMemory.verifications = [];
  inMemory.unregisteredReports = [];
  inMemory.paymentReceipts = [];

  notifyRegistrations();
  notifyOfficers();
  notifyPrintOrders();
  notifyVerifications();
  notifyUnregisteredReports();
  notifyPaymentReceipts();

  try {
    await safeJsonFetch('/api/reset-data', { method: 'POST' });
    setGlobalFirestoreError(null);
  } catch (error: any) {
    console.warn('resetAllSystemData notice:', error?.message);
  }
}

// --- SEED SAMPLE DATASET FOR FRESH DATABASE ---
export async function seedSampleDatabaseData(): Promise<void> {
  const sampleRegistrations: MotorcycleRegistration[] = [];
  const sampleOfficers: OfficerAssignment[] = [];
  const sampleOrders: PrintBatchOrder[] = [];

  for (const reg of sampleRegistrations) {
    await saveRegistrationToDb(reg);
  }
  for (const off of sampleOfficers) {
    await saveOfficerToDb(off);
  }
  for (const ord of sampleOrders) {
    await savePrintOrderToDb(ord);
  }
  for (const verif of DEFAULT_SAMPLE_VERIFICATIONS) {
    await saveVerificationLogToDb(verif);
  }

  await syncAllCollectionsWithDb();
}

async function pushUnsyncedLocalRecordsToCloud(remoteRegs?: MotorcycleRegistration[]): Promise<void> {
  if (globalDbError && globalDbError.includes('Quota Exceeded')) return;
  try {
    const remoteMap = new Set((remoteRegs || []).map((r) => r.id));
    const unsyncedRegs = inMemory.registrations.filter((r) => r && r.id && !remoteMap.has(r.id));
    if (unsyncedRegs.length > 0) {
      console.log(`[Auto-Sync] Syncing ${unsyncedRegs.length} local records to Cloud Firestore...`);
      for (const reg of unsyncedRegs) {
        await upsertDocument(FIREBASE_COLLECTIONS.REGISTRATIONS, reg.id, reg).catch((e) => {
          console.warn(`Notice uploading local record ${reg.id} to cloud:`, e);
        });
      }
    }
  } catch (e) {
    console.warn('Notice pushing unsynced local records:', e);
  }
}

// --- DEFERRED MEDIA & IMAGE SYNCING ---
// When the app opens, image syncing and heavy media processing is deferred
// until all other data (settings, registrations metadata, logs, etc.) is completely loaded and displayed.
let isImageSyncingRunning = false;

export async function syncImagesAndMediaDeferred(): Promise<void> {
  if (isImageSyncingRunning) return;
  if (!isFirebaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  if (globalDbError && globalDbError.includes('Quota Exceeded')) return;

  isImageSyncingRunning = true;
  try {
    console.log('[Media-Sync] All primary data loaded. Starting deferred background image syncing...');
    const recordsWithBase64 = inMemory.registrations.filter((r) => 
      (r.userPortraitPhoto && r.userPortraitPhoto.startsWith('data:image/')) ||
      (r.nationalIdPhoto && r.nationalIdPhoto.startsWith('data:image/')) ||
      (r.drivingLicensePhoto && r.drivingLicensePhoto.startsWith('data:image/')) ||
      (r.drivingPermitPhoto && r.drivingPermitPhoto.startsWith('data:image/'))
    );

    if (recordsWithBase64.length > 0) {
      console.log(`[Media-Sync] Background syncing ${recordsWithBase64.length} records with local media...`);
      for (const reg of recordsWithBase64) {
        try {
          let modified = false;
          const updatedReg = { ...reg };

          if (updatedReg.userPortraitPhoto?.startsWith('data:image/')) {
            const url = await uploadDocumentPhoto(updatedReg.userPortraitPhoto, 'permits/portraits');
            if (url && url !== updatedReg.userPortraitPhoto) {
              updatedReg.userPortraitPhoto = url;
              modified = true;
            }
          }
          if (updatedReg.nationalIdPhoto?.startsWith('data:image/')) {
            const url = await uploadDocumentPhoto(updatedReg.nationalIdPhoto, 'permits/national_ids');
            if (url && url !== updatedReg.nationalIdPhoto) {
              updatedReg.nationalIdPhoto = url;
              modified = true;
            }
          }
          if (updatedReg.drivingLicensePhoto?.startsWith('data:image/')) {
            const url = await uploadDocumentPhoto(updatedReg.drivingLicensePhoto, 'permits/licenses');
            if (url && url !== updatedReg.drivingLicensePhoto) {
              updatedReg.drivingLicensePhoto = url;
              modified = true;
            }
          }
          if (updatedReg.drivingPermitPhoto?.startsWith('data:image/')) {
            const url = await uploadDocumentPhoto(updatedReg.drivingPermitPhoto, 'permits/police_permits');
            if (url && url !== updatedReg.drivingPermitPhoto) {
              updatedReg.drivingPermitPhoto = url;
              modified = true;
            }
          }

          if (modified) {
            inMemory.registrations = inMemory.registrations.map((r) => r.id === reg.id ? updatedReg : r);
            await upsertDocument(FIREBASE_COLLECTIONS.REGISTRATIONS, updatedReg.id, updatedReg).catch(() => {});
            saveStateToLocalStorage();
          }
        } catch (imgErr) {
          console.warn(`[Media-Sync] Deferred image sync skipped for record ${reg.id}:`, imgErr);
        }
      }
    }
  } catch (err) {
    console.warn('[Media-Sync] Deferred image sync finished with notice:', err);
  } finally {
    isImageSyncingRunning = false;
  }
}

export function scheduleDeferredImageSync(): void {
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        syncImagesAndMediaDeferred().catch(() => {});
      }, { timeout: 3000 });
    } else {
      setTimeout(() => {
        syncImagesAndMediaDeferred().catch(() => {});
      }, 1500);
    }
  }
}

// --- LOCAL STORAGE SYNCHRONIZER & CLOUD FIRESTORE SYNCHRONIZER ---
export async function syncAllCollectionsWithDb(): Promise<void> {
  return trackGlobalAction(
    async () => {
      // First load from local storage to show instant cached data
      loadStateFromLocalStorage();
      lastSyncTime = new Date();
      isCloudConnected = true;
      notifySyncStatus();
      setGlobalFirestoreError(null);

      // If Firebase is configured and active, sync with cloud in the background concurrently
      if (isFirebaseConfigured()) {
        try {
          console.log('[Sync] Initializing parallel synchronization with Cloud Firestore...');
          
          const [
            settingsRes,
            regsRes,
            officersRes,
            ordersRes,
            verifsRes,
            unregRes,
            receiptsRes,
          ] = await Promise.allSettled([
            getDocument<SystemSettings>(FIREBASE_COLLECTIONS.SETTINGS, 'global_config'),
            fetchAllDocuments<MotorcycleRegistration>(FIREBASE_COLLECTIONS.REGISTRATIONS),
            fetchAllDocuments<OfficerAssignment>(FIREBASE_COLLECTIONS.OFFICERS),
            fetchAllDocuments<PrintBatchOrder>(FIREBASE_COLLECTIONS.PRINT_ORDERS),
            fetchAllDocuments<VerificationLog>(FIREBASE_COLLECTIONS.VERIFICATIONS),
            fetchAllDocuments<UnregisteredVehicleReport>(FIREBASE_COLLECTIONS.UNREGISTERED_REPORTS),
            fetchAllDocuments<PaymentReceipt>(FIREBASE_COLLECTIONS.PAYMENT_RECEIPTS),
          ]);

          if (settingsRes.status === 'fulfilled' && settingsRes.value) {
            const cloudSettings = settingsRes.value;
            const wasReset = checkAndApplySystemResetIfNewer(cloudSettings);
            if (!wasReset) {
              inMemory.settings = { ...DEFAULT_SETTINGS, ...cloudSettings };
              notifySettings();
            }
          }

          if (regsRes.status === 'fulfilled' && Array.isArray(regsRes.value) && regsRes.value.length > 0) {
            inMemory.registrations = mergeById(regsRes.value, inMemory.registrations);
            notifyRegistrations();
          }

          if (officersRes.status === 'fulfilled' && Array.isArray(officersRes.value) && officersRes.value.length > 0) {
            inMemory.officers = mergeById(officersRes.value, inMemory.officers);
            notifyOfficers();
          }

          if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value) && ordersRes.value.length > 0) {
            inMemory.printOrders = mergeById(ordersRes.value, inMemory.printOrders);
            notifyPrintOrders();
          }

          if (verifsRes.status === 'fulfilled' && Array.isArray(verifsRes.value) && verifsRes.value.length > 0) {
            inMemory.verifications = mergeById(verifsRes.value, inMemory.verifications);
            notifyVerifications();
          }

          if (unregRes.status === 'fulfilled' && Array.isArray(unregRes.value) && unregRes.value.length > 0) {
            inMemory.unregisteredReports = mergeById(unregRes.value, inMemory.unregisteredReports);
            notifyUnregisteredReports();
          }

          if (receiptsRes.status === 'fulfilled' && Array.isArray(receiptsRes.value) && receiptsRes.value.length > 0) {
            inMemory.paymentReceipts = mergeById(receiptsRes.value, inMemory.paymentReceipts);
            notifyPaymentReceipts();
          }

          lastSyncTime = new Date();
          isCloudConnected = true;
          notifySyncStatus();
          saveStateToLocalStorage();

          // Phase 2: Deferred image syncing runs strictly AFTER all other data loading is finished
          scheduleDeferredImageSync();
        } catch (err: any) {
          console.warn('[Sync] Firestore sync notice (falling back to local cache):', err?.message);
          isCloudConnected = false;
          notifySyncStatus();
        }
      }
    },
    'መረጃዎች ከዳታቤዝ ጋር እየተመሳሰሉ ነው...',
    'Syncing database records...'
  );
}

// --- SYSTEM USERS & AUDIT LOG MANAGEMENT ---
const DEFAULT_PRESET_USERS: SystemUser[] = [
  {
    uid: 'user-clerk-CLERK-001',
    id: 'user-clerk-CLERK-001',
    badgeId: 'CLERK-001',
    email: 'clerk@permit.gov.et',
    role: 'clerk',
    fullName: 'Abebe Bekele (Clerk)',
    status: 'active',
    createdAt: '2026-08-22T20:46:29-07:00',
  },
  {
    uid: 'user-officer-OFFICER-8842',
    id: 'user-officer-OFFICER-8842',
    badgeId: 'OFFICER-8842',
    email: 'officer@permit.gov.et',
    role: 'officer',
    fullName: 'Officer Solomon Desta',
    status: 'active',
    createdAt: '2026-08-22T20:46:29-07:00',
  },
  {
    uid: 'user-admin-ADMIN-PRO-1',
    id: 'user-admin-ADMIN-PRO-1',
    badgeId: 'ADMIN-PRO-1',
    email: 'admin@permit.gov.et',
    role: 'admin',
    fullName: 'Tigist Alemu (System Admin)',
    status: 'active',
    createdAt: '2026-08-22T20:46:29-07:00',
  },
  {
    uid: 'user-superadmin-SUPER-ADMIN-01',
    id: 'user-superadmin-SUPER-ADMIN-01',
    badgeId: 'SUPER-ADMIN-01',
    email: 'superadmin@permit.gov.et',
    role: 'superadmin',
    fullName: 'Kaleb Tadesse (Chief Super Admin)',
    status: 'active',
    createdAt: '2026-08-22T20:46:29-07:00',
  }
];

export function subscribeSystemUsers(cb: (users: SystemUser[]) => void): () => void {
  DEFAULT_PRESET_USERS.forEach((pu) => {
    const exists = inMemory.users.some(
      (u) => u.badgeId === pu.badgeId || u.uid === pu.uid || u.id === pu.id
    );
    if (!exists) {
      inMemory.users.push(pu);
    }
  });

  cb([...inMemory.users]);
  listeners.users.add(cb);

  // Sync from DB immediately
  fetchSystemUsersFromDb().catch(() => {});

  return () => {
    listeners.users.delete(cb);
  };
}

export function subscribeAuditLogs(cb: (logs: SystemAuditLog[]) => void): () => void {
  cb([...inMemory.auditLogs]);
  listeners.auditLogs.add(cb);
  return () => {
    listeners.auditLogs.delete(cb);
  };
}

export async function fetchSystemUsersFromDb(): Promise<SystemUser[]> {
  try {
    const res = await fetch('/api/auth/users').then((r) => r.json()).catch(() => null);
    if (res && res.success && Array.isArray(res.users) && res.users.length > 0) {
      const mappedUsers: SystemUser[] = res.users.map((u: any) => ({ ...u, id: u.id || u.uid }));
      inMemory.users = mergeById(mappedUsers, inMemory.users);
      notifyUsers();
      return inMemory.users;
    }
  } catch {}
  return inMemory.users;
}

export async function saveSystemUserToDb(user: SystemUser): Promise<void> {
  return trackGlobalAction(
    async () => {
      const userId = user.uid || user.id || `user-${user.role || 'clerk'}-${user.badgeId || Date.now()}`;
      const formatted: SystemUser = {
        ...user,
        id: userId,
        uid: userId,
        status: user.status || 'active',
        createdAt: user.createdAt || new Date().toISOString(),
      };
      const idx = inMemory.users.findIndex((u) => u.uid === userId || u.badgeId === user.badgeId);
      if (idx >= 0) {
        inMemory.users[idx] = formatted;
      } else {
        inMemory.users.unshift(formatted);
      }
      notifyUsers();

      try {
        await fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formatted),
        }).catch(() => {});
        if (isFirebaseConfigured()) {
          await upsertDocument(FIREBASE_COLLECTIONS.USERS, userId, formatted).catch(() => {});
        }
      } catch {}
    },
    'የተጠቃሚ መረጃ እየተቀመጠ ነው...',
    'Saving user account...'
  );
}

export async function updateSystemUserInDb(userId: string, updates: Partial<SystemUser>): Promise<void> {
  return trackGlobalAction(
    async () => {
      const idx = inMemory.users.findIndex((u) => u.uid === userId || u.badgeId === userId);
      if (idx >= 0) {
        inMemory.users[idx] = { ...inMemory.users[idx], ...updates };
        notifyUsers();
      }
      try {
        await fetch('/api/auth/users/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: userId, updates }),
        }).catch(() => {});
        if (isFirebaseConfigured()) {
          await updateDocumentFields(FIREBASE_COLLECTIONS.USERS, userId, updates).catch(() => {});
        }
      } catch {}
    },
    'የተጠቃሚ መረጃ እየተዘመነ ነው...',
    'Updating user account...'
  );
}

export async function deleteSystemUserFromDb(userId: string): Promise<void> {
  return trackGlobalAction(
    async () => {
      inMemory.users = inMemory.users.filter((u) => u.uid !== userId && u.badgeId !== userId);
      notifyUsers();
      try {
        await fetch(`/api/auth/users/${userId}`, { method: 'DELETE' }).catch(() => {});
        if (isFirebaseConfigured()) {
          await deleteDocument(FIREBASE_COLLECTIONS.USERS, userId).catch(() => {});
        }
      } catch {}
    },
    'ተጠቃሚው እየተሰረዘ ነው...',
    'Deleting user account...'
  );
}

const INITIAL_PERMISSIONS: Record<string, Record<number, 'allow' | 'view_only' | 'deny'>> = {
  'role-secretary': {
    1: 'allow', 2: 'allow', 3: 'allow', 4: 'allow', 5: 'deny',
    6: 'allow', 7: 'allow', 8: 'allow', 9: 'allow', 10: 'allow',
    11: 'deny', 12: 'deny', 13: 'deny', 14: 'deny',
    15: 'deny', 16: 'deny'
  },
  'role-officer': {
    1: 'deny', 2: 'deny', 3: 'deny', 4: 'deny', 5: 'allow',
    6: 'allow', 7: 'allow', 8: 'view_only', 9: 'view_only', 10: 'deny',
    11: 'deny', 12: 'deny', 13: 'deny', 14: 'deny',
    15: 'deny', 16: 'deny'
  },
  'role-manager': {
    1: 'allow', 2: 'allow', 3: 'allow', 4: 'allow', 5: 'allow',
    6: 'allow', 7: 'allow', 8: 'allow', 9: 'allow', 10: 'allow',
    11: 'view_only', 12: 'view_only', 13: 'deny', 14: 'deny',
    15: 'allow', 16: 'allow'
  },
  'role-it': {
    1: 'view_only', 2: 'view_only', 3: 'view_only', 4: 'view_only', 5: 'allow',
    6: 'view_only', 7: 'view_only', 8: 'view_only', 9: 'view_only', 10: 'view_only',
    11: 'allow', 12: 'allow', 13: 'allow', 14: 'allow',
    15: 'allow', 16: 'allow'
  },
  'role-superadmin': {
    1: 'allow', 2: 'allow', 3: 'allow', 4: 'allow', 5: 'allow',
    6: 'allow', 7: 'allow', 8: 'allow', 9: 'allow', 10: 'allow',
    11: 'allow', 12: 'allow', 13: 'allow', 14: 'allow',
    15: 'allow', 16: 'allow'
  }
};

export function getRoleIdFromUserRole(role: string): string {
  switch (role) {
    case 'clerk': return 'role-secretary';
    case 'officer': return 'role-officer';
    case 'admin': return 'role-manager';
    case 'it_specialist': return 'role-it';
    case 'superadmin':
    case 'super_admin': return 'role-superadmin';
    default:
      if (role && role.startsWith('role-')) return role;
      return role ? `role-${role}` : 'role-secretary';
  }
}

export function getPermissionState(userRole: string, taskId: number): 'allow' | 'view_only' | 'deny' {
  // Super Admin always has full permission across all system tasks
  if (userRole === 'superadmin' || userRole === 'super_admin' || userRole === 'role-superadmin') {
    return 'allow';
  }
  const saved = localStorage.getItem('permit_role_permissions');
  let matrix = null;
  if (saved) {
    try {
      matrix = JSON.parse(saved);
    } catch (e) {}
  }
  const roleId = getRoleIdFromUserRole(userRole);
  const rolePerms = matrix?.[roleId] || INITIAL_PERMISSIONS[roleId];
  if (!rolePerms) {
    return 'deny';
  }
  const state = rolePerms[taskId];
  return state || 'deny';
}

export function isTaskAllowed(userRole: string, taskId: number): boolean {
  if (userRole === 'superadmin' || userRole === 'super_admin' || userRole === 'role-superadmin') {
    return true;
  }
  return getPermissionState(userRole, taskId) === 'allow';
}

export function isTaskViewable(userRole: string, taskId: number): boolean {
  if (userRole === 'superadmin' || userRole === 'super_admin' || userRole === 'role-superadmin') {
    return true;
  }
  const state = getPermissionState(userRole, taskId);
  return state === 'allow' || state === 'view_only';
}

export async function clearCollectionInFirestore(collectionName: string): Promise<void> {
  try {
    const docs = await fetchAllDocuments(collectionName);
    if (Array.isArray(docs) && docs.length > 0) {
      await Promise.allSettled(
        docs.map((doc: any) => {
          if (doc?.id) {
            return deleteDocument(collectionName, doc.id);
          }
          return Promise.resolve();
        })
      );
    }
  } catch (err) {
    console.warn(`Notice clearing Firestore collection ${collectionName}:`, err);
  }
}

export async function resetSystemToFactoryDefaults(): Promise<void> {
  return trackGlobalAction(
    async () => {
      const resetEpoch = Date.now();
      const resetIso = new Date().toISOString();
      console.log(`[Reset] Resetting entire system database across client & server (Epoch: ${resetEpoch})...`);

      // 1. Instantly clear in-memory state and set reset epoch
      inMemory.registrations = [];
      inMemory.officers = [];
      inMemory.printOrders = [];
      inMemory.verifications = [];
      inMemory.unregisteredReports = [];
      inMemory.paymentReceipts = [];
      inMemory.auditLogs = [];
      inMemory.settings = {
        ...DEFAULT_SETTINGS,
        systemResetEpoch: resetEpoch,
        lastSystemResetAt: resetIso,
      };

      saveStoredLastAckResetEpoch(resetEpoch);
      clearAllLocalStoredData();
      saveStateToLocalStorage();

      // 3. Notify all application listeners immediately
      notifyRegistrations();
      notifyOfficers();
      notifyPrintOrders();
      notifyVerifications();
      notifyUnregisteredReports();
      notifyPaymentReceipts();
      notifyAuditLogs();
      notifySettings();

      // 4. Wipe server-side Firestore via API
      try {
        await safeJsonFetch('/api/reset-database', {
          method: 'POST',
          body: JSON.stringify({ systemResetEpoch: resetEpoch, lastSystemResetAt: resetIso }),
        });
      } catch (err) {
        console.warn('Backend reset-database API notice:', err);
      }

      // 5. Purge direct client Firestore collections to guarantee no residual records remain
      try {
        await Promise.allSettled([
          clearCollectionInFirestore(FIREBASE_COLLECTIONS.REGISTRATIONS),
          clearCollectionInFirestore(FIREBASE_COLLECTIONS.OFFICERS),
          clearCollectionInFirestore(FIREBASE_COLLECTIONS.PRINT_ORDERS),
          clearCollectionInFirestore(FIREBASE_COLLECTIONS.VERIFICATIONS),
          clearCollectionInFirestore(FIREBASE_COLLECTIONS.UNREGISTERED_REPORTS),
          clearCollectionInFirestore(FIREBASE_COLLECTIONS.PAYMENT_RECEIPTS),
          clearCollectionInFirestore(FIREBASE_COLLECTIONS.AUDIT_LOGS),
        ]);

        await upsertDocument(FIREBASE_COLLECTIONS.SETTINGS, 'global_config', {
          id: 'global_config',
          ...DEFAULT_SETTINGS,
          systemResetEpoch: resetEpoch,
          lastSystemResetAt: resetIso,
        }).catch(() => {});
      } catch (err) {
        console.warn('Direct Firestore reset purge notice:', err);
      }
    },
    'ዳታቤዙ ወደ ፋብሪካ ቅንብር እየተመለሰ ነው...',
    'Resetting system database...'
  );
}

export const resetDatabaseInDb = resetSystemToFactoryDefaults;

export async function purgeRejectedRegistrations(): Promise<number> {
  return trackGlobalAction(
    async () => {
      const rejected = inMemory.registrations.filter((r) => r.status === 'rejected');
      inMemory.registrations = inMemory.registrations.filter((r) => r.status !== 'rejected');
      
      saveStateToLocalStorage();
      notifyRegistrations();

      // Remove all rejected items from Firestore
      try {
        await Promise.allSettled(
          rejected.map((item) => deleteDocument(FIREBASE_COLLECTIONS.REGISTRATIONS, item.id))
        );
      } catch (err) {
        console.warn('Notice during Firestore rejected registrations purge:', err);
      }

      return rejected.length;
    },
    'ውድቅ የሆኑት እየተጸዱ ነው...',
    'Purging rejected records...'
  );
}

export async function clearAllAuditLogs(): Promise<void> {
  inMemory.auditLogs = [];
  saveStateToLocalStorage();
  notifyAuditLogs();
  try {
    await clearCollectionInFirestore(FIREBASE_COLLECTIONS.AUDIT_LOGS);
  } catch (err) {
    console.warn('Firestore clear audit logs notice:', err);
  }
}

export async function clearAllVerificationLogs(): Promise<void> {
  inMemory.verifications = [];
  saveStateToLocalStorage();
  notifyVerifications();
  try {
    await clearCollectionInFirestore(FIREBASE_COLLECTIONS.VERIFICATIONS);
  } catch (err) {
    console.warn('Firestore clear verifications notice:', err);
  }
}

export async function importFullDatabaseBackup(backupData: {
  users?: SystemUser[];
  registrations?: MotorcycleRegistration[];
  officers?: OfficerAssignment[];
  auditLogs?: SystemAuditLog[];
  unregisteredReports?: UnregisteredVehicleReport[];
  paymentReceipts?: PaymentReceipt[];
  settings?: SystemSettings;
}): Promise<{ success: boolean; importedCounts: Record<string, number> }> {
  const counts: Record<string, number> = {
    registrations: 0,
    users: 0,
    officers: 0,
    auditLogs: 0,
    unregisteredReports: 0,
    paymentReceipts: 0,
  };

  if (Array.isArray(backupData.registrations)) {
    inMemory.registrations = mergeById(backupData.registrations, inMemory.registrations);
    counts.registrations = backupData.registrations.length;
    notifyRegistrations();
  }

  if (Array.isArray(backupData.users)) {
    inMemory.users = mergeById(backupData.users, inMemory.users);
    counts.users = backupData.users.length;
    notifyUsers();
  }

  if (Array.isArray(backupData.officers)) {
    inMemory.officers = mergeById(backupData.officers, inMemory.officers);
    counts.officers = backupData.officers.length;
    notifyOfficers();
  }

  if (Array.isArray(backupData.unregisteredReports)) {
    inMemory.unregisteredReports = mergeById(backupData.unregisteredReports, inMemory.unregisteredReports);
    counts.unregisteredReports = backupData.unregisteredReports.length;
    notifyUnregisteredReports();
  }

  if (Array.isArray(backupData.paymentReceipts)) {
    inMemory.paymentReceipts = mergeById(backupData.paymentReceipts, inMemory.paymentReceipts);
    counts.paymentReceipts = backupData.paymentReceipts.length;
    notifyPaymentReceipts();
  }

  if (Array.isArray(backupData.auditLogs)) {
    inMemory.auditLogs = [...backupData.auditLogs, ...inMemory.auditLogs].slice(0, 200);
    counts.auditLogs = backupData.auditLogs.length;
    notifyAuditLogs();
  }

  if (backupData.settings) {
    inMemory.settings = { ...DEFAULT_SETTINGS, ...backupData.settings };
    notifySettings();
  }

  saveStateToLocalStorage();
  await syncAllCollectionsWithDb().catch(() => {});

  return { success: true, importedCounts: counts };
}


export async function addAuditLogToDb(log: Omit<SystemAuditLog, 'id' | 'timestamp'>): Promise<void> {
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const fullLog: SystemAuditLog = {
    id,
    timestamp: new Date().toISOString(),
    ...log,
  };
  inMemory.auditLogs.unshift(fullLog);
  if (inMemory.auditLogs.length > 200) inMemory.auditLogs = inMemory.auditLogs.slice(0, 200);
  notifyAuditLogs();
  try {
    if (isFirebaseConfigured()) {
      await upsertDocument(FIREBASE_COLLECTIONS.AUDIT_LOGS, id, fullLog).catch(() => {});
    }
  } catch {}
}
