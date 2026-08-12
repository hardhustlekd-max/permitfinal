import React, { useState } from 'react';
import { Language, UserRole } from '../types';
import { validateBadgeId } from '../utils/validation';

interface LoginPageProps {
  currentLang?: Language;
  currentTheme?: 'light' | 'dark';
  onToggleLang?: () => void;
  onToggleTheme?: () => void;
  onLoginSuccess?: (badgeId: string, role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentLang = 'en',
  currentTheme = 'light',
  onToggleLang,
  onToggleTheme,
  onLoginSuccess,
}) => {
  const [badgeId, setBadgeId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('clerk');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<Language>(currentLang);

  const [badgeIdError, setBadgeIdError] = useState('');

  const toggleLang = () => {
    const nextLang = lang === 'am' ? 'en' : 'am';
    setLang(nextLang);
    if (onToggleLang) onToggleLang();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBadgeIdError('');

    // If something was typed, run strict validation
    if (badgeId.trim()) {
      const validation = validateBadgeId(badgeId, lang === 'am');
      if (!validation.isValid) {
        setBadgeIdError(validation.message);
        return;
      }
    }

    // Default fallbacks if empty fields
    const effectiveBadge =
      badgeId.trim() ||
      (selectedRole === 'clerk'
        ? 'CLERK-001'
        : selectedRole === 'admin'
        ? 'ADMIN-PRO-1'
        : 'OFFICER-8842');

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(effectiveBadge, selectedRole);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Main Simple Login Card */}
      <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-md p-6 sm:p-8 space-y-5 relative">
        
        {/* Language & Theme Selectors Inside Card */}
        <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
          <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
            <span className="material-symbols-outlined text-[18px] text-primary">security</span>
            <span>{lang === 'am' ? 'የመግቢያ ገጽ' : 'Portal Login'}</span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title="Toggle Theme"
                className="flex items-center justify-center p-1.5 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container hover:text-primary transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">
                  {currentTheme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container hover:text-primary transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">translate</span>
              <span>{lang === 'am' ? 'English' : 'አማርኛ'}</span>
            </button>
          </div>
        </div>

        {/* Simple Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-white border-2 border-sky-400 shadow-sm flex items-center justify-center shrink-0 p-0.5 mb-1">
            <div className="w-full h-full rounded-full bg-[#0088cc] flex items-center justify-center relative overflow-hidden">
              <svg className="w-7 h-7 text-white" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="18" fill="#0088cc" />
                <path d="M12 28 C12 20, 18 12, 28 12 C24 18, 22 24, 22 28 Z" fill="#ffffff" />
                <path d="M10 22 C14 14, 22 10, 28 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                <circle cx="28" cy="8" r="2.5" fill="#f59e0b" />
              </svg>
            </div>
          </div>
          <h1 id="header-text" className="font-extrabold text-sm text-slate-900 tracking-tight">
            {lang === 'am' ? 'Temporary Project Manegment System' : 'Temporary Project Manegment System'}
          </h1>
          <p className="text-xs text-secondary font-semibold">
            {lang === 'am'
              ? 'ኦፊሴላዊ የሞተርሳይክል መታወቂያ እና ፈቃድ አስተዳደር'
              : 'Official Motorcycle Registration & ID Portal'}
          </p>
        </div>

        {/* Role Selector Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-secondary">
            {lang === 'am' ? 'የሚገቡበት ሚና ይምረጡ' : 'Select System Role'}
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
              badge
            </span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-9 pr-8 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
            >
              <option value="clerk">{lang === 'am' ? 'ፀሀፊ (Clerk)' : 'Clerk'}</option>
              <option value="admin">{lang === 'am' ? 'አድሚን (Admin)' : 'Admin'}</option>
              <option value="officer">{lang === 'am' ? 'ተቆጣጣሪ (Officer)' : 'Officer'}</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Badge ID / Username Input */}
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">
              {lang === 'am' ? 'የመለያ ቁጥር / Badge ID' : 'Badge ID or Username'}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                badge
              </span>
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                placeholder={
                  selectedRole === 'clerk'
                    ? 'CLERK-001'
                    : selectedRole === 'admin'
                    ? 'ADMIN-PRO-1'
                    : 'OFFICER-8842'
                }
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-9 pr-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            {badgeIdError && (
              <p className="text-[11px] text-red-600 font-bold mt-1 animate-fadeIn flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">error</span>
                <span>{badgeIdError}</span>
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">
              {lang === 'am' ? 'የይለፍ ቃል (አማራጭ)' : 'Password (Optional)'}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 pl-9 pr-10 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-secondary font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary focus:ring-offset-0"
              />
              <span>{lang === 'am' ? 'አስታውሰኝ' : 'Remember me'}</span>
            </label>

            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              {lang === 'am' ? 'ቀጥታ መግባት ይቻላል' : 'Direct Login Ready'}
            </span>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{lang === 'am' ? 'በመግባት ላይ...' : 'Signing in...'}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>{lang === 'am' ? 'ቀጥታ ይግቡ' : 'Sign In Directly'}</span>
              </>
            )}
          </button>
        </form>

        {/* Card Footer */}
        <div className="text-center pt-2 border-t border-outline-variant">
          <p className="text-[11px] text-outline">
            {lang === 'am'
              ? 'የከተማው አስተዳደር ህግ ማስከበሪያ - 2026'
              : 'Municipal Enforcement Pro • 2026'}
          </p>
        </div>
      </div>
    </div>
  );
};
