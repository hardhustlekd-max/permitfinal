import React, { useState } from 'react';
import { MotorcycleRegistration, Language, VehicleCategory } from '../types';
import { QRCodeCard } from './QRCodeCard';
import { DocumentUploadInput } from './DocumentUploadInput';

interface ClerkDashboardProps {
  lang: Language;
  registrations: MotorcycleRegistration[];
  onAddRegistration: (newReg: MotorcycleRegistration) => void;
  userBadgeId: string;
}

export const ClerkDashboard: React.FC<ClerkDashboardProps> = ({
  lang,
  registrations,
  onAddRegistration,
  userBadgeId,
}) => {
  const isAmharic = lang === 'am';

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('electric');
  const [motorBrand, setMotorBrand] = useState('');
  const [motorModel, setMotorModel] = useState('');
  const [engineOrSerialNo, setEngineOrSerialNo] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  // Dynamic state for separate vehicle forms
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

  const [isSuccess, setIsSuccess] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Mock File Upload Handlers (Simulating camera scan / file attachment)
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

  const handleSubmit = (e: React.FormEvent) => {
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
    setIsSuccess(true);

    // Reset Form after brief feedback
    setTimeout(() => {
      setIsSuccess(false);
      setFullName('');
      setPhone('');
      setMotorBrand('');
      setMotorModel('');
      setEngineOrSerialNo('');
      setPlateNumber('');
    }, 2000);
  };

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

  return (
    <div className="space-y-6">
      {/* Main Grid: Form + QR Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Registration Form (7 Cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-on-surface flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary">person_add</span>
            <span>{isAmharic ? 'የባለቤት እና የሞተር መመዝገቢያ ቅጽ' : 'Owner & Motor Registration Form'}</span>
          </h3>

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-xs font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-green-600 text-[24px]">task_alt</span>
              <div>
                <p>{isAmharic ? 'ምዝገባው በስኬት ተላኳል!' : 'Registration submitted successfully!'}</p>
                <p className="text-[11px] font-normal text-green-700">
                  {isAmharic ? 'ለአድሚን ማረጋገጫ ተልኳል።' : 'Sent to System Administrator for final approval.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Motor Category - Simple Row Radio Button Selector */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                {isAmharic ? 'የሞተር ዓይነት *' : 'Motor Type *'}
              </label>
              <div className="flex flex-wrap items-center gap-6 py-2 px-3 bg-surface-container/60 rounded-xl border border-outline-variant/60">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="clerkVehicleCategory"
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
                    name="clerkVehicleCategory"
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

            {/* Owner Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የባለቤት ሙሉ ስም' : 'Owner Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isAmharic ? 'ምሳሌ፡ አበበ በቀለ ደስታ' : 'e.g. Abebe Bekele Desta'}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የስልክ ቁጥር' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 911 000 000"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
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
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
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
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Motor Plate & Engine/Serial No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የሰሌዳ ቁጥር (Plate No.)' : 'Plate Number'}
                </label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="AA-2-M8841"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs font-mono font-bold uppercase text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የሞተር/ሴሪያል ቁጥር' : 'Engine / Motor Serial No.'}
                </label>
                <input
                  type="text"
                  value={engineOrSerialNo}
                  onChange={(e) => setEngineOrSerialNo(e.target.value)}
                  placeholder="ENG-110-33420"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs font-mono text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Document Scans Attachments */}
            <div className="space-y-3 pt-2 border-t border-outline-variant">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                  {isAmharic ? 'የፖርትሬት ፎቶ እና የተቃኙ ሰነዶች' : 'User Portrait & Document Photos'}
                </h4>
                <span className="text-[10px] text-secondary">
                  {isAmharic ? 'ምስል አታችመንት' : 'Photo uploads'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* User Portrait Photo */}
                <DocumentUploadInput
                  label={isAmharic ? '1. የተጠቃሚው ፖርትሬት ፎቶ' : '1. User Portrait Photo'}
                  photoUrl={userPortraitPhoto}
                  onPhotoChange={setUserPortraitPhoto}
                  isAmharic={isAmharic}
                  id="clerk-user-portrait"
                />

                {/* National ID Scan */}
                <DocumentUploadInput
                  label={isAmharic ? '2. ብሔራዊ መታወቂያ' : '2. National ID'}
                  photoUrl={nationalIdPhoto}
                  onPhotoChange={setNationalIdPhoto}
                  isAmharic={isAmharic}
                  id="clerk-nat-id"
                />

                {/* Driving License Scan */}
                <DocumentUploadInput
                  label={isAmharic ? '3. መንጃ ፈቃድ' : '3. Driving License'}
                  photoUrl={drivingLicensePhoto}
                  onPhotoChange={setDrivingLicensePhoto}
                  isAmharic={isAmharic}
                  id="clerk-license"
                />

                {/* Driving Permit Scan */}
                <DocumentUploadInput
                  label={isAmharic ? '4. የፈቃድ ወረቀት' : '4. Driving Permit'}
                  photoUrl={drivingPermitPhoto}
                  onPhotoChange={setDrivingPermitPhoto}
                  isAmharic={isAmharic}
                  id="clerk-permit"
                />
              </div>
            </div>

            {/* Submit & Preview Buttons */}
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
                className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                <span>{isAmharic ? 'ምዝገባውን ለአድሚን ላክ' : 'Submit Registration'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Real-time QR ID & Sticker Preview Box */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-secondary uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">visibility</span>
                <span>{isAmharic ? 'የቀጥታ QR መታወቂያና ስቲከር ቅድመ እይታ' : 'Live QR ID & Sticker Preview'}</span>
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

      {/* Submitted Registrations History */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xs overflow-hidden space-y-3 p-3.5 sm:p-4">
        <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          <span>{isAmharic ? 'በእርስዎ የተመዘገቡ ሞተሮች' : 'Your Submitted Registrations'}</span>
        </h3>

        <div className="divide-y divide-outline-variant overflow-x-auto">
          {registrations.length === 0 ? (
            <p className="text-xs text-secondary py-4 text-center">
              {isAmharic ? 'ምንም የተመዘገበ ሞተር የለም' : 'No motor registrations yet.'}
            </p>
          ) : (
            registrations.map((reg) => (
              <div key={reg.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-bold text-on-surface">{reg.fullName}</p>
                  <p className="text-[11px] text-secondary font-mono">
                    {reg.plateNumber} • {reg.vehicleCategory === 'electric' ? 'EV' : '<110cc'} • {reg.engineOrSerialNo}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-outline font-mono">{reg.registrationDate}</span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      reg.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : reg.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {reg.status === 'approved'
                      ? (isAmharic ? 'ፅድቋል' : 'Approved')
                      : reg.status === 'rejected'
                      ? (isAmharic ? 'ተሰርዟል' : 'Rejected')
                      : (isAmharic ? 'በመጠበቅ ላይ' : 'Pending Admin')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
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
