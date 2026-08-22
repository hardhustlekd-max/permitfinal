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
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:bg-[#0B1E48] lg:text-white lg:border-r lg:border-[#1B2E58] lg:p-4 lg:justify-between lg:shadow-xl">
        <div className="space-y-6">
          {/* Desktop Brand & Logo */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <h1 id="desktop-header-text" className="font-extrabold text-xs text-white tracking-tight leading-tight">
                {isAmharic ? 'ሕይወት ባህርዳር የሞተረኞች ማህበር አገልግሎት ኃ.የተ.የግ.ማ' : 'Hiwot Bahirdar Motorbike Riders Association PLC'}
              </h1>
              <p className="hidden sm:block text-[9px] text-yellow-300 font-normal">
                {isAmharic ? 'በአንድነት ለአስተማማኝና ለተሻለ አገልግሎት' : 'Together for Safe and Better service'}
              </p>
            </div>
          </div>

          {/* Desktop Active User Card & Top Logout Button */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 space-y-2 text-white shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-300">
                <span className="material-symbols-outlined text-yellow-400 text-[18px]">verified_user</span>
                <span>{userBadgeId || 'USER-ONLINE'}</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Online"></span>
            </div>
            
            <div className="flex items-center justify-between pt-1 border-t border-white/15">
              <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider">
                {isAmharic ? 'የአሁኑ ሚና' : 'Active Role'}
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                {(userRole || '').replace('_', ' ')}
              </span>
            </div>

            {/* Top Sign Out Button */}
            <button
              type="button"
              onClick={handleUserLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 mt-1 bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-lg text-xs font-bold hover:bg-rose-500/30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>{isAmharic ? 'ውጣ' : 'Sign Out'}</span>
            </button>
          </div>

          {/* Desktop Main Menu Items */}
          <nav className="space-y-1.5 pt-2">
            <p className="text-[10px] font-extrabold text-yellow-400/80 uppercase tracking-wider px-3 mb-2">
              {isAmharic ? 'ዋና ማውጫ' : 'Main Menu'}
            </p>

            {/* Dashboard Link */}
            <button
              type="button"
              onClick={() => setActivePage('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePage === 'dashboard'
                  ? 'bg-yellow-500 text-[#0B1E48] font-black shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
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
                    ? 'bg-yellow-500 text-[#0B1E48] font-black shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
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
                  ? 'bg-yellow-500 text-[#0B1E48] font-black shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
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
                    ? 'bg-yellow-500 text-[#0B1E48] font-black shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
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
                    ? 'bg-yellow-500 text-[#0B1E48] font-black shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
                <span>{isAmharic ? 'ማስተካከያ' : 'Settings'}</span>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-2 pt-4 border-t border-white/15">
          {/* Quick Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  {currentTheme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
                <span>{isAmharic ? 'የገጽታ ቀለም' : 'Theme Mode'}</span>
              </div>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                {currentTheme === 'dark' ? 'DARK' : 'LIGHT'}
              </span>
            </button>
          )}

          {/* Quick Language Toggle */}
          <button
            type="button"
            onClick={onToggleLang}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">translate</span>
              <span>{isAmharic ? 'ቋንቋ' : 'Language'}</span>
            </div>
            <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
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
        <header className="sticky top-0 z-50 bg-[#0B1E48] text-white border-b-2 border-yellow-500 shadow-md px-3 sm:px-6 py-2.5 lg:hidden">
          <div className="relative z-50 max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
              
              {/* Left Logo & App Brand Title */}
              <div className="flex items-center gap-2.5 min-w-0 shrink">
                <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="min-w-0">
                  <h1 id="header-text" className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-tight truncate">
                    {isAmharic ? 'ሕይወት ባህርዳር የሞተረኞች ማህበር' : 'HIWOT BAHIRDAR ASSOCIATION'}
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-yellow-300 font-normal tracking-wide truncate">
                    {isAmharic ? 'በአንድነት ለአስተማማኝና ለተሻለ አገልግሎት' : 'Together for Safe and Better service'}
                  </p>
                </div>
              </div>

              {/* Center Navigation Tabs (Visible on Tablet / Medium screens md:flex) */}
              <nav className="hidden md:flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePage('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePage === 'dashboard'
                      ? 'bg-yellow-500 text-[#0B1E48] shadow-xs font-black'
                      : 'text-white/90 hover:bg-white/15'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">space_dashboard</span>
                  <span>{isAmharic ? 'መቆጣጠሪያ' : 'Dashboard'}</span>
                </button>

                {userRole !== 'officer' && (
                  <button
                    type="button"
                    onClick={() => setActivePage('forms')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activePage === 'forms'
                        ? 'bg-yellow-500 text-[#0B1E48] shadow-xs font-black'
                        : 'text-white/90 hover:bg-white/15'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {userRole === 'admin' ? 'print' : 'how_to_reg'}
                    </span>
                    <span>
                      {userRole === 'admin'
                        ? (isAmharic ? 'ሕትመት' : 'Print Dispatch')
                        : (isAmharic ? 'ምዝገባ' : 'Registration')}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActivePage('tables')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePage === 'tables'
                      ? 'bg-yellow-500 text-[#0B1E48] shadow-xs font-black'
                      : 'text-white/90 hover:bg-white/15'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                  <span>{isAmharic ? 'ሬኮርዶች' : 'Records'}</span>
                </button>

                {userRole !== 'clerk' && (
                  <button
                    type="button"
                    onClick={() => setActivePage('scan')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activePage === 'scan'
                        ? 'bg-yellow-500 text-[#0B1E48] shadow-xs font-black'
                        : 'text-white/90 hover:bg-white/15'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                    <span>{isAmharic ? 'ፍተሻ' : 'Scan'}</span>
                  </button>
                )}

                {userRole === 'officer' && (
                  <button
                    type="button"
                    onClick={() => setActivePage('settings')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activePage === 'settings'
                        ? 'bg-yellow-500 text-[#0B1E48] shadow-xs font-black'
                        : 'text-white/90 hover:bg-white/15'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">settings</span>
                    <span>{isAmharic ? 'ማስተካከያ' : 'Settings'}</span>
                  </button>
                )}
              </nav>

              {/* Right Controls (UNIFIED MENU & CLOSE TOGGLE BUTTON) */}
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {isMobileMenuOpen ? 'close' : 'menu'}
                  </span>
                </button>
              </div>

            </div>
          </header>

        {/* Mobile Backdrop & Right Slide-Out Drawer Menu (Positioned BELOW top header) */}
        {isMobileMenuOpen && (
          <div
            className="fixed top-[53px] sm:top-[57px] inset-x-0 bottom-0 z-40 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in lg:hidden flex justify-end"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {/* Right Slide-Out Drawer Panel */}
            <div
              className="relative w-80 max-w-[85vw] h-full bg-[#0B1E48] text-white border-l border-yellow-500/30 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 ease-out p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-5">
                {/* User Badge Info & Role Card */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-300">
                      <span className="material-symbols-outlined text-yellow-400 text-[18px]">verified_user</span>
                      <span>{userBadgeId || 'USER-ONLINE'}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      {userRole === 'admin' ? (isAmharic ? 'ሥራ አስኪያጅ' : 'Manager') : (userRole || '').replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Mobile Main Navigation Links */}
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold text-yellow-400/80 uppercase tracking-wider px-1 mb-1.5">
                    {isAmharic ? 'ዋና ክፍሎች' : 'Navigation Pages'}
                  </p>

                  {/* Dashboard */}
                  <button
                    type="button"
                    onClick={() => {
                      setActivePage('dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activePage === 'dashboard'
                        ? 'bg-yellow-500 text-[#0B1E48] shadow-sm font-black'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${activePage === 'dashboard' ? 'text-[#0B1E48]' : 'text-yellow-400'}`}>
                        space_dashboard
                      </span>
                      <div className="text-left">
                        <div className="font-extrabold">{isAmharic ? 'መቆጣጠሪያ ማዕከል' : 'Dashboard'}</div>
                        <div className={`text-[10px] ${activePage === 'dashboard' ? 'text-[#0B1E48]/80' : 'text-white/60'}`}>
                          {isAmharic ? 'አጠቃላይ መረጃና ስታቲስቲክስ' : 'Overview & Analytics'}
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>

                  {/* Registration / Print */}
                  {userRole !== 'officer' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePage('forms');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activePage === 'forms'
                          ? 'bg-yellow-500 text-[#0B1E48] shadow-sm font-black'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${activePage === 'forms' ? 'text-[#0B1E48]' : 'text-yellow-400'}`}>
                          {userRole === 'admin' ? 'print' : 'how_to_reg'}
                        </span>
                        <div className="text-left">
                          <div className="font-extrabold">
                            {userRole === 'admin'
                              ? (isAmharic ? 'ሕትመት አስተዳደር' : 'Print Dispatch')
                              : (isAmharic ? 'ሞተርሳይክል ምዝገባ' : 'Registration Form')}
                          </div>
                          <div className={`text-[10px] ${activePage === 'forms' ? 'text-[#0B1E48]/80' : 'text-white/60'}`}>
                            {userRole === 'admin'
                              ? (isAmharic ? 'የፈቃድ ሕትመት ትእዛዝ' : 'Batch Print Orders')
                              : (isAmharic ? 'አዲስ አባልና ሞተር መመዝገቢያ' : 'New Member Application')}
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  )}

                  {/* Database Records */}
                  <button
                    type="button"
                    onClick={() => {
                      setActivePage('tables');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activePage === 'tables'
                        ? 'bg-yellow-500 text-[#0B1E48] shadow-sm font-black'
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${activePage === 'tables' ? 'text-[#0B1E48]' : 'text-yellow-400'}`}>
                        table_chart
                      </span>
                      <div className="text-left">
                        <div className="font-extrabold">{isAmharic ? 'ሬኮርዶችና መረጃዎች' : 'Records & Database'}</div>
                        <div className={`text-[10px] ${activePage === 'tables' ? 'text-[#0B1E48]/80' : 'text-white/60'}`}>
                          {isAmharic ? 'ዝርዝር ሰንጠረዦችና መታወቂያዎች' : 'Vehicle Tables & Permits'}
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>

                  {/* Scan QR */}
                  {userRole !== 'clerk' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePage('scan');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activePage === 'scan'
                          ? 'bg-yellow-500 text-[#0B1E48] shadow-sm font-black'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${activePage === 'scan' ? 'text-[#0B1E48]' : 'text-yellow-400'}`}>
                          qr_code_scanner
                        </span>
                        <div className="text-left">
                          <div className="font-extrabold">{isAmharic ? 'QR ፍተሻ ማዕከል' : 'Scan QR Code'}</div>
                          <div className={`text-[10px] ${activePage === 'scan' ? 'text-[#0B1E48]/80' : 'text-white/60'}`}>
                            {isAmharic ? 'የአባል መታወቂያ ካሜራ ፍተሻ' : 'Live Verification Scanner'}
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  )}

                  {/* Settings */}
                  {userRole === 'officer' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePage('settings');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activePage === 'settings'
                          ? 'bg-yellow-500 text-[#0B1E48] shadow-sm font-black'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${activePage === 'settings' ? 'text-[#0B1E48]' : 'text-yellow-400'}`}>
                          settings
                        </span>
                        <div className="text-left">
                          <div className="font-extrabold">{isAmharic ? 'ማስተካከያ' : 'Settings'}</div>
                          <div className={`text-[10px] ${activePage === 'settings' ? 'text-[#0B1E48]/80' : 'text-white/60'}`}>
                            {isAmharic ? 'የስርዓት ቅንብሮች' : 'System Configuration'}
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="space-y-3 pt-4 border-t border-white/15">
                <p className="text-[10px] font-extrabold text-yellow-400/80 uppercase tracking-wider px-1">
                  {isAmharic ? 'የስርዓት ማስተካከያ' : 'System Preferences'}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {/* Language Toggle */}
                  <button
                    type="button"
                    onClick={onToggleLang}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">translate</span>
                      <span>{currentLang === 'am' ? 'English' : 'አማርኛ'}</span>
                    </div>
                  </button>

                  {/* Theme Toggle */}
                  {onToggleTheme && (
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">
                          {currentTheme === 'dark' ? 'dark_mode' : 'light_mode'}
                        </span>
                        <span>{currentTheme === 'dark' ? 'Light' : 'Dark'}</span>
                      </div>
                    </button>
                  )}
                </div>

                {/* Mobile Logout Button */}
                <button
                  type="button"
                  onClick={handleUserLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>{isAmharic ? 'ውጣ' : 'Sign Out'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* DESKTOP TOP BAR (hidden lg:flex) */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-[#0B1E48] text-white border-b-2 border-yellow-500 sticky top-0 z-40 shadow-md">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="font-black text-base text-white tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-400 text-[22px]">
                  {activePage === 'dashboard' && 'space_dashboard'}
                  {activePage === 'forms' && ((userRole === 'admin' || userRole === 'printing_press') ? 'print' : 'how_to_reg')}
                  {activePage === 'tables' && 'table_chart'}
                  {activePage === 'workstation' && 'badge'}
                  {activePage === 'scan' && 'qr_code_scanner'}
                  {activePage === 'settings' && 'settings'}
                </span>
                <span>
                  {activePage === 'dashboard' && (isAmharic ? 'መቆጣጠሪያ ማዕከል' : 'Dashboard Overview')}
                  {activePage === 'forms' && (userRole === 'admin' ? (isAmharic ? 'ሕትመት አስተዳደር' : 'Print Dispatch Forms') : (isAmharic ? 'የምዝገባ ቅጽ' : 'Motorcycle Registration Form'))}
                  {activePage === 'tables' && (isAmharic ? 'የስርዓት መረጃዎችና ሬኮርዶች' : 'System Database & Records')}
                  {activePage === 'workstation' && (isAmharic ? 'የተጠቃሚ ሚና ስራ ማዕከል' : 'Role Workstation')}
                  {activePage === 'scan' && (isAmharic ? 'የQR ኮድ ፍተሻ ማዕከል' : 'QR Verification Scanner')}
                  {activePage === 'settings' && (isAmharic ? 'የሲስተም እና የተጠቃሚ ማስተካከያ' : 'System & Profile Settings')}
                </span>
              </h2>
                <p className="text-xs text-yellow-400/90 font-bold">
                  Enforcement Pro • Municipal Management Portal
                </p>
              </div>

              {/* Top Navbar Quick Page Switcher Pills on Desktop */}
              <nav className="hidden xl:flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/20">
                <button
                  type="button"
                  onClick={() => setActivePage('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePage === 'dashboard'
                      ? 'bg-white text-[#3c8dbc] shadow-xs'
                      : 'text-white/90 hover:bg-white/15'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">space_dashboard</span>
                  <span>{isAmharic ? 'መቆጣጠሪያ' : 'Dashboard'}</span>
                </button>

                {userRole !== 'officer' && (
                  <button
                    type="button"
                    onClick={() => setActivePage('forms')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activePage === 'forms'
                        ? 'bg-white text-[#3c8dbc] shadow-xs'
                        : 'text-white/90 hover:bg-white/15'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {userRole === 'admin' ? 'print' : 'how_to_reg'}
                    </span>
                    <span>
                      {userRole === 'admin'
                        ? (isAmharic ? 'ሕትመት' : 'Print Dispatch')
                        : (isAmharic ? 'ምዝገባ' : 'Registration')}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActivePage('tables')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePage === 'tables'
                      ? 'bg-white text-[#3c8dbc] shadow-xs'
                      : 'text-white/90 hover:bg-white/15'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                  <span>{isAmharic ? 'ሬኮርዶች' : 'Records'}</span>
                </button>

                {userRole !== 'clerk' && (
                  <button
                    type="button"
                    onClick={() => setActivePage('scan')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activePage === 'scan'
                        ? 'bg-white text-[#3c8dbc] shadow-xs'
                        : 'text-white/90 hover:bg-white/15'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                    <span>{isAmharic ? 'ፍተሻ' : 'Scan'}</span>
                  </button>
                )}

                {userRole === 'officer' && (
                  <button
                    type="button"
                    onClick={() => setActivePage('settings')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activePage === 'settings'
                        ? 'bg-white text-[#3c8dbc] shadow-xs'
                        : 'text-white/90 hover:bg-white/15'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">settings</span>
                    <span>{isAmharic ? 'ማስተካከያ' : 'Settings'}</span>
                  </button>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {/* Role Switcher Pill in Desktop Top Bar */}
              {onSwitchRole && (
                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/20">
                  <span className="text-[10px] font-extrabold uppercase text-white/70 px-2">Role:</span>
                  {(['clerk', 'admin', 'officer'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onSwitchRole(r)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                        userRole === r
                          ? 'bg-white text-[#3c8dbc] shadow-2xs font-extrabold'
                          : 'text-white/80 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      {r === 'admin' ? (isAmharic ? 'ሥራ አስኪያጅ' : 'Manager') : r}
                    </button>
                  ))}
                </div>
              )}

              {/* Theme Toggle */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title="Toggle Theme"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">translate</span>
                <span>{currentLang === 'am' ? 'English' : 'አማርኛ'}</span>
              </button>

              {/* Sign Out */}
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 border border-red-500/50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>{isAmharic ? 'ውጣ' : 'Sign Out'}</span>
              </button>
            </div>
          </header>

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

        {/* Footer */}
        <footer className="border-t border-outline-variant bg-surface-container-lowest py-4 px-4 sm:px-8 text-center text-xs text-secondary">
          Enforcement Pro • Municipal Command System • 2026
        </footer>
      </div>

      {/* Floating Toast Notification Stack */}
      <div id="toast-notifications-container" className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 w-full max-w-[360px] pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg border animate-fadeIn transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-surface-container-lowest text-on-surface border-emerald-500 border-l-4'
                : toast.type === 'info'
                ? 'bg-surface-container-lowest text-on-surface border-primary border-l-4'
                : 'bg-surface-container-lowest text-on-surface border-rose-500 border-l-4'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
              toast.type === 'success' ? 'text-emerald-500' : toast.type === 'info' ? 'text-primary' : 'text-rose-500'
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
