
import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { fundsRepo } from '../services/firestoreRepo';
import type { Fund } from '../data/fundData';

type Page = 'fundPortal';

interface ProgramDetailsPageProps {
  navigate: (page: Page) => void;
  user: UserProfile;
}

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <tr className="border-b border-[var(--theme-border)] last:border-b-0">
    <th scope="row" className="p-4 w-1/3 md:w-1/4 font-semibold align-top text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{label}</th>
    <td className="p-4 text-white">{children}</td>
  </tr>
);

const ProgramDetailsPage: React.FC<ProgramDetailsPageProps> = ({ navigate, user }) => {
  const [fund, setFund] = useState<Fund | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFund = async () => {
      try {
        const fundData = await fundsRepo.getFund(user.fundCode);
        if (fundData) {
          setFund(fundData);
        } else {
          setError(`Could not load program details for fund (${user.fundCode}).`);
        }
      } catch (e) {
        setError('An error occurred while fetching fund details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFund();
  }, [user.fundCode]);

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={() => navigate('fundPortal')} className="mt-4 text-[var(--theme-accent)] hover:opacity-80">
          Back to Fund Portal
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="relative flex justify-center items-center mb-8">
        <button onClick={() => navigate('fundPortal')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[var(--theme-accent)] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">Program Details</h1>
      </div>

      <div className="bg-[var(--theme-bg-primary)]/50 border border-[var(--theme-border)] rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-[var(--theme-bg-secondary)]">
            <h2 className="text-xl text-center font-semibold text-white">{fund.name} ({fund.code})</h2>
        </div>
        <table className="w-full text-left">
          <tbody>
            <DetailRow label="Verification Type">{fund.cvType}</DetailRow>
            <DetailRow label="Grant Limits">
                <div className="space-y-1">
                    <div>Single Request Max: ${fund.limits.singleRequestMax.toLocaleString()}</div>
                    <div>12-Month Max: ${fund.limits.twelveMonthMax.toLocaleString()}</div>
                    <div>Lifetime Max: ${fund.limits.lifetimeMax.toLocaleString()}</div>
                </div>
            </DetailRow>
            <DetailRow label="Eligible Disasters">
                <div className="flex flex-wrap gap-2">
                    {(fund.eligibleDisasters || []).map(e => <span key={e} className="bg-[var(--theme-border)] text-xs font-medium px-2 py-1 rounded-full">{e}</span>)}
                </div>
            </DetailRow>
            <DetailRow label="Eligible Hardships">
                 <div className="flex flex-wrap gap-2">
                    {(fund.eligibleHardships || []).map(e => <span key={e} className="bg-[var(--theme-border)] text-xs font-medium px-2 py-1 rounded-full">{e}</span>)}
                </div>
            </DetailRow>
             <DetailRow label="Eligible Employment">
                 <div className="flex flex-wrap gap-2">
                    {(fund.eligibleEmploymentTypes || []).map(e => <span key={e} className="bg-[var(--theme-border)] text-xs font-medium px-2 py-1 rounded-full">{e}</span>)}
                </div>
            </DetailRow>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgramDetailsPage;
