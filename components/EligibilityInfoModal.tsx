import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface EligibilityInfoModalProps {
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

const EligibilityInfoModal: React.FC<EligibilityInfoModalProps> = ({ message, onClose, onRetry }) => {
  const { t } = useTranslation();
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[var(--theme-bg-primary)] rounded-lg shadow-xl p-6 w-full max-w-sm m-4 relative border border-[var(--theme-border)]"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border)' }}
      >
        <div className="text-center">
            <p className="text-white mb-6">{message}</p>
            <div className="flex flex-col gap-3">
                {onRetry && (
                    <button
                        onClick={() => {
                            onRetry();
                            onClose();
                        }}
                        className="bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        {t('common.verify', 'Re-attempt Verification')}
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="bg-transparent border border-gray-400 text-gray-300 hover:text-white hover:border-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                >
                    {t('common.close', 'Close')}
                </button>
            </div>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default EligibilityInfoModal;