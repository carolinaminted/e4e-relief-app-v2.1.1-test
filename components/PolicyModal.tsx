
import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface PolicyModalProps {
  onClose: () => void;
}

const PolicyModal: React.FC<PolicyModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  const links = [
    { name: t('modals.policy.privacy'), url: 'https://www.e4erelief.org/privacy-policy' },
    { name: t('modals.policy.terms'), url: 'https://www.e4erelief.org/terms-of-use' },
    { name: t('modals.policy.cookies'), url: 'https://www.e4erelief.org/cookies-policy' },
    { name: t('modals.policy.ai'), url: 'https://www.e4erelief.org/ai-policy' },
  ];

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
    >
      <div 
        className="bg-[var(--theme-bg-secondary)] rounded-lg shadow-xl p-8 w-full max-w-md m-4 relative border border-[var(--theme-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 id="policy-modal-title" className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] text-center">
          {t('modals.policy.title')}
        </h2>
        <div className="space-y-4">
          {links.map(link => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[var(--theme-bg-primary)] hover:bg-[var(--theme-border)] text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 border border-[var(--theme-border)]"
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default PolicyModal;
