import React, { useState, useEffect } from 'react';
import type { Application } from '../types';
import { useTranslation } from 'react-i18next';

interface SubmissionSuccessPageProps {
  application: Application;
  onGoToProfile: () => void;
}

const SubmissionSuccessPage: React.FC<SubmissionSuccessPageProps> = ({ application, onGoToProfile }) => {
  const { t } = useTranslation();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsButtonDisabled(false);
    }, 3000); // 3-second delay for data propagation

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
      <div className="w-full max-w-2xl bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] p-6 sm:p-8 md:p-10 rounded-lg shadow-lg">
        <svg className="w-12 h-12 sm:w-16 sm:h-16 text-[var(--theme-gradient-end)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
          {t('submissionSuccessPage.title')}
        </h1>
        <p className="text-white mb-2">{t('submissionSuccessPage.body1')}</p>
        <div className="bg-[var(--theme-bg-primary)] border border-[var(--theme-border)] rounded-md px-4 py-2 my-4 sm:my-6 inline-block">
          <p className="text-white opacity-80 text-sm">{t('submissionSuccessPage.appIdLabel')}</p>
          <p className="text-white font-mono text-lg">{application.id}</p>
        </div>
        <p className="text-white max-w-sm mx-auto mb-6 sm:mb-8">
          {t('submissionSuccessPage.body2')}
        </p>
        <button
          onClick={onGoToProfile}
          disabled={isButtonDisabled}
          className="w-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-wait flex justify-center items-center h-12"
        >
          {isButtonDisabled ? (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          ) : (
            t('submissionSuccessPage.goToProfileButton')
          )}
        </button>
      </div>
    </div>
  );
};

export default SubmissionSuccessPage;