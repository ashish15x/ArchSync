'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Download, Share2, RefreshCw, CheckCircle2, TrendingUp, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface DevReportViewerProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  reportNumber?: number;
  metadata?: {
    total_understandings: number;
    total_modules: number;
    active_contributors: number;
    avg_consensus: number;
    recent_activity_count: number;
  };
  generatedAt?: string;
  onRegenerate?: () => void;
}

export default function DevReportViewer({
  isOpen,
  onClose,
  content,
  reportNumber,
  metadata,
  generatedAt,
  onRegenerate,
}: DevReportViewerProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Report copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `dev-intelligence-report-${reportNumber || 1}-${date}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(content);
    toast.success('Report copied! Share it with your team.');
  };

  const getDataFreshness = () => {
    if (!generatedAt) return 'Just now';
    const date = new Date(generatedAt);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Table of Contents Sidebar */}
      <div className="hidden lg:block w-64 bg-gray-950 border-r border-gray-800 overflow-y-auto">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">TABLE OF CONTENTS</h3>
          <nav className="space-y-2 text-sm">
            <a href="#executive-summary" className="block py-2 px-3 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              📊 Executive Summary
            </a>
            <a href="#active-development" className="block py-2 px-3 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              🎯 Active Development
            </a>
            <a href="#risk-areas" className="block py-2 px-3 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              🔴 Risk Areas
            </a>
            <a href="#well-aligned" className="block py-2 px-3 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              ✅ Well-Aligned
            </a>
            <a href="#architecture-evolution" className="block py-2 px-3 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              📈 Architecture Evolution
            </a>
            <a href="#knowledge-gaps" className="block py-2 px-3 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              💡 Knowledge Gaps
            </a>
            <a href="#next-steps" className="block py-2 px-3 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
              📅 Next Steps
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">Development Intelligence Report</h2>
                {reportNumber && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-medium">
                    Report #{reportNumber}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">Generated {getDataFreshness()}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Metadata Banner */}
          {metadata && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <FileText className="w-3 h-3" />
                  <span>Understandings</span>
                </div>
                <div className="text-xl font-bold text-white">{metadata.total_understandings}</div>
              </div>
              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Modules</span>
                </div>
                <div className="text-xl font-bold text-white">{metadata.total_modules}</div>
              </div>
              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Users className="w-3 h-3" />
                  <span>Contributors</span>
                </div>
                <div className="text-xl font-bold text-white">{metadata.active_contributors}</div>
              </div>
              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Avg Consensus</span>
                </div>
                <div className="text-xl font-bold text-green-400">{metadata.avg_consensus.toFixed(0)}%</div>
              </div>
              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Recent Activity</span>
                </div>
                <div className="text-xl font-bold text-blue-400">{metadata.recent_activity_count}</div>
              </div>
            </div>
          )}
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-950">
          <div className="max-w-4xl mx-auto">
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(content) }}
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-gray-900 border-t border-gray-800 p-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : '📋 Copy Report'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              ⬇️ Download .md
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              📧 Share
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
                🔄 Regenerate
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .markdown-content h1 {
          font-size: 2.5rem;
          font-weight: bold;
          color: #60a5fa;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }
        .markdown-content h2 {
          font-size: 1.75rem;
          font-weight: bold;
          color: #93c5fd;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #374151;
        }
        .markdown-content h3 {
          font-size: 1.35rem;
          font-weight: 600;
          color: #bfdbfe;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .markdown-content p {
          margin-bottom: 1.25rem;
          line-height: 1.8;
          color: #d1d5db;
        }
        .markdown-content ul, .markdown-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .markdown-content li {
          margin-bottom: 0.75rem;
          line-height: 1.7;
        }
        .markdown-content strong {
          color: #f3f4f6;
          font-weight: 600;
        }
        .markdown-content hr {
          border: none;
          border-top: 2px solid #374151;
          margin: 2.5rem 0;
        }
        .markdown-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1.5rem;
          color: #9ca3af;
          font-style: italic;
          margin: 1.5rem 0;
        }
        
        /* Color-coded sections */
        .markdown-content h2:has(+ *:contains("Executive Summary")) {
          background: linear-gradient(to right, #1e3a8a, transparent);
          padding: 1rem;
          border-radius: 0.5rem;
          border-top: none;
        }
        .markdown-content h2:contains("Risk") {
          color: #fca5a5;
        }
        .markdown-content h2:contains("Well-Aligned") {
          color: #86efac;
        }
      `}</style>
    </div>
  );
}

// Enhanced markdown to HTML converter
function renderMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  
  // Wrap consecutive list items
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (!para.match(/^<[hul]/)) {
      return `<p>${para}</p>`;
    }
    return para;
  }).join('\n');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  return html;
}
