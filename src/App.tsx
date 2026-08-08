import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { Language, UserRole } from './types';
import {
  getStoredAuthSession,
  saveAuthSession,
  getStoredLang,
  saveLang,
} from './utils/storage';

export default function App() {
  const [lang, setLang] = useState<Language>(() => getStoredLang());
  
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
          onToggleLang={toggleLanguage}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
        />
      ) : (
        <LoginPage
          currentLang={lang}
          onToggleLang={toggleLanguage}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

