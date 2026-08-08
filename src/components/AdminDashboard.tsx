import React, { useState } from 'react';
import {
  MotorcycleRegistration,
  OfficerAssignment,
  PrintBatchOrder,
  Language,
} from '../types';
import { QRCodeCard } from './QRCodeCard';
import { BatchPrintPreviewPage } from './BatchPrintPreviewPage';

interface AdminDashboardProps {
  lang: Language;
  registrations: MotorcycleRegistration[];
  officers: OfficerAssignment[];
  printOrders: PrintBatchOrder[];
  onApproveRegistration: (id: string) => void;
  onRejectRegistration: (id: string, reason: string) => void;
  onAddOfficerAssignment: (assignment: OfficerAssignment) => void;
  onCreatePrintOrder: (registrationIds: string[], notes: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  registrations,
  officers,
  printOrders,
  onApproveRegistration,
  onRejectRegistration,
  onAddOfficerAssignment,
  onCreatePrintOrder,
}) => {
  const isAmharic = lang === 'am';

  const [activeTab, setActiveTab] = useState<'pending' | 'assignments' | 'print_batch'>('pending');

  // Selected registration for modal inspection
  const [inspectReg, setInspectReg] = useState<MotorcycleRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // New Officer Assignment Form
  const [officerName, setOfficerName] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [subCity, setSubCity] = useState('ቦሌ (Bole)');
  const [locationName, setLocationName] = useState('');
  const [shift, setShift] = useState<'morning' | 'afternoon' | 'night'>('morning');

  // Batch Print Selection
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [batchNotes, setBatchNotes] = useState('');

  const pendingRegistrations = registrations.filter((r) => r.status === 'pending_approval');
  const approvedRegistrations = registrations.filter((r) => r.status === 'approved');

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim() || !badgeId.trim()) return;

    const newAssignment: OfficerAssignment = {
      id: `ASN-${Math.floor(100 + Math.random() * 900)}`,
      officerName: officerName.trim(),
      badgeId: badgeId.trim().toUpperCase(),
      subCity,
      locationName: locationName.trim() || (isAmharic ? 'ዋና መስቀለኛው ቦታ' : 'Main Checkpoint'),
      shift,
      status: 'active',
    };

    onAddOfficerAssignment(newAssignment);
    setOfficerName('');
    setBadgeId('');
    setLocationName('');
  };

  const toggleSelectRegForPrint = (id: string) => {
    setSelectedRegIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDispatchPrintOrder = () => {
    if (selectedRegIds.length === 0) return;
    onCreatePrintOrder(selectedRegIds, batchNotes || (isAmharic ? 'መደበኛ የማተሚያ ትእዛዝ' : 'Standard Print Batch'));
    setSelectedRegIds([]);
    setBatchNotes('');
    setActiveTab('print_batch');
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden">
      {/* Combined Tab Navigation */}
      <div className="bg-surface-container/50 border-b border-outline-variant px-5 sm:px-6 pt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex gap-6 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`pb-3 pt-2 px-1 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-primary text-primary font-extrabold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
              <span>{isAmharic ? 'የሚጠበቁ ምዝገባዎች' : 'Pending Approvals'}</span>
              {pendingRegistrations.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'pending' ? 'bg-sky-100 text-sky-800' : 'bg-surface-container text-secondary'
                }`}>
                  {pendingRegistrations.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              className={`pb-3 pt-2 px-1 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'assignments'
                  ? 'border-primary text-primary font-extrabold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>{isAmharic ? 'ተቆጣጣሪዎችን ማሰማራት' : 'Assign Officers'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('print_batch')}
              className={`pb-3 pt-2 px-1 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'print_batch'
                  ? 'border-blue-600 text-blue-600 font-extrabold'
                  : 'border-transparent text-secondary hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>{isAmharic ? 'የሕትመት ትእዛዝ' : 'Batch Print Orders'}</span>
            </button>
          </div>
        </div>

      {/* Main Tab Content Body */}
      <div className="p-3.5 sm:p-4">
        {/* TAB 1: PENDING REGISTRATION APPROVALS */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
          {pendingRegistrations.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 text-center space-y-2">
              <span className="material-symbols-outlined text-green-600 text-[40px]">check_circle</span>
              <h3 className="font-bold text-sm text-on-surface">
                {isAmharic ? 'ምንም የሚጠበቅ ምዝገባ የለም!' : 'All caught up! No pending registrations.'}
              </h3>
              <p className="text-xs text-secondary">
                {isAmharic ? 'በፀሀፊ የቀረቡ ሁሉም ምዝገባዎች ታይተው ፀድቀዋል።' : 'All clerk entries have been processed.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {pendingRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-3.5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                        {reg.id}
                      </span>
                      <span className="text-[10px] text-outline font-mono">{reg.registrationDate}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{reg.fullName}</h4>
                      <p className="text-xs text-secondary">{reg.phone}</p>
                    </div>

                    <div className="p-3 bg-surface-container/50 rounded-xl space-y-1 text-xs">
                      <p className="text-secondary">
                        <span className="font-semibold">{isAmharic ? 'ሰሌዳ፡' : 'Plate:'}</span> {reg.plateNumber}
                      </p>
                      <p className="text-secondary">
                        <span className="font-semibold">{isAmharic ? 'ዓይነት፡' : 'Category:'}</span>{' '}
                        {reg.vehicleCategory === 'electric' ? 'Ev' : 'Gasoline'}
                      </p>
                      <p className="text-secondary font-mono text-[11px]">
                        <span className="font-semibold">{isAmharic ? 'ሴሪያል፡' : 'Serial:'}</span> {reg.engineOrSerialNo}
                      </p>
                    </div>

                    {/* Scanned Docs Thumbnail Row */}
                    <div>
                      <p className="text-[10px] font-bold text-secondary mb-1">
                        {isAmharic ? 'የተያያዙ ፎቶዎች እና ሰነዶች:' : 'Attached Photos & Docs:'}
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        <img
                          src={reg.userPortraitPhoto || reg.nationalIdPhoto}
                          alt="Portrait"
                          className="w-full h-12 object-cover rounded border border-outline-variant"
                          title="User Portrait Photo"
                        />
                        <img
                          src={reg.nationalIdPhoto}
                          alt="National ID"
                          className="w-full h-12 object-cover rounded border border-outline-variant"
                          title="National ID"
                        />
                        <img
                          src={reg.drivingLicensePhoto}
                          alt="License"
                          className="w-full h-12 object-cover rounded border border-outline-variant"
                          title="Driving License"
                        />
                        <img
                          src={reg.drivingPermitPhoto}
                          alt="Permit"
                          className="w-full h-12 object-cover rounded border border-outline-variant"
                          title="Driving Permit"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-outline-variant flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectReg(reg)}
                      className="p-2 bg-surface-container text-on-surface rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer text-xs font-bold"
                      title="Inspect ID & Sticker"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onApproveRegistration(reg.id)}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{isAmharic ? 'አፅድቅ' : 'Approve'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInspectReg(reg);
                        setShowRejectModal(true);
                      }}
                      className="bg-red-100 text-red-800 py-2 px-3 rounded-xl font-bold text-xs hover:bg-red-200 transition-colors cursor-pointer"
                    >
                      {isAmharic ? 'ሰርዝ' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONTROLLER / OFFICER ASSIGNMENT */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Form: Add Assignment */}
          <div className="lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2 border-b border-outline-variant pb-2.5">
              <span className="material-symbols-outlined text-primary">add_location_alt</span>
              <span>{isAmharic ? 'አዲስ የመስክ ተቆጣጣሪ መድብ' : 'Assign Controller to Location'}</span>
            </h3>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የተቆጣጣሪ ሙሉ ስም' : 'Officer Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder={isAmharic ? 'ምሳሌ፡ ተቆጣጣሪ ታደሰ' : 'Officer Tadesse'}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የመለያ ቁጥር (Badge ID)' : 'Badge ID'} *
                </label>
                <input
                  type="text"
                  required
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  placeholder="OFFICER-9910"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {isAmharic ? 'ክፍለ ከተማ' : 'Sub-City Location'}
                  </label>
                  <select
                    value={subCity}
                    onChange={(e) => setSubCity(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="ቦሌ (Bole)">ቦሌ (Bole)</option>
                    <option value="አራዳ (Arada)">አራዳ (Arada)</option>
                    <option value="ቂርቆስ (Kirkos)">ቂርቆስ (Kirkos)</option>
                    <option value="ልደታ (Lideta)">ልደታ (Lideta)</option>
                    <option value="አዲስ ከተማ (Addis Ketema)">አዲስ ከተማ (Addis Ketema)</option>
                    <option value="የካ (Yeka)">የካ (Yeka)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {isAmharic ? 'የስራ ፈረቃ' : 'Shift'}
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as 'morning' | 'afternoon' | 'night')}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="morning">{isAmharic ? 'ጠዋት (Morning)' : 'Morning'}</option>
                    <option value="afternoon">{isAmharic ? 'ከሰዓት (Afternoon)' : 'Afternoon'}</option>
                    <option value="night">{isAmharic ? 'ማታ (Night)' : 'Night'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የቦታ መግለጫ (CheckPoint/Location)' : 'Checkpoint Name'}
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={isAmharic ? 'ምሳሌ፡ መስቀል አደባባይ መውጫ' : 'e.g. Meskel Square Checkpoint'}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                <span>{isAmharic ? 'ተቆጣጣሪውን መድብ' : 'Assign Officer Now'}</span>
              </button>
            </form>
          </div>

          {/* Right List: Active Officers Table */}
          <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">groups</span>
              <span>{isAmharic ? 'የተመደቡ የመስክ ተቆጣጣሪዎች ዝርዝር' : 'Currently Assigned Officers'}</span>
            </h3>

            <div className="divide-y divide-outline-variant">
              {officers.map((off) => (
                <div key={off.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-on-surface">{off.officerName}</p>
                    <p className="text-[11px] text-secondary">
                      <span className="font-mono text-primary font-bold">{off.badgeId}</span> • {off.subCity} — {off.locationName}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block px-2 py-0.5 bg-secondary-container text-secondary rounded text-[10px] font-bold uppercase">
                      {off.shift} shift
                    </span>
                    <p className="text-[10px] text-green-700 font-bold flex items-center gap-1 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                      <span>Active</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRINT PRESS BATCH ORDERING & PREVIEW PAGE */}
      {activeTab === 'print_batch' && (
        <BatchPrintPreviewPage
          lang={lang}
          registrations={registrations}
          printOrders={printOrders}
          onCreatePrintOrder={onCreatePrintOrder}
        />
      )}
      </div>

      {/* Inspection Modal for Registration */}
      {inspectReg && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-bold text-sm text-on-surface">
                {isAmharic ? 'የሞተር እና መታወቂያ ፍተሻ' : 'Inspect Motor & Owner Card'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setInspectReg(null);
                  setShowRejectModal(false);
                }}
                className="text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <QRCodeCard registration={inspectReg} lang={lang} />

            {showRejectModal && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <p className="text-xs font-bold text-red-900">
                  {isAmharic ? 'የመሰረዣ ምክንያት ያስገቡ' : 'Specify Rejection Reason:'}
                </p>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={isAmharic ? 'ምሳሌ፡ የሰነድ ጉድለት አለበት' : 'e.g. Scanned permit document unclear'}
                  className="w-full bg-white border border-red-300 rounded-lg p-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    onRejectRegistration(inspectReg.id, rejectReason || 'Incomplete document');
                    setInspectReg(null);
                    setShowRejectModal(false);
                  }}
                  className="w-full bg-red-600 text-white py-2 rounded-lg font-bold text-xs"
                >
                  {isAmharic ? 'ምዝገባውን ሰርዝ (Confirm Rejection)' : 'Confirm Rejection'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
