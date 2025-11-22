
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Application, Page, UserProfile } from '../types';
import ApplicationDetailModal from './ApplicationDetailModal';

interface MyApplicationsPageProps {
  navigate: (page: Page) => void;
  applications: Application[];
  userProfile: UserProfile;
  onAddIdentity: (fundCode: string) => void;
}

const statusStyles: Record<Application['status'], string> = {
    Submitted: 'text-[var(--theme-accent)]',
    Awarded: 'text-[var(--theme-gradient-end)]',
    Declined: 'text-red-400',
};

const MyApplicationsPage: React.FC<MyApplicationsPageProps> = ({ navigate, applications, userProfile, onAddIdentity }) => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const sortedApplications = useMemo(() => {
    return [...applications].reverse(); // Newest first
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (!searchTerm) {
      return sortedApplications;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return sortedApplications.filter(app => {
        const submittedDateTime = `${new Date(app.submittedDate).toLocaleDateString(i18n.language)} at ${new Date(app.submittedDate).toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        return (
            app.event.toLowerCase().includes(lowercasedFilter) ||
            (app.otherEvent && app.otherEvent.toLowerCase().includes(lowercasedFilter)) ||
            app.status.toLowerCase().includes(lowercasedFilter) ||
            app.id.toLowerCase().includes(lowercasedFilter) ||
            submittedDateTime.toLowerCase().includes(lowercasedFilter)
        );
    });
  }, [sortedApplications, searchTerm, i18n.language]);

  return (
    <>
      <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-8">
            <button onClick={() => navigate('profile')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[var(--theme-accent)] hover:opacity-80 transition-opacity" aria-label={t('common.back')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div className="text-center">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('myApplicationsPage.title')}</h1>
                {userProfile && (
                  <div className="mt-2 flex flex-col items-center gap-2">
                    <p className="text-lg text-gray-300">{userProfile.fundName} ({userProfile.fundCode})</p>
                  </div>
                )}
            </div>
        </div>
        
        <div className="mb-6">
            <input
                type="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('myApplicationsPage.searchPlaceholder')}
                className="w-full bg-[var(--theme-bg-secondary)]/50 border border-[var(--theme-border)] rounded-md p-3 text-base text-white placeholder-gray-400 focus:ring-2 focus:ring-[var(--theme-accent)] focus:border-transparent"
            />
        </div>

        <div className="space-y-4">
          {filteredApplications.length > 0 ? (
            filteredApplications.map(app => (
              <button key={app.id} onClick={() => setSelectedApplication(app)} className="w-full text-left bg-[var(--theme-bg-secondary)] p-4 rounded-md flex justify-between items-center hover:bg-[var(--theme-bg-primary)]/50 transition-colors duration-200">
                <div>
                  <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{app.event === 'My disaster is not listed' ? app.otherEvent : app.event}</p>
                  <p className="text-sm text-gray-300">{t('profilePage.submitted')}: {new Date(app.submittedDate).toLocaleDateString(i18n.language)} at {new Date(app.submittedDate).toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">${app.requestedAmount.toFixed(2)}</p>
                  <p className="text-sm text-gray-300">{t('profilePage.status')}: <span className={`font-medium ${statusStyles[app.status]}`}>{t(`applicationStatus.${app.status}`)}</span></p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12 bg-[var(--theme-bg-secondary)]/50 rounded-lg">
              <p className="text-gray-300">{searchTerm ? t('myApplicationsPage.noResults') : t('myApplicationsPage.noApplications')}</p>
            </div>
          )}
        </div>
      </div>
      {selectedApplication && (
        <ApplicationDetailModal 
          application={selectedApplication} 
          onClose={() => setSelectedApplication(null)} 
        />
      )}
    </>
  );
};

export default MyApplicationsPage;
