import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { Language, UserRole } from './types';
import {
  getStoredAuthSession,
  saveAuthSession,
  getStoredLang,
  saveLang,
  getStoredTheme,
  saveTheme,
} from './utils/storage';

export default function App() {
  const [lang, setLang] = useState<Language>(() => getStoredLang());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStoredTheme());

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  const savedSession = getStoredAuthSession();
  const [isLoggedIn, setIsLoggedIn] = useState(savedSession?.isLoggedIn ?? false);
  const [userBadgeId, setUserBadgeId] = useState(savedSession?.userBadgeId ?? '');
  const [userRole, setUserRole] = useState<UserRole>(savedSession?.userRole ?? 'clerk');

  const toggleLanguage = () => {
    setLang((prev) => {
      const next = prev === 'am' ? 'en' : 'am';
      saveLang(next);
      return next;
    });
  };

  const handleLoginSuccess = (badgeId: string, role: UserRole) => {
    setUserBadgeId(badgeId);
    setUserRole(role);
    setIsLoggedIn(true);
    saveAuthSession({
      isLoggedIn: true,
      userBadgeId: badgeId,
      userRole: role,
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserBadgeId('');
    saveAuthSession(null);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setUserRole(newRole);
    saveAuthSession({
      isLoggedIn: true,
      userBadgeId,
      userRole: newRole,
    });
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans">
      {isLoggedIn ? (
        <HomePage
          userBadgeId={userBadgeId}
          userRole={userRole}
          currentLang={lang}
          currentTheme={theme}
          onToggleLang={toggleLanguage}
          onToggleTheme={toggleTheme}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
        />
      ) : (
        <LoginPage
          currentLang={lang}
          currentTheme={theme}
          onToggleLang={toggleLanguage}
          onToggleTheme={toggleTheme}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

