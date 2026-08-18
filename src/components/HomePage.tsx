import React, { useState, useEffect } from 'react';
import {
  Language,
  UserRole,
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
  VerificationLog,
} from '../types';
import {
  getStoredActivePage,
  saveActivePage,
} from '../utils/storage';
import {
  subscribeRegistrations,
  subscribeOfficers,
  subscribePrintOrders,
  subscribeVerificationLogs,
  saveRegistrationToDb,
  updateRegistrationStatusInDb,
  saveOfficerToDb,
  savePrintOrderToDb,
  updatePrintOrderStatusInDb,
  saveVerificationLogToDb,
  syncAllCollectionsWithDb,
  seedSampleDatabaseData,
} from '../services/dbService';
import { MunicipalDashboardOverview } from './MunicipalDashboardOverview';
import { FormsPage } from './FormsPage';
import { TablesPage } from './TablesPage';
import { SettingsPage } from './SettingsPage';
import { SharedScannerModal } from './SharedScannerModal';
import { FirebaseQuotaWidget } from './FirebaseQuotaWidget';

interface HomePageProps {
  userBadgeId: string;
  userRole: UserRole;
  currentLang: Language;
  currentTheme?: 'light' | 'dark';
  onToggleLang: () => void;
  onToggleTheme?: () => void;
  onLogout: () => void;
  onSwitchRole?: (newRole: UserRole) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  userBadgeId,
  userRole,
  currentLang,
  currentTheme = 'light',
  onToggleLang,
  onToggleTheme,
  onLogout,
  onSwitchRole,
}) => {
  const isAmharic = currentLang === 'am';

  // Active top page navigation: 'dashboard' | 'forms' | 'tables' | 'workstation' | 'scan' | 'settings'
  const [activePage, setActivePage] = useState<'dashboard' | 'forms' | 'tables' | 'workstation' | 'scan' | 'settings'>(
    () => {
      const stored = getStoredActivePage();
      if (stored === 'settings' && userRole !== 'officer') {
        return 'dashboard';
      }
      return stored;
    }
  );

  // Automatically redirect away from settings if user role is not officer
  useEffect(() => {
    if (userRole !== 'officer' && activePage === 'settings') {
      setActivePage('dashboard');
      saveActivePage('dashboard');
    }
  }, [userRole, activePage]);

  const handleUserLogout = () => {
    saveActivePage('dashboard');
    setActivePage('dashboard');
    setIsMobileMenuOpen(false);
    onLogout();
  };

  // Mobile menu open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Shared System State connected to Firestore "permit" database
  const [registrations, setRegistrations] = useState<MotorcycleRegistration[]>([]);
  const [officers, setOfficers] = useState<OfficerAssignment[]>([]);
  const [printOrders, setPrintOrders] = useState<PrintBatchOrder[]>([]);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);

  // Real-time Firestore subscriptions with smart, quota-safe local-first cache
  useEffect(() => {
    // Initial fetch of all collections on startup
    syncAllCollectionsWithDb();

    // Subscribe to in-memory state listeners
    const unsubRegs = subscribeRegistrations(setRegistrations);
    const unsubOffs = subscribeOfficers(setOfficers);
    const unsubPrints = subscribePrintOrders(setPrintOrders);
    const unsubLogs = subscribeVerificationLogs(setVerificationLogs);

    return () => {
      unsubRegs();
      unsubOffs();
      unsubPrints();
      unsubLogs();
    };
  }, []);

  // Save active page tab to localStorage
  useEffect(() => {
    saveActivePage(activePage);
  }, [activePage]);

  // Toasts Notification State
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Handlers for Firestore database updates
  const handleAddVerificationLog = async (newLog: VerificationLog, isNoteUpdate: boolean = false) => {
    try {
      await saveVerificationLogToDb(newLog);
      // Removed auto-save notification toast as requested
    } catch (err) {
      addToast(
        isAmharic ? 'የፍተሻ መዝገብ ማስቀመጥ አልተሳካም!' : 'Failed to save verification log to database!',
        'error'
      );
    }
  };

  const handleSeedSampleData = async () => {
    try {
      await seedSampleDatabaseData();
      addToast(
        isAmharic
          ? 'ዳታቤዙ በናሙና መዝገቦች በተሳካ ሁኔታ ተሞልቷል!'
          : 'Database successfully seeded with high-quality sample records!',
        'success'
      );
    } catch (err) {
      addToast(
        isAmharic ? 'ዳታቤዝ መሙላት አልተሳካም!' : 'Failed to seed sample database records!',
        'error'
      );
    }
  };

  const handleAddRegistration = async (
    newReg: MotorcycleRegistration,
    options?: { forceLocalOnly?: boolean }
  ) => {
    try {
      const res = await saveRegistrationToDb(newReg, options);
      if (res.success) {
        addToast(
          isAmharic
            ? `የ ${newReg.fullName} ምዝገባ በተሳካ ሁኔታ በዳታቤዝ ተቀምጧል!`
            : `Registration for ${newReg.fullName} stored successfully in Firebase Database!`,
          'success'
        );
      } else {
        addToast(
          isAmharic ? 'የኦንላይን ዳታቤዝ ማስቀመጥ አልተሳካም!' : 'Online Firebase database save failed!',
          'error'
        );
      }
      return res;
    } catch (err) {
      addToast(
        isAmharic ? 'ምዝገባውን ማስቀመጥ አልተሳካም!' : 'Failed to store registration!',
        'error'
      );
      return { success: false, error: 'Save failed' };
    }
  };

  const handleApproveRegistration = async (id: string) => {
    try {
      await updateRegistrationStatusInDb(id, 'approved');
      addToast(
        isAmharic
          ? `የምዝገባ መለያ ${id} በዳታቤዝ ውስጥ ጸድቋል!`
          : `Registration ${id} approved successfully in database!`,
        'success'
      );
    } catch (err) {
      addToast(
        isAmharic ? 'ማጽደቅ አልተሳካም!' : 'Failed to approve registration!',
        'error'
      );
    }
  };

  const handleRejectRegistration = async (id: string, reason: string) => {
    try {
      await updateRegistrationStatusInDb(id, 'rejected', reason);
      addToast(
        isAmharic
          ? `የምዝገባ መለያ ${id} ውድቅ ተደርጓል!`
          : `Registration ${id} rejected in database!`,
        'info'
      );
    } catch (err) {
      addToast(
        isAmharic ? 'ውድቅ ማድረግ አልተሳካም!' : 'Failed to reject registration!',
        'error'
      );
    }
  };

  const handleAddOfficerAssignment = async (assignment: OfficerAssignment) => {
    try {
      await saveOfficerToDb(assignment);
      addToast(
        isAmharic
          ? `ኦፊሰር ${assignment.officerName} በተሳካ ሁኔታ ተመድቧል!`
          : `Officer ${assignment.officerName} successfully assigned and saved to database!`,
        'success'
      );
    } catch (err) {
      addToast(
        isAmharic ? 'ምደባውን ማስቀመጥ አልተሳካም!' : 'Failed to save assignment in database!',
        'error'
      );
    }
  };

  const handleCreatePrintOrder = async (registrationIds: string[], notes: string) => {
    try {
      const newOrder: PrintBatchOrder = {
        id: `BATCH-PRINT-${Math.floor(900 + Math.random() * 99)}`,
        orderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
        registrationIds,
        status: 'pending',
        notes,
        totalItems: registrationIds.length,
        totalCount: registrationIds.length,
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      await savePrintOrderToDb(newOrder);
      addToast(
        isAmharic
          ? 'የሕትመት ትእዛዝ በተሳካ ሁኔታ ተፈጥሯል!'
          : 'Batch print order created successfully in database!',
        'success'
      );
    } catch (err) {
      addToast(
        isAmharic ? 'የሕትመት ትእዛዝ መፍጠር አልተሳካም!' : 'Failed to create print order!',
        'error'
      );
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: 'pending' | 'in_printing' | 'completed'
  ) => {
    await updatePrintOrderStatusInDb(orderId, status);

    if (status === 'completed') {
      const order = printOrders.find((o) => o.id === orderId);
      if (order) {
        for (const regId of order.registrationIds) {
          await updateRegistrationStatusInDb(regId, 'printed');
        }
      }
    }
  };

  const handleQuickAction = (actionKey: string) => {
    if (
      actionKey === 'new_registration' ||
      actionKey === 'deploy_officer' ||
      actionKey === 'batch_print'
    ) {
      setActivePage('forms');
    } else if (
      actionKey === 'pending_approvals' ||
      actionKey === 'view_submissions' ||
      actionKey === 'vehicle_directory' ||
      actionKey === 'system_records' ||
      actionKey === 'approved_vehicles' ||
      actionKey === 'officers_directory' ||
      actionKey === 'print_history'
    ) {
      setActivePage('tables');
    } else if (
      actionKey === 'print_queue' ||
      actionKey === 'inspect_proofs' ||
      actionKey === 'checkpoint_status'
    ) {
      setActivePage('workstation');
    }
  };

  return (
    <div className={
      activePage === 'scan'
        ? "h-dvh max-h-dvh overflow-hidden bg-surface text-on-surface flex flex-col font-sans"
        : "min-h-screen bg-surface text-on-surface flex flex-col font-sans"
    }>
      {/* ==================== DESKTOP SIDEBAR NAVIGATION (lg:flex) ==================== */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:bg-surface-container-lowest lg:border-r lg:border-outline-variant lg:p-4 lg:justify-between lg:shadow-md">
        <div className="space-y-6">
          {/* Desktop Brand & Logo */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest border-2 border-sky-400 shadow-sm flex items-center justify-center shrink-0 p-0.5">
              <div className="w-full h-full rounded-full bg-[#0088cc] flex items-center justify-center relative overflow-hidden">
                <svg className="w-6 h-6 text-white" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" fill="#0088cc" />
                  <path d="M12 28 C12 20, 18 12, 28 12 C24 18, 22 24, 22 28 Z" fill="#ffffff" />
                  <path d="M10 22 C14 14, 22 10, 28 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="28" cy="8" r="2.5" fill="#f59e0b" />
                </svg>
              </div>
            </div>
            <div>
              <h1 id="desktop-header-text" className="font-extrabold text-xs text-on-surface tracking-tight leading-tight">
                {isAmharic ? 'Temporary Project Management System' : 'Temporary Project Management System'}
              </h1>
              <p className="hidden sm:block text-[10px] text-secondary font-medium">
                {isAmharic ? 'ኦፊሴላዊ የሞተርሳይክል መታወቂያ' : 'Official ID & Permit Portal'}
              </p>
            </div>
          </div>

          {/* Desktop Active User Card & Top Logout Button */}
          <div className="bg-surface-container/60 border border-outline-variant/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                <span>{userBadgeId || 'USER-ONLINE'}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online"></span>
            </div>
            
            <div className="flex items-center justify-between pt-1 border-t border-outline-variant/40">
              <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">
                {isAmharic ? 'የአሁኑ ሚና' : 'Active Role'}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                {(userRole || '').replace('_', ' ')}
              </span>
            </div>

            {/* Top Sign Out Button */}
            <button
              type="button"
              onClick={handleUserLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 mt-1 bg-error-container/20 border border-error/20 text-error rounded-lg text-xs font-bold hover:bg-error-container/50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>{isAmharic ? 'ውጣ (Logout)' : 'Sign Out'}</span>
            </button>
          </div>

          {/* Desktop Main Menu Items */}
          <nav className="space-y-1.5 pt-2">
            <p className="text-[10px] font-extrabold text-secondary uppercase tracking-wider px-3 mb-2">
              {isAmharic ? 'ዋና ማውጫ' : 'Main Menu'}
            </p>

            {/* Dashboard Link */}
            <button
              type="button"
              onClick={() => setActivePage('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'dashboard'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">space_dashboard</span>
              <span>{isAmharic ? 'መቆጣጠሪያ' : 'Dashboard'}</span>
            </button>

            {/* Register / Print Link */}
            {userRole !== 'officer' && (
              <button
                type="button"
                onClick={() => setActivePage('forms')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'forms'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {userRole === 'admin' ? 'print' : 'how_to_reg'}
                </span>
                <span>
                  {userRole === 'admin'
                    ? (isAmharic ? 'ሕትመት' : 'Print Dispatch')
                    : (isAmharic ? 'ምዝገባ' : 'Registration')}
                </span>
              </button>
            )}

            {/* Records Table Link */}
            <button
              type="button"
              onClick={() => setActivePage('tables')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'tables'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">table_chart</span>
              <span>{isAmharic ? 'ሬኮርዶች' : 'Records & Tables'}</span>
            </button>

            {/* Scan QR Scanner Link */}
            {userRole !== 'clerk' && (
              <button
                type="button"
                onClick={() => setActivePage('scan')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'scan'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span>{isAmharic ? 'QR ፍተሻ' : 'Scan QR'}</span>
              </button>
            )}

            {/* System Settings Link (Officer only) */}
            {userRole === 'officer' && (
              <button
                type="button"
                onClick={() => setActivePage('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'settings'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span>{isAmharic ? 'ማስተካከያ' : 'Settings'}</span>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-2 pt-4 border-t border-outline-variant/60">
          {/* Firebase Live Quota Stats */}
          <FirebaseQuotaWidget isAmharic={isAmharic} />

          {/* Quick Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  {currentTheme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
                <span>{isAmharic ? 'የገጽታ ቀለም' : 'Theme Mode'}</span>
              </div>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                {currentTheme === 'dark' ? 'DARK' : 'LIGHT'}
              </span>
            </button>
          )}

          {/* Quick Language Toggle */}
          <button
            type="button"
            onClick={onToggleLang}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">translate</span>
              <span>{isAmharic ? 'ቋንቋ (Language)' : 'Language'}</span>
            </div>
            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-primary/20 text-primary">
              {currentLang}
            </span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTAINER & TOP HEADER (lg:pl-64) ==================== */}
      <div className={
        activePage === 'scan'
          ? "lg:pl-64 flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden"
          : "lg:pl-64 flex-1 flex flex-col min-w-0"
      }>
        
        {/* MOBILE NAVIGATION HEADER (lg:hidden) */}
        {activePage !== 'scan' && (
          <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant shadow-sm px-4 sm:px-6 py-2.5 lg:hidden">
            <div className="relative z-40 max-w-7xl mx-auto flex items-center justify-between gap-3">
              
              {/* Logo & Brand */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-surface-container-lowest border-2 border-sky-400 shadow-sm flex items-center justify-center shrink-0 p-0.5">
                  <div className="w-full h-full rounded-full bg-[#0088cc] flex items-center justify-center relative overflow-hidden">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18" fill="#0088cc" />
                      <path d="M12 28 C12 20, 18 12, 28 12 C24 18, 22 24, 22 28 Z" fill="#ffffff" />
                      <path d="M10 22 C14 14, 22 10, 28 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="28" cy="8" r="2.5" fill="#f59e0b" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 id="header-text" className="font-extrabold text-xs sm:text-sm text-on-surface tracking-tight leading-tight">
                    {isAmharic ? 'Temporary Project Management System' : 'Temporary Project Management System'}
                  </h1>
                  <p className="text-[10px] text-secondary font-medium truncate max-w-[200px] sm:max-w-none">
                    {isAmharic ? 'ኦፊሴላዊ የሞተርሳይክል መታወቂያ እና ፈቃድ አስተዳደር' : 'Official Motorcycle Registration & ID Portal'}
                  </p>
                </div>
              </div>

              {/* Mobile Top Navbar Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle Mobile Menu"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {isMobileMenuOpen ? 'close' : 'menu'}
                </span>
              </button>
            </div>
          </header>
        )}

        {/* Mobile Backdrop & Right Slide-Out Drawer Menu */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in lg:hidden flex justify-end"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {/* Right Slide-Out Drawer Panel */}
            <div
              className="relative w-80 max-w-[85vw] h-full bg-surface-container-lowest/95 backdrop-blur-2xl border-l border-outline-variant shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 ease-out p-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Top Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-sky-400 shadow-sm flex items-center justify-center shrink-0 p-0.5">
                      <div className="w-full h-full rounded-full bg-[#0088cc] flex items-center justify-center relative overflow-hidden">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 40 40" fill="none">
                          <circle cx="20" cy="20" r="18" fill="#0088cc" />
                          <path d="M12 28 C12 20, 18 12, 28 12 C24 18, 22 24, 22 28 Z" fill="#ffffff" />
                          <path d="M10 22 C14 14, 22 10, 28 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                          <circle cx="28" cy="8" r="2.5" fill="#f59e0b" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-on-surface tracking-tight">
                        {isAmharic ? 'የሲስተም ማውጫ' : 'System Menu'}
                      </h3>
                      <p className="hidden sm:block text-[10px] text-secondary font-medium">TPMS Portal</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-container border border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                    title={isAmharic ? 'ዝጋ' : 'Close Menu'}
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* User Badge Info & Role Card */}
                <div className="bg-surface-container/80 border border-outline-variant/80 rounded-xl p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                      <span>{userBadgeId || 'USER-ONLINE'}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {userRole === 'admin' ? (isAmharic ? 'ሥራ አስኪያጅ' : 'Manager') : (userRole || '').replace('_', ' ')}
                    </span>
                  </div>

                  {/* Top Mobile Logout Button */}
                  <button
                    type="button"
                    onClick={handleUserLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 mt-1 bg-error-container/20 border border-error/20 text-error rounded-lg text-xs font-bold hover:bg-error-container/50 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>{isAmharic ? 'ውጣ (Logout)' : 'Sign Out'}</span>
                  </button>
                </div>
              </div>

              {/* Drawer Bottom Actions: Language, Theme, Logout */}
              <div className="space-y-2 pt-4 border-t border-outline-variant/60">
                {/* Firebase Live Quota Stats */}
                <div className="mb-2">
                  <FirebaseQuotaWidget isAmharic={isAmharic} />
                </div>

                <p className="text-[10px] font-extrabold text-secondary uppercase tracking-wider px-1 mb-1">
                  {isAmharic ? 'የስርዓት ማስተካከያ' : 'System Preferences'}
                </p>

                {/* Language Toggle */}
                <button
                  type="button"
                  onClick={onToggleLang}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">translate</span>
                    <span>{currentLang === 'am' ? 'English' : 'አማርኛ'}</span>
                  </div>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {currentLang}
                  </span>
                </button>

                {/* Theme Toggle */}
                {onToggleTheme && (
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">
                        {currentTheme === 'dark' ? 'dark_mode' : 'light_mode'}
                      </span>
                      <span>{currentTheme === 'dark' ? (isAmharic ? 'ብርሃን' : 'Light Theme') : (isAmharic ? 'ጨለማ' : 'Dark Theme')}</span>
                    </div>
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {currentTheme === 'dark' ? 'DARK' : 'LIGHT'}
                    </span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* DESKTOP TOP BAR (hidden lg:flex) */}
        {activePage !== 'scan' && (
          <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant sticky top-0 z-40 shadow-xs">
            <div>
              <h2 className="font-black text-base text-on-surface tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  {activePage === 'dashboard' && 'space_dashboard'}
                  {activePage === 'forms' && ((userRole === 'admin' || userRole === 'printing_press') ? 'print' : 'how_to_reg')}
                  {activePage === 'tables' && 'table_chart'}
                  {activePage === 'workstation' && 'badge'}
                  {activePage === 'settings' && 'settings'}
                </span>
                <span>
                  {activePage === 'dashboard' && (isAmharic ? 'መቆጣጠሪያ ማዕከል' : 'Dashboard Overview')}
                  {activePage === 'forms' && (userRole === 'admin' ? (isAmharic ? 'ሕትመት አስተዳደር' : 'Print Dispatch Forms') : (isAmharic ? 'የምዝገባ ቅጽ' : 'Motorcycle Registration Form'))}
                  {activePage === 'tables' && (isAmharic ? 'የስርዓት መረጃዎችና ሬኮርዶች' : 'System Database & Records')}
                  {activePage === 'workstation' && (isAmharic ? 'የተጠቃሚ ሚና ስራ ማዕከል' : 'Role Workstation')}
                  {activePage === 'settings' && (isAmharic ? 'የሲስተም እና የተጠቃሚ ማስተካከያ' : 'System & Profile Settings')}
                </span>
              </h2>
              <p className="text-xs text-secondary font-medium">
                Enforcement Pro • Municipal Management Portal
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title="Toggle Theme"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/80 bg-surface-container/50 hover:bg-surface-container text-xs font-bold text-on-surface transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {currentTheme === 'dark' ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span>{currentTheme === 'dark' ? (isAmharic ? 'ጨለማ' : 'Dark') : (isAmharic ? 'ብርሃን' : 'Light')}</span>
                </button>
              )}

              {/* Language Switch */}
              <button
                type="button"
                onClick={onToggleLang}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/80 bg-surface-container/50 hover:bg-surface-container text-xs font-bold text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">translate</span>
                <span>{currentLang === 'am' ? 'English' : 'አማርኛ'}</span>
              </button>

              {/* Sign Out */}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-error-container/20 border border-error/20 text-error rounded-xl text-xs font-bold hover:bg-error-container/50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>{isAmharic ? 'ውጣ' : 'Sign Out'}</span>
              </button>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className={
          activePage === 'scan'
            ? "flex-1 w-full mx-auto p-0 max-w-none h-full min-h-0 max-h-full flex flex-col overflow-hidden"
            : "flex-1 max-w-7xl lg:max-w-[1600px] w-full mx-auto p-2.5 sm:p-3 lg:p-6 pb-16 lg:pb-8 space-y-3 lg:space-y-6"
        }>
          
          {/* PAGE 1: UNIVERSAL DASHBOARD OVERVIEW */}
          {activePage === 'dashboard' && (
            <MunicipalDashboardOverview
              userBadgeId={userBadgeId}
              userRole={userRole}
              lang={currentLang}
              registrations={registrations}
              officers={officers}
              printOrders={printOrders}
              verificationLogs={verificationLogs}
              onQuickAction={handleQuickAction}
              onAddVerificationLog={handleAddVerificationLog}
              onSeedSampleData={handleSeedSampleData}
            />
          )}

          {/* PAGE 2: DEDICATED FORMS PAGE */}
          {activePage === 'forms' && (
            <FormsPage
              lang={currentLang}
              userRole={userRole}
              userBadgeId={userBadgeId}
              registrations={registrations}
              officers={officers}
              printOrders={printOrders}
              onAddRegistration={handleAddRegistration}
              onViewRegistered={() => setActivePage('tables')}
              onAddOfficerAssignment={handleAddOfficerAssignment}
              onCreatePrintOrder={handleCreatePrintOrder}
            />
          )}

          {/* PAGE 3: DEDICATED TABLES & RECORDS PAGE */}
          {activePage === 'tables' && (
            <TablesPage
              lang={currentLang}
              userRole={userRole}
              userBadgeId={userBadgeId}
              registrations={registrations}
              officers={officers}
              printOrders={printOrders}
              verificationLogs={verificationLogs}
              onApproveRegistration={handleApproveRegistration}
              onRejectRegistration={handleRejectRegistration}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onAddVerificationLog={handleAddVerificationLog}
              onSeedSampleData={handleSeedSampleData}
            />
          )}



          {/* PAGE 5: USER & SYSTEM SETTINGS PAGE (Officer only) */}
          {activePage === 'settings' && userRole === 'officer' && (
            <SettingsPage
              lang={currentLang}
              userRole={userRole}
              userBadgeId={userBadgeId}
              currentTheme={currentTheme}
              onToggleLang={onToggleLang}
              onToggleTheme={onToggleTheme}
              onLogout={onLogout}
            />
          )}

          {/* PAGE 6: FULL-SCREEN QR SCANNER & VERIFICATION PAGE */}
          {activePage === 'scan' && (
            <SharedScannerModal
              isOpen={true}
              onClose={() => setActivePage('dashboard')}
              lang={currentLang}
              registrations={registrations}
              userBadgeId={userBadgeId}
              onAddVerificationLog={handleAddVerificationLog}
              isPage={true}
            />
          )}
        </main>

        {/* Footers */}
        {activePage !== 'scan' && (
          <footer className="border-t border-outline-variant bg-surface-container-lowest py-3 px-4 pb-20 text-center text-xs text-secondary lg:hidden">
            Enforcement Pro • Municipal Command System • 2026
          </footer>
        )}
        <footer className="hidden lg:block border-t border-outline-variant bg-surface-container-lowest py-4 px-8 text-center text-xs text-secondary">
          Enforcement Pro • Municipal Command System • 2026
        </footer>
      </div>

      {/* FIXED BOTTOM NAVIGATION BAR (HIDDEN ON SCAN PAGE - lg:hidden) */}
      {activePage !== 'scan' && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant shadow-lg px-2 sm:px-6 py-2 lg:hidden">
          <div className="max-w-4xl mx-auto flex items-center justify-around gap-1">
            {/* Dashboard */}
            <button
              type="button"
              onClick={() => setActivePage('dashboard')}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'dashboard'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">space_dashboard</span>
              <span className="text-[10px] sm:text-xs tracking-tight text-center sm:text-left">
                {isAmharic ? 'መቆጣጠሪያ' : 'Dashboard'}
              </span>
            </button>

            {/* Register / Print Page */}
            {userRole !== 'officer' && (
              <button
                type="button"
                onClick={() => setActivePage('forms')}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'forms'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                  {userRole === 'admin' ? 'print' : 'how_to_reg'}
                </span>
                <span className="text-[10px] sm:text-xs tracking-tight text-center sm:text-left">
                  {userRole === 'admin'
                    ? (isAmharic ? 'ሕትመት' : 'Print')
                    : (isAmharic ? 'ምዝገባ' : 'Register')}
                </span>
              </button>
            )}

            {/* Records Page */}
            <button
              type="button"
              onClick={() => setActivePage('tables')}
              className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'tables'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">table_chart</span>
              <span className="text-[10px] sm:text-xs tracking-tight text-center sm:text-left">
                {isAmharic ? 'ሬኮርዶች' : 'Records'}
              </span>
            </button>

            {/* Scan QR Page Tab */}
            {userRole !== 'clerk' && (
              <button
                type="button"
                onClick={() => setActivePage('scan')}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'scan'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">qr_code_scanner</span>
                <span className="text-[10px] sm:text-xs tracking-tight text-center sm:text-left">
                  {isAmharic ? 'ፍተሻ' : 'Scan'}
                </span>
              </button>
            )}

            {/* User Settings Page (Officer only) */}
            {userRole === 'officer' && (
              <button
                type="button"
                onClick={() => setActivePage('settings')}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePage === 'settings'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">settings</span>
                <span className="text-[10px] sm:text-xs tracking-tight text-center sm:text-left">
                  {isAmharic ? 'ማስተካከያ' : 'Settings'}
                </span>
              </button>
            )}
          </div>
        </nav>
      )}

      {/* Floating Toast Notification Stack */}
      <div id="toast-notifications-container" className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 w-full max-w-[360px] pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg border animate-fadeIn transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-surface-container-lowest text-on-surface border-emerald-500 border-l-4'
                : toast.type === 'info'
                ? 'bg-surface-container-lowest text-on-surface border-blue-500 border-l-4'
                : 'bg-surface-container-lowest text-on-surface border-rose-500 border-l-4'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
              toast.type === 'success' ? 'text-emerald-500' : toast.type === 'info' ? 'text-blue-500' : 'text-rose-500'
            }`}>
              {toast.type === 'success' ? 'check_circle' : toast.type === 'info' ? 'info' : 'error'}
            </span>
            <div className="flex-1">
              <p className="text-xs font-bold leading-snug">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-secondary hover:text-on-surface shrink-0 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] font-bold">close</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
