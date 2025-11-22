
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
// FIX: Separated type and value imports for ChatMessage, MessageRole, and Application.
import { MessageRole } from '../types';
// FIX: Added missing import for Fund type.
import type { Fund } from '../data/fundData';
// FIX: Added UserProfile to type import
import type { ChatMessage, Application, UserProfile } from '../types';
import { createChatSession, MODEL_NAME } from '../services/geminiService';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import { logEvent as logTokenEvent, estimateTokens } from '../services/tokenTracker';
import { AI_GUARDRAILS } from '../config/aiGuardrails';
import { useTranslation, Trans } from 'react-i18next';

interface ChatbotWidgetProps {
  // FIX: Added missing userProfile prop.
  userProfile: UserProfile | null;
  applications: Application[];
  onChatbotAction: (functionName: string, args: any) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  scrollContainerRef: React.RefObject<HTMLElement>;
  // FIX: Added missing activeFund prop.
  activeFund: Fund | null;
  logoUrl: string;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ userProfile, applications, onChatbotAction, isOpen, setIsOpen, scrollContainerRef, activeFund, logoUrl }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: MessageRole.MODEL, content: t('chatbotWidget.greeting') }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatTokenSessionIdRef = useRef<string | null>(null);
  
  // Track previous fund code to detect switches and wipe session
  const prevFundCodeRef = useRef<string | undefined>(activeFund?.code);

  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const lastScrollY = useRef(0);
  const [sessionTurns, setSessionTurns] = useState(0);
  const hasSessionEnded = sessionTurns >= AI_GUARDRAILS.MAX_CHAT_TURNS_PER_SESSION;

  // Dragging & Resizing State
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 450, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  
  const resizeStartRef = useRef({ x: 0, y: 0 });
  const sizeStartRef = useRef({ width: 0, height: 0 });

  // Wipe session on Fund Identity Switch
  useEffect(() => {
    if (activeFund?.code !== prevFundCodeRef.current) {
        setMessages([{ role: MessageRole.MODEL, content: t('chatbotWidget.greeting') }]);
        chatSessionRef.current = null;
        chatTokenSessionIdRef.current = null; // Clear session ID to force generation of a new one
        setSessionTurns(0); // Reset turn count
        prevFundCodeRef.current = activeFund?.code;
    }
  }, [activeFund?.code, t]);

  useEffect(() => {
    // This ensures CSS transitions are only applied after the initial render, preventing a "flash" on load.
    setIsMounted(true);

    if (isOpen && userProfile) {
        // FIX: Pass userProfile as the first argument to createChatSession.
        const historyToSeed = messages.length > 1 ? messages.slice(-6) : [];
        chatSessionRef.current = createChatSession(userProfile, activeFund, applications, historyToSeed);
        
        // Only generate a new session ID if one doesn't exist (persists during conversation, resets on wipe)
        if (!chatTokenSessionIdRef.current) {
            chatTokenSessionIdRef.current = `ai-chat-${Math.random().toString(36).substr(2, 9)}`;
        }
    }
  }, [isOpen, applications, activeFund, userProfile, messages]);

  // Effect to update the initial greeting if the language changes and no conversation has started
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === MessageRole.MODEL) {
        const newGreeting = t('chatbotWidget.greeting');
        if (messages[0].content !== newGreeting) {
            setMessages([{ role: MessageRole.MODEL, content: newGreeting }]);
            // Reset the session ref so it re-initializes with the new language context if needed
            chatSessionRef.current = null;
        }
    }
  }, [i18n.language, t, messages]);
  
  // Drag Logic
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    // Only allow dragging on desktop
    if (window.innerWidth < 768) return;
    // Prevent dragging if clicking a button/interactive element
    if ((e.target as HTMLElement).closest('button, input, textarea, .resize-handle')) return;
    
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };
  };

  // Resize Logic
  const handleResizeMouseDown = (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.innerWidth < 768) return;

      setIsResizing(true);
      resizeStartRef.current = { x: e.clientX, y: e.clientY };
      sizeStartRef.current = { ...size };
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        
        let newX = positionStartRef.current.x + dx;
        let newY = positionStartRef.current.y + dy;

        // Boundary Constraints (Desktop only: md:left-8 = 32px, md:bottom-24 = 96px)
        const initialLeft = 32; 
        const initialBottom = 96;

        // Constrain X: Prevent moving off left or right screen edges
        // Left edge: x >= -initialLeft (so actual left >= 0)
        // Right edge: x <= windowWidth - initialLeft - width
        const minX = -initialLeft;
        const maxX = window.innerWidth - initialLeft - size.width;
        newX = Math.max(minX, Math.min(maxX, newX));

        // Constrain Y: Prevent moving off top or bottom screen edges
        // Top edge: y >= -(windowHeight - initialBottom - height)
        // Bottom edge: y <= initialBottom (so actual bottom >= 0)
        const initialTop = window.innerHeight - initialBottom - size.height;
        const minY = -initialTop;
        const maxY = initialBottom;
        newY = Math.max(minY, Math.min(maxY, newY));

        setPosition({
            x: newX,
            y: newY,
        });
      } else if (isResizing) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        
        // Apply min/max constraints
        const newWidth = Math.max(320, Math.min(1000, sizeStartRef.current.width + dx));
        const newHeight = Math.max(400, Math.min(900, sizeStartRef.current.height + dy));
        
        setSize({
            width: newWidth,
            height: newHeight
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  // Effect to handle scroll-based visibility for the chat button
  useEffect(() => {
    if (isOpen) {
      // If the chat window is open, the button is hidden via CSS, but we keep logic consistent
      return;
    }

    const scrollableElement = scrollContainerRef.current;
    if (!scrollableElement) {
        return;
    }


    lastScrollY.current = scrollableElement.scrollTop;

    const handleScroll = () => {
      const currentScrollY = scrollableElement.scrollTop;
      
      // A small threshold to prevent flickering on minor scroll adjustments
      if (Math.abs(currentScrollY - lastScrollY.current) < 20) {
        return;
      }

      if (currentScrollY > lastScrollY.current) {
        // Scrolling down
        setIsButtonVisible(false);
      } else {
        // Scrolling up
        setIsButtonVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    scrollableElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, scrollContainerRef]);

  const handleSendMessage = useCallback(async (userInput: string) => {
    if (!userInput.trim() || isLoading || hasSessionEnded) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { role: MessageRole.USER, content: userInput };
    setMessages(prev => [...prev, userMessage]);
    
    if (!chatSessionRef.current && userProfile) {
        chatSessionRef.current = createChatSession(userProfile, activeFund, applications, messages.slice(-6));
        if (!chatTokenSessionIdRef.current) {
            chatTokenSessionIdRef.current = `ai-chat-${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    try {
      if (!chatSessionRef.current) throw new Error("Chat session not initialized.");

      let totalInputTokens = estimateTokens(userInput);
      let totalOutputTokens = 0;

      // First API call
      let response = await chatSessionRef.current.sendMessage({ message: userInput });
      
      const functionCalls = response.functionCalls;

      // If the model returns function calls, execute them and send back the results.
      if (functionCalls && functionCalls.length > 0) {
          // "Output" of first call is the function call object
          totalOutputTokens += estimateTokens(JSON.stringify(functionCalls));

          const functionResponses = functionCalls.map(call => {
              onChatbotAction(call.name, call.args);
              return { functionResponse: { name: call.name, response: { result: 'ok' } } };
          });
          
          // "Input" for second call is the function response
          totalInputTokens += estimateTokens(JSON.stringify(functionResponses));

          // Add a small delay to reduce rate limit hits (shared quota protection)
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Second API call
          response = await chatSessionRef.current.sendMessage({ message: functionResponses });
      }
      
      // Final text response comes from either the first or second call
      const modelResponseText = response.text;
      totalOutputTokens += estimateTokens(modelResponseText);

      // Only add the final model message to the chat history after all actions are complete.
      if (modelResponseText) {
          setMessages(prev => [...prev, { role: MessageRole.MODEL, content: modelResponseText }]);
      }
      
      if (chatTokenSessionIdRef.current) {
          logTokenEvent({
              feature: 'AI Assistant',
              model: MODEL_NAME,
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              sessionId: chatTokenSessionIdRef.current,
          });
      }
      
      setSessionTurns(prev => prev + 1);

    } catch (error: any) {
      console.error(error);
      let errorMessageText = t('chatbotWidget.errorMessage');
      
      // Check for 429 Rate Limit Error
      if (error.message?.includes('429') || error.status === 429) {
          errorMessageText = "Our AI is currently experiencing high traffic. Please wait a moment and try again.";
      }

      const errorMessage: ChatMessage = { 
        role: MessageRole.ERROR, 
        content: errorMessageText
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, applications, onChatbotAction, activeFund, userProfile, t, messages, hasSessionEnded]);

  const toggleChat = () => setIsOpen(!isOpen);
  
  // Calculate inline styles for desktop positioning, drag, and resize
  const desktopStyle = (isOpen && window.innerWidth >= 768) 
    ? { 
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`
      } 
    : {};

  return (
    <>
      <div 
        style={desktopStyle}
        className={`
          fixed z-50 flex flex-col bg-[var(--theme-bg-secondary)] shadow-2xl border border-[var(--theme-bg-primary)]
          /* Transition Control: Disable transitions during drag/resize to prevent lag */
          ${isDragging || isResizing ? 'transition-none' : 'transition-all duration-300 ease-in-out'}
          
          /* Mobile: Full Screen Overlay */
          inset-0 w-full h-[100dvh] rounded-none
          
          /* Desktop: Floating Widget (Base positioning, dimensions controlled by inline styles) */
          md:inset-auto md:left-8 md:bottom-24 md:rounded-lg
          
          /* Visibility State */
          ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-10 pointer-events-none'}
        `}
        aria-hidden={!isOpen}
      >
       <header 
        onMouseDown={handleMouseDown}
        className="bg-[var(--theme-bg-primary)]/90 backdrop-blur-md p-4 border-b border-[var(--theme-border)] shadow-lg flex-shrink-0 md:rounded-t-lg cursor-default md:cursor-move select-none"
       >
        <div className="flex justify-between items-start pointer-events-none"> 
            {/* pointer-events-none on children so header captures drag, but enable buttons specifically */}
            <div className="pointer-events-auto max-w-[80%]">
                <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-gradient-start)] to-[var(--theme-gradient-end)]">
                {t('chatbotWidget.title')}
                </h1>
                <p className="text-xs text-gray-400 italic mt-1" onMouseDown={(e) => e.stopPropagation()}>
                    <Trans 
                        i18nKey="chatbotWidget.disclaimer" 
                        components={{ 
                            1: <a href="https://www.e4erelief.org/terms-of-use" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" />, 
                            2: <a href="https://www.e4erelief.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-white" /> 
                        }} 
                    />
                </p>
            </div>
            <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white p-2 -mr-2 -mt-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] pointer-events-auto"
                aria-label="Close chat"
                onMouseDown={(e) => e.stopPropagation()} // Prevent drag start on close button
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
      </header>
       <main className="flex-1 overflow-hidden flex flex-col">
        <ChatWindow messages={messages} isLoading={isLoading} logoUrl={logoUrl} />
        {hasSessionEnded && (
            <div className="p-2 bg-red-900/50 text-red-200 text-xs text-center">
                Session limit reached. Please refresh the page to start a new chat.
            </div>
        )}
      </main>
      <footer className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4 bg-[var(--theme-bg-primary)]/50 border-t border-[var(--theme-border)] md:rounded-b-lg flex-shrink-0 relative">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} disabled={hasSessionEnded} />
        
        {/* Resize Handle (Desktop Only) */}
        <div 
            className="resize-handle hidden md:block absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 opacity-50 hover:opacity-100 transition-opacity"
            onMouseDown={handleResizeMouseDown}
        >
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-[var(--theme-accent)]">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19L19 5M19 19L5 19" />
             </svg>
        </div>
      </footer>
    </div>

    <button
        onClick={toggleChat}
        className={`
            fixed left-8 bg-[var(--theme-accent)] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--theme-accent-hover)] transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-opacity-50 z-50 bottom-[calc(6rem+env(safe-area-inset-bottom))] md:bottom-8
            ${isMounted ? 'transition-all duration-500 ease-in-out' : ''} 
            ${isButtonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24 pointer-events-none'}
            /* Hide trigger button when open */
            ${isOpen ? 'hidden' : 'flex'}
        `}
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
      >
        {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        )}
      </button>
    </>
  );
};

export default ChatbotWidget;
