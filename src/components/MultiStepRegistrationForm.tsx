import React, { useState } from 'react';
import { MotorcycleRegistration, Language, VehicleCategory } from '../types';
import { DocumentUploadInput } from './DocumentUploadInput';
import {
  validateFullName,
  validatePhone,
  validatePlateNumber,
  validateEngineOrSerial,
  validateRequiredText,
} from '../utils/validation';

interface MultiStepRegistrationFormProps {
  lang: Language;
  onAddRegistration: (newReg: MotorcycleRegistration) => void;
  userBadgeId: string;
  onOpenPreviewModal?: (previewReg: Partial<MotorcycleRegistration>) => void;
}

export const MultiStepRegistrationForm: React.FC<MultiStepRegistrationFormProps> = ({
  lang,
  onAddRegistration,
  userBadgeId,
  onOpenPreviewModal,
}) => {
  const isAmharic = lang === 'am';

  // Step state: 1 = Text Inputs, 2 = File Uploads, 3 = Confirmation Agreement & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('electric');
  const [motorBrand, setMotorBrand] = useState('');
  const [motorModel, setMotorModel] = useState('');
  const [engineOrSerialNo, setEngineOrSerialNo] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  // Photos (Step 2)
  const [userPortraitPhoto, setUserPortraitPhoto] = useState('');
  const [nationalIdPhoto, setNationalIdPhoto] = useState('');
  const [drivingLicensePhoto, setDrivingLicensePhoto] = useState('');
  const [drivingPermitPhoto, setDrivingPermitPhoto] = useState(''); // Libre Photo

  // Step 3 Confirmation Agreement State
  const [isDataConfirmed, setIsDataConfirmed] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [isSuccess, setIsSuccess] = useState(false);

  // Form Field Validation Errors
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [motorBrandError, setMotorBrandError] = useState('');
  const [motorModelError, setMotorModelError] = useState('');
  const [plateNumberError, setPlateNumberError] = useState('');
  const [engineOrSerialNoError, setEngineOrSerialNoError] = useState('');

  // Validate Step 1 fields
  const validateStep1 = (): boolean => {
    setFullNameError('');
    setPhoneError('');
    setMotorBrandError('');
    setMotorModelError('');
    setPlateNumberError('');
    setEngineOrSerialNoError('');
    setValidationError('');

    let hasErrors = false;

    const nameVal = validateFullName(fullName, isAmharic);
    if (!nameVal.isValid) {
      setFullNameError(nameVal.message);
      hasErrors = true;
    }

    const phoneVal = validatePhone(phone, isAmharic);
    if (!phoneVal.isValid) {
      setPhoneError(phoneVal.message);
      hasErrors = true;
    }

    const brandVal = validateRequiredText(motorBrand, isAmharic ? 'የሞተር ብራንድ' : 'Motor Brand', isAmharic, 2);
    if (!brandVal.isValid) {
      setMotorBrandError(brandVal.message);
      hasErrors = true;
    }

    const modelVal = validateRequiredText(motorModel, isAmharic ? 'የሞተር ሞዴል' : 'Motor Model', isAmharic, 1);
    if (!modelVal.isValid) {
      setMotorModelError(modelVal.message);
      hasErrors = true;
    }

    const plateVal = validatePlateNumber(plateNumber, isAmharic);
    if (!plateVal.isValid) {
      setPlateNumberError(plateVal.message);
      hasErrors = true;
    }

    const serialVal = validateEngineOrSerial(engineOrSerialNo, isAmharic);
    if (!serialVal.isValid) {
      setEngineOrSerialNoError(serialVal.message);
      hasErrors = true;
    }

    if (hasErrors) {
      setValidationError(isAmharic ? 'እባክዎ የተፈጠሩ ስህተቶችን ያስተካክሉ!' : 'Please fix the errors in the form before proceeding!');
    }

    return !hasErrors;
  };

  // Validate Step 1 before proceeding
  const handleGoToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  // Step 2 to Step 3
  const handleGoToStep3 = () => {
    setValidationError('');
    if (!nationalIdPhoto) {
      setValidationError(isAmharic ? 'እባክዎ ብሔራዊ መታወቂያ አታች ያድርጉ!' : 'Please upload National ID photo/document!');
      return;
    }
    if (!drivingPermitPhoto) {
      setValidationError(isAmharic ? 'እባክዎ የሞተር ሊብሬ (Libre) ሰነድ አታች ያድርጉ!' : 'Please upload Vehicle Libre (Logbook) document!');
      return;
    }
    setValidationError('');
    setCurrentStep(3);
  };

  // Final Submission on Step 3
  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!nationalIdPhoto || !drivingPermitPhoto) {
      setValidationError(isAmharic ? 'እባክዎ መጀመሪያ ሰነዶችን አታች ያድርጉ!' : 'Please upload all required document scans first!');
      setCurrentStep(2);
      return;
    }
    if (!isDataConfirmed) {
      setValidationError(
        isAmharic
          ? 'እባክዎ የመረጃውን ትክክለኛነት ማረጋገጫ ሳጥን ይምረጡ!'
          : 'Please check the data correctness agreement before submitting!'
      );
      return;
    }

    const newId = `REG-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newRegistration: MotorcycleRegistration = {
      id: newId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      userPortraitPhoto,
      nationalIdPhoto,
      drivingLicensePhoto,
      drivingPermitPhoto, // Serves as the Vehicle Libre / Logbook Document Photo
      vehicleCategory,
      motorBrand: motorBrand.trim(),
      motorModel: motorModel.trim(),
      engineOrSerialNo: engineOrSerialNo.trim(),
      plateNumber: plateNumber.trim().toUpperCase(),
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'pending_approval',
      qrCodeData: `https://enforcement.gov.et/verify/${newId}`,
      registeredBy: userBadgeId || 'CLERK-001',
    };

    onAddRegistration(newRegistration);
    setIsSuccess(true);

    // Reset Form after success
    setTimeout(() => {
      setIsSuccess(false);
      setCurrentStep(1);
      setFullName('');
      setPhone('');
      setMotorBrand('');
      setMotorModel('');
      setEngineOrSerialNo('');
      setPlateNumber('');
      setUserPortraitPhoto('');
      setNationalIdPhoto('');
      setDrivingLicensePhoto('');
      setDrivingPermitPhoto('');
      setIsDataConfirmed(false);
      setValidationError('');
    }, 2500);
  };

  // Current preview object
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
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-outline-variant pb-2">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px] sm:text-[24px]">app_registration</span>
            <span>{isAmharic ? 'የሞተርሳይክል ምዝገባ (Multi-Step Form)' : 'Motorcycle Registration Form'}</span>
          </h3>
        </div>

        {onOpenPreviewModal && (
          <button
            type="button"
            onClick={() => onOpenPreviewModal(previewRegistration)}
            className="self-start sm:self-auto bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 text-primary dark:text-sky-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>{isAmharic ? 'ቀጥታ መታወቂያ እይ' : 'Live ID Preview'}</span>
          </button>
        )}
      </div>

      {/* STEP INDICATOR BAR */}
      <div className="grid grid-cols-3 gap-2 !mt-1.5 !mb-1.5">
        {/* Step 1 Indicator */}
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex items-center justify-center gap-2 py-1.5 sm:py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
            currentStep === 1
              ? 'bg-primary text-white border-primary shadow-xs'
              : currentStep > 1
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-surface-container text-secondary border-outline-variant'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
            {currentStep > 1 ? '✓' : '1'}
          </span>
          <span className="truncate">{isAmharic ? '1. የሞተርና ባለቤት መረጃ' : '1. Text Details'}</span>
        </button>

        {/* Step 2 Indicator */}
        <button
          type="button"
          onClick={() => {
            if (fullName.trim()) setCurrentStep(2);
            else setValidationError(isAmharic ? 'እባክዎ መጀመሪያ የባለቤት ስም ያስገቡ!' : 'Please fill in Owner Name first!');
          }}
          className={`flex items-center justify-center gap-2 py-1.5 sm:py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
            currentStep === 2
              ? 'bg-primary text-white border-primary shadow-xs'
              : currentStep > 2
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-surface-container text-secondary border-outline-variant'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
            {currentStep > 3 ? '✓' : '2'}
          </span>
          <span className="truncate">{isAmharic ? '2. ሊብሬና ሰነዶች' : '2. File Uploads'}</span>
        </button>

        {/* Step 3 Indicator */}
        <button
          type="button"
          onClick={() => {
            if (fullName.trim()) setCurrentStep(3);
            else setValidationError(isAmharic ? 'እባክዎ መጀመሪያ የባለቤት ስም ያስገቡ!' : 'Please fill in Owner Name first!');
          }}
          className={`flex items-center justify-center gap-2 py-1.5 sm:py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
            currentStep === 3
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-surface-container text-secondary border-outline-variant'
          }`}
        >
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px]">
            3
          </span>
          <span className="truncate">{isAmharic ? '3. ማረጋገጥና መመዝገብ' : '3. Confirmation'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {isSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-600 text-[28px]">task_alt</span>
          <div>
            <p className="text-sm">{isAmharic ? 'የሞተርሳይክል ምዝገባው በስኬት ተላኳል!' : 'Motorcycle Registration Submitted Successfully!'}</p>
            <p className="text-[11px] font-normal text-emerald-700 mt-0.5">
              {isAmharic
                ? 'ምዝገባው ለአድሚን ማረጋገጫ ወደ ሲስተሙ ዳታቤዝ ተላኳል።'
                : 'Registration saved to database and pending administrator approval.'}
            </p>
          </div>
        </div>
      )}

      {/* Validation Banner */}
      {validationError && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* FORM CONTENT STEP BY STEP */}
      <form onSubmit={handleSubmitRegistration} className="space-y-5">
        {/* ================= STEP 1: TEXT INPUTS ================= */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Motor Vehicle Category Selection */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የሞተር ዓይነት እና ምድብ' : 'Motor Vehicle Category'} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-6 py-1 px-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vehicleCategoryStep1"
                    value="electric"
                    checked={vehicleCategory === 'electric'}
                    onChange={() => setVehicleCategory('electric')}
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className={`text-xs ${vehicleCategory === 'electric' ? 'font-bold text-on-surface' : 'text-secondary'}`}>
                    {isAmharic ? 'ኢቪ (Electric EV)' : 'Electric (EV)'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vehicleCategoryStep1"
                    value="gas_under_110cc"
                    checked={vehicleCategory === 'gas_under_110cc'}
                    onChange={() => setVehicleCategory('gas_under_110cc')}
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className={`text-xs ${vehicleCategory === 'gas_under_110cc' ? 'font-bold text-on-surface' : 'text-secondary'}`}>
                    {isAmharic ? 'ቤንዚን (Gasoline < 110cc)' : 'Gasoline (<110cc)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Owner Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የባለቤት ሙሉ ስም' : 'Owner Full Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fullNameError) setFullNameError('');
                    if (validationError) setValidationError('');
                  }}
                  placeholder={isAmharic ? 'ምሳሌ፡ አበበ በቀለ ደስታ' : 'e.g. Abebe Bekele Desta'}
                  className={`w-full bg-surface-container-lowest border rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none ${fullNameError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}
                />
                {fullNameError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{fullNameError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የስልክ ቁጥር' : 'Phone Number'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError('');
                    if (validationError) setValidationError('');
                  }}
                  placeholder="+251 911 000 000"
                  className={`w-full bg-surface-container-lowest border rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}
                />
                {phoneError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Motor Brand & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የሞተር ብራንድ (Brand)' : 'Motor Brand'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={motorBrand}
                  onChange={(e) => {
                    setMotorBrand(e.target.value);
                    if (motorBrandError) setMotorBrandError('');
                    if (validationError) setValidationError('');
                  }}
                  placeholder={isAmharic ? 'ምሳሌ፡ ሊፋን / ቲቪኤስ / ባጃጅ' : 'e.g. Lifan / TVS / Bajaj'}
                  className={`w-full bg-surface-container-lowest border rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none ${motorBrandError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}
                />
                {motorBrandError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{motorBrandError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የሞተር ሞዴል (Model)' : 'Motor Model'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={motorModel}
                  onChange={(e) => {
                    setMotorModel(e.target.value);
                    if (motorModelError) setMotorModelError('');
                    if (validationError) setValidationError('');
                  }}
                  placeholder={isAmharic ? 'ምሳሌ፡ 2026 EV / King' : 'e.g. 2026 EV / King'}
                  className={`w-full bg-surface-container-lowest border rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none ${motorModelError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}
                />
                {motorModelError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{motorModelError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Plate & Engine/Serial No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የሰሌዳ ቁጥር (Plate No.)' : 'Plate Number'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => {
                    setPlateNumber(e.target.value);
                    if (plateNumberError) setPlateNumberError('');
                    if (validationError) setValidationError('');
                  }}
                  placeholder="AA-2-M8841"
                  className={`w-full bg-surface-container-lowest border rounded-xl p-2.5 text-xs font-mono font-bold uppercase text-on-surface focus:ring-2 focus:ring-primary focus:outline-none ${plateNumberError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}
                />
                {plateNumberError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{plateNumberError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የሞተር/ሴሪያል ቁጥር (Engine/Chassis No.)' : 'Engine / Motor Serial No.'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={engineOrSerialNo}
                  onChange={(e) => {
                    setEngineOrSerialNo(e.target.value);
                    if (engineOrSerialNoError) setEngineOrSerialNoError('');
                    if (validationError) setValidationError('');
                  }}
                  placeholder="ENG-110-33420"
                  className={`w-full bg-surface-container-lowest border rounded-xl p-2.5 text-xs font-mono text-on-surface focus:ring-2 focus:ring-primary focus:outline-none ${engineOrSerialNoError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}
                />
                {engineOrSerialNoError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{engineOrSerialNoError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Action button to Step 2 */}
            <div className="pt-3 border-t border-outline-variant flex justify-end">
              <button
                type="button"
                onClick={handleGoToStep2}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <span>{isAmharic ? 'ቀጣይ፡ ሊብሬና ሰነዶች አታች ያድርጉ' : 'Next: Attach Libre & Documents'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: FILE UPLOADS (INCLUDING LIBRE) ================= */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">upload_file</span>
                <span>{isAmharic ? 'የፖርትሬት ፎቶ፣ መታወቂያ እና የሞተር ሊብሬ (Libre)' : 'User Portrait, ID & Vehicle Libre Photo'}</span>
              </h4>
              <span className="text-[11px] text-secondary">Step 2 of 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* User Portrait Photo */}
              <DocumentUploadInput
                label={isAmharic ? '1. የተጠቃሚው ፖርትሬት ፎቶ' : '1. User Portrait Photo'}
                photoUrl={userPortraitPhoto}
                onPhotoChange={setUserPortraitPhoto}
                isAmharic={isAmharic}
                id="multistep-portrait"
              />

              {/* National ID Scan */}
              <DocumentUploadInput
                label={isAmharic ? '2. ብሔራዊ መታወቂያ' : '2. National ID'}
                photoUrl={nationalIdPhoto}
                onPhotoChange={setNationalIdPhoto}
                isAmharic={isAmharic}
                id="multistep-natid"
              />

              {/* Driving License Scan */}
              <DocumentUploadInput
                label={isAmharic ? '3. መንጃ ፈቃድ' : '3. Driving License'}
                photoUrl={drivingLicensePhoto}
                onPhotoChange={setDrivingLicensePhoto}
                isAmharic={isAmharic}
                id="multistep-license"
              />

              {/* Vehicle Libre Scan - REPLACED PERMIT DOC WITH LIBRE */}
              <DocumentUploadInput
                label={isAmharic ? '4. የሞተር ሊብሬ (Libre Doc)' : '4. Vehicle Libre (Logbook)'}
                photoUrl={drivingPermitPhoto}
                onPhotoChange={setDrivingPermitPhoto}
                isAmharic={isAmharic}
                id="multistep-libre"
              />
            </div>

            {/* Nav buttons */}
            <div className="pt-3 border-t border-outline-variant flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="bg-surface-container hover:bg-surface-container-high text-secondary font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>{isAmharic ? 'ተመለስ፡ የሞተር መረጃ' : 'Back to Details'}</span>
              </button>

              <button
                type="button"
                onClick={handleGoToStep3}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <span>{isAmharic ? 'ቀጣይ፡ መረጃውን ያረጋግጡ' : 'Next: Review & Confirm'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CONFIRMATION AGREEMENT & REGISTER ================= */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
                <span>{isAmharic ? 'የመረጃ ትክክለኛነት ማረጋገጫና ምዝገባ' : 'Data Correctness Review & Registration'}</span>
              </h4>
              <span className="text-[11px] text-secondary">Step 3 of 3</span>
            </div>

            {/* Summary Review Card */}
            <div className="bg-surface-container/50 border border-outline-variant/80 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-on-surface border-b border-outline-variant/60 pb-2 flex items-center justify-between">
                <span>{isAmharic ? 'የተሞላው መረጃ ማጠቃለያ:' : 'Summary of Registration Details:'}</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-primary hover:underline text-[11px] font-semibold"
                >
                  {isAmharic ? 'አስተካክል (Edit)' : 'Edit Text Details'}
                </button>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'የባለቤት ስም:' : 'Owner Name:'}</span>
                  <span className="font-bold text-on-surface">{fullName || '-'}</span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'ስልክ ቁጥር:' : 'Phone:'}</span>
                  <span className="font-bold text-on-surface">{phone || '-'}</span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'የሞተር ዓይነት:' : 'Category:'}</span>
                  <span className="font-bold text-primary uppercase">{vehicleCategory}</span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'ብራንድ/ሞዴል:' : 'Brand/Model:'}</span>
                  <span className="font-bold text-on-surface">{motorBrand || '-'} {motorModel}</span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'የሰሌዳ ቁጥር:' : 'Plate No:'}</span>
                  <span className="font-mono font-bold text-on-surface">{plateNumber || 'AA-2-M...'}</span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'የሞተር/ሴሪያል No:' : 'Serial No:'}</span>
                  <span className="font-mono text-on-surface text-[11px]">{engineOrSerialNo || '-'}</span>
                </div>
              </div>

              {/* Uploaded Documents Thumbnails */}
              <div className="pt-2 border-t border-outline-variant/60">
                <span className="text-secondary text-[11px] block mb-2 font-bold">{isAmharic ? 'የተያያዙ ሰነዶች (የሞተር ሊብሬን ጨምሮ):' : 'Attached Documents (Including Libre):'}</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-surface p-2 rounded-lg border border-outline-variant flex items-center gap-2">
                    {userPortraitPhoto ? (
                      <img src={userPortraitPhoto} alt="Portrait" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-[20px]">person</span>
                    )}
                    <span className="truncate">{isAmharic ? 'ፖርትሬት' : 'Portrait'}</span>
                  </div>

                  <div className="bg-surface p-2 rounded-lg border border-outline-variant flex items-center gap-2">
                    {nationalIdPhoto ? (
                      <img src={nationalIdPhoto} alt="ID" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
                    )}
                    <span className="truncate">{isAmharic ? 'መታወቂያ' : 'Nat. ID'}</span>
                  </div>

                  <div className="bg-surface p-2 rounded-lg border border-outline-variant flex items-center gap-2">
                    {drivingLicensePhoto ? (
                      <img src={drivingLicensePhoto} alt="License" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-[20px]">card_membership</span>
                    )}
                    <span className="truncate">{isAmharic ? 'መንጃ ፈቃድ' : 'License'}</span>
                  </div>

                  <div className="bg-surface p-2 rounded-lg border border-outline-variant flex items-center gap-2">
                    {drivingPermitPhoto ? (
                      <img src={drivingPermitPhoto} alt="Libre" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-[20px]">menu_book</span>
                    )}
                    <span className="font-bold text-primary truncate">{isAmharic ? 'የሞተር ሊብሬ' : 'Libre Doc'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MANDATORY CONFIRMATION AGREEMENT CHECKBOX */}
            <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-3.5 rounded-xl space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDataConfirmed}
                  onChange={(e) => {
                    setIsDataConfirmed(e.target.checked);
                    if (e.target.checked && validationError) setValidationError('');
                  }}
                  className="w-5 h-5 text-primary rounded focus:ring-primary accent-primary mt-0.5 cursor-pointer"
                />
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-amber-950 dark:text-amber-200 block">
                    {isAmharic
                      ? 'የመረጃ እና የሰነድ ትክክለኛነት ማረጋገጫ ውል (Agreement Confirmation) *'
                      : 'Data Correctness & Legal Validity Agreement *'}
                  </span>
                  <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-relaxed">
                    {isAmharic
                      ? 'እኔ ከላይ ስሜ የተጠቀሰው መዝጋቢ/ባለቤት፣ ያስገባሁት መረጃ እና ያያያዝኩት የሞተር ሊብሬ (Libre) ሰነድ ሙሉ በሙሉ እውነተኛና ህጋዊ መሆኑን አረጋግጣለሁ። ሐሰተኛ መረጃ ወይም የተጭበረበረ ሊብሬ ማቅረብ በህግ ያስጠይቃል።'
                      : 'I hereby confirm that all entered details and attached vehicle Libre document are accurate, genuine, and legally valid. Providing false information or forged Libre documentation is strictly punishable by law.'}
                  </p>
                </div>
              </label>
            </div>

            {/* Submit Action buttons */}
            <div className="pt-3 border-t border-outline-variant flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="bg-surface-container hover:bg-surface-container-high text-secondary font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>{isAmharic ? 'ተመለስ፡ ሰነዶች' : 'Back to Uploads'}</span>
              </button>

              <button
                type="submit"
                disabled={!isDataConfirmed}
                className={`py-3 px-6 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                  isDataConfirmed
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                <span>{isAmharic ? 'ምዝገባውን ለአድሚን ላክ' : 'Submit Registration'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
