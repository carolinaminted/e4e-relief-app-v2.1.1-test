
import React from 'react';
import type { Page } from '../types';
import { useTranslation } from 'react-i18next';

interface SupportPageProps {
  navigate: (page: Page) => void;
}

const SupportPage: React.FC<SupportPageProps> = ({ navigate }) => {
  const { t } = useTranslation();
  
  const SubActionCard: React.FC<{ title: string; description: string; onClick: () => void; }> = ({ title, description, onClick }) => (
    <div 
      className="bg-[var(--theme-bg-secondary)] p-6 rounded-lg shadow-lg hover:opacity-90 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
      onClick={onClick}
    >
      <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] mb-2">{title}</h2>
      <p className="text-white text-sm">{description}</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-4 md:mb-8">
          <button onClick={() => navigate('home')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[var(--theme-accent)] hover:opacity-80 transition-opacity" aria-label="Back to Home">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
            {t('supportPage.title')}
          </h1>
        </div>
        
        {/* Main Contact Section */}
        <div className="p-4 md:p-8 max-w-2xl mx-auto">
          <div className="space-y-6 text-center">
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] mb-1">{t('supportPage.emailLabel')}</h3>
              <a href="mailto:support@e4erelief.example" className="font-semibold text-white hover:underline text-lg">support@e4erelief.example</a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] mb-1">{t('supportPage.phoneLabel')}</h3>
              <a href="tel:800-555-0199" className="font-semibold text-white hover:underline text-lg">(800) 555-0199</a>
            </div>
            <div>
              <button 
                onClick={() => navigate('aiApply')}
                className="bg-transparent border border-[var(--theme-accent)] text-[var(--theme-accent)] hover:bg-[var(--theme-accent)]/20 font-semibold py-2 px-6 rounded-md transition-colors duration-200"
              >
                {t('supportPage.chatbotButton')}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">{t('supportPage.chatbotDisclaimer')}</p>
        </div>

        {/* Secondary Tiles */}
        <div className="grid grid-cols-2 gap-6 w-full mt-8 md:mt-12 max-w-2xl mx-auto">
          <SubActionCard 
            title={t('supportPage.faqTitle')}
            description={t('supportPage.faqDescription')} 
            onClick={() => navigate('faq')} 
          />
          <SubActionCard 
            title={t('supportPage.paymentsTitle')} 
            description={t('supportPage.paymentsDescription')}
            onClick={() => navigate('paymentOptions')} 
          />
        </div>
        
      </div>
    </div>
  );
};

export default SupportPage;
