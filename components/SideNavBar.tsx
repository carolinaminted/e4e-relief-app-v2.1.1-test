
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeIcon, ProfileIcon, SupportIcon, DonateIcon, DashboardIcon, ApplyIcon, SparklesIcon } from './Icons';
import type { Page, EligibilityStatus, ClassVerificationStatus } from '../types';
import LanguageSwitcher from './LanguageSwitcher';
import EligibilityIndicator from './EligibilityIndicator';
import EligibilityInfoModal from './EligibilityInfoModal';
import { defaultTheme } from '../data/fundThemes';

interface SideNavBarProps {
  navigate: (page: Page) => void;
  currentPage: Page;
  userRole: 'User' | 'Admin';
  userName: string;
  onLogout: () => void;
  canApply: boolean;
  eligibilityStatus: EligibilityStatus;
  cvStatus: ClassVerificationStatus;
  supportedLanguages?: string[];
  logoUrl?: string;
  onReverify?: () => void;
}

interface NavItemType {
  page: Page;
  labelKey: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isActive: boolean; disabled?: boolean }> = ({ icon, label, onClick, isActive, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center w-full p-3 my-1 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-primary)] focus:ring-[var(--theme-accent)] ${
      isActive ? 'bg-[var(--theme-accent)]/20 text-white font-semibold' : 'text-gray-300 hover:bg-[var(--theme-bg-secondary)] hover:text-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
     aria-current={isActive ? 'page' : undefined}
  >
    <div className={`w-6 h-6 mr-3 ${isActive ? 'text-[var(--theme-accent)]' : ''}`}>{icon}</div>
    <span>{label}</span>
  </button>
);

const SideNavBar: React.FC<SideNavBarProps> = ({ navigate, currentPage, userRole, userName, onLogout, canApply, eligibilityStatus, cvStatus, supportedLanguages = ['en'], logoUrl = defaultTheme.logoUrl, onReverify }) => {
  const { t } = useTranslation();
  const [isEligibilityModalOpen, setIsEligibilityModalOpen] = useState(false);
  
  const isEligible = eligibilityStatus === 'Eligible';
  const isVerifiedAndEligible = isEligible && cvStatus === 'passed';

  const eligibilityMessage = isEligible
    ? t('eligibilityIndicator.eligibleMessage')
    : t('eligibilityIndicator.verificationNeededMessage');

  const handleEligibilityClick = () => {
    setIsEligibilityModalOpen(true);
  };

  const baseNavItems: NavItemType[] = [
    { page: 'home', labelKey: 'nav.home', icon: <HomeIcon className="h-6 w-6" /> },
    { page: 'profile', labelKey: 'nav.profile', icon: <ProfileIcon className="h-6 w-6" /> },
    { page: 'apply', labelKey: 'nav.apply', icon: <ApplyIcon className="h-6 w-6" />, disabled: !canApply },
    { page: 'aiApply', labelKey: 'nav.aiApply', icon: <SparklesIcon className="h-6 w-6" />, disabled: !canApply },
    { page: 'support', labelKey: 'nav.support', icon: <SupportIcon className="h-6 w-6" />, disabled: !isVerifiedAndEligible },
    { page: 'donate', labelKey: 'nav.donate', icon: <DonateIcon className="h-6 w-6" />, disabled: !isVerifiedAndEligible },
  ];

  const navItems = [...baseNavItems];
  if (userRole === 'Admin') {
    navItems.push({ page: 'fundPortal', labelKey: 'nav.fundPortal', icon: <DashboardIcon className="h-6 w-6" /> });
  }

  const adminDashboardPages: Page[] = ['fundPortal', 'proxy', 'ticketing', 'tokenUsage', 'programDetails', 'liveDashboard'];
  const activePage = userRole === 'Admin' && adminDashboardPages.includes(currentPage) ? 'fundPortal' : currentPage;


  return (
    <>
      <nav className="hidden md:flex flex-col w-64 bg-[var(--theme-bg-primary)] p-4 transition-colors duration-500">
        <div className="mb-6 text-center">
            <div className="flex justify-center items-center mb-4">
                <img
                  src={logoUrl}
                  alt="Relief Fund Logo"
                  className="h-12 w-auto"
                />
            </div>
            <div className="p-2 flex flex-col items-center">
              <span className="text-gray-200 truncate">{t('nav.welcome', { name: userName })}</span>
              <div className="mt-1">
                  <EligibilityIndicator eligibilityStatus={eligibilityStatus} cvStatus={cvStatus} onClick={handleEligibilityClick} />
              </div>
            </div>
             <div className="mt-4 px-2 space-y-2">
                <LanguageSwitcher variant="sideNav" supportedLanguages={supportedLanguages} />
                <button
                    onClick={onLogout}
                    className="w-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('nav.logout')}</span>
                </button>
            </div>
        </div>

        <div className="flex-grow pt-4">
          {navItems.map(item => (
            <NavItem
              key={item.page}
              label={t(item.labelKey)}
              icon={item.icon}
              onClick={() => navigate(item.page as Page)}
              isActive={activePage === item.page}
              disabled={item.disabled}
            />
          ))}
        </div>
        
      </nav>
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

export default SideNavBar;
