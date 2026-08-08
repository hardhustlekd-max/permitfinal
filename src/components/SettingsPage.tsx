import React, { useState } from 'react';
import { Language, UserRole } from '../types';

interface SettingsPageProps {
  lang: Language;
  userRole: UserRole;
  userBadgeId: string;
  onToggleLang?: () => void;
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  lang,
  userRole,
  userBadgeId,
  onToggleLang,
  onLogout,
}) => {
  const isAmharic = lang === 'am';

  // State for settings
  const [officerName, setOfficerName] = useState('አበበ ደስታ (Abebe Desta)');
  const [department, setDepartment] = useState('የትራፊክ ማኔጅመንትና ህግ ማስከበሪያ (Traffic Mgmt & Enforcement)');
  const [subCityOffice, setSubCityOffice] = useState('ኮልፌ ቀራኒዮ ክፍለ ከተማ (Kolfe Keraniyo)');
  const [defaultPrinter, setDefaultPrinter] = useState('Zebra ZD621 Industrial PVC Card Printer');
  const [cardStockType, setCardStockType] = useState('CR80 Standard PVC Card (85.6 x 54 mm)');
  const [calendarSystem, setCalendarSystem] = useState<'ethiopian' | 'gregorian'>('ethiopian');
  const [autoPrintQR, setAutoPrintQR] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [security2FA, setSecurity2FA] = useState(true);
  const [highRiskAlerts, setHighRiskAlerts] = useState(true);

  // Save Feedback state
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
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
                value={userRole.toUpperCase().replace('_', ' ')}
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
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-surface px-3.5 py-2.5 rounded-xl border border-outline-variant focus:border-primary text-xs font-semibold text-on-surface outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የስራ ክፍል / ኤጀንሲ:' : 'Department / Agency:'}
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-surface px-3.5 py-2.5 rounded-xl border border-outline-variant focus:border-primary text-xs font-semibold text-on-surface outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-1">
                {isAmharic ? 'የመደብ ክፍለ ከተማ / ቢሮ:' : 'Sub-City Jurisdiction Office:'}
              </label>
              <input
                type="text"
                value={subCityOffice}
                onChange={(e) => setSubCityOffice(e.target.value)}
                className="w-full bg-surface px-3.5 py-2.5 rounded-xl border border-outline-variant focus:border-primary text-xs font-semibold text-on-surface outline-hidden"
              />
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
                className="w-full bg-surface px-3.5 py-2.5 rounded-xl border border-outline-variant focus:border-primary text-xs font-semibold text-on-surface outline-hidden"
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
                className="w-full bg-surface px-3.5 py-2.5 rounded-xl border border-outline-variant focus:border-primary text-xs font-semibold text-on-surface outline-hidden"
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

        {/* Section 3: Regional & Localization Preferences */}
        <div className="bg-surface-container-lowest border border-outline-variant p-3.5 sm:p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
            <span className="material-symbols-outlined text-primary text-[22px]">language</span>
            <h3 className="font-bold text-base text-on-surface">
              {isAmharic ? '3. የቋንቋና የቀን አቆጣጠር ማስተካከያ' : '3. Language & Regional Preferences'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
