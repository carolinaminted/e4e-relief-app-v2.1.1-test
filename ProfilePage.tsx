import React, { useState, useMemo } from 'react';
import type { Application, UserProfile, Address, EligibilityStatus, FundIdentity, ActiveIdentity, ClassVerificationStatus } from '../types';
import ApplicationDetailModal from './ApplicationDetailModal';
import CountrySelector from './CountrySelector';
import SearchableSelector from './SearchableSelector';
import { employmentTypes, languages } from '../data/appData';
import { formatPhoneNumber } from '../utils/formatting';
import RequiredIndicator from './RequiredIndicator';
import { FormInput, FormRadioGroup, AddressFields } from './FormControls';
import PolicyModal from './PolicyModal';

interface ProfilePageProps {
  navigate: (page: 'home' | 'apply' | 'classVerification') => void;
  applications: Application[];
  userProfile: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => Promise<void>;
  identities: FundIdentity[];
  activeIdentity: ActiveIdentity | null;
  onSetActiveIdentity: (identityId: string) => void;
  onAddIdentity: (fundCode: string) => void;
  onRemoveIdentity: (identityId: string) => void;
}

const statusStyles: Record<Application['status'], string> = {
    Submitted: 'text-[#ff8400]',
    Awarded: 'text-[#edda26]',
    Declined: 'text-red-400',
};

// --- UI Components ---
const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[#ff8400] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const NotificationIcon: React.FC = () => (
    <span className="relative flex h-3 w-3" title="Action required in this section">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff8400] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ff9d33]"></span>
    </span>
);

const EligibilityIndicator: React.FC<{ cvStatus: ClassVerificationStatus, onClick: () => void }> = ({ cvStatus, onClick }) => {
    const hasPassedCV = cvStatus === 'passed';

    const baseClasses = "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-colors";
    const passedClasses = "bg-green-800/50 text-green-300";
    const neededClasses = "bg-yellow-800/50 text-yellow-300 cursor-pointer hover:bg-yellow-800/80";

    const handleClick = () => {
        if (!hasPassedCV) {
             console.log("[Telemetry] verification_needed_cta_clicked");
             onClick();
        }
    };

    const text = hasPassedCV ? 'Eligible to apply' : 'Verification needed';
    
    return (
        <button
            onClick={handleClick}
            disabled={hasPassedCV}
            role={hasPassedCV ? 'status' : 'button'}
            aria-label={text}
            className={`${baseClasses} ${hasPassedCV ? passedClasses : neededClasses}`}
        >
            {!hasPassedCV && (
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
            )}
            <span>{text}</span>
        </button>
    );
};


type ProfileSection = 'identities' | 'applications' | 'contact' | 'primaryAddress' | 'additionalDetails' | 'mailingAddress' | 'consent';

const ProfilePage: React.FC<ProfilePageProps> = ({ navigate, applications, userProfile, onProfileUpdate, identities, activeIdentity, onSetActiveIdentity, onAddIdentity, onRemoveIdentity }) => {
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [openSection, setOpenSection] = useState<ProfileSection | null>('applications');
  const [isAddingIdentity, setIsAddingIdentity] = useState(false);
  const [newFundCode, setNewFundCode] = useState('');
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  
  const { twelveMonthRemaining, lifetimeRemaining } = useMemo(() => {
    if (applications.length === 0) {
      return {
        twelveMonthRemaining: 10000,
        lifetimeRemaining: 50000,
      };
    }

    // The most recent application is the last one in the array, which reflects the latest state.
    const latestApplication = applications[applications.length - 1];
    
    return {
      twelveMonthRemaining: latestApplication.twelveMonthGrantRemaining,
      lifetimeRemaining: latestApplication.lifetimeGrantRemaining,
    };
  }, [applications]);

  // Create a reversed list for display so newest applications appear first
  const sortedApplicationsForDisplay = useMemo(() => {
    return [...applications].reverse();
  }, [applications]);

  const currentActiveFullIdentity = useMemo(() => {
    if (!activeIdentity) return null;
    return identities.find(id => id.id === activeIdentity.id);
  }, [identities, activeIdentity]);

  const sortedIdentities = useMemo(() => {
    return [...identities].sort((a, b) => new Date(b.lastUsedAt || 0).getTime() - new Date(a.lastUsedAt || 0).getTime());
  }, [identities]);

  const sectionHasErrors = useMemo(() => {
    // Contact
    const contactHasBlanks = !formData.firstName || !formData.lastName || !formData.mobileNumber;
    
    // Primary Address
    const primaryAddressHasBlanks = !formData.primaryAddress.country || !formData.primaryAddress.street1 || !formData.primaryAddress.city || !formData.primaryAddress.state || !formData.primaryAddress.zip;
    
    // Additional Details
    const additionalDetailsHasBlanks = !formData.employmentStartDate || !formData.eligibilityType || formData.householdIncome === '' || formData.householdSize === '' || !formData.homeowner;
    
    // Mailing Address
    let mailingAddressHasBlanks = false;
    if (formData.isMailingAddressSame === null) {
        mailingAddressHasBlanks = true;
    } else if (!formData.isMailingAddressSame) {
        mailingAddressHasBlanks = !formData.mailingAddress?.country || !formData.mailingAddress?.street1 || !formData.mailingAddress?.city || !formData.mailingAddress?.state || !formData.mailingAddress?.zip;
    }

    // Consent
    const consentHasBlanks = !formData.ackPolicies || !formData.commConsent || !formData.infoCorrect;

    return {
        contact: contactHasBlanks,
        primaryAddress: primaryAddressHasBlanks,
        additionalDetails: additionalDetailsHasBlanks,
        mailingAddress: mailingAddressHasBlanks,
        consent: consentHasBlanks,
    };
  }, [formData]);

  const toggleSection = (section: ProfileSection) => {
    setOpenSection(prev => (prev === section ? null : section));
  };


  const handleFormChange = (field: keyof UserProfile, value: any) => {
    let finalValue = value;
    if (field === 'mobileNumber') {
      finalValue = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }));

    // FIX: Used type assertion to prevent 'symbol' cannot be used as an index type error.
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        // FIX: Used type assertion for deleting property.
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };
  
  const handleAddressChange = (addressType: 'primaryAddress' | 'mailingAddress', field: keyof Address, value: string) => {
    setFormData(prev => ({
        ...prev,
        [addressType]: {
            ...(prev[addressType] || { country: '', street1: '', city: '', state: '', zip: '' }), // Ensure mailingAddress is not undefined
            [field]: value
        }
    }));
    // FIX: Explicitly convert `field` to a string to avoid runtime errors with symbols.
    const errorKey = `${addressType}.${String(field)}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };
  
  const handleAddressBulkChange = (addressType: 'primaryAddress' | 'mailingAddress', parsedAddress: Partial<Address>) => {
    setFormData(prev => ({
        ...prev,
        [addressType]: {
            ...(prev[addressType] || { country: '', street1: '', city: '', state: '', zip: '' }),
            ...parsedAddress
        }
    }));
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(parsedAddress).forEach(field => {
        const errorKey = `${addressType}.${field}`;
        if (newErrors[errorKey]) {
          delete newErrors[errorKey];
        }
      });
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors: Record<string, any> = {};

    // Contact Info
    if (!formData.firstName) newErrors.firstName = 'First name is required.';
    if (!formData.lastName) newErrors.lastName = 'Last name is required.';
    if (!formData.mobileNumber) {
        newErrors.mobileNumber = 'Mobile number is required.';
    } else {
        const digitCount = formData.mobileNumber.replace(/[^\d]/g, '').length;
        if (digitCount < 7) {
            newErrors.mobileNumber = 'Please enter a valid phone number (at least 7 digits).';
        }
    }

    // Primary Address
    const primaryAddrErrors: Record<string, string> = {};
    if (!formData.primaryAddress.country) primaryAddrErrors.country = 'Country is required.';
    if (!formData.primaryAddress.street1) primaryAddrErrors.street1 = 'Street 1 is required.';
    if (!formData.primaryAddress.city) primaryAddrErrors.city = 'City is required.';
    if (!formData.primaryAddress.state) primaryAddrErrors.state = 'State is required.';
    if (!formData.primaryAddress.zip) primaryAddrErrors.zip = 'ZIP code is required.';
    if (Object.keys(primaryAddrErrors).length > 0) newErrors.primaryAddress = primaryAddrErrors;

    // Additional Details
    if (!formData.employmentStartDate) newErrors.employmentStartDate = 'Employment start date is required.';
    if (!formData.eligibilityType) newErrors.eligibilityType = 'Eligibility type is required.';
    if (formData.householdIncome === '') newErrors.householdIncome = 'Household income is required.';
    if (formData.householdSize === '') newErrors.householdSize = 'Household size is required.';
    if (!formData.homeowner) newErrors.homeowner = 'Homeowner status is required.';
    
    // Mailing Address (if applicable)
    if (formData.isMailingAddressSame === null) {
        newErrors.isMailingAddressSame = 'Please select an option for the mailing address.';
    } else if (!formData.isMailingAddressSame) {
        const mailingAddrErrors: Record<string, string> = {};
        if (!formData.mailingAddress?.country) mailingAddrErrors.country = 'Country is required.';
        if (!formData.mailingAddress?.street1) mailingAddrErrors.street1 = 'Street 1 is required.';
        if (!formData.mailingAddress?.city) mailingAddrErrors.city = 'City is required.';
        if (!formData.mailingAddress?.state) mailingAddrErrors.state = 'State is required.';
        if (!formData.mailingAddress?.zip) mailingAddrErrors.zip = 'ZIP code is required.';
        if (Object.keys(mailingAddrErrors).length > 0) newErrors.mailingAddress = mailingAddrErrors;
    }

    // Consent
    if (!formData.ackPolicies) newErrors.ackPolicies = 'You must agree to the policies.';
    if (!formData.commConsent) newErrors.commConsent = 'You must consent to communications.';
    if (!formData.infoCorrect) newErrors.infoCorrect = 'You must confirm your information is correct.';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
        let firstErrorSection: ProfileSection | null = null;
        if (newErrors.firstName || newErrors.lastName || newErrors.mobileNumber) {
            firstErrorSection = 'contact';
        } else if (newErrors.primaryAddress) {
            firstErrorSection = 'primaryAddress';
        } else if (newErrors.mailingAddress || newErrors.isMailingAddressSame) {
            firstErrorSection = 'mailingAddress';
        } else if (newErrors.employmentStartDate || newErrors.eligibilityType || newErrors.householdIncome || newErrors.householdSize || newErrors.homeowner) {
            firstErrorSection = 'additionalDetails';
        } else if (newErrors.ackPolicies || newErrors.commConsent || newErrors.infoCorrect) {
            firstErrorSection = 'consent';
        }
        
        if (firstErrorSection) {
            setOpenSection(firstErrorSection);
        }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onProfileUpdate(formData);
    }
  };
  
  const handleAddIdentitySubmit = () => {
      if(newFundCode.trim()) {
          onAddIdentity(newFundCode.trim().toUpperCase());
          setNewFundCode('');
          setIsAddingIdentity(false);
      }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="relative flex justify-center items-center mb-8 md:hidden">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
              Profile
            </h1>
            {currentActiveFullIdentity && (
              <div className="mt-2 flex flex-col items-center gap-2">
                <p className="text-lg text-gray-300">{currentActiveFullIdentity.fundName} ({currentActiveFullIdentity.fundCode})</p>
                <EligibilityIndicator 
                  cvStatus={currentActiveFullIdentity.classVerificationStatus} 
                  onClick={() => onAddIdentity(currentActiveFullIdentity.fundCode)} 
                />
              </div>
            )}
        </div>
      </div>
      
      {/* Applications Section */}
        <section className="border-b border-[#005ca0] pb-4 mb-4">
            <button type="button" onClick={() => toggleSection('applications')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'applications'}>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">My Applications</h2>
                <ChevronIcon isOpen={openSection === 'applications'} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${openSection === 'applications' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="bg-[#003a70]/50 p-4 rounded-lg mb-4 flex flex-col gap-4 sm:flex-row sm:justify-around text-center border border-[#005ca0]">
                    <div>
                        <p className="text-sm text-white uppercase tracking-wider">12-Month Remaining</p>
                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                            ${twelveMonthRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-white uppercase tracking-wider">Lifetime Remaining</p>
                        <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                            ${lifetimeRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
                <div className="space-y-4">
                {applications.length > 0 ? (
                    <>
                        {sortedApplicationsForDisplay.map(app => (
                        <button key={app.id} onClick={() => setSelectedApplication(app)} className="w-full text-left bg-[#004b8d] p-4 rounded-md flex justify-between items-center hover:bg-[#005ca0]/50 transition-colors duration-200">
                            <div>
                            <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{app.event}</p>
                            <p className="text-sm text-gray-300">Submitted: {app.submittedDate}</p>
                            </div>
                            <div className="text-right">
                            <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">${app.requestedAmount.toFixed(2)}</p>
                            <p className="text-sm text-gray-300">Status: <span className={`font-medium ${statusStyles[app.status]}`}>{app.status}</span></p>
                            </div>
                        </button>
                        ))}
                        <div className="flex justify-center pt-4">
                            <button 
                                onClick={() => navigate('apply')} 
                                className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                disabled={userProfile.eligibilityStatus !== 'Eligible'}
                                title={userProfile.eligibilityStatus !== 'Eligible' ? "Class Verification required to access applications." : ""}
                            >
                                Apply Now
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 bg-[#003a70]/50 rounded-lg">
                        <p className="text-gray-300">You have not submitted any applications for this fund yet.</p>
                        <button 
                            onClick={() => navigate('apply')} 
                            className="mt-4 bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed"
                            disabled={userProfile.eligibilityStatus !== 'Eligible'}
                            title={userProfile.eligibilityStatus !== 'Eligible' ? "Class Verification required to access applications." : ""}
                        >
                            Apply Now
                        </button>
                    </div>
                )}
                </div>
            </div>
        </section>

      {/* Identities Section */}
      <section className="border-b border-[#005ca0] pb-4 mb-4">
        <button type="button" onClick={() => toggleSection('identities')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'identities'}>
            <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Fund Identities</h2>
            <ChevronIcon isOpen={openSection === 'identities'} />
        </button>
        <div className={`transition-all duration-500 ease-in-out ${openSection === 'identities' ? 'max-h-[2000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <p className="text-sm text-gray-300 mb-4">
                Manage your fund identities. Add or remove additional fund codes if you’re eligible for more than one program.
            </p>
            <div className="space-y-4">
                {sortedIdentities.map(identity => {
                    const isActive = activeIdentity?.id === identity.id;
                    return (
                        <div key={identity.id} className={`bg-[#004b8d] p-4 rounded-lg shadow-lg border-2 ${isActive ? 'border-[#ff8400]' : 'border-transparent'}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-bold text-lg text-white">{identity.fundName}</h3>
                                        <span className="text-sm font-mono bg-[#003a70] px-2 py-0.5 rounded">{identity.fundCode}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <EligibilityIndicator cvStatus={identity.classVerificationStatus} onClick={() => onAddIdentity(identity.fundCode)} />
                                        {isActive && <span className="text-xs font-bold text-green-300">(Active)</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
                                    {identities.length > 1 && (
                                        <button
                                            onClick={() => onSetActiveIdentity(identity.id)}
                                            disabled={isActive || identity.eligibilityStatus !== 'Eligible'}
                                            className="bg-[#005ca0] text-white text-sm font-semibold py-2 px-4 rounded-md transition-colors duration-200 hover:bg-[#006ab3] disabled:bg-gray-600 disabled:cursor-not-allowed"
                                            aria-label={`Set ${identity.fundName} as active identity`}
                                        >
                                            Set Active
                                        </button>
                                    )}
                                     <button
                                        onClick={() => onRemoveIdentity(identity.id)}
                                        disabled={isActive}
                                        className="bg-red-900/50 text-red-300 text-sm font-semibold p-2 rounded-md transition-colors duration-200 hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label={`Remove ${identity.fundName} identity`}
                                    >
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {!isAddingIdentity ? (
                     <button onClick={() => setIsAddingIdentity(true)} className="w-full bg-transparent border-2 border-dashed border-[#005ca0] text-white font-semibold py-3 px-4 rounded-md hover:bg-[#005ca0]/50 hover:border-solid transition-all duration-200">
                        + Add New Identity
                    </button>
                ) : (
                    <div className="bg-[#003a70]/50 p-4 rounded-lg border border-[#005ca0]">
                        <h4 className="text-md font-semibold text-white mb-2">Enter New Fund Code</h4>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text"
                                value={newFundCode}
                                onChange={e => setNewFundCode(e.target.value)}
                                className="flex-grow bg-transparent border-0 border-b p-2 text-white focus:outline-none focus:ring-0 border-[#005ca0] focus:border-[#ff8400]"
                                placeholder="e.g., JHH"
                                autoFocus
                            />
                             <button onClick={() => { setIsAddingIdentity(false); setNewFundCode(''); }} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">Cancel</button>
                            <button onClick={handleAddIdentitySubmit} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">Verify</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </section>

      <form onSubmit={handleSave} className="space-y-4">
        {/* 1a Contact Information */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('contact')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'contact'} aria-controls="contact-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Contact Information</h2>
                    {sectionHasErrors.contact && openSection !== 'contact' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'contact'} />
            </button>
            <div id="contact-section" className={`transition-all duration-500 ease-in-out ${openSection === 'contact' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <FormInput label="First Name" id="firstName" required value={formData.firstName} onChange={e => handleFormChange('firstName', e.target.value)} error={errors.firstName} />
                    <FormInput label="Middle Name(s)" id="middleName" value={formData.middleName || ''} onChange={e => handleFormChange('middleName', e.target.value)} />
                    <FormInput label="Last Name" id="lastName" required value={formData.lastName} onChange={e => handleFormChange('lastName', e.target.value)} error={errors.lastName} />
                    <FormInput label="Suffix" id="suffix" value={formData.suffix || ''} onChange={e => handleFormChange('suffix', e.target.value)} />
                    <FormInput label="Email" id="email" required value={formData.email} disabled />
                    <FormInput label="Mobile Number" id="mobileNumber" required value={formData.mobileNumber} onChange={e => handleFormChange('mobileNumber', e.target.value)} error={errors.mobileNumber} placeholder="(555) 555-5555" />
                </div>
                {openSection === 'contact' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('contact')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="contact-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>

        {/* 1b Primary Address */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('primaryAddress')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'primaryAddress'} aria-controls="address-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Primary Address</h2>
                    {sectionHasErrors.primaryAddress && openSection !== 'primaryAddress' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'primaryAddress'} />
            </button>
            <div id="address-section" className={`transition-all duration-500 ease-in-out ${openSection === 'primaryAddress' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-6 pt-4">
                    <AddressFields address={formData.primaryAddress} onUpdate={(field, value) => handleAddressChange('primaryAddress', field, value)} onBulkUpdate={(parsed) => handleAddressBulkChange('primaryAddress', parsed)} prefix="primary" errors={errors.primaryAddress || {}} />
                </div>
                {openSection === 'primaryAddress' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('primaryAddress')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="address-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>
        
        {/* 1d Mailing Address */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('mailingAddress')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'mailingAddress'} aria-controls="mailing-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Mailing Address</h2>
                    {sectionHasErrors.mailingAddress && openSection !== 'mailingAddress' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'mailingAddress'} />
            </button>
            <div id="mailing-section" className={`transition-all duration-500 ease-in-out ${openSection === 'mailingAddress' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-4 pt-4">
                    <FormRadioGroup 
                        legend="Mailing Address Same as Primary?" 
                        name="isMailingAddressSame" 
                        options={['Yes', 'No']} 
                        value={formData.isMailingAddressSame === null ? '' : (formData.isMailingAddressSame ? 'Yes' : 'No')} 
                        onChange={value => handleFormChange('isMailingAddressSame', value === 'Yes')} 
                        required
                        error={errors.isMailingAddressSame}
                    />
                    {!formData.isMailingAddressSame && (
                        <div className="pt-4 mt-4 border-t border-[#002a50] space-y-6">
                            <AddressFields address={formData.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }} onUpdate={(field, value) => handleAddressChange('mailingAddress', field, value)} onBulkUpdate={(parsed) => handleAddressBulkChange('mailingAddress', parsed)} prefix="mailing" errors={errors.mailingAddress || {}} />
                        </div>
                    )}
                </div>
                {openSection === 'mailingAddress' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('mailingAddress')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="mailing-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>

        {/* 1c Additional Details */}
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('additionalDetails')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'additionalDetails'} aria-controls="details-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Additional Details</h2>
                    {sectionHasErrors.additionalDetails && openSection !== 'additionalDetails' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'additionalDetails'} />
            </button>
            <div id="details-section" className={`transition-all duration-500 ease-in-out ${openSection === 'additionalDetails' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <FormInput type="date" label="Employment Start Date" id="employmentStartDate" required value={formData.employmentStartDate} onChange={e => handleFormChange('employmentStartDate', e.target.value)} error={errors.employmentStartDate} />
                    <SearchableSelector
                        label="Eligibility Type"
                        id="eligibilityType"
                        required
                        value={formData.eligibilityType}
                        options={employmentTypes}
                        onUpdate={value => handleFormChange('eligibilityType', value)}
                        variant="underline"
                        error={errors.eligibilityType}
                    />
                    <FormInput type="number" label="Estimated Annual Household Income" id="householdIncome" required value={formData.householdIncome} onChange={e => handleFormChange('householdIncome', parseFloat(e.target.value) || '')} error={errors.householdIncome} />
                    <FormInput type="number" label="Number of people in household" id="householdSize" required value={formData.householdSize} onChange={e => handleFormChange('householdSize', parseInt(e.target.value, 10) || '')} error={errors.householdSize} />
                    <FormRadioGroup legend="Do you own your own home?" name="homeowner" options={['Yes', 'No']} value={formData.homeowner} onChange={value => handleFormChange('homeowner', value)} required error={errors.homeowner} />
                    <SearchableSelector
                        label="Preferred Language"
                        id="preferredLanguage"
                        value={formData.preferredLanguage || ''}
                        options={languages}
                        onUpdate={value => handleFormChange('preferredLanguage', value)}
                        variant="underline"
                    />
                </div>
                {openSection === 'additionalDetails' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('additionalDetails')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="details-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>

        {/* 1e Consent and Acknowledgement */}
        <fieldset className="pb-4">
            <button type="button" onClick={() => toggleSection('consent')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'consent'} aria-controls="consent-section">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Consent & Acknowledgement</h2>
                    {sectionHasErrors.consent && openSection !== 'consent' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'consent'} />
            </button>
            <div id="consent-section" className={`transition-all duration-500 ease-in-out ${openSection === 'consent' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-3 pt-4">
                     {errors.ackPolicies && <p className="text-red-400 text-xs">{errors.ackPolicies}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="ackPolicies" required checked={formData.ackPolicies} onChange={e => handleFormChange('ackPolicies', e.target.checked)} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="ackPolicies" className="flex items-center ml-3 text-sm text-white">I have read and agree to E4E Relief’s Privacy Policy and Cookie Policy. <RequiredIndicator required isMet={formData.ackPolicies} /></label>
                    </div>
                     {errors.commConsent && <p className="text-red-400 text-xs">{errors.commConsent}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="commConsent" required checked={formData.commConsent} onChange={e => handleFormChange('commConsent', e.target.checked)} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="commConsent" className="flex items-center ml-3 text-sm text-white">I consent to receive emails and text messages regarding my application. <RequiredIndicator required isMet={formData.commConsent} /></label>
                    </div>
                     {errors.infoCorrect && <p className="text-red-400 text-xs">{errors.infoCorrect}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="infoCorrect" required checked={formData.infoCorrect} onChange={e => handleFormChange('infoCorrect', e.target.checked)} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="infoCorrect" className="flex items-center ml-3 text-sm text-white">All information I have provided is accurate. <RequiredIndicator required isMet={formData.infoCorrect} /></label>
                    </div>
                </div>
                {openSection === 'consent' && (
                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => toggleSection('consent')}
                            className="flex items-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity"
                            aria-controls="consent-section"
                            aria-expanded="true"
                        >
                            Collapse
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 text-[#ff8400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </fieldset>

        <div className="flex justify-center pt-8 flex-col items-center">
            {Object.keys(errors).length > 0 && (
                <div className="bg-red-800/50 border border-red-600 text-red-200 p-4 rounded-md mb-4 w-full max-w-md text-sm">
                    <p className="font-bold">Please correct the highlighted errors before saving.</p>
                </div>
            )}
            <button type="submit" className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-8 rounded-md transition-colors duration-200">Save Changes</button>
        </div>
      </form>
      
      <div className="text-center mt-6 md:hidden">
          <button
            onClick={() => setIsPolicyModalOpen(true)}
            className="text-sm italic text-[#898c8d] hover:text-white transition-colors duration-200"
          >
            Legal Information
          </button>
        </div>

      {selectedApplication && (
        <ApplicationDetailModal 
          application={selectedApplication} 
          onClose={() => setSelectedApplication(null)} 
        />
      )}
      {isPolicyModalOpen && <PolicyModal onClose={() => setIsPolicyModalOpen(false)} />}
    </div>
  );
};

export default ProfilePage;
