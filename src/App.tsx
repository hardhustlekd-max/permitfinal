import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { Language, UserRole } from './types';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userBadgeId, setUserBadgeId] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('clerk');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'am' ? 'en' : 'am'));
  };

  const handleLoginSuccess = (badgeId: string, role: UserRole) => {
    setUserBadgeId(badgeId);
    setUserRole(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserBadgeId('');
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setUserRole(newRole);
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
