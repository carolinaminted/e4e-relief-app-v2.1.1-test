import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ClassVerificationStatus, EligibilityStatus } from '../types';

interface EligibilityIndicatorProps {
  eligibilityStatus: EligibilityStatus;
  cvStatus: ClassVerificationStatus;
  onClick?: () => void;
  className?: string;
}

const EligibilityIndicator: React.FC<EligibilityIndicatorProps> = ({ eligibilityStatus, cvStatus, onClick, className }) => {
    const { t } = useTranslation();
    const isEligible = eligibilityStatus === 'Eligible';

    let text: string;
    let colorClasses: string;
    let icon: React.ReactNode | null = null;

    if (isEligible) {
        text = t('common.eligible', 'Eligible');
        colorClasses = 'bg-green-800/50 text-green-300';
    } else {
        if (cvStatus === 'passed') {
            text = t('common.ineligible', 'Ineligible');
            colorClasses = 'bg-red-800/50 text-red-300';
        } else {
            text = t('applyPage.verificationNeeded', 'Verification Needed');
            colorClasses = 'bg-yellow-800/50 text-yellow-300';
            icon = (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
            );
        }
    }
    
    const baseClasses = "text-xs font-bold px-2.5 py-1 rounded-full flex items-center justify-center gap-1.5 transition-colors";
    
    const content = (
        <>
            {icon}
            <span>{text}</span>
        </>
    );

    if (onClick) {
        return (
            <button
                onClick={onClick}
                aria-label={`Eligibility status: ${text}. Click for details.`}
                className={`${baseClasses} ${colorClasses} hover:opacity-80 ${className || ''}`}
            >
                {content}
            </button>
        );
    }
    
    return (
        <span
            role="status"
            aria-label={`Eligibility status: ${text}`}
            className={`${baseClasses} ${colorClasses} ${className || ''}`}
        >
            {content}
        </span>
    );
};

export default EligibilityIndicator;