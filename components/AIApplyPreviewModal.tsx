
import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface AIApplyPreviewModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const AIApplyPreviewModal: React.FC<AIApplyPreviewModalProps> = ({ onClose, children }) => {
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
                className="bg-[var(--theme-bg-primary)] rounded-lg shadow-xl p-0 w-full max-w-lg m-4 relative border border-[var(--theme-border)] max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: 'var(--theme-bg-primary)', borderColor: 'var(--theme-border)' }}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white z-10 p-2 bg-black/20 rounded-full backdrop-blur-sm"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-t-lg">
                     {children}
                </div>
                <footer className="p-4 border-t border-[var(--theme-border)] flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
                    >
                        {t('common.close', 'Close')}
                    </button>
                </footer>
            </div>
        </div>,
        modalRoot
    );
};

export default AIApplyPreviewModal;
