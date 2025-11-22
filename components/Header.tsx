
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { EligibilityStatus, ClassVerificationStatus } from '../types';
import EligibilityIndicator from './EligibilityIndicator';
import EligibilityInfoModal from './EligibilityInfoModal';
import { LANGUAGE_LABELS } from '../data/appData';
import { defaultTheme } from '../data/fundThemes';

interface HeaderProps {
  userName: string;
  onLogout: () => void;
  eligibilityStatus: EligibilityStatus;
  cvStatus: ClassVerificationStatus;
  supportedLanguages?: string[];
  logoUrl?: string;
  onReverify?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onLogout, eligibilityStatus, cvStatus, supportedLanguages = ['en'], logoUrl = defaultTheme.logoUrl, onReverify }) => {
  const { t, i18n } = useTranslation();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownRef]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langDropdownRef]);
  
  const isEligible = eligibilityStatus === 'Eligible';
  const eligibilityMessage = isEligible
    ? t('eligibilityIndicator.eligibleMessage')
    : t('eligibilityIndicator.verificationNeededMessage');

  const handleEligibilityClick = () => {
    setIsEligibilityModalOpen(true);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLangDropdownOpen(false);
  };

  // Filter supported languages to ensure we have labels, fallback to ['en']
  const languagesToRender = supportedLanguages.length > 0 ? supportedLanguages : ['en'];
  const showLangSwitcher = languagesToRender.length > 1;

  return (
    <>
      <header className="flex md:hidden items-center justify-between w-full h-20 bg-[var(--theme-bg-primary)] px-4 flex-shrink-0 z-30 pt-[env(safe-area-inset-top)] transition-colors duration-500">
        <div className="relative" ref={langDropdownRef}>
          <button
            onClick={() => showLangSwitcher && setIsLangDropdownOpen(prev => !prev)}
            className={`transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-primary)] focus:ring-[var(--theme-accent)] rounded-md p-1 ${showLangSwitcher ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
            aria-label="Select language"
            aria-haspopup={showLangSwitcher}
            aria-expanded={isLangDropdownOpen}
            disabled={!showLangSwitcher}
          >
            <img
              src={logoUrl}
              alt="Relief Fund Logo"
              className="h-11 w-auto"
            />
          </button>

          {isLangDropdownOpen && showLangSwitcher && (
            <div className="absolute left-0 mt-2 w-40 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-md shadow-lg z-50 py-1">
              {languagesToRender.map((lang) => (
                 <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      i18n.language.startsWith(lang)
                        ? 'text-[var(--theme-accent)] font-bold'
                        : 'text-white hover:bg-[var(--theme-bg-primary)]'
                    }`}
                  >
                    {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
                  </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-primary)] focus:ring-[var(--theme-accent)] rounded-md p-1"
              aria-haspopup="true"
              aria-expanded={isUserDropdownOpen}
            >
              <div className="flex flex-col items-end space-y-1">
                  <span className="text-base truncate max-w-[150px]">{t('nav.welcome', { name: userName })}</span>
                   <div onClick={(e) => { e.stopPropagation(); handleEligibilityClick(); }}>
                      <EligibilityIndicator eligibilityStatus={eligibilityStatus} cvStatus={cvStatus} />
                  </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-md shadow-lg z-50 py-1">
                 <button
                    onClick={() => {
                        handleEligibilityClick();
                        setIsUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[var(--theme-bg-primary)] flex justify-between items-center transition-colors"
                >
                    <span>Status</span>
                    <EligibilityIndicator eligibilityStatus={eligibilityStatus} cvStatus={cvStatus} />
                </button>
                <div className="border-t border-[var(--theme-border)] my-1"></div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsUserDropdownOpen(false); // Close dropdown on click
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-[var(--theme-accent)]/20 hover:text-red-200 transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {isEligibilityModalOpen && (
        <EligibilityInfoModal 
            message={eligibilityMessage} 
            onClose={() => setIsEligibilityModalOpen(false)} 
            onRetry={!isEligible ? onReverify : undefined}
        />
      )}
    </>
  );
};

export default Header;
