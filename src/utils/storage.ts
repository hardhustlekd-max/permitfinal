import { MotorcycleRegistration, OfficerAssignment, PrintBatchOrder, UserRole, Language } from '../types';
import { initialRegistrations, initialOfficerAssignments, initialPrintBatchOrders } from '../mockData';

const KEYS = {
  REGISTRATIONS: 'bd_motor_registrations',
  OFFICERS: 'bd_motor_officer_assignments',
  PRINT_ORDERS: 'bd_motor_print_batch_orders',
  AUTH: 'bd_motor_auth_session',
  LANG: 'bd_motor_lang',
  ACTIVE_PAGE: 'bd_motor_active_page',
  SETTINGS: 'bd_motor_settings',
};

export interface AuthSession {
  isLoggedIn: boolean;
  userBadgeId: string;
  userRole: UserRole;
}

export interface SystemSettings {
  officerName: string;
  department: string;
  subCityOffice: string;
  defaultPrinter: string;
  cardStockType: string;
  calendarSystem: 'ethiopian' | 'gregorian';
  autoPrintQR: boolean;
  emailAlerts: boolean;
  security2FA: boolean;
  highRiskAlerts: boolean;
}

export function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return defaultValue;
  }
}

export function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key "${key}" to localStorage:`, error);
  }
}

export function removeStoredItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing key "${key}" from localStorage:`, error);
  }
}

// Domain specific helpers
export function getStoredRegistrations(): MotorcycleRegistration[] {
  return getStoredItem<MotorcycleRegistration[]>(KEYS.REGISTRATIONS, initialRegistrations);
}

export function saveRegistrations(registrations: MotorcycleRegistration[]): void {
  setStoredItem(KEYS.REGISTRATIONS, registrations);
}

export function getStoredOfficers(): OfficerAssignment[] {
  return getStoredItem<OfficerAssignment[]>(KEYS.OFFICERS, initialOfficerAssignments);
}

export function saveOfficers(officers: OfficerAssignment[]): void {
  setStoredItem(KEYS.OFFICERS, officers);
}

export function getStoredPrintOrders(): PrintBatchOrder[] {
  return getStoredItem<PrintBatchOrder[]>(KEYS.PRINT_ORDERS, initialPrintBatchOrders);
}

export function savePrintOrders(orders: PrintBatchOrder[]): void {
  setStoredItem(KEYS.PRINT_ORDERS, orders);
}

export function getStoredAuthSession(): AuthSession | null {
  return getStoredItem<AuthSession | null>(KEYS.AUTH, null);
}

export function saveAuthSession(session: AuthSession | null): void {
  if (session) {
    setStoredItem(KEYS.AUTH, session);
  } else {
    removeStoredItem(KEYS.AUTH);
  }
}

export function getStoredLang(): Language {
  return getStoredItem<Language>(KEYS.LANG, 'en');
}

export function saveLang(lang: Language): void {
  setStoredItem(KEYS.LANG, lang);
}

export function getStoredActivePage(): 'dashboard' | 'forms' | 'tables' | 'workstation' | 'settings' {
  return getStoredItem<'dashboard' | 'forms' | 'tables' | 'workstation' | 'settings'>(KEYS.ACTIVE_PAGE, 'dashboard');
}

export function saveActivePage(page: 'dashboard' | 'forms' | 'tables' | 'workstation' | 'settings'): void {
  setStoredItem(KEYS.ACTIVE_PAGE, page);
}

export function getStoredSettings(): SystemSettings {
  const defaultSettings: SystemSettings = {
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
  return getStoredItem<SystemSettings>(KEYS.SETTINGS, defaultSettings);
}

export function saveSettings(settings: SystemSettings): void {
  setStoredItem(KEYS.SETTINGS, settings);
}
