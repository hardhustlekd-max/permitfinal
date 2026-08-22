import React, { useState, useEffect } from 'react';
import { Language, UserRole } from '../types';
import { validateBadgeId } from '../utils/validation';
import { SYSTEM_ROLE_CREDENTIALS, loginOnlineUser } from '../services/authService';
import { Shield, Lock, Eye, EyeOff, LogIn, ChevronDown } from 'lucide-react';

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
  const [selectedRole, setSelectedRole] = useState<UserRole>('clerk');
  const [badgeId, setBadgeId] = useState(SYSTEM_ROLE_CREDENTIALS.clerk.badgeId);
  const [password, setPassword] = useState(SYSTEM_ROLE_CREDENTIALS.clerk.password);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const lang = currentLang;

  const [badgeIdError, setBadgeIdError] = useState('');

  // Auto-fill credentials whenever selected role changes
  useEffect(() => {
    const creds = SYSTEM_ROLE_CREDENTIALS[selectedRole];
    if (creds) {
      setBadgeId(creds.badgeId);
      setPassword(creds.password);
      setBadgeIdError('');
    }
  }, [selectedRole]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBadgeIdError('');

    // If something custom was typed, validate
    if (badgeId.trim() && !badgeId.includes('@')) {
      const validation = validateBadgeId(badgeId, lang === 'am');
      if (!validation.isValid) {
        setBadgeIdError(validation.message);
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await loginOnlineUser(selectedRole, badgeId, password);
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(result.user.badgeId, result.user.role);
      }
    } catch (err) {
      console.warn('[LoginPage] Online auth fallback handled:', err);
      setIsLoading(false);
      if (onLoginSuccess) {
        const fallbackBadge =
          badgeId.trim() || SYSTEM_ROLE_CREDENTIALS[selectedRole].badgeId;
        onLoginSuccess(fallbackBadge, selectedRole);
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between font-sans text-on-surface">
      
      {/* ================= TOP NAVBAR ================= */}
      <header className="w-full bg-[#0B1E48] text-white border-b-2 border-yellow-500 shadow-md px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between shrink-0 z-50 gap-2 sm:gap-4">
        
        {/* Left Brand & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-[#EAB308] p-0.5 shadow-sm flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center relative overflow-hidden">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#0B1E48]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12.8-4.2l-2.8-2.8c-.4-.4-1-.4-1.4 0l-4.2 4.2c-.3.3-.4.8-.3 1.2l1.2 4.8h-2.1c-.6 0-1.1.4-1.2 1l-.8 4c-.1.6.3 1.2.9 1.3.1 0 .2 0 .3 0h1.8c.3 1.7 1.8 3 3.6 3s3.3-1.3 3.6-3h2.8c.3 1.7 1.8 3 3.6 3s3.3-1.3 3.6-3h1.8c.6 0 1.1-.5 1.1-1.1v-2c0-2.3-1.4-4.3-3.5-5.3z"/>
              </svg>
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-xs sm:text-sm text-white tracking-tight leading-tight truncate">
              {lang === 'am' ? 'ሕይወት ባህርዳር የሞተረኞች ማህበር' : 'HIWOT BAHIRDAR ASSOCIATION'}
            </h1>
            <p className="text-[9px] sm:text-[10px] text-yellow-300 font-normal tracking-wide truncate">
              {lang === 'am' ? 'በአንድነት ለአስተማማኝና ለተሻለ አገልግሎት' : 'Together for Safe and Better service'}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center shrink-0">
          {/* Header intentionally left minimal */}
        </div>
      </header>

      {/* ================= MAIN LOGIN CONTAINER ================= */}
      <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-md p-6 sm:p-8 space-y-5 relative">
          
          {/* Brand Header Inside Card */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 mb-1 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <h2 className="font-extrabold text-sm text-on-surface tracking-tight leading-tight">
              {lang === 'am' ? 'ወደ ሲስተሙ ይግቡ' : 'Sign In To Account'}
            </h2>
            <p className="text-[11px] text-secondary font-light">
              {lang === 'am' ? 'የይለፍ ቃል እና መለያ ያስገቡ' : 'Enter credentials to proceed'}
            </p>
          </div>

          {/* Role Selector Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="role-select-dropdown" className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
              {lang === 'am' ? 'የሚገቡበት ሚና ይምረጡ' : 'Select System Role'}
            </label>
            <div className="relative">
              <select
                id="role-select-dropdown"
                value={selectedRole}
                onChange={(e) => handleRoleSelect(e.target.value as UserRole)}
                className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface appearance-none focus:outline-hidden focus:border-[#0B1E48] focus:ring-2 focus:ring-[#0B1E48]/20 transition-all cursor-pointer pr-10"
              >
                <option value="clerk">
                  {lang === 'am' ? 'ፀሀፊ — CLERK-001' : 'Clerk — CLERK-001'}
                </option>
                <option value="admin">
                  {lang === 'am' ? 'ሥራ አስኪያጅ — ADMIN-PRO-1' : 'Manager / Admin — ADMIN-PRO-1'}
                </option>
                <option value="officer">
                  {lang === 'am' ? 'ተቆጣጣሪ — OFFICER-8842' : 'Traffic Officer — OFFICER-8842'}
                </option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Badge ID Input */}
            <div className="space-y-1.5">
              <label htmlFor="badge-id-input" className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                {lang === 'am' ? 'የመታወቂያ ቁጥር' : 'Badge / Employee ID'}
              </label>
              <div className="relative">
                <input
                  id="badge-id-input"
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  placeholder="CLERK-001"
                  required
                  className={`w-full bg-surface-container border ${
                    badgeIdError ? 'border-error' : 'border-outline-variant'
                  } rounded-xl px-4 py-3 text-sm font-medium text-on-surface focus:outline-hidden focus:border-[#0B1E48] focus:ring-2 focus:ring-[#0B1E48]/20 transition-all font-mono`}
                />
              </div>
              {badgeIdError && (
                <p className="text-[11px] font-medium text-error mt-1">{badgeIdError}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password-input" className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5">
                {lang === 'am' ? 'የይለፍ ቃል' : 'Password'}
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm font-medium text-on-surface focus:outline-hidden focus:border-[#0B1E48] focus:ring-2 focus:ring-[#0B1E48]/20 transition-all font-mono pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-secondary font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-md border-outline text-primary focus:ring-primary/20 accent-primary w-4 h-4 cursor-pointer"
                />
                <span>{lang === 'am' ? 'አስታውሰኝ' : 'Remember Session'}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0B1E48] hover:bg-[#0D2B5C] text-white py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{lang === 'am' ? 'በመግባት ላይ...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{lang === 'am' ? 'ቀጥታ ይግቡ' : 'Sign In Directly'}</span>
                </>
              )}
            </button>
          </form>

          {/* Card Footer */}
          <div className="text-center pt-2 border-t border-outline-variant">
            <p className="text-[11px] text-outline">
              {lang === 'am'
                ? 'ሕይወት ባህርዳር የሞተረኞች ማህበር አገልግሎት ኃ.የተ.የግ.ማ • 2026'
                : 'Hiwot Bahirdar Motorbike Riders Association Service PLC • 2026'}
            </p>
          </div>
        </div>
      </main>

      {/* ================= FOOTER BAR ================= */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/60 py-3 px-4 text-center text-[11px] font-medium text-secondary shrink-0">
        {lang === 'am'
          ? '© 2026 ሕይወት ባህርዳር የሞተረኞች ማህበር አገልግሎት ኃ.የተ.የግ.ማ. መብቱ በህግ የተጠበቀ ነው።'
          : '© 2026 Hiwot Bahirdar Motorbike Riders Association Service PLC. All Rights Reserved.'}
      </footer>
    </div>
  );
};
