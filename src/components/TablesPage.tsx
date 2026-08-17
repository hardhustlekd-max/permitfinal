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
import { A4PermitPaper } from './A4PermitPaper';
import { OfficerVerificationHistory } from './OfficerVerificationHistory';
import { VehicleQRSticker } from './VehicleQRSticker';
import { ZoomableDocumentContainer } from './ZoomableDocumentContainer';
import { SmartImage } from './SmartImage';
import { DataField, SelectField, Badge } from './ui/StreamlinedUI';


interface TablesPageProps {
  lang: Language;
  userRole: UserRole;
  userBadgeId?: string;
  registrations: MotorcycleRegistration[];
  officers: OfficerAssignment[];
  printOrders: PrintBatchOrder[];
  verificationLogs?: VerificationLog[];
  onApproveRegistration: (id: string) => void;
  onRejectRegistration: (id: string, reason: string) => void;
  onUpdateOrderStatus: (
    orderId: string,
    status: 'pending' | 'in_printing' | 'completed'
  ) => void;
  onAddVerificationLog?: (log: VerificationLog) => void;
  onSeedSampleData?: () => void;
}

const SeedDataBanner: React.FC<{ isAmharic: boolean; onSeed: () => void }> = ({ isAmharic, onSeed }) => {
  const [loading, setLoading] = useState(false);
  const handleSeed = async () => {
    setLoading(true);
    try {
      await onSeed();
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6 text-center bg-surface border border-outline-variant rounded-xl max-w-xl mx-auto my-4 space-y-4 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-[28px] animate-pulse">database_sync</span>
      </div>
      <div className="space-y-1">
        <h3 className="font-extrabold text-sm text-on-surface">
          {isAmharic ? 'ዳታቤዙ ባዶ ነው' : 'Database Has No Records'}
        </h3>
        <p className="text-[11px] text-secondary leading-relaxed">
          {isAmharic
            ? 'አዲሱ የፋየርቤዝ "permit" ዳታቤዝ በተሳካ ሁኔታ ተገናኝቷል። አዳዲስ መዝገቦችን በሲስተሙ ውስጥ ማከል ይችላሉ።'
            : 'Your Firebase "permit" database is connected and ready. New records added to the system will appear here.'}
        </p>
      </div>
    </div>
  );
};

export const TablesPage: React.FC<TablesPageProps> = ({
  lang,
  userRole,
  userBadgeId,
  registrations,
  officers,
  printOrders,
  verificationLogs = [],
  onApproveRegistration,
  onRejectRegistration,
  onUpdateOrderStatus,
  onAddVerificationLog,
  onSeedSampleData,
}) => {
  const isAmharic = lang === 'am';

  const renderStatusIconBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge
            variant="success"
            label={isAmharic ? 'የተፈቀደ (Approved)' : 'Approved'}
            className="shadow-2xs"
          />
        );
      case 'printed':
        return (
          <Badge
            variant="primary"
            label={isAmharic ? 'የታተመ (Printed)' : 'Printed'}
            className="shadow-2xs"
          />
        );
      case 'ordered_print':
        return (
          <Badge
            variant="info"
            label={isAmharic ? 'ለሕትመት (In Print)' : 'In Print'}
            className="shadow-2xs"
          />
        );
      case 'rejected':
        return (
          <Badge
            variant="error"
            label={isAmharic ? 'ውድቅ (Rejected)' : 'Rejected'}
            className="shadow-2xs"
          />
        );
      case 'pending_approval':
      case 'pending':
      default:
        return (
          <Badge
            variant="warning"
            label={isAmharic ? 'የሚጠበቅ (Pending)' : 'Pending'}
            className="shadow-2xs animate-pulse"
          />
        );
    }
  };

  // If user role is Officer, render the dedicated Verification History & Scanned Vehicles Log
  if (userRole === 'officer') {
    return (
      <OfficerVerificationHistory
        lang={lang}
        userRole={userRole}
        userBadgeId={userBadgeId}
        registrations={registrations}
        verificationLogs={verificationLogs}
        onAddVerificationLog={onAddVerificationLog}
      />
    );
  }

  const canShowRegistration = userRole === 'clerk' || userRole === 'admin';
  const canShowPrint = userRole === 'admin';

  // Table category tab: 'registrations' | 'print_orders'
  const getInitialTab = (): 'registrations' | 'print_orders' => {
    return 'registrations';
  };

  const [activeTableTab, setActiveTableTab] = useState<'registrations' | 'print_orders'>(getInitialTab);

  React.useEffect(() => {
    if (activeTableTab === 'registrations' && !canShowRegistration) {
      if (canShowPrint) setActiveTableTab('print_orders');
    } else if (activeTableTab === 'print_orders' && !canShowPrint) {
      if (canShowRegistration) setActiveTableTab('registrations');
    }
  }, [userRole, activeTableTab, canShowRegistration, canShowPrint]);

  // --- REGISTRATIONS TABLE STATE ---
  const [regSearch, setRegSearch] = useState('');
  const [regPage, setRegPage] = useState(1);
  const [regPageSize, setRegPageSize] = useState(10);

  const [selectedRegForQR, setSelectedRegForQR] = useState<MotorcycleRegistration | null>(null);
  const [selectedRegForA4, setSelectedRegForA4] = useState<MotorcycleRegistration | null>(null);
  const [selectedRegForSticker, setSelectedRegForSticker] = useState<MotorcycleRegistration | null>(null);
  const [selectedRegForDetails, setSelectedRegForDetails] = useState<MotorcycleRegistration | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  // Rejection reason prompt state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredRegistrations = registrations.filter((r) => {
    const cleanSearch = regSearch.trim().toLowerCase();
    if (!cleanSearch) return true;
    return (
      (r.fullName || '').toLowerCase().includes(cleanSearch) ||
      (r.plateNumber || '').toLowerCase().includes(cleanSearch) ||
      (r.engineOrSerialNo || '').toLowerCase().includes(cleanSearch) ||
      (r.id || '').toLowerCase().includes(cleanSearch) ||
      (r.phone || '').includes(cleanSearch) ||
      (r.motorBrand || '').toLowerCase().includes(cleanSearch) ||
      (r.motorModel || '').toLowerCase().includes(cleanSearch) ||
      (r.subCity || '').toLowerCase().includes(cleanSearch)
    );
  });

  const totalRegs = filteredRegistrations.length;
  const totalRegPages = Math.ceil(totalRegs / regPageSize) || 1;
  const activeRegPage = Math.min(regPage, totalRegPages);
  const regStartIndex = (activeRegPage - 1) * regPageSize;
  const paginatedRegistrations = filteredRegistrations.slice(regStartIndex, regStartIndex + regPageSize);

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
      (o.officerName || '').toLowerCase().includes(officerSearch.toLowerCase()) ||
      (o.badgeId || '').toLowerCase().includes(officerSearch.toLowerCase()) ||
      (o.assignedLocation || '').toLowerCase().includes(officerSearch.toLowerCase());

    const matchesSubCity =
      subCityFilter === 'all' ? true : o.subCity === subCityFilter;

    return matchesSearch && matchesSubCity;
  });

  // --- PRINT ORDERS TABLE STATE ---
  const [printSearch, setPrintSearch] = useState('');
  const [printStatusFilter, setPrintStatusFilter] = useState<string>('all');
  const [printPage, setPrintPage] = useState(1);
  const [printPageSize, setPrintPageSize] = useState(10);

  const filteredPrintOrders = printOrders.filter((p) => {
    const matchesSearch =
      (p.id || '').toLowerCase().includes(printSearch.toLowerCase()) ||
      (p.notes || '').toLowerCase().includes(printSearch.toLowerCase());

    const matchesStatus =
      printStatusFilter === 'all' ? true : p.status === printStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPrintOrders = filteredPrintOrders.length;
  const totalPrintPages = Math.ceil(totalPrintOrders / printPageSize) || 1;
  const activePrintPage = Math.min(printPage, totalPrintPages);
  const printStartIndex = (activePrintPage - 1) * printPageSize;
  const paginatedPrintOrders = filteredPrintOrders.slice(printStartIndex, printStartIndex + printPageSize);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
      {/* Combined Tab Header */}
      <div className="bg-surface-container/50 border-b border-outline-variant px-3 sm:px-4 pt-2">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto text-xs font-bold">
          {canShowRegistration && (
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
          )}

          {canShowPrint && (
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
          )}
          </div>
        </div>

      {/* Main Tab Content Body */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* --- TABLE 1: MOTORCYCLE REGISTRATIONS TABLE --- */}
        {activeTableTab === 'registrations' && (
          registrations.length === 0 && onSeedSampleData ? (
            <SeedDataBanner isAmharic={isAmharic} onSeed={onSeedSampleData} />
          ) : (
            <div className="space-y-3">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-2.5 border-b border-outline-variant pb-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center justify-center pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </div>
              <input
                type="text"
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder={isAmharic ? 'በስም፣ በሰሌዳ ቁጥር፣ በሴሪያል ወይም ስልክ ፈልግ...' : 'Search name, plate no, serial, or phone...'}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-10 pr-8 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {regSearch && (
                <button
                  type="button"
                  onClick={() => setRegSearch('')}
                  className="absolute inset-y-0 right-3 flex items-center justify-center text-secondary hover:text-on-surface text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Mobile Collapsed Cards View (< md) */}
          <div className="block md:hidden space-y-3">
            {registrations.length === 0 ? (
              <div className="p-6 text-center text-secondary text-xs bg-surface-container/30 rounded-xl font-bold">
                {isAmharic ? 'ምንም መዝገብ አልተገኘም (ባዶ / Empty)' : 'Empty — No vehicle records found.'}
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="p-6 text-center text-secondary text-xs bg-surface-container/30 rounded-xl space-y-2">
                <div>{isAmharic ? 'ምንም የሚመሳሰል መዝገብ አልተገኘም' : 'No matching vehicle records found.'}</div>
                {regSearch && (
                  <button
                    type="button"
                    onClick={() => setRegSearch('')}
                    className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs rounded-xl border border-outline-variant transition-colors cursor-pointer"
                  >
                    {isAmharic ? 'ፍለጋውን አጽዳ' : 'Clear Search'}
                  </button>
                )}
              </div>
            ) : (
              paginatedRegistrations.map((reg) => {
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
                        {renderStatusIconBadge(reg.status)}
                        <span className="material-symbols-outlined text-[18px] text-outline">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Details Body */}
                    {isExpanded && (
                      <div className="p-3 border-t border-outline-variant/60 space-y-2.5 text-xs bg-surface-container/50">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <DataField label={isAmharic ? 'የመዝገብ መለያ (ID):' : 'Registration ID:'} value={reg.id} isMono />
                          <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={reg.subCity || '—'} />
                          <DataField 
                            label={isAmharic ? 'ዓይነት (Category):' : 'Category:'} 
                            value={reg.vehicleCategory === 'electric' ? (isAmharic ? 'ኤሌክትሪክ (EV)' : 'Electric (EV)') : (isAmharic ? 'ቤንዚን (Gasoline)' : 'Gasoline (<110cc)')} 
                            isPrimary 
                          />
                          <DataField label={isAmharic ? 'ሴሪያል / ቻሲስ ቁጥር:' : 'Chassis / Serial No:'} value={reg.engineOrSerialNo || '—'} isMono />
                          {reg.motorBrand && (
                            <DataField label={isAmharic ? 'ብራንድ / ሞዴል:' : 'Brand & Model:'} value={`${reg.motorBrand} ${reg.motorModel || ''}`} />
                          )}
                          <DataField label={isAmharic ? 'የተመዘገበበት ባጅ:' : 'Registered By:'} value={reg.registeredBy || '—'} isMono />
                        </div>

                        {/* Document Photo Thumbnails Row */}
                        {(reg.userPortraitPhoto || reg.nationalIdPhoto || reg.nationalIdBackPhoto || reg.drivingLicensePhoto || reg.drivingPermitPhoto) && (
                          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/40 overflow-x-auto pb-1">
                            {reg.userPortraitPhoto && (
                              <div
                                onClick={() => setZoomedImage({ url: reg.userPortraitPhoto!, title: `${reg.fullName} — ${isAmharic ? 'የባለቤት ፎቶ' : 'Owner Portrait'}` })}
                                className="w-12 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                                title={isAmharic ? 'የባለቤት ፎቶ (አጉላ)' : 'Portrait Photo (Click to Zoom)'}
                              >
                                <SmartImage src={reg.userPortraitPhoto} alt="Portrait" fallbackIcon="person" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                            {reg.nationalIdPhoto && (
                              <div
                                onClick={() => setZoomedImage({ url: reg.nationalIdPhoto!, title: `${reg.fullName} — ${isAmharic ? 'ብሔራዊ መታወቂያ (ፊት)' : 'National ID (Front)'}` })}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                                title={isAmharic ? 'ብሔራዊ መታወቂያ (አጉላ)' : 'National ID (Click to Zoom)'}
                              >
                                <SmartImage src={reg.nationalIdPhoto} alt="National ID" fallbackIcon="badge" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                            {reg.nationalIdBackPhoto && (
                              <div
                                onClick={() => setZoomedImage({ url: reg.nationalIdBackPhoto!, title: `${reg.fullName} — ${isAmharic ? 'ብሔራዊ መታወቂያ (ጀርባ)' : 'National ID (Back)'}` })}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                                title={isAmharic ? 'ብሔራዊ መታወቂያ ጀርባ (አጉላ)' : 'National ID Back (Click to Zoom)'}
                              >
                                <SmartImage src={reg.nationalIdBackPhoto} alt="National ID Back" fallbackIcon="badge" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                            {reg.drivingLicensePhoto && (
                              <div
                                onClick={() => setZoomedImage({ url: reg.drivingLicensePhoto!, title: `${reg.fullName} — ${isAmharic ? 'የመንጃ ፍቃድ' : 'Driving License'}` })}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                                title={isAmharic ? 'የመንጃ ፍቃድ (አጉላ)' : 'Driving License (Click to Zoom)'}
                              >
                                <SmartImage src={reg.drivingLicensePhoto} alt="Driving License" fallbackIcon="card_membership" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                            {reg.drivingPermitPhoto && (
                              <div
                                onClick={() => setZoomedImage({ url: reg.drivingPermitPhoto!, title: `${reg.fullName} — ${isAmharic ? 'የመንቀሳቀሻ ፍቃድ' : 'Movement Permit'}` })}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-outline-variant bg-slate-900 shrink-0 cursor-pointer group relative"
                                title={isAmharic ? 'የመንቀሳቀሻ ፍቃድ (አጉላ)' : 'Movement Permit (Click to Zoom)'}
                              >
                                <SmartImage src={reg.drivingPermitPhoto} alt="Permit" fallbackIcon="menu_book" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions Footer inside Collapsed Card */}
                        <div className="pt-2 border-t border-outline-variant/50 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedRegForDetails(reg)}
                              className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                              <span>{isAmharic ? 'ዝርዝር' : 'Details'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedRegForQR(reg)}
                              className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                              <span>{isAmharic ? 'መታወቂያ' : 'ID Card'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedRegForA4(reg)}
                              className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                              title={isAmharic ? 'የመንቀሳቀሻ ፍቃድ ወረቀት አትም' : 'Print Movement Permit'}
                            >
                              <span className="material-symbols-outlined text-[16px]">print</span>
                              <span>{isAmharic ? 'ፍቃድ አትም' : 'Print Permit'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedRegForSticker(reg)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                              title={isAmharic ? 'የሞተር QR ተለጣፊ አትም' : 'Print Vehicle QR Sticker'}
                            >
                              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                              <span>{isAmharic ? 'ተለጣፊ' : 'Sticker'}</span>
                            </button>
                          </div>

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
              <thead className="bg-transparent text-secondary font-bold uppercase text-[10px] tracking-wider border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3">{isAmharic ? 'ባለቤት / ስም' : 'Owner & Sub-City'}</th>
                  <th className="px-4 py-3">{isAmharic ? 'ሰሌዳ / መለያ' : 'Plate & ID'}</th>
                  <th className="px-4 py-3">{isAmharic ? 'ዓይነት' : 'Category'}</th>
                  <th className="px-4 py-3">{isAmharic ? 'ሴሪያል / ሞዴል' : 'Serial & Model'}</th>
                  <th className="px-4 py-3">{isAmharic ? 'የተመዘገበበት ቀን' : 'Reg Date'}</th>
                  <th className="px-4 py-3">{isAmharic ? 'ሁኔታ' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{isAmharic ? 'እርምጃዎች' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-secondary font-bold">
                      {isAmharic ? 'ምንም መዝገብ አልተገኘም (ባዶ / Empty)' : 'Empty — No vehicle records stored.'}
                    </td>
                  </tr>
                ) : filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-secondary">
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <span className="font-semibold">{isAmharic ? 'ምንም የሚመሳሰል መዝገብ አልተገኘም' : 'No matching vehicle records found.'}</span>
                        {regSearch && (
                          <button
                            type="button"
                            onClick={() => setRegSearch('')}
                            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs rounded-xl border border-outline-variant transition-colors cursor-pointer"
                          >
                            {isAmharic ? 'ፍለጋውን አጽዳ' : 'Clear Search'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-surface-container-low transition-colors text-[13px]">
                      <td className="px-4 py-3">
                        <div className="font-bold text-on-surface flex items-center gap-1.5">
                          <span>{reg.fullName || '—'}</span>
                          {reg.subCity && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 font-normal">
                              {reg.subCity}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-secondary font-mono">
                          {reg.phone || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-primary">{reg.plateNumber || '—'}</div>
                        <div className="text-[10px] font-mono text-secondary">{reg.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md border border-outline-variant text-[10px] font-medium text-secondary">
                          {reg.vehicleCategory === 'electric' 
                            ? (isAmharic ? 'ኤሌክትሪክ (EV)' : 'Electric (EV)') 
                            : (isAmharic ? 'ቤንዚን (Gasoline)' : 'Gasoline (<110cc)')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[12px] text-secondary font-medium">{reg.engineOrSerialNo || '—'}</div>
                        {(reg.motorBrand || reg.motorModel) && (
                          <div className="text-[10px] text-secondary uppercase font-semibold">
                            {reg.motorBrand || ''} {reg.motorModel || ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] text-secondary font-mono">{reg.registrationDate || '—'}</div>
                        {reg.registeredBy && (
                          <div className="text-[10px] text-secondary/80 font-mono">By: {reg.registeredBy}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {renderStatusIconBadge(reg.status)}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Admin approval buttons if pending */}
                          {userRole === 'admin' && reg.status === 'pending_approval' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApproveRegistration(reg.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-xs"
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

                          {/* For Clerk on pending records, hide action buttons and show pending status */}
                          {userRole === 'clerk' && reg.status === 'pending_approval' ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                              {isAmharic ? 'በማፅደቅ ላይ' : 'Awaiting Approval'}
                            </span>
                          ) : (
                            <>
                              {/* Inspect Full Details button */}
                              <button
                                type="button"
                                onClick={() => setSelectedRegForDetails(reg)}
                                className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors cursor-pointer"
                                title={isAmharic ? 'ሙሉ መረጃ ተመልከት' : 'View Full Details & Documents'}
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                              </button>

                              {/* Inspect QR Card button */}
                              <button
                                type="button"
                                onClick={() => setSelectedRegForQR(reg)}
                                className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg transition-colors cursor-pointer"
                                title={isAmharic ? 'መታወቂያ እና QR ተመልከት' : 'Inspect Badge & QR Code'}
                              >
                                <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                              </button>

                              {/* Full A4 Size Permit Paper button — only when approved */}
                              {(reg.status === 'approved' || reg.status === 'printed' || reg.status === 'ordered_print') && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRegForA4(reg)}
                                  className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-lg transition-colors cursor-pointer border border-sky-200 flex items-center gap-1 font-bold text-[10px]"
                                  title={isAmharic ? 'የመንቀሳቀሻ ፍቃድ ወረቀት አትም' : 'Print Movement Permit'}
                                >
                                  <span className="material-symbols-outlined text-[16px]">print</span>
                                  <span className="hidden xl:inline">{isAmharic ? 'ፍቃድ አትም' : 'Print Permit'}</span>
                                </button>
                              )}

                              {/* Print Vehicle Sticker button — only when approved */}
                              {(reg.status === 'approved' || reg.status === 'printed' || reg.status === 'ordered_print') && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRegForSticker(reg)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors cursor-pointer border border-emerald-200 flex items-center gap-1 font-bold text-[10px]"
                                  title={isAmharic ? 'የሞተር QR ተለጣፊ አትም' : 'Print Vehicle QR Sticker'}
                                >
                                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                                  <span className="hidden xl:inline">{isAmharic ? 'ተለጣፊ አትም' : 'Print Sticker'}</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Registration Pagination Bar */}
          <div className="bg-surface-container/30 border border-outline-variant rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary font-medium mt-2">
            <div className="flex items-center gap-2">
              <span>{isAmharic ? 'በአንድ ገጽ:' : 'Per page:'}</span>
              <SelectField
                value={String(regPageSize)}
                onChange={(e) => {
                  setRegPageSize(Number(e.target.value));
                  setRegPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </SelectField>
              <span>
                {isAmharic
                  ? `${regStartIndex + 1}-${Math.min(regStartIndex + regPageSize, totalRegs)} ከ ${totalRegs} መዝገቦች`
                  : `Showing ${regStartIndex + 1}-${Math.min(regStartIndex + regPageSize, totalRegs)} of ${totalRegs} entries`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activeRegPage <= 1}
                onClick={() => setRegPage(activeRegPage - 1)}
                className="px-2.5 py-1 bg-surface hover:bg-surface-container border border-outline-variant rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>{isAmharic ? 'ቀዳሚ' : 'Prev'}</span>
              </button>

              <span className="px-2 font-bold font-mono text-on-surface">
                {activeRegPage} / {totalRegPages}
              </span>

              <button
                type="button"
                disabled={activeRegPage >= totalRegPages}
                onClick={() => setRegPage(activeRegPage + 1)}
                className="px-2.5 py-1 bg-surface hover:bg-surface-container border border-outline-variant rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isAmharic ? 'ቀጣይ' : 'Next'}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
          )
        )}

      {/* --- TABLE 2: OFFICERS DIRECTORY TABLE --- */}
      {activeTableTab === 'officers' && (
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row justify-between gap-2.5 border-b border-outline-variant pb-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center justify-center pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </div>
              <input
                type="text"
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                placeholder={isAmharic ? 'በተቆጣጣሪ ስም፣ ባጅ ቁጥር ወይም ቦታ ፈልግ...' : 'Search officer name, badge ID, location...'}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-10 pr-2.5 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <SelectField
              value={subCityFilter}
              onChange={(e) => setSubCityFilter(e.target.value)}
            >
              <option value="all">{isAmharic ? 'ሁሉም ክፍለ ከተሞች' : 'All Sub-Cities'}</option>
              <option value="Bole Sub-City">Bole Sub-City</option>
              <option value="Kirkos Sub-City">Kirkos Sub-City</option>
              <option value="Yeka Sub-City">Yeka Sub-City</option>
              <option value="Arada Sub-City">Arada Sub-City</option>
            </SelectField>
          </div>

          {/* Mobile Collapsed Cards View (< md) */}
          <div className="block md:hidden space-y-3">
            {officers.length === 0 ? (
              <div className="p-6 text-center text-secondary text-xs bg-surface-container/30 rounded-xl font-bold">
                {isAmharic ? 'ምንም ተቆጣጣሪ አልተገኘም (ባዶ / Empty)' : 'Empty — No officer assignments stored.'}
              </div>
            ) : filteredOfficers.length === 0 ? (
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
                      <div className="p-3 border-t border-outline-variant/60 space-y-2 text-xs bg-surface-container/50">
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
                {officers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-secondary font-bold">
                      {isAmharic ? 'ምንም ተቆጣጣሪ አልተገኘም (ባዶ / Empty)' : 'Empty — No officer assignments stored.'}
                    </td>
                  </tr>
                ) : filteredOfficers.length === 0 ? (
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
              <div className="absolute inset-y-0 left-3 flex items-center justify-center pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </div>
              <input
                type="text"
                value={printSearch}
                onChange={(e) => setPrintSearch(e.target.value)}
                placeholder={isAmharic ? 'በባች ቁጥር ወይም ማስታወሻ ፈልግ...' : 'Search batch ID or order notes...'}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-10 pr-2.5 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {printOrders.length === 0 ? (
              <div className="p-6 text-center text-secondary text-xs bg-surface-container/30 rounded-xl font-bold">
                {isAmharic ? 'ምንም የሕትመት ትእዛዝ አልተገኘም (ባዶ / Empty)' : 'Empty — No print orders stored.'}
              </div>
            ) : filteredPrintOrders.length === 0 ? (
              <div className="p-6 text-center text-secondary text-xs bg-surface-container/30 rounded-xl">
                {isAmharic ? 'ምንም የሚመሳሰል የሕትመት ትእዛዝ አልተገኘም' : 'No matching print orders found.'}
              </div>
            ) : (
              paginatedPrintOrders.map((order) => {
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
                      <div className="p-3 border-t border-outline-variant/60 space-y-2.5 text-xs bg-surface-container/50">
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
                {printOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-secondary font-bold">
                      {isAmharic ? 'ምንም የሕትመት ትእዛዝ አልተገኘም (ባዶ / Empty)' : 'Empty — No print orders stored.'}
                    </td>
                  </tr>
                ) : filteredPrintOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-secondary">
                      {isAmharic ? 'ምንም የሚመሳሰል የሕትመት ትእዛዝ አልተገኘም' : 'No matching print orders found.'}
                    </td>
                  </tr>
                ) : (
                  paginatedPrintOrders.map((order) => (
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

          {/* Print Orders Pagination Bar */}
          <div className="bg-surface-container/30 border border-outline-variant rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary font-medium mt-2">
            <div className="flex items-center gap-2">
              <span>{isAmharic ? 'በአንድ ገጽ:' : 'Per page:'}</span>
              <SelectField
                value={String(printPageSize)}
                onChange={(e) => {
                  setPrintPageSize(Number(e.target.value));
                  setPrintPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </SelectField>
              <span>
                {isAmharic
                  ? `${printStartIndex + 1}-${Math.min(printStartIndex + printPageSize, totalPrintOrders)} ከ ${totalPrintOrders} ትእዛዞች`
                  : `Showing ${printStartIndex + 1}-${Math.min(printStartIndex + printPageSize, totalPrintOrders)} of ${totalPrintOrders} entries`}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activePrintPage <= 1}
                onClick={() => setPrintPage(activePrintPage - 1)}
                className="px-2.5 py-1 bg-surface hover:bg-surface-container border border-outline-variant rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>{isAmharic ? 'ቀዳሚ' : 'Prev'}</span>
              </button>

              <span className="px-2 font-bold font-mono text-on-surface">
                {activePrintPage} / {totalPrintPages}
              </span>

              <button
                type="button"
                disabled={activePrintPage >= totalPrintPages}
                onClick={() => setPrintPage(activePrintPage + 1)}
                className="px-2.5 py-1 bg-surface hover:bg-surface-container border border-outline-variant rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>{isAmharic ? 'ቀጣይ' : 'Next'}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* QR Inspector Modal */}
      {selectedRegForQR && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto transition-all duration-200">
          <ZoomableDocumentContainer
            lang={lang}
            userRole={userRole}
            title={isAmharic ? 'የባለቤትነት QR መታወቂያ' : 'Official Digital Permit & QR Badge'}
            onClose={() => setSelectedRegForQR(null)}
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
            <QRCodeCard registration={selectedRegForQR} lang={lang} />
          </ZoomableDocumentContainer>
        </div>
      )}

      {/* Full A4 Permit Paper Modal */}
      {selectedRegForA4 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto transition-all duration-200">
          <ZoomableDocumentContainer
            lang={lang}
            userRole={userRole}
            title={isAmharic ? 'የመንቀሳቀሻ ፍቃድ ሰነድ (Permit)' : 'Official Movement Permit Document'}
            onClose={() => setSelectedRegForA4(null)}
            onPrint={() => {
              document.body.setAttribute('data-print-target', 'a4');
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
            <A4PermitPaper
              registration={selectedRegForA4}
              lang={lang}
              onClose={() => setSelectedRegForA4(null)}
            />
          </ZoomableDocumentContainer>
        </div>
      )}

      {/* Vehicle QR Sticker Modal */}
      {selectedRegForSticker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto transition-all duration-200">
          <ZoomableDocumentContainer
            lang={lang}
            userRole={userRole}
            title={isAmharic ? 'የሞተር QR ተለጣፊ (Vehicle Sticker)' : 'Vehicle QR Sticker'}
            onClose={() => setSelectedRegForSticker(null)}
            onPrint={() => {
              document.body.setAttribute('data-print-target', 'sticker');
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
            <VehicleQRSticker
              registration={selectedRegForSticker}
              lang={lang}
              onClose={() => setSelectedRegForSticker(null)}
            />
          </ZoomableDocumentContainer>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
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

      {/* Full Vehicle Registration Record Details Inspector Modal */}
      {selectedRegForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto transition-all duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">
                    {isAmharic ? 'የተሟላ የሞተር ሳይክል ምዝገባ መረጃ' : 'Motorcycle Registration Record Details'}
                  </h3>
                  <p className="text-[11px] font-mono text-secondary">
                    ID: <span className="font-bold text-primary">{selectedRegForDetails.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRegForDetails(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Status & Quick Info Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-container/50 rounded-xl border border-outline-variant/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-secondary">{isAmharic ? 'የምዝገባ ሁኔታ:' : 'Status:'}</span>
                {renderStatusIconBadge(selectedRegForDetails.status)}
              </div>
              {selectedRegForDetails.registeredBy && (
                <div className="text-[11px] font-mono text-secondary">
                  {isAmharic ? 'የመዘገበው ባጅ:' : 'Registered By:'} <span className="font-bold text-on-surface">{selectedRegForDetails.registeredBy}</span>
                </div>
              )}
            </div>

            {/* Rejection notice if rejected */}
            {selectedRegForDetails.status === 'rejected' && selectedRegForDetails.rejectionReason && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-900 dark:text-red-300">
                <span className="font-bold block mb-0.5">{isAmharic ? 'የመሰረዣ ምክንያት:' : 'Rejection Reason:'}</span>
                <p>{selectedRegForDetails.rejectionReason}</p>
              </div>
            )}

            {/* Core Data Grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Owner Details */}
              <div className="p-3 bg-surface rounded-xl border border-outline-variant space-y-2">
                <h4 className="font-bold text-[11px] text-secondary uppercase tracking-wider border-b border-outline-variant/60 pb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  <span>{isAmharic ? 'የባለቤት መረጃ' : 'Owner Information'}</span>
                </h4>
                <div className="space-y-1.5">
                  <DataField label={isAmharic ? 'ሙሉ ስም:' : 'Full Name:'} value={selectedRegForDetails.fullName || '—'} />
                  <DataField label={isAmharic ? 'ስልክ ቁጥር:' : 'Phone Number:'} value={selectedRegForDetails.phone || '—'} isMono />
                  <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={selectedRegForDetails.subCity || '—'} />
                  <DataField label={isAmharic ? 'የተመዘገበበት ቀን:' : 'Registration Date:'} value={selectedRegForDetails.registrationDate || '—'} isMono />
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="p-3 bg-surface rounded-xl border border-outline-variant space-y-2">
                <h4 className="font-bold text-[11px] text-secondary uppercase tracking-wider border-b border-outline-variant/60 pb-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">electric_moped</span>
                  <span>{isAmharic ? 'የተሽከርካሪ መረጃ' : 'Vehicle Specifications'}</span>
                </h4>
                <div className="space-y-1.5">
                  <DataField 
                    label={isAmharic ? 'ዓይነት (Category):' : 'Category:'} 
                    value={selectedRegForDetails.vehicleCategory === 'electric' ? (isAmharic ? 'ኤሌክትሪክ (EV)' : 'Electric (EV)') : (isAmharic ? 'ቤንዚን (Gasoline)' : 'Gasoline (<110cc)')} 
                    isPrimary 
                  />
                  <DataField label={isAmharic ? 'የሰሌዳ ቁጥር:' : 'Plate Number:'} value={selectedRegForDetails.plateNumber || '—'} isMono />
                  <DataField label={isAmharic ? 'ሴሪያል / ቻሲስ ቁጥር:' : 'Engine / Chassis No:'} value={selectedRegForDetails.engineOrSerialNo || '—'} isMono />
                  <DataField label={isAmharic ? 'ብራንድ እና ሞዴል:' : 'Brand & Model:'} value={`${selectedRegForDetails.motorBrand || '—'} ${selectedRegForDetails.motorModel || ''}`} />
                </div>
              </div>
            </div>

            {/* Uploaded Documents & Photos Section */}
            <div className="space-y-2 pt-2 border-t border-outline-variant">
              <h4 className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">photo_library</span>
                <span>{isAmharic ? 'የተያያዙ ፎቶዎች እና ሰነዶች (Click to Zoom)' : 'Uploaded Document Photos (Click to Zoom)'}</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* User Portrait */}
                <div className="space-y-1">
                  <span className="text-[10px] text-secondary font-semibold block truncate">
                    {isAmharic ? 'የባለቤት ፎቶ' : 'Owner Portrait'}
                  </span>
                  <div
                    onClick={() => selectedRegForDetails.userPortraitPhoto && setZoomedImage({ url: selectedRegForDetails.userPortraitPhoto, title: `${selectedRegForDetails.fullName} — ${isAmharic ? 'የባለቤት ፎቶ' : 'Owner Portrait'}` })}
                    className="h-28 rounded-xl overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center cursor-pointer group relative shadow-2xs"
                  >
                    {selectedRegForDetails.userPortraitPhoto ? (
                      <>
                        <SmartImage src={selectedRegForDetails.userPortraitPhoto} alt="Portrait" fallbackIcon="person" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-secondary italic">{isAmharic ? 'አልተያያዘም' : 'None'}</span>
                    )}
                  </div>
                </div>

                {/* National ID Front */}
                <div className="space-y-1">
                  <span className="text-[10px] text-secondary font-semibold block truncate">
                    {isAmharic ? 'ብሔራዊ መታወቂያ' : 'National ID'}
                  </span>
                  <div
                    onClick={() => selectedRegForDetails.nationalIdPhoto && setZoomedImage({ url: selectedRegForDetails.nationalIdPhoto, title: `${selectedRegForDetails.fullName} — ${isAmharic ? 'ብሔራዊ መታወቂያ' : 'National ID'}` })}
                    className="h-28 rounded-xl overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center cursor-pointer group relative shadow-2xs"
                  >
                    {selectedRegForDetails.nationalIdPhoto ? (
                      <>
                        <SmartImage src={selectedRegForDetails.nationalIdPhoto} alt="National ID" fallbackIcon="badge" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-secondary italic">{isAmharic ? 'አልተያያዘም' : 'None'}</span>
                    )}
                  </div>
                </div>

                {/* Driving License */}
                <div className="space-y-1">
                  <span className="text-[10px] text-secondary font-semibold block truncate">
                    {isAmharic ? 'የመንጃ ፍቃድ' : 'Driving License'}
                  </span>
                  <div
                    onClick={() => selectedRegForDetails.drivingLicensePhoto && setZoomedImage({ url: selectedRegForDetails.drivingLicensePhoto, title: `${selectedRegForDetails.fullName} — ${isAmharic ? 'የመንጃ ፍቃድ' : 'Driving License'}` })}
                    className="h-28 rounded-xl overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center cursor-pointer group relative shadow-2xs"
                  >
                    {selectedRegForDetails.drivingLicensePhoto ? (
                      <>
                        <SmartImage src={selectedRegForDetails.drivingLicensePhoto} alt="Driving License" fallbackIcon="card_membership" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-secondary italic">{isAmharic ? 'አልተያያዘም' : 'None'}</span>
                    )}
                  </div>
                </div>

                {/* Movement Permit / Libre */}
                <div className="space-y-1">
                  <span className="text-[10px] text-secondary font-semibold block truncate">
                    {isAmharic ? 'የመንቀሳቀሻ ፍቃድ' : 'Permit / Libre'}
                  </span>
                  <div
                    onClick={() => selectedRegForDetails.drivingPermitPhoto && setZoomedImage({ url: selectedRegForDetails.drivingPermitPhoto, title: `${selectedRegForDetails.fullName} — ${isAmharic ? 'የመንቀሳቀሻ ፍቃድ' : 'Permit / Libre'}` })}
                    className="h-28 rounded-xl overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center cursor-pointer group relative shadow-2xs"
                  >
                    {selectedRegForDetails.drivingPermitPhoto ? (
                      <>
                        <SmartImage src={selectedRegForDetails.drivingPermitPhoto} alt="Permit" fallbackIcon="menu_book" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-[10px] text-secondary italic">{isAmharic ? 'አልተያያዘም' : 'None'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-outline-variant">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const reg = selectedRegForDetails;
                    setSelectedRegForDetails(null);
                    setSelectedRegForQR(reg);
                  }}
                  className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                  <span>{isAmharic ? 'መታወቂያ ካርድ' : 'View ID Card'}</span>
                </button>

                {(selectedRegForDetails.status === 'approved' || selectedRegForDetails.status === 'printed' || selectedRegForDetails.status === 'ordered_print') && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const reg = selectedRegForDetails;
                        setSelectedRegForDetails(null);
                        setSelectedRegForA4(reg);
                      }}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">print</span>
                      <span>{isAmharic ? 'የመንቀሳቀሻ ፍቃድ' : 'Print Permit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const reg = selectedRegForDetails;
                        setSelectedRegForDetails(null);
                        setSelectedRegForSticker(reg);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                      <span>{isAmharic ? 'ተለጣፊ' : 'Print Sticker'}</span>
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedRegForDetails(null)}
                className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high text-secondary text-xs rounded-xl font-bold cursor-pointer"
              >
                {isAmharic ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
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
