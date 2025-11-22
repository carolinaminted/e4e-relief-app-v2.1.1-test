
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Chat } from '@google/genai';
import { MessageRole } from '../types';
import type { Fund } from '../data/fundData';
import type { ChatMessage, Application, UserProfile, Page, ApplicationFormData, EventData } from '../types';
import { createChatSession, MODEL_NAME } from '../services/geminiService';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { logEvent as logTokenEvent, estimateTokens } from '../services/tokenTracker';
import { useTranslation, Trans } from 'react-i18next';
import Footer from './Footer';
import AIApplyPreviewModal from './AIApplyPreviewModal';
import AIApplyExpenses from './AIApplyExpenses';
import AIApplyAgreements from './AIApplyAgreements';

interface AIApplyPageProps {
  userProfile: UserProfile | null;
  applications: Application[];
  onChatbotAction: (functionName: string, args: any) => void;
  activeFund: Fund | null;
  navigate: (page: Page) => void;
  applicationDraft: Partial<ApplicationFormData> | null;
  onDraftUpdate: (draft: Partial<ApplicationFormData>) => void;
  onSubmit: (formData: ApplicationFormData) => Promise<void>;
  canApply: boolean;
  onResetDraft: () => void;
  logoUrl: string;
}

const CheckmarkIcon: React.FC = () => (
    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
    </svg>
);

const CircleIcon: React.FC = () => (
    <div className="w-5 h-5 border-2 border-gray-500 rounded-full"></div>
);

const ResetIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const FirstTimeUserGuide: React.FC = () => (
    <div 
      className="absolute top-0 left-0 flex items-center justify-center h-full w-[50px] pointer-events-none"
      aria-hidden="true"
    >
      <div className="bg-[var(--theme-accent)] text-white p-3 rounded-xl shadow-xl text-base font-bold whitespace-nowrap absolute -top-16 left-0 animate-bounce z-50">
        Click to see questions
        <div className="absolute left-[25px] -translate-x-1/2 top-full w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[var(--theme-accent)]"></div>
      </div>
    </div>
);


const SectionHeader: React.FC<{ title: string; isComplete: boolean; isOpen: boolean; onToggle: () => void, disabled?: boolean }> = ({ title, isComplete, isOpen, onToggle, disabled }) => (
    <button
        onClick={onToggle}
        className="w-full flex justify-between items-center text-left py-3 px-4 bg-[var(--theme-bg-primary)]/40 rounded-t-md disabled:opacity-60 disabled:cursor-not-allowed"
        aria-expanded={isOpen}
        disabled={disabled}
    >
        <div className="flex items-center gap-3">
            {isComplete && <CheckmarkIcon />}
            <h2 className={`text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] brightness-150 drop-shadow-sm ${isComplete ? 'opacity-60' : ''}`}>{title}</h2>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-[var(--theme-accent)] transition-transform duration-300 transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    </button>
);

type SectionKey = 'additional' | 'acknowledgements' | 'event' | 'expenses' | 'agreements';

const AIApplyPreviewPane: React.FC<{
    userProfile: UserProfile | null;
    applicationDraft: Partial<ApplicationFormData> | null;
    onDraftUpdate: (draft: Partial<ApplicationFormData>) => void;
    onSubmit: (formData: ApplicationFormData) => Promise<void>;
    canApply: boolean;
}> = ({ userProfile, applicationDraft, onDraftUpdate, onSubmit, canApply }) => {
    const { t } = useTranslation();

    const baseChecklistItems = useMemo(() => [
      { key: 'employmentStartDate', label: t('applyContactPage.employmentStartDate') },
      { key: 'eligibilityType', label: t('applyContactPage.eligibilityType') },
      { key: 'householdIncome', label: t('applyContactPage.householdIncome') },
      { key: 'householdSize', label: t('applyContactPage.householdSize') },
      { key: 'homeowner', label: t('applyContactPage.homeowner') },
      { key: 'preferredLanguage', label: t('applyContactPage.preferredLanguage') },
    ], [t]);
    
    const acknowledgementChecklistItems = useMemo(() => [
        { key: 'ackPolicies', label: t('applyContactPage.ackPolicies') },
        { key: 'commConsent', label: t('applyContactPage.commConsent') },
        { key: 'infoCorrect', label: t('applyContactPage.infoCorrect') },
    ], [t]);

    const eventChecklistItems = useMemo(() => [
        { key: 'event', label: t('applyEventPage.disasterLabel') },
        { key: 'eventName', label: t('applyEventPage.errorEventName', 'What is the name of the event?'), condition: (data?: Partial<EventData>) => data?.event === 'Tropical Storm/Hurricane' },
        { key: 'eventDate', label: t('applyEventPage.eventDateLabel') },
        { key: 'powerLoss', label: t('applyEventPage.powerLossLabel') },
        { key: 'powerLossDays', label: t('applyEventPage.powerLossDaysLabel'), condition: (data?: Partial<EventData>) => data?.powerLoss === 'Yes' },
        { key: 'evacuated', label: t('applyEventPage.evacuatedLabel') },
        { key: 'evacuatingFromPrimary', label: t('applyEventPage.evacuatingFromPrimaryLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' },
        { key: 'evacuationReason', label: t('applyEventPage.evacuationReasonLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' && data?.evacuatingFromPrimary === 'No' },
        { key: 'stayedWithFamilyOrFriend', label: t('applyEventPage.stayedWithFamilyLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' },
        { key: 'evacuationStartDate', label: t('applyEventPage.evacuationStartDateLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' },
        { key: 'evacuationNights', label: t('applyEventPage.evacuationNightsLabel'), condition: (data?: Partial<EventData>) => data?.evacuated === 'Yes' },
    ], [t]);

    const isAdditionalDetailsComplete = useMemo(() => {
        if (!userProfile) return false;
        return baseChecklistItems.every(item => {
            const key = item.key as keyof UserProfile;
            const draftValue = applicationDraft?.profileData?.[key];
            if (draftValue !== undefined && draftValue !== null && draftValue !== '') return true;
            
            const profileValue = userProfile?.[key];
            return profileValue !== undefined && profileValue !== null && profileValue !== '';
        });
    }, [userProfile, applicationDraft, baseChecklistItems]);
    
    const isAcknowledgementsComplete = useMemo(() => {
        if (!userProfile) return false;
        return acknowledgementChecklistItems.every(item => {
            const key = item.key as keyof UserProfile;
            // Check in draft first
            const draftValue = applicationDraft?.profileData?.[key];
            if (draftValue === true) return true;
            
            // Check in profile
            const profileValue = userProfile?.[key];
            return profileValue === true;
        });
    }, [userProfile, applicationDraft, acknowledgementChecklistItems]);

    const isEventDetailsComplete = useMemo(() => {
        const eventData = applicationDraft?.eventData;
        if (!eventData) return false;

        const visibleEventItems = eventChecklistItems.filter(item => !item.condition || item.condition(eventData));
        if (visibleEventItems.length === 0 && !eventData.event) return false;

        return visibleEventItems.every(item => {
            const key = item.key as keyof EventData;
            const value = eventData[key];
            if (key === 'powerLossDays' || key === 'evacuationNights') {
                return typeof value === 'number' && value > 0;
            }
            return value !== undefined && value !== null && value !== '';
        });
    }, [applicationDraft, eventChecklistItems]);

    const isExpensesComplete = useMemo(() => {
        const expenses = applicationDraft?.eventData?.expenses || [];
        // Assuming all expense types are required.
        return expenses.length === 3 && expenses.every(e => e.amount !== '' && Number(e.amount) > 0);
    }, [applicationDraft]);
    
    const [openSection, setOpenSection] = useState<SectionKey | null>(null);

    const toggleSection = (section: SectionKey) => {
        setOpenSection(prev => (prev === section ? null : section));
    };

    // Effect to auto-open the next incomplete section, but NOT the agreements section automatically
    useEffect(() => {
        if (!isAdditionalDetailsComplete) setOpenSection('additional');
        else if (!isAcknowledgementsComplete) setOpenSection('acknowledgements');
        else if (!isEventDetailsComplete) setOpenSection('event');
        else if (!isExpensesComplete) setOpenSection('expenses');
        // Explicitly do not auto-open agreements to avoid jumping.
    }, [isAdditionalDetailsComplete, isAcknowledgementsComplete, isEventDetailsComplete, isExpensesComplete]);
    
    const isProfileItemComplete = (key: string) => {
        const draftValue = applicationDraft?.profileData?.[key as keyof UserProfile];
        if (draftValue !== undefined && draftValue !== null && draftValue !== '') {
             // For booleans, check explicitly if true for acknowledgements, though checklist logic handles existence.
             if (typeof draftValue === 'boolean') return draftValue === true;
             return true;
        }
        const profileValue = userProfile?.[key as keyof UserProfile];
        if (typeof profileValue === 'boolean') return profileValue === true;
        return profileValue !== undefined && profileValue !== null && profileValue !== '';
    };

    const isEventItemComplete = (key: keyof EventData) => {
        if (!applicationDraft?.eventData) return false;
        const value = applicationDraft.eventData[key];
        return value !== undefined && value !== null && value !== '';
    };
    
    const getProfileValue = (key: string) => {
        const draftVal = applicationDraft?.profileData?.[key as keyof UserProfile];
        if (draftVal !== undefined && draftVal !== null && draftVal !== '') {
            if (typeof draftVal === 'boolean') return null;
            return String(draftVal);
        }
        const profileVal = userProfile?.[key as keyof UserProfile];
        if (profileVal !== undefined && profileVal !== null && profileVal !== '') {
            if (typeof profileVal === 'boolean') return null;
            return String(profileVal);
        }
        return null;
    };

    const getEventValue = (key: keyof EventData) => {
        const val = applicationDraft?.eventData?.[key];
        if (val !== undefined && val !== null && val !== '') return String(val);
        return null;
    };

    const visibleEventItems = useMemo(() => eventChecklistItems.filter(item => !item.condition || item.condition(applicationDraft?.eventData || {})), [eventChecklistItems, applicationDraft]);

    // Auto-scroll effect to show the next unanswered question
    useEffect(() => {
        const scrollToFirstIncomplete = () => {
            if (!openSection) return;

            let firstIncompleteKey: string | undefined;

            if (openSection === 'additional') {
                firstIncompleteKey = baseChecklistItems.find(item => !isProfileItemComplete(item.key))?.key;
            } else if (openSection === 'acknowledgements') {
                firstIncompleteKey = acknowledgementChecklistItems.find(item => !isProfileItemComplete(item.key))?.key;
            } else if (openSection === 'event') {
                firstIncompleteKey = visibleEventItems.find(item => !isEventItemComplete(item.key as keyof EventData))?.key;
            }

            if (firstIncompleteKey) {
                const element = document.getElementById(`progress-item-${firstIncompleteKey}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };

        // Delay slightly to allow for section expansion animations and react renders
        const timer = setTimeout(scrollToFirstIncomplete, 400);
        return () => clearTimeout(timer);
    }, [
        openSection, 
        applicationDraft, 
        userProfile, 
        baseChecklistItems, 
        acknowledgementChecklistItems, 
        visibleEventItems
    ]); 

    return (
        <div className="bg-[var(--theme-bg-secondary)] rounded-lg shadow-2xl flex flex-col p-4 flex-1 min-h-0">
            <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)] brightness-150 drop-shadow-sm mb-4 text-center flex-shrink-0">
                {t('aiApplyPage.progressTitle')}
            </h2>
            <p className="text-xs text-gray-400 text-center mb-4 flex-shrink-0">{t('aiApplyPage.previewSubtitle')}</p>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                {/* Additional Details Section */}
                <div className="bg-[var(--theme-bg-primary)]/20 rounded-md">
                    <SectionHeader title={t('aiApplyPage.additionalDetailsPreviewTitle')} isComplete={isAdditionalDetailsComplete} isOpen={openSection === 'additional'} onToggle={() => toggleSection('additional')} />
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'additional' ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-3 space-y-2">
                            {baseChecklistItems.map(item => {
                                const isComplete = isProfileItemComplete(item.key);
                                const value = getProfileValue(item.key);
                                return (
                                    <div key={item.key} id={`progress-item-${item.key}`} className="p-2 bg-black/20 rounded-md flex flex-col">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-5 h-5">
                                                {isComplete ? <CheckmarkIcon /> : <CircleIcon />}
                                            </div>
                                            <span className={`text-sm ${isComplete ? 'text-gray-400' : 'text-white'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                        {value && (
                                            <div className="ml-8 mt-1 text-sm text-[var(--theme-accent)] font-medium break-words">
                                                {value}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Profile Acknowledgements Section */}
                <div className={`bg-[var(--theme-bg-primary)]/20 rounded-md ${!isAdditionalDetailsComplete ? 'opacity-50' : ''}`}>
                    <SectionHeader title={t('aiApplyPage.profileAcknowledgementsPreviewTitle')} isComplete={isAcknowledgementsComplete} isOpen={openSection === 'acknowledgements'} onToggle={() => toggleSection('acknowledgements')} disabled={!isAdditionalDetailsComplete} />
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'acknowledgements' ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-3 space-y-2">
                            {acknowledgementChecklistItems.map(item => (
                                <div key={item.key} id={`progress-item-${item.key}`} className="flex items-center gap-3 p-2 bg-black/20 rounded-md">
                                    <div className="flex-shrink-0 w-5 h-5">
                                        {isProfileItemComplete(item.key) ? <CheckmarkIcon /> : <CircleIcon />}
                                    </div>
                                    <span className={`text-sm ${isProfileItemComplete(item.key) ? 'text-gray-400' : 'text-white'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Event Details Section */}
                <div className={`bg-[var(--theme-bg-primary)]/20 rounded-md ${!isAcknowledgementsComplete ? 'opacity-50' : ''}`}>
                     <SectionHeader title={t('aiApplyPage.eventDetailsPreviewTitle')} isComplete={isEventDetailsComplete} isOpen={openSection === 'event'} onToggle={() => toggleSection('event')} disabled={!isAcknowledgementsComplete} />
                     <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'event' ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-3 space-y-2">
                            {visibleEventItems.map(item => {
                                const isComplete = isEventItemComplete(item.key as keyof EventData);
                                const value = getEventValue(item.key as keyof EventData);
                                return (
                                    <div key={item.key} id={`progress-item-${item.key}`} className="p-2 bg-black/20 rounded-md flex flex-col">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-5 h-5">
                                                {isComplete ? <CheckmarkIcon /> : <CircleIcon />}
                                            </div>
                                            <span className={`text-sm ${isComplete ? 'text-gray-400' : 'text-white'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                        {value && (
                                            <div className="ml-8 mt-1 text-sm text-[var(--theme-accent)] font-medium break-words">
                                                {value}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Expenses Section */}
                <div className={`bg-[var(--theme-bg-primary)]/20 rounded-md ${!isEventDetailsComplete ? 'opacity-50' : ''}`}>
                    <SectionHeader title={t('aiApplyPage.expensesPreviewTitle')} isComplete={isExpensesComplete} isOpen={openSection === 'expenses'} onToggle={() => toggleSection('expenses')} disabled={!isEventDetailsComplete} />
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'expenses' ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}`}>
                        {userProfile && (
                            <AIApplyExpenses
                                formData={applicationDraft?.eventData || {expenses: []} as EventData}
                                userProfile={userProfile}
                                // FIX: Cast data to EventData to match onDraftUpdate signature
                                updateFormData={(data) => onDraftUpdate({ eventData: data as EventData })}
                                disabled={!canApply}
                                onNext={() => setOpenSection('agreements')}
                            />
                        )}
                    </div>
                </div>

                {/* Agreements Section */}
                <div className={`bg-[var(--theme-bg-primary)]/20 rounded-md ${!isExpensesComplete ? 'opacity-50' : ''}`}>
                    <SectionHeader title={t('aiApplyPage.agreementsPreviewTitle')} isComplete={false} isOpen={openSection === 'agreements'} onToggle={() => toggleSection('agreements')} disabled={!isExpensesComplete} />
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${openSection === 'agreements' ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}`}>
                        {userProfile && (
                            <AIApplyAgreements
                                formData={applicationDraft?.agreementData || { shareStory: null, receiveAdditionalInfo: null }}
                                // FIX: Cast data to agreementData type to match onDraftUpdate signature
                                updateFormData={(data) => onDraftUpdate({ agreementData: data as ApplicationFormData['agreementData'] })}
                                onSubmit={() => onSubmit(applicationDraft as ApplicationFormData)}
                                disabled={!canApply}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AIApplyPage: React.FC<AIApplyPageProps> = ({ userProfile, applications, onChatbotAction, activeFund, navigate, applicationDraft, onDraftUpdate, onSubmit, canApply, onResetDraft, logoUrl }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatTokenSessionIdRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [hasInteractedWithPreview, setHasInteractedWithPreview] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (window.innerWidth >= 768) return true;
    return false; // Always show on new mount (new session)
  });
  
  // Update sessionKey to include fundCode. This ensures chat history is isolated per fund.
  // If userProfile or fundCode changes, the key changes, causing a reload from empty storage for that new key.
  const sessionKey = userProfile ? `aiApplyChatHistory-${userProfile.uid}-${userProfile.fundCode}` : null;
  const initDoneForUser = useRef<string | null>(null); // Tracks specific uid-fundCode combination

  const greetingMessage = t('aiApplyPage.greeting');

  useEffect(() => {
    const currentIdentityKey = userProfile ? `${userProfile.uid}-${userProfile.fundCode}` : null;

    if (sessionKey && currentIdentityKey && initDoneForUser.current !== currentIdentityKey) {
      try {
        const savedMessages = sessionStorage.getItem(sessionKey);
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          const validMessages = parsed.filter((m: ChatMessage) => m.role === 'user' || m.role === 'model');
          
          if (validMessages.length > 0) {
             setMessages(validMessages);
          } else {
             setMessages([{ role: MessageRole.MODEL, content: greetingMessage }]);
          }
        } else {
          setMessages([{ role: MessageRole.MODEL, content: greetingMessage }]);
        }
      } catch (error) {
        console.error('Could not load chat history from session storage', error);
        setMessages([{ role: MessageRole.MODEL, content: greetingMessage }]);
      }
      initDoneForUser.current = currentIdentityKey;
    }
  }, [sessionKey, greetingMessage, userProfile]);

  // Effect to update the initial greeting if the language changes and no conversation has started
  useEffect(() => {
     if (messages.length === 1 && messages[0].role === MessageRole.MODEL) {
        const newGreeting = t('aiApplyPage.greeting');
        if (messages[0].content !== newGreeting) {
            setMessages([{ role: MessageRole.MODEL, content: newGreeting }]);
            chatSessionRef.current = null;
        }
     }
  }, [i18n.language, t, messages]);

  useEffect(() => {
    if (sessionKey && messages.length > 0) {
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(messages));
      } catch (error) {
        console.error('Could not save chat history to session storage', error);
      }
    }
  }, [sessionKey, messages]);

  useEffect(() => {
    // Prevent session reset while a turn is in progress to avoid race conditions
    if (userProfile && !isLoading) {
      if (!chatTokenSessionIdRef.current) {
        chatTokenSessionIdRef.current = `ai-apply-${Math.random().toString(36).substr(2, 9)}`;
      }
      const historyToSeed = messages.length > 1 ? messages.slice(-6) : [];
      chatSessionRef.current = createChatSession(userProfile, activeFund, applications, historyToSeed, 'aiApply', applicationDraft);
    }
  }, [applications, activeFund, userProfile, applicationDraft, messages, isLoading]);
  
    useEffect(() => {
      // After a message is sent and a response is received (isLoading becomes false)
      if (!isLoading) {
        // Check if we are in desktop view (md breakpoint is 768px)
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
        if (isDesktop && inputRef.current) {
          inputRef.current.focus();
        }
      }
    }, [isLoading]); // This effect runs whenever isLoading changes.
    
    const handleReset = () => {
        if (window.confirm("Are you sure you want to clear your application draft and restart the chat?")) {
            if (sessionKey) {
                sessionStorage.removeItem(sessionKey);
            }
            setMessages([{ role: MessageRole.MODEL, content: greetingMessage }]);
            
            onResetDraft();
            
            // Re-init session
            if (userProfile) {
                chatSessionRef.current = createChatSession(userProfile, activeFund, applications, [], 'aiApply', null); 
                if (chatTokenSessionIdRef.current) {
                    chatTokenSessionIdRef.current = `ai-apply-${Math.random().toString(36).substr(2, 9)}`;
                }
            }
        }
    };

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading) return;

    setIsLoading(true);
    setLoadingMessage(t('aiApplyPage.statusAnalyzing'));
    const userMessage: ChatMessage = { role: MessageRole.USER, content: userInput };
    setMessages(prev => [...prev, userMessage]);
    
    const inputTokens = estimateTokens(userInput); // Count tokens for user input

    // Capture the session at the beginning of the turn to avoid race conditions.
    const currentTurnSession = chatSessionRef.current;

    try {
      if (!currentTurnSession) throw new Error("Chat session not initialized.");
      
      // FIRST API CALL: Send user message and get potential function calls
      const response1 = await currentTurnSession.sendMessage({ message: userInput });
      
      const functionCalls = response1.functionCalls;

      // If there are no function calls, the turn is simple. Display the text and finish.
      if (!functionCalls || functionCalls.length === 0) {
        if (response1.text) {
          setMessages(prev => [...prev, { role: MessageRole.MODEL, content: response1.text }]);
          const outputTokens = estimateTokens(response1.text); // Count tokens for model text response
          
          if (chatTokenSessionIdRef.current) {
             logTokenEvent({
                 feature: 'AI Apply Chat',
                 model: MODEL_NAME,
                 inputTokens,
                 outputTokens,
                 sessionId: chatTokenSessionIdRef.current
             });
          }
        }
        // Even if the response is empty, the turn is over.
        return;
      }
      
      // If there are function calls, execute them and then send the results back to the model.
      // We also count tokens for the function call response from the model (treated as output).
      let intermediateOutputTokens = estimateTokens(JSON.stringify(functionCalls));
      
      setLoadingMessage(t('aiApplyPage.statusUpdating'));
      
      // This will trigger a re-render and update the application draft state in the parent.
      // A new `chatSessionRef` will be created for the *next* turn, which is the desired behavior.
      functionCalls.forEach(call => onChatbotAction(call.name, call.args));

      const functionResponses = functionCalls.map(call => {
        return { functionResponse: { name: call.name, response: { result: 'ok' } } };
      });
      
      // Count tokens for the function response we send back (treated as input for the 2nd call)
      let intermediateInputTokens = estimateTokens(JSON.stringify(functionResponses));

      setLoadingMessage(t('aiApplyPage.statusFinalizing'));

      // SECOND API CALL: Send tool responses back using the *same session* from this turn.
      const response2 = await currentTurnSession.sendMessage({ message: functionResponses });
      
      let finalOutputTokens = 0;

      // The final text response comes from the second call.
      if (response2.text) {
        setMessages(prev => [...prev, { role: MessageRole.MODEL, content: response2.text }]);
        finalOutputTokens = estimateTokens(response2.text);
      }
      
      // Log the total tokens for this turn sequence
      if (chatTokenSessionIdRef.current) {
          logTokenEvent({
              feature: 'AI Apply Chat',
              model: MODEL_NAME,
              inputTokens: inputTokens + intermediateInputTokens,
              outputTokens: intermediateOutputTokens + finalOutputTokens,
              sessionId: chatTokenSessionIdRef.current
          });
      }
      
    } catch (error: any) {
      console.error("Error during AI Apply chat turn:", error);
      let errorMessageText = t('chatbotWidget.errorMessage');
      
      // Check for 429 Rate Limit Error
      if (error.message?.includes('429') || error.status === 429) {
          errorMessageText = "We are currently experiencing high traffic. Please wait a moment and try again.";
      }

      const errorMessage: ChatMessage = { role: MessageRole.ERROR, content: errorMessageText };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // This always runs, ensuring the loading state is reset.
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [isLoading, onChatbotAction, t]);

  const handlePreviewClick = useCallback(() => {
    if (!hasInteractedWithPreview) {
        setHasInteractedWithPreview(true);
        sessionStorage.setItem('ai-apply-preview-interacted', 'true');
    }
    setIsPreviewModalOpen(true);
  }, [hasInteractedWithPreview]);

  return (
    <>
    <div className="absolute inset-0 top-20 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:relative md:top-auto md:bottom-auto flex flex-col md:h-full">
        <div className="flex-1 flex flex-col p-4 pt-0 md:p-8 md:pt-2 md:pb-4 min-h-0">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
                <div className="relative flex justify-center items-center mb-4 md:mb-6">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
                      {userProfile?.fundName && userProfile?.fundCode 
                        ? `${userProfile.fundName} (${userProfile.fundCode})` 
                        : t('aiApplyPage.title')}
                    </h1>
                  </div>
                </div>

                {!canApply && (
                    <div className="bg-yellow-800/50 border border-yellow-600 text-yellow-200 p-3 rounded-md mb-4 text-sm text-center" role="alert">
                        {t('aiApplyPage.eligibilityNotice')}
                    </div>
                )}

                <div className="flex-1 flex flex-col min-h-0">
                
                    {/* --- MOBILE VIEW --- */}
                    <div className="md:hidden flex-1 flex flex-col min-h-0">
                        <main className="w-full h-full flex flex-col bg-[var(--theme-bg-secondary)]/50 rounded-lg shadow-2xl">
                            <header className="p-4 flex-shrink-0 flex justify-between items-start bg-black/20 rounded-t-lg">
                                <div>
                                    <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('chatbotWidget.title')}</h2>
                                    <p className="text-[10px] leading-tight text-gray-400 italic mt-1"><Trans i18nKey="chatbotWidget.disclaimer" components={{ 1: <a href="https://www.e4erelief.org/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />, 2: <a href="https://www.e4erelief.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" /> }} /></p>
                                </div>
                                <button onClick={handleReset} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-[var(--theme-bg-primary)]" title="Clear Draft & Restart">
                                    <ResetIcon />
                                </button>
                            </header>
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <ChatWindow messages={messages} isLoading={isLoading} logoUrl={logoUrl} loadingMessage={loadingMessage} />
                            </div>
                            <footer className="p-4 flex-shrink-0 bg-black/20 rounded-b-lg">
                                <div className="relative">
                                    <ChatInput ref={inputRef} onSendMessage={handleSendMessage} isLoading={isLoading} showPreviewButton onPreviewClick={handlePreviewClick} disabled={!canApply || !hasInteractedWithPreview} />
                                    {!hasInteractedWithPreview && canApply && <FirstTimeUserGuide />}
                                </div>
                            </footer>
                        </main>
                    </div>

                    {/* --- DESKTOP VIEW --- */}
                    <div className="hidden md:flex flex-1 flex-row gap-8 min-h-0">
                        <main className="w-3/5 flex flex-col bg-[var(--theme-bg-secondary)]/50 rounded-lg shadow-2xl min-h-0">
                            <header className="p-4 flex-shrink-0 flex justify-between items-start bg-black/20 rounded-t-lg">
                                <div>
                                    <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">{t('chatbotWidget.title')}</h2>
                                    <p className="text-[10px] leading-tight text-gray-400 italic mt-1"><Trans i18nKey="chatbotWidget.disclaimer" components={{1: <a href="https://www.e4erelief.org/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />, 2: <a href="https://www.e4erelief.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />}} /></p>
                                </div>
                                <button onClick={handleReset} className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-[var(--theme-bg-primary)] flex items-center gap-1 transition-colors" title="Clear Draft & Restart">
                                    <span className="text-xs font-semibold">Clear Draft</span>
                                    <ResetIcon />
                                </button>
                            </header>
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <ChatWindow messages={messages} isLoading={isLoading} logoUrl={logoUrl} loadingMessage={loadingMessage} />
                            </div>
                            <footer className="p-4 flex-shrink-0 bg-black/20 rounded-b-lg">
                                <ChatInput ref={inputRef} onSendMessage={handleSendMessage} isLoading={isLoading} disabled={!canApply} />
                            </footer>
                        </main>
                        <aside className="w-2/5 flex flex-col min-h-0">
                             <AIApplyPreviewPane
                                userProfile={userProfile}
                                applicationDraft={applicationDraft}
                                onDraftUpdate={onDraftUpdate}
                                onSubmit={onSubmit}
                                canApply={canApply}
                            />
                        </aside>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-shrink-0 hidden md:block">
            <Footer />
        </div>
    </div>
    {isPreviewModalOpen && (
        <AIApplyPreviewModal onClose={() => setIsPreviewModalOpen(false)}>
            <AIApplyPreviewPane
                userProfile={userProfile}
                applicationDraft={applicationDraft}
                onDraftUpdate={onDraftUpdate}
                onSubmit={onSubmit}
                canApply={canApply}
            />
        </AIApplyPreviewModal>
    )}
    </>
  );
};

export default AIApplyPage;
