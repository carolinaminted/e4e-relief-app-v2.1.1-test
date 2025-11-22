import React, { useState, useEffect } from 'react';
// FIX: Changed import for `Fund` type to its source file `data/fundData` to resolve export error.
import type { Page, UserProfile } from '../types';
import type { Fund } from '../data/fundData';
import { useTranslation, Trans } from 'react-i18next';
import { FormInput } from './FormControls';
import EligibilityIndicator from './EligibilityIndicator';

interface ReliefQueuePageProps {
  userProfile: UserProfile;
  activeFund: Fund | null;
  onUpdateProfile: (updatedProfile: UserProfile, options?: { silent?: boolean }) => Promise<void>;
  onReattemptVerification: (fundCode: string) => void;
  onLogout: () => void;
}

const ReliefQueuePage: React.FC<ReliefQueuePageProps> = ({ userProfile, activeFund, onUpdateProfile, onReattemptVerification, onLogout }) => {
  const { t } = useTranslation();
  const [reattemptFundCode, setReattemptFundCode] = useState(userProfile.fundCode || '');
  const [isReattempting, setIsReattempting] = useState(false);
  const [generationInitiated, setGenerationInitiated] = useState(false);

  // Generate a unique ticket number if one doesn't exist
  useEffect(() => {
    if (!userProfile.reliefQueueTicket && !generationInitiated) {
      setGenerationInitiated(true);
      // Generate a pseudo-unique ticket: RQ-[TimestampSection]-[Random]
      const timestampPart = Date.now().toString().slice(-6); 
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const newTicket = `#RQ-${timestampPart}-${randomPart}`;
      
      // Update profile silently to store the ticket in Firestore
      onUpdateProfile({ ...userProfile, reliefQueueTicket: newTicket }, { silent: true });
    }
  }, [userProfile.reliefQueueTicket, generationInitiated, userProfile, onUpdateProfile]);

  const handleReattempt = () => {
    if (!reattemptFundCode.trim()) {
      alert("Please enter a fund code to re-attempt verification.");
      return;
    }
    onReattemptVerification(reattemptFundCode.trim().toUpperCase());
  };

  const renderHelpText = () => {
    if (!activeFund) return null;

    switch (activeFund.cvType) {
      case 'Roster':
        return (
          <div className="bg-[#004b8d]/50 p-4 rounded-lg border border-[#005ca0] text-sm text-gray-300 text-left space-y-2">
            <h3 className="font-semibold text-white">Roster Verification</h3>
            <p>{t('reliefQueue.helpRoster')}</p>
          </div>
        );
      case 'Domain':
        return (
          <div className="bg-[#004b8d]/50 p-4 rounded-lg border border-[#005ca0] text-sm text-gray-300 text-left space-y-2">
            <h3 className="font-semibold text-white">Domain Verification</h3>
            <p>{t('reliefQueue.helpDomain')}</p>
          </div>
        );
      case 'SSO':
        return (
          <div className="bg-[#004b8d]/50 p-4 rounded-lg border border-[#005ca0] text-sm text-gray-300 text-left space-y-2">
            <h3 className="font-semibold text-white">SSO Verification</h3>
            <p>
              <Trans i18nKey="reliefQueue.helpSSO"
                components={{
                  phoneLink: <a href={`tel:${activeFund.supportPhone}`} className="font-semibold text-white hover:underline" />,
                  emailLink: <a href={`mailto:${activeFund.supportEmail}`} className="font-semibold text-white hover:underline" />
                }}
                values={{
                  phone: activeFund.supportPhone,
                  email: activeFund.supportEmail
                }}
              />
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const supportEmail = activeFund?.supportEmail || 'support@e4erelief.example';
  const supportPhone = activeFund?.supportPhone || '(800) 555-0199';


  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center">
      <div className="w-full max-w-2xl bg-[#003a70] p-8 rounded-lg shadow-2xl border border-[#005ca0] space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
            Relief Queue
          </h1>
          <p className="text-lg text-gray-300 mt-1">{activeFund?.name} ({userProfile.fundCode})</p>
          <p className="text-md text-gray-400 mt-1">{userProfile.email}</p>
        </div>

        {userProfile.reliefQueueTicket && (
          <div className="bg-white/10 border-2 border-dashed border-[#ff8400] p-4 rounded-lg animate-[fadeIn_0.5s_ease-out]">
              <p className="text-[#ff8400] text-xs font-bold uppercase tracking-widest mb-1">Support Ticket Number</p>
              <p className="text-3xl text-white font-mono font-bold tracking-wider select-all">{userProfile.reliefQueueTicket}</p>
              <p className="text-gray-400 text-xs mt-2">Please quote this number when contacting support.</p>
          </div>
        )}

        <div className="flex justify-center">
            <EligibilityIndicator eligibilityStatus={userProfile.eligibilityStatus} cvStatus={userProfile.classVerificationStatus} />
        </div>

        {renderHelpText()}
        
        <div className="bg-[#004b8d]/50 p-6 rounded-lg border border-[#005ca0] text-center">
            {!isReattempting ? (
                <button onClick={() => setIsReattempting(true)} className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200">
                    Re-attempt Verification
                </button>
            ) : (
                <div className="space-y-4">
                    <FormInput label="Fund Code" id="fundCode" value={reattemptFundCode} onChange={e => setReattemptFundCode(e.target.value)} />
                    <div className="flex justify-center gap-2">
                         <button onClick={() => setIsReattempting(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
                            Cancel
                        </button>
                        <button onClick={handleReattempt} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200">
                            Submit for Verification
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="border-t border-[#005ca0] pt-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Need Help?</h2>
            <p className="text-gray-300">Contact support for assistance with your verification.</p>
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-1">Support Email</h3>
              <a href={`mailto:${supportEmail}`} className="font-semibold text-white hover:underline text-lg">{supportEmail}</a>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] mb-1">Support Phone</h3>
              <a href={`tel:${supportPhone}`} className="font-semibold text-white hover:underline text-lg">{supportPhone}</a>
            </div>
        </div>
        
        <div className="border-t border-[#005ca0] pt-6">
             <button onClick={onLogout} className="w-full bg-red-800/50 hover:bg-red-700/50 text-red-200 font-bold py-3 px-4 rounded-md transition-colors duration-200">
                Logout
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReliefQueuePage;