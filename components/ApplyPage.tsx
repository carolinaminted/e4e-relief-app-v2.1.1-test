import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserProfile, ApplicationFormData, EventData } from '../types';
import type { Fund } from '../data/fundData';

// Import step components
import ApplyContactPage from './ApplyContactPage';
import ApplyEventPage from './ApplyEventPage';
import ApplyExpensesPage from './ApplyExpensesPage';
import ApplyTermsPage from './ApplyTermsPage';

interface ApplyPageProps {
  navigate: (page: 'home' | 'profile' | 'eligibility' | 'classVerification') => void;
  onSubmit: (application: ApplicationFormData) => Promise<void>;
  userProfile: UserProfile;
  applicationDraft: Partial<ApplicationFormData> | null;
  mainRef: React.RefObject<HTMLElement>;
  canApply: boolean;
  activeFund: Fund | null;
  initialStep?: number;
  onDraftUpdate: (draft: ApplicationFormData) => void;
}

const ApplyPage: React.FC<ApplyPageProps> = ({ navigate, onSubmit, userProfile, applicationDraft, mainRef, canApply, activeFund, initialStep, onDraftUpdate }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(initialStep || 1);
  
  const [formData, setFormData] = useState<ApplicationFormData>(() => {
    const draftProfile: Partial<UserProfile> = applicationDraft?.profileData || {};
    const draftEvent: Partial<EventData> = applicationDraft?.eventData || {};

    const initialProfile = {
      ...userProfile,
      ...draftProfile,
      primaryAddress: {
        ...userProfile.primaryAddress,
        ...(draftProfile.primaryAddress || {}),
      },
      mailingAddress: {
        ...(userProfile.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }),
        ...(draftProfile.mailingAddress || {}),
      },
    };

    const initialEvent: EventData = {
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
        ...draftEvent,
    };

    return {
        profileData: initialProfile,
        eventData: initialEvent,
        agreementData: {
            shareStory: null,
            receiveAdditionalInfo: null,
            ...(applicationDraft?.agreementData || {}),
        },
    };
  });

  useEffect(() => {
    onDraftUpdate(formData);
  }, [formData, onDraftUpdate]);

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
  
  const updateEventData = useCallback((newData: Partial<ApplicationFormData['eventData']>) => {
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
            primaryAddress: {
                ...prev.profileData.primaryAddress,
                ...(parsedData.profileData.primaryAddress || {}),
            },
            mailingAddress: {
                ...(prev.profileData.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }),
                ...(parsedData.profileData.mailingAddress || {}),
            },
        } : prev.profileData;

        const newEventData = parsedData.eventData ? {
            ...prev.eventData,
            ...parsedData.eventData,
        } : prev.eventData;

        return {
            ...prev,
            profileData: newProfileData,
            eventData: newEventData,
        };
    });
  };
  
  const handleFinalSubmit = async () => {
    await onSubmit(formData);
  };

  const renderStep = () => {
      switch(step) {
          case 1:
              return <ApplyContactPage 
                formData={formData.profileData} 
                updateFormData={updateProfileData} 
                nextStep={nextStep}
                onAIParsed={handleAIParsedData}
                />;
          case 2:
              return <ApplyEventPage formData={formData.eventData} updateFormData={updateEventData} nextStep={nextStep} prevStep={prevStep} activeFund={activeFund} />;
          case 3:
              return <ApplyExpensesPage userProfile={userProfile} formData={formData.eventData} updateFormData={updateEventData} nextStep={nextStep} prevStep={prevStep} />;
          case 4:
              return <ApplyTermsPage formData={formData.agreementData} updateFormData={updateAgreementData} prevStep={prevStep} onSubmit={handleFinalSubmit} />;
          default:
            navigate('home');
            return null;
      }
  }

  // New guard clause to prevent application if grant limits are reached
  if (!canApply && userProfile.eligibilityStatus === 'Eligible') {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full text-center flex-1 flex flex-col items-center justify-center">
        <div className="bg-[var(--theme-bg-secondary)]/50 p-10 rounded-lg shadow-lg border border-[var(--theme-border)]">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('applyPage.limitsReachedTitle')}</h1>
            <p className="text-white mt-4 max-w-md">{t('applyPage.limitsReachedBody')}</p>
            <p className="text-white mt-4">
                {t('applyPage.limitsReachedCta', {
                    profileLink: ''
                })}
                <button onClick={() => navigate('profile')} className="font-semibold text-[var(--theme-accent)] hover:underline">{t('applyPage.profileLink')}</button>
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="relative flex justify-center items-center mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('applyPage.title')}</h1>
          {userProfile ? (
            <div className="mt-2 flex flex-col items-center gap-2">
                {userProfile.fundName && userProfile.fundCode ? (
                    <p className="text-lg text-gray-300">{userProfile.fundName} ({userProfile.fundCode})</p>
                ) : null }
            </div>
          ) : (
            <p className="text-lg text-gray-400 mt-2 italic">{t('applyPage.noActiveFund')}</p>
          )}
        </div>
      </div>
      <div>
        {renderStep()}
      </div>
    </div>
  );
};

export default ApplyPage;