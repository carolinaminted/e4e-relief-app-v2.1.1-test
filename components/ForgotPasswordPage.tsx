import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface ForgotPasswordPageProps {
  onSendResetLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  switchToLogin: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSendResetLink, switchToLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError(t('forgotPasswordPage.errorEmailRequired'));
      return;
    }
    setIsLoading(true);
    setError('');
    // We call the function but don't show specific errors to prevent email enumeration.
    // The success state will be triggered regardless.
    await onSendResetLink(email);
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div>
        <div className="w-full flex justify-center items-center mb-6 sm:mb-8">
            <img 
                src="https://gateway.pinata.cloud/ipfs/bafkreigagdtmj6mbd7wgrimtl2zh3ygorbcvv3cagofbyespbtfmpn2nqy" 
                alt="E4E Relief Logo" 
                className="mx-auto h-32 sm:h-36 w-auto"
            />
        </div>
        <div className="flex justify-center mb-6">
          <LanguageSwitcher supportedLanguages={['en', 'es', 'ja']} />
        </div>
        <div className="text-center">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-2">{t('forgotPasswordPage.title')}</h1>
            {!isSubmitted && <p className="text-gray-300 mb-6">{t('forgotPasswordPage.instruction')}</p>}
        </div>

      {isSubmitted ? (
        <div className="space-y-4 text-center">
            <p className="text-green-300 bg-green-900/50 p-4 rounded-md">{t('forgotPasswordPage.successMessage')}</p>
            <button type="button" onClick={switchToLogin} className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 hover:underline">
                {t('forgotPasswordPage.backToLogin')}
            </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label htmlFor="email-reset" className="block text-sm font-medium text-white mb-2">{t('loginPage.emailLabel')}</label>
            <input
                type="email"
                id="email-reset"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-base text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
                required
                autoComplete="email"
            />
            </div>
            
            <div className="h-6 text-center">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            <button type="submit" className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 !mt-6 h-12 flex justify-center items-center disabled:bg-gray-500" disabled={isLoading}>
            {isLoading ? (
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
            ) : t('forgotPasswordPage.sendButton')}
            </button>
            <p className="text-sm text-center text-white">
                <button type="button" onClick={switchToLogin} className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 hover:underline">
                    {t('forgotPasswordPage.backToLogin')}
                </button>
            </p>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordPage;