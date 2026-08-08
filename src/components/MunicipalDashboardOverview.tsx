import React, { useState } from 'react';
import {
  Language,
  UserRole,
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
} from '../types';
import { QRCodeCard } from './QRCodeCard';
import { PermitStatusSummary } from './PermitStatusSummary';

interface MunicipalDashboardOverviewProps {
  userBadgeId: string;
  userRole: UserRole;
  lang: Language;
  registrations: MotorcycleRegistration[];
  officers: OfficerAssignment[];
  printOrders: PrintBatchOrder[];
  onQuickAction?: (actionKey: string) => void;
}

export const MunicipalDashboardOverview: React.FC<MunicipalDashboardOverviewProps> = ({
  userBadgeId,
  userRole,
  lang,
  registrations,
  officers,
  printOrders,
  onQuickAction,
}) => {
  const isAmharic = lang === 'am';

  // State for Instant Plate / QR Inspector Modal
  const [searchPlate, setSearchPlate] = useState('');
  const [selectedRegForModal, setSelectedRegForModal] = useState<MotorcycleRegistration | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'approved' | 'pending' | 'printed'>('all');

  const pendingCount = registrations.filter((r) => r.status === 'pending_approval').length;
  const approvedCount = registrations.filter(
    (r) => r.status === 'approved' || r.status === 'printed' || r.status === 'ordered_print'
  ).length;
  const activeOfficersCount = officers.filter((o) => o.status === 'active').length;
  const inPrintCount = printOrders.filter((p) => p.status === 'in_printing').length;

  const filteredRegistrations = registrations.filter((reg) => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'approved') return reg.status === 'approved';
    if (activityFilter === 'pending') return reg.status === 'pending_approval';
    if (activityFilter === 'printed') return reg.status === 'printed';
    return true;
  });

  const handleSearchLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate.trim()) return;

    const found = registrations.find(
      (r) =>
        r.plateNumber.toLowerCase().includes(searchPlate.trim().toLowerCase()) ||
        r.id.toLowerCase().includes(searchPlate.trim().toLowerCase()) ||
        r.fullName.toLowerCase().includes(searchPlate.trim().toLowerCase())
    );

    if (found) {
      setSelectedRegForModal(found);
    } else {
      setSelectedRegForModal(null);
    }
  };

  // Dynamic role-based Quick Action Shortcuts configuration (without Clerk Module / quick_verify)
  const getRoleQuickActions = () => {
    switch (userRole) {
      case 'clerk':
        return {
          title: isAmharic ? 'የፀሀፊ ቅጽበታዊ ስራዎች' : 'Clerk Quick Actions',
          headerIcon: 'badge',
          actions: [
            {
              key: 'new_registration',
              title: isAmharic ? 'አዲስ ምዝገባ' : 'New Registration',
              subtitle: isAmharic ? 'የባለቤትና ሞተር ቅጽ' : 'Register Owner & Motor',
              icon: 'person_add',
              iconBg: 'bg-sky-100 text-sky-900 group-hover:bg-primary group-hover:text-white',
            },
            {
              key: 'view_submissions',
              title: isAmharic ? 'የቀረቡ ምዝገባዎች' : 'Submitted Records',
              subtitle: `${registrations.length} ${isAmharic ? 'የተላኩ መዝገቦች' : 'submitted entries'}`,
              icon: 'assignment_turned_in',
              iconBg: 'bg-emerald-100 text-emerald-900 group-hover:bg-emerald-600 group-hover:text-white',
            },
            {
              key: 'vehicle_directory',
              title: isAmharic ? 'የሞተሮች መዝገብ' : 'Motor Directory',
              subtitle: isAmharic ? 'ሙሉ የሰንጠረዥ መዝገብ' : 'Browse System Motors',
              icon: 'two_wheeler',
              iconBg: 'bg-blue-100 text-blue-900 group-hover:bg-blue-600 group-hover:text-white',
            },
          ],
        };

      case 'admin':
        return {
          title: isAmharic ? 'የአድሚን መቆጣጠሪያዎች' : 'Admin Command Shortcuts',
          headerIcon: 'admin_panel_settings',
          actions: [
            {
              key: 'pending_approvals',
              title: isAmharic ? 'ማፅደቂያ ማዕከል' : 'Review Pending',
              subtitle: pendingCount > 0 ? `${pendingCount} ${isAmharic ? 'የሚጠበቁ' : 'awaiting approval'}` : (isAmharic ? 'ምንም የሚጠበቅ የለም' : 'Zero pending'),
              icon: 'how_to_reg',
              iconBg: 'bg-sky-100 text-sky-900 group-hover:bg-primary group-hover:text-white',
            },
            {
              key: 'deploy_officer',
              title: isAmharic ? 'ተቆጣጣሪ መድብ' : 'Deploy Officer',
              subtitle: isAmharic ? 'የክፍለ ከተማ መቆጣጠሪያ' : 'Assign Checkpoint Patrol',
              icon: 'add_location_alt',
              iconBg: 'bg-sky-100 text-sky-900 group-hover:bg-primary group-hover:text-white',
            },
            {
              key: 'batch_print',
              title: isAmharic ? 'የሕትመት ትእዛዝ' : 'Batch Print Dispatch',
              subtitle: isAmharic ? 'ለማተሚያ ቤት ባች መላኪያ' : 'Order Badges & Stickers',
              icon: 'print',
              iconBg: 'bg-blue-100 text-blue-900 group-hover:bg-blue-600 group-hover:text-white',
            },
            {
              key: 'system_records',
              title: isAmharic ? 'የስርዓት መረጃዎች' : 'Database & Records',
              subtitle: isAmharic ? 'ሙሉ ሰንጠረዦችና ሪፖርቶች' : 'Full Tables & Audit Logs',
              icon: 'database',
              iconBg: 'bg-emerald-100 text-emerald-900 group-hover:bg-emerald-600 group-hover:text-white',
            },
          ],
        };

      case 'printing_press':
        return {
          title: isAmharic ? 'የሕትመት ቤት ስራዎች' : 'Press Facility Shortcuts',
          headerIcon: 'print',
          actions: [
            {
              key: 'print_queue',
              title: isAmharic ? 'የሕትመት ወረፋ' : 'Process Print Queue',
              subtitle: inPrintCount > 0 ? `${inPrintCount} ${isAmharic ? 'በሕትመት ላይ' : 'in printing'}` : (isAmharic ? 'ወረፋው ዝግጁ ነው' : 'Queue ready'),
              icon: 'print',
              iconBg: 'bg-blue-100 text-blue-900 group-hover:bg-blue-600 group-hover:text-white',
            },
            {
              key: 'inspect_proofs',
              title: isAmharic ? 'የሕትመት ቅድመ-እይታ' : 'Inspect Proof Sheets',
              subtitle: isAmharic ? 'የባጅና ስቲከር ማረጋገጫ' : 'Batch Proof Cards',
              icon: 'receipt_long',
              iconBg: 'bg-purple-100 text-purple-900 group-hover:bg-purple-600 group-hover:text-white',
            },
            {
              key: 'print_history',
              title: isAmharic ? 'የሕትመት ታሪክ' : 'Batch Orders Log',
              subtitle: `${printOrders.length} ${isAmharic ? 'በጠቅላላ ትእዛዞች' : 'total batch orders'}`,
              icon: 'inventory',
              iconBg: 'bg-emerald-100 text-emerald-900 group-hover:bg-emerald-600 group-hover:text-white',
            },
          ],
        };

      case 'officer':
        return {
          title: isAmharic ? 'የተቆጣጣሪ የመስክ አቋራጮች' : 'Field Officer Shortcuts',
          headerIcon: 'policy',
          actions: [
            {
              key: 'approved_vehicles',
              title: isAmharic ? 'የፀደቁ ተሽከርካሪዎች' : 'Approved Registry',
              subtitle: `${approvedCount} ${isAmharic ? 'የፀደቁ ተሽከርካሪዎች' : 'valid vehicle permits'}`,
              icon: 'verified',
              iconBg: 'bg-emerald-100 text-emerald-900 group-hover:bg-emerald-600 group-hover:text-white',
            },
            {
              key: 'checkpoint_status',
              title: isAmharic ? 'የመደብ ቦታዬ' : 'Checkpoint Duty',
              subtitle: isAmharic ? 'የስራ ፈረቃና መቆጣጠሪያ ቦታ' : 'View Duty Shift & Patrol',
              icon: 'my_location',
              iconBg: 'bg-sky-100 text-sky-900 group-hover:bg-primary group-hover:text-white',
            },
            {
              key: 'officers_directory',
              title: isAmharic ? 'የተቆጣጣሪዎች ዝርዝር' : 'Officers Roster',
              subtitle: `${activeOfficersCount} ${isAmharic ? 'በስራ ላይ ያሉ' : 'active on duty'}`,
              icon: 'badge',
              iconBg: 'bg-blue-100 text-blue-900 group-hover:bg-blue-600 group-hover:text-white',
            },
          ],
        };

      default:
        return {
          title: isAmharic ? 'የቅጽበታዊ ስራዎች አቋራጭ' : 'Quick Action Shortcuts',
          headerIcon: 'bolt',
          actions: [],
        };
    }
  };

  const currentRoleConfig = getRoleQuickActions();

  const handleActionClick = (actionKey: string) => {
    if (actionKey === 'quick_verify') {
      setShowLookupModal(true);
    } else if (onQuickAction) {
      onQuickAction(actionKey);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Shortcuts Section */}
      <div className="bg-surface-container-lowest border border-outline-variant p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-2.5">
        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-outline-variant pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              {currentRoleConfig.headerIcon}
            </span>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              {currentRoleConfig.title}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {currentRoleConfig.actions.map((act) => (
            <button
              key={act.key}
              type="button"
              onClick={() => handleActionClick(act.key)}
              className="p-2.5 bg-surface-container/50 hover:bg-surface-container border border-outline-variant rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer group"
            >
              <div className={`p-2 rounded-lg transition-colors ${act.iconBg}`}>
                <span className="material-symbols-outlined text-[18px]">{act.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-on-surface truncate">{act.title}</p>
                <p className="text-[10px] text-secondary truncate">{act.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Breakdown of Permit Statuses */}
      <PermitStatusSummary
        registrations={registrations}
        lang={lang}
        onSelectStatusFilter={(status) => {
          if (status === 'pending_approval' && onQuickAction) {
            onQuickAction('pending_approvals');
          } else if (onQuickAction) {
            onQuickAction('system_records');
          }
        }}
      />

      {/* 4. Recent System Enforcement Activity Rehaul */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden p-3.5 sm:p-4 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-outline-variant pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs font-extrabold">
              <span className="material-symbols-outlined text-[16px] text-primary">radar</span>
              {isAmharic ? 'የቀጥታ ህግ ማስከበር ክትትል (Live Command Telemetry)' : 'Live Municipal Enforcement Telemetry Feed'}
            </div>
            <h3 className="font-black text-lg text-on-surface tracking-tight">
              {isAmharic ? 'የቅርብ ጊዜ የሞተርሳይክል ምዝገባዎች እና እንቅስቃሴዎች' : 'Recent System Enforcement Activity'}
            </h3>
            <p className="text-xs text-secondary">
              {isAmharic ? 'በእውነተኛ ጊዜ የተመዘገቡ፣ የጸደቁ እና በቁጥጥር ስር ያሉ መኪኖች ማዕከል' : 'Real-time telemetry feed of validated motorcycle registrations, checkpoint approvals, and ID card dispatches'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
            {/* Filter Pills */}
            <div className="bg-surface-container p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActivityFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activityFilter === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {isAmharic ? 'ሁሉም' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('approved')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activityFilter === 'approved'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {isAmharic ? 'የጸደቁ' : 'Approved'}
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activityFilter === 'pending'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {isAmharic ? 'በመጠበቅ ላይ' : 'Pending'}
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('printed')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activityFilter === 'printed'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {isAmharic ? 'ታትመዋል' : 'Printed'}
              </button>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              <span>{isAmharic ? 'ሲስተሙ በመስመር ላይ ነው' : 'Secure Uplink Active'}</span>
            </div>
          </div>
        </div>

        {/* Telemetry Summary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface-container/50 border border-outline-variant p-3.5 rounded-xl">
            <p className="text-[10px] text-secondary font-bold uppercase">{isAmharic ? 'ጠቅላላ መዝገቦች' : 'Total Feed Entries'}</p>
            <p className="text-lg font-black text-on-surface mt-0.5">{registrations.length}</p>
          </div>
          <div className="bg-surface-container/50 border border-outline-variant p-3.5 rounded-xl">
            <p className="text-[10px] text-emerald-700 font-bold uppercase">{isAmharic ? 'የጸደቁ ፈቃዶች' : 'Approved Permits'}</p>
            <p className="text-lg font-black text-emerald-900 mt-0.5">{registrations.filter(r => r.status === 'approved' || r.status === 'printed').length}</p>
          </div>
          <div className="bg-surface-container/50 border border-outline-variant p-3.5 rounded-xl">
            <p className="text-[10px] text-amber-700 font-bold uppercase">{isAmharic ? 'በመጠባበቅ ላይ' : 'Pending Review'}</p>
            <p className="text-lg font-black text-amber-900 mt-0.5">{registrations.filter(r => r.status === 'pending_approval').length}</p>
          </div>
          <div className="bg-surface-container/50 border border-outline-variant p-3.5 rounded-xl">
            <p className="text-[10px] text-blue-700 font-bold uppercase">{isAmharic ? 'የታተሙ ካርዶች' : 'Dispatched IDs'}</p>
            <p className="text-lg font-black text-blue-900 mt-0.5">{registrations.filter(r => r.status === 'printed' || r.status === 'ordered_print').length}</p>
          </div>
        </div>

        {/* Activity Cards Grid / Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRegistrations.slice(0, 6).map((reg) => (
            <div
              key={reg.id}
              className="bg-surface-container/30 hover:bg-surface-container/80 border border-outline-variant rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-md group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                      {reg.vehicleCategory === 'electric' ? 'EV' : 'CC'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                        {reg.fullName}
                      </h4>
                      <p className="text-xs text-secondary font-mono mt-0.5">
                        {reg.subCity || 'Kolfe Keraniyo'} • <span className="font-bold text-slate-900">{reg.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase shrink-0 ${
                      reg.status === 'approved' || reg.status === 'printed'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : reg.status === 'rejected'
                        ? 'bg-rose-100 text-rose-900 border border-rose-300'
                        : reg.status === 'ordered_print'
                        ? 'bg-sky-100 text-sky-900 border border-sky-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {reg.status === 'approved'
                      ? (isAmharic ? 'ፅድቋል' : 'Approved')
                      : reg.status === 'printed'
                      ? (isAmharic ? 'ታትሟል' : 'Printed')
                      : reg.status === 'rejected'
                      ? (isAmharic ? 'ተሰርዟል' : 'Rejected')
                      : reg.status === 'ordered_print'
                      ? (isAmharic ? 'ለሕትመት' : 'In Print')
                      : (isAmharic ? 'በመጠበቅ ላይ' : 'Pending')}
                  </span>
                </div>

                {/* Plate and Details Bar */}
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex items-center justify-between gap-2 text-xs shadow-2xs">
                  <div>
                    <span className="text-[10px] text-secondary block font-bold uppercase tracking-wider">{isAmharic ? 'የሰሌዳ ቁጥር' : 'Plate No.'}</span>
                    <span className="font-mono font-black text-slate-950 text-sm tracking-wider">
                      {reg.plateNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-secondary block font-bold uppercase tracking-wider">{isAmharic ? 'ሞተር እና ሞዴል' : 'Model / Serial'}</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {reg.motorModel || reg.motorBrand || 'APACHE'} ({reg.engineOrSerialNo.slice(0, 8)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer of Card */}
              <div className="flex justify-between items-center pt-2 border-t border-outline-variant text-[11px] text-secondary">
                <span className="font-mono flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  {reg.registrationDate}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedRegForModal(reg);
                    setShowLookupModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                  <span>{isAmharic ? 'መታወቂያ/QR ይዩ' : 'Inspect Card'}</span>
                </button>
              </div>
            </div>
          ))}

          {filteredRegistrations.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-outline-variant rounded-2xl text-xs text-secondary space-y-3 bg-surface-container/20">
              <span className="material-symbols-outlined text-[40px] text-outline">folder_off</span>
              <p className="font-semibold">{isAmharic ? 'ምንም መረጃ አልተገኘም' : 'No enforcement activity records found for this filter criteria.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Instant Verification Modal */}
      {showLookupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
                <span>{isAmharic ? 'የሰሌዳ ቁጥር / QR ማረጋገጫ' : 'Plate Number & QR Verification'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowLookupModal(false);
                  setSelectedRegForModal(null);
                  setSearchPlate('');
                }}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Quick Search Bar */}
            <form onSubmit={handleSearchLookup} className="flex gap-2">
              <input
                type="text"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                placeholder={isAmharic ? 'የሰሌዳ ቁጥር ወይም ስም ያስገቡ (ምሳሌ፡ AA-2-M8841)' : 'Enter Plate No or Name (e.g. AA-2-M8841)'}
                className="flex-1 bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                {isAmharic ? 'ፈልግ' : 'Search'}
              </button>
            </form>

            {/* Display Selected Registration Card or Prompt */}
            {selectedRegForModal ? (
              <div className="space-y-3">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                  <span>
                    {isAmharic
                      ? `ተሽከርካሪው በሲስተሙ የተመዘገበ ነው (${selectedRegForModal.status.toUpperCase()})`
                      : `Valid System Record Found (${selectedRegForModal.status.toUpperCase()})`}
                  </span>
                </div>
                <QRCodeCard registration={selectedRegForModal} lang={lang} />
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-outline-variant rounded-xl text-xs text-secondary space-y-2">
                <span className="material-symbols-outlined text-[36px] text-outline">search_off</span>
                <p>
                  {isAmharic
                    ? 'ከላይ የሰሌዳ ቁጥር በማስገባት ይፈልጉ ወይም ከቅርብ ጊዜ ዝርዝር አንዱን ይጫኑ'
                    : 'Search plate number above or click an item from recent activity to inspect QR Card.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
