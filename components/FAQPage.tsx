
import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';

type Page = 'support';

interface FAQPageProps {
  navigate: (page: Page) => void;
}

type FaqItem = {
    question: string;
    answer: string | string[];
};

const FAQItem: React.FC<{ faq: FaqItem, isOpen: boolean, onClick: () => void }> = ({ faq, isOpen, onClick }) => {
    
    const renderAnswer = () => {
        if (Array.isArray(faq.answer)) {
            const content: React.ReactNode[] = [];
            let listItems: React.ReactNode[] = [];
            let inList = false;

            faq.answer.forEach((line, index) => {
                if (line.startsWith('#### ')) {
                    if (inList) {
                        content.push(<ul key={`ul-${index}`} className="list-disc list-inside mt-2 space-y-1">{listItems}</ul>);
                        listItems = [];
                        inList = false;
                    }
                    content.push(<h4 key={`h4-${index}`} className="font-bold text-white mt-3 first:mt-0">{line.substring(5)}</h4>);
                } else if (line.startsWith('- ')) {
                    inList = true;
                    listItems.push(<li key={`li-${index}`}>{line.substring(2)}</li>);
                } else {
                    if (inList) {
                        content.push(<ul key={`ul-${index}`} className="list-disc list-inside mt-2 space-y-1">{listItems}</ul>);
                        listItems = [];
                        inList = false;
                    }
                    content.push(<p key={`p-${index}`}>{line}</p>);
                }
            });

            if (inList) {
                content.push(<ul key="ul-last" className="list-disc list-inside mt-2 space-y-1">{listItems}</ul>);
            }
            return <div className="space-y-3">{content}</div>;
        }

        if (typeof faq.answer === 'string') {
            // Use Trans to correctly render links. This is safer than dangerouslySetInnerHTML.
            // The component will replace placeholders like <1>...</1> with the provided React components.
            const emailMatch = faq.answer.match(/<1>(.*?)<\/1>/);
            
            return (
                <p>
                    <Trans
                        defaults={faq.answer}
                        components={{
                            1: emailMatch ? <a href={`mailto:${emailMatch[1]}`} className="text-[var(--theme-accent)] hover:underline" /> : <span />,
                        }}
                    />
                </p>
            );
        }

        return null;
    };

    return (
        <div className="mb-2">
            <button
                onClick={onClick}
                className={`w-full flex justify-between items-center text-left py-3 px-4 rounded-lg transition-all duration-200 ${isOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}
                aria-expanded={isOpen}
            >
                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] text-base sm:text-lg font-medium brightness-125">
                    {faq.question}
                </h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-[var(--theme-accent)] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pl-6 text-gray-200 leading-relaxed">
                    <div>{renderAnswer()}</div>
                </div>
            </div>
        </div>
    );
};

const FAQSection: React.FC<{ title: string; faqs: FaqItem[]; isOpen: boolean; onToggleSection: () => void }> = ({ title, faqs, isOpen, onToggleSection }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    
    useEffect(() => {
        if (!isOpen) {
            setOpenIndex(null);
        }
    }, [isOpen]);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="bg-[var(--theme-bg-secondary)]/80 backdrop-blur-md rounded-2xl shadow-xl mb-6 overflow-hidden">
            <button
                onClick={onToggleSection}
                className="w-full flex justify-between items-center text-left p-6"
                aria-expanded={isOpen}
            >
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] brightness-125">{title}</h2>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 text-[var(--theme-accent)] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 space-y-1">
                    {faqs.map((faq, index) => (
                        <FAQItem 
                            key={index} 
                            faq={faq} 
                            isOpen={openIndex === index} 
                            onClick={() => handleToggle(index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const FAQPage: React.FC<FAQPageProps> = ({ navigate }) => {
    const { t } = useTranslation();
    const [openSection, setOpenSection] = useState<'applicant' | 'donor' | null>(() => {
        const saved = localStorage.getItem('faqPage_openSection');
        return saved ? JSON.parse(saved) : null;
    });

    const applicantFaqsData = t('faqPage.applicantFaqs', { returnObjects: true });
    const donorFaqsData = t('faqPage.donorFaqs', { returnObjects: true });

    // Guard against t() returning a string before translations are loaded.
    const applicantFaqs: FaqItem[] = Array.isArray(applicantFaqsData) ? applicantFaqsData : [];
    const donorFaqs: FaqItem[] = Array.isArray(donorFaqsData) ? donorFaqsData : [];

    useEffect(() => {
        localStorage.setItem('faqPage_openSection', JSON.stringify(openSection));
    }, [openSection]);

    const handleToggleSection = (section: 'applicant' | 'donor') => {
        setOpenSection(openSection === section ? null : section);
    };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-8">
            <button onClick={() => navigate('support')} className="absolute left-0 z-10 text-[var(--theme-accent)] hover:opacity-80 transition-opacity" aria-label={t('faqPage.backToSupport')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] text-center px-12 brightness-125">
              {t('faqPage.title')}
            </h1>
        </div>
        
        <FAQSection
            title={t('faqPage.applicantTitle')}
            faqs={applicantFaqs}
            isOpen={openSection === 'applicant'}
            onToggleSection={() => handleToggleSection('applicant')}
        />
        
        <FAQSection
            title={t('faqPage.donorTitle')}
            faqs={donorFaqs}
            isOpen={openSection === 'donor'}
            onToggleSection={() => handleToggleSection('donor')}
        />
      </div>
    </div>
  );
};

export default FAQPage;
