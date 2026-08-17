import { UserRole, Language } from '../types';

const KEYS = {
  AUTH: 'bd_motor_auth_session',
  LANG: 'bd_motor_lang',
  THEME: 'bd_motor_theme',
  ACTIVE_PAGE: 'bd_motor_active_page',
};

// Immediate cleanup: Remove any legacy offline cache keys from browser LocalStorage
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'permit_offline_cache',
      'bd_motor_registrations',
      'bd_motor_officer_assignments',
      'bd_motor_print_batch_orders',
      'bd_motor_verification_logs',
      'bd_motor_settings',
      'bd_motor_last_scan_result',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('Silent legacy cache cleanup error:', err);
  }
}

export interface AuthSession {
  isLoggedIn: boolean;
  userBadgeId: string;
  userRole: UserRole;
}

export function getStoredItem<T>(_key: string, defaultValue: T): T {
  // LocalStorage data loading disabled for now
  return defaultValue;
}

export function setStoredItem<T>(_key: string, _value: T): void {
  // LocalStorage saving disabled/noop for now
}

export function removeStoredItem(_key: string): void {
  // LocalStorage remove disabled/noop for now
}

// UI & Session State
export function getStoredAuthSession(): AuthSession | null {
  // LocalStorage session loading disabled
  return null;
}

export function saveAuthSession(_session: AuthSession | null): void {
  // Noop
}

export function getStoredLang(): Language {
  return 'en';
}

export function saveLang(_lang: Language): void {
  // Noop
}

export function getStoredTheme(): 'light' | 'dark' {
  return 'light';
}

export function saveTheme(_theme: 'light' | 'dark'): void {
  // Noop
}

export function getStoredActivePage(): 'dashboard' | 'forms' | 'tables' | 'workstation' | 'scan' | 'settings' {
  return 'dashboard';
}

export function saveActivePage(_page: 'dashboard' | 'forms' | 'tables' | 'workstation' | 'scan' | 'settings'): void {
  // Noop
}

