
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Address, UserProfile } from '../types';
import RequiredIndicator from './RequiredIndicator';
import CountrySelector from './CountrySelector';
import AddressHelper from './AddressHelper';

export const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, required?: boolean, error?: string }> = ({ label, id, required, error, onClick, ...props }) => {
    
    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
        if (props.type === 'date') {
            try {
                // showPicker is supported in modern browsers
                if ('showPicker' in e.currentTarget) {
                    (e.currentTarget as any).showPicker();
                }
            } catch (err) {
                // Ignore errors if showPicker fails or is not supported
                console.debug('showPicker not supported', err);
            }
        }
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <div>
            {label && (
                <label htmlFor={id} className="flex items-center text-sm font-medium text-white mb-1">
                    {label} <RequiredIndicator required={required} isMet={!!props.value} />
                </label>
            )}
            <input
                id={id}
                onClick={handleClick}
                {...props}
                className={`w-full bg-transparent border-0 border-b p-2 text-base text-white focus:outline-none focus:ring-0 ${error ? 'border-red-500' : 'border-[var(--theme-border)] focus:border-[var(--theme-accent)]'} disabled:bg-transparent disabled:border-b disabled:border-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed`}
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
    );
};

export const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string, required?: boolean, error?: string }> = ({ label, id, required, error, ...props }) => (
    <div>
        <label htmlFor={id} className="flex items-center text-sm font-medium text-white mb-1">
            {label} <RequiredIndicator required={required} isMet={!!props.value} />
        </label>
        <textarea id={id} {...props} className={`w-full bg-transparent border-0 border-b p-2 text-white focus:outline-none focus:ring-0 ${error ? 'border-red-500' : 'border-[var(--theme-border)] focus:border-[var(--theme-accent)]'}`} />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

export const FormRadioGroup: React.FC<{ legend: string, name: string, options: string[], value: string, onChange: (value: any) => void, required?: boolean, error?: string }> = ({ legend, name, options, value, onChange, required, error }) => (
    <div>
        <p className={`flex items-center text-sm font-medium text-white mb-1 ${error ? 'text-red-400' : ''}`}>
            {legend} <RequiredIndicator required={required} isMet={!!value} />
        </p>
        <div className="flex gap-4 mt-2">
            {options.map(option => (
                <label key={option} className="flex items-center cursor-pointer">
                    <input type="radio" name={name} value={option} checked={value === option} onChange={(e) => onChange(e.target.value)} className="form-radio h-4 w-4 text-[var(--theme-accent)] bg-gray-700 border-gray-600 focus:ring-[var(--theme-accent)]" />
                    <span className="ml-2 text-white">{option}</span>
                </label>
            ))}
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

export const AddressFields: React.FC<{ address: Address, onUpdate: (field: keyof Address, value: string) => void, onBulkUpdate: (parsedAddress: Partial<Address>) => void, prefix: string, errors: Record<string, string>, forUser?: UserProfile | null }> = ({ address, onUpdate, onBulkUpdate, prefix, errors, forUser }) => {
    const { t } = useTranslation();
    return (
        <>
            <AddressHelper onAddressParsed={onBulkUpdate} variant="underline" forUser={forUser} />
            <CountrySelector id={`${prefix}Country`} required value={address.country} onUpdate={value => onUpdate('country', value)} variant="underline" error={errors.country}/>
            <FormInput label={t('formControls.street1')} id={`${prefix}Street1`} required value={address.street1} onChange={e => onUpdate('street1', e.target.value)} error={errors.street1} />
            <div className="grid grid-cols-2 gap-x-6">
                <FormInput label={t('formControls.street2')} id={`${prefix}Street2`} value={address.street2 || ''} onChange={e => onUpdate('street2', e.target.value)} />
                <FormInput label={t('formControls.city')} id={`${prefix}City`} required value={address.city} onChange={e => onUpdate('city', e.target.value)} error={errors.city} />
            </div>
            <div className="grid grid-cols-2 gap-x-6">
                <FormInput label={t('formControls.state')} id={`${prefix}State`} required value={address.state} onChange={e => onUpdate('state', e.target.value)} error={errors.state} />
                <FormInput label={t('formControls.zip')} id={`${prefix}Zip`} required value={address.zip} onChange={e => onUpdate('zip', e.target.value)} error={errors.zip} />
            </div>
        </>
    );
};
