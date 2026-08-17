import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ override: true });
import {
  isFirebaseConfigured,
  firebaseConfig,
  ADMIN_COLLECTIONS,
  adminFetchAllDocuments,
  adminGetDocument,
  adminUpsertDocument,
  adminUpdateDocumentFields,
  adminDeleteDocument,
  adminClearCollection,
} from './src/db/index.ts';
const DEFAULT_SETTINGS = {
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

const SYSTEM_ROLE_CREDENTIALS = {
  clerk: {
    role: 'clerk',
    badgeId: 'CLERK-209',
    email: 'clerk@addisababa.gov.et',
    fullName: 'ሳራ ተሾመ (Sara Teshome)',
  },
  admin: {
    role: 'admin',
    badgeId: 'ADMIN-001',
    email: 'admin@addisababa.gov.et',
    fullName: 'ዳዊት ኃይሌ (Dawit Haile)',
  },
  officer: {
    role: 'officer',
    badgeId: 'OFFICER-442',
    email: 'officer@addisababa.gov.et',
    fullName: 'አበበ ደስታ (Abebe Desta)',
  },
};

export const app = express();
const PORT = 3000;

// JSON body parser with increased limits for handling document and portrait photos
app.use(express.json({ limit: '15mb' }));

// Vercel serverless path normalization middleware
app.use((req, res, next) => {
  if (req.url.startsWith('/api/index.ts')) {
    req.url = req.url.replace('/api/index.ts', '/api');
    if (req.url === '/api' || req.url === '/api/') {
      req.url = '/api/health';
    }
  }
  next();
});

console.log(`[Firebase Admin Server] Initialized with Firebase Admin SDK for Firestore (Database: "${firebaseConfig.firestoreDatabaseId || 'permit'}")`);

// Helper to seed initial default users into database if empty
let defaultUsersSeeded = false;
async function ensureDefaultUsersExist() {
  if (defaultUsersSeeded) return;
  try {
    const existingUsers = await adminFetchAllDocuments(ADMIN_COLLECTIONS.USERS);
    if (!existingUsers || existingUsers.length === 0) {
      console.log('[Firebase Admin] Seeding default system role users into Firestore permit database...');
      const defaultUsers = Object.values(SYSTEM_ROLE_CREDENTIALS).map((cred) => ({
        id: `user-${cred.role}-${cred.badgeId}`,
        uid: `user-${cred.role}-${cred.badgeId}`,
        badgeId: cred.badgeId,
        email: cred.email,
        fullName: cred.fullName,
        role: cred.role,
        createdAt: new Date().toISOString(),
      }));
      for (const u of defaultUsers) {
        await adminUpsertDocument(ADMIN_COLLECTIONS.USERS, u.id, u);
      }
    }
    defaultUsersSeeded = true;
  } catch (err) {
    console.warn('[Firebase Admin] Notice on default user seed:', err);
  }
}

// --- API ROUTE ENDPOINTS ---

// Health probe
app.get('/api/health', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      database: 'firebase-admin',
      databaseId: firebaseConfig.firestoreDatabaseId || 'permit',
      configured: isFirebaseConfigured(),
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message || String(err) });
  }
});

// --- AUTHENTICATION ENDPOINTS ---

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { role, badgeId, password } = req.body;
    const cleanBadge = badgeId ? String(badgeId).trim() : '';

    // Search existing user document in Firestore permit database
    const users = await adminFetchAllDocuments(ADMIN_COLLECTIONS.USERS);
    let matchedUser = users.find(
      (u) =>
        u.badgeId?.toLowerCase() === cleanBadge.toLowerCase() ||
        u.email?.toLowerCase() === cleanBadge.toLowerCase()
    );

    if (!matchedUser) {
      const defaultCred = SYSTEM_ROLE_CREDENTIALS[role as keyof typeof SYSTEM_ROLE_CREDENTIALS] || SYSTEM_ROLE_CREDENTIALS.clerk;
      matchedUser = {
        id: `user-${role}-${cleanBadge || defaultCred.badgeId}`,
        uid: `user-${role}-${cleanBadge || defaultCred.badgeId}`,
        badgeId: cleanBadge || defaultCred.badgeId,
        email: cleanBadge.includes('@') ? cleanBadge : defaultCred.email,
        fullName: defaultCred.fullName,
        role: role || 'clerk',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      // Persist user to Firestore permit database
      await adminUpsertDocument(ADMIN_COLLECTIONS.USERS, matchedUser.id, matchedUser);
    } else {
      // Update last login timestamp in Firestore permit database
      matchedUser.lastLoginAt = new Date().toISOString();
      await adminUpdateDocumentFields(ADMIN_COLLECTIONS.USERS, matchedUser.id, {
        lastLoginAt: matchedUser.lastLoginAt,
      });
    }

    res.json({ success: true, user: matchedUser });
  } catch (err: any) {
    console.error('[Firebase Admin Auth] Login error:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// Fetch all system users
app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await adminFetchAllDocuments(ADMIN_COLLECTIONS.USERS);
    res.json({ success: true, users: users || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// 1. Sync All Collections in one HTTP payload directly from Firebase Firestore via Admin SDK
app.get('/api/sync', async (req, res) => {
  try {
    if (!isFirebaseConfigured()) {
      return res.json({
        registrations: [],
        officers: [],
        printOrders: [],
        verifications: [],
        settings: null,
        configured: false,
      });
    }

    const [registrations, officers, printOrders, verifications, settingsDoc] = await Promise.all([
      adminFetchAllDocuments(ADMIN_COLLECTIONS.REGISTRATIONS),
      adminFetchAllDocuments(ADMIN_COLLECTIONS.OFFICERS),
      adminFetchAllDocuments(ADMIN_COLLECTIONS.PRINT_ORDERS),
      adminFetchAllDocuments(ADMIN_COLLECTIONS.VERIFICATIONS),
      adminGetDocument(ADMIN_COLLECTIONS.SETTINGS, 'global_config'),
    ]);

    res.json({
      registrations: registrations || [],
      officers: officers || [],
      printOrders: printOrders || [],
      verifications: verifications || [],
      settings: settingsDoc || DEFAULT_SETTINGS,
      configured: true,
      fromCache: false,
    });
  } catch (err: any) {
    console.error('[Firebase Server] Sync notice:', err?.message || String(err));
    res.json({
      registrations: [],
      officers: [],
      printOrders: [],
      verifications: [],
      settings: null,
      configured: false,
      error: err.message || String(err),
    });
  }
});

// 2. Save Registration
app.post('/api/registrations', async (req, res) => {
  try {
    const reg = req.body;
    if (!reg.id) {
      return res.status(400).json({ success: false, error: 'Missing registration ID' });
    }

    if (!isFirebaseConfigured()) {
      return res.json({ success: true, warning: 'Saved locally (Firebase not configured)' });
    }

    await adminUpsertDocument(ADMIN_COLLECTIONS.REGISTRATIONS, reg.id, reg);
    res.json({ success: true });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error('[Firebase Server] Save registration failed:', errMsg);
    res.status(500).json({ success: false, error: errMsg });
  }
});

// 3. Update Registration Status
app.post('/api/registrations/status', async (req, res) => {
  try {
    const { id, status, rejectionReason } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing registration ID' });
    }

    if (!isFirebaseConfigured()) {
      return res.json({ success: true });
    }

    const updates: Record<string, any> = { status };
    if (rejectionReason !== undefined) {
      updates.rejectionReason = rejectionReason;
    }

    await adminUpdateDocumentFields(ADMIN_COLLECTIONS.REGISTRATIONS, id, updates);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Firebase Server] Update status failed:', err?.message || String(err));
    res.json({ success: true, warning: err.message || String(err) });
  }
});

// 4. Save Officer Assignment
app.post('/api/officers', async (req, res) => {
  try {
    const officer = req.body;
    if (!officer.id) {
      return res.status(400).json({ error: 'Missing officer ID' });
    }

    if (!isFirebaseConfigured()) {
      return res.json({ success: true });
    }

    await adminUpsertDocument(ADMIN_COLLECTIONS.OFFICERS, officer.id, officer);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Firebase Server] Save officer failed:', err?.message || String(err));
    res.json({ success: true, warning: err.message || String(err) });
  }
});

// 5. Update Officer fields
app.post('/api/officers/update', async (req, res) => {
  try {
    const { id, updates } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing officer ID' });
    }

    if (!isFirebaseConfigured()) {
      return res.json({ success: true });
    }

    await adminUpdateDocumentFields(ADMIN_COLLECTIONS.OFFICERS, id, updates);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Firebase Server] Update officer failed:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// 6. Save Print Order
app.post('/api/print-orders', async (req, res) => {
  try {
    const order = req.body;
    if (!order.id) {
      return res.status(400).json({ error: 'Missing print order ID' });
    }

    if (!isFirebaseConfigured()) {
      return res.json({ success: true });
    }

    await adminUpsertDocument(ADMIN_COLLECTIONS.PRINT_ORDERS, order.id, order);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Firebase Server] Save print order failed:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// 7. Update Print Order Status
app.post('/api/print-orders/status', async (req, res) => {
  try {
    const { id, status, notes } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing print order ID' });
    }

    if (!isFirebaseConfigured()) {
      return res.json({ success: true });
    }

    const updates: Record<string, any> = { status };
    if (notes !== undefined) updates.notes = notes;

    await adminUpdateDocumentFields(ADMIN_COLLECTIONS.PRINT_ORDERS, id, updates);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Firebase Server] Update print order failed:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// 8. Save Verification Log
app.post('/api/verification-logs', async (req, res) => {
  try {
    const log = req.body;
    if (!log.id) {
      return res.status(400).json({ error: 'Missing log ID' });
    }

    if (!isFirebaseConfigured()) {
      return res.json({ success: true });
    }

    await adminUpsertDocument(ADMIN_COLLECTIONS.VERIFICATIONS, log.id, log);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Firebase Server] Save verification log failed:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// 9. Save System Settings
app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    if (!isFirebaseConfigured()) {
      return res.json({ success: true });
    }

    await adminUpsertDocument(ADMIN_COLLECTIONS.SETTINGS, 'global_config', { id: 'global_config', ...settings });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Firebase Server] Save settings failed:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// 10. Delete existing and create fresh database (wipe all database records)
app.post('/api/reset-database', async (req, res) => {
  try {
    console.log('[Firebase Admin] Deleting all existing records and re-initializing fresh database state...');
    await Promise.all([
      adminClearCollection(ADMIN_COLLECTIONS.REGISTRATIONS),
      adminClearCollection(ADMIN_COLLECTIONS.OFFICERS),
      adminClearCollection(ADMIN_COLLECTIONS.PRINT_ORDERS),
      adminClearCollection(ADMIN_COLLECTIONS.VERIFICATIONS),
      adminClearCollection(ADMIN_COLLECTIONS.SETTINGS),
      adminClearCollection(ADMIN_COLLECTIONS.USERS),
    ]);

    // Seed default settings and system role users
    await adminUpsertDocument(ADMIN_COLLECTIONS.SETTINGS, 'global_config', { id: 'global_config', ...DEFAULT_SETTINGS });
    await ensureDefaultUsersExist();

    res.json({ success: true, message: 'Existing database completely deleted and fresh database initialized.' });
  } catch (err: any) {
    console.error('[Firebase Admin] Reset database error:', err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.post('/api/reset-data', async (req, res) => {
  try {
    await Promise.all([
      adminClearCollection(ADMIN_COLLECTIONS.REGISTRATIONS),
      adminClearCollection(ADMIN_COLLECTIONS.PRINT_ORDERS),
      adminClearCollection(ADMIN_COLLECTIONS.VERIFICATIONS),
    ]);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Firebase Server] Reset failed:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// 404 JSON fallback for unmatched /api routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.originalUrl || req.url} not found` });
});

// Global Express error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err?.message || String(err) });
});

// --- VITE MIDDLEWARE FOR DEVELOPMENT AND STATIC SERVING FOR PRODUCTION ---
if (!process.env.VERCEL) {
  async function startStandaloneServer() {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Full-stack Firebase Admin application running on http://localhost:${PORT}`);
    });
  }
  startStandaloneServer().catch((err) => {
    console.error('[Server] Failed to start standalone server:', err);
  });
}

export default app;
