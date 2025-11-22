import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Application, UserProfile, ApplicationFormData, EventData } from '../types';
import type { Fund } from '../data/fundData';
import ApplyProxyContactPage from './ApplyProxyContactPage';
import ApplyEventPage from './ApplyEventPage';
import ApplyExpensesPage from './ApplyExpensesPage';
import ApplyTermsPage from './ApplyTermsPage';
import ApplicationDetailModal from './ApplicationDetailModal';

type Page = 'home' | 'fundPortal' | 'profile';

interface ProxyApplyPageProps {
  navigate: (page: Page) => void;
  onSubmit: (formData: ApplicationFormData) => Promise<void>;
  proxyApplications: Application[];
  userProfile: UserProfile; // This is the admin's profile
  onAddIdentity: (fundCode: string) => void;
  mainRef: React.RefObject<HTMLElement>;
  activeFund: Fund | null;
}

const statusStyles: Record<Application['status'], string> = {
    Submitted: 'text-[#ff8400]',
    Awarded: 'text-[#edda26]',
    Declined: 'text-red-400',
};

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const ProxyPage: React.FC<ProxyApplyPageProps> = ({ navigate, onSubmit, proxyApplications, userProfile, onAddIdentity, mainRef, activeFund }) => {
    const [step, setStep] = useState(1);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(() => {
        const saved = localStorage.getItem('proxyPage_isHistoryOpen');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('proxyPage_isHistoryOpen', JSON.stringify(isHistoryOpen));
    }, [isHistoryOpen]);

    const [formData, setFormData] = useState<ApplicationFormData>(() => {
        const blankProfile: UserProfile = {
            uid: '',
            activeIdentityId: null,
            identityId: '',
            firstName: '',
            lastName: '',
            email: '',
            mobileNumber: '',
            primaryAddress: { country: '', street1: '', city: '', state: '', zip: '' },
            employmentStartDate: '',
            eligibilityType: '',
            householdIncome: '',
            householdSize: '',
            homeowner: '',
            isMailingAddressSame: null,
            ackPolicies: false,
            commConsent: false,
            infoCorrect: false,
            fundCode: '',
            classVerificationStatus: 'pending',
            eligibilityStatus: 'Not Eligible',
            role: 'User',
        };

        const blankEvent: EventData = {
            event: '',
            otherEvent: '',
            eventDate: '',
            evacuated: '',
            evacuatingFromPrimary: '',
            evacuationReason: '',
            stayedWithFamilyOrFriend: '',
            evacuationStartDate: '',
            evacuationNights: '',
            powerLoss: '',
            powerLossDays: '',
            additionalDetails: '',
            requestedAmount: 0,
            expenses: [],
        };

        return {
            profileData: blankProfile,
            eventData: blankEvent,
            agreementData: {
                shareStory: null,
                receiveAdditionalInfo: null,
            },
        };
    });
    
    const sortedApplicationsForDisplay = useMemo(() => {
        return [...proxyApplications].reverse();
    }, [proxyApplications]);

    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo(0, 0);
        }
    }, [step, mainRef]);

    const nextStep = () => {
        setStep(prev => prev + 1);
    };
    const prevStep = () => {
        setStep(prev => prev - 1);
    };

    const updateProfileData = useCallback((newData: Partial<UserProfile>) => {
      setFormData(prev => ({ 
          ...prev, 
          profileData: { ...prev.profileData, ...newData } 
      }));
    }, []);
    
    const updateEventData = useCallback((newData: Partial<EventData>) => {
      setFormData(prev => ({
          ...prev,
          eventData: { ...prev.eventData, ...newData }
      }));
    }, []);

    const updateAgreementData = useCallback((newData: Partial<ApplicationFormData['agreementData']>) => {
      setFormData(prev => ({
          ...prev,
          agreementData: { ...prev.agreementData, ...newData }
      }));
    }, []);
    
    const handleAIParsedData = (parsedData: Partial<ApplicationFormData>) => {
        setFormData(prev => {
            const newProfileData = parsedData.profileData ? {
                ...prev.profileData,
                ...parsedData.profileData,
                primaryAddress: { ...prev.profileData.primaryAddress, ...(parsedData.profileData.primaryAddress || {}) },
                mailingAddress: { ...(prev.profileData.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }), ...(parsedData.profileData.mailingAddress || {})},
            } : prev.profileData;

            const newEventData = parsedData.eventData ? { ...prev.eventData, ...parsedData.eventData } : prev.eventData;

            return { ...prev, profileData: newProfileData, eventData: newEventData };
        });
    };

    const handleFinalSubmit = async () => {
        await onSubmit(formData);
    };

    const renderStep = () => {
        switch(step) {
            case 1:
                return <ApplyProxyContactPage 
                            formData={formData.profileData} 
                            updateFormData={updateProfileData} 
                            nextStep={nextStep} 
                            onAIParsed={handleAIParsedData} 
                        />;
            case 2:
                return <ApplyEventPage formData={formData.eventData} updateFormData={updateEventData} nextStep={nextStep} prevStep={prevStep} activeFund={activeFund} />;
            case 3:
                return <ApplyExpensesPage userProfile={formData.profileData} formData={formData.eventData} updateFormData={updateEventData} nextStep={nextStep} prevStep={prevStep} />;
            case 4:
                return <ApplyTermsPage formData={formData.agreementData} updateFormData={updateAgreementData} prevStep={prevStep} onSubmit={handleFinalSubmit} />;
            default:
                // Should not happen, but reset to step 1 as a fallback
                setStep(1);
                return null;
        }
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
            <div className="relative flex justify-center items-center mb-8">
                <button onClick={() => navigate('fundPortal')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                </button>
                 <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Proxy Application</h1>
                    {userProfile && (
                        <div className="mt-2 flex flex-col items-center gap-2">
                            <p className="text-lg text-gray-300">{userProfile.fundName} ({userProfile.fundCode})</p>
                        </div>
                    )}
                </div>
            </div>

            {step === 1 && (
                <section className="border border-[#005ca0] bg-[#003a70]/30 rounded-lg pb-4 mb-8">
                    <button type="button" onClick={() => setIsHistoryOpen(p => !p)} className="w-full flex justify-between items-center text-left p-4" aria-expanded={isHistoryOpen}>
                        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">My Proxy Submissions</h2>
                        <ChevronIcon isOpen={isHistoryOpen} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out ${isHistoryOpen ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible px-4' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="space-y-4">
                        {proxyApplications.length > 0 ? (
                            sortedApplicationsForDisplay.map(app => (
                            <button key={app.id} onClick={() => setSelectedApplication(app)} className="w-full text-left bg-[#004b8d] p-4 rounded-md flex justify-between items-center hover:bg-[#005ca0]/50 transition-colors duration-200">
                                <div>
                                    <p className="font-bold text-md text-white">{app.profileSnapshot.firstName} {app.profileSnapshot.lastName}</p>
                                    <p className="text-sm text-gray-300">Event: {app.event}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-md text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">${app.requestedAmount.toFixed(2)}</p>
                                    <p className="text-sm text-gray-300">Status: <span className={`font-medium ${statusStyles[app.status]}`}>{app.status}</span></p>
                                </div>
                            </button>
                            ))
                        ) : (
                            <div className="text-center py-8 bg-[#003a70]/50 rounded-lg">
                                <p className="text-gray-300">You have not submitted any proxy applications yet.</p>
                            </div>
                        )}
                        </div>
                    </div>
                </section>
            )}
            
            <div>
                {renderStep()}
            </div>

            {selectedApplication && (
                <ApplicationDetailModal 
                    application={selectedApplication} 
                    onClose={() => setSelectedApplication(null)} 
                />
            )}
        </div>
    );
};

export default ProxyPage;
