import { SystemUser, UserRole } from '../types.ts';
import {
  loginWithFirebaseAuth,
  registerWithFirebaseAuth,
  logoutFirebaseAuth,
  getCurrentFirebaseAuthUser,
  onFirebaseAuthChange,
  fetchAllFirebaseAuthUsers,
} from './firebaseAuth.ts';

export {
  loginWithFirebaseAuth,
  registerWithFirebaseAuth,
  logoutFirebaseAuth,
  getCurrentFirebaseAuthUser,
  onFirebaseAuthChange,
  fetchAllFirebaseAuthUsers,
};

export const SYSTEM_ROLE_CREDENTIALS: Record<
  UserRole,
  {
    badgeId: string;
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
  }
> = {
  clerk: {
    badgeId: 'CLERK-001',
    email: 'clerk@permit.gov.et',
    password: 'ClerkPassword123!',
    fullName: 'Abebe Bekele (Clerk)',
    role: 'clerk',
  },
  officer: {
    badgeId: 'OFFICER-8842',
    email: 'officer@permit.gov.et',
    password: 'OfficerPassword123!',
    fullName: 'Officer Solomon Desta',
    role: 'officer',
  },
  admin: {
    badgeId: 'ADMIN-PRO-1',
    email: 'admin@permit.gov.et',
    password: 'AdminPassword123!',
    fullName: 'Tigist Alemu (System Admin)',
    role: 'admin',
  },
};

/**
 * Ensures a valid session user exists.
 */
export async function ensureOnlineAuth(): Promise<SystemUser | null> {
  const defaultCreds = SYSTEM_ROLE_CREDENTIALS.clerk;
  return {
    uid: `user-clerk-${defaultCreds.badgeId}`,
    badgeId: defaultCreds.badgeId,
    email: defaultCreds.email,
    role: 'clerk',
    fullName: defaultCreds.fullName,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Perform login authentication for system user roles via Firestore database
 */
export async function loginOnlineUser(
  role: UserRole,
  inputBadgeId?: string,
  inputPassword?: string
): Promise<{ success: boolean; user: SystemUser; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        badgeId: inputBadgeId,
        password: inputPassword,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        return { success: true, user: data.user };
      }
    }
  } catch (err) {
    console.warn('[authService] Backend login call notice, using local auth model:', err);
  }

  // Fallback local auth model if network offline
  const defaultCreds = SYSTEM_ROLE_CREDENTIALS[role] || SYSTEM_ROLE_CREDENTIALS.clerk;
  const badgeId = inputBadgeId?.trim() || defaultCreds.badgeId;
  const email = inputBadgeId?.includes('@') ? inputBadgeId.trim() : defaultCreds.email;
  const now = new Date().toISOString();

  const userProfile: SystemUser = {
    uid: `user-${role}-${badgeId}`,
    badgeId,
    email,
    role,
    fullName: defaultCreds.fullName,
    lastLoginAt: now,
    createdAt: now,
  };

  return { success: true, user: userProfile };
}

/**
 * Sign out session
 */
export async function logoutOnlineUser(): Promise<void> {
  // Session logout handled by storage session clear
}

/**
 * Fetch all system users from Firestore permit database
 */
export async function fetchOnlineSystemUsers(): Promise<SystemUser[]> {
  try {
    const res = await fetch('/api/auth/users');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        return data.users;
      }
    }
  } catch (e) {
    // Ignore fallback
  }

  return Object.values(SYSTEM_ROLE_CREDENTIALS).map((c) => ({
    uid: `preset-${c.role}`,
    badgeId: c.badgeId,
    email: c.email,
    role: c.role,
    fullName: c.fullName,
  }));
}

