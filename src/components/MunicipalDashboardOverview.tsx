import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
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
import { PermitStatusSummary } from './PermitStatusSummary';
import { ZoomableDocumentContainer } from './ZoomableDocumentContainer';
import { SmartImage } from './SmartImage';

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
  onSeedSampleData?: () => void;
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
  onSeedSampleData,
}) => {
  const isAmharic = lang === 'am';

  // State for Instant Plate / QR Inspector Search on Dashboard
  const [searchPlate, setSearchPlate] = useState('');
  const [selectedRegForModal, setSelectedRegForModal] = useState<MotorcycleRegistration | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<VerificationLog | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

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
  const illegalVehiclesCount = registrations.filter((r) => r.status === 'rejected').length;
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
          title: isAmharic ? 'የሥራ አስኪያጅ መቆጣጠሪያዎች' : 'Manager Command Shortcuts',
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
      {/* Inline QR Scanner (In-Page instead of Modal) */}
      {showLookupModal && (
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 shadow-sm space-y-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-outline-variant/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">qr_code_scanner</span>
              <h3 className="font-extrabold text-sm text-on-surface">
                {isAmharic ? 'የቀጥታ QR እና ሰሌዳ መለያ ፍተሻ' : 'Live QR & License Plate Scanner'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowLookupModal(false)}
              className="text-secondary hover:text-on-surface p-1 rounded-lg hover:bg-surface-container text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              <span>{isAmharic ? 'ዝጋ' : 'Close Scanner'}</span>
            </button>
          </div>
          <SharedScannerModal
            isOpen={true}
            onClose={() => setShowLookupModal(false)}
            lang={lang}
            registrations={registrations}
            userBadgeId={userBadgeId || 'OFF-8842'}
            onAddVerificationLog={onAddVerificationLog || (() => {})}
            isPage={true}
          />
        </div>
      )}

      {/* PERMIT STATUS OVERVIEW BREAKDOWN (FOR CLERK AND ADMIN ONLY) */}
      {(userRole === 'clerk' || userRole === 'admin') && (
        <PermitStatusSummary
          registrations={registrations}
          lang={lang}
          onSelectStatusFilter={(statusKey) => {
            if (onQuickAction) {
              if (statusKey === 'pending_approval') {
                onQuickAction('pending_approvals');
              } else if (statusKey === 'approved') {
                onQuickAction('approved_vehicles');
              } else {
                onQuickAction('system_records');
              }
            }
          }}
        />
      )}
      {/* OFFICER ACTIVE DUTY & OVERVIEW STATUS DISPLAY */}
      {userRole === 'officer' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
          {/* Header Banner: Officer Hub Header */}
          <div className="flex items-center gap-2.5 border-b border-outline-variant pb-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">policy</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-on-surface">
                {isAmharic ? 'የተቆጣጣሪ የመስክ መቆጣጠሪያ ማዕከል' : 'Field Officer Patrol & Inspection Hub'}
              </h2>
              <p className="hidden sm:block text-[11px] text-secondary mt-0.5">
                {isAmharic ? 'የአሁኑ የፓትሮል መረጃዎች' : 'Real-time patrol and inspection metrics'}
              </p>
            </div>
          </div>

          {/* Officer Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-surface-container/20 border border-outline-variant/60 rounded-xl p-3 space-y-0.5">
              <div className="flex justify-between items-center text-secondary">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface">
                  {isAmharic ? 'የዛሬ ፍተሻዎች' : 'Verifications Today'}
                </span>
                <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-on-surface">{totalLogsCount}</p>
              <p className="hidden sm:block text-[10px] text-emerald-600 font-medium">
                {verifiedLogsCount} {isAmharic ? 'የተረጋገጡ' : 'verified'}
              </p>
            </div>

            <div className="bg-surface-container/20 border border-outline-variant/60 rounded-xl p-3 space-y-0.5">
              <div className="flex justify-between items-center text-secondary">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface">
                  {isAmharic ? 'የፀደቁ ተሽከርካሪዎች' : 'Valid Vehicles'}
                </span>
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">two_wheeler</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-on-surface">{approvedCount}</p>
              <p className="hidden sm:block text-[10px] text-secondary font-medium">
                {isAmharic ? 'በሲስተሙ የተመዘገቡ' : 'registered'}
              </p>
            </div>

            <div className="bg-surface-container/20 border border-outline-variant/60 rounded-xl p-3 space-y-0.5">
              <div className="flex justify-between items-center text-secondary">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface">
                  {isAmharic ? 'ማስጠንቀቂያ/ግጭት' : 'Warnings'}
                </span>
                <span className="material-symbols-outlined text-amber-600 text-[16px]">warning</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-on-surface">{warningLogsCount}</p>
              <p className="hidden sm:block text-[10px] text-amber-600 font-medium">
                {isAmharic ? 'ክትትል የሚሹ' : 'needs review'}
              </p>
            </div>
            
            <div className="bg-surface-container/20 border border-outline-variant/60 rounded-xl p-3 space-y-0.5">
              <div className="flex justify-between items-center text-secondary">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface">
                  {isAmharic ? 'ሕገ-ወጥ ተሽከርካሪዎች' : 'Illegal Vehicles'}
                </span>
                <span className="material-symbols-outlined text-red-600 text-[16px]">block</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-on-surface">{illegalVehiclesCount}</p>
              <p className="hidden sm:block text-[10px] text-red-600 font-medium">
                {isAmharic ? 'የተከለከሉ' : 'rejected'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts Section */}
      {currentRoleConfig.actions.length > 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant/60 p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-2.5">
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
                  <p className="hidden sm:block text-[10px] text-secondary truncate">{act.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RECENT FIELD VERIFICATIONS FEED FOR OFFICER DASHBOARD */}
      {userRole === 'officer' && (
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 shadow-xs space-y-3">
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
                    <div
                      onClick={() => {
                        const imgUrl = log.userPortraitPhoto || log.nationalIdPhoto;
                        if (imgUrl) {
                          setZoomedImage({
                            url: imgUrl,
                            title: `${log.fullName} — ${isAmharic ? 'የባለቤት ፎቶ' : 'Driver Portrait'}`
                          });
                        }
                      }}
                      className="w-8 h-10 rounded-md overflow-hidden border border-outline-variant bg-surface-container shrink-0 cursor-pointer group hover:opacity-90 relative transition-opacity"
                      title={isAmharic ? 'ለማጉላት ይጫኑ' : 'Click to Zoom Photo'}
                    >
                      <SmartImage
                        src={log.userPortraitPhoto || log.nationalIdPhoto}
                        alt={log.fullName}
                        fallbackIcon="person"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                      </div>
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
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto transition-all duration-200">
          <ZoomableDocumentContainer
            lang={lang}
            userRole={userRole}
            title={isAmharic ? 'የሞተርሳይክል ፍቃድ ካርድ ቅድመ-እይታ' : 'Permit Card Inspection'}
            onClose={() => setSelectedRegForModal(null)}
            onPrint={() => {
              document.body.setAttribute('data-print-target', 'id-card');
              window.focus();
              setTimeout(() => {
                try {
                  window.print();
                } finally {
                  document.body.removeAttribute('data-print-target');
                }
              }, 100);
            }}
          >
            <QRCodeCard registration={selectedRegForModal} lang={lang} />
          </ZoomableDocumentContainer>
        </div>
      )}

      {/* MODAL: INSPECT LOG DETAILS DIGITAL ID CARD */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto transition-all duration-200">
          <ZoomableDocumentContainer
            lang={lang}
            userRole={userRole}
            title={isAmharic ? 'የፍተሻ ዲጂታል መታወቂያ' : 'Verification Log Digital ID'}
            onClose={() => setSelectedLogForDetails(null)}
            onPrint={() => {
              document.body.setAttribute('data-print-target', 'id-card');
              window.focus();
              setTimeout(() => {
                try {
                  window.print();
                } finally {
                  document.body.removeAttribute('data-print-target');
                }
              }, 100);
            }}
          >
            <QRCodeCard
              registration={
                registrations.find((r) => r.plateNumber === selectedLogForDetails.plateNumber) || {
                  id: selectedLogForDetails.id,
                  fullName: selectedLogForDetails.fullName,
                  phone: selectedLogForDetails.phone,
                  userPortraitPhoto: selectedLogForDetails.userPortraitPhoto,
                  nationalIdPhoto: selectedLogForDetails.nationalIdPhoto || '',
                  drivingLicensePhoto: selectedLogForDetails.drivingLicensePhoto || '',
                  drivingPermitPhoto: selectedLogForDetails.drivingPermitPhoto || '',
                  vehicleCategory: selectedLogForDetails.vehicleCategory,
                  engineOrSerialNo: selectedLogForDetails.engineOrSerialNo,
                  plateNumber: selectedLogForDetails.plateNumber,
                  registrationDate: selectedLogForDetails.scannedAt,
                  status: selectedLogForDetails.permitStatus,
                  qrCodeData: selectedLogForDetails.plateNumber,
                  registeredBy: selectedLogForDetails.officerBadgeId || userBadgeId,
                }
              }
              lang={lang}
            />
          </ZoomableDocumentContainer>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR EXPANDED DOCUMENT INSPECTION */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setZoomedImage(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl">
            <ZoomableDocumentContainer
              lang={lang}
              title={zoomedImage.title}
              onClose={() => setZoomedImage(null)}
              requireClerkRequest={false}
            >
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </ZoomableDocumentContainer>
          </div>
        </div>
      )}
    </div>
  );
};
