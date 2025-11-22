import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { parseAddressWithGemini } from '../services/geminiService';
import type { Address, UserProfile } from '../types';
import { AI_GUARDRAILS } from '../config/aiGuardrails';

interface AddressHelperProps {
  onAddressParsed: (parsedAddress: Partial<Address>) => void;
  variant?: 'boxed' | 'underline';
  forUser?: UserProfile | null;
}

const AddressHelper: React.FC<AddressHelperProps> = ({ onAddressParsed, variant = 'boxed', forUser }) => {
  const { t } = useTranslation();
  const [addressInput, setAddressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleParse = async () => {
    if (!addressInput.trim()) {
      setError('Please enter an address to parse.'); // This is an internal error, not shown to user
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const parsedAddress = await parseAddressWithGemini(addressInput, forUser);
      onAddressParsed(parsedAddress);
      setAddressInput(''); // Clear after successful parse
    } catch (e: any) {
      console.error("Failed to parse address:", e);
      setError(e.message || t('formControls.aiParseError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const textareaClasses = {
    boxed: "w-full bg-[var(--theme-border)] border border-[var(--theme-border)] rounded-md p-2 text-base text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)]",
    underline: "w-full bg-transparent border-0 border-b border-[var(--theme-border)] p-2 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[var(--theme-accent)]"
  };

  if (!isExpanded) {
    return (
        <div className="mb-4">
            <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="w-full bg-transparent border-2 border-dashed border-[var(--theme-border)] text-[var(--theme-accent)] font-semibold py-3 px-4 rounded-md hover:bg-[var(--theme-border)]/50 hover:border-solid transition-all duration-200 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t('formControls.letAIFill')}</span>
            </button>
        </div>
    );
  }

  return (
    <div className="bg-[var(--theme-bg-primary)]/50 p-4 rounded-lg border border-[var(--theme-border)] mb-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs text-white">
          {t('formControls.addressHelper')}
        </p>
         <button type="button" onClick={() => setIsExpanded(false)} className="text-xs text-gray-400 hover:text-white transition-colors">
          Collapse
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-2 items-start">
        <div className="flex-1 w-full">
             <textarea
                id="address-helper-input"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder={t('formControls.addressHelperPlaceholder')}
                rows={2}
                maxLength={AI_GUARDRAILS.MAX_ADDRESS_CHARS}
                className={textareaClasses[variant]}
                disabled={isLoading}
            />
            <div className="text-[10px] text-gray-400 text-right mt-1">
                {addressInput.length}/{AI_GUARDRAILS.MAX_ADDRESS_CHARS}
            </div>
        </div>
        <button
          type="button"
          onClick={handleParse}
          disabled={isLoading || !addressInput.trim()}
          className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-wait min-w-[80px] flex items-center justify-center h-10 md:h-auto"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
             t('common.submit')
          )}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
       <p className="text-xs text-gray-400 italic mt-2 text-center">
            <Trans
              i18nKey="formControls.aiDisclaimer"
              components={{
                1: <a href="https://www.e4erelief.org/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />,
                2: <a href="https://www.e4erelief.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />,
              }}
            />
        </p>
    </div>
  );
};

export default AddressHelper;