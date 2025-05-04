import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Globe, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/contexts/LanguageContext';
import { useAuthStore } from '../lib/store';
import { getInitials } from '../lib/utils';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <header className="bg-brand-cream sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center h-20">
          {/* Title */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-brand-navy border border-brand-navy/30 rounded-full px-6 py-2 bg-transparent">
              Thai Film Camps
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 ml-12">
            <Link to="/" className="nav-link">{t('nav.home')}</Link>
            <Link to="/about" className="nav-link">{t('nav.about')}</Link>
            <Link to="/projects" className="nav-link">{t('nav.projects')}</Link>
            <Link to="/schedule" className="nav-link">{t('nav.schedule')}</Link>
            <Link to="/gallery" className="nav-link">{t('nav.gallery')}</Link>
          </nav>
          
          {/* Language Switcher and Login/User Menu */}
          <div className="hidden md:flex items-center ml-auto space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 text-brand-navy hover:text-brand-violet transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </button>

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-violet text-white flex items-center justify-center font-medium">
                      {getInitials(user.fullName)}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to={user.role === 'admin' ? '/admin' : '/user'}
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {user.role === 'admin' ? 'แดชบอร์ดผู้ดูแล' : 'แดชบอร์ดของฉัน'}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                {t('nav.login')}
              </Link>
            )}
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden ml-auto text-brand-navy"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4">
            <div className="space-y-3">
              <Link to="/" className="nav-link block py-2">{t('nav.home')}</Link>
              <Link to="/about" className="nav-link block py-2">{t('nav.about')}</Link>
              <Link to="/projects" className="nav-link block py-2">{t('nav.projects')}</Link>
              <Link to="/schedule" className="nav-link block py-2">{t('nav.schedule')}</Link>
              <Link to="/gallery" className="nav-link block py-2">{t('nav.gallery')}</Link>
              <div className="flex items-center justify-between py-2">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center space-x-2 text-brand-navy hover:text-brand-violet transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-sm font-medium">{language.toUpperCase()}</span>
                </button>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <Link
                      to={user.role === 'admin' ? '/admin' : '/user'}
                      className="text-brand-navy hover:text-brand-violet"
                    >
                      <User className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-red-600 hover:text-red-700"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="btn-primary">
                    {t('nav.login')}
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}