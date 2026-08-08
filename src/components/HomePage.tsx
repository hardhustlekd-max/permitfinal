import React, { useState } from 'react';
import {
  Language,
  UserRole,
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
} from '../types';
import {
  initialRegistrations,
  initialOfficerAssignments,
  initialPrintBatchOrders,
} from '../mockData';
import { ClerkDashboard } from './ClerkDashboard';
import { AdminDashboard } from './AdminDashboard';
import { PrintingPressDashboard } from './PrintingPressDashboard';
import { MunicipalDashboardOverview } from './MunicipalDashboardOverview';
import { FormsPage } from './FormsPage';
import { TablesPage } from './TablesPage';
import { SettingsPage } from './SettingsPage';

interface HomePageProps {
  userBadgeId: string;
  userRole: UserRole;
  currentLang: Language;
  onToggleLang: () => void;
  onLogout: () => void;
  onSwitchRole?: (newRole: UserRole) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  userBadgeId,
  userRole,
  currentLang,
  onToggleLang,
  onLogout,
  onSwitchRole,
}) => {
  const isAmharic = currentLang === 'am';

  // Active top page navigation: 'dashboard' | 'forms' | 'tables' | 'workstation' | 'settings'
  const [activePage, setActivePage] = useState<'dashboard' | 'forms' | 'tables' | 'workstation' | 'settings'>('dashboard');

  // Shared System State
  const [registrations, setRegistrations] = useState<MotorcycleRegistration[]>(initialRegistrations);
  const [officers, setOfficers] = useState<OfficerAssignment[]>(initialOfficerAssignments);
  const [printOrders, setPrintOrders] = useState<PrintBatchOrder[]>(initialPrintBatchOrders);

  // Handlers for state updates
  const handleAddRegistration = (newReg: MotorcycleRegistration) => {
    setRegistrations((prev) => [newReg, ...prev]);
  };

  const handleApproveRegistration = (id: string) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
  };

  const handleRejectRegistration = (id: string, reason: string) => {
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'rejected', rejectionReason: reason } : r
      )
    );
  };

  const handleAddOfficerAssignment = (assignment: OfficerAssignment) => {
    setOfficers((prev) => [assignment, ...prev]);
  };

  const handleCreatePrintOrder = (registrationIds: string[], notes: string) => {
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
    setPrintOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: 'pending' | 'in_printing' | 'completed'
  ) => {
    setPrintOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            }
          : o
      )
    );

    if (status === 'completed') {
      const order = printOrders.find((o) => o.id === orderId);
      if (order) {
        setRegistrations((prev) =>
          prev.map((r) =>
            order.registrationIds.includes(r.id) ? { ...r, status: 'printed' } : r
          )
        );
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
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant shadow-sm px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-sky-400 shadow-sm flex items-center justify-center shrink-0 p-0.5">
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
              <h1 id="header-text" className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight leading-tight">
                {isAmharic ? 'የባህር ዳር ከተማ ሞተረኞች ኃ.የተ.የግ.ማ' : 'Bahirdar City Motorist P.L.C'}
              </h1>
              <p className="text-[10px] text-secondary font-medium">
                {isAmharic ? 'ኦፊሴላዊ የሞተርሳይክል መታወቂያ እና ፈቃድ አስተዳደር' : 'Official Motorcycle Registration & ID Portal'}
              </p>
            </div>
          </div>

          {/* User Badge Info & Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-sky-50/80 border border-sky-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              <span className="font-bold text-sky-950">{userBadgeId || 'USER-ONLINE'}</span>
            </div>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-outline">language</span>
              <span>{isAmharic ? 'English' : 'አማርኛ'}</span>
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-error-container/30 border border-error/20 text-error rounded-xl text-xs font-bold hover:bg-error-container/60 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden sm:inline">{isAmharic ? 'ውጣ' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 pb-20 space-y-4">
        
        {/* PAGE 1: UNIVERSAL DASHBOARD OVERVIEW */}
        {activePage === 'dashboard' && (
          <MunicipalDashboardOverview
            userBadgeId={userBadgeId}
            userRole={userRole}
            lang={currentLang}
            registrations={registrations}
            officers={officers}
            printOrders={printOrders}
            onQuickAction={handleQuickAction}
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
            onAddOfficerAssignment={handleAddOfficerAssignment}
            onCreatePrintOrder={handleCreatePrintOrder}
          />
        )}

        {/* PAGE 3: DEDICATED TABLES & RECORDS PAGE */}
        {activePage === 'tables' && (
          <TablesPage
            lang={currentLang}
            userRole={userRole}
            registrations={registrations}
            officers={officers}
            printOrders={printOrders}
            onApproveRegistration={handleApproveRegistration}
            onRejectRegistration={handleRejectRegistration}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}

        {/* PAGE 4: ROLE WORKSTATION */}
        {activePage === 'workstation' && (
          <div id="role-module-section" className="space-y-6">
            {userRole === 'clerk' && (
              <ClerkDashboard
                lang={currentLang}
                registrations={registrations}
                onAddRegistration={handleAddRegistration}
                userBadgeId={userBadgeId}
              />
            )}

            {userRole === 'admin' && (
              <AdminDashboard
                lang={currentLang}
                registrations={registrations}
                officers={officers}
                printOrders={printOrders}
                onApproveRegistration={handleApproveRegistration}
                onRejectRegistration={handleRejectRegistration}
                onAddOfficerAssignment={handleAddOfficerAssignment}
                onCreatePrintOrder={handleCreatePrintOrder}
              />
            )}

            {userRole === 'printing_press' && (
              <PrintingPressDashboard
                lang={currentLang}
                printOrders={printOrders}
                registrations={registrations}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            )}

            {userRole === 'officer' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-xs space-y-3">
                    <h3 className="font-bold text-sm text-on-surface">
                      {isAmharic ? 'የእርስዎ የመስክ ስራ ቦታ' : 'Your Field Assignment'}
                    </h3>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-emerald-950">
                        {isAmharic ? 'ቦታ፡ ቦሌ ክፍለ ከተማ (Bole Road Roundabout)' : 'Location: Bole Sub-City Roundabout'}
                      </p>
                      <p className="text-emerald-800">
                        {isAmharic ? 'ፈረቃ፡ ጠዋት (Morning Shift)' : 'Shift: Morning Shift (08:00 - 16:00)'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-xs space-y-3">
                    <h3 className="font-bold text-sm text-on-surface">
                      {isAmharic ? 'በሲስተሙ የተረጋገጡ በጠቅላላ' : 'Total Approved System Registrations'}
                    </h3>
                    <div className="p-3 bg-surface-container rounded-xl text-xs space-y-1">
                      <p className="text-2xl font-bold text-primary">
                        {registrations.filter((r) => r.status === 'approved' || r.status === 'printed').length}
                      </p>
                      <p className="text-secondary text-[11px]">
                        {isAmharic ? 'ለህግ ማስከበሪያ ዝግጁ የሆኑ' : 'Valid and ready for field enforcement'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAGE 5: USER & SYSTEM SETTINGS PAGE */}
        {activePage === 'settings' && (
          <SettingsPage
            lang={currentLang}
            userRole={userRole}
            userBadgeId={userBadgeId}
            onToggleLang={onToggleLang}
            onLogout={onLogout}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant bg-surface-container-lowest py-3 px-4 pb-20 text-center text-xs text-secondary">
        Enforcement Pro • Municipal Command System • 2026
      </footer>

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant shadow-lg px-2 sm:px-6 py-2">
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

          {/* Register Page */}
          <button
            type="button"
            onClick={() => setActivePage('forms')}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePage === 'forms'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">how_to_reg</span>
            <span className="text-[10px] sm:text-xs tracking-tight text-center sm:text-left">
              {isAmharic ? 'ምዝገባ' : 'Register'}
            </span>
          </button>

          {/* Records Page */}
          <button
            type="button"
            onClick={() => setActivePage('tables')}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

          {/* User Settings Page */}
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
        </div>
      </nav>
    </div>
  );
};
