
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Page = 'support';

interface PaymentOptionsPageProps {
  navigate: (page: Page) => void;
}

const internationalPartners = [
  {
    name: "Convera Guide",
    link: "https://www.e4erelief.org/convera-international-grant-payment-guide",
  },
  {
    name: "Tipalti Guide",
    link: "https://www.e4erelief.org/tipalti-international-grant-payment-guide",
  }
];

const PaymentOptionsPage: React.FC<PaymentOptionsPageProps> = ({ navigate }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8">
      <div className="w-full max-w-3xl mx-auto">
        <div className="relative flex justify-center items-center mb-8">
            <button onClick={() => navigate('support')} className="absolute left-0 z-10 text-[var(--theme-accent)] hover:opacity-80 transition-opacity" aria-label={t('donatePage.backToSupport')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] text-center px-12 brightness-125">
              {t('paymentOptionsPage.title')}
            </h1>
        </div>
        <p className="text-center text-white mb-12 max-w-3xl mx-auto">{t('paymentOptionsPage.description')}</p>
        
        <div className="flex flex-col items-center gap-8">
            {/* US Applicants Section */}
            <div className="w-full bg-[var(--theme-bg-secondary)] p-8 rounded-lg shadow-2xl flex flex-col text-center">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] mb-4">
                    {t('paymentOptionsPage.usApplicantsTitle')}
                </h2>
                <p className="text-white mb-6 max-w-md mx-auto">
                    {t('paymentOptionsPage.usApplicantsBody')}
                </p>
                <a
                    href="https://www.bankofamerica.com/recipient-select/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[var(--theme-bg-primary)] p-4 rounded-lg hover:bg-[var(--theme-bg-primary)]/80 transition-all duration-300 border-2 border-transparent hover:border-[var(--theme-accent)]/50 transform hover:scale-105 font-semibold text-white"
                >
                    {t('paymentOptionsPage.usApplicantsLink')}
                </a>
            </div>
            
            {/* International Applicants Section */}
            <div className="w-full bg-[var(--theme-bg-secondary)] p-8 rounded-lg shadow-2xl flex flex-col">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] mb-4 text-center">
                    {t('paymentOptionsPage.intlApplicantsTitle')}
                </h2>
                
                <div>
                    <h3 className="text-xl font-semibold text-white mt-6 mb-2 text-center">{t('paymentOptionsPage.intlSupportTitle')}</h3>
                    <p className="text-gray-300 text-center" dangerouslySetInnerHTML={{ __html: t('paymentOptionsPage.intlSupportBody', { interpolation: { escapeValue: false } }) }} />

                    <h3 className="text-xl font-semibold text-white mt-8 mb-4 text-center">{t('paymentOptionsPage.intlPartnersTitle')}</h3>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                        {internationalPartners.map(partner => (
                        <a 
                            key={partner.name}
                            href={partner.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            title={`View the ${partner.name}`}
                            className="bg-[var(--theme-bg-primary)] p-4 rounded-lg hover:bg-[var(--theme-bg-primary)]/80 transition-all duration-300 border-2 border-transparent hover:border-[var(--theme-accent)]/50 transform hover:scale-105 font-semibold text-white"
                        >
                            {t(`paymentOptionsPage.${partner.name.split(' ')[0].toLowerCase()}Guide`)}
                        </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsPage;
