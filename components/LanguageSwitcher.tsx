
import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_LABELS } from '../data/appData';

interface LanguageSwitcherProps {
  // Defines the visual style of the switcher.
  variant?: 'header' | 'sideNav';
  // List of supported language codes (e.g. ['en', 'es', 'ja'])
  supportedLanguages?: string[];
}

/**
 * A reusable component that allows the user to switch the application's language.
 * It uses the `i18n` instance from `react-i18next` to change the language globally.
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'header', supportedLanguages }) => {
  const { i18n } = useTranslation();

  // Default to English if no supported languages are provided or array is empty
  const languages = supportedLanguages && supportedLanguages.length > 0 ? supportedLanguages : ['en'];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const activeClasses = 'font-bold text-[var(--theme-accent)]';
  const inactiveClasses = 'text-gray-300 hover:text-white';
  const baseClasses = 'px-2 py-1 text-sm transition-colors';

  // If only one language is supported, we don't need to render the switcher.
  if (languages.length <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center flex-wrap ${variant === 'sideNav' ? 'justify-center gap-2' : ''}`}>
      {languages.map((lang, index) => (
        <React.Fragment key={lang}>
          <button
            onClick={() => changeLanguage(lang)}
            className={`${baseClasses} ${i18n.language.startsWith(lang) ? activeClasses : inactiveClasses}`}
            aria-pressed={i18n.language.startsWith(lang)}
          >
            {/* For SideNav/Header toggles, we often want short codes like EN/ES, 
                but for Japanese 'JA' might be less common than characters. 
                We will use the abbreviated code in uppercase. */}
            {lang.toUpperCase()}
          </button>
          {/* Add separator if it's not the last item */}
          {index < languages.length - 1 && (
            <div className="h-4 w-px bg-gray-500 mx-1"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
