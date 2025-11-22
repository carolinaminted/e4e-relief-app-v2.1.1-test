
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { countries } from '../data/countries';
import RequiredIndicator from './RequiredIndicator';

interface CountrySelectorProps {
  id: string;
  value: string;
  onUpdate: (value: string) => void;
  required?: boolean;
  variant?: 'boxed' | 'underline';
  error?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ id, value, onUpdate, required, variant = 'boxed', error }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm || isMobile) {
      return countries;
    }
    return countries.filter(country =>
      country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, isMobile]);

  const handleSelectCountry = (country: string) => {
    setSearchTerm(country);
    onUpdate(country);
    setIsOpen(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMobile) return;
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // When clicking away, check if the current input is a valid option (case-insensitive).
        // If it is, ensure the parent state is updated with the correctly cased version.
        // If it's not, revert the input to the last valid value from the parent.
        if (!isMobile) {
          const foundCountry = countries.find(c => c.toLowerCase() === searchTerm.toLowerCase());
          if (foundCountry) {
              if (foundCountry !== value) {
                  onUpdate(foundCountry);
              }
              // also update the local state to have the correct casing
              setSearchTerm(foundCountry);
          } else {
              setSearchTerm(value);
          }
        } else {
          setSearchTerm(value);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef, searchTerm, value, onUpdate, isMobile]);
  
  const baseInputClasses = "w-full text-base text-white focus:outline-none focus:ring-0";
  const variantClasses = {
      boxed: `bg-[var(--theme-border)] border rounded-md p-2 ${error ? 'border-red-500' : 'border-[var(--theme-border)]'}`,
      underline: `bg-transparent border-0 border-b p-2 ${error ? 'border-red-500' : 'border-[var(--theme-border)] focus:border-[var(--theme-accent)]'}`
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={id} className="flex items-center text-sm font-medium text-white mb-1">
        {t('formControls.location')} <RequiredIndicator required={required} isMet={!!value} />
      </label>
      <input
        id={id}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        readOnly={isMobile}
        className={`${baseInputClasses} ${variantClasses[variant]}`}
        autoComplete="off"
        required={required}
      />
      {isOpen && (
        <ul className="absolute z-10 w-full bg-[var(--theme-bg-primary)] border border-[var(--theme-border)] rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg custom-scrollbar">
          {filteredCountries.length > 0 ? (
            filteredCountries.map(country => (
              <li
                key={country}
                onClick={() => handleSelectCountry(country)}
                className="px-4 py-2 text-white cursor-pointer hover:bg-[var(--theme-border)]"
              >
                {country}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-400">{t('formControls.noCountriesFound')}</li>
          )}
        </ul>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default CountrySelector;
