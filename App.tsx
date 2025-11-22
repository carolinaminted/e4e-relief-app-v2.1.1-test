
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { User, IdTokenResult } from 'firebase/auth';
// FIX: Import the centralized Page type and alias it to avoid naming conflicts. Also added forgotPassword page.
import type { UserProfile, Application, EventData, EligibilityDecision, ClassVerificationStatus, EligibilityStatus, FundIdentity, ActiveIdentity, Page as GlobalPage, ApplicationFormData, Expense } from './types';
import type { Fund } from './data/fundData';
import { evaluateApplicationEligibility, getAIAssistedDecision } from './services/geminiService';
import { init as initTokenTracker, reset as resetTokenTracker } from './services/tokenTracker';
import { authClient } from './services/firebaseAuthClient';
import { usersRepo, identitiesRepo, applicationsRepo, fundsRepo } from './services/firestoreRepo';
import { useTranslation } from 'react-i18next';
import { fundThemes, defaultTheme } from './data/fundThemes';

// Page Components
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import HomePage from './components/HomePage';
import ApplyPage from './components/ApplyPage';
import ProfilePage from './components/ProfilePage';
import SupportPage from './components/SupportPage';
import SubmissionSuccessPage from './components/SubmissionSuccessPage';
import AIApplyPage from './components/AIApplyPage';
import TokenUsagePage from './components/TokenUsagePage';
import FAQPage from './components/FAQPage';
import PaymentOptionsPage from './components/PaymentOptionsPage';
import DonatePage from './components/DonatePage';
import EligibilityPage from './components/EligibilityPage';
import FundPortalPage from './components/FundPortalPage';
import TicketingPage from './components/TicketingPage';
import ProgramDetailsPage from './components/ProgramDetailsPage';
import ProxyApplyPage from './components/ProxyPage';
import ClassVerificationPage from './components/ClassVerificationPage';
import LoadingOverlay from './components/LoadingOverlay';
import SideNavBar from './components/SideNavBar';
import BottomNavBar from './components/BottomNavBar';
import { IconDefs } from './components/Icons';
import Footer from './components/Footer';
import Header from './components/Header';
import LiveDashboardPage from './components/LiveDashboardPage';
import MyApplicationsPage from './components/MyApplicationsPage';
import MyProxyApplicationsPage from './components/MyProxyApplicationsPage';
import ReliefQueuePage from './components/ReliefQueuePage';
import ChatbotWidget from './components/ChatbotWidget';
import SessionTimeoutHandler from './components/SessionTimeoutHandler';

type AuthState = {
    status: 'loading' | 'signedIn' | 'signedOut';
    user: User | null;
    profile: UserProfile | null;
    claims: { admin?: boolean };
};

function App() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState<GlobalPage>('login');
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading', user: null, profile: null, claims: {} });
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [proxyApplications, setProxyApplications] = useState<Application[]>([]);
  const [allIdentities, setAllIdentities] = useState<FundIdentity[]>([]);
  const [activeIdentity, setActiveIdentity] = useState<ActiveIdentity | null>(null);
  const [activeFund, setActiveFund] = useState<Fund | null>(null);
  
  const [verifyingFundCode, setVerifyingFundCode] = useState<string | null>(null);
  const [lastSubmittedApp, setLastSubmittedApp] = useState<Application | null>(null);
  const [applicationDraft, setApplicationDraft] = useState<Partial<ApplicationFormData> | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(defaultTheme.logoUrl);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;
    let applicationsUnsubscribe: (() => void) | null = null;
    let proxyApplicationsUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = authClient.onAuthStateChanged((user, token) => {
      // Always clean up previous listeners when auth state changes.
      if (profileUnsubscribe) { profileUnsubscribe(); profileUnsubscribe = null; }
      if (applicationsUnsubscribe) { applicationsUnsubscribe(); applicationsUnsubscribe = null; }
      if (proxyApplicationsUnsubscribe) { proxyApplicationsUnsubscribe(); proxyApplicationsUnsubscribe = null; }


      if (user && token) {
        const claims = (token.claims as { admin?: boolean }) || {};
        
        applicationsUnsubscribe = applicationsRepo.listenForUser(user.uid, (userApps) => {
            setApplications(userApps);
        });
        
        if (claims.admin) {
            proxyApplicationsUnsubscribe = applicationsRepo.listenForProxySubmissions(user.uid, (proxyApps) => {
                setProxyApplications(proxyApps);
            });
        }

        profileUnsubscribe = usersRepo.listen(user.uid, async (profile) => {
          if (profile) {
            // Set language based on user profile preference
            if (profile.preferredLanguage) {
              const langCode = profile.preferredLanguage.toLowerCase().slice(0, 2);
              if ((langCode === 'en' || langCode === 'es' || langCode === 'ja') && i18n.language !== langCode) {
                i18n.changeLanguage(langCode);
              }
            }
            
            // --- Profile found, hydrate the full application state ---
            const identities = await identitiesRepo.getForUser(user.uid);
            
            let activeId: FundIdentity | undefined = undefined;
            if (identities.length > 0) {
              activeId = identities.find(id => id.id === profile.activeIdentityId) ||
                         [...identities].sort((a, b) => new Date(b.lastUsedAt || 0).getTime() - new Date(a.lastUsedAt || 0).getTime())[0];
            }

            let hydratedProfile: UserProfile;
            if (activeId) {
              hydratedProfile = {
                ...profile,
                fundCode: activeId.fundCode,
                fundName: activeId.fundName,
                classVerificationStatus: activeId.classVerificationStatus,
                eligibilityStatus: activeId.eligibilityStatus,
              };
              setActiveIdentity({ id: activeId.id, fundCode: activeId.fundCode });
            } else {
              // User has a profile but no identities yet.
              hydratedProfile = profile;
            }

            // Synchronize the profile's role with the auth token's custom claim.
            // The custom claim is the source of truth for authorization.
            if (claims.admin === true) {
                hydratedProfile.role = 'Admin';
            } else {
                hydratedProfile.role = 'User';
            }
            
            // Load draft specific to the current user AND current fund
            const draftKey = `applicationDraft-${hydratedProfile.uid}-${hydratedProfile.fundCode}`;
            try {
                const savedDraft = localStorage.getItem(draftKey);
                if (savedDraft) {
                    setApplicationDraft(JSON.parse(savedDraft));
                } else {
                    // Important: If no draft exists for this specific fund, ensure state is cleared
                    // to prevent showing a draft from a previous fund identity.
                    setApplicationDraft(null);
                }
            } catch (error) {
                console.error("Could not load application draft from localStorage:", error);
            }

            setAllIdentities(identities);
            setAuthState({ status: 'signedIn', user, profile: hydratedProfile, claims });
            initTokenTracker(hydratedProfile);

            // Navigation logic based on the hydrated profile state
            // Logic Update: Only trap in relief queue if FAILED and NO OTHER ELIGIBLE identities.
            const hasEligibleIdentity = identities.some(id => id.eligibilityStatus === 'Eligible');
            const isStuckInVerification = hydratedProfile.classVerificationStatus === 'failed' && !hasEligibleIdentity && hydratedProfile.role !== 'Admin';

            if (isStuckInVerification) {
                setPage('reliefQueue');
            } else if (hydratedProfile.classVerificationStatus !== 'passed' || hydratedProfile.eligibilityStatus !== 'Eligible') {
              setPage('classVerification');
            } else {
              // Only navigate to home if not already on a specific page (prevents overriding navigation)
              setPage(prevPage => (['login', 'register', 'classVerification', 'reliefQueue'].includes(prevPage) ? 'home' : prevPage));
            }
          } else {
            // --- Profile not found ---
            const creationTime = user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
            // Check if the user was created within the last 10 seconds.
            const isNewUser = (Date.now() - creationTime) < 10000;

            if (isNewUser) {
              // This is a new user registration. The profile document is being created.
              // We do nothing and wait. The listener will fire again when the document appears.
              // The UI will show the main loading overlay because authState.profile is null.
              setAuthState({ status: 'loading', user, profile: null, claims });
            } else {
              // This is an existing user whose profile document is missing. This is an error state.
              console.error("User profile not found for an existing user. Signing out.");
              authClient.signOut();
            }
          }
        });
      } else {
        // --- User is signed out ---
        setAuthState({ status: 'signedOut', user: null, profile: null, claims: {} });
        setCurrentUser(null);
        
        // Fix: Clear data states to prevent "Missing permissions" errors from lingering effects
        // triggering data fetches after auth is gone.
        setActiveIdentity(null);
        setAllIdentities([]);
        setApplications([]);
        setProxyApplications([]);
        setVerifyingFundCode(null);
        
        setPage('login');
        resetTokenTracker();
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
      if (applicationsUnsubscribe) applicationsUnsubscribe();
      if (proxyApplicationsUnsubscribe) proxyApplicationsUnsubscribe();
    };
  }, [i18n]);

  // FIX: Moved `currentUser` declaration before its usage in the `useEffect` hook below.
  const currentUser = authState.profile;

  useEffect(() => {
    const fetchActiveFund = async () => {
      if (activeIdentity) {
        const fundData = await fundsRepo.getFund(activeIdentity.fundCode);
        if (fundData) {
          setActiveFund(fundData);
        } else {
          console.error(`Could not load fund configuration for ${activeIdentity.fundCode}`);
          setActiveFund(null);
        }
      } else if (currentUser?.fundCode) {
        // Fallback for users stuck in queue who may not have an activeIdentity yet
        const fundData = await fundsRepo.getFund(currentUser.fundCode);
        setActiveFund(fundData);
      }
    };
    fetchActiveFund();
  }, [activeIdentity, currentUser?.fundCode]);

  // Theme Application Logic
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme: typeof defaultTheme) => {
      root.style.setProperty('--theme-bg-primary', theme.primary);
      root.style.setProperty('--theme-bg-secondary', theme.secondary);
      root.style.setProperty('--theme-border', theme.border);
      root.style.setProperty('--theme-accent', theme.accent);
      root.style.setProperty('--theme-accent-hover', theme.accentHover);
      root.style.setProperty('--theme-gradient-start', theme.gradientStart);
      root.style.setProperty('--theme-gradient-end', theme.gradientEnd);
      
      // Update logo
      setCurrentLogo(theme.logoUrl);
    };

    // Determine the target theme based on the current page and context
    let targetTheme = defaultTheme;

    if (page === 'classVerification') {
        // Priority 1: Explicitly verifying a specific fund code (e.g. Add Identity flow)
        const targetFundCode = verifyingFundCode || currentUser?.fundCode;
        if (targetFundCode && fundThemes[targetFundCode]) {
            targetTheme = fundThemes[targetFundCode];
        }
    } else {
        const themedPages: GlobalPage[] = [
            'home', 
            'profile', 
            'support', 
            'donate', 
            'faq', 
            'paymentOptions', 
            'aiApply', 
            'myApplications', 
            'myProxyApplications', 
            'apply', 
            'applyExpenses', 
            'submissionSuccess',
            // Admin pages that should reflect fund branding
            'fundPortal',
            'liveDashboard',
            'ticketing',
            'programDetails',
            'proxy',
            'tokenUsage'
        ];
        if (themedPages.includes(page) && activeFund && fundThemes[activeFund.code]) {
            targetTheme = fundThemes[activeFund.code];
        }
    }

    applyTheme(targetTheme);

  }, [page, activeFund, verifyingFundCode, currentUser]);

  const userIdentities = useMemo(() => {
    if (!currentUser) return [];
    return allIdentities.filter(id => id.uid === currentUser.uid);
  }, [currentUser, allIdentities]);

  const userApplications = useMemo(() => {
    if (currentUser && activeIdentity) {
      return applications.filter(app => app.profileSnapshot.fundCode === activeIdentity.fundCode) || [];
    }
    return [];
  }, [currentUser, applications, activeIdentity]);
  
  const userProxyApplications = useMemo(() => {
    if (currentUser?.role === 'Admin' && activeIdentity) {
      return proxyApplications.filter(app => app.profileSnapshot.fundCode === activeIdentity.fundCode) || [];
    }
    return [];
  }, [currentUser, proxyApplications, activeIdentity]);

  const isVerifiedAndEligible = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.classVerificationStatus === 'passed' && currentUser.eligibilityStatus === 'Eligible';
  }, [currentUser]);

  const hasEligibleIdentity = useMemo(() => {
      return allIdentities.some(id => id.eligibilityStatus === 'Eligible');
  }, [allIdentities]);

  const { twelveMonthRemaining, lifetimeRemaining } = useMemo(() => {
      const sortedUserApps = [...userApplications].sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
      const latestApp = sortedUserApps.length > 0 ? sortedUserApps[0] : null;
      
      const initialTwelveMonthMax = activeFund?.limits?.twelveMonthMax ?? 0;
      const initialLifetimeMax = activeFund?.limits?.lifetimeMax ?? 0;

      return {
          twelveMonthRemaining: latestApp ? latestApp.twelveMonthGrantRemaining : initialTwelveMonthMax,
          lifetimeRemaining: latestApp ? latestApp.lifetimeGrantRemaining : initialLifetimeMax,
      };
  }, [userApplications, activeFund]);

  const canApply = isVerifiedAndEligible && twelveMonthRemaining > 0 && lifetimeRemaining > 0;

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [page]);

  const setCurrentUser = (profile: UserProfile | null) => {
      setAuthState(prev => ({...prev, profile}));
  }

  const handleSetActiveIdentity = useCallback(async (identityId: string) => {
    if (!currentUser) return;

    const identityToActivate = allIdentities.find(i => i.id === identityId);
    if (identityToActivate && identityToActivate.eligibilityStatus === 'Eligible') {
        console.log(`[Telemetry] track('IdentitySwitch', { from: ${activeIdentity?.fundCode}, to: ${identityToActivate.fundCode} })`);
        
        // Explicitly clear any application draft from the previous identity to prevent data leakage
        setApplicationDraft(null);

        await identitiesRepo.update(identityId, { lastUsedAt: new Date().toISOString() });
        await usersRepo.update(currentUser.uid, { activeIdentityId: identityId });

        setAuthState(prev => ({
            ...prev,
            profile: prev.profile ? {
                ...prev.profile,
                fundCode: identityToActivate.fundCode,
                fundName: identityToActivate.fundName,
                classVerificationStatus: identityToActivate.classVerificationStatus,
                eligibilityStatus: identityToActivate.eligibilityStatus,
            } : null
        }));
        
        // Refresh identities list to reflect lastUsedAt change for sorting
        const updatedIdentities = await identitiesRepo.getForUser(currentUser.uid);
        setAllIdentities(updatedIdentities);
    }
  }, [currentUser, allIdentities, activeIdentity]);
  
  const handleLogout = () => {
    if (currentUser) {
      sessionStorage.removeItem(`chatHistory-${currentUser.uid}`);
    }
    authClient.signOut();
  };
  
  const navigate = useCallback((targetPage: GlobalPage) => {
    // 1. Auth pages always allowed
    if (['login', 'register', 'forgotPassword'].includes(targetPage)) {
        setPage(targetPage);
        return;
    }

    // 2. Admin bypass
    if (currentUser?.role === 'Admin') {
        setPage(targetPage);
        return;
    }

    // 3. Strict Lockdown for Failed Verification with No Identity (Relief Queue Trap)
    // If user failed verification AND has no other eligible identities, they must stay in queue.
    const isStuckInReliefQueue = currentUser?.classVerificationStatus === 'failed' && !hasEligibleIdentity;
    
    if (isStuckInReliefQueue) {
        // Only allow pages necessary for re-verification
        const allowedQueuePages: GlobalPage[] = ['reliefQueue', 'classVerification'];
        
        if (allowedQueuePages.includes(targetPage)) {
             setPage(targetPage);
        } else {
             // Force redirect back to relief queue if trying to escape
             setPage('reliefQueue');
        }
        return;
    }

    // 4. General Ineligibility Guard (For Pending users or those with mixed status)
    if (!isVerifiedAndEligible) {
        const allowedIneligiblePages: GlobalPage[] = [
            'home', 
            'classVerification', 
            'reliefQueue', 
            'profile', 
            'eligibility'
        ];
        
        if (!allowedIneligiblePages.includes(targetPage)) {
            console.warn(`Access denied to ${targetPage} for ineligible user.`);
            // If the user is trying to access a blocked page (like Support or Donate),
            // we keep them on the current page (likely Home) or redirect to Home if they are somewhere weird.
            if (page !== 'home' && page !== 'profile' && page !== 'classVerification') {
                 setPage('home');
            }
            return;
        }
    }

    setPage(targetPage);
  }, [isVerifiedAndEligible, hasEligibleIdentity, page, currentUser]);

  const handleStartAddIdentity = useCallback(async (fundCode: string) => {
    if (!currentUser) return;
    
    const identity = allIdentities.find(id => id.uid === currentUser.uid && id.fundCode === fundCode);
    if (identity && identity.eligibilityStatus === 'Eligible') {
        alert(`Your identity for fund code ${fundCode} is already eligible.`);
        return;
    }

    if (identity) {
        console.log(`[Telemetry] track('IdentityReverifyStarted', { fundCode: ${fundCode} })`);
    } else {
        console.log(`[Telemetry] track('AddIdentityStarted', { fundCode: ${fundCode} })`);
    }

    setVerifyingFundCode(fundCode);
    setPage('classVerification');
  }, [currentUser, allIdentities]);

  const handleRemoveIdentity = useCallback(async (identityId: string) => {
    if (!currentUser) return;
    const identityToRemove = allIdentities.find(id => id.id === identityId);
    if (!identityToRemove) return;

    if (activeIdentity?.id === identityId) {
        alert(t('profilePage.cannotRemoveActive'));
        return;
    }

    if (window.confirm(t('profilePage.removeIdentityConfirm', { fundName: identityToRemove.fundName }))) {
        console.log(`[Telemetry] track('IdentityRemove', { fundCode: ${identityToRemove.fundCode} })`);
        await identitiesRepo.remove(identityId);
        setAllIdentities(prev => prev.filter(id => id.id !== identityId));
    }
  }, [currentUser, allIdentities, activeIdentity, t]);

  const handleVerificationSuccess = useCallback(async () => {
    if (!currentUser) return;

    const userExistingIdentities = allIdentities;
    const fundCodeToVerify = verifyingFundCode || currentUser.fundCode;
    const fund = await fundsRepo.getFund(fundCodeToVerify);
    
    if (!fund) {
        console.error("Verification successful but could not find fund config for", fundCodeToVerify);
        setVerifyingFundCode(null);
        // If coming from the relief queue or a new registration, 'home' is a safer destination than 'profile'.
        setPage('home');
        return;
    }
    
    const identityIdToUpdate = `${currentUser.uid}-${fund.code}`;
    const existingIdentity = userExistingIdentities.find(id => id.id === identityIdToUpdate);
    let newActiveIdentity: FundIdentity;

    const updates = { 
        eligibilityStatus: 'Eligible' as EligibilityStatus, 
        classVerificationStatus: 'passed' as ClassVerificationStatus,
        lastUsedAt: new Date().toISOString()
    };

    if (existingIdentity) {
        console.log(`[Telemetry] track('IdentityReverified', { fundCode: ${fund.code} })`);
        await identitiesRepo.update(identityIdToUpdate, updates);
        newActiveIdentity = { ...existingIdentity, ...updates };
    } else {
        console.log(`[Telemetry] track('IdentityCreated', { fundCode: ${fund.code}, cvType: ${fund.cvType} })`);
        newActiveIdentity = {
            id: identityIdToUpdate,
            uid: currentUser.uid,
            fundCode: fund.code,
            fundName: fund.name,
            cvType: fund.cvType,
            eligibilityStatus: 'Eligible',
            classVerificationStatus: 'passed',
            createdAt: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
        };
        await identitiesRepo.add(newActiveIdentity);
    }
    
    // This update will trigger the onSnapshot listener to re-hydrate the app state.
    await usersRepo.update(currentUser.uid, { activeIdentityId: newActiveIdentity.id });
    
    // FIX: Add an immediate local state update to prevent UI flicker and race conditions.
    // This ensures the UI has the correct "Eligible" status before navigating away.
    setAuthState(prev => {
        if (!prev.profile) return prev;
        return {
            ...prev,
            profile: {
                ...prev.profile,
                fundCode: newActiveIdentity.fundCode,
                fundName: newActiveIdentity.fundName,
                classVerificationStatus: newActiveIdentity.classVerificationStatus,
                eligibilityStatus: newActiveIdentity.eligibilityStatus,
            }
        };
    });

    setVerifyingFundCode(null);
    // Explicitly navigate to home to provide immediate feedback to the user.
    setPage('home');

  }, [currentUser, verifyingFundCode, allIdentities]);
  
    const handleVerificationFailed = useCallback(async (failedFundCode: string) => {
        if (!currentUser) return;

        const identityIdToUpdate = `${currentUser.uid}-${failedFundCode}`;
        const identityToFail = allIdentities.find(id => id.id === identityIdToUpdate);

        if (identityToFail) {
            console.log(`[Telemetry] track('VerificationFailedMaxAttempts', { fundCode: ${failedFundCode} })`);
            await identitiesRepo.update(identityIdToUpdate, { classVerificationStatus: 'failed' });
        } else {
            // New user failing for the first time. Create the identity document with a 'failed' status.
            console.log(`[Telemetry] track('InitialVerificationFailedMaxAttempts', { fundCode: ${failedFundCode} })`);
            const fund = await fundsRepo.getFund(failedFundCode);
            if (!fund) {
                console.error("Could not find fund config for failed verification:", failedFundCode);
                return;
            }

            const newFailedIdentity: FundIdentity = {
                id: identityIdToUpdate,
                uid: currentUser.uid,
                fundCode: fund.code,
                fundName: fund.name,
                cvType: fund.cvType,
                eligibilityStatus: 'Not Eligible',
                classVerificationStatus: 'failed',
                createdAt: new Date().toISOString(),
            };
            await identitiesRepo.add(newFailedIdentity);
            // Also set this new failed identity as the active one.
            await usersRepo.update(currentUser.uid, { activeIdentityId: newFailedIdentity.id });
        }
    }, [currentUser, allIdentities]);

  const handleProfileUpdate = useCallback(async (updatedProfile: UserProfile, options?: { silent?: boolean }) => {
    if (!currentUser) return;
    // The onSnapshot listener will automatically update the UI state from this write.
    await usersRepo.update(currentUser.uid, updatedProfile);
    if (!options?.silent) {
      alert(t('profilePage.saveSuccess', 'Profile saved!')); // Using a default value
    }
  }, [currentUser, t]);

  const handleApplicationSubmit = useCallback(async (appFormData: ApplicationFormData) => {
    if (!currentUser || !activeFund) {
        alert("Could not load fund configuration. Please try again later.");
        return;
    }
    
    const { singleRequestMax } = activeFund.limits;
    const allEligibleEvents = [...(activeFund.eligibleDisasters || []), ...(activeFund.eligibleHardships || [])];
    
    const preliminaryDecision = evaluateApplicationEligibility({
        id: 'temp',
        employmentStartDate: appFormData.profileData.employmentStartDate,
        eventData: appFormData.eventData,
        currentTwelveMonthRemaining: twelveMonthRemaining,
        currentLifetimeRemaining: lifetimeRemaining,
        singleRequestMax,
        eligibleEvents: allEligibleEvents,
    });
    
    const finalDecision = await getAIAssistedDecision(
      { eventData: appFormData.eventData, currentTwelveMonthRemaining: twelveMonthRemaining, currentLifetimeRemaining: lifetimeRemaining },
      preliminaryDecision,
      appFormData.profileData
    );

    const getStatusFromDecision = (decision: EligibilityDecision['decision']): Application['status'] => {
        if (decision === 'Approved') return 'Awarded';
        if (decision === 'Denied') return 'Declined';
        return 'Submitted';
    };

    const newApplicationData: Omit<Application, 'id'> = {
      uid: currentUser.uid,
      profileSnapshot: appFormData.profileData,
      ...appFormData.eventData,
      submittedDate: new Date().toISOString(),
      status: getStatusFromDecision(finalDecision.decision),
      reasons: finalDecision.reasons,
      decisionedDate: finalDecision.decisionedDate,
      twelveMonthGrantRemaining: finalDecision.remaining_12mo,
      lifetimeGrantRemaining: finalDecision.remaining_lifetime,
      shareStory: appFormData.agreementData.shareStory ?? false,
      receiveAdditionalInfo: appFormData.agreementData.receiveAdditionalInfo ?? false,
      submittedBy: currentUser.uid,
      isProxy: false,
    };

    const newApplication = await applicationsRepo.add(newApplicationData);

    try {
        const draftKey = `applicationDraft-${currentUser.uid}-${currentUser.fundCode}`;
        localStorage.removeItem(draftKey);
        const chatHistoryKey = `aiApplyChatHistory-${currentUser.uid}-${currentUser.fundCode}`;
        sessionStorage.removeItem(chatHistoryKey);
        console.log("Successfully submitted. Cleared saved application draft and AI Apply chat history.");
    } catch (error) {
        console.error("Could not remove application draft from localStorage after submission:", error);
    }
    
    if (JSON.stringify(appFormData.profileData) !== JSON.stringify(currentUser)) {
        await handleProfileUpdate(appFormData.profileData, { silent: true });
    }
    
    setApplicationDraft(null);
    setLastSubmittedApp(newApplication);
    setPage('submissionSuccess');

  }, [currentUser, handleProfileUpdate, activeFund, twelveMonthRemaining, lifetimeRemaining]);
  
  const handleProxyApplicationSubmit = useCallback(async (appFormData: ApplicationFormData) => {
    if (!currentUser || authState.claims.admin !== true || !activeFund) {
        console.error("Only admins with an active fund can submit proxy applications.");
        return;
    };

    // Use the admin's active fund for the application, not one from the form.
    appFormData.profileData.fundCode = activeFund.code;
    appFormData.profileData.fundName = activeFund.name;

    const applicantEmail = appFormData.profileData.email?.toLowerCase();
    if (!applicantEmail) {
        alert("Applicant email is required to submit a proxy application.");
        return;
    }

    // Proxy submissions are only allowed for existing users to prevent auth state issues.
    let applicantProfile = await usersRepo.getByEmail(applicantEmail);

    if (!applicantProfile) {
        alert("Applicant not found. Please ensure the user has an existing account before submitting a proxy application.");
        return;
    }
    
    // Merge any updated form data into the existing applicant profile before snapshotting.
    const updatedApplicantProfile = { ...applicantProfile, ...appFormData.profileData };
    appFormData.profileData = updatedApplicantProfile;

    const allApplicantApps = await applicationsRepo.getForUser(applicantProfile.uid);
    const applicantPastApps = allApplicantApps.filter(app => app.profileSnapshot.fundCode === activeFund.code);
    const lastApplication = applicantPastApps.length > 0 ? applicantPastApps.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())[0] : null;
    
    const fund = activeFund;
    const { twelveMonthMax: initialTwelveMonthMax, lifetimeMax: initialLifetimeMax, singleRequestMax } = fund.limits;
    const allEligibleEvents = [...(fund.eligibleDisasters || []), ...(fund.eligibleHardships || [])];

    const currentTwelveMonthRemaining = lastApplication ? lastApplication.twelveMonthGrantRemaining : initialLifetimeMax;
    const currentLifetimeRemaining = lastApplication ? lastApplication.lifetimeGrantRemaining : initialLifetimeMax;
    
    const preliminaryDecision = evaluateApplicationEligibility({
        id: 'temp', employmentStartDate: appFormData.profileData.employmentStartDate, eventData: appFormData.eventData,
        currentTwelveMonthRemaining, currentLifetimeRemaining, singleRequestMax, eligibleEvents: allEligibleEvents,
    });
    
    const finalDecision = await getAIAssistedDecision(
      { eventData: appFormData.eventData, currentTwelveMonthRemaining, currentLifetimeRemaining },
      preliminaryDecision,
      appFormData.profileData
    );

    const getStatusFromDecision = (decision: EligibilityDecision['decision']): Application['status'] => {
        if (decision === 'Approved') return 'Awarded'; if (decision === 'Denied') return 'Declined'; return 'Submitted';
    };

    const newApplicationData: Omit<Application, 'id'> = {
      uid: applicantProfile.uid,
      profileSnapshot: appFormData.profileData,
      ...appFormData.eventData,
      submittedDate: new Date().toISOString(),
      status: getStatusFromDecision(finalDecision.decision),
      reasons: finalDecision.reasons,
      decisionedDate: finalDecision.decisionedDate,
      twelveMonthGrantRemaining: finalDecision.remaining_12mo,
      lifetimeGrantRemaining: finalDecision.remaining_lifetime,
      shareStory: appFormData.agreementData.shareStory ?? false,
      receiveAdditionalInfo: appFormData.agreementData.receiveAdditionalInfo ?? false,
      submittedBy: currentUser.uid,
      isProxy: true,
    };

    const newApplication = await applicationsRepo.add(newApplicationData);

    try {
        const draftKey = `applicationDraft-${applicantProfile.uid}-${appFormData.profileData.fundCode}`;
        localStorage.removeItem(draftKey);
        console.log(`Proxy submission successful. Cleared saved draft for user ${applicantProfile.email}.`);
    } catch (error) {
        console.error("Could not remove proxy application draft from localStorage after submission:", error);
    }
    
    // The real-time listener will handle updating the proxyApplications state.
    
    // Update profile if changed
    if (JSON.stringify(appFormData.profileData) !== JSON.stringify(applicantProfile)) {
        await usersRepo.update(applicantProfile.uid, appFormData.profileData);
    }
    
    setApplicationDraft(null);
    setLastSubmittedApp(newApplication);
    setPage('submissionSuccess');
  }, [currentUser, authState.claims.admin, activeFund]);

  const handleDraftUpdate = useCallback((partialDraft: {
      profileData?: Partial<UserProfile>;
      eventData?: Partial<EventData>;
      agreementData?: Partial<ApplicationFormData['agreementData']>;
  }) => {
    if (!currentUser) return;
    
    setApplicationDraft(prevDraft => {
        // Deep merge the new partial draft into the previous state, ensuring profileData is always seeded.
        const newDraft: Partial<ApplicationFormData> = {
            ...prevDraft,
            ...(partialDraft as Partial<ApplicationFormData>),
            profileData: {
                ...currentUser,
                ...(prevDraft?.profileData || {}),
                ...(partialDraft.profileData || {}),
            } as UserProfile,
            eventData: {
                ...(prevDraft?.eventData || {}),
                ...(partialDraft.eventData || {}),
            } as EventData,
            agreementData: {
                shareStory: null,
                receiveAdditionalInfo: null,
                ...(prevDraft?.agreementData || {}),
                ...(partialDraft.agreementData || {}),
            },
        };

        const draftKey = `applicationDraft-${currentUser.uid}-${currentUser.fundCode}`;
        try {
            localStorage.setItem(draftKey, JSON.stringify(newDraft));
        } catch (error) {
            console.error("Could not save application draft:", error);
        }
        return newDraft;
    });
  }, [currentUser]);

  const handleResetDraft = useCallback(() => {
      if (!currentUser) return;
      const draftKey = `applicationDraft-${currentUser.uid}-${currentUser.fundCode}`;
      try {
          localStorage.removeItem(draftKey);
      } catch (e) {
          console.error("Failed to clear draft from local storage", e);
      }
      setApplicationDraft(null);
  }, [currentUser]);

  const handleChatbotAction = useCallback((functionName: string, args: any) => {
    if (!currentUser) return;
    console.log(`Executing tool: ${functionName}`, args);

    const newDraft: Partial<ApplicationFormData> = {};

    if (functionName === 'updateUserProfile') {
        const profileUpdates: Partial<UserProfile> = { ...args };
        if (args.primaryAddress) {
            profileUpdates.primaryAddress = { ...(applicationDraft?.profileData?.primaryAddress || {}), ...args.primaryAddress };
        }
        newDraft.profileData = {
            ...currentUser,
            ...applicationDraft?.profileData,
            ...profileUpdates,
        };
    }

    if (functionName === 'startOrUpdateApplicationDraft') {
        const eventUpdates: Partial<EventData> = { ...args };
        newDraft.eventData = {
            event: '',
            eventDate: '',
            evacuated: '',
            powerLoss: '',
            requestedAmount: 0,
            expenses: [],
            ...applicationDraft?.eventData,
            ...eventUpdates
        };
    }

    if (functionName === 'addOrUpdateExpense') {
        // FIX: Ensure prevEventData has expenses array to avoid property access error
        const prevEventData = applicationDraft?.eventData || { expenses: [] };
        const newExpenses: Expense[] = [...(prevEventData.expenses || [])];
        
        if (args.expenses && Array.isArray(args.expenses)) {
            for (const expenseArg of args.expenses) {
                if (expenseArg.type && typeof expenseArg.amount === 'number') {
                    const expenseIndex = newExpenses.findIndex(e => e.type === expenseArg.type);
                    
                    if (expenseIndex > -1) {
                        newExpenses[expenseIndex].amount = expenseArg.amount;
                    } else {
                        newExpenses.push({
                            id: `exp-${expenseArg.type.replace(/\s+/g, '-')}`,
                            type: expenseArg.type,
                            amount: expenseArg.amount,
                            fileName: '',
                        });
                    }
                }
            }
        }
        
        const eventUpdates: Partial<EventData> = { expenses: newExpenses };
         newDraft.eventData = {
            event: '',
            eventDate: '',
            evacuated: '',
            powerLoss: '',
            requestedAmount: 0,
            expenses: [],
            ...applicationDraft?.eventData,
            ...eventUpdates
        };
    }

    if (functionName === 'updateAgreements') {
        const updates = args as { shareStory?: boolean; receiveAdditionalInfo?: boolean };
        const currentAgreements = applicationDraft?.agreementData;

        newDraft.agreementData = {
            shareStory: updates.shareStory !== undefined ? updates.shareStory : (currentAgreements?.shareStory ?? null),
            receiveAdditionalInfo: updates.receiveAdditionalInfo !== undefined ? updates.receiveAdditionalInfo : (currentAgreements?.receiveAdditionalInfo ?? null),
        };
    }
    
    handleDraftUpdate(newDraft);

  }, [currentUser, applicationDraft, handleDraftUpdate]);
  
  const pagesWithoutFooter: GlobalPage[] = ['home', 'login', 'register', 'classVerification', 'profile', 'aiApply', 'applyExpenses'];
  const pagesWithoutChatbot: GlobalPage[] = ['login', 'register', 'forgotPassword', 'classVerification', 'reliefQueue', 'aiApply'];

  const renderPage = () => {
    if (authState.status === 'loading' || (authState.status === 'signedIn' && !currentUser)) {
      return <LoadingOverlay message={t('app.authenticating')} />;
    }
    
    if (authState.status === 'signedOut') {
      return (
        <div className="flex-1 flex justify-center p-4">
            <div className="w-full max-w-lg px-4 pt-8 sm:pt-12">
                {page === 'register' ? (
                <RegisterPage onRegister={authClient.register} switchToLogin={() => setPage('login')} />
                ) : page === 'forgotPassword' ? (
                <ForgotPasswordPage onSendResetLink={authClient.sendPasswordResetEmail} switchToLogin={() => setPage('login')} />
                ) : (
                <LoginPage onLogin={authClient.signIn} switchToRegister={() => setPage('register')} switchToForgotPassword={() => setPage('forgotPassword')} />
                )}
            </div>
        </div>
      );
    }
    
    if (!currentUser) return <LoadingOverlay message={t('app.loadingProfile')} />;
    
    // Determine available languages for current fund, defaulting to full list if not specified to prevent UI hiding issues
    const supportedLanguages = activeFund?.supportedLanguages || ['en', 'es', 'ja'];

    switch (page) {
      case 'reliefQueue':
        return <ReliefQueuePage userProfile={currentUser} activeFund={activeFund} onUpdateProfile={handleProfileUpdate} onReattemptVerification={handleStartAddIdentity} onLogout={handleLogout} />;
      case 'classVerification':
        return <ClassVerificationPage user={currentUser} onVerificationSuccess={handleVerificationSuccess} onVerificationFailed={handleVerificationFailed} navigate={navigate} verifyingFundCode={verifyingFundCode} />;
      case 'apply':
        return <ApplyPage navigate={navigate} onSubmit={handleApplicationSubmit} userProfile={currentUser} applicationDraft={applicationDraft} mainRef={mainRef} canApply={canApply} activeFund={activeFund} onDraftUpdate={handleDraftUpdate} />;
      case 'applyExpenses':
        return <ApplyPage navigate={navigate} onSubmit={handleApplicationSubmit} userProfile={currentUser} applicationDraft={applicationDraft} mainRef={mainRef} canApply={canApply} activeFund={activeFund} initialStep={3} onDraftUpdate={handleDraftUpdate} />;
      case 'aiApply':
        return <AIApplyPage 
                    navigate={navigate}
                    userProfile={currentUser}
                    applications={userApplications}
                    onChatbotAction={handleChatbotAction}
                    activeFund={activeFund}
                    applicationDraft={applicationDraft}
                    onDraftUpdate={handleDraftUpdate}
                    onSubmit={handleApplicationSubmit}
                    canApply={canApply}
                    onResetDraft={handleResetDraft}
                    logoUrl={currentLogo} // Add this line
                />;
      case 'profile':
        return <ProfilePage 
                    navigate={navigate} 
                    applications={userApplications}
                    userProfile={currentUser} 
                    onProfileUpdate={handleProfileUpdate}
                    identities={userIdentities}
                    activeIdentity={activeIdentity}
                    onSetActiveIdentity={handleSetActiveIdentity}
                    onAddIdentity={handleStartAddIdentity}
                    onRemoveIdentity={handleRemoveIdentity}
                />;
      case 'myApplications':
        return <MyApplicationsPage 
                    navigate={navigate}
                    applications={userApplications}
                    userProfile={currentUser}
                    onAddIdentity={handleStartAddIdentity}
                />;
      case 'myProxyApplications':
        return <MyProxyApplicationsPage 
                    navigate={navigate}
                    applications={userProxyApplications}
                    userProfile={currentUser}
                />;
      case 'support':
        return <SupportPage navigate={navigate} />;
       case 'tokenUsage':
        return <TokenUsagePage navigate={navigate} currentUser={currentUser} />;
      case 'submissionSuccess':
        if (!lastSubmittedApp) return <HomePage navigate={navigate} canApply={canApply} userProfile={currentUser} />;
        return <SubmissionSuccessPage application={lastSubmittedApp} onGoToProfile={() => setPage('profile')} />;
      case 'faq':
        return <FAQPage navigate={navigate} />;
      case 'paymentOptions':
        return <PaymentOptionsPage navigate={navigate} />;
      case 'donate':
        return <DonatePage navigate={navigate} />;
      case 'eligibility':
        return <EligibilityPage navigate={navigate} user={currentUser} />;
      case 'fundPortal':
        return <FundPortalPage navigate={navigate} user={currentUser} />;
      case 'liveDashboard':
        return <LiveDashboardPage navigate={navigate} currentUser={currentUser} />;
      case 'ticketing':
        return <TicketingPage navigate={navigate} />;
      case 'programDetails':
        return <ProgramDetailsPage navigate={navigate} user={currentUser} />;
      case 'proxy':
        return <ProxyApplyPage 
                    navigate={navigate}
                    onSubmit={handleProxyApplicationSubmit}
                    proxyApplications={userProxyApplications}
                    userProfile={currentUser}
                    onAddIdentity={handleStartAddIdentity}
                    mainRef={mainRef}
                    activeFund={activeFund}
                />;
      case 'home':
      default:
        return <HomePage navigate={navigate} canApply={canApply} userProfile={currentUser} />;
    }
  };
  
  // Logged out view is handled inside renderPage()
  if (!currentUser) {
      return (
          <div className="bg-[#003a70] text-white h-screen font-sans flex flex-col" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
              <main ref={mainRef} className="flex-1 flex flex-col overflow-y-auto">
                  {renderPage()}
              </main>
          </div>
      );
  }

  // Relief Queue view (special logged-in state without nav)
  if (page === 'reliefQueue') {
    return (
        <div className="bg-[#003a70] text-white h-screen font-sans flex flex-col" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
            <IconDefs />
            <main ref={mainRef} className="flex-1 flex flex-col overflow-y-auto">
                <SessionTimeoutHandler onLogout={handleLogout} isActive={true}>
                    {renderPage()}
                </SessionTimeoutHandler>
            </main>
        </div>
    );
  }
  
  // Determine available languages for current fund, defaulting to full list if not specified
  const supportedLanguages = activeFund?.supportedLanguages || ['en', 'es', 'ja'];

  return (
    <SessionTimeoutHandler onLogout={handleLogout} isActive={true}>
        <div className="bg-[#003a70] text-white h-screen font-sans flex flex-col md:flex-row overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-primary)' }}>
          <IconDefs />
          <SideNavBar 
            navigate={navigate}
            currentPage={page}
            userRole={currentUser.role}
            userName={currentUser.firstName}
            onLogout={handleLogout}
            canApply={canApply}
            eligibilityStatus={currentUser.eligibilityStatus}
            cvStatus={currentUser.classVerificationStatus}
            supportedLanguages={supportedLanguages}
            logoUrl={currentLogo}
            onReverify={() => handleStartAddIdentity(currentUser.fundCode)}
          />

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <Header 
                userName={currentUser.firstName}
                onLogout={handleLogout}
                eligibilityStatus={currentUser.eligibilityStatus}
                cvStatus={currentUser.classVerificationStatus}
                supportedLanguages={supportedLanguages}
                logoUrl={currentLogo}
                onReverify={() => handleStartAddIdentity(currentUser.fundCode)}
            />
            <main ref={mainRef} className="flex-1 flex flex-col overflow-y-auto pb-16 md:pb-0 custom-scrollbar">
              <div className="hidden md:block">
                {page === 'profile' && (
                   <div className="relative flex justify-center items-center my-8">
                      <div className="text-center">
                          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
                            {t('profilePage.title')}
                          </h1>
                          {activeIdentity && (
                            <div className="mt-2 flex flex-col items-center gap-2">
                              <p className="text-lg text-gray-300">{currentUser.fundName} ({currentUser.fundCode})</p>
                            </div>
                          )}
                      </div>
                  </div>
                )}
              </div>
              {renderPage()}
              {!pagesWithoutFooter.includes(page) && <Footer />}
            </main>
            
            <BottomNavBar
                navigate={navigate}
                currentPage={page}
                userRole={currentUser.role}
                canApply={canApply}
            />

            {!pagesWithoutChatbot.includes(page) && (isVerifiedAndEligible || currentUser.role === 'Admin') && (
              <ChatbotWidget
                userProfile={currentUser}
                applications={userApplications}
                onChatbotAction={handleChatbotAction}
                isOpen={isChatbotOpen}
                setIsOpen={setIsChatbotOpen}
                scrollContainerRef={mainRef}
                activeFund={activeFund}
                logoUrl={currentLogo}
              />
            )}
          </div>
        </div>
    </SessionTimeoutHandler>
  );
}

export default App;
