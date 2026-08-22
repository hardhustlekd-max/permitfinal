import { UserRole, Language } from '../types';

export const KEYS = {
  AUTH: 'bd_motor_auth_session',
  LANG: 'bd_motor_lang',
  THEME: 'bd_motor_theme',
  ACTIVE_PAGE: 'bd_motor_active_page',
  APP_STATE: 'bd_motor_app_state_cache',
};

export interface AuthSession {
  isLoggedIn: boolean;
  userBadgeId: string;
  userRole: UserRole;
}

export function getStoredItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.warn(`Error reading localStorage key "${key}":`, e);
    return defaultValue;
  }
}

export function setStoredItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing localStorage key "${key}":`, e);
  }
}

export function removeStoredItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Error removing localStorage key "${key}":`, e);
  }
}

// UI & Session State
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
  return getStoredItem<Language>(KEYS.LANG, 'am');
}

export function saveLang(lang: Language): void {
  setStoredItem(KEYS.LANG, lang);
}

export function getStoredTheme(): 'light' | 'dark' {
  return getStoredItem<'light' | 'dark'>(KEYS.THEME, 'light');
}

export function saveTheme(theme: 'light' | 'dark'): void {
  setStoredItem(KEYS.THEME, theme);
}

export function getStoredActivePage(): 'dashboard' | 'forms' | 'tables' | 'workstation' | 'scan' | 'settings' {
  return getStoredItem<'dashboard' | 'forms' | 'tables' | 'workstation' | 'scan' | 'settings'>(KEYS.ACTIVE_PAGE, 'dashboard');
}

export function saveActivePage(page: 'dashboard' | 'forms' | 'tables' | 'workstation' | 'scan' | 'settings'): void {
  setStoredItem(KEYS.ACTIVE_PAGE, page);
}

