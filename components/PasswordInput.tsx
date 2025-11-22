import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeIcon, EyeSlashIcon } from './Icons';

// Inherit all standard input element attributes for full compatibility
type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

const PasswordInput: React.FC<PasswordInputProps> = ({ label, id, ...props }) => {
  const { t } = useTranslation();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const toggleVisibility = () => {
    setIsPasswordVisible(prevState => !prevState);
  };

  const labelText = isPasswordVisible ? "Hide password" : "Show password";

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPasswordVisible ? 'text' : 'password'}
          className="w-full bg-transparent border-0 border-b border-[#005ca0] p-2 text-base text-white focus:outline-none focus:ring-0 focus:border-[#ff8400] pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute inset-y-0 right-0 flex items-center p-2 text-gray-400 hover:text-white transition-colors duration-200"
          aria-label={labelText}
          aria-pressed={isPasswordVisible}
        >
          {isPasswordVisible ? (
            <EyeSlashIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;