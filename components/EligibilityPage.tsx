import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { fundsRepo } from '../services/firestoreRepo';
import type { Fund } from '../data/fundData';

type Page = 'home' | 'profile';

interface EligibilityPageProps {
  navigate: (page: Page) => void;
  user: UserProfile;
}

const EligibilityPage: React.FC<EligibilityPageProps> = ({ navigate, user }) => {
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
          setError(`Could not load eligibility information for your fund (${user.fundCode}).`);
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
        <button onClick={() => navigate('home')} className="mt-4 text-[#ff8400] hover:opacity-80">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <div className="relative flex justify-center items-center mb-8">
        <button onClick={() => navigate('home')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[#ff8400] hover:opacity-80 transition-opacity" aria-label="Back to Home">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26] text-center">Eligible for Assistance?</h1>
      </div>

      <div className="text-center text-gray-300 max-w-2xl mx-auto my-8 space-y-4">
        <p>
            Your program covers the eligibility types and events below - confirm you're eligible before applying.
            You can check your current eligibility status on your <button onClick={() => navigate('profile')} className="font-semibold text-[#ff8400] hover:underline">Profile page</button>.
        </p>
        <div className="text-center inline-block space-y-1 bg-[#003a70]/50 p-4 rounded-md border border-[#005ca0]">
            <p><strong className="text-green-300">'Active'</strong> means you are eligible to apply.</p>
            <p><strong className="text-red-300">'Inactive'</strong> requires additional verification.</p>
        </div>
      </div>

      <div className="bg-[#003a70]/50 border border-[#005ca0] rounded-lg shadow-lg overflow-hidden">
        <div className="bg-[#004b8d] text-center py-3">
          <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Eligible</h2>
        </div>
        <table className="w-full text-left">
          <tbody className="divide-y divide-[#005ca0]">
            <tr>
              <th className="p-4 w-1/3 md:w-1/4 font-semibold align-top text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Eligibility Type</th>
              <td className="p-4">
                <div className="text-white space-y-1">
                  {fund.eligibleEmploymentTypes.map(type => <div key={type}>{type}</div>)}
                </div>
              </td>
            </tr>
            <tr>
              <th className="p-4 w-1/3 md:w-1/4 font-semibold align-top text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Disasters</th>
              <td className="p-4 text-white">
                 <div className="text-white space-y-1">
                  {fund.eligibleDisasters.map(event => <div key={event}>{event}</div>)}
                </div>
              </td>
            </tr>
            <tr>
              <th className="p-4 w-1/3 md:w-1/4 font-semibold align-top text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">Hardships</th>
              <td className="p-4 text-white">
                <div className="text-white space-y-1">
                  {fund.eligibleHardships.map(event => <div key={event}>{event}</div>)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EligibilityPage;