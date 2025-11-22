
import React from 'react';
import type { UserProfile, Page } from '../types';
import { IconDefs, DashboardIcon, TicketingIcon, ProgramDetailsIcon, ProxyIcon, TokenUsageIcon } from './Icons';

interface FundPortalPageProps {
  navigate: (page: Page) => void;
  user: UserProfile;
}

// --- Reusable Tile Data Structure ---
interface PortalTile {
  key: Page;
  title: string;
  onClick: () => void;
  icon: React.ReactNode;
}

const FundPortalPage: React.FC<FundPortalPageProps> = ({ navigate, user }) => {
  /**
   * Defines the navigation tiles for the admin portal.
   * Storing this in an array makes it easy to manage and render the grid,
   * especially for handling layouts with an odd number of items.
   */
  const portalTiles: PortalTile[] = [
    {
      key: 'liveDashboard',
      title: 'Dashboard',
      onClick: () => navigate('liveDashboard'),
      icon: <DashboardIcon />,
    },
    {
      key: 'ticketing',
      title: 'Ticketing',
      onClick: () => navigate('ticketing'),
      icon: <TicketingIcon />,
    },
    {
      key: 'programDetails',
      title: 'Details',
      onClick: () => navigate('programDetails'),
      icon: <ProgramDetailsIcon />,
    },
    {
      key: 'proxy',
      title: 'Proxy',
      onClick: () => navigate('proxy'),
      icon: <ProxyIcon />,
    },
    {
      key: 'tokenUsage',
      title: 'Tokens',
      onClick: () => navigate('tokenUsage'),
      icon: <TokenUsageIcon />,
    },
  ];
  
  return (
    <div className="flex-1 flex flex-col p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="relative flex justify-center items-center mb-8">
          <button onClick={() => navigate('home')} className="absolute left-0 text-[var(--theme-accent)] hover:opacity-80 transition-opacity" aria-label="Back to Home">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
                Fund Portal
            </h1>
            <p className="text-xl font-semibold text-white mt-1">{user.fundName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full mt-12 max-w-2xl mx-auto">
          {portalTiles.map((tile, index) => {
            // This logic checks if the current tile is the last one in the list AND if the total number of tiles is odd.
            // If so, it applies a `col-span-2` class to make the last tile span the full width of the grid,
            // creating a more balanced and visually appealing layout.
            const isLastAndOdd = (index === portalTiles.length - 1) && (portalTiles.length % 2 !== 0);
            const colSpanClass = isLastAndOdd ? 'col-span-2' : '';

            return (
              <div 
                key={tile.key}
                onClick={tile.onClick}
                className={`bg-[var(--theme-bg-secondary)] backdrop-blur-lg border border-[var(--theme-border)] p-6 rounded-lg shadow-lg hover:opacity-80 transition-all duration-300 cursor-pointer flex flex-col items-center text-center ${colSpanClass}`}
              >
                {tile.icon}
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{tile.title}</h2>
              </div>
            );
          })}
        </div>
        
      </div>
    </div>
  );
};

export default FundPortalPage;
