'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    module: string;
    developer: string;
    confidence: number;
  }>;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const STARTER_PROMPTS = [
  "How does authentication work?",
  "Explain the payment processing flow",
  "What's the team consensus on the main modules?",
  "Show me recent changes",
];

export default function ChatPanel({ isOpen, onClose, projectId, projectName }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          project_id: projectId,
          conversation_history: messages.slice(-4), // Last 4 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <div className="fixed inset-y-0 right-0 w-full lg:w-[400px] bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-blue-600/20 to-indigo-600/20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">ArchSync AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Context */}
        <div className="px-4 py-2 bg-gray-950 border-b border-gray-800">
          <p className="text-xs text-gray-500">
            Answering questions about <span className="text-blue-400 font-medium">{projectName}</span>
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ask me anything!</h3>
                <p className="text-sm text-gray-400 mb-6">
                  I can help you understand the codebase, team decisions, and architecture.
                </p>
              </div>

              {/* Starter Prompts */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">Try asking:</p>
                {STARTER_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 rounded-lg transition-colors text-sm border border-gray-700 hover:border-blue-500/50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{renderMarkdown(message.content)}</div>
                    </div>
                    
                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">Sources:</p>
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-800 rounded border border-gray-700 inline-block mr-2"
                          >
                            📝 {source.module} by {source.developer} {'⭐'.repeat(source.confidence)}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about the project..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Simple markdown renderer
function renderMarkdown(text: string) {
  // Bold
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Code blocks
  html = html.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-950 rounded text-blue-400">$1</code>');
  
  // Lists (simple)
  html = html.replace(/^- (.+)$/gm, '• $1');
  
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
