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
        userRole={userRole}
        onSelectStatusFilter={(status) => {
          if (status === 'pending_approval' && onQuickAction) {
            onQuickAction('pending_approvals');
          } else if (onQuickAction) {
            onQuickAction('system_records');
          }
        }}
      />



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
