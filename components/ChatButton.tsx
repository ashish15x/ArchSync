'use client';

import { MessageSquare } from 'lucide-react';

interface ChatButtonProps {
  onClick: () => void;
}

export default function ChatButton({ onClick }: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 group"
      aria-label="Open AI Assistant"
    >
      <div className="relative">
        {/* Pulsing ring animation */}
        <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
        
        {/* Main button */}
        <div className="relative flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
          <MessageSquare className="w-5 h-5 text-white" />
          <span className="text-white font-medium text-sm">Ask AI</span>
          
          {/* AI Badge */}
          <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full border-2 border-gray-950">
            AI
          </span>
        </div>
      </div>
    </button>
  );
}
