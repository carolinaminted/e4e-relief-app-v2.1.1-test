
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventData, Expense, UserProfile } from '../types';
import { expenseTypes } from '../data/appData';
import { FormInput } from './FormControls';
import { storageRepo } from '../services/firebaseStorageRepo';

interface AIApplyExpensesProps {
  formData: Partial<EventData>;
  userProfile: UserProfile;
  updateFormData: (data: Partial<EventData>) => void;
  disabled?: boolean;
  onNext: () => void;
}

// --- Icons ---
const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

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


const AIApplyExpenses: React.FC<AIApplyExpensesProps> = ({ formData, userProfile, updateFormData, disabled = false, onNext }) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalExpenses = useMemo(() => {
    return (formData.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [formData.expenses]);

  useEffect(() => {
    if (formData.requestedAmount !== totalExpenses) {
        updateFormData({ requestedAmount: totalExpenses });
    }
  }, [totalExpenses, updateFormData, formData.requestedAmount]);

  const handleAmountChange = (type: Expense['type'], amountStr: string) => {
    let amount: number | '' = amountStr === '' ? '' : parseFloat(amountStr) || 0;

    if (typeof amount === 'number' && amount > 10000) {
      amount = 10000;
    }

    const newExpenses = [...(formData.expenses || [])];
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
      const newExpenses = [...(formData.expenses || [])];
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
      console.error(`[AIApplyExpenses] File upload failed for type '${type}':`, error);
      let errorMessage = error.message || t('common.unknownError');
      setUploadErrors(prev => ({ ...prev, [expenseIdKey]: errorMessage }));
    } finally {
      setUploading(prev => ({ ...prev, [expenseIdKey]: false }));
    }
  };

  const handleDeleteFile = (type: Expense['type']) => {
    const newExpenses = [...(formData.expenses || [])];
    const expenseIndex = newExpenses.findIndex(exp => exp.type === type);

    if (expenseIndex > -1) {
      newExpenses[expenseIndex] = { ...newExpenses[expenseIndex], fileName: '', fileUrl: '' };
      updateFormData({ expenses: newExpenses });
    }
  };

  // Check if all expense types have a value greater than 0
  const isComplete = useMemo(() => {
      const expenses = formData.expenses || [];
      // Assuming all presented types must be filled, matching logic in parent checklist
      return expenseTypes.every(type => {
          const expense = expenses.find(e => e.type === type);
          return expense && expense.amount !== '' && Number(expense.amount) > 0;
      });
  }, [formData.expenses]);

  return (
    <div className="p-3 space-y-4">
       <div className="border-b border-[#005ca0] pb-4 flex justify-center items-center">
          <div className="text-center">
              <p className="text-xs text-white uppercase tracking-wider">{t('applyExpensesPage.totalExpensesLabel')}</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                  ${totalExpenses.toFixed(2)}
              </p>
          </div>
      </div>

      <div className="divide-y divide-[#005ca0]/50">
        {expenseTypes.map((type) => {
          const expenseIdKey = `exp-${type.replace(/\s+/g, '-')}`;
          const expense = (formData.expenses || []).find(e => e.type === type);
          const isUploading = uploading[expenseIdKey];
          const error = uploadErrors[expenseIdKey];
          const translationKey = `applyExpensesPage.expenseTypes.${type.replace(/\s+/g, '')}`;

          return (
            <div key={type} className="py-3 first:pt-0 last:pb-0">
              <h4 className="font-semibold text-md text-white mb-2">{t(translationKey, type)}</h4>
              <div className="grid grid-cols-2 gap-2 items-start">
                <FormInput
                  id={`amount-${type}`}
                  type="number"
                  value={expense?.amount || ''}
                  onChange={(e) => handleAmountChange(type, e.target.value)}
                  placeholder={t('applyExpensesPage.amountLabel')}
                  min="0"
                  max="10000"
                  step="0.01"
                  disabled={isUploading || disabled}
                  error={errors[type]}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <label className={`bg-[#005ca0] hover:bg-[#006ab3] text-white font-semibold py-2 px-3 rounded-md text-xs transition-colors duration-200 cursor-pointer flex items-center gap-1 ${isUploading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <UploadIcon />
                      <span>{isUploading ? t('applyExpensesPage.uploadingButton') : t('applyExpensesPage.uploadButton')}</span>
                      <input id={`receipt-${type}`} type="file" className="hidden" onChange={(e) => handleFileChange(type, e.target.files?.[0] || null)} disabled={isUploading || disabled} accept="image/jpeg,image/png,application/pdf" />
                    </label>
                    {isUploading && <UploadSpinner />}
                  </div>
                   {expense?.fileName && !isUploading && (
                      <div className="flex items-center gap-1 text-xs text-gray-300 truncate mt-2">
                        <span className="truncate" title={expense.fileName}>{expense.fileName}</span>
                        <button onClick={() => handleDeleteFile(type)} disabled={isUploading || disabled} className="text-red-400 hover:text-red-300 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" title={t('applyExpensesPage.removeReceipt')}><DeleteIcon /></button>
                      </div>
                    )}
                  {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-4 border-t border-[#005ca0]/30">
        <button
            onClick={onNext}
            disabled={disabled || !isComplete}
            className="w-full bg-[#ff8400] hover:bg-[#e67700] text-white font-bold py-3 px-6 rounded-md transition-colors duration-200 flex justify-center items-center h-12 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {t('common.next')}
        </button>
      </div>
    </div>
  );
};

export default AIApplyExpenses;
