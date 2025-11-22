import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  // `HttpBackend` is used to load translation files from a remote source (in this case, from the /public directory).
  .use(HttpBackend)
  // `LanguageDetector` automatically detects the user's language from various sources (e.g., browser settings).
  .use(LanguageDetector)
  // `initReactI18next` integrates i18next with React, enabling features like the `useTranslation` hook.
  .use(initReactI18next)
  .init({
    backend: {
      // Defines the path where translation files are located. `{{lng}}` is a placeholder for the language code (e.g., 'en', 'es').
      loadPath: '/i18n/locales/{{lng}}.json',
    },
    // The default language to use if the detected language is not available.
    fallbackLng: 'en',
    interpolation: {
      // React already handles XSS protection, so we can disable i18next's escaping for performance.
      escapeValue: false, 
    },
    detection: {
      // Defines the order in which to look for the user's language.
      // It will check the browser's language (`navigator`), then the `lang` attribute of the <html> tag, etc.
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      // We disable caching to ensure the language is re-detected on each visit, which is simple for this app.
      caches: [],
    }
  });

export default i18n;
