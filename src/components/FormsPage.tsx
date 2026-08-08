import React, { useState } from 'react';
import {
  Language,
  UserRole,
  MotorcycleRegistration,
  VehicleCategory,
  OfficerAssignment,
  PrintBatchOrder,
} from '../types';
import { QRCodeCard } from './QRCodeCard';
import { DocumentUploadInput } from './DocumentUploadInput';
import { BatchPrintPreviewPage } from './BatchPrintPreviewPage';

interface FormsPageProps {
  lang: Language;
  userRole: UserRole;
  userBadgeId: string;
  registrations: MotorcycleRegistration[];
  officers: OfficerAssignment[];
  printOrders: PrintBatchOrder[];
  onAddRegistration: (newReg: MotorcycleRegistration) => void;
  onAddOfficerAssignment: (assignment: OfficerAssignment) => void;
  onCreatePrintOrder: (registrationIds: string[], notes: string) => void;
}

export const FormsPage: React.FC<FormsPageProps> = ({
  lang,
  userRole,
  userBadgeId,
  registrations,
  officers,
  printOrders,
  onAddRegistration,
  onAddOfficerAssignment,
  onCreatePrintOrder,
}) => {
  const isAmharic = lang === 'am';

  const canShowRegistration = userRole === 'clerk' || userRole === 'admin';
  const canShowOfficer = userRole === 'admin';
  const canShowPrint = userRole === 'admin' || userRole === 'printing_press';

  // Active form tab: 'registration' | 'officer' | 'print'
  const getInitialTab = (): 'registration' | 'officer' | 'print' => {
    if (userRole === 'printing_press') return 'print';
    if (userRole === 'officer') return 'officer';
    return 'registration';
  };

  const [activeFormTab, setActiveFormTab] = useState<'registration' | 'officer' | 'print'>(getInitialTab);

  // Sync tab if userRole changes
  React.useEffect(() => {
    if (activeFormTab === 'registration' && !canShowRegistration) {
      if (canShowPrint) setActiveFormTab('print');
      else if (canShowOfficer) setActiveFormTab('officer');
    } else if (activeFormTab === 'officer' && !canShowOfficer) {
      if (canShowRegistration) setActiveFormTab('registration');
      else if (canShowPrint) setActiveFormTab('print');
    } else if (activeFormTab === 'print' && !canShowPrint) {
      if (canShowRegistration) setActiveFormTab('registration');
      else if (canShowOfficer) setActiveFormTab('officer');
    }
  }, [userRole, activeFormTab, canShowRegistration, canShowOfficer, canShowPrint]);

  // --- FORM 1: MOTORCYCLE REGISTRATION STATE ---
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('electric');
  const [motorBrand, setMotorBrand] = useState('');
  const [motorModel, setMotorModel] = useState('');
  const [engineOrSerialNo, setEngineOrSerialNo] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  // Vehicle type specific state for separate forms
  const [batterySpecs, setBatterySpecs] = useState('72V 32Ah Lithium-ion');
  const [motorPower, setMotorPower] = useState('2000W EV Hub Motor');
  const [batterySerialNo, setBatterySerialNo] = useState('');

  const [engineCC, setEngineCC] = useState('108 cc');
  const [fuelCapacity, setFuelCapacity] = useState('5.5 Liters');
  const [emissionReceiptNo, setEmissionReceiptNo] = useState('');

  const [userPortraitPhoto, setUserPortraitPhoto] = useState('');
  const [nationalIdPhoto, setNationalIdPhoto] = useState('');
  const [drivingLicensePhoto, setDrivingLicensePhoto] = useState('');
  const [drivingPermitPhoto, setDrivingPermitPhoto] = useState('');

  const [regSuccess, setRegSuccess] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setter(reader.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const newId = `REG-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newRegistration: MotorcycleRegistration = {
      id: newId,
      fullName: fullName.trim(),
      phone: phone.trim() || '+251 900 000 000',
      userPortraitPhoto,
      nationalIdPhoto,
      drivingLicensePhoto,
      drivingPermitPhoto,
      vehicleCategory,
      motorBrand: motorBrand.trim(),
      motorModel: motorModel.trim(),
      engineOrSerialNo: engineOrSerialNo.trim() || `SER-${Math.floor(10000 + Math.random() * 90000)}`,
      plateNumber: plateNumber.trim().toUpperCase() || `AA-2-M${Math.floor(1000 + Math.random() * 9000)}`,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'pending_approval',
      qrCodeData: `https://enforcement.gov.et/verify/${newId}`,
      registeredBy: userBadgeId || 'CLERK-001',
    };

    onAddRegistration(newRegistration);
    setRegSuccess(true);

    setTimeout(() => {
      setRegSuccess(false);
      setFullName('');
      setPhone('');
      setMotorBrand('');
      setMotorModel('');
      setEngineOrSerialNo('');
      setPlateNumber('');
    }, 2500);
  };

  // Preview object for live QR
  const previewRegistration: Partial<MotorcycleRegistration> = {
    id: 'REG-PREVIEW',
    fullName: fullName || (isAmharic ? 'የባለቤት ሙሉ ስም' : 'Owner Full Name'),
    phone: phone || '+251 900 000 000',
    userPortraitPhoto,
    nationalIdPhoto,
    drivingLicensePhoto,
    drivingPermitPhoto,
    vehicleCategory,
    motorBrand: motorBrand || 'Lifan',
    motorModel: motorModel || '2026 EV',
    engineOrSerialNo: engineOrSerialNo || 'SN-ELECT-2026',
    plateNumber: plateNumber || 'AA-2-E0000',
    qrCodeData: `https://enforcement.gov.et/verify/PREVIEW-${fullName || 'NEW'}`,
  };

  // --- FORM 2: OFFICER DEPLOYMENT STATE ---
  const [officerName, setOfficerName] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [subCity, setSubCity] = useState('Bole Sub-City');
  const [assignedLocation, setAssignedLocation] = useState('');
  const [officerPhone, setOfficerPhone] = useState('');
  const [shiftHours, setShiftHours] = useState('08:00 - 16:00 (Day Shift)');
  const [officerSuccess, setOfficerSuccess] = useState(false);

  const handleOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim()) return;

    const newAssignment: OfficerAssignment = {
      id: `OFF-2026-${Math.floor(100 + Math.random() * 900)}`,
      officerName: officerName.trim(),
      badgeId: badgeId.trim().toUpperCase() || `OFF-${Math.floor(1000 + Math.random() * 9000)}`,
      subCity,
      locationName: assignedLocation.trim() || `${subCity} Central Checkpoint`,
      shift: 'morning',
      assignedLocation: assignedLocation.trim() || `${subCity} Central Checkpoint`,
      phone: officerPhone.trim() || '+251 911 223 344',
      shiftHours,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'active',
    };

    onAddOfficerAssignment(newAssignment);
    setOfficerSuccess(true);

    setTimeout(() => {
      setOfficerSuccess(false);
      setOfficerName('');
      setBadgeId('');
      setAssignedLocation('');
      setOfficerPhone('');
    }, 2500);
  };

  // --- FORM 3: PRINT BATCH ORDER STATE ---
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [printSuccess, setPrintSuccess] = useState(false);

  const approvedRegsForPrint = registrations.filter(
    (r) => r.status === 'approved'
  );

  const toggleSelectRegForPrint = (id: string) => {
    if (selectedRegIds.includes(id)) {
      setSelectedRegIds((prev) => prev.filter((i) => i !== id));
    } else {
      setSelectedRegIds((prev) => [...prev, id]);
    }
  };

  const handleSelectAllForPrint = () => {
    if (selectedRegIds.length === approvedRegsForPrint.length) {
      setSelectedRegIds([]);
    } else {
      setSelectedRegIds(approvedRegsForPrint.map((r) => r.id));
    }
  };

  const handlePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRegIds.length === 0) return;

    onCreatePrintOrder(selectedRegIds, orderNotes || 'Standard Batch Printing Dispatch');
    setPrintSuccess(true);
    setSelectedRegIds([]);
    setOrderNotes('');

    setTimeout(() => {
      setPrintSuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-4">
      {/* Forms Action Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant p-3 sm:p-3.5 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">assignment</span>
          <span className="text-xs font-bold text-on-surface">
            {isAmharic ? 'ስርዓት እና ማመልከቻ ቅጾች' : 'Registration & Administrative Forms'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canShowRegistration && (
            <button
              type="button"
              onClick={() => setActiveFormTab('registration')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFormTab === 'registration'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container text-secondary hover:text-on-surface'
              }`}
            >
              {isAmharic ? 'ምዝገባ' : 'Registration'}
            </button>
          )}

          {canShowOfficer && (
            <button
              type="button"
              onClick={() => setActiveFormTab('officer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFormTab === 'officer'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container text-secondary hover:text-on-surface'
              }`}
            >
              {isAmharic ? 'ተቆጣጣሪ ምደባ' : 'Officer Deployment'}
            </button>
          )}

          {canShowPrint && (
            <button
              type="button"
              onClick={() => setActiveFormTab('print')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFormTab === 'print'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-surface-container text-secondary hover:text-on-surface'
              }`}
            >
              {isAmharic ? 'የሕትመት ባች' : 'Batch Print'} ({approvedRegsForPrint.length})
            </button>
          )}
        </div>
      </div>

      {/* Main Normal Form Body */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden p-3.5 sm:p-5">
        {/* --- FORM 1: MOTORCYCLE REGISTRATION NORMAL FORM --- */}
        {activeFormTab === 'registration' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Form */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-bold text-base text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
                <span className="material-symbols-outlined text-primary">two_wheeler</span>
                <span>{isAmharic ? 'የባለቤት እና ሞተር ምዝገባ' : 'Owner & Motor Registration'}</span>
              </h3>

            {regSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-fade-in">
                <span className="material-symbols-outlined text-green-600 text-[24px]">task_alt</span>
                <div>
                  <p>{isAmharic ? 'ምዝገባው በስኬት ተላኳል!' : 'Registration submitted successfully!'}</p>
                  <p className="text-[11px] font-normal text-green-700">
                    {isAmharic ? 'ለአድሚን ማረጋገጫ እና ፅደቃ ተልኳል።' : 'Pending administrator review and approval.'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              {/* Motor Category - Simple Row Radio Button Selector */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  {isAmharic ? 'የሞተር ዓይነት *' : 'Motor Type *'}
                </label>
                <div className="flex flex-wrap items-center gap-6 py-2 px-3 bg-surface-container/60 rounded-xl border border-outline-variant/60">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vehicleCategory"
                      value="electric"
                      checked={vehicleCategory === 'electric'}
                      onChange={() => setVehicleCategory('electric')}
                      className="w-4 h-4 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span className={`text-xs ${vehicleCategory === 'electric' ? 'font-bold text-on-surface' : 'text-secondary'}`}>
                      {isAmharic ? 'ኢቪ (Ev)' : 'Ev'}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="vehicleCategory"
                      value="gas_under_110cc"
                      checked={vehicleCategory === 'gas_under_110cc' || vehicleCategory === 'under_110cc'}
                      onChange={() => setVehicleCategory('gas_under_110cc')}
                      className="w-4 h-4 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span className={`text-xs ${vehicleCategory === 'gas_under_110cc' || vehicleCategory === 'under_110cc' ? 'font-bold text-on-surface' : 'text-secondary'}`}>
                      {isAmharic ? 'ቤንዚን' : 'Gasoline'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Owner Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {isAmharic ? 'የባለቤት ሙሉ ስም *' : 'Owner Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isAmharic ? 'ምሳሌ፡ አበበ በቀለ ደስታ' : 'e.g. Abebe Kebede Desta'}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {isAmharic ? 'ስልክ ቁጥር' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 911 000 000"
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Motor Brand & Model Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {isAmharic ? 'የሞተር ብራንድ' : 'Motor Brand'}
                  </label>
                  <input
                    type="text"
                    value={motorBrand}
                    onChange={(e) => setMotorBrand(e.target.value)}
                    placeholder={isAmharic ? 'ምሳሌ፡ ሊፋን / ቲቪኤስ / ባጃጅ' : 'e.g. Lifan / TVS / Bajaj'}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {isAmharic ? 'የሞተር ሞዴል' : 'Motor Model'}
                  </label>
                  <input
                    type="text"
                    value={motorModel}
                    onChange={(e) => setMotorModel(e.target.value)}
                    placeholder={isAmharic ? 'ምሳሌ፡ 2024 ኢቪ / ኪንግ' : 'e.g. 2024 EV / King'}
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Motorcycle Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {isAmharic ? 'የሰሌዳ ቁጥር (Plate No)' : 'Plate Number'}
                  </label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="AA-2-M8841"
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {isAmharic ? 'የሞተር/ሴሪያል ቁጥር' : 'Engine / Serial No'}
                  </label>
                  <input
                    type="text"
                    value={engineOrSerialNo}
                    onChange={(e) => setEngineOrSerialNo(e.target.value)}
                    placeholder="ENG-998412-2026"
                    className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Upload Documents Section */}
              <div className="space-y-3 pt-2 border-t border-outline-variant">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-secondary">
                    {isAmharic ? 'የተያያዙ ህጋዊ ሰነዶች እና የፖርትሬት ፎቶ' : 'User Portrait & Document Attachments'}
                  </label>
                  <span className="text-[10px] text-secondary">
                    {isAmharic ? 'የፎቶ/ሰነድ አታችመንት' : 'Picture file uploads'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* User Portrait Photo */}
                  <DocumentUploadInput
                    label={isAmharic ? '1. የተጠቃሚው ፖርትሬት ፎቶ' : '1. User Portrait Photo'}
                    photoUrl={userPortraitPhoto}
                    onPhotoChange={setUserPortraitPhoto}
                    isAmharic={isAmharic}
                    id="form-user-portrait"
                  />

                  {/* National ID */}
                  <DocumentUploadInput
                    label={isAmharic ? '2. ብሔራዊ መታወቂያ' : '2. National ID'}
                    photoUrl={nationalIdPhoto}
                    onPhotoChange={setNationalIdPhoto}
                    isAmharic={isAmharic}
                    id="form-nat-id"
                  />

                  {/* Driving License */}
                  <DocumentUploadInput
                    label={isAmharic ? '3. መንጃ ፈቃድ' : '3. Driver License'}
                    photoUrl={drivingLicensePhoto}
                    onPhotoChange={setDrivingLicensePhoto}
                    isAmharic={isAmharic}
                    id="form-license"
                  />

                  {/* Permit Document */}
                  <DocumentUploadInput
                    label={isAmharic ? '4. የፈቃድ ወረቀት' : '4. Permit Doc'}
                    photoUrl={drivingPermitPhoto}
                    onPhotoChange={setDrivingPermitPhoto}
                    isAmharic={isAmharic}
                    id="form-permit"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">visibility</span>
                  <span>{isAmharic ? 'መታወቂያ እና ስቲከር ቅድመ-እይታ' : 'Live ID & Sticker Preview'}</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>{isAmharic ? 'ምዝገባውን ለአድሚን ማፅደቂያ ላክ' : 'Submit Registration to Admin'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live QR Preview Box */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-secondary uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">visibility</span>
                  <span>{isAmharic ? 'የመታወቂያ እና QR ስቲከር ቅድመ-እይታ' : 'Live ID & Sticker Preview'}</span>
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  Auto Generated
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3">
                <div className="flex justify-center items-center gap-3 text-slate-700">
                  <span className="material-symbols-outlined text-3xl text-emerald-600">badge</span>
                  <span className="material-symbols-outlined text-3xl text-primary">qr_code_2</span>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {fullName || (isAmharic ? 'የባለቤት ስም አልተሞላም' : 'Owner Name Pending')}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {plateNumber || (isAmharic ? 'የሰሌዳ ቁጥር' : 'PLATE NUMBER')} • {vehicleCategory.toUpperCase()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span>{isAmharic ? 'መታወቂያና ስቲከር በሞዳል እይ' : 'Open Live ID & Sticker Preview'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: OFFICER PATROL DEPLOYMENT FORM --- */}
      {activeFormTab === 'officer' && (
        <div className="max-w-2xl mx-auto bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary">badge</span>
            <span>{isAmharic ? 'አዲስ የመስክ ህግ ማስከበሪያ ተቆጣጣሪ መድብ' : 'Assign New Patrol Officer'}</span>
          </h3>

          {officerSuccess && (
            <div className="bg-sky-50 border border-sky-200 text-sky-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
              <div>
                <p>{isAmharic ? 'ተቆጣጣሪው በስኬት ተመድቧል!' : 'Officer successfully assigned to checkpoint!'}</p>
                <p className="text-[11px] font-normal text-sky-800">
                  {isAmharic ? 'ተቆጣጣሪው በመስክ መቆጣጠሪያ መዝገብ ውስጥ ተካቷል።' : 'Added to active municipal officer directory.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleOfficerSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የተቆጣጣሪ ሙሉ ስም *' : 'Officer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder={isAmharic ? 'ምሳሌ፡ ኢንስፔክተር ታደሰ ገብሬ' : 'e.g. Inspector Tadesse Gebre'}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የባጅ ቁጥር (Badge ID)' : 'Badge ID'}
                </label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  placeholder="OFF-8842"
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'ክፍለ ከተማ' : 'Sub-City Jurisdiction'}
                </label>
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Bole Sub-City">Bole Sub-City (ቦሌ)</option>
                  <option value="Kirkos Sub-City">Kirkos Sub-City (ቂርቆስ)</option>
                  <option value="Yeka Sub-City">Yeka Sub-City (የካ)</option>
                  <option value="Arada Sub-City">Arada Sub-City (አራዳ)</option>
                  <option value="Nifas Silk Sub-City">Nifas Silk Sub-City (ንፋስ ስልክ)</option>
                  <option value="Lideta Sub-City">Lideta Sub-City (ልደታ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የስራ ፈረቃ (Shift)' : 'Shift Hours'}
                </label>
                <input
                  type="text"
                  value={shiftHours}
                  onChange={(e) => setShiftHours(e.target.value)}
                  placeholder="08:00 - 16:00 (Day Shift)"
                  className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የተመደበበት ህዝባዊ ቦታ / መጋቢ መንገድ' : 'Assigned Checkpoint / Checkpost'}
              </label>
              <input
                type="text"
                value={assignedLocation}
                onChange={(e) => setAssignedLocation(e.target.value)}
                placeholder={isAmharic ? 'ምሳሌ፡ ቦሌ አየር መንገድ አደባባይ መፈተሻ' : 'e.g. Bole Airport Roundabout Checkpoint'}
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የተቆጣጣሪ ስልክ ቁጥር' : 'Officer Phone Number'}
              </label>
              <input
                type="text"
                value={officerPhone}
                onChange={(e) => setOfficerPhone(e.target.value)}
                placeholder="+251 911 223 344"
                className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>{isAmharic ? 'ተቆጣጣሪውን ወደ መስክ መድብ' : 'Deploy Officer to Field'}</span>
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 3: PRINT PRESS BATCH DISPATCH & PREVIEW PAGE --- */}
      {activeFormTab === 'print' && (
        <BatchPrintPreviewPage
          lang={lang}
          registrations={registrations}
          printOrders={printOrders}
          onCreatePrintOrder={onCreatePrintOrder}
        />
      )}
      {/* Live ID & Sticker Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                <span>{isAmharic ? 'የመታወቂያ እና QR ስቲከር ቅድመ-እይታ' : 'Live ID & Sticker Preview'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-secondary hover:text-on-surface p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <QRCodeCard registration={previewRegistration} lang={lang} />

            <div className="flex justify-between items-center pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>{isAmharic ? 'መታወቂያውን አትም (Print ID)' : 'Print ID Card'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold py-2 px-5 rounded-xl text-xs transition-all cursor-pointer"
              >
                {isAmharic ? 'ዝጋ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
