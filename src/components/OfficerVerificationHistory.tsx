import React, { useState, useRef } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import jsQR from 'jsqr';
import { Language, MotorcycleRegistration, UserRole, VerificationLog } from '../types';
import { QRCodeCard } from './QRCodeCard';
import { SharedScannerModal } from './SharedScannerModal';

interface OfficerVerificationHistoryProps {
  lang: Language;
  userRole: UserRole;
  userBadgeId?: string;
  registrations: MotorcycleRegistration[];
  verificationLogs: VerificationLog[];
  onAddVerificationLog?: (log: VerificationLog) => void;
}

export const OfficerVerificationHistory: React.FC<OfficerVerificationHistoryProps> = ({
  lang,
  userRole,
  userBadgeId,
  registrations,
  verificationLogs,
  onAddVerificationLog,
}) => {
  const isAmharic = lang === 'am';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'warning' | 'flagged'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<VerificationLog | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Scanner modal state
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanPlateInput, setScanPlateInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedRegResult, setScannedRegResult] = useState<MotorcycleRegistration | null>(null);
  const [scanOfficerNotes, setScanOfficerNotes] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showFullCardInModal, setShowFullCardInModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter logs
  const filteredLogs = verificationLogs.filter((log) => {
    const matchesSearch =
      (log.plateNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.phone || '').includes(searchTerm) ||
      (log.engineOrSerialNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.officerNotes && log.officerNotes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ? true : log.verificationStatus === statusFilter;
    const matchesCategory = categoryFilter === 'all' ? true : log.vehicleCategory === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate pagination slices
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleStartCameraScan = () => {
    setIsScanning(true);
    setScannedRegResult(null);
    setCameraError(null);
  };

  const processQRData = (qrData: string) => {
    const cleanData = qrData.trim();
    if (!cleanData) return;

    const cleanLower = cleanData.toLowerCase();

    // Smart matching across qrCodeData, plateNumber, id, engineOrSerialNo, fullName, phone
    const match = registrations.find((r) => {
      const q = (r.qrCodeData || '').toLowerCase();
      const p = (r.plateNumber || '').toLowerCase();
      const id = (r.id || '').toLowerCase();
      const e = (r.engineOrSerialNo || '').toLowerCase();
      const name = (r.fullName || '').toLowerCase();
      const phoneDigits = (r.phone || '').replace(/\D/g, '');
      const inputDigits = cleanLower.replace(/\D/g, '');

      return (
        (q && (cleanLower.includes(q) || q.includes(cleanLower))) ||
        (p && (cleanLower.includes(p) || p.includes(cleanLower))) ||
        (id && (cleanLower.includes(id) || id.includes(cleanLower))) ||
        (e && (cleanLower.includes(e) || e.includes(cleanLower))) ||
        (name && cleanLower.includes(name)) ||
        (phoneDigits && phoneDigits.length > 5 && inputDigits.includes(phoneDigits))
      );
    });

    if (match) {
      setIsScanning(false);
      setScannedRegResult(match);
      setShowFullCardInModal(false);
    } else {
      alert(
        isAmharic
          ? `የተቃኘው QR ኮድ በሲስተሙ አልተገኘም! (${cleanData})`
          : `Scanned QR code not found in system! (${cleanData})`
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
          if (code) {
            processQRData(code.data);
          } else {
            alert(isAmharic ? 'ምንም QR ኮድ በምስሉ ላይ አልተገኘም!' : 'No QR code found in the image!');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleScanResult = (detectedCodes: any[]) => {
    if (detectedCodes.length > 0) {
      const qrData = detectedCodes[0].rawValue;
      setIsScanning(false);
      processQRData(qrData);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanPlateInput.trim()) return;
    const match = registrations.find(
      (r) =>
        (r.plateNumber || '').toLowerCase().includes(scanPlateInput.trim().toLowerCase()) ||
        (r.fullName || '').toLowerCase().includes(scanPlateInput.trim().toLowerCase()) ||
        (r.engineOrSerialNo || '').toLowerCase().includes(scanPlateInput.trim().toLowerCase())
    );
    if (match) {
      setScannedRegResult(match);
    } else {
      alert(isAmharic ? 'የተፈለገው ሰሌዳ በሲስተሙ አልተገኘም!' : 'No matching vehicle record found!');
    }
  };

  const handleSaveScanLog = () => {
    if (!scannedRegResult) return;

    const isPass = scannedRegResult.status === 'approved' || scannedRegResult.status === 'printed';

    const newLog: VerificationLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      scannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      plateNumber: scannedRegResult.plateNumber,
      fullName: scannedRegResult.fullName,
      phone: scannedRegResult.phone,
      vehicleCategory: scannedRegResult.vehicleCategory,
      engineOrSerialNo: scannedRegResult.engineOrSerialNo,
      permitStatus: scannedRegResult.status,
      verificationStatus: isPass ? 'verified' : 'warning',
      officerNotes: scanOfficerNotes || (isPass ? 'Physical sticker & QR hash verified.' : 'Missing approved permit.'),
      officerBadgeId: userBadgeId || 'OFF-8842',
      locationName: 'Bole Road Roundabout Checkpoint',
      userPortraitPhoto: scannedRegResult.userPortraitPhoto || scannedRegResult.nationalIdPhoto,
      nationalIdPhoto: scannedRegResult.nationalIdPhoto,
      drivingLicensePhoto: scannedRegResult.drivingLicensePhoto,
      drivingPermitPhoto: scannedRegResult.drivingPermitPhoto,
    };

    if (onAddVerificationLog) {
      onAddVerificationLog(newLog);
    }

    setShowScannerModal(false);
    setScannedRegResult(null);
    setScanOfficerNotes('');
    setScanPlateInput('');
  };

  // Construct dummy reg object for full card modal if needed
  const selectedRegForCard: MotorcycleRegistration | null = selectedLogForDetails
    ? {
        id: selectedLogForDetails.id,
        fullName: selectedLogForDetails.fullName,
        phone: selectedLogForDetails.phone,
        vehicleCategory: selectedLogForDetails.vehicleCategory,
        engineOrSerialNo: selectedLogForDetails.engineOrSerialNo,
        plateNumber: selectedLogForDetails.plateNumber,
        registrationDate: selectedLogForDetails.scannedAt,
        status: selectedLogForDetails.permitStatus,
        qrCodeData: `PERMIT-${selectedLogForDetails.plateNumber}-${selectedLogForDetails.fullName}`,
        registeredBy: 'SYSTEM-OFFICER',
        nationalIdPhoto: selectedLogForDetails.nationalIdPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        drivingLicensePhoto: selectedLogForDetails.drivingLicensePhoto || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
        drivingPermitPhoto: selectedLogForDetails.drivingPermitPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
        userPortraitPhoto: selectedLogForDetails.userPortraitPhoto,
      }
    : null;

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAmharic ? 'በሰሌዳ፣ ስም ወይም ማስታወሻ ፈልግ...' : 'Search plate, owner name, notes...'}
            className="w-full bg-surface border border-outline-variant rounded-xl pl-9 pr-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status & Category Filter Badges */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-surface border border-outline-variant rounded-xl px-2.5 py-1.5 text-xs text-on-surface font-bold focus:outline-none"
          >
            <option value="all">{isAmharic ? 'ሁሉም አይነቶች (All EV/Gas)' : 'All Vehicle Types'}</option>
            <option value="electric">{isAmharic ? 'ኢቪ (Electric EV)' : 'Electric (EV)'}</option>
            <option value="gasoline">{isAmharic ? 'ቤንዚን (Gasoline)' : 'Gasoline'}</option>
          </select>

          <span className="text-xs font-bold text-secondary whitespace-nowrap hidden sm:inline">
            {isAmharic ? 'ሁኔታ፡' : 'Filter:'}
          </span>
          {(['all', 'verified', 'warning', 'flagged'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container text-secondary hover:text-on-surface'
              }`}
            >
              {st === 'all'
                ? isAmharic
                  ? 'ሁሉም'
                  : 'All Logs'
                : st === 'verified'
                ? isAmharic
                  ? 'የተረጋገጡ (Verified)'
                  : 'Verified'
                : st === 'warning'
                ? isAmharic
                  ? 'ማስጠንቀቂያ (Warning)'
                  : 'Warning'
                : isAmharic
                ? 'የተከለከሉ (Flagged)'
                : 'Flagged'}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Logs Table / Grid */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <span className="material-symbols-outlined text-outline text-[44px]">manage_search</span>
            <p className="font-bold text-xs text-on-surface">
              {isAmharic ? 'ምንም የማረጋገጫ ታሪክ አልተገኘም' : 'No verification history records found.'}
            </p>
            <p className="text-[11px] text-secondary">
              {isAmharic ? 'በሞባይል ካሜራ አዲስ QR በመቃኘት ማረጋገጫ ያስመዝግቡ።' : 'Scan a vehicle permit QR code to generate a new verification log.'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-outline-variant">
              {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-surface-container/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Driver Portrait & Vehicle/Owner summary */}
                <div className="flex items-start gap-3">
                  {/* Driver Portrait Photo Badge */}
                  <div className="relative w-12 h-14 rounded-xl overflow-hidden border border-outline-variant shrink-0 bg-surface-container shadow-2xs">
                    {log.userPortraitPhoto || log.nationalIdPhoto ? (
                      <img
                        src={log.userPortraitPhoto || log.nationalIdPhoto}
                        alt={log.fullName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-secondary bg-surface-container-high">
                        <span className="material-symbols-outlined text-[24px]">person</span>
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-white text-white font-bold shadow-xs ${
                      log.verificationStatus === 'verified'
                        ? 'bg-emerald-600'
                        : log.verificationStatus === 'warning'
                        ? 'bg-amber-600'
                        : 'bg-red-600'
                    }`}>
                      <span className="material-symbols-outlined text-[12px]">
                        {log.verificationStatus === 'verified'
                          ? 'check'
                          : log.verificationStatus === 'warning'
                          ? 'priority_high'
                          : 'close'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-extrabold text-sm text-primary bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        {log.plateNumber}
                      </span>
                      <span className="font-bold text-xs text-on-surface">{log.fullName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.vehicleCategory === 'electric' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      }`}>
                        {log.vehicleCategory === 'electric' ? 'EV' : 'Gasoline'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        log.permitStatus === 'printed' || log.permitStatus === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      }`}>
                        {log.permitStatus}
                      </span>
                    </div>

                    <p className="text-xs text-secondary">
                      <span className="font-medium">{isAmharic ? 'ማስታወሻ፡' : 'Officer Notes:'}</span> {log.officerNotes}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-outline font-mono">
                      <span>{isAmharic ? 'ስልክ፡' : 'Phone:'} {log.phone}</span>
                      <span>•</span>
                      <span>{isAmharic ? 'ሴሪያል፡' : 'Serial:'} {log.engineOrSerialNo}</span>
                      <span>•</span>
                      <span>{log.scannedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Badge & Details Action */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-outline-variant">
                  <div className="text-left md:text-right text-[11px] text-secondary">
                    <p className="font-bold text-on-surface">{log.locationName || 'Field Checkpoint'}</p>
                    <p className="font-mono text-primary text-[10px]">Officer: {log.officerBadgeId || 'OFF-8842'}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedLogForDetails(log)}
                    className="bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs px-3 py-2 rounded-xl border border-outline-variant flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>{isAmharic ? 'ዝርዝር መረጃ' : 'View Scanned Vehicle'}</span>
                  </button>
                </div>
              </div>
            ))}
            </div>

            {/* Pagination Controls Bar */}
            <div className="bg-surface-container/30 border-t border-outline-variant px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary font-medium">
              <div className="flex items-center gap-2">
                <span>{isAmharic ? 'በአንድ ገጽ:' : 'Per page:'}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-surface border border-outline-variant rounded-lg px-2 py-1 font-bold text-on-surface focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  {isAmharic
                    ? `${startIndex + 1}-${Math.min(startIndex + pageSize, totalItems)} ከ ${totalItems} መዝገቦች`
                    : `Showing ${startIndex + 1}-${Math.min(startIndex + pageSize, totalItems)} of ${totalItems} entries`}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={activePage <= 1}
                  onClick={() => handlePageChange(activePage - 1)}
                  className="px-2.5 py-1 bg-surface hover:bg-surface-container border border-outline-variant rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  <span>{isAmharic ? 'ቀዳሚ' : 'Prev'}</span>
                </button>

                <span className="px-2 font-bold font-mono text-on-surface">
                  {activePage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={activePage >= totalPages}
                  onClick={() => handlePageChange(activePage + 1)}
                  className="px-2.5 py-1 bg-surface hover:bg-surface-container border border-outline-variant rounded-lg disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAmharic ? 'ቀጣይ' : 'Next'}</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL 1: DETAILED SCANNED VEHICLE INSPECTION */}
      {selectedLogForDetails && selectedRegForCard && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 transition-all duration-200">
          <div className="bg-surface-container-lowest sm:border border-outline-variant rounded-none sm:rounded-2xl p-5 max-w-xl w-full h-full sm:h-auto space-y-4 shadow-xl sm:max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">directions_car</span>
                <h3 className="font-bold text-sm text-on-surface">
                  {isAmharic ? 'የተፈተሸ ተሽከርካሪ ዝርዝር መረጃ' : 'Scanned Vehicle & Permit Audit Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogForDetails(null)}
                className="text-secondary hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Officer Audit Badge & Driver Portrait Card */}
            <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-sky-950 dark:text-sky-200">{selectedLogForDetails.locationName || 'Checkpoint Scan'}</p>
                  <p className="text-sky-800 dark:text-sky-300 text-[11px]">
                    Scanned At: <span className="font-mono font-bold">{selectedLogForDetails.scannedAt}</span>
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                  selectedLogForDetails.verificationStatus === 'verified'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}>
                  {selectedLogForDetails.verificationStatus}
                </span>
              </div>

              {/* Driver Portrait Photo Cross-Verification Banner */}
              <div className="pt-2 border-t border-sky-200/80 dark:border-sky-800/80 flex items-center gap-3.5">
                <div className="relative w-16 h-20 rounded-xl overflow-hidden border-2 border-primary/40 shadow-sm shrink-0 bg-slate-200 dark:bg-slate-800">
                  <img
                    src={selectedLogForDetails.userPortraitPhoto || selectedLogForDetails.nationalIdPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'}
                    alt={selectedLogForDetails.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-white text-[8px] font-black text-center py-0.5 tracking-wider uppercase">
                    VERIFIED
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-900 dark:text-sky-200 bg-sky-200/60 dark:bg-sky-900/60 px-2 py-0.5 rounded-md">
                    <span className="material-symbols-outlined text-[14px]">badge</span>
                    <span>{isAmharic ? 'የባለቤት መታወቂያ ፎቶ' : 'Driver / Owner ID Portrait'}</span>
                  </span>
                  <h4 className="font-extrabold text-sm text-sky-950 dark:text-slate-100 leading-tight">
                    {selectedLogForDetails.fullName}
                  </h4>
                  <p className="text-[11px] text-sky-800 dark:text-sky-300 font-medium">
                    {isAmharic ? 'የሰሌዳ ቁጥር:' : 'Plate:'} <span className="font-mono font-bold text-primary dark:text-sky-400">{selectedLogForDetails.plateNumber}</span> • {selectedLogForDetails.phone}
                  </p>
                  <p className="text-[10px] text-sky-700/80 dark:text-sky-400/80 font-medium">
                    {isAmharic ? 'የተቆጣጣሪው ባጅ:' : 'Inspector Officer:'} <span className="font-mono font-bold">{selectedLogForDetails.officerBadgeId || userBadgeId || 'OFF-8842'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Render Digital Permit Card */}
            <QRCodeCard registration={selectedRegForCard} lang={lang} />

            {/* Officer Notes */}
            <div className="p-3 bg-surface-container rounded-xl text-xs space-y-1">
              <p className="font-bold text-on-surface">{isAmharic ? 'የተቆጣጣሪው ማረጋገጫ ማስታወሻ:' : 'Officer Field Verification Notes:'}</p>
              <p className="text-secondary italic">"{selectedLogForDetails.officerNotes}"</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedLogForDetails(null)}
              className="w-full bg-primary text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer hover:bg-primary-hover transition-colors"
            >
              {isAmharic ? 'ዝጋ' : 'Close Details'}
            </button>
          </div>
        </div>
      )}

      {/* Shared Scanner Modal */}
      <SharedScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        lang={lang}
        registrations={registrations}
        userBadgeId={userBadgeId}
        onAddVerificationLog={onAddVerificationLog}
      />
    </div>
  );
};
