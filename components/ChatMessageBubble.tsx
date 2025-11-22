
import React from 'react';
// FIX: Separated type and value imports for ChatMessage and MessageRole.
import { MessageRole } from '../types';
import type { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  logoUrl: string;
}

const UserIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-[var(--theme-accent)] flex items-center justify-center font-bold text-white flex-shrink-0">
    U
  </div>
);

const ModelIcon: React.FC<{ logoUrl: string }> = ({ logoUrl }) => (
  <img
    src={logoUrl}
    alt="Relief Assistant Logo"
    className="w-8 h-8 rounded-full flex-shrink-0"
  />
);

const ErrorIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    </div>
);


const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, logoUrl }) => {
  const isUser = message.role === MessageRole.USER;
  const isError = message.role === MessageRole.ERROR;

  const bubbleAlignment = isUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isUser ? 'bg-[var(--theme-bg-primary)] text-white' : isError ? 'bg-red-900/50 text-red-200' : 'bg-[var(--theme-accent)] text-white';
  
  const Icon = isUser ? UserIcon : isError ? ErrorIcon : () => <ModelIcon logoUrl={logoUrl} />;

  // By conditionally rendering the icon, we can simplify the flexbox logic.
  // 'justify-end' will correctly push the user's message to the right.
  return (
    <div className={`flex items-start gap-3 ${bubbleAlignment}`}>
      {!isUser && <Icon />}
      <div className={`rounded-lg p-3 max-w-xl md:max-w-2xl lg:max-w-3xl whitespace-pre-wrap break-words ${bubbleColor}`}>
        {message.content}
      </div>
      {isUser && <Icon />}
    </div>
  );
};

export default ChatMessageBubble;
