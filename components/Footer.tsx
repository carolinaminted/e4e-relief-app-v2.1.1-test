import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PolicyModal from './PolicyModal';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  return (
    <>
      <footer className="w-full text-center py-4 mt-auto">
        <button
          onClick={() => setIsPolicyModalOpen(true)}
          className="text-xs text-[#898c8d] hover:text-white transition-colors duration-200"
        >
          {t('homePage.poweredBy')}
        </button>
      </footer>
      {isPolicyModalOpen && <PolicyModal onClose={() => setIsPolicyModalOpen(false)} />}
    </>
  );
};

export default Footer;
