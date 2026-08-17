import React, { useState } from 'react';
import { MotorcycleRegistration, Language, VehicleCategory } from '../types';
import { DocumentUploadInput } from './DocumentUploadInput';
import { SectionCard, DataField } from './ui/StreamlinedUI';

import {
  validateFullName,
  validatePhone,
  validatePlateNumber,
  validateEngineOrSerial,
  validateRequiredText,
} from '../utils/validation';

const BAHIR_DAR_SUBCITIES = [
  { en: 'Belay Zeleke', am: 'በላይ ዘለቀ' },
  { en: 'Atse Tewodros', am: 'አፄ ቴዎድሮስ' },
  { en: 'Dagmawi Minilik', am: 'ዳግማዊ ሚኒሊክ' },
  { en: 'Fasilo', am: 'ፋሲሎ' },
  { en: 'Hagre Selam', am: 'ሀገረ ሰላም' },
  { en: 'Shume Abo', am: 'ሹሜ አቦ' },
  { en: 'Tana', am: 'ጣና' },
  { en: 'Gish Abay', am: 'ግሽ ዓባይ' },
  { en: 'Sefene Selam', am: 'ሰፈነ ሰላም' }
];

interface MultiStepRegistrationFormProps {
  lang: Language;
  onAddRegistration: (
    newReg: MotorcycleRegistration,
    options?: { forceLocalOnly?: boolean }
  ) => Promise<{ success: boolean; isOfflineFallback?: boolean; error?: string }> | any;
  onViewRegistered?: () => void;
  userBadgeId: string;
}

export const MultiStepRegistrationForm: React.FC<MultiStepRegistrationFormProps> = ({
  lang,
  onAddRegistration,
  onViewRegistered,
  userBadgeId,
}) => {
  const isAmharic = lang === 'am';

  // Step state: 1 = Text Inputs, 2 = File Uploads, 3 = Confirmation Agreement & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneSuffix, setPhoneSuffix] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('electric');
  const [motorBrand, setMotorBrand] = useState('');
  const [motorModel, setMotorModel] = useState('');
  const [engineOrSerialNo, setEngineOrSerialNo] = useState('N/A');
  const [plateNumber, setPlateNumber] = useState('');
  const [subCity, setSubCity] = useState('Belay Zeleke');

  // Photos (Step 2)
  const [userPortraitPhoto, setUserPortraitPhoto] = useState('');
  const [nationalIdPhoto, setNationalIdPhoto] = useState('');
  const [nationalIdBackPhoto, setNationalIdBackPhoto] = useState('');
  const [drivingLicensePhoto, setDrivingLicensePhoto] = useState('');
  const [drivingPermitPhoto, setDrivingPermitPhoto] = useState(''); // Libre Photo

  // Submission & Offline Modal States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOfflineConfirmModal, setShowOfflineConfirmModal] = useState(false);
  const [offlineErrorMsg, setOfflineErrorMsg] = useState('');
  const [pendingReg, setPendingReg] = useState<MotorcycleRegistration | null>(null);

  // Success view state (hides form fields when true)
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const [lastSubmittedReg, setLastSubmittedReg] = useState<MotorcycleRegistration | null>(null);
  const [isStoredLocally, setIsStoredLocally] = useState(false);

  // Automatically autofill plate number for electric vehicles and make it read-only
  React.useEffect(() => {
    if (vehicleCategory === 'electric') {
      setPlateNumber('Electric');
    } else {
      if (plateNumber === 'Electric') {
        setPlateNumber('');
      }
    }
  }, [vehicleCategory]);

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

  const handlePhoneSuffixChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 9) {
      setPhoneSuffix(cleaned);
      const fullPhone = cleaned ? `+251${cleaned}` : '';
      setPhone(fullPhone);
      
      if (cleaned.length > 0) {
        const phoneVal = validatePhone(fullPhone, isAmharic);
        if (!phoneVal.isValid) {
          setPhoneError(phoneVal.message);
        } else {
          setPhoneError('');
        }
      } else {
        setPhoneError(isAmharic ? 'እባክዎ ስልክ ቁጥር ያስገቡ!' : 'Please enter Phone Number!');
      }
      if (validationError) setValidationError('');
    }
  };

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
      setValidationError(isAmharic ? 'እባክዎ ብሔራዊ መታወቂያ (የፊት ገጽ) አታች ያድርጉ!' : 'Please upload National ID (Front) photo!');
      return;
    }
    if (!nationalIdBackPhoto) {
      setValidationError(isAmharic ? 'እባክዎ ብሔራዊ መታወቂያ (የጀርባ ገጽ) አታች ያድርጉ!' : 'Please upload National ID (Back) photo!');
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
  const handleSubmitRegistration = async (e: React.FormEvent) => {
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
      nationalIdBackPhoto,
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
      subCity,
    };

    setIsSubmitting(true);
    setValidationError('');

    try {
      const res = await onAddRegistration(newRegistration);
      setIsSubmitting(false);

      if (res && res.success === false) {
        // Online database save was unsuccessful! Show confirmation modal to store locally.
        setPendingReg(newRegistration);
        setOfflineErrorMsg(
          res.error ||
            (isAmharic
              ? 'የኦንላይን ዳታቤዝ ግንኙነት ወይም የኮታ ገደብ አጋጥሟል።'
              : 'Online database save failed.')
        );
        setShowOfflineConfirmModal(true);
      } else {
        // Successful save
        setLastSubmittedReg(newRegistration);
        setIsStoredLocally(!!(res && res.isOfflineFallback));
        setIsSubmittedSuccessfully(true);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setPendingReg(newRegistration);
      setOfflineErrorMsg(
        err?.message ||
          (isAmharic
            ? 'የኦንላይን ዳታቤዝ ግንኙነት አልተሳካም።'
            : 'Online database connection error.')
      );
      setShowOfflineConfirmModal(true);
    }
  };

  // User confirmed "Store Locally" in the offline confirmation modal
  const handleConfirmLocalSave = async () => {
    if (!pendingReg) return;
    setIsSubmitting(true);
    try {
      await onAddRegistration(pendingReg, { forceLocalOnly: true });
      setShowOfflineConfirmModal(false);
      setLastSubmittedReg(pendingReg);
      setIsStoredLocally(true);
      setIsSubmittedSuccessfully(true);
    } catch (err) {
      console.error('Error storing locally:', err);
    } finally {
      setIsSubmitting(false);
      setPendingReg(null);
    }
  };

  // Reset form to register another vehicle ("Register New" button)
  const handleRegisterNew = () => {
    setIsSubmittedSuccessfully(false);
    setLastSubmittedReg(null);
    setIsStoredLocally(false);
    setCurrentStep(1);
    setFullName('');
    setPhone('');
    setPhoneSuffix('');
    setMotorBrand('');
    setMotorModel('');
    setEngineOrSerialNo('N/A');
    setPlateNumber('');
    setSubCity('Belay Zeleke');
    setUserPortraitPhoto('');
    setNationalIdPhoto('');
    setNationalIdBackPhoto('');
    setDrivingLicensePhoto('');
    setDrivingPermitPhoto('');
    setIsDataConfirmed(false);
    setValidationError('');
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* OFFLINE / UNSUCCESSFUL ONLINE SAVE CONFIRMATION MODAL */}
      {showOfflineConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-surface border border-outline-variant rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 border-b border-outline-variant pb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">cloud_off</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-surface">
                  {isAmharic ? 'የኦንላይን ዳታቤዝ ማስቀመጥ አልተሳካም' : 'Online Storage Unsuccessful'}
                </h4>
                <p className="text-[11px] text-secondary">
                  {isAmharic ? 'የኮታ ወይም የመረብ ግንኙነት ችግር አጋጥሟል' : 'Cloud connection or quota limit encountered'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-secondary">
              <p>
                {isAmharic
                  ? 'ተሽከርካሪውን በኦንላይን ፋየርቤዝ ዳታቤዝ ላይ ማስቀመጥ አልተሳካም።'
                  : 'Saving the vehicle registration to the online cloud database was unsuccessful.'}
              </p>
              {offlineErrorMsg && (
                <div className="p-2.5 rounded-lg bg-surface-container border border-outline-variant text-[11px] font-mono text-amber-800 dark:text-amber-300">
                  {offlineErrorMsg}
                </div>
              )}
              <p className="font-bold text-on-surface pt-1">
                {isAmharic
                  ? 'መረጃው እንዳይጠፋ በብራውዘርዎ ሎካል ካሽ (Local Cache) ውስጥ ማስቀመጥ ይፈልጋሉ?'
                  : 'Would you like to store this registration locally in browser cache so no data is lost?'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setShowOfflineConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-secondary bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                {isAmharic ? 'ሰርዝ / ድጋሚ ሞክር' : 'Cancel / Retry'}
              </button>
              <button
                type="button"
                onClick={handleConfirmLocalSave}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>
                  {isSubmitting
                    ? isAmharic
                      ? 'በማስቀመጥ ላይ...'
                      : 'Storing...'
                    : isAmharic
                    ? 'በሎካል ሴቭ አድርግ (Store Locally)'
                    : 'Store Locally'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-outline-variant pb-2">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px] sm:text-[24px]">
              {isSubmittedSuccessfully ? 'task_alt' : 'app_registration'}
            </span>
            <span>
              {isSubmittedSuccessfully
                ? isAmharic
                  ? 'የተሳካ የተሽከርካሪ ምዝገባ'
                  : 'Registration Confirmation'
                : isAmharic
                ? 'የሞተርሳይክል ምዝገባ (Multi-Step Form)'
                : 'Motorcycle Registration Form'}
            </span>
          </h3>
        </div>
      </div>

      {/* RENDER SUCCESS VIEW WHEN SUBMITTED SUCCESSFULLY (FORM FIELDS HIDDEN) */}
      {isSubmittedSuccessfully ? (
        <div className="py-6 px-4 space-y-6 text-center animate-fadeIn">
          {/* Success Animated Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[38px] animate-bounce">check_circle</span>
          </div>

          {/* Heading & Storage Badge */}
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-extrabold text-lg sm:text-xl text-on-surface">
              {isAmharic ? 'የሞተርሳይክል ምዝገባ በስኬት ተጠናቋል!' : 'Registration Successful!'}
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              {isAmharic
                ? 'የተሽከርካሪው መረጃ በስኬት ተመዝግቧል። ለአድሚን ማረጋገጫ እና ለ QR ህትመት በሲስተሙ ተዘጋጅቷል።'
                : 'The vehicle details have been submitted and prepared for approval and QR badge generation.'}
            </p>

            <div className="pt-2 flex items-center justify-center gap-2">
              {isStoredLocally ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <span className="material-symbols-outlined text-[14px]">cloud_off</span>
                  <span>{isAmharic ? 'በሎካል ካሽ ተቀምጧል (Offline Cache)' : 'Saved Locally in Cache'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                  <span>{isAmharic ? 'በፋየርቤዝ ዳታቤዝ ተቀምጧል (Cloud Firestore)' : 'Stored in Cloud Firestore'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Vehicle Summary Card */}
          {lastSubmittedReg && (
            <div className="max-w-lg mx-auto bg-surface border border-outline-variant rounded-xl p-4 text-left space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  {isAmharic ? 'የተመዘገበው ተሽከርካሪ ማጠቃለያ' : 'Registered Vehicle Details'}
                </span>
                <span className="text-xs font-mono font-bold text-primary">{lastSubmittedReg.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'የባለቤት ስም:' : 'Owner Name:'}</span>
                  <span className="font-bold text-on-surface">{lastSubmittedReg.fullName}</span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'ስልክ ቁጥር:' : 'Phone:'}</span>
                  <span className="font-mono text-on-surface">{lastSubmittedReg.phone}</span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'የሰሌዳ ቁጥር:' : 'Plate No:'}</span>
                  <span className="font-mono font-bold text-primary">{lastSubmittedReg.plateNumber}</span>
                </div>
                <div>
                  <span className="text-secondary text-[11px] block">{isAmharic ? 'ምድብ:' : 'Category:'}</span>
                  <span className="capitalize font-bold text-on-surface">{lastSubmittedReg.vehicleCategory}</span>
                </div>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS: REGISTER NEW & VIEW REGISTERED */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <button
              type="button"
              onClick={handleRegisterNew}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{isAmharic ? 'አዲስ መዝግብ (Register New)' : 'Register New'}</span>
            </button>

            {onViewRegistered && (
              <button
                type="button"
                onClick={onViewRegistered}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant text-xs font-bold cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">table_view</span>
                <span>{isAmharic ? 'የተመዘገቡትን ይመልከቱ (View Registered)' : 'View Registered'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የባለቤት ሙሉ ስም' : 'Owner Full Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFullName(val);
                    if (val.trim()) {
                      const valRes = validateFullName(val, isAmharic);
                      if (!valRes.isValid) {
                        setFullNameError(valRes.message);
                      } else {
                        setFullNameError('');
                      }
                    } else {
                      setFullNameError(isAmharic ? 'እባክዎ የባለቤት ሙሉ ስም ያስገቡ!' : 'Please enter Owner Full Name!');
                    }
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
                <div className={`flex rounded-xl overflow-hidden border bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary focus-within:outline-none ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}>
                  <span className="bg-surface-container/40 text-secondary text-xs px-3 py-2.5 font-bold flex items-center border-r border-outline-variant/60 select-none">
                    +251
                  </span>
                  <input
                    type="text"
                    value={phoneSuffix}
                    onChange={(e) => handlePhoneSuffixChange(e.target.value)}
                    placeholder="911223344"
                    maxLength={9}
                    className="w-full bg-transparent p-2.5 text-xs text-on-surface focus:outline-none"
                  />
                </div>
                {phoneError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{phoneError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'ክፍለ ከተማ (ባህር ዳር)' : 'Sub-City (Bahir Dar)'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={subCity}
                  onChange={(e) => setSubCity(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {BAHIR_DAR_SUBCITIES.map((sc) => (
                    <option key={sc.en} value={sc.en}>
                      {isAmharic ? sc.am : sc.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Motor Brand & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የሞተር ብራንድ (Brand)' : 'Motor Brand'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={motorBrand}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMotorBrand(val);
                    if (val.trim()) {
                      const brandVal = validateRequiredText(val, isAmharic ? 'የሞተር ብራንድ' : 'Motor Brand', isAmharic, 2);
                      if (!brandVal.isValid) {
                        setMotorBrandError(brandVal.message);
                      } else {
                        setMotorBrandError('');
                      }
                    } else {
                      setMotorBrandError(isAmharic ? 'እባክዎ የሞተር ብራንድ ያስገቡ!' : 'Please enter Motor Brand!');
                    }
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
                    const val = e.target.value;
                    setMotorModel(val);
                    if (val.trim()) {
                      const modelVal = validateRequiredText(val, isAmharic ? 'የሞተር ሞዴል' : 'Motor Model', isAmharic, 1);
                      if (!modelVal.isValid) {
                        setMotorModelError(modelVal.message);
                      } else {
                        setMotorModelError('');
                      }
                    } else {
                      setMotorModelError(isAmharic ? 'እባክዎ የሞተር ሞዴል ያስገቡ!' : 'Please enter Motor Model!');
                    }
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

            {/* Plate Number (No Chassis Number Input) */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የሰሌዳ ቁጥር (Plate No.)' : 'Plate Number'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={vehicleCategory === 'electric'}
                  value={plateNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlateNumber(val);
                    if (val.trim() && vehicleCategory !== 'electric') {
                      const plateVal = validatePlateNumber(val, isAmharic);
                      if (!plateVal.isValid) {
                        setPlateNumberError(plateVal.message);
                      } else {
                        setPlateNumberError('');
                      }
                    } else if (vehicleCategory !== 'electric') {
                      setPlateNumberError(isAmharic ? 'እባክዎ የሰሌዳ ቁጥር ያስገቡ!' : 'Please enter Plate Number!');
                    } else {
                      setPlateNumberError('');
                    }
                    if (validationError) setValidationError('');
                  }}
                  placeholder={vehicleCategory === 'electric' ? 'Electric' : 'e.g. AM-2-A1234'}
                  className={`w-full bg-surface-container-lowest border rounded-xl p-2.5 text-xs font-mono font-bold uppercase text-on-surface focus:ring-2 focus:ring-primary focus:outline-none ${
                    vehicleCategory === 'electric' ? 'bg-surface-container/40 text-secondary cursor-not-allowed border-dashed' : ''
                  } ${plateNumberError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'}`}
                />
                {plateNumberError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    <span>{plateNumberError}</span>
                  </p>
                )}
                {vehicleCategory === 'electric' && (
                  <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    <span>
                      {isAmharic
                        ? 'ኢቪ ተሽከርካሪ ስለተመረጠ የሰሌዳ ቁጥሩ "Electric" ተብሎ በራስ-ሰር ተሞልቷል።'
                        : 'EV category selected. Plate number is automatically set to "Electric" and locked.'}
                    </span>
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
                <span>{isAmharic ? 'የባለቤት ፎቶ፣ መታወቂያ እና ሊብሬ ሰነዶች' : 'Owner Portrait, ID & Vehicle Libre Photos'}</span>
              </h4>
              <span className="text-[11px] text-secondary">Step 2 of 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* User Portrait Photo */}
              <DocumentUploadInput
                label={isAmharic ? '1. የተጠቃሚው ፖርትሬት ፎቶ' : '1. User Portrait Photo'}
                photoUrl={userPortraitPhoto}
                onPhotoChange={setUserPortraitPhoto}
                isAmharic={isAmharic}
                id="multistep-portrait"
              />

              {/* National ID Front & Back side-by-side */}
              <div className="sm:col-span-2 grid grid-cols-2 gap-3 border border-outline-variant/60 rounded-2xl p-3.5 bg-surface-container/15">
                <DocumentUploadInput
                  label={isAmharic ? '2. ብሔራዊ መታወቂያ (የፊት ገጽ)' : '2. National ID (Front)'}
                  photoUrl={nationalIdPhoto}
                  onPhotoChange={setNationalIdPhoto}
                  isAmharic={isAmharic}
                  id="multistep-natid-front"
                />
                <DocumentUploadInput
                  label={isAmharic ? '3. ብሔራዊ መታወቂያ (የጀርባ ገጽ)' : '3. National ID (Back)'}
                  photoUrl={nationalIdBackPhoto}
                  onPhotoChange={setNationalIdBackPhoto}
                  isAmharic={isAmharic}
                  id="multistep-natid-back"
                />
              </div>

              {/* Driving License Scan */}
              <DocumentUploadInput
                label={isAmharic ? '4. መንጃ ፈቃድ' : '4. Driving License'}
                photoUrl={drivingLicensePhoto}
                onPhotoChange={setDrivingLicensePhoto}
                isAmharic={isAmharic}
                id="multistep-license"
              />

              {/* Vehicle Libre Scan - REPLACED PERMIT DOC WITH LIBRE */}
              <DocumentUploadInput
                label={isAmharic ? '5. የሞተር ሊብሬ (Libre Doc)' : '5. Vehicle Libre (Logbook)'}
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
            <SectionCard className="space-y-3">
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <DataField label={isAmharic ? 'የባለቤት ስም:' : 'Owner Name:'} value={fullName || '-'} />
                <DataField label={isAmharic ? 'ስልክ ቁጥር:' : 'Phone:'} value={phone || '-'} isMono />
                <DataField label={isAmharic ? 'ክፍለ ከተማ:' : 'Sub-City:'} value={subCity} isPrimary />
                <DataField label={isAmharic ? 'የሞተር ዓይነት:' : 'Category:'} value={vehicleCategory} isPrimary />
                <DataField label={isAmharic ? 'ብራንድ/ሞዴል:' : 'Brand/Model:'} value={`${motorBrand || '-'} ${motorModel}`} />
                <DataField label={isAmharic ? 'የሰሌዳ ቁጥር:' : 'Plate No:'} value={plateNumber || 'AA-2-M...'} isMono isPrimary />
              </div>

              {/* Uploaded Documents Thumbnails */}
              <div className="pt-2 border-t border-outline-variant/60">
                <span className="text-secondary text-[11px] block mb-2 font-bold">{isAmharic ? 'የተያያዙ ሰነዶች (የሞተር ሊብሬን ጨምሮ):' : 'Attached Documents (Including Libre):'}</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
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
                      <img src={nationalIdPhoto} alt="ID Front" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
                    )}
                    <span className="truncate">{isAmharic ? 'መታወቂያ (ፊት)' : 'ID Front'}</span>
                  </div>

                  <div className="bg-surface p-2 rounded-lg border border-outline-variant flex items-center gap-2">
                    {nationalIdBackPhoto ? (
                      <img src={nationalIdBackPhoto} alt="ID Back" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
                    )}
                    <span className="truncate">{isAmharic ? 'መታወቂያ (ጀርባ)' : 'ID Back'}</span>
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
            </SectionCard>

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
    </>
  )}
</div>
);
};
