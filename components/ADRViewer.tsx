'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Download, Printer, RefreshCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ADRViewerProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  module: string;
  consensus: number;
  adrNumber?: number;
  status?: string;
  onRegenerate?: () => void;
}

export default function ADRViewer({
  isOpen,
  onClose,
  content,
  module,
  consensus,
  adrNumber,
  status,
  onRegenerate,
}: ADRViewerProps) {
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
    toast.success('ADR copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ADR-${String(adrNumber || 1).padStart(3, '0')}-${module.replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('ADR downloaded!');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ADR-${String(adrNumber || 1).padStart(3, '0')}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 40px auto;
                padding: 20px;
                color: #333;
              }
              h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
              h2 { color: #1e40af; margin-top: 30px; }
              h3 { color: #1e3a8a; }
              code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
              pre { background: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto; }
              ul, ol { margin-left: 20px; }
              strong { color: #1f2937; }
              @media print {
                body { margin: 0; padding: 20px; }
              }
            </style>
          </head>
          <body>${renderMarkdownToHTML(content)}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Proposed': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Under Discussion': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Architecture Decision Record</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-medium">
                  {module}
                </span>
                {status && (
                  <span className={clsx('px-3 py-1 border rounded-full text-sm font-medium', getStatusColor(status))}>
                    {status}
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                  Consensus: {consensus.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="prose prose-invert max-w-none">
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(content) }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-6 flex flex-wrap gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download .md
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            <Printer className="w-4 h-4" />
            Print/PDF
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .markdown-content h1 {
          font-size: 2rem;
          font-weight: bold;
          color: #60a5fa;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .markdown-content h2 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #93c5fd;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .markdown-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #bfdbfe;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .markdown-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        .markdown-content ul, .markdown-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .markdown-content li {
          margin-bottom: 0.5rem;
        }
        .markdown-content strong {
          color: #e5e7eb;
          font-weight: 600;
        }
        .markdown-content code {
          background: #374151;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .markdown-content pre {
          background: #1f2937;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1rem;
        }
        .markdown-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

// Simple markdown to HTML converter
function renderMarkdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');

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
