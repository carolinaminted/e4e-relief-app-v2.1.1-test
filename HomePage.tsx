import React, { useState } from 'react';
import PolicyModal from './PolicyModal';
import { ApplyIcon, ProfileIcon, SupportIcon, DonateIcon, DashboardIcon } from './Icons';
// FIX: Import the centralized Page type.
import type { Page } from './types';

interface HomePageProps {
  navigate: (page: Page) => void;
  isApplyEnabled: boolean;
  fundName?: string;
  userRole: 'User' | 'Admin';
}

// --- Component ---

interface Tile {
  key: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  disabledTooltip?: string;
  colSpan?: string;
}

const HomePage: React.FC<HomePageProps> = ({ navigate, isApplyEnabled, fundName, userRole }) => {
    const tiles: Tile[] = [
        { 
            key: 'apply', 
            title: 'Apply', 
            icon: <ApplyIcon />, 
            onClick: () => navigate('apply'),
            disabled: !isApplyEnabled,
            disabledTooltip: "Class Verification required to access applications."
        },
        { key: 'profile', title: 'Profile', icon: <ProfileIcon />, onClick: () => navigate('profile') },
        { key: 'support', title: 'Support', icon: <SupportIcon />, onClick: () => navigate('support') },
        { key: 'donate', title: 'Donate', icon: <DonateIcon />, onClick: () => navigate('donate') },
    ];

    if (userRole === 'Admin') {
        tiles.push({ 
            key: 'dashboards', 
            title: 'Dashboards', 
            icon: <DashboardIcon />, 
            // FIX: Argument of type '"dashboard"' is not assignable to parameter of type 'Page'. Changed to 'fundPortal'.
            onClick: () => navigate('fundPortal'), // Navigate directly to dashboard
            colSpan: 'col-span-2'
        });
    }

  return (
    <div className="flex-1 flex flex-col items-center justify-center pt-12 md:pt-16 pb-8 px-4 sm:px-8 text-center">
      <div className="w-full"> {/* Content wrapper */}
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
          {fundName || 'E4E Relief'}
        </h1>

        <div className={`w-full max-w-2xl mx-auto mt-12 grid grid-cols-2 gap-4 sm:gap-6`}>
          {tiles.map((tile) => (
              <div 
                  key={tile.key}
                  onClick={!tile.disabled ? tile.onClick : undefined}
                  title={tile.disabled ? tile.disabledTooltip : ""}
                  aria-disabled={!!tile.disabled}
                  className={`bg-[#004b8d]/50 backdrop-blur-lg border border-white/20 p-6 rounded-lg shadow-lg transition-all duration-300 transform flex flex-col items-center text-center ${
                      tile.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#005ca0]/80 cursor-pointer hover:scale-105'
                  } ${tile.colSpan || ''}`}
              >
                  {tile.icon}
                  <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff8400] to-[#edda26]">
                      {tile.title}
                  </h2>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;