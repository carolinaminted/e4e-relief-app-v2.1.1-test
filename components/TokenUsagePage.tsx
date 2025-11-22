
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile, TokenUsageTableRow, TopUserData, LastHourUsageDataPoint, TokenEvent, ModelPricing } from '../types';
import { tokenEventsRepo, fundsRepo } from '../services/firestoreRepo';
import type { Fund } from '../data/fundData';

import { TopUserChart, LastHourUsageChart, TopFundsChart } from './TokenUsageCharts';
import TokenUsageTable from './TokenUsageTable';

interface TokenUsagePageProps {
  navigate: (page: 'fundPortal') => void;
  currentUser: UserProfile;
}

const MODEL_PRICING: ModelPricing = {
  'gemini-2.5-flash': { input: 0.00035, output: 0.00070 },
  'gemini-2.5-pro': { input: 0.0035, output: 0.0070 },
  'gemini-3-pro-preview': { input: 0.0035, output: 0.0070 },
};

// Types for sorting
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: keyof TokenUsageTableRow;
  direction: SortDirection;
}

const ChevronIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[var(--theme-accent)] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const CardLoader: React.FC = () => (
    <div className="absolute inset-0 bg-[var(--theme-bg-primary)]/90 rounded-lg flex flex-col items-center justify-center z-10">
        <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[var(--theme-accent)] rounded-full animate-pulse" style={{ animationDelay: '-0.3s' }}></div>
            <div className="w-3 h-3 bg-[var(--theme-accent)] rounded-full animate-pulse" style={{ animationDelay: '-0.15s' }}></div>
            <div className="w-3 h-3 bg-[var(--theme-accent)] rounded-full animate-pulse"></div>
        </div>
        <p className="text-white text-sm mt-2">Loading Analytics...</p>
    </div>
);

const TokenUsagePage: React.FC<TokenUsagePageProps> = ({ navigate, currentUser }) => {
  const [isFetching, setIsFetching] = useState(true);
  const [allEvents, setAllEvents] = useState<TokenEvent[]>([]);
  const [allFunds, setAllFunds] = useState<Fund[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'date', direction: 'descending' });


  const [openSections, setOpenSections] = useState(() => {
    const saved = localStorage.getItem('tokenUsagePage_openSections');
    const defaults = { lastHour: true, last15: true, lifetime: true };
    try {
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch (e) {
        console.error("Failed to parse open sections from localStorage", e);
        return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem('tokenUsagePage_openSections', JSON.stringify(openSections));
  }, [openSections]);

  const toggleSection = (section: 'lastHour' | 'last15' | 'lifetime') => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  // FIX: Define chartColors constant for use in charts.
  const chartColors = ['var(--theme-accent)', 'var(--theme-gradient-end)', '#0091b3', '#94d600'];

  const fetchData = useCallback(async () => {
    setIsFetching(true);
    try {
        const [events, funds] = await Promise.all([
            tokenEventsRepo.getAllEvents(),
            fundsRepo.getAllFunds()
        ]);
        setAllEvents(events);
        setAllFunds(funds);
    } catch (error) {
        console.error("Failed to fetch token analytics:", error);
        setAllEvents([]);
        setAllFunds([]);
    } finally {
        setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fundMap = useMemo(() => {
    return new Map(allFunds.map(fund => [fund.code, fund.name]));
  }, [allFunds]);

  const tableData = useMemo((): TokenUsageTableRow[] => {
    // Aggregate data by User, Session, Feature AND Model
    const usageByFeatureInSession: { [key: string]: Omit<TokenUsageTableRow, 'user' | 'session' | 'feature' | 'model'> } = {};
    for (const event of allEvents) {
        const key = `${event.userId}|${event.sessionId}|${event.feature}|${event.model}`;
        if (!usageByFeatureInSession[key]) {
            const eventDate = new Date(event.timestamp);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            usageByFeatureInSession[key] = { 
                date: formattedDate, 
                input: 0, 
                cached: 0, 
                output: 0, 
                total: 0, 
                cost: 0, 
                userName: event.userName, 
                fundCode: event.fundCode,
                fundName: fundMap.get(event.fundCode) || event.fundCode
            };
        }
        const pricing = MODEL_PRICING[event.model] || { input: 0, output: 0 };
        const eventCost = ((event.inputTokens / 1000) * pricing.input) + ((event.outputTokens / 1000) * pricing.output);

        usageByFeatureInSession[key].input += event.inputTokens;
        usageByFeatureInSession[key].cached += event.cachedInputTokens;
        usageByFeatureInSession[key].output += event.outputTokens;
        usageByFeatureInSession[key].total += event.inputTokens + event.cachedInputTokens + event.outputTokens;
        usageByFeatureInSession[key].cost += eventCost;
    }
    return Object.entries(usageByFeatureInSession).map(([key, data]) => {
        const [user, session, feature, model] = key.split('|');
        return { user, session, feature, model, ...data };
    }) as TokenUsageTableRow[];
  }, [allEvents, fundMap]);
  
  const recentTableData = useMemo(() => {
    const sortedByDate = [...tableData].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Descending
    });
    return sortedByDate.slice(0, 25);
  }, [tableData]);

  const processedTableData = useMemo(() => {
    let sortedData = [...recentTableData];

    if (sortConfig !== null) {
      sortedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle different data types for accurate sorting
        if (sortConfig.key === 'date') {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        } else {
            const strA = String(aValue).toLowerCase();
            const strB = String(bValue).toLowerCase();
            if (strA < strB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (strA > strB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }
      });
    }

    if (!searchTerm) {
      return sortedData;
    }

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return sortedData.filter(row => 
        row.userName.toLowerCase().includes(lowercasedSearchTerm) ||
        row.fundName.toLowerCase().includes(lowercasedSearchTerm) ||
        row.feature.toLowerCase().includes(lowercasedSearchTerm) ||
        row.model.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [recentTableData, searchTerm, sortConfig]);

  const topUserData = useMemo((): TopUserData | null => {
    if (allEvents.length === 0) return null;
    const usageByUser: { [userName: string]: TopUserData } = {};
    for (const event of allEvents) {
        if (!usageByUser[event.userName]) {
            usageByUser[event.userName] = { userName: event.userName, inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0 };
        }
        usageByUser[event.userName].inputTokens += event.inputTokens;
        usageByUser[event.userName].cachedInputTokens += event.cachedInputTokens;
        usageByUser[event.userName].outputTokens += event.outputTokens;
        usageByUser[event.userName].totalTokens += event.inputTokens + event.cachedInputTokens + event.outputTokens;
    }
    const allUsers = Object.values(usageByUser);
    if (allUsers.length === 0) return null;
    return allUsers.reduce((max, current) => current.totalTokens > max.totalTokens ? current : max, allUsers[0]);
  }, [allEvents]);

  const lastHourUsage = useMemo((): LastHourUsageDataPoint[] => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const relevantEvents = allEvents.filter(event => new Date(event.timestamp) >= oneHourAgo);
      const usageByMinute: Map<string, number> = new Map();

      for (const event of relevantEvents) {
          const eventDate = new Date(event.timestamp);
          eventDate.setSeconds(0, 0);
          const minuteKey = eventDate.toISOString();
          const totalTokens = event.inputTokens + event.cachedInputTokens + event.outputTokens;
          usageByMinute.set(minuteKey, (usageByMinute.get(minuteKey) || 0) + totalTokens);
      }
      
      const fullHourData: LastHourUsageDataPoint[] = [];
      for (let i = 0; i <= 60; i++) {
          const minuteTimestamp = new Date(oneHourAgo.getTime() + i * 60 * 1000);
          minuteTimestamp.setSeconds(0, 0);
          const minuteKey = minuteTimestamp.toISOString();
          fullHourData.push({ timestamp: minuteKey, totalTokens: usageByMinute.get(minuteKey) || 0 });
      }
      return fullHourData;
  }, [allEvents]);

  const { totalCost, totalTokens } = useMemo(() => {
      return tableData.reduce((acc, row) => {
          acc.totalCost += row.cost;
          acc.totalTokens += row.total;
          return acc;
      }, { totalCost: 0, totalTokens: 0 });
  }, [tableData]);

  const topFundsData = useMemo(() => {
    if (allEvents.length === 0) return [];
    const usageByFund: { [fundCode: string]: number } = {};
    for (const event of allEvents) {
        if (!usageByFund[event.fundCode]) {
            usageByFund[event.fundCode] = 0;
        }
        usageByFund[event.fundCode] += event.inputTokens + event.cachedInputTokens + event.outputTokens;
    }

    return Object.entries(usageByFund)
        .map(([fundCode, totalTokens]) => ({
            label: fundMap.get(fundCode) || fundCode,
            value: totalTokens,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
  }, [allEvents, fundMap]);

  const handleSort = (key: keyof TokenUsageTableRow) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleExportCSV = () => {
    if (processedTableData.length === 0) return;
    const headers = ['User Name', 'Email', 'Fund', 'Date', 'Session ID', 'Feature', 'Model', 'Input Tokens', 'Cached Tokens', 'Output Tokens', 'Total Tokens', 'Cost (USD)'];
    const rows = processedTableData.map(row => 
      [
        `"${row.userName}"`,
        row.user,
        row.fundName,
        row.date,
        row.session,
        row.feature,
        row.model,
        row.input,
        row.cached,
        row.output,
        row.total,
        row.cost.toFixed(6)
      ].join(',')
    );
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'token-usage.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full relative">
        <div className="relative flex justify-center items-center mb-8">
             <button onClick={() => navigate('fundPortal')} className="absolute left-0 md:left-auto md:right-full md:mr-8 text-[var(--theme-accent)] hover:opacity-80 transition-opacity" aria-label="Back to Fund Portal">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">Token Usage</h1>
              <p className="text-lg text-gray-300 mt-2">All token usage across all funds</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 py-2 border-y border-[var(--theme-border)]">
            <button 
                onClick={fetchData} 
                className="bg-[var(--theme-bg-secondary)] hover:bg-[var(--theme-border)] text-white font-semibold p-2 rounded-md text-sm transition-colors duration-200 flex items-center justify-center border border-[var(--theme-border)] disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                aria-label="Refresh data"
                disabled={isFetching}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-500 ${isFetching ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span>{isFetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            
            <div>
                <button 
                    onClick={handleExportCSV}
                    disabled={processedTableData.length === 0}
                    className="bg-[var(--theme-bg-secondary)] hover:bg-[var(--theme-border)] text-white font-semibold py-2 px-3 rounded-md text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--theme-border)]"
                    aria-label="Export Lifetime Token Usage to CSV"
                >
                    Export CSV
                </button>
            </div>
        </div>
        
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="relative bg-[var(--theme-bg-primary)]/50 p-4 rounded-lg border border-[var(--theme-border)]">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-center mb-2">Cost (USD)</h3>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-end)] to-[var(--theme-gradient-start)] text-center">
                        {isFetching ? '$0.0000' : `$${totalCost.toFixed(4)}`}
                    </p>
                    {isFetching && <CardLoader />}
                </div>
                <div className="relative bg-[var(--theme-bg-primary)]/50 p-4 rounded-lg border border-[var(--theme-border)]">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-center mb-2">Tokens Used</h3>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] text-center">
                        {isFetching ? '0' : totalTokens.toLocaleString()}
                    </p>
                    {isFetching && <CardLoader />}
                </div>
                 <div className="relative bg-[var(--theme-bg-primary)]/50 p-4 rounded-lg border border-[var(--theme-border)] md:col-span-2 lg:col-span-1">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider text-center mb-2">Top User by Token Count</h3>
                    <div className="pt-2">
                        {isFetching ? (
                            <div className="h-20" /> // Placeholder to prevent layout shift
                        ) : (
                            <TopUserChart topUser={topUserData} />
                        )}
                    </div>
                    {isFetching && <CardLoader />}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[var(--theme-bg-primary)]/50 rounded-lg border border-[var(--theme-border)]">
                    <button type="button" onClick={() => toggleSection('lastHour')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSections.lastHour}>
                        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">Session Tokens (Last Hour)</h3>
                        <ChevronIcon isOpen={openSections.lastHour} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.lastHour ? 'max-h-[1000px] opacity-100 p-4 pt-0 border-t border-[var(--theme-border)]/50' : 'max-h-0 opacity-0'}`}>
                        <div className="pt-4">
                            <LastHourUsageChart usage={lastHourUsage} />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--theme-bg-primary)]/50 rounded-lg border border-[var(--theme-border)]">
                    <button type="button" onClick={() => toggleSection('last15')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSections.last15}>
                        <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">Top 5 Funds by Tokens Used</h3>
                        <ChevronIcon isOpen={openSections.last15} />
                    </button>
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.last15 ? 'max-h-[1000px] opacity-100 p-4 pt-0 border-t border-[var(--theme-border)]/50' : 'max-h-0 opacity-0'}`}>
                        <div className="pt-4">
                            <TopFundsChart data={topFundsData} colors={chartColors} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--theme-bg-primary)]/50 rounded-lg border border-[var(--theme-border)]">
                <button type="button" onClick={() => toggleSection('lifetime')} className="w-full flex justify-between items-center text-left p-4" aria-expanded={openSections.lifetime}>
                    <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">Detailed Token Usage</h3>
                    <ChevronIcon isOpen={openSections.lifetime} />
                </button>
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSections.lifetime ? 'max-h-none opacity-100 p-4 pt-0 border-t border-[var(--theme-border)]/50' : 'max-h-0 opacity-0'}`}>
                     <div className="pt-4">
                        <div className="mb-4">
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                                    </svg>
                                </div>
                                <input
                                    type="search"
                                    id="token-search"
                                    className="block w-full p-3 pl-10 text-sm text-white bg-[var(--theme-bg-secondary)]/50 border border-[var(--theme-border)] rounded-lg focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)]"
                                    placeholder="Search by user, fund, feature, or model..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    aria-label="Search token usage table"
                                />
                            </div>
                        </div>
                        <TokenUsageTable 
                            data={processedTableData}
                            onSort={handleSort}
                            sortConfig={sortConfig}
                        />
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TokenUsagePage;
