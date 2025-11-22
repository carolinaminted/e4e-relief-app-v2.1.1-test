
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FormInput } from './FormControls';

interface DonatePageProps {
  navigate: (page: 'support') => void;
}

const predefinedAmounts = [25, 50, 100, 250];

// --- UI Icons ---
const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[var(--theme-accent)] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const NotificationIcon: React.FC = () => (
    <span className="relative flex h-3 w-3" title="Action required in this section">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--theme-accent)] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--theme-accent)]"></span>
    </span>
);

type DonateSection = 'donor' | 'payment';

const DonatePage: React.FC<DonatePageProps> = ({ navigate }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<number | string>(50);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [openSection, setOpenSection] = useState<DonateSection | null>(() => {
    const saved = localStorage.getItem('donatePage_openSection');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('donatePage_openSection', JSON.stringify(openSection));
  }, [openSection]);

  const sectionHasErrors = useMemo(() => {
    const donorHasBlanks = !formData.firstName || !formData.lastName || !formData.email || !/\S+@\S+\.\S+/.test(formData.email);
    const paymentHasBlanks = !formData.cardholderName || formData.cardNumber.replace(/\s/g, '').length < 15 || !/^(0[1-9]|1[0-2]) \/ \d{2}$/.test(formData.expiryDate) || formData.cvc.length < 3;

    return {
        donor: donorHasBlanks,
        payment: paymentHasBlanks,
    };
  }, [formData]);

  const toggleSection = (section: DonateSection) => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  const handleAmountSelect = (selectedAmount: number | 'custom') => {
    if (selectedAmount === 'custom') {
      setAmount('');
    } else {
      setAmount(selectedAmount);
    }
     if (errors.amount) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.amount;
        return newErrors;
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    let finalValue = value;

    if (id === 'cardNumber') {
      finalValue = value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
    } else if (id === 'expiryDate') {
      finalValue = value.replace(/[^\d]/g, '').replace(/(\d{2})(\d{1,2})/, '$1 / $2').slice(0, 7);
    } else if (id === 'cvc') {
      finalValue = value.replace(/[^\d]/g, '').slice(0, 4);
    }

    setFormData(prev => ({ ...prev, [id]: finalValue }));
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!amount || Number(amount) <= 0) newErrors.amount = t('donatePage.errorAmount');
    if (!formData.firstName) newErrors.firstName = t('donatePage.errorFirstName');
    if (!formData.lastName) newErrors.lastName = t('donatePage.errorLastName');
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('donatePage.errorEmail');
    if (!formData.cardholderName) newErrors.cardholderName = t('donatePage.errorCardholderName');
    if (formData.cardNumber.replace(/\s/g, '').length < 15) newErrors.cardNumber = t('donatePage.errorCardNumber');
    if (!/^(0[1-9]|1[0-2]) \/ \d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = t('donatePage.errorExpiryFormat');
    } else {
        const [month, year] = formData.expiryDate.split(' / ');
        const expiry = new Date(Number(`20${year}`), Number(month) - 1);
        const now = new Date();
        now.setMonth(now.getMonth(), 1); // Compare against the first day of the current month
        if (expiry < now) {
            newErrors.expiryDate = t('donatePage.errorExpiryDate');
        }
    }
    if (formData.cvc.length < 3) newErrors.cvc = t('donatePage.errorCvc');
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
        if (newErrors.firstName || newErrors.lastName || newErrors.email) {
            if(openSection !== 'donor') setOpenSection('donor');
        } else if (newErrors.cardholderName || newErrors.cardNumber || newErrors.expiryDate || newErrors.cvc) {
             if(openSection !== 'payment') setOpenSection('payment');
        }
    }
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 2000);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-full max-w-md bg-[var(--theme-bg-secondary)] p-10 rounded-lg shadow-lg">
          <svg className="w-16 h-16 text-[#edda26] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
            {t('donatePage.successTitle')}
          </h1>
          <p className="text-white mb-8">
            {t('donatePage.successBody', { amount: Number(amount).toFixed(2) })}
          </p>
          <button
            onClick={() => navigate('support')}
            className="w-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
          >
            {t('donatePage.backToSupport')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-6">
            <button onClick={() => navigate('support')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[var(--theme-accent)] hover:opacity-80 transition-opacity" aria-label={t('faqPage.backToSupport')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
              {t('donatePage.title')}
            </h1>
        </div>
        
        <form onSubmit={handleSubmit} noValidate className="bg-[var(--theme-bg-secondary)] p-6 md:p-8 rounded-lg grid grid-cols-1 lg:grid-cols-2 lg:gap-x-12">
            {/* Left Column */}
            <div className="lg:pr-8">
                {/* Static Amount Section */}
                <div className="pb-4">
                    <div className="flex items-center gap-3 py-2">
                        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('donatePage.chooseAmount')}</h2>
                    </div>
                    <p className="text-gray-300 text-sm mt-2 mb-4 hidden lg:block">{t('donatePage.description')}</p>
                    <div className="mt-4">
                        <div className="grid grid-cols-3 gap-2">
                            {predefinedAmounts.map(preAmount => (
                                <button type="button" key={preAmount} onClick={() => handleAmountSelect(preAmount)} className={`py-2 px-3 rounded-md font-semibold text-sm transition-all duration-200 border-2 ${amount === preAmount ? 'bg-[var(--theme-accent)] text-white border-[var(--theme-accent)]' : 'bg-[var(--theme-bg-primary)] border-transparent hover:border-[var(--theme-accent)]'}`}>
                                    ${preAmount}
                                </button>
                            ))}
                            <input 
                                type="number" 
                                placeholder={t('donatePage.customAmount')}
                                value={typeof amount === 'number' ? '' : amount}
                                onChange={(e) => setAmount(e.target.value)}
                                onFocus={() => handleAmountSelect('custom')}
                                className={`py-2 px-3 rounded-md font-semibold text-base text-center bg-[var(--theme-bg-primary)] border-2 focus:bg-[var(--theme-accent)] focus:text-white focus:border-[var(--theme-accent)] focus:outline-none focus:ring-0 col-span-2 ${!predefinedAmounts.includes(Number(amount)) && amount !== '' ? 'bg-[var(--theme-accent)] text-white border-[var(--theme-accent)]' : 'border-transparent'}`}
                            />
                        </div>
                        {errors.amount && <p className="text-red-400 text-xs mt-2">{errors.amount}</p>}
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 pt-4 lg:pt-0">
                {/* Donor Information Section */}
                <fieldset className="pb-4">
                    <button type="button" onClick={() => toggleSection('donor')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'donor'}>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('donatePage.donorInfo')}</h2>
                            {sectionHasErrors.donor && openSection !== 'donor' && <NotificationIcon />}
                        </div>
                        <ChevronIcon isOpen={openSection === 'donor'} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out ${openSection === 'donor' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <FormInput label={t('donatePage.firstName')} id="firstName" value={formData.firstName} onChange={handleInputChange} error={errors.firstName} required />
                            <FormInput label={t('donatePage.lastName')} id="lastName" value={formData.lastName} onChange={handleInputChange} error={errors.lastName} required />
                            <div className="md:col-span-2">
                            <FormInput label={t('donatePage.email')} id="email" type="email" value={formData.email} onChange={handleInputChange} error={errors.email} required />
                            </div>
                        </div>
                    </div>
                </fieldset>

                {/* Payment Information Section */}
                <fieldset className="pb-4">
                    <button type="button" onClick={() => toggleSection('payment')} className="w-full flex justify-between items-center text-left py-2" aria-expanded={openSection === 'payment'}>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('donatePage.paymentInfo')}</h2>
                            {sectionHasErrors.payment && openSection !== 'payment' && <NotificationIcon />}
                        </div>
                        <ChevronIcon isOpen={openSection === 'payment'} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out ${openSection === 'payment' ? 'max-h-[1000px] opacity-100 mt-4 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <div className="space-y-5 pt-4">
                            <FormInput label={t('donatePage.cardholderName')} id="cardholderName" value={formData.cardholderName} onChange={handleInputChange} error={errors.cardholderName} required />
                            <FormInput label={t('donatePage.cardNumber')} id="cardNumber" value={formData.cardNumber} onChange={handleInputChange} error={errors.cardNumber} placeholder="0000 0000 0000 0000" required />
                            <div className="flex gap-5">
                                <FormInput label={t('donatePage.expiryDate')} id="expiryDate" value={formData.expiryDate} onChange={handleInputChange} error={errors.expiryDate} placeholder="MM / YY" required />
                                <FormInput label={t('donatePage.cvc')} id="cvc" value={formData.cvc} onChange={handleInputChange} error={errors.cvc} placeholder="123" required />
                            </div>
                        </div>
                    </div>
                </fieldset>

                <div className="flex justify-center pt-6">
                    <button 
                        type="submit"
                        disabled={isProcessing}
                        className="w-full max-w-xs bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] hover:opacity-90 text-white font-bold py-3 px-6 rounded-md transition-all duration-200 flex justify-center items-center h-12 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isProcessing ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                        ) : (
                            t('donatePage.donateButton', { amount: Number(amount) > 0 ? Number(amount).toFixed(2) : '0.00' })
                        )}
                    </button>
                </div>
            </div>
        </form>
    </div>
  );
};

export default DonatePage;
