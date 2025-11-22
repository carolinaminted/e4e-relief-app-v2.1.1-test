
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PolicyModal from './PolicyModal';
import { ApplyIcon, ProfileIcon, SupportIcon, DonateIcon, DashboardIcon, SparklesIcon } from './Icons';
import type { Page, UserProfile } from '../types';

interface HomePageProps {
  navigate: (page: Page) => void;
  canApply: boolean;
  userProfile: UserProfile;
}

// --- Component ---

interface Tile {
  key: string;
  titleKey: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  disabledTooltipKey?: string;
  colSpan?: string;
}

const HomePage: React.FC<HomePageProps> = ({ navigate, canApply, userProfile }) => {
    const { t } = useTranslation();
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    
    // Determine full eligibility (verified identity + fund eligibility) for access control
    const isFullyEligible = userProfile.classVerificationStatus === 'passed' && userProfile.eligibilityStatus === 'Eligible';

    const tiles: Tile[] = [
        { 
            key: 'apply', 
            titleKey: 'nav.apply', 
            icon: <ApplyIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, 
            onClick: () => navigate('apply'),
            disabled: !canApply,
            disabledTooltipKey: userProfile.classVerificationStatus !== 'passed' ? "homePage.applyTooltipVerification" : "homePage.applyTooltipLimits"
        },
        { 
            key: 'aiApply', 
            titleKey: 'nav.aiApply', 
            icon: <SparklesIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, 
            onClick: () => navigate('aiApply'),
            disabled: !canApply,
            disabledTooltipKey: userProfile.classVerificationStatus !== 'passed' ? "homePage.applyTooltipVerification" : "homePage.applyTooltipLimits"
        },
        { key: 'profile', titleKey: 'nav.profile', icon: <ProfileIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, onClick: () => navigate('profile') },
        { 
            key: 'support', 
            titleKey: 'nav.support', 
            icon: <SupportIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, 
            onClick: () => navigate('support'),
            disabled: !isFullyEligible,
            disabledTooltipKey: "homePage.applyTooltipVerification"
        },
        
    ];

    if (userProfile.role === 'Admin') {
        tiles.push({ 
            key: 'fundPortal', 
            titleKey: 'nav.fundPortal', 
            icon: <DashboardIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, 
            onClick: () => navigate('fundPortal'),
        });
         tiles.push({ 
             key: 'donate', 
             titleKey: 'nav.donate', 
             icon: <DonateIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, 
             onClick: () => navigate('donate')
        });
    } else {
        tiles.push({ 
            key: 'donate', 
            titleKey: 'nav.donate', 
            icon: <DonateIcon className="h-9 w-9 sm:h-12 sm:w-12 mb-2 sm:mb-4" />, 
            colSpan: 'col-span-2', 
            onClick: () => navigate('donate'),
            disabled: !isFullyEligible,
            disabledTooltipKey: "homePage.applyTooltipVerification"
        });
    }

  return (
    <>
      <div className="h-full flex flex-col items-center p-4 md:p-8 text-center">
        <div className="w-full flex-grow flex flex-col items-center"> {/* Content wrapper */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
                {t('homePage.title')}
            </h1>
            {userProfile ? (
              <div className="mt-2 flex flex-col items-center gap-2">
                  {userProfile.fundName && userProfile.fundCode ? (
                      <p className="text-lg text-gray-300">{userProfile.fundName} ({userProfile.fundCode})</p>
                  ) : null }
              </div>
            ) : (
              <p className="text-lg text-gray-400 mt-2 italic">{t('applyPage.noActiveFund')}</p>
            )}
          </div>

          <div className={`w-full max-w-md sm:max-w-2xl mx-auto grid grid-cols-2 gap-3 sm:gap-6`}>
            {tiles.map((tile) => (
                <div 
                    key={tile.key}
                    onClick={!tile.disabled ? tile.onClick : undefined}
                    title={tile.disabled && tile.disabledTooltipKey ? t(tile.disabledTooltipKey) : ""}
                    aria-disabled={!!tile.disabled}
                    className={`bg-[var(--theme-bg-secondary)] backdrop-blur-lg border border-white/20 p-4 sm:p-6 rounded-lg shadow-lg transition-all duration-300 transform flex flex-col items-center justify-center text-center ${
                        tile.disabled ? 'opacity-60 cursor-not-allowed' : 'md:hover:bg-white/10 cursor-pointer md:hover:scale-105'
                    } ${tile.colSpan || ''}`}
                    style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                >
                    {tile.icon}
                    <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
                        {t(tile.titleKey)}
                    </h2>
                </div>
            ))}
          </div>
        </div>
        <div className="mt-auto pt-4 text-center">
          <button
            onClick={() => setIsPolicyModalOpen(true)}
            className="text-xs text-[#898c8d] hover:text-white transition-colors duration-200"
          >
            {t('homePage.poweredBy')}
          </button>
        </div>
      </div>
      {isPolicyModalOpen && <PolicyModal onClose={() => setIsPolicyModalOpen(false)} />}
    </>
  );
};

export default HomePage;
