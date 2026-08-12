import React, { useState } from 'react';
import {
  Language,
  UserRole,
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
  VerificationLog,
} from '../types';
import { QRCodeCard } from './QRCodeCard';
import { SharedScannerModal } from './SharedScannerModal';

interface MunicipalDashboardOverviewProps {
  userBadgeId: string;
  userRole: UserRole;
  lang: Language;
  registrations: MotorcycleRegistration[];
  officers: OfficerAssignment[];
  printOrders: PrintBatchOrder[];
  verificationLogs?: VerificationLog[];
  onQuickAction?: (actionKey: string) => void;
  onAddVerificationLog?: (log: VerificationLog) => void;
}

export const MunicipalDashboardOverview: React.FC<MunicipalDashboardOverviewProps> = ({
  userBadgeId,
  userRole,
  lang,
  registrations,
  officers,
  printOrders,
  verificationLogs = [],
  onQuickAction,
  onAddVerificationLog,
}) => {
  const isAmharic = lang === 'am';

  // State for Instant Plate / QR Inspector Search on Dashboard
  const [searchPlate, setSearchPlate] = useState('');
  const [selectedRegForModal, setSelectedRegForModal] = useState<MotorcycleRegistration | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<VerificationLog | null>(null);

  // Match current officer assignment details
  const currentOfficerAssigned = officers.find(
    (o) => o.badgeId.toLowerCase() === userBadgeId.toLowerCase() || o.officerName.toLowerCase().includes(userBadgeId.toLowerCase())
  );

  const activeCheckpointLocation = currentOfficerAssigned?.assignedSubcity
    ? `${currentOfficerAssigned.assignedSubcity} Checkpoint`
    : 'Central Subcity Patrol Checkpoint Alpha';

  const pendingCount = registrations.filter((r) => r.status === 'pending_approval').length;
  const approvedCount = registrations.filter(
    (r) => r.status === 'approved' || r.status === 'printed' || r.status === 'ordered_print'
  ).length;
  const activeOfficersCount = officers.filter((o) => o.status === 'active').length;
  const inPrintCount = printOrders.filter((p) => p.status === 'in_printing').length;

  const totalLogsCount = verificationLogs.length;
  const verifiedLogsCount = verificationLogs.filter((l) => l.verificationStatus === 'verified').length;
  const warningLogsCount = verificationLogs.filter(
    (l) => l.verificationStatus === 'warning' || l.verificationStatus === 'flagged'
  ).length;

  // Search match for live dashboard plate lookup
  const livePlateSearchMatch = searchPlate.trim()
    ? registrations.find(
        (r) =>
          (r.plateNumber || '').toLowerCase().includes(searchPlate.trim().toLowerCase()) ||
          (r.fullName || '').toLowerCase().includes(searchPlate.trim().toLowerCase()) ||
          (r.engineOrSerialNo || '').toLowerCase().includes(searchPlate.trim().toLowerCase())
      )
    : null;

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
              key: 'quick_verify',
              title: isAmharic ? 'QR ካሜራ ፍተሻ' : 'Scan QR Verification',
              subtitle: isAmharic ? 'በሞባይል ካሜራ አረጋግጥ' : 'Camera Permit Verification',
              icon: 'qr_code_scanner',
              iconBg: 'bg-primary text-white group-hover:bg-primary-hover',
            },
            {
              key: 'approved_vehicles',
              title: isAmharic ? 'የፀደቁ ተሽከርካሪዎች' : 'Approved Registry',
              subtitle: `${approvedCount} ${isAmharic ? 'የፀደቁ ተሽከርካሪዎች' : 'valid vehicle permits'}`,
              icon: 'verified',
              iconBg: 'bg-emerald-100 text-emerald-900 group-hover:bg-emerald-600 group-hover:text-white',
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
      {/* OFFICER ACTIVE DUTY & OVERVIEW STATUS DISPLAY */}
      {userRole === 'officer' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 shadow-xs space-y-3">
          {/* Header Banner: Officer Hub Header */}
          <div className="flex items-center gap-1.5 border-b border-outline-variant pb-2">
            <span className="material-symbols-outlined text-[16px] text-primary">policy</span>
            <h2 className="text-xs font-bold text-on-surface">
              {isAmharic ? 'የተቆጣጣሪ የመስክ መቆጣጠሪያ ማዕከል' : 'Field Officer Patrol & Inspection Hub'}
            </h2>
          </div>

          {/* Officer Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded-lg space-y-0.5">
              <div className="flex justify-between items-center text-secondary">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isAmharic ? 'የዛሬ ፍተሻዎች' : 'Verifications Today'}
                </span>
                <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-on-surface">{totalLogsCount}</p>
              <p className="text-[10px] text-emerald-600 font-medium">
                {verifiedLogsCount} {isAmharic ? 'የተረጋገጡ' : 'verified pass'}
              </p>
            </div>

            <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded-lg space-y-0.5">
              <div className="flex justify-between items-center text-secondary">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isAmharic ? 'የፀደቁ ተሽከርካሪዎች' : 'Valid Vehicles'}
                </span>
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">two_wheeler</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-on-surface">{approvedCount}</p>
              <p className="text-[10px] text-secondary font-medium">
                {isAmharic ? 'በሲስተሙ የተመዘገቡ' : 'in active registry'}
              </p>
            </div>

            <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded-lg space-y-0.5">
              <div className="flex justify-between items-center text-secondary">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isAmharic ? 'ማስጠንቀቂያ/ግጭት' : 'Flagged / Warnings'}
                </span>
                <span className="material-symbols-outlined text-amber-600 text-[16px]">warning</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-on-surface">{warningLogsCount}</p>
              <p className="text-[10px] text-amber-600 font-medium">
                {isAmharic ? 'ክትትል የሚሹ' : 'requiring review'}
              </p>
            </div>

            <div className="p-2.5 bg-surface-container-low border border-outline-variant rounded-lg space-y-0.5">
              <div className="flex justify-between items-center text-secondary">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isAmharic ? 'በስራ ላይ ያሉ ተቆጣጣሪዎች' : 'Patrol Officers'}
                </span>
                <span className="material-symbols-outlined text-blue-600 text-[16px]">badge</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-on-surface">{activeOfficersCount}</p>
              <p className="text-[10px] text-blue-600 font-medium">
                {isAmharic ? 'በመደብ ቦታ ላይ' : 'active at checkpoints'}
              </p>
            </div>
          </div>

          {/* Live License Plate Quick Inspection Bar */}
          <div className="p-2.5 bg-surface-container-low/50 border border-outline-variant rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[15px]">search</span>
                <span>{isAmharic ? 'ፈጣን የሰሌዳ / ባለቤት ማረጋገጫ ፈልግ' : 'Instant Plate & Permit Verification Lookup'}</span>
              </label>
              <span className="text-[10px] font-mono text-secondary">
                {isAmharic ? 'ሰሌዳ ወይም ሞተር ሴሪያል ያስገቡ' : 'Enter plate number or serial'}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                placeholder={isAmharic ? 'ምሳሌ፡ AA-12345 ወይም የባለቤት ስም...' : 'Type Plate (e.g. AA-1002), Engine # or Owner name...'}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchPlate && (
                <button
                  type="button"
                  onClick={() => setSearchPlate('')}
                  className="absolute right-2.5 top-1.5 text-secondary hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                </button>
              )}
            </div>

            {/* Match Preview Card */}
            {searchPlate.trim() && (
              <div className="pt-2">
                {livePlateSearchMatch ? (
                  <div className="p-3 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded-lg overflow-hidden border border-outline-variant bg-surface-container shrink-0">
                        {livePlateSearchMatch.userPortraitPhoto || livePlateSearchMatch.nationalIdPhoto ? (
                          <img
                            src={livePlateSearchMatch.userPortraitPhoto || livePlateSearchMatch.nationalIdPhoto}
                            alt={livePlateSearchMatch.fullName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-[18px]">person</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-primary bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                            {livePlateSearchMatch.plateNumber}
                          </span>
                          <span className="font-bold text-xs text-on-surface">{livePlateSearchMatch.fullName}</span>
                        </div>
                        <p className="text-[10px] text-secondary">
                          {isAmharic ? 'ስልክ:' : 'Phone:'} {livePlateSearchMatch.phone} • {livePlateSearchMatch.vehicleCategory === 'electric' ? 'EV' : 'Gasoline'} • Serial: {livePlateSearchMatch.engineOrSerialNo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-outline-variant">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          livePlateSearchMatch.status === 'approved' || livePlateSearchMatch.status === 'printed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {livePlateSearchMatch.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedRegForModal(livePlateSearchMatch)}
                        className="bg-primary hover:bg-primary-hover text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">badge</span>
                        <span>{isAmharic ? 'ካርድ ይመልከቱ' : 'Inspect Card'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>
                      {isAmharic
                        ? `"${searchPlate}" በሲስተሙ አልተገኘም! (የያልተመዘገበ ወይም ያልፀደቀ ተሽከርካሪ)`
                        : `No registered permit record found for "${searchPlate}" in system!`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts Section */}
      {currentRoleConfig.actions.length > 0 && (
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
      )}

      {/* RECENT FIELD VERIFICATIONS FEED FOR OFFICER DASHBOARD */}
      {userRole === 'officer' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">history</span>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                {isAmharic ? 'የቅርብ ጊዜ የመስክ ፍተሻዎች' : 'Recent Field Verifications'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onQuickAction && onQuickAction('system_records')}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isAmharic ? 'ሁሉንም ታሪክ ይመልከቱ' : 'View Full Verification Logs'}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {verificationLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-secondary space-y-1">
              <p className="font-bold">{isAmharic ? 'ምንም የማረጋገጫ ታሪክ አልተመዘገበም' : 'No verification logs recorded yet.'}</p>
              <p className="text-[11px]">
                {isAmharic ? 'የሞባይል ካሜራ በመጠቀም QR ፍቃድ ይፈትሹ።' : 'Use the camera scanner or instant plate search to log new verifications.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {verificationLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-surface-container-low/50 transition-colors px-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-10 rounded-md overflow-hidden border border-outline-variant bg-surface-container shrink-0">
                      {log.userPortraitPhoto || log.nationalIdPhoto ? (
                        <img
                          src={log.userPortraitPhoto || log.nationalIdPhoto}
                          alt={log.fullName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-[16px]">person</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-primary">{log.plateNumber}</span>
                        <span className="font-medium text-xs text-on-surface">{log.fullName}</span>
                      </div>
                      <p className="text-[10px] text-secondary">
                        {log.officerNotes} • <span className="font-mono">{log.scannedAt}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                    <span className="text-[10px] text-secondary font-mono">
                      {log.officerBadgeId || userBadgeId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        log.verificationStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {log.verificationStatus}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedLogForDetails(log)}
                      className="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: INSPECT PERMIT CARD MODAL */}
      {selectedRegForModal && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                <span>{isAmharic ? 'የሞተርሳይክል ፍቃድ ካርድ ቅድመ-እይታ' : 'Permit Card Inspection'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRegForModal(null)}
                className="text-secondary hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <QRCodeCard registration={selectedRegForModal} lang={lang} />

            <button
              type="button"
              onClick={() => setSelectedRegForModal(null)}
              className="w-full bg-primary text-white font-bold py-2 rounded-xl text-xs hover:bg-primary-hover cursor-pointer"
            >
              {isAmharic ? 'ዝጋ' : 'Close Inspection'}
            </button>
          </div>
        </div>
      )}

      <SharedScannerModal
        isOpen={showLookupModal}
        onClose={() => setShowLookupModal(false)}
        lang={lang}
        registrations={registrations}
        userBadgeId={userBadgeId}
        onAddVerificationLog={onAddVerificationLog || (() => {})}
      />
    </div>
  );
};
