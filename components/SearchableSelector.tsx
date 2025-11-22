
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import RequiredIndicator from './RequiredIndicator';

interface SearchableSelectorProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onUpdate: (value: string) => void;
  required?: boolean;
  variant?: 'boxed' | 'underline';
  error?: string;
  disabled?: boolean;
}

const SearchableSelector: React.FC<SearchableSelectorProps> = ({ id, label, value, options, onUpdate, required, variant = 'boxed', error, disabled }) => {
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

  const filteredOptions = useMemo(() => {
    if (!searchTerm || isMobile) {
      return options;
    }
    return options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, options, isMobile]);

  const handleSelect = (option: string) => {
    setSearchTerm(option);
    onUpdate(option);
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
            const foundOption = options.find(option => option.toLowerCase() === searchTerm.toLowerCase());
            if (foundOption) {
                // A valid option was typed, possibly with different casing.
                if (foundOption !== value) {
                    // Update parent with the correctly cased value from the options list.
                    onUpdate(foundOption);
                }
                // Also, update the local search term to reflect the correct casing.
                setSearchTerm(foundOption);
            } else {
                // Revert to the last valid value from the parent if the typed text is not a match.
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
  }, [wrapperRef, searchTerm, value, options, onUpdate, isMobile]);
  
  const baseInputClasses = "w-full text-base text-white focus:outline-none focus:ring-0";
  const variantClasses = {
      boxed: `bg-[var(--theme-border)] border rounded-md p-2 ${error ? 'border-red-500' : 'border-[var(--theme-border)]'}`,
      underline: `bg-transparent border-0 border-b p-2 ${error ? 'border-red-500' : 'border-[var(--theme-border)] focus:border-[var(--theme-accent)]'}`
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label htmlFor={id} className="flex items-center text-sm font-medium text-white mb-1">
        {label} <RequiredIndicator required={required} isMet={!!value} />
      </label>
      <input
        id={id}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        readOnly={isMobile}
        className={`${baseInputClasses} ${variantClasses[variant]} disabled:opacity-60 disabled:cursor-not-allowed`}
        autoComplete="off"
        required={required}
        disabled={disabled}
      />
      {isOpen && !disabled && (
        <ul className="absolute z-10 w-full bg-[var(--theme-bg-primary)] border border-[var(--theme-border)] rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <li
                key={option}
                onClick={() => handleSelect(option)}
                className="px-4 py-2 text-white cursor-pointer hover:bg-[var(--theme-border)]"
              >
                {option}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-gray-400">{t('formControls.noOptionsFound')}</li>
          )}
        </ul>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default SearchableSelector;
