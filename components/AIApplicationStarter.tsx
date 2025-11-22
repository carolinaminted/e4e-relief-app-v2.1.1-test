import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import type { ApplicationFormData } from '../types';
import { AI_GUARDRAILS } from '../config/aiGuardrails';

interface AIApplicationStarterProps {
  onParse: (description: string) => Promise<void>;
  isLoading: boolean;
  variant?: 'boxed' | 'underline';
}

const AIApplicationStarter: React.FC<AIApplicationStarterProps> = ({ onParse, isLoading, variant = 'boxed' }) => {
  const { t } = useTranslation();
  const [descriptionInput, setDescriptionInput] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleParse = async () => {
    if (!descriptionInput.trim()) {
      setError('Please describe your situation to get started.'); // Internal-facing, not translated
      return;
    }
    setError('');
    setIsSuccess(false);
    try {
      await onParse(descriptionInput);
      setDescriptionInput(''); 
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000); // Clear after 5 seconds
    } catch (e: any) {
      console.error("AIApplicationStarter caught error during parse:", e);
      setError(e.message || t('formControls.aiParseError'));
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptionInput(e.target.value);
    if (error) setError('');
    if (isSuccess) setIsSuccess(false);
  };
  
  const textareaClasses = {
    boxed: "w-full bg-[var(--theme-border)] border border-[var(--theme-border)] rounded-md p-2 text-base text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)]",
    underline: "w-full bg-transparent border-0 border-b border-[var(--theme-border)] p-2 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-[var(--theme-accent)]"
  };
  
  const charsRemaining = AI_GUARDRAILS.MAX_APPLICATION_DESCRIPTION_CHARS - descriptionInput.length;
  const isNearLimit = charsRemaining < 200;

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="w-full bg-transparent border-2 border-dashed border-[var(--theme-border)] text-[var(--theme-accent)] font-semibold py-4 px-4 rounded-md hover:bg-[var(--theme-border)]/50 hover:border-solid transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <span>{t('formControls.letAIFill')}</span>
      </button>
    );
  }

  return (
    <div className="bg-[var(--theme-bg-primary)]/50 p-4 rounded-lg border border-[var(--theme-border)]">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-white">
          {t('formControls.aiStarter')}
        </p>
        <button type="button" onClick={() => setIsExpanded(false)} className="text-xs text-gray-400 hover:text-white transition-colors">
          Collapse
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row md:items-end gap-2">
            <textarea
            id="ai-starter-input"
            value={descriptionInput}
            onChange={handleInputChange}
            placeholder={t('formControls.aiStarterPlaceholder')}
            rows={6}
            maxLength={AI_GUARDRAILS.MAX_APPLICATION_DESCRIPTION_CHARS}
            className={textareaClasses[variant]}
            disabled={isLoading}
            />
            <button
            type="button"
            onClick={handleParse}
            disabled={isLoading || !descriptionInput.trim()}
            className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-wait min-w-[80px] flex items-center justify-center h-10 md:h-auto"
            >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                t('formControls.submitDescription')
            )}
            </button>
        </div>
        <div className={`text-xs text-right ${isNearLimit ? 'text-orange-300' : 'text-gray-400'}`}>
            {descriptionInput.length}/{AI_GUARDRAILS.MAX_APPLICATION_DESCRIPTION_CHARS}
        </div>
      </div>
      {error && <p className="text-red-400 text-xs mt-2" role="alert">{error}</p>}
      {isSuccess && <p className="text-green-400 text-xs mt-2" role="status">{t('formControls.aiSuccess')}</p>}
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

export default AIApplicationStarter;