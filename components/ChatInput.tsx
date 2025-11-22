
import React, { useState, KeyboardEvent, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AI_GUARDRAILS } from '../config/aiGuardrails';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  showPreviewButton?: boolean;
  onPreviewClick?: () => void;
  disabled?: boolean;
}

const SendIcon: React.FC<{ disabled: boolean }> = ({ disabled }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={`w-6 h-6 ${disabled ? 'text-gray-500' : 'text-[var(--theme-accent)]'}`}
    >
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

const PreviewIcon: React.FC<{ disabled: boolean }> = ({ disabled }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={`w-6 h-6 ${disabled ? 'text-gray-500' : 'text-[var(--theme-accent)]'}`}
    >
        <path fillRule="evenodd" d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v14.25C1.5 20.16 2.339 21 3.375 21h17.25c1.035 0 1.875-.84 1.875-1.875V4.875C22.5 3.84 21.661 3 20.625 3H3.375zM9 6.75a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9zm0 3.75a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9zm0 3.75a.75.75 0 000 1.5h3a.75.75 0 000-1.5H9z" clipRule="evenodd" />
    </svg>
);


const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({ onSendMessage, isLoading, showPreviewButton, onPreviewClick, disabled }, ref) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const charsRemaining = AI_GUARDRAILS.MAX_CHAT_MESSAGE_CHARS - input.length;
  const isNearLimit = charsRemaining < 100;

  return (
    <div className="flex flex-col w-full">
        <div className="flex items-end space-x-2">
        {showPreviewButton && (
            <button
                onClick={onPreviewClick}
                disabled={isLoading}
                className="md:hidden bg-white hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold rounded-md transition-colors duration-200 w-[50px] h-10 flex items-center justify-center flex-shrink-0 mb-[1px]"
                aria-label="Show application progress"
            >
                <PreviewIcon disabled={isLoading} />
            </button>
        )}
        <div className="flex-1 flex flex-col">
             <textarea
                ref={ref}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('chatbotWidget.placeholder')}
                rows={1}
                disabled={isLoading || disabled}
                readOnly={disabled}
                maxLength={AI_GUARDRAILS.MAX_CHAT_MESSAGE_CHARS}
                className="w-full bg-white text-black text-base placeholder-gray-500 rounded-md focus:outline-none resize-none px-3 py-2 read-only:cursor-not-allowed"
            />
        </div>
        <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim() || disabled}
            className="bg-white hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed font-bold rounded-md transition-colors duration-200 w-[50px] h-10 flex items-center justify-center flex-shrink-0 mb-[1px]"
        >
            <SendIcon disabled={isLoading || !input.trim() || disabled} />
        </button>
        </div>
        <div className={`text-[10px] text-right mt-1 pr-14 ${isNearLimit ? 'text-orange-300' : 'text-gray-400'}`}>
            {input.length}/{AI_GUARDRAILS.MAX_CHAT_MESSAGE_CHARS}
        </div>
    </div>
  );
});

export default ChatInput;
