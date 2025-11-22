import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserProfile, Address, ApplicationFormData } from '../types';
import { employmentTypes, languages } from '../data/appData';
import { formatPhoneNumber } from '../utils/formatting';
import AIApplicationStarter from './AIApplicationStarter';
import RequiredIndicator from './RequiredIndicator';
import LoadingOverlay from './LoadingOverlay';
import { parseApplicationDetailsWithGemini } from '../services/geminiService';
import { FormInput, FormRadioGroup, AddressFields } from './FormControls';
import SearchableSelector from './SearchableSelector';

interface ApplyProxyContactPageProps {
  formData: UserProfile; // This holds the data for the *applicant* being filled out by the admin.
  updateFormData: (data: Partial<UserProfile>) => void;
  nextStep: () => void;
  onAIParsed: (data: Partial<ApplicationFormData>) => void;
}

// --- UI Icons ---
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

type ApplySection = 'aiStarter' | 'applicantDetails' |'contact' | 'addresses' | 'additionalDetails' | 'consent';

/**
 * The first step of the proxy application flow. This component is very similar to the regular
 * ApplyContactPage, but it includes an initial section to identify the applicant by their name and email.
 * It also features the AI Application Starter to pre-fill the form from a text description.
 */
const ApplyProxyContactPage: React.FC<ApplyProxyContactPageProps> = ({ formData, updateFormData, nextStep, onAIParsed }) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [openSection, setOpenSection] = useState<ApplySection | null>('aiStarter');
  const [isAIParsing, setIsAIParsing] = useState(false);
  
  const [showMailingAddress, setShowMailingAddress] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const calculateHeight = () => {
        if (openSection === 'addresses') {
            const frontHeight = frontRef.current?.scrollHeight ?? 0;
            const backHeight = backRef.current?.scrollHeight ?? 0;
            if (formData.isMailingAddressSame) {
                setCardHeight(frontHeight > 0 ? frontHeight : undefined);
            } else {
                setCardHeight(Math.max(frontHeight, backHeight) > 0 ? Math.max(frontHeight, backHeight) : undefined);
            }
        }
    };
    calculateHeight();
    const timer = setTimeout(calculateHeight, 100); // Recalculate after render
    window.addEventListener('resize', calculateHeight);
    return () => {
        window.removeEventListener('resize', calculateHeight);
        clearTimeout(timer);
    };
  }, [openSection, formData.isMailingAddressSame, showMailingAddress]);

  // Checks which collapsible sections have validation errors to display a notification icon.
  const sectionHasErrors = useMemo(() => {
    const applicantDetailsHasBlanks = !formData.firstName || !formData.lastName || !formData.email;
    const contactHasBlanks = !formData.mobileNumber;
    
    const primaryAddressHasBlanks = !formData.primaryAddress.country || !formData.primaryAddress.street1 || !formData.primaryAddress.city || !formData.primaryAddress.state || !formData.primaryAddress.zip;
    let mailingAddressHasBlanks = false;
    if (formData.isMailingAddressSame === null) {
        mailingAddressHasBlanks = true;
    } else if (!formData.isMailingAddressSame) {
        mailingAddressHasBlanks = !formData.mailingAddress?.country || !formData.mailingAddress?.street1 || !formData.mailingAddress?.city || !formData.mailingAddress?.state || !formData.mailingAddress?.zip;
    }

    const additionalDetailsHasBlanks = !formData.employmentStartDate || !formData.eligibilityType || formData.householdIncome === '' || formData.householdSize === '' || !formData.homeowner;
    const consentHasBlanks = !formData.ackPolicies || !formData.commConsent || !formData.infoCorrect;

    return {
        applicantDetails: applicantDetailsHasBlanks,
        contact: contactHasBlanks,
        addresses: primaryAddressHasBlanks || mailingAddressHasBlanks,
        additionalDetails: additionalDetailsHasBlanks,
        consent: consentHasBlanks,
    };
  }, [formData]);
  
  const toggleSection = (section: ApplySection) => {
    setOpenSection(prev => (prev === section ? null : section));
  };
  
  const handleFormUpdate = (data: Partial<UserProfile>) => {
    let finalData = { ...data };
    if ('mobileNumber' in data && typeof data.mobileNumber === 'string') {
        finalData.mobileNumber = formatPhoneNumber(data.mobileNumber);
    }
    // When email changes, identityId must also change to keep them in sync.
    if('email' in data) {
        finalData.identityId = data.email;
    }

    if('isMailingAddressSame' in data) {
      setShowMailingAddress(!data.isMailingAddressSame);
    }

    updateFormData(finalData);
    
    const fieldName = Object.keys(data)[0];
    if (errors[fieldName]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }
  };

  const handleAddressChange = (addressType: 'primaryAddress' | 'mailingAddress', field: keyof Address, value: string) => {
    const updatedAddress = {
        ...(formData[addressType] || { country: '', street1: '', city: '', state: '', zip: '' }),
        [field]: value
    };
    updateFormData({ [addressType]: updatedAddress });

     if (errors[addressType]?.[field as string]) {
        setErrors(prev => {
            const newAddrErrors = { ...prev[addressType] };
            delete newAddrErrors[field as string];
            return { ...prev, [addressType]: newAddrErrors };
        });
    }
  };

  const handleAddressBulkChange = (addressType: 'primaryAddress' | 'mailingAddress', parsedAddress: Partial<Address>) => {
    updateFormData({
        [addressType]: {
            ...(formData[addressType] || { country: '', street1: '', city: '', state: '', zip: '' }),
            ...parsedAddress,
        }
    });
    if (errors[addressType]) {
        setErrors(prev => ({...prev, [addressType]: {}}));
    }
  };
  
  const handleAIParse = async (description: string) => {
    setIsAIParsing(true);
    try {
      // The `isProxy=true` flag tells the Gemini service to use a specific prompt
      // tailored for extracting the applicant's details from a third-person description.
      const parsedDetails = await parseApplicationDetailsWithGemini(description, true);
      onAIParsed(parsedDetails);
    } catch (e) {
      console.error("AI Parsing failed in parent component:", e);
      throw e; // Re-throw to let the child AIApplicationStarter component handle displaying the error.
    } finally {
      setIsAIParsing(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, any> = {};

    if (!formData.firstName) newErrors.firstName = t('validation.applicantFirstNameRequired');
    if (!formData.lastName) newErrors.lastName = t('validation.applicantLastNameRequired');
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('validation.applicantEmailRequired');
    
    if (!formData.mobileNumber) {
        newErrors.mobileNumber = t('validation.mobileNumberRequired');
    } else {
        const digitCount = formData.mobileNumber.replace(/[^\d]/g, '').length;
        if (digitCount < 7) {
            newErrors.mobileNumber = t('validation.mobileNumberInvalid');
        }
    }

    const primaryAddrErrors: Record<string, string> = {};
    if (!formData.primaryAddress.country) primaryAddrErrors.country = t('validation.countryRequired');
    if (!formData.primaryAddress.street1) primaryAddrErrors.street1 = t('validation.street1Required');
    if (!formData.primaryAddress.city) primaryAddrErrors.city = t('validation.cityRequired');
    if (!formData.primaryAddress.state) primaryAddrErrors.state = t('validation.stateRequired');
    if (!formData.primaryAddress.zip) primaryAddrErrors.zip = t('validation.zipRequired');
    if (Object.keys(primaryAddrErrors).length > 0) newErrors.primaryAddress = primaryAddrErrors;

    if (!formData.employmentStartDate) newErrors.employmentStartDate = t('validation.employmentStartDateRequired');
    if (!formData.eligibilityType) newErrors.eligibilityType = t('validation.eligibilityTypeRequired');
    if (formData.householdIncome === '') newErrors.householdIncome = t('validation.householdIncomeRequired');
    if (formData.householdSize === '') newErrors.householdSize = t('validation.householdSizeRequired');
    if (!formData.homeowner) newErrors.homeowner = t('validation.homeownerRequired');
    
    if (formData.isMailingAddressSame === null) {
        newErrors.isMailingAddressSame = t('validation.mailingAddressSameRequired');
    } else if (!formData.isMailingAddressSame) {
        const mailingAddrErrors: Record<string, string> = {};
        if (!formData.mailingAddress?.country) mailingAddrErrors.country = t('validation.countryRequired');
        if (!formData.mailingAddress?.street1) mailingAddrErrors.street1 = t('validation.street1Required');
        if (!formData.mailingAddress?.city) mailingAddrErrors.city = t('validation.cityRequired');
        if (!formData.mailingAddress?.state) mailingAddrErrors.state = t('validation.stateRequired');
        if (!formData.mailingAddress?.zip) mailingAddrErrors.zip = t('validation.zipRequired');
        if (Object.keys(mailingAddrErrors).length > 0) newErrors.mailingAddress = mailingAddrErrors;
    }

    if (!formData.ackPolicies) newErrors.ackPolicies = t('validation.ackPoliciesRequired');
    if (!formData.commConsent) newErrors.commConsent = t('validation.commConsentRequired');
    if (!formData.infoCorrect) newErrors.infoCorrect = t('validation.infoCorrectRequired');

    setErrors(newErrors);
    
    // If validation fails, automatically open the first section that contains an error.
    if (Object.keys(newErrors).length > 0) {
        let firstErrorSection: ApplySection | null = null;
        if (newErrors.firstName || newErrors.lastName || newErrors.email) firstErrorSection = 'applicantDetails';
        else if (newErrors.mobileNumber) firstErrorSection = 'contact';
        else if (newErrors.primaryAddress || newErrors.mailingAddress || newErrors.isMailingAddressSame) firstErrorSection = 'addresses';
        else if (newErrors.employmentStartDate || newErrors.eligibilityType || newErrors.householdIncome || newErrors.householdSize || newErrors.homeowner) firstErrorSection = 'additionalDetails';
        else if (newErrors.ackPolicies || newErrors.commConsent || newErrors.infoCorrect) firstErrorSection = 'consent';
        
        if (firstErrorSection) {
            setOpenSection(firstErrorSection);
        }
    }
    
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validate()) {
      nextStep();
    }
  };

  const yes = t('common.yes');
  const no = t('common.no');

  return (
    <div className="space-y-4">
        {isAIParsing && <LoadingOverlay message={t('common.aiApplyingDetails')} />}

        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('aiStarter')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'aiStarter'}>
                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Let's Get Started</h2>
                <ChevronIcon isOpen={openSection === 'aiStarter'} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${openSection === 'aiStarter' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <AIApplicationStarter onParse={handleAIParse} isLoading={isAIParsing} variant="underline" />
            </div>
        </fieldset>

        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('applicantDetails')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'applicantDetails'}>
                 <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Applicant Details</h2>
                    {sectionHasErrors.applicantDetails && openSection !== 'applicantDetails' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'applicantDetails'} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${openSection === 'applicantDetails' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <FormInput label="Applicant's First Name" id="applicantFirstName" required value={formData.firstName} onChange={e => handleFormUpdate({ firstName: e.target.value })} error={errors.firstName} />
                    <FormInput label="Applicant's Last Name" id="applicantLastName" required value={formData.lastName} onChange={e => handleFormUpdate({ lastName: e.target.value })} error={errors.lastName} />
                    <div className="md:col-span-2">
                        <FormInput label="Applicant's Email" id="applicantEmail" type="email" required value={formData.email} onChange={e => handleFormUpdate({ email: e.target.value })} error={errors.email} />
                    </div>
                </div>
            </div>
        </fieldset>
        
        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('contact')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'contact'}>
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Contact Information</h2>
                    {sectionHasErrors.contact && openSection !== 'contact' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'contact'} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${openSection === 'contact' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6 pt-4">
                    <div className="grid grid-cols-5 gap-x-4">
                        <div className="col-span-3">
                            <FormInput label="First Name" id="firstName" required value={formData.firstName} disabled />
                        </div>
                        <div className="col-span-2">
                             <FormInput label="Middle Name(s)" id="middleName" value={formData.middleName || ''} onChange={e => handleFormUpdate({ middleName: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-x-4">
                        <div className="col-span-3">
                            <FormInput label="Last Name" id="lastName" required value={formData.lastName} disabled />
                        </div>
                        <div className="col-span-2">
                            <FormInput label="Suffix" id="suffix" value={formData.suffix || ''} onChange={e => handleFormUpdate({ suffix: e.target.value })} />
                        </div>
                    </div>
                    <FormInput label="Email" id="email" required value={formData.email} disabled />
                    <FormInput label="Mobile Number" id="mobileNumber" required value={formData.mobileNumber} onChange={e => handleFormUpdate({ mobileNumber: e.target.value })} error={errors.mobileNumber} placeholder="(555) 555-5555" />
                </div>
            </div>
        </fieldset>

        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('addresses')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'addresses'}>
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">{t('profilePage.addresses')}</h2>
                    {sectionHasErrors.addresses && openSection !== 'addresses' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'addresses'} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${openSection === 'addresses' ? 'max-h-[2000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="pt-4" aria-live="polite">
                    <div className="mb-6">
                        <FormRadioGroup legend="Mailing Address Same as Primary?" name="isMailingAddressSame" options={[yes, no]} value={formData.isMailingAddressSame === null ? '' : (formData.isMailingAddressSame ? yes : no)} onChange={value => handleFormUpdate({ isMailingAddressSame: value === yes })} required error={errors.isMailingAddressSame} />
                    </div>
                    <div className="flip-container">
                        <div className={`flipper ${!formData.isMailingAddressSame && showMailingAddress ? 'is-flipped' : ''}`} style={{ height: cardHeight ? `${cardHeight}px` : 'auto' }}>
                            <div className="flip-front" ref={frontRef}>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-white">Primary Address</h3>
                                        {!formData.isMailingAddressSame && (
                                            <button type="button" onClick={() => setShowMailingAddress(true)} className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity">
                                                View Mailing Address
                                            </button>
                                        )}
                                    </div>
                                    <AddressFields address={formData.primaryAddress} onUpdate={(field, value) => handleAddressChange('primaryAddress', field, value)} onBulkUpdate={(parsed) => handleAddressBulkChange('primaryAddress', parsed)} prefix="primary" errors={errors.primaryAddress || {}} />
                                </div>
                            </div>
                            <div className="flip-back" ref={backRef}>
                                 <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold text-white">Mailing Address</h3>
                                        <button type="button" onClick={() => setShowMailingAddress(false)} className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] hover:opacity-80 transition-opacity">
                                            View Primary Address
                                        </button>
                                    </div>
                                    <AddressFields address={formData.mailingAddress || { country: '', street1: '', city: '', state: '', zip: '' }} onUpdate={(field, value) => handleAddressChange('mailingAddress', field, value)} onBulkUpdate={(parsed) => handleAddressBulkChange('mailingAddress', parsed)} prefix="mailing" errors={errors.mailingAddress || {}} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </fieldset>

        <fieldset className="border-b border-[#005ca0] pb-4">
            <button type="button" onClick={() => toggleSection('additionalDetails')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'additionalDetails'}>
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Additional Details</h2>
                    {sectionHasErrors.additionalDetails && openSection !== 'additionalDetails' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'additionalDetails'} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${openSection === 'additionalDetails' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-6 pt-4">
                    <div className="grid grid-cols-2 gap-6">
                        <FormInput type="date" label="Employment Start Date" id="employmentStartDate" required value={formData.employmentStartDate} onChange={e => handleFormUpdate({ employmentStartDate: e.target.value })} error={errors.employmentStartDate} />
                        <SearchableSelector label="Eligibility Type" id="eligibilityType" required value={formData.eligibilityType} options={employmentTypes} onUpdate={value => handleFormUpdate({ eligibilityType: value })} variant="underline" error={errors.eligibilityType} />
                    </div>

                    <FormInput type="number" label="Estimated Annual Household Income" id="householdIncome" required value={formData.householdIncome} onChange={e => handleFormUpdate({ householdIncome: parseFloat(e.target.value) || '' })} error={errors.householdIncome} />
                    <FormInput type="number" label="Number of people in household" id="householdSize" required value={formData.householdSize} onChange={e => handleFormUpdate({ householdSize: parseInt(e.target.value, 10) || '' })} error={errors.householdSize} />

                    <div className="grid grid-cols-2 gap-6">
                        <FormRadioGroup legend="Do you own your own home?" name="homeowner" options={['Yes', 'No']} value={formData.homeowner} onChange={value => handleFormUpdate({ homeowner: value as 'Yes' | 'No' })} required error={errors.homeowner} />
                        <SearchableSelector label="Preferred Language" id="preferredLanguage" value={formData.preferredLanguage || ''} options={languages} onUpdate={value => handleFormUpdate({ preferredLanguage: value })} variant="underline"/>
                    </div>
                </div>
            </div>
        </fieldset>

        <fieldset className="pb-4">
            <button type="button" onClick={() => toggleSection('consent')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'consent'}>
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Consent & Acknowledgement</h2>
                    {sectionHasErrors.consent && openSection !== 'consent' && <NotificationIcon />}
                </div>
                <ChevronIcon isOpen={openSection === 'consent'} />
            </button>
            <div className={`transition-all duration-500 ease-in-out ${openSection === 'consent' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-3 pt-4">
                    {errors.ackPolicies && <p className="text-red-400 text-xs">{errors.ackPolicies}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="ackPolicies" required checked={formData.ackPolicies} onChange={e => handleFormUpdate({ ackPolicies: e.target.checked })} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="ackPolicies" className="flex items-center ml-3 text-sm text-white">I have read and agree to E4E Relief’s Privacy Policy and Cookie Policy. <RequiredIndicator required isMet={formData.ackPolicies} /></label>
                    </div>
                    {errors.commConsent && <p className="text-red-400 text-xs">{errors.commConsent}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="commConsent" required checked={formData.commConsent} onChange={e => handleFormUpdate({ commConsent: e.target.checked })} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="commConsent" className="flex items-center ml-3 text-sm text-white">I consent to receive emails and text messages regarding my application. <RequiredIndicator required isMet={formData.commConsent} /></label>
                    </div>
                    {errors.infoCorrect && <p className="text-red-400 text-xs">{errors.infoCorrect}</p>}
                    <div className="flex items-start">
                        <input type="checkbox" id="infoCorrect" required checked={formData.infoCorrect} onChange={e => handleFormUpdate({ infoCorrect: e.target.checked })} className="h-4 w-4 text-[#ff8400] bg-gray-700 border-gray-600 rounded focus:ring-[#ff8400] mt-1" />
                        <label htmlFor="infoCorrect" className="flex items-center ml-3 text-sm text-white">All information I have provided is accurate. <RequiredIndicator required isMet={formData.infoCorrect} /></label>
                    </div>
                </div>
            </div>
        </fieldset>
      
      <div className="flex justify-end pt-8 flex-col items-end">
        {Object.keys(errors).length > 0 && (
            <div className="bg-red-800/50 border border-red-600 text-red-200 p-3 rounded-md mb-4 w-full max-w-sm text-sm" role="alert">
                <p className="font-bold text-center">Please correct the highlighted errors to continue.</p>
            </div>
        )}
        <button onClick={handleNext} className="bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          Next
        </button>
      </div>
    </div>
  );
};

export default ApplyProxyContactPage;