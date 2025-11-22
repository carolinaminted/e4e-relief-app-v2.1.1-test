import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TermsModal from './TermsModal';
import type { ApplicationFormData } from '../types';
import RequiredIndicator from './RequiredIndicator';

interface ApplyTermsPageProps {
  formData: ApplicationFormData['agreementData'];
  updateFormData: (data: Partial<ApplicationFormData['agreementData']>) => void;
  prevStep: () => void;
  onSubmit: () => Promise<void>;
}

const ApplyTermsPage: React.FC<ApplyTermsPageProps> = ({ formData, updateFormData, prevStep, onSubmit }) => {
  const { t } = useTranslation();
  const [termsViewed, setTermsViewed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const yes = t('common.yes');
  const no = t('common.no');

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setTermsViewed(true);
  };

  const handleUpdate = (data: Partial<ApplicationFormData['agreementData']>) => {
    updateFormData(data);
    if(error) setError('');
  };
  
  const handleFinalSubmit = async () => {
    if (formData.shareStory === null) {
      setError(t('applyTermsPage.errorShareStory'));
      return;
    }
    if (formData.receiveAdditionalInfo === null) {
      setError(t('applyTermsPage.errorAdditionalInfo'));
      return;
    }
    if (!termsAgreed) {
      setError(t('applyTermsPage.errorTermsAgreed'));
      return;
    }
    setError('');
    setIsSubmitting(true);
    await onSubmit();
    // On success, the app will navigate away, so no need to reset loading state
  };

  return (
    <div className="space-y-8 p-8">
      <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] text-center">{t('applyTermsPage.title')}</h2>
      
      {/* Share Your Story Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('applyTermsPage.shareStoryTitle')}</h3>
        <div>
          <label className="flex items-center text-white mb-2">
            {t('applyTermsPage.shareStoryQuestion')}
            <RequiredIndicator required isMet={formData.shareStory !== null} />
            </label>
          <p className="text-xs text-gray-400 mb-2 italic">{t('applyTermsPage.shareStoryDisclaimer')}</p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="shareStory" checked={formData.shareStory === true} onChange={() => handleUpdate({ shareStory: true })} className="form-radio h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 focus:ring-[var(--theme-accent)]" />
              <span className="ml-2 text-white">{yes}</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="shareStory" checked={formData.shareStory === false} onChange={() => handleUpdate({ shareStory: false })} className="form-radio h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 focus:ring-[var(--theme-accent)]" />
              <span className="ml-2 text-white">{no}</span>
            </label>
          </div>
        </div>
        <div>
          <label className="flex items-center text-white mb-2">
            {t('applyTermsPage.additionalInfoQuestion')}
            <RequiredIndicator required isMet={formData.receiveAdditionalInfo !== null} />
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="receiveInfo" checked={formData.receiveAdditionalInfo === true} onChange={() => handleUpdate({ receiveAdditionalInfo: true })} className="form-radio h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 focus:ring-[var(--theme-accent)]" />
              <span className="ml-2 text-white">{yes}</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="radio" name="receiveInfo" checked={formData.receiveAdditionalInfo === false} onChange={() => handleUpdate({ receiveAdditionalInfo: false })} className="form-radio h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 focus:ring-[var(--theme-accent)]" />
              <span className="ml-2 text-white">{no}</span>
            </label>
          </div>
        </div>
      </section>

      {/* Terms of Acceptance Section */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('applyTermsPage.termsTitle')}</h3>
        <div className="flex items-start">
          <input 
            id="terms" 
            type="checkbox" 
            checked={termsAgreed}
            onChange={(e) => {
                setTermsAgreed(e.target.checked)
                if (error) setError('');
            }}
            disabled={!termsViewed}
            className="h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 rounded focus:ring-[var(--theme-accent)] mt-1 disabled:opacity-50 disabled:cursor-not-allowed" 
          />
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className={`text-white ${!termsViewed ? 'opacity-60': ''}`}>
              {t('applyTermsPage.termsCheckboxLabel')}
            </label>
            <div className="mt-1 flex items-center">
              <button type="button" onClick={handleOpenModal} className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] hover:opacity-80 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--theme-bg-secondary)] focus:ring-[var(--theme-accent)] rounded">
                {t('applyTermsPage.termsLink')}
              </button>
              <span className="text-white">.</span>
              <RequiredIndicator required isMet={termsAgreed} />
            </div>
            {!termsViewed && <p className="text-xs text-yellow-400 mt-1 italic">{t('applyTermsPage.termsViewNotice')}</p>}
          </div>
        </div>
      </section>
      
      {error && <p className="text-red-400 text-sm pt-2">{error}</p>}
      
      <div className="flex justify-between pt-4">
        <button onClick={prevStep} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200">
          {t('common.back')}
        </button>
        <button 
          onClick={handleFinalSubmit}
          disabled={!termsAgreed || isSubmitting}
          className="w-48 bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-3 px-6 rounded-md transition-colors duration-200 flex justify-center items-center h-12 disabled:bg-[#898c8d] disabled:cursor-wait"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          ) : (
            t('applyTermsPage.submitButton')
          )}
        </button>
      </div>

      {isModalOpen && <TermsModal onClose={handleModalClose} />}
    </div>
  );
};

export default ApplyTermsPage;