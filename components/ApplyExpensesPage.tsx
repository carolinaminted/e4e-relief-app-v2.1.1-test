import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventData, Expense, UserProfile } from '../types';
import { expenseTypes } from '../data/appData';
import { FormInput } from './FormControls';
import { storageRepo } from '../services/firebaseStorageRepo';

interface ApplyExpensesPageProps {
  formData: EventData;
  userProfile: UserProfile;
  updateFormData: (data: Partial<EventData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

// --- Icons ---
const DeleteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const UploadSpinner: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
    </div>
);


const ApplyExpensesPage: React.FC<ApplyExpensesPageProps> = ({ formData, userProfile, updateFormData, nextStep, prevStep }) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalExpenses = useMemo(() => {
    return formData.expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [formData.expenses]);

  // Automatically update the requestedAmount in the parent form data whenever totalExpenses changes.
  // This is the core of the new logic.
  useEffect(() => {
    // Avoid sending an update if the value hasn't changed.
    if (formData.requestedAmount !== totalExpenses) {
        updateFormData({ requestedAmount: totalExpenses });
    }
  }, [totalExpenses, updateFormData, formData.requestedAmount]);

  const handleAmountChange = (type: Expense['type'], amountStr: string) => {
    let amount: number | '' = amountStr === '' ? '' : parseFloat(amountStr) || 0;

    if (typeof amount === 'number' && amount > 10000) {
      amount = 10000;
    }

    const newExpenses = [...formData.expenses];
    const expenseIndex = newExpenses.findIndex(exp => exp.type === type);

    if (expenseIndex > -1) {
      newExpenses[expenseIndex] = { ...newExpenses[expenseIndex], amount };
    } else {
      newExpenses.push({
        id: `exp-${type.replace(/\s+/g, '-')}`,
        type,
        amount,
        fileName: '',
        fileUrl: '',
      });
    }

    updateFormData({ expenses: newExpenses });
    if (errors[type]) {
      const newErrors = { ...errors };
      delete newErrors[type];
      setErrors(newErrors);
    }
  };

  const handleFileChange = async (type: Expense['type'], file: File | null) => {
    if (!file) return;

    const expenseIdKey = `exp-${type.replace(/\s+/g, '-')}`;
    setUploading(prev => ({ ...prev, [expenseIdKey]: true }));
    setUploadErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[expenseIdKey];
        return newErrors;
    });

    try {
      const newExpenses = [...formData.expenses];
      let expenseIndex = newExpenses.findIndex(exp => exp.type === type);

      if (expenseIndex === -1) {
        const newExpense: Expense = {
          id: expenseIdKey,
          type,
          amount: '',
          fileName: '',
          fileUrl: '',
        };
        newExpenses.push(newExpense);
        expenseIndex = newExpenses.length - 1;
      }
      const expenseId = newExpenses[expenseIndex].id;


      const { downloadURL, fileName } = await storageRepo.uploadExpenseReceipt(file, userProfile.uid, expenseId);

      newExpenses[expenseIndex] = { ...newExpenses[expenseIndex], fileName, fileUrl: downloadURL };
      updateFormData({ expenses: newExpenses });
    } catch (error: any) {
      console.error(`[ApplyExpensesPage] File upload failed for type '${type}':`, error);
      let errorMessage;
      if (error.code === 'storage/unauthorized') {
        errorMessage = t('applyExpensesPage.uploadFailedUnauthorized');
      } else {
        errorMessage = t('applyExpensesPage.uploadFailedGeneric', { message: error.message || t('common.unknownError') });
      }
      setUploadErrors(prev => ({ ...prev, [expenseIdKey]: errorMessage }));
    } finally {
      setUploading(prev => ({ ...prev, [expenseIdKey]: false }));
    }
  };

  const handleDeleteFile = (type: Expense['type']) => {
    const newExpenses = [...formData.expenses];
    const expenseIndex = newExpenses.findIndex(exp => exp.type === type);

    if (expenseIndex > -1) {
      newExpenses[expenseIndex] = { ...newExpenses[expenseIndex], fileName: '', fileUrl: '' };
      updateFormData({ expenses: newExpenses });
    }
  };

  const handleNext = () => {
    const validationErrors: Record<string, string> = {};
    
    // Per user feedback, ALL amount fields for the presented expense types are required.
    expenseTypes.forEach(type => {
        const expense = formData.expenses.find(e => e.type === type);
        
        if (!expense || expense.amount === '' || Number(expense.amount) <= 0) {
            validationErrors[type] = t('applyExpensesPage.errorAmount');
        }
    });

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      nextStep();
    }
  };

  return (
    <div className="space-y-8">
       <div className="border-b border-[var(--theme-border)] pb-8 flex justify-center items-center">
          <div className="text-center">
              <p className="text-sm text-white uppercase tracking-wider">{t('applyExpensesPage.totalExpensesLabel')}</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
                  ${totalExpenses.toFixed(2)}
              </p>
          </div>
      </div>

      <div className="flex flex-col gap-8">
        {expenseTypes.map((type) => {
          const expenseIdKey = `exp-${type.replace(/\s+/g, '-')}`;
          const expense = formData.expenses.find(e => e.type === type);
          const isUploading = uploading[expenseIdKey];
          const error = uploadErrors[expenseIdKey];
          const translationKey = `applyExpensesPage.expenseTypes.${type.replace(/\s+/g, '')}`;

          return (
            <div key={type}>
              <h4 className="font-semibold text-lg text-white mb-2">{t(translationKey, type)}</h4>
              <div className="grid grid-cols-2 gap-4 items-start">
                <FormInput
                  id={`amount-${type}`}
                  type="number"
                  value={expense?.amount || ''}
                  onChange={(e) => handleAmountChange(type, e.target.value)}
                  placeholder={t('applyExpensesPage.amountLabel')}
                  min="0"
                  max="10000"
                  step="0.01"
                  disabled={isUploading}
                  error={errors[type]}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <label className={`bg-[var(--theme-border)] hover:bg-[#006ab3] text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <span>{isUploading ? t('applyExpensesPage.uploadingButton') : t('applyExpensesPage.uploadButton')}</span>
                      <input id={`receipt-${type}`} type="file" className="hidden" onChange={(e) => handleFileChange(type, e.target.files?.[0] || null)} disabled={isUploading} accept="image/jpeg,image/png,application/pdf" />
                    </label>
                    {expense?.fileName ? (
                      <div className="flex items-center gap-2 text-sm text-gray-300 truncate">
                        <span title={expense.fileName}>{expense.fileName}</span>
                        <button onClick={() => handleDeleteFile(type)} disabled={isUploading} className="text-red-400 hover:text-red-300" title={t('applyExpensesPage.removeReceipt')}><DeleteIcon /></button>
                      </div>
                    ) : (
                      !isUploading && <span className="text-gray-400 text-sm">{t('applyExpensesPage.noFileChosen')}</span>
                    )}
                    {isUploading && <UploadSpinner />}
                  </div>
                  {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-start pt-4">
        <button onClick={prevStep} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
          {t('common.back')}
        </button>
        <div className="flex flex-col items-end">
            <button onClick={handleNext} className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-2 px-6 rounded-md transition-colors duration-200">
              {t('common.next')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyExpensesPage;