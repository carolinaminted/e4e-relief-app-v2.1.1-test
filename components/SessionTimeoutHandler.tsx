
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface SessionTimeoutHandlerProps {
  children: React.ReactNode;
  onLogout: () => void;
  isActive: boolean; // Only track when user is logged in
}

// 15 minutes in milliseconds
const TIMEOUT_DURATION = 15 * 60 * 1000;
// 5 minutes warning in milliseconds
const WARNING_DURATION = 5 * 60 * 1000;
// Time to show warning (10 minutes)
const WARNING_TRIGGER_TIME = TIMEOUT_DURATION - WARNING_DURATION;

const SessionTimeoutHandler: React.FC<SessionTimeoutHandlerProps> = ({ children, onLogout, isActive }) => {
  const { t } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_DURATION);
  
  // Use a ref for last activity to avoid re-renders on every mouse move
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningRef = useRef<boolean>(false); // Ref to track warning state inside event listeners

  const updateActivity = useCallback(() => {
    // Only update activity time if we haven't hit the warning threshold yet.
    // Once the warning is shown, user must explicitly click "Extend" to reset.
    if (!isWarningRef.current) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    // Throttle the event listener slightly to reduce overhead, though useRef is already fast
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const handleEvent = () => {
        if (!throttleTimer) {
            updateActivity();
            throttleTimer = setTimeout(() => {
                throttleTimer = null;
            }, 500);
        }
    };

    events.forEach(event => window.addEventListener(event, handleEvent));

    // The main check loop
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= TIMEOUT_DURATION) {
        // Time expired
        clearInterval(intervalId);
        onLogout();
      } else if (elapsed >= WARNING_TRIGGER_TIME) {
        // Trigger warning
        if (!isWarningRef.current) {
            isWarningRef.current = true;
            setShowWarning(true);
        }
        // Update countdown for the UI
        setTimeLeft(Math.max(0, TIMEOUT_DURATION - elapsed));
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleEvent));
      clearInterval(intervalId);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isActive, onLogout, updateActivity]);

  const handleExtendSession = () => {
    lastActivityRef.current = Date.now();
    isWarningRef.current = false;
    setShowWarning(false);
    setTimeLeft(WARNING_DURATION);
  };

  // Format milliseconds to MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const modalRoot = document.getElementById('modal-root');

  return (
    <>
      {children}
      {showWarning && isActive && modalRoot && createPortal(
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex justify-center items-start pt-24 p-4 backdrop-blur-sm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-timeout-title"
        >
            <style>
              {`
                @keyframes slideDown {
                  from { transform: translateY(-100%); opacity: 0; }
                  to { transform: translateY(0); opacity: 1; }
                }
              `}
            </style>
            <div 
                className="bg-[var(--theme-bg-primary)] rounded-lg shadow-2xl p-8 w-full max-w-md border-2 border-[var(--theme-accent)] text-center relative overflow-hidden"
                style={{ 
                    animation: 'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    backgroundColor: 'var(--theme-bg-primary)',
                    borderColor: 'var(--theme-accent)'
                }}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]"></div>
                
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[var(--theme-accent)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>

                <h2 id="session-timeout-title" className="text-2xl font-bold text-white mb-2">
                    {t('sessionTimeout.title')}
                </h2>
                
                <p className="text-gray-200 mb-6">
                    {t('sessionTimeout.body')} <span className="font-mono font-bold text-[var(--theme-gradient-end)] text-lg block mt-2">{formatTime(timeLeft)}</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={onLogout}
                        className="w-full sm:w-auto px-6 py-3 rounded-md border border-gray-500 text-gray-300 hover:bg-white/10 transition-colors font-semibold"
                    >
                        {t('sessionTimeout.logoutButton')}
                    </button>
                    <button
                        onClick={handleExtendSession}
                        className="w-full sm:w-auto px-6 py-3 rounded-md bg-[var(--theme-accent)] hover:bg-[var(--theme-accent-hover)] text-white font-bold shadow-lg transition-all hover:scale-105"
                    >
                        {t('sessionTimeout.extendButton')}
                    </button>
                </div>
            </div>
        </div>,
        modalRoot
      )}
    </>
  );
};

export default SessionTimeoutHandler;
