
import React from 'react';
import { createPortal } from 'react-dom';

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center flex-col text-center"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
    >
      <div className="flex items-center justify-center space-x-2 mb-4">
        <div className="w-4 h-4 bg-[var(--theme-accent)] rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-4 h-4 bg-[var(--theme-accent)] rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-4 h-4 bg-[var(--theme-accent)] rounded-full animate-pulse"></div>
      </div>
      <p className="text-white text-lg font-semibold">{message}</p>
    </div>,
    modalRoot
  );
};

export default LoadingOverlay;