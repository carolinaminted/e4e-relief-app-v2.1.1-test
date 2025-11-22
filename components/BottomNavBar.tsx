
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HomeIcon, ProfileIcon, SupportIcon, DashboardIcon, ApplyIcon, SparklesIcon } from './Icons';
import type { Page } from '../types';

interface BottomNavBarProps {
  navigate: (page: Page) => void;
  currentPage: Page;
  userRole: 'User' | 'Admin';
  canApply: boolean;
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
    className={`flex flex-col items-center justify-center flex-1 p-2 text-xs transition-colors duration-200 ${
      isActive ? 'text-[var(--theme-accent)]' : 'text-gray-300 hover:text-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-current={isActive ? 'page' : undefined}
  >
    {icon}
    <span className="mt-1">{label}</span>
  </button>
);

const BottomNavBar: React.FC<BottomNavBarProps> = ({ navigate, currentPage, userRole, canApply }) => {
  const { t } = useTranslation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--theme-bg-primary)] md:hidden z-40 pb-[env(safe-area-inset-bottom)] transition-colors duration-500">
      <div className="flex h-16 w-full">
        <NavItem
            label={t('nav.home')}
            icon={<HomeIcon className="h-6 w-6" />}
            onClick={() => navigate('home')}
            isActive={currentPage === 'home'}
        />
        <NavItem
            label={t('nav.profile')}
            icon={<ProfileIcon className="h-6 w-6" />}
            onClick={() => navigate('profile')}
            isActive={currentPage === 'profile'}
        />
        <NavItem
            label={t('nav.apply')}
            icon={<ApplyIcon className="h-6 w-6" />}
            onClick={() => navigate('apply')}
            isActive={currentPage === 'apply'}
            disabled={!canApply}
        />
         <NavItem
            label={t('nav.aiApply')}
            icon={<SparklesIcon className="h-6 w-6" />}
            onClick={() => navigate('aiApply')}
            isActive={currentPage === 'aiApply'}
            disabled={!canApply}
        />
        <NavItem
            label={t('nav.support')}
            icon={<SupportIcon className="h-6 w-6" />}
            onClick={() => navigate('support')}
            isActive={currentPage === 'support'}
        />
        {userRole === 'Admin' && (
            <NavItem
                label={t('nav.fundPortal')}
                icon={<DashboardIcon className="h-6 w-6" />}
                onClick={() => navigate('fundPortal')}
                isActive={['fundPortal', 'proxy', 'ticketing', 'tokenUsage', 'programDetails', 'liveDashboard'].includes(currentPage)}
            />
        )}
      </div>
    </nav>
  );
};

export default BottomNavBar;
