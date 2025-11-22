import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n/i18n'; // Import to initialize i18next

// --- SERVICE WORKER KILL SWITCH (NUCLEAR OPTION) ---
// This is critical for fixing the "Double Call" / 429 Rate Limit issue.
// Old Service Workers from previous deployments act as proxies, duplicating requests.
const nukeServiceWorkers = async () => {
  if (typeof window !== 'undefined') {
    let reloadNeeded = false;

    // 1. Unregister all found workers
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.warn('🚨 Killing Zombie Service Worker:', registration.scope);
          await registration.unregister();
          reloadNeeded = true;
        }
      } catch (err) {
        console.warn('SW Kill Switch encountered an error:', err);
      }
    }

    // 2. CLEAR ALL CACHES (The "Fresh Slate" protocol)
    // Sometimes the SW is gone, but the assets (JS/CSS) are still stuck in the Cache Storage API.
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        for (const key of keys) {
          console.warn('🧹 Wiping Cache Storage:', key);
          await caches.delete(key);
          reloadNeeded = true;
        }
      } catch (err) {
        console.warn('Cache wipe failed:', err);
      }
    }

    // 3. Force a hard reload if we cleaned anything up
    // This ensures the browser fetches the new index.html from the server.
    if (reloadNeeded || navigator.serviceWorker?.controller) {
      console.warn('🚨 Page was controlled by a Zombie Worker or had stale cache. Reloading...');
      window.location.reload();
    }
  }
};

// Execute immediately
nukeServiceWorkers();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* 
      React.Suspense is used here to provide a fallback UI (a loading message) 
      while the main App component and its children are being loaded. This is especially
      useful for code-splitting or if the i18n translations are loaded asynchronously.
    */}
    <React.Suspense fallback={<div className="bg-[#003a70] h-screen w-screen flex items-center justify-center text-white">Loading...</div>}>
      <App />
    </React.Suspense>
  </React.StrictMode>
);
