
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PolicyModal from './PolicyModal';
import type { Page, UserProfile } from '../types';
import type { Fund } from '../data/fundData';

interface HomePageProps {
  navigate: (page: Page) => void;
  canApply: boolean;
  userProfile: UserProfile;
  activeFund: Fund | null;
}

const HomePage: React.FC<HomePageProps> = ({ navigate, canApply, userProfile, activeFund }) => {
    const { t } = useTranslation();
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    
    const fundCode = activeFund?.code || 'DEFAULT';
    
    // Dynamic text keys based on fund code (e.g. fundContent.DOM.title)
    const welcomeTitle = t(`fundContent.${fundCode}.title`, t('homePage.welcomeTitle'));
    const welcomeSubtitle = t(`fundContent.${fundCode}.subtitle`, t('homePage.welcomeSubtitle'));
    const description = t(`fundContent.${fundCode}.description`, t('homePage.defaultDescription'));

    return (
    <>
      <div className="h-full flex flex-col items-center p-4 md:p-8 text-center overflow-y-auto">
        <div className="w-full max-w-4xl flex-grow flex flex-col items-center space-y-12">
          
          {/* Hero Section */}
          <section className="mt-8 animate-[fadeIn_0.8s_ease-out]">
             {/* Logo is handled in the Header/Sidebar, but we can have a large one here too if desired */}
             <div className="mb-6 flex justify-center">
                {/* Placeholder for optional large hero logo */}
             </div>
             
             <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] mb-4 leading-tight">
                {welcomeTitle}
             </h1>
             <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                {welcomeSubtitle}
             </p>

             <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={() => navigate(canApply ? 'aiApply' : 'profile')}
                    className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                    {canApply ? t('homePage.applyNow') : t('homePage.checkEligibility')}
                </button>
                {/* Secondary CTA - maybe Donate or Support */}
                <button
                    onClick={() => navigate('support')}
                    className="bg-transparent border-2 border-white/30 hover:bg-white/10 text-white font-semibold py-3 px-8 rounded-full text-lg transition-colors duration-200"
                >
                    {t('nav.support')}
                </button>
             </div>
          </section>

          {/* About / Mission Section */}
          <section className="bg-[var(--theme-bg-secondary)]/50 backdrop-blur-sm p-8 rounded-2xl border border-[var(--theme-border)] shadow-xl w-full text-left">
             <h2 className="text-2xl font-bold text-white mb-4 border-b border-[var(--theme-border)] pb-2">
                {t('homePage.aboutSection')}
             </h2>
             <p className="text-gray-300 leading-relaxed text-lg">
                {description}
             </p>
          </section>

          {/* Highlights Section (What is Covered) */}
          {activeFund && (
              <section className="w-full animate-[fadeIn_1s_ease-out]">
                 <h2 className="text-2xl font-bold text-white mb-8 text-center border-b border-[var(--theme-border)]/30 pb-4 mx-auto max-w-lg">
                    {t('homePage.coveredSection')}
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Disasters Card */}
                    <div className="bg-[var(--theme-bg-secondary)] p-6 rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-300 flex flex-col shadow-lg">
                        <div className="flex items-center gap-3 mb-5 border-b border-[var(--theme-border)]/30 pb-3">
                            <div className="p-2.5 bg-[var(--theme-bg-primary)] rounded-lg shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--theme-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('eligibilityPage.disasters')}</h3>
                        </div>
                        <ul className="text-left space-y-3 flex-grow">
                            {activeFund.eligibleDisasters.slice(0, 5).map(item => (
                                <li key={item} className="flex items-start gap-3 text-gray-200 text-sm group">
                                    <span className="text-[var(--theme-accent)] mt-1 opacity-70 group-hover:opacity-100 transition-opacity">❖</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                            {activeFund.eligibleDisasters.length > 5 && (
                                <li className="text-xs text-gray-500 italic mt-2 pl-6">+ {activeFund.eligibleDisasters.length - 5} more</li>
                            )}
                        </ul>
                    </div>

                    {/* Hardships Card */}
                    <div className="bg-[var(--theme-bg-secondary)] p-6 rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-300 flex flex-col shadow-lg">
                        <div className="flex items-center gap-3 mb-5 border-b border-[var(--theme-border)]/30 pb-3">
                            <div className="p-2.5 bg-[var(--theme-bg-primary)] rounded-lg shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--theme-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('eligibilityPage.hardships')}</h3>
                        </div>
                        <ul className="text-left space-y-3 flex-grow">
                            {activeFund.eligibleHardships.slice(0, 5).map(item => (
                                <li key={item} className="flex items-start gap-3 text-gray-200 text-sm group">
                                    <span className="text-[var(--theme-accent)] mt-1 opacity-70 group-hover:opacity-100 transition-opacity">❖</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                             {activeFund.eligibleHardships.length > 5 && (
                                <li className="text-xs text-gray-500 italic mt-2 pl-6">+ {activeFund.eligibleHardships.length - 5} more</li>
                            )}
                        </ul>
                    </div>

                    {/* Eligibility Card */}
                    <div className="bg-[var(--theme-bg-secondary)] p-6 rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-300 flex flex-col shadow-lg">
                        <div className="flex items-center gap-3 mb-5 border-b border-[var(--theme-border)]/30 pb-3">
                            <div className="p-2.5 bg-[var(--theme-bg-primary)] rounded-lg shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--theme-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('homePage.eligibilityTitle')}</h3>
                        </div>
                        <div className="text-left text-sm text-gray-300 flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-[var(--theme-bg-primary)]/20 p-4 rounded-lg h-full">
                                <p className="font-semibold text-[var(--theme-accent)] mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
                                    {t('homePage.locationLabel')}
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-white">
                                        <span>•</span>
                                        United States
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-[var(--theme-bg-primary)]/20 p-4 rounded-lg h-full">
                                <p className="font-semibold text-[var(--theme-accent)] mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
                                    {t('homePage.employmentTypesLabel')}
                                </p>
                                <ul className="space-y-2">
                                    {activeFund.eligibleEmploymentTypes.slice(0, 3).map(item => (
                                        <li key={item} className="flex items-start gap-2 text-white">
                                            <span>•</span>
                                            {item}
                                        </li>
                                    ))}
                                    {activeFund.eligibleEmploymentTypes.length > 3 && (
                                        <li className="text-xs text-gray-500 italic ml-3">+ {activeFund.eligibleEmploymentTypes.length - 3} more</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Grant Limits Card */}
                    <div className="bg-[var(--theme-bg-secondary)] p-6 rounded-xl border border-[var(--theme-border)] hover:border-[var(--theme-accent)] transition-all duration-300 flex flex-col shadow-lg">
                        <div className="flex items-center gap-3 mb-5 border-b border-[var(--theme-border)]/30 pb-3">
                            <div className="p-2.5 bg-[var(--theme-bg-primary)] rounded-lg shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--theme-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white">{t('homePage.grantLimitsTitle')}</h3>
                        </div>
                        
                        {/* Two Columns Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                            <div className="bg-[var(--theme-bg-primary)]/40 rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-inner">
                                <span className="text-xs text-gray-400 uppercase tracking-widest mb-3">{t('homePage.twelveMonthMaxLabel')}</span>
                                <span className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] drop-shadow-sm">
                                    ${activeFund.limits.twelveMonthMax.toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-[var(--theme-bg-primary)]/40 rounded-xl p-4 flex flex-col justify-center items-center text-center shadow-inner">
                                <span className="text-xs text-gray-400 uppercase tracking-widest mb-3">{t('homePage.lifetimeMaxLabel')}</span>
                                <span className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] drop-shadow-sm">
                                    ${activeFund.limits.lifetimeMax.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                 </div>
              </section>
          )}

        </div>
        
        {/* Footer Link */}
        <div className="mt-12 mb-4">
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
