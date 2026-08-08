import React, { useState } from 'react';
import {
  Language,
  UserRole,
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
} from '../types';
import { QRCodeCard } from './QRCodeCard';

interface TablesPageProps {
  lang: Language;
  userRole: UserRole;
  registrations: MotorcycleRegistration[];
  officers: OfficerAssignment[];
  printOrders: PrintBatchOrder[];
  onApproveRegistration: (id: string) => void;
  onRejectRegistration: (id: string, reason: string) => void;
  onUpdateOrderStatus: (
    orderId: string,
    status: 'pending' | 'in_printing' | 'completed'
  ) => void;
}

export const TablesPage: React.FC<TablesPageProps> = ({
  lang,
  userRole,
  registrations,
  officers,
  printOrders,
  onApproveRegistration,
  onRejectRegistration,
  onUpdateOrderStatus,
}) => {
  const isAmharic = lang === 'am';

  // Table category tab: 'registrations' | 'officers' | 'print_orders'
  const [activeTableTab, setActiveTableTab] = useState<'registrations' | 'officers' | 'print_orders'>('registrations');

  // --- REGISTRATIONS TABLE STATE ---
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState<string>('all');
  const [selectedRegForQR, setSelectedRegForQR] = useState<MotorcycleRegistration | null>(null);

  // Rejection reason prompt state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.plateNumber.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.engineOrSerialNo.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(regSearch.toLowerCase()) ||
      r.phone.includes(regSearch);

    const matchesStatus =
      regStatusFilter === 'all' ? true : r.status === regStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleConfirmReject = (id: string) => {
    if (!rejectReason.trim()) return;
    onRejectRegistration(id, rejectReason.trim());
    setRejectingId(null);
    setRejectReason('');
  };

  // --- MOBILE COLLAPSED TABLE ROW EXPANSION STATES ---
  const [expandedRegs, setExpandedRegs] = useState<Record<string, boolean>>({});
  const [expandedOfficers, setExpandedOfficers] = useState<Record<string, boolean>>({});
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleRegExpand = (id: string) => {
    setExpandedRegs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleOfficerExpand = (id: string) => {
    setExpandedOfficers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleOrderExpand = (id: string) => {
    setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const [officerSearch, setOfficerSearch] = useState('');
  const [subCityFilter, setSubCityFilter] = useState<string>('all');

  const filteredOfficers = officers.filter((o) => {
    const matchesSearch =
      o.officerName.toLowerCase().includes(officerSearch.toLowerCase()) ||
      o.badgeId.toLowerCase().includes(officerSearch.toLowerCase()) ||
      o.assignedLocation.toLowerCase().includes(officerSearch.toLowerCase());

    const matchesSubCity =
      subCityFilter === 'all' ? true : o.subCity === subCityFilter;

    return matchesSearch && matchesSubCity;
  });

  // --- PRINT ORDERS TABLE STATE ---
  const [printSearch, setPrintSearch] = useState('');
  const [printStatusFilter, setPrintStatusFilter] = useState<string>('all');

  const filteredPrintOrders = printOrders.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(printSearch.toLowerCase()) ||
      p.notes.toLowerCase().includes(printSearch.toLowerCase());

    const matchesStatus =
      printStatusFilter === 'all' ? true : p.status === printStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
      {/* Combined Tab Header */}
      <div className="bg-surface-container/50 border-b border-outline-variant px-3 sm:px-4 pt-2">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTableTab('registrations')}
              className={`pb-2.5 pt-1.5 px-1 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTableTab === 'registrations'
                  ? 'border-primary text-primary font-extrabold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>
                {isAmharic ? 'የሞተርሳይክል ምዝገባዎች' : 'Motor Registrations'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTableTab === 'registrations' ? 'bg-sky-100 text-sky-800' : 'bg-surface-container text-secondary'
              }`}>
                {registrations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('officers')}
              className={`pb-2.5 pt-1.5 px-1 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTableTab === 'officers'
                  ? 'border-primary text-primary font-extrabold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>
                {isAmharic ? 'የመስክ ተቆጣጣሪዎች መዝገብ' : 'Officers Directory'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTableTab === 'officers' ? 'bg-sky-100 text-sky-800' : 'bg-surface-container text-secondary'
              }`}>
                {officers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('print_orders')}
              className={`pb-2.5 pt-1.5 px-1 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTableTab === 'print_orders'
                  ? 'border-primary text-primary font-extrabold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>
                {isAmharic ? 'የሕትመት ትእዛዞች' : 'Print Batch Orders'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTableTab === 'print_orders' ? 'bg-sky-100 text-sky-800' : 'bg-surface-container text-secondary'
              }`}>
                {printOrders.length}
              </span>
            </button>
          </div>
        </div>

      {/* Main Tab Content Body */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* --- TABLE 1: MOTORCYCLE REGISTRATIONS TABLE --- */}
        {activeTableTab === 'registrations' && (
          <div className="space-y-3">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row justify-between gap-2.5 border-b border-outline-variant pb-2.5">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[18px]">search</span>
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder={isAmharic ? 'በስም፣ በሰሌዳ ቁጥር፣ በሴሪያል ወይም ስልክ ፈልግ...' : 'Search name, plate no, serial, or phone...'}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1 bg-surface-container p-1 rounded-xl text-xs">
              {['all', 'pending_approval', 'approved', 'ordered_print', 'printed', 'rejected'].map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setRegStatusFilter(statusKey)}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer capitalize ${
                    regStatusFilter === statusKey
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  {statusKey === 'all'
                    ? (isAmharic ? 'ሁሉንም' : 'All')
                    : statusKey === 'pending_approval'
                    ? (isAmharic ? 'የሚጠበቁ' : 'Pending')
                    : statusKey === 'approved'
                    ? (isAmharic ? 'የፀደቁ' : 'Approved')
                    : statusKey === 'ordered_print'
                    ? (isAmharic ? 'ለሕትመት' : 'In Print')
                    : statusKey === 'printed'
                    ? (isAmharic ? 'የታተሙ' : 'Printed')
                    : (isAmharic ? 'ተሰረዙ' : 'Rejected')}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Collapsed Cards View (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredRegistrations.length === 0 ? (
              <div className="p-6 text-center text-secondary text-xs bg-surface-container/30 rounded-xl">
                {isAmharic ? 'ምንም የሚመሳሰል መዝገብ አልተገኘም' : 'No matching vehicle records found.'}
              </div>
            ) : (
              filteredRegistrations.map((reg) => {
                const isExpanded = !!expandedRegs[reg.id];
                return (
                  <div key={reg.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-2xs">
                    {/* Collapsed Header Bar */}
                    <div
                      onClick={() => toggleRegExpand(reg.id)}
                      className="p-3 bg-surface-container/30 hover:bg-surface-container/60 cursor-pointer flex items-center justify-between gap-2 transition-colors select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-on-surface truncate">{reg.fullName}</span>
                          <span className="font-mono font-bold text-[11px] text-primary bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 shrink-0">
                            {reg.plateNumber}
                          </span>
                        </div>
                        <div className="text-[10px] text-secondary mt-0.5 flex items-center gap-2">
                          <span>{reg.phone}</span>
                          <span>•</span>
                          <span className="font-mono">{reg.registrationDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                          reg.status === 'printed' ? 'bg-blue-100 text-blue-800' :
                          reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          reg.status === 'ordered_print' ? 'bg-sky-100 text-sky-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {reg.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="material-symbols-outlined text-[18px] text-outline">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Details Body */}
                    {isExpanded && (
                      <div className="p-3 border-t border-outline-variant/60 space-y-2.5 text-xs bg-white/50">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-secondary font-semibold block">{isAmharic ? 'ዓይነት (Category):' : 'Category:'}</span>
                            <span className="font-bold text-on-surface">
                              {reg.vehicleCategory === 'electric' ? 'Electric EV' : 'Gas (<110cc)'}
                            </span>
                          </div>
                          <div>
                            <span className="text-secondary font-semibold block">{isAmharic ? 'ሴሪያል ቁጥር:' : 'Serial No:'}</span>
                            <span className="font-mono font-semibold text-on-surface">{reg.engineOrSerialNo}</span>
                          </div>
                          {reg.motorBrand && (
                            <div>
                              <span className="text-secondary font-semibold block">{isAmharic ? 'ብራንድ / ሞዴል:' : 'Brand & Model:'}</span>
                              <span className="text-on-surface">{reg.motorBrand} {reg.motorModel || ''}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-secondary font-semibold block">{isAmharic ? 'የተመዘገበበት ባጅ:' : 'Registered By:'}</span>
                            <span className="font-mono text-outline">{reg.registeredBy}</span>
                          </div>
                        </div>

                        {/* Actions Footer inside Collapsed Card */}
                        <div className="pt-2 border-t border-outline-variant/50 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRegForQR(reg)}
                            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                            <span>{isAmharic ? 'መታወቂያ ተመልከት' : 'View ID Card'}</span>
                          </button>

                          {userRole === 'admin' && reg.status === 'pending_approval' && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onApproveRegistration(reg.id)}
                                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                              >
                                {isAmharic ? 'አፅድቅ' : 'Approve'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingId(reg.id)}
                                className="px-3 py-1.5 bg-red-100 text-red-800 font-bold rounded-lg text-xs cursor-pointer"
                              >
                                {isAmharic ? 'ሰርዝ' : 'Reject'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-secondary font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="px-2.5 py-2">{isAmharic ? 'ባለቤት / ስም' : 'Owner Name'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ሰሌዳ ቁጥር' : 'Plate No'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ዓይነት' : 'Category'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ሴሪያል ቁጥር' : 'Serial No'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'የቀን ሁኔታ' : 'Reg Date'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                  <th className="px-2.5 py-2 text-right">{isAmharic ? 'እርምጃዎች' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-secondary">
                      {isAmharic ? 'ምንም የሚመሳሰል መዝገብ አልተገኘም' : 'No matching vehicle records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-2.5 py-2">
                        <div className="font-bold text-on-surface">{reg.fullName}</div>
                        <div className="text-[10px] text-secondary">
                          {reg.phone} {reg.motorBrand ? `• ${reg.motorBrand} ${reg.motorModel || ''}` : ''}
                        </div>
                      </td>
                      <td className="px-2.5 py-2 font-mono font-bold text-primary">{reg.plateNumber}</td>
                      <td className="px-2.5 py-2">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-bold text-secondary">
                          {reg.vehicleCategory === 'electric' ? 'Electric EV' : '<110cc Engine'}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 font-mono text-[11px] text-secondary">{reg.engineOrSerialNo}</td>
                      <td className="px-2.5 py-2 text-[11px] text-secondary">{reg.registrationDate}</td>
                      <td className="px-2.5 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            reg.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : reg.status === 'printed'
                              ? 'bg-blue-100 text-blue-800'
                              : reg.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : reg.status === 'ordered_print'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {reg.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Admin approval buttons if pending */}
                          {userRole === 'admin' && reg.status === 'pending_approval' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApproveRegistration(reg.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                              >
                                {isAmharic ? 'አፅድቅ' : 'Approve'}
                              </button>

                              <button
                                type="button"
                                onClick={() => setRejectingId(reg.id)}
                                className="px-2 py-1 bg-red-100 text-red-800 hover:bg-red-200 font-bold rounded-lg text-[10px] cursor-pointer"
                              >
                                {isAmharic ? 'ሰርዝ' : 'Reject'}
                              </button>
                            </>
                          )}

                          {/* Inspect QR Card button */}
                          <button
                            type="button"
                            onClick={() => setSelectedRegForQR(reg)}
                            className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors cursor-pointer"
                            title="Inspect Badge & QR Code"
                          >
                            <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TABLE 2: OFFICERS DIRECTORY TABLE --- */}
      {activeTableTab === 'officers' && (
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row justify-between gap-2.5 border-b border-outline-variant pb-2.5">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[18px]">search</span>
              <input
                type="text"
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                placeholder={isAmharic ? 'በተቆጣጣሪ ስም፣ ባጅ ቁጥር ወይም ቦታ ፈልግ...' : 'Search officer name, badge ID, location...'}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={subCityFilter}
              onChange={(e) => setSubCityFilter(e.target.value)}
              className="bg-surface border border-outline-variant rounded-xl px-2.5 py-1.5 text-xs text-on-surface focus:outline-none"
            >
              <option value="all">{isAmharic ? 'ሁሉም ክፍለ ከተሞች' : 'All Sub-Cities'}</option>
              <option value="Bole Sub-City">Bole Sub-City</option>
              <option value="Kirkos Sub-City">Kirkos Sub-City</option>
              <option value="Yeka Sub-City">Yeka Sub-City</option>
              <option value="Arada Sub-City">Arada Sub-City</option>
            </select>
          </div>

          {/* Mobile Collapsed Cards View (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredOfficers.length === 0 ? (
              <div className="p-6 text-center text-secondary text-xs bg-surface-container/30 rounded-xl">
                {isAmharic ? 'ምንም የሚመሳሰል ተቆጣጣሪ አልተገኘም' : 'No matching officer assignments found.'}
              </div>
            ) : (
              filteredOfficers.map((off) => {
                const isExpanded = !!expandedOfficers[off.id];
                return (
                  <div key={off.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-2xs">
                    {/* Collapsed Header */}
                    <div
                      onClick={() => toggleOfficerExpand(off.id)}
                      className="p-3 bg-surface-container/30 hover:bg-surface-container/60 cursor-pointer flex items-center justify-between gap-2 transition-colors select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-on-surface truncate">{off.officerName}</span>
                          <span className="font-mono font-bold text-[10px] text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 shrink-0">
                            {off.badgeId}
                          </span>
                        </div>
                        <div className="text-[10px] text-secondary mt-0.5 flex items-center gap-2">
                          <span className="font-semibold text-sky-900">{off.subCity}</span>
                          <span>•</span>
                          <span>{off.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                          <span>{isAmharic ? 'በስራ ላይ' : 'Active'}</span>
                        </span>
                        <span className="material-symbols-outlined text-[18px] text-outline">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Details Body */}
                    {isExpanded && (
                      <div className="p-3 border-t border-outline-variant/60 space-y-2 text-xs bg-white/50">
                        <div>
                          <span className="text-secondary font-semibold block text-[10px]">{isAmharic ? 'የተመደበበት ቦታ:' : 'Assigned Checkpoint:'}</span>
                          <span className="font-bold text-on-surface">{off.assignedLocation}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-outline-variant/40">
                          <div>
                            <span className="text-secondary font-semibold block">{isAmharic ? 'ፈረቃ:' : 'Shift Hours:'}</span>
                            <span className="text-on-surface">{off.shiftHours}</span>
                          </div>
                          <div>
                            <span className="text-secondary font-semibold block">{isAmharic ? 'ስልክ ቁጥር:' : 'Contact Phone:'}</span>
                            <span className="font-mono text-on-surface">{off.phone}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-secondary font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="px-2.5 py-2">{isAmharic ? 'ተቆጣጣሪ / ባጅ' : 'Officer Name & Badge'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ክፍለ ከተማ' : 'Sub-City'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'የተመደበበት ቦታ' : 'Assigned Checkpoint'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ፈረቃ' : 'Shift Hours'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ስልክ' : 'Contact Phone'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ሁኔታ' : 'Patrol Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredOfficers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-secondary">
                      {isAmharic ? 'ምንም የሚመሳሰል ተቆጣጣሪ አልተገኘም' : 'No matching officer assignments found.'}
                    </td>
                  </tr>
                ) : (
                  filteredOfficers.map((off) => (
                    <tr key={off.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-2.5 py-2">
                        <div className="font-bold text-on-surface">{off.officerName}</div>
                        <div className="text-[10px] text-sky-700 font-mono font-bold">{off.badgeId}</div>
                      </td>
                      <td className="px-2.5 py-2">
                        <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-[10px] font-bold text-sky-900">
                          {off.subCity}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 font-semibold text-on-surface">{off.assignedLocation}</td>
                      <td className="px-2.5 py-2 text-[11px] text-secondary">{off.shiftHours}</td>
                      <td className="px-2.5 py-2 text-[11px] font-mono text-secondary">{off.phone}</td>
                      <td className="px-2.5 py-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 flex items-center gap-1 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                          <span>{isAmharic ? 'በስራ ላይ' : 'Active Patrol'}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TABLE 3: PRINT BATCH ORDERS TABLE --- */}
      {activeTableTab === 'print_orders' && (
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row justify-between gap-2.5 border-b border-outline-variant pb-2.5">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-[18px]">search</span>
              <input
                type="text"
                value={printSearch}
                onChange={(e) => setPrintSearch(e.target.value)}
                placeholder={isAmharic ? 'በባች ቁጥር ወይም ማስታወሻ ፈልግ...' : 'Search batch ID or order notes...'}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-1 bg-surface-container p-1 rounded-xl text-xs">
              {['all', 'pending', 'in_printing', 'completed'].map((statusKey) => (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setPrintStatusFilter(statusKey)}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer capitalize ${
                    printStatusFilter === statusKey
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  {statusKey === 'all'
                    ? (isAmharic ? 'ሁሉንም' : 'All')
                    : statusKey === 'pending'
                    ? (isAmharic ? 'የሚጠበቁ' : 'Pending')
                    : statusKey === 'in_printing'
                    ? (isAmharic ? 'በሕትመት ላይ' : 'In Press')
                    : (isAmharic ? 'የተጠናቀቁ' : 'Completed')}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Collapsed Cards View (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredPrintOrders.length === 0 ? (
              <div className="p-6 text-center text-secondary text-xs bg-surface-container/30 rounded-xl">
                {isAmharic ? 'ምንም የሕትመት ትእዛዝ አልተገኘም' : 'No matching print orders found.'}
              </div>
            ) : (
              filteredPrintOrders.map((order) => {
                const isExpanded = !!expandedOrders[order.id];
                return (
                  <div key={order.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-2xs">
                    {/* Collapsed Header */}
                    <div
                      onClick={() => toggleOrderExpand(order.id)}
                      className="p-3 bg-surface-container/30 hover:bg-surface-container/60 cursor-pointer flex items-center justify-between gap-2 transition-colors select-none"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-700">{order.id}</span>
                          <span className="font-bold text-xs text-on-surface">({order.totalItems} ID Badges)</span>
                        </div>
                        <div className="text-[10px] text-secondary mt-0.5">
                          <span>{isAmharic ? 'ቀን፡' : 'Date:'} {order.orderDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_printing' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                        <span className="material-symbols-outlined text-[18px] text-outline">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Details Body */}
                    {isExpanded && (
                      <div className="p-3 border-t border-outline-variant/60 space-y-2.5 text-xs bg-white/50">
                        <div>
                          <span className="text-secondary font-semibold block text-[10px]">{isAmharic ? 'ማስታወሻ (Notes):' : 'Notes:'}</span>
                          <span className="text-on-surface">{order.notes || '—'}</span>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-outline-variant/50 flex justify-end gap-2">
                          {order.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'in_printing')}
                              className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                            >
                              {isAmharic ? 'ሕትመት ጀምር' : 'Start Press'}
                            </button>
                          )}
                          {order.status === 'in_printing' && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                              className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs cursor-pointer"
                            >
                              {isAmharic ? 'አጠናቅቀህ አጠናቅቅ' : 'Mark Completed'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container text-secondary font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="px-2.5 py-2">{isAmharic ? 'የባች ቁጥር' : 'Batch Order ID'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ብዛት' : 'Total Badges'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'የታዘዘበት ቀን' : 'Order Date'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ማስታወሻ' : 'Notes'}</th>
                  <th className="px-2.5 py-2">{isAmharic ? 'ሁኔታ' : 'Press Status'}</th>
                  <th className="px-2.5 py-2 text-right">{isAmharic ? 'እርምጃዎች' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredPrintOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-secondary">
                      {isAmharic ? 'ምንም የሕትመት ትእዛዝ አልተገኘም' : 'No matching print orders found.'}
                    </td>
                  </tr>
                ) : (
                  filteredPrintOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-2.5 py-2 font-mono font-bold text-blue-700">{order.id}</td>
                      <td className="px-2.5 py-2 font-bold text-on-surface">{order.totalItems} ID Badges & Stickers</td>
                      <td className="px-2.5 py-2 text-[11px] text-secondary">{order.orderDate}</td>
                      <td className="px-2.5 py-2 text-secondary">{order.notes || '—'}</td>
                      <td className="px-2.5 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'in_printing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'in_printing')}
                              className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                            >
                              {isAmharic ? 'ሕትመት ጀምር' : 'Start Press'}
                            </button>
                          )}

                          {order.status === 'in_printing' && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                            >
                              {isAmharic ? 'አጠናቅቀህ አጠናቅቅ' : 'Mark Completed'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* QR Inspector Modal */}
      {selectedRegForQR && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">qr_code_2</span>
                <span>{isAmharic ? 'የባለቤትነት QR መታወቂያ' : 'Official Digital Permit & QR Badge'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRegForQR(null)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <QRCodeCard registration={selectedRegForQR} lang={lang} />
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-error flex items-center gap-2">
              <span className="material-symbols-outlined">cancel</span>
              <span>{isAmharic ? 'የመዝገብ መሰረዣ ምክንያት' : 'Provide Rejection Reason'}</span>
            </h3>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={isAmharic ? 'ምሳሌ፡ ያልተሟላ የመንጃ ፍቃድ ፎቶ' : 'e.g. Invalid engine serial number or blurry license photo'}
              className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-xs text-on-surface h-24 focus:outline-none focus:ring-2 focus:ring-error"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 bg-surface-container text-secondary text-xs rounded-xl font-bold cursor-pointer"
              >
                {isAmharic ? 'ተመለስ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(rejectingId)}
                className="px-4 py-1.5 bg-error text-white text-xs rounded-xl font-bold cursor-pointer"
              >
                {isAmharic ? 'ሰርዝ' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
