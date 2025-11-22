import React, { useState, useEffect, useCallback } from 'react';
// FIX: Use the centralized Page type from types.ts to ensure all navigation values are covered.
import type { UserProfile, Page } from '../types';
import { verifyRoster, linkSSO } from '../services/verificationService';
import { FormInput } from './FormControls';
import { fundsRepo } from '../services/firestoreRepo';
import type { CVType } from '../data/fundData';

interface ClassVerificationPageProps {
  user: UserProfile;
  onVerificationSuccess: () => void;
  onVerificationFailed: (fundCode: string) => void;
  navigate: (page: Page) => void;
  verifyingFundCode: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
    </div>
);

// --- Sub-components for each verification method ---

interface DomainVerificationViewProps {
    user: UserProfile;
    fundCode: string;
    onVerified: () => void;
    navigate: (page: Page) => void;
    onVerificationFailure: (error: string) => void;
}
const DomainVerificationView: React.FC<DomainVerificationViewProps> = ({ user, fundCode, onVerified, navigate, onVerificationFailure }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleDomainCheck = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const fund = await fundsRepo.getFund(fundCode);
            if (!fund || !fund.domainConfig) {
                const msg = "No domain configuration found for this fund.";
                setError(msg);
                onVerificationFailure(msg);
                return;
            }
            const userDomain = user.email.split('@')[1];
            if (fund.domainConfig.allowedDomains.map(d => d.toLowerCase()).includes(userDomain.toLowerCase())) {
                setIsVerified(true);
                // Wait a bit to show success before calling callback which will navigate away
                setTimeout(onVerified, 1000);
            } else {
                const msg = `Your email domain (${userDomain}) is not eligible for this fund.`;
                setError(msg);
                onVerificationFailure(msg);
            }
        } catch (e: any) {
            onVerificationFailure(e.message || 'Could not verify domain.');
        } finally {
            setIsLoading(false);
        }
    }, [user, fundCode, onVerified, onVerificationFailure]);
    
    useEffect(() => {
        handleDomainCheck();
    }, [handleDomainCheck]);

    return (
        <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-white">Verifying with Company Email Domain</h3>
            <p className="text-gray-300 mb-6">We are checking if your email <span className="font-bold text-white">{user.email}</span> belongs to an approved domain for fund code <span className="font-bold text-white">{fundCode}</span>.</p>
            {isLoading && <div className="h-8"><LoadingSpinner /></div>}
            
            {error && (
                <div className="mt-4 space-y-4">
                    <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>
                    <button 
                        onClick={() => navigate('profile')}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
                    >
                        Back to Profile
                    </button>
                    <p className="text-gray-300 text-sm">
                       Your email domain is not eligible for automatic verification. You can contact support if you believe this is an error.
                    </p>
                </div>
            )}

            {isVerified && <p className="text-green-400 bg-green-900/50 p-3 rounded-md">Domain verified! Redirecting...</p>}
        </div>
    );
};


interface RosterVerificationViewProps {
    user: UserProfile;
    fundCode: string;
    onVerified: () => void;
    navigate: (page: Page) => void;
    onVerificationFailure: (error: string) => void;
    attempts: number;
    maxAttempts: number;
}
const RosterVerificationView: React.FC<RosterVerificationViewProps> = ({ user, fundCode, onVerified, navigate, onVerificationFailure, attempts, maxAttempts }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ employeeId: '', birthMonth: '', birthDay: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.id]: e.target.value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const result = await verifyRoster({
                employeeId: formData.employeeId,
                birthMonth: parseInt(formData.birthMonth, 10),
                birthDay: parseInt(formData.birthDay, 10),
            }, fundCode);
            if (result.ok) {
                onVerified();
            } else {
                const msg = 'The details provided do not match our records. Please try again.';
                setError(msg);
                onVerificationFailure(msg);
            }
        } catch (e) {
            const msg = 'An error occurred during verification. Please try again later.';
            setError(msg);
            onVerificationFailure(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center">
            <h3 className="text-xl font-semibold mb-4 text-white">Verify Your Status</h3>
            <p className="text-gray-300 mb-6">Please enter the following details to verify your status. Attempts remaining: {maxAttempts - attempts}</p>
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <FormInput label="Employee ID" id="employeeId" value={formData.employeeId} onChange={handleChange} required />
                <div className="flex gap-4">
                    <FormInput label="Birth Month (1-12)" type="number" id="birthMonth" value={formData.birthMonth} onChange={handleChange} required min="1" max="12" />
                    <FormInput label="Birth Day (1-31)" type="number" id="birthDay" value={formData.birthDay} onChange={handleChange} required min="1" max="31" />
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" disabled={isLoading} className="w-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 h-12 flex items-center justify-center">
                    {isLoading ? <LoadingSpinner /> : 'Verify'}
                </button>
            </form>
        </div>
    );
};

const SSOVerificationView: React.FC<{ onVerified: () => void, onVerificationFailure: (error: string) => void }> = ({ onVerified, onVerificationFailure }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLink = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await linkSSO();
            if(result.ok) {
                 // Wait a bit to show success before calling callback which will navigate away
                setTimeout(onVerified, 1000);
            } else {
                const msg = 'SSO linking failed. Please try again or use another method.';
                setError(msg);
                onVerificationFailure(msg);
            }
        } catch(e) {
            const msg = 'An error occurred. Please try again.';
            setError(msg);
            onVerificationFailure(msg);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="text-center">
             <h3 className="text-xl font-semibold mb-4 text-white">Verifying with SSO</h3>
             <p className="text-gray-300 mb-6">Click the button below to link your company's SSO account to complete verification. This will open a new window.</p>
             {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
             <button onClick={handleLink} disabled={isLoading} className="w-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 h-12 flex items-center justify-center">
                 {isLoading ? <LoadingSpinner /> : 'Link SSO Account'}
             </button>
        </div>
    );
};


const ClassVerificationPage: React.FC<ClassVerificationPageProps> = ({ user, onVerificationSuccess, onVerificationFailed, navigate, verifyingFundCode }) => {
    const [cvType, setCvType] = useState<CVType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const MAX_ATTEMPTS = 3;
    
    const fundCodeToVerify = verifyingFundCode || user.fundCode;

    useEffect(() => {
        const fetchFundData = async () => {
            setIsLoading(true);
            const fund = await fundsRepo.getFund(fundCodeToVerify);
            if (fund) {
                setCvType(fund.cvType);
            }
            setIsLoading(false);
        };
        fetchFundData();
    }, [fundCodeToVerify]);

    useEffect(() => {
        if (attempts >= MAX_ATTEMPTS) {
            console.log("Max verification attempts reached. Setting status to failed.");
            onVerificationFailed(fundCodeToVerify);
            // The parent component (App.tsx) will now handle the navigation to the relief queue page
            // after the state update has been processed. We don't need to do anything else here.
        }
    }, [attempts, MAX_ATTEMPTS, onVerificationFailed, fundCodeToVerify]);

    const handleVerificationFailure = () => {
        setAttempts(prev => prev + 1);
    };

    const handleLocalVerificationSuccess = () => {
        setIsVerified(true);
    };

    const handleNavigate = () => {
        // This will trigger the logic in App.tsx to create/update identity and navigate
        onVerificationSuccess();
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center h-40 flex items-center justify-center"><LoadingSpinner /></div>;
        }

        if (isVerified) {
            return (
                <div className="text-center pt-4">
                    <svg className="w-16 h-16 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 className="text-2xl font-bold mb-2 text-white">Verification Complete!</h3>
                    <p className="text-white mb-8">You are now eligible to apply for relief for this fund.</p>
                    <div className="mt-8 flex justify-center">
                        <button onClick={handleNavigate} className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-3 px-16 rounded-md transition-colors duration-200">
                            Next
                        </button>
                    </div>
                </div>
            );
        }

        switch (cvType) {
            case 'Domain':
                return <DomainVerificationView user={user} fundCode={fundCodeToVerify} onVerified={handleLocalVerificationSuccess} navigate={navigate} onVerificationFailure={handleVerificationFailure} />;
            case 'Roster':
                return <RosterVerificationView user={user} fundCode={fundCodeToVerify} onVerified={handleLocalVerificationSuccess} navigate={navigate} onVerificationFailure={handleVerificationFailure} attempts={attempts} maxAttempts={MAX_ATTEMPTS} />;
            case 'SSO':
                return <SSOVerificationView onVerified={handleLocalVerificationSuccess} onVerificationFailure={handleVerificationFailure} />;
            default:
                return (
                    <div className="text-center space-y-4">
                        <p className="text-red-400 bg-red-900/50 p-3 rounded-md">
                            Configuration error: The fund code "{fundCodeToVerify}" is not recognized.
                        </p>
                        <button onClick={() => navigate('profile')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md">Back to Profile</button>
                    </div>
                );
        }
    };

   return (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-2xl bg-[var(--theme-bg-primary)] p-8 md:p-12 rounded-lg shadow-2xl border border-[var(--theme-border)]" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
                {renderContent()}
            </div>
        </div>
    );

};

export default ClassVerificationPage;