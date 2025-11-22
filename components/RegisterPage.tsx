import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IAuthClient } from '../services/authClient';
import LanguageSwitcher from './LanguageSwitcher';
import PasswordInput from './PasswordInput';

interface RegisterPageProps {
  onRegister: IAuthClient['register'];
  switchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, switchToLogin }) => {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fundCode, setFundCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoRegister = () => {
    const firstNames = ['Pikachu', 'Charmander', 'Squirtle', 'Bulbasaur', 'Jigglypuff', 'Meowth', 'Psyduck', 'Snorlax', 'Eevee', 'Mewtwo'];
    const lastNames = ['Raichu', 'Charizard', 'Blastoise', 'Venusaur', 'Wigglytuff', 'Persian', 'Golduck', 'Munchlax', 'Vaporeon', 'Mew'];
    const fundCodes = ['DOM', 'ROST', 'SSO'];

    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomFundCode = fundCodes[Math.floor(Math.random() * fundCodes.length)];

    setFirstName(randomFirstName);
    setLastName(randomLastName);
    setEmail(`${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`);
    setPassword('password123');
    setFundCode(randomFundCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !fundCode) {
      setError(t('registerPage.errorAllFields'));
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await onRegister(email, password, firstName, lastName, fundCode);
    if (!result.success) {
      setError(result.error || t('registerPage.errorGeneric'));
      setIsLoading(false);
    }
    // On success, the App component will handle navigation
  };

  return (
    <div>
        <div 
            className="w-full flex justify-center items-center mb-6 sm:mb-8 cursor-pointer"
            onClick={handleDemoRegister}
            title="Click to autofill demo user credentials"
        >
            <img 
                src="https://gateway.pinata.cloud/ipfs/bafkreigagdtmj6mbd7wgrimtl2zh3ygorbcvv3cagofbyespbtfmpn2nqy" 
                alt="E4E Relief Logo" 
                className="mx-auto h-32 sm:h-36 w-auto"
            />
        </div>
        <div className="flex justify-center mb-6">
            <LanguageSwitcher supportedLanguages={['en', 'es', 'ja']} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-4">
            <div className="flex-1">
                <label htmlFor="firstName" className="block text-sm font-medium text-white mb-2">{t('registerPage.firstNameLabel')}</label>
                <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-base text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
                    required
                    autoComplete="given-name"
                />
            </div>
            <div className="flex-1">
                <label htmlFor="lastName" className="block text-sm font-medium text-white mb-2">{t('registerPage.lastNameLabel')}</label>
                <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-base text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
                    required
                    autoComplete="family-name"
                />
            </div>
        </div>
        <div>
            <label htmlFor="email-register" className="block text-sm font-medium text-white mb-2">{t('registerPage.emailLabel')}</label>
            <input
            type="email"
            id="email-register"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-base text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
            required
            autoComplete="email"
            />
        </div>
        <PasswordInput
            label={t('registerPage.passwordLabel')}
            id="password-register"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
        />
        <div>
            <label htmlFor="fundCode" className="block text-sm font-medium text-white mb-2">{t('registerPage.fundCodeLabel')}</label>
            <input
                type="text"
                id="fundCode"
                value={fundCode}
                onChange={(e) => setFundCode(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-base text-white focus:outline-none focus:ring-0 focus:border-[#ff8400]"
                required
                autoComplete="off"
                aria-describedby="fund-code-help"
            />
            <p id="fund-code-help" className="text-xs text-gray-400 mt-1">{t('registerPage.fundCodeHelp')}</p>
        </div>
        <div className="h-6 text-center">
            {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <button type="submit" className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 !mt-4 h-12 flex justify-center items-center disabled:bg-gray-500" disabled={isLoading}>
          {isLoading ? (
             <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          ) : t('registerPage.signUpButton')}
        </button>
        <p className="text-sm text-center text-white">
            {t('registerPage.hasAccount')}{' '}
            <button type="button" onClick={switchToLogin} className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 hover:underline">
            {t('registerPage.signInLink')}
            </button>
        </p>
        </form>
    </div>
  );
};

export default RegisterPage;