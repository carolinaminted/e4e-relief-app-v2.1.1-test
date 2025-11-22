import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TermsModal from './TermsModal';
import type { ApplicationFormData } from '../types';
import RequiredIndicator from './RequiredIndicator';

interface AIApplyAgreementsProps {
  formData: ApplicationFormData['agreementData'];
  updateFormData: (data: Partial<ApplicationFormData['agreementData']>) => void;
  onSubmit: () => Promise<void>;
  disabled?: boolean;
}

const AIApplyAgreements: React.FC<AIApplyAgreementsProps> = ({ formData, updateFormData, onSubmit, disabled = false }) => {
  const { t } = useTranslation();
  const [termsViewed, setTermsViewed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const yes = t('common.yes');
  const no = t('common.no');

  const handleOpenModal = () => setIsModalOpen(true);
  
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
    // On success, the app will navigate away.
  };

  return (
    <div className="p-3 space-y-6">
      <section className="space-y-4">
        <div>
          <label className="flex items-center text-white mb-2 text-sm">
            {t('applyTermsPage.shareStoryQuestion')}
            <RequiredIndicator required isMet={formData.shareStory !== null} />
          </label>
          <p className="text-xs text-gray-400 mb-2 italic">{t('applyTermsPage.shareStoryDisclaimer')}</p>
          <div className="flex gap-4">
            <label className={`flex items-center text-sm ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input type="radio" name="shareStory" checked={formData.shareStory === true} onChange={() => handleUpdate({ shareStory: true })} disabled={disabled} className="form-radio h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 focus:ring-[var(--theme-accent)] disabled:cursor-not-allowed" />
              <span className="ml-2 text-white">{yes}</span>
            </label>
            <label className={`flex items-center text-sm ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input type="radio" name="shareStory" checked={formData.shareStory === false} onChange={() => handleUpdate({ shareStory: false })} disabled={disabled} className="form-radio h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 focus:ring-[var(--theme-accent)] disabled:cursor-not-allowed" />
              <span className="ml-2 text-white">{no}</span>
            </label>
          </div>
        </div>
        <div>
          <label className="flex items-center text-white mb-2 text-sm">
            {t('applyTermsPage.additionalInfoQuestion')}
            <RequiredIndicator required isMet={formData.receiveAdditionalInfo !== null} />
          </label>
          <div className="flex gap-4">
            <label className={`flex items-center text-sm ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input type="radio" name="receiveInfo" checked={formData.receiveAdditionalInfo === true} onChange={() => handleUpdate({ receiveAdditionalInfo: true })} disabled={disabled} className="form-radio h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 focus:ring-[var(--theme-accent)] disabled:cursor-not-allowed" />
              <span className="ml-2 text-white">{yes}</span>
            </label>
            <label className={`flex items-center text-sm ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
              <input type="radio" name="receiveInfo" checked={formData.receiveAdditionalInfo === false} onChange={() => handleUpdate({ receiveAdditionalInfo: false })} disabled={disabled} className="form-radio h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 focus:ring-[var(--theme-accent)] disabled:cursor-not-allowed" />
              <span className="ml-2 text-white">{no}</span>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-start">
          <input 
            id="terms" 
            type="checkbox" 
            checked={termsAgreed}
            onChange={(e) => {
                setTermsAgreed(e.target.checked)
                if (error) setError('');
            }}
            disabled={!termsViewed || disabled}
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
      
      {error && <p className="text-red-400 text-sm pt-2 text-center">{error}</p>}
      
      <div className="flex justify-center pt-2">
        <button 
          onClick={handleFinalSubmit}
          disabled={!termsAgreed || isSubmitting || disabled}
          className="w-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-3 px-6 rounded-md transition-colors duration-200 flex justify-center items-center h-12 disabled:bg-gray-600 disabled:cursor-wait"
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

export default AIApplyAgreements;