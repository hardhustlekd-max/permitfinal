import React, { useState, useEffect } from 'react';
import { Language, UserRole } from '../types';
import { subscribeSettings, saveSettingsToDb, resetAllSystemData, DEFAULT_SETTINGS } from '../services/dbService';
import { validateFullName, validateRequiredText } from '../utils/validation';

interface SettingsPageProps {
  lang: Language;
  userRole: UserRole;
  userBadgeId: string;
  currentTheme?: 'light' | 'dark';
  onToggleLang?: () => void;
  onToggleTheme?: () => void;
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  lang,
  userRole,
  userBadgeId,
  currentTheme = 'light',
  onToggleLang,
  onToggleTheme,
  onLogout,
}) => {
  const isAmharic = lang === 'am';

  // State for settings initialized with defaults and updated via live Firestore
  const [settings, setSettingsState] = useState(() => DEFAULT_SETTINGS);

  const [officerName, setOfficerName] = useState(settings.officerName);
  const [department, setDepartment] = useState(settings.department);
  const [subCityOffice, setSubCityOffice] = useState(settings.subCityOffice);
  const [defaultPrinter, setDefaultPrinter] = useState(settings.defaultPrinter);
  const [cardStockType, setCardStockType] = useState(settings.cardStockType);
  const [calendarSystem, setCalendarSystem] = useState<'ethiopian' | 'gregorian'>(settings.calendarSystem);
  const [autoPrintQR, setAutoPrintQR] = useState(settings.autoPrintQR);
  const [emailAlerts, setEmailAlerts] = useState(settings.emailAlerts);
  const [security2FA, setSecurity2FA] = useState(settings.security2FA);
  const [highRiskAlerts, setHighRiskAlerts] = useState(settings.highRiskAlerts);


  useEffect(() => {
    const unsubscribe = subscribeSettings((dbSettings) => {
      setSettingsState(dbSettings);
      setOfficerName(dbSettings.officerName || '');
      setDepartment(dbSettings.department || '');
      setSubCityOffice(dbSettings.subCityOffice || '');
      setDefaultPrinter(dbSettings.defaultPrinter || '');
      setCardStockType(dbSettings.cardStockType || '');
      setCalendarSystem(dbSettings.calendarSystem || 'ethiopian');
      setAutoPrintQR(Boolean(dbSettings.autoPrintQR));
      setEmailAlerts(Boolean(dbSettings.emailAlerts));
      setSecurity2FA(Boolean(dbSettings.security2FA));
      setHighRiskAlerts(Boolean(dbSettings.highRiskAlerts));
    });
    return () => unsubscribe();
  }, []);

  // Save Feedback state
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Form Field Validation Errors
  const [officerNameError, setOfficerNameError] = useState('');
  const [departmentError, setDepartmentError] = useState('');
  const [subCityOfficeError, setSubCityOfficeError] = useState('');

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerNameError('');
    setDepartmentError('');
    setSubCityOfficeError('');

    let hasErrors = false;

    // Validate Officer Full Name
    const nameVal = validateFullName(officerName, isAmharic);
    if (!nameVal.isValid) {
      setOfficerNameError(nameVal.message);
      hasErrors = true;
    }

    // Validate Department / Agency
    const deptVal = validateRequiredText(department, isAmharic ? 'የስራ ክፍል / ኤጀንሲ' : 'Department', isAmharic, 2);
    if (!deptVal.isValid) {
      setDepartmentError(deptVal.message);
      hasErrors = true;
    }

    // Validate Sub City Office
    const officeVal = validateRequiredText(subCityOffice, isAmharic ? 'የመደብ ክፍለ ከተማ / ቢሮ' : 'Sub-City Jurisdiction Office', isAmharic, 2);
    if (!officeVal.isValid) {
      setSubCityOfficeError(officeVal.message);
      hasErrors = true;
    }

    if (hasErrors) return;

    const updatedSettings = {
      officerName,
      department,
      subCityOffice,
      defaultPrinter,
      cardStockType,
      calendarSystem,
      autoPrintQR,
      emailAlerts,
      security2FA,
      highRiskAlerts,
    };
    await saveSettingsToDb(updatedSettings);
    setSettingsState(updatedSettings);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      userBadgeId,
      userRole,
      department,
      subCityOffice,
      systemVersion: 'Enforcement Pro v2.6.4',
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = async () => {
    if (window.confirm(isAmharic ? "እርግጠኛ ነዎት ሁሉንም መረጃዎች ማጥፋት ይፈልጋሉ? ይህ ተግባር ወደ ኋላ አይመለስም!" : "Are you sure you want to reset all system data? This action cannot be undone!")) {
      setIsResetting(true);
      try {
        await resetAllSystemData();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3500);
      } catch (error) {
        console.error("Failed to reset data", error);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-surface-container-lowest border border-outline-variant p-3.5 sm:p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shrink-0">
            <span className="material-symbols-outlined text-[28px]">settings</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-on-surface tracking-tight">
              {isAmharic ? 'የሲስተም እና የተጠቃሚ ማስተካከያ' : 'System & Account Settings'}
            </h2>
            <p className="text-xs text-secondary font-medium mt-0.5">
              {isAmharic
                ? 'የግል መለያ፣ የህትመት መሳሪያዎች እና የህግ ማስከበር ቅንብሮች'
                : 'Manage profile credentials, permit printer devices, and security protocols'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            {isAmharic ? 'ቀጥታ ግንኙነት ተረጋግጧል' : 'System Online'}
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <p className="text-xs font-bold">
              {isAmharic
                ? 'ማስተካከያው በተሳካ ሁኔታ ተቀምጧል!'
                : 'Settings saved successfully! System preferences updated.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccess(false)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Reset Notification Alert */}
      {resetSuccess && (
        <div className="bg-amber-50 border border-amber-300 text-amber-950 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-600">warning</span>
            <p className="text-xs font-bold">
              {isAmharic
                ? 'ሁሉም የስርዓት መረጃ በተሳካ ሁኔታ ተሰርዟል!'
                : 'All system data has been successfully reset!'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResetSuccess(false)}
            className="text-amber-700 hover:text-amber-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-4">
        
        {/* Section 1: Account & Profile Information */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
            <h3 className="font-bold text-base text-on-surface">
              {isAmharic ? '1. የተጠቃሚ መለያ እና መገለጫ (User Profile)' : '1. User Profile & Official Credentials'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የባጅ መለያ ቁጥር (Badge ID):' : 'Official Badge ID:'}
              </label>
              <input
                type="text"
                value={userBadgeId || 'CLK-2026-9041'}
                disabled
                className="w-full bg-surface-container px-3.5 py-2.5 rounded-xl border border-outline-variant text-xs font-mono font-bold text-on-surface opacity-80 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የስራ ድርሻ (Assigned Role):' : 'Assigned Role:'}
              </label>
              <input
                type="text"
                value={(userRole || '').toUpperCase().replace('_', ' ')}
                disabled
                className="w-full bg-sky-50 border border-sky-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-sky-950 uppercase cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የሰራተኛው ሙሉ ስም:' : 'Officer Full Name:'}
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => {
                  setOfficerName(e.target.value);
                  if (officerNameError) setOfficerNameError('');
                }}
                className={`w-full bg-surface px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-on-surface outline-hidden focus:border-primary ${
                  officerNameError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'
                }`}
              />
              {officerNameError && (
                <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">error</span>
                  <span>{officerNameError}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የስራ ክፍል / ኤጀንሲ:' : 'Department / Agency:'}
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  if (departmentError) setDepartmentError('');
                }}
                className={`w-full bg-surface px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-on-surface outline-hidden focus:border-primary ${
                  departmentError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'
                }`}
              />
              {departmentError && (
                <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">error</span>
                  <span>{departmentError}</span>
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የመደብ ክፍለ ከተማ / ቢሮ:' : 'Sub-City Jurisdiction Office:'}
              </label>
              <input
                type="text"
                value={subCityOffice}
                onChange={(e) => {
                  setSubCityOffice(e.target.value);
                  if (subCityOfficeError) setSubCityOfficeError('');
                }}
                className={`w-full bg-surface px-3.5 py-2.5 rounded-xl border text-xs font-semibold text-on-surface outline-hidden focus:border-primary ${
                  subCityOfficeError ? 'border-red-500 ring-1 ring-red-500' : 'border-outline-variant'
                }`}
              />
              {subCityOfficeError && (
                <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">error</span>
                  <span>{subCityOfficeError}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Permit Printer & Hardware Integration */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-[22px]">print</span>
            <h3 className="font-bold text-base text-on-surface">
              {isAmharic ? '2. የካርድ ህትመት እና ማሽን ቅንብር (Printer Setup)' : '2. Permit Card Printer & Hardware Setup'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የተመረጠው የፒቪሲ ካርድ ማተሚያ:' : 'Default PVC Card Printer Device:'}
              </label>
              <select
                value={defaultPrinter}
                onChange={(e) => setDefaultPrinter(e.target.value)}
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', background: 'transparent' }} className="w-full bg-surface px-3.5 py-2.5 pr-8 rounded-xl border border-outline-variant focus:border-primary text-xs font-semibold text-on-surface outline-hidden appearance-none cursor-pointer"
              >
                <option value="Zebra ZD621 Industrial PVC Card Printer">Zebra ZD621 Industrial PVC Card Printer</option>
                <option value="Epson WorkForce Pro Direct Card Jet">Epson WorkForce Pro Direct Card Jet</option>
                <option value="Fargo HDP5000 High Definition Printer">Fargo HDP5000 High Definition Printer</option>
                <option value="Evolis Primacy 2 Dual-Sided ID Printer">Evolis Primacy 2 Dual-Sided ID Printer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የካርድ መጠንና አይነት:' : 'Permit Card Stock Dimension:'}
              </label>
              <select
                value={cardStockType}
                onChange={(e) => setCardStockType(e.target.value)}
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', background: 'transparent' }} className="w-full bg-surface px-3.5 py-2.5 pr-8 rounded-xl border border-outline-variant focus:border-primary text-xs font-semibold text-on-surface outline-hidden appearance-none cursor-pointer"
              >
                <option value="CR80 Standard PVC Card (85.6 x 54 mm)">CR80 Standard PVC Card (85.6 x 54 mm)</option>
                <option value="CR80 UltraHigh Security Hologram PVC">CR80 UltraHigh Security Hologram PVC</option>
                <option value="CR100 Oversized Movement Badge (98.5 x 67 mm)">CR100 Oversized Movement Badge</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between p-3.5 bg-surface-container/50 border border-outline-variant rounded-xl">
              <div>
                <p className="text-xs font-bold text-on-surface">
                  {isAmharic ? 'የኪው አር ኮድ ስቲከር አውቶማቲክ ህትመት' : 'Auto-Print Matching QR Code Sticker'}
                </p>
                <p className="text-[11px] text-secondary">
                  {isAmharic
                    ? 'ካርዱ ሲታተም አብሮ የሞተርሳይክሉን ስቲከር ወዲያውኑ ያዘጋጃል'
                    : 'Automatically queue matching motorcycle frame sticker when issuing permit'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintQR}
                onChange={(e) => setAutoPrintQR(e.target.checked)}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Regional & Appearance Preferences */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-[22px]">palette</span>
            <h3 className="font-bold text-base text-on-surface">
              {isAmharic ? '3. የቋንቋ፣ የገጽታ እና የቀን አቆጣጠር ማስተካከያ' : '3. Appearance, Language & Regional Setup'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark / Light Theme Toggle Switch */}
            {onToggleTheme && (
              <div className="sm:col-span-2 flex items-center justify-between p-3.5 bg-surface-container/50 border border-outline-variant rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[22px]">
                      {currentTheme === 'dark' ? 'dark_mode' : 'light_mode'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">
                      {isAmharic ? 'የገጽታ ቀለም (Dark Mode Theme)' : 'Dark Mode UI Theme'}
                    </p>
                    <p className="text-[11px] text-secondary">
                      {isAmharic
                        ? 'ለአይኖች ምቹ የሆነ የጨለማ ገጽታ ማብሪያ/ማጥፊያ'
                        : 'Switch between light and high-contrast dark theme modes'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    currentTheme === 'dark' ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                      currentTheme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-slate-800">
                      {currentTheme === 'dark' ? 'dark_mode' : 'light_mode'}
                    </span>
                  </span>
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የቀን መቁጠሪያ አቀራረብ:' : 'Calendar Standard Display:'}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCalendarSystem('ethiopian')}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    calendarSystem === 'ethiopian'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface border-outline-variant text-secondary hover:bg-surface-container'
                  }`}
                >
                  {isAmharic ? 'የኢትዮጵያ ዘመን አቆጣጠር' : 'Ethiopian Calendar'}
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarSystem('gregorian')}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    calendarSystem === 'gregorian'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface border-outline-variant text-secondary hover:bg-surface-container'
                  }`}
                >
                  {isAmharic ? 'የፈረንጆች ዘመን አቆጣጠር' : 'Gregorian Calendar'}
                </button>
              </div>
            </div>

            {onToggleLang && (
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  {isAmharic ? 'የሲስተም ዋና ቋንቋ:' : 'Active System Language:'}
                </label>
                <button
                  type="button"
                  onClick={onToggleLang}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span>{isAmharic ? 'አማርኛ (Amharic Language)' : 'English (United States)'}</span>
                  <span className="material-symbols-outlined text-[18px] text-primary">swap_horiz</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Security & System Maintenance */}
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-[22px]">security</span>
            <h3 className="font-bold text-base text-on-surface">
              {isAmharic ? '4. የደህንነት እና ሲስተም ጥገና (Security & Maintenance)' : '4. Security Controls & Data Diagnostics'}
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-surface-container/50 border border-outline-variant rounded-xl">
              <div>
                <p className="text-xs font-bold text-on-surface">
                  {isAmharic ? 'ሁለት ደረጃ ደህንነት ማረጋገጫ (2FA Security)' : 'Two-Factor Authentication (2FA)'}
                </p>
                <p className="text-[11px] text-secondary">
                  {isAmharic ? 'ወደ ሲስተም ሲገቡ በስልክ ኤስኤምኤስ ኮድ ይጠይቃል' : 'Require SMS OTP verification on clerk login'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={security2FA}
                onChange={(e) => setSecurity2FA(e.target.checked)}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-surface-container/50 border border-outline-variant rounded-xl">
              <div>
                <p className="text-xs font-bold text-on-surface">
                  {isAmharic ? 'የከፍተኛ ስጋት ማስጠንቀቂያዎች' : 'High-Risk Incident Immediate Alerts'}
                </p>
                <p className="text-[11px] text-secondary">
                  {isAmharic ? 'ተመሳስለው የተሰሩ የፈቃድ ጥሰቶች ሲገኙ ወዲያውኑ ያሳውቃል' : 'Instant notification if fraudulent permits or plate mismatches detected'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={highRiskAlerts}
                onChange={(e) => setHighRiskAlerts(e.target.checked)}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Backup & System Diagnostic Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>{isAmharic ? 'የመረጃ ኮፒ ማውረጃ (JSON Export)' : 'Export System Data Backup'}</span>
            </button>
            
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={handleResetData}
                disabled={isResetting}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                <span>{isResetting ? (isAmharic ? 'እያጠፋ ነው...' : 'Resetting...') : (isAmharic ? 'ሁሉንም መረጃ አጥፋ' : 'Reset System Data')}</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>{isAmharic ? 'ከሲስተሙ ውጣ' : 'Sign Out Session'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>{isAmharic ? 'ማስተካከያዎቹን መዝግብ' : 'Save Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
