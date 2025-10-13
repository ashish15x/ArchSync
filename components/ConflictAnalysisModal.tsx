'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import ConflictAnalysis from './ConflictAnalysis';

interface ConflictAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: any;
  analysisId?: string;
  moduleName?: string;
}

export default function ConflictAnalysisModal({
  isOpen,
  onClose,
  analysis,
  analysisId,
  moduleName,
}: ConflictAnalysisModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold">AI Conflict Analysis</h2>
            {moduleName && (
              <p className="text-sm text-gray-400 mt-1">Module: {moduleName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <ConflictAnalysis
            analysis={analysis}
            analysisId={analysisId}
            onResolve={() => {
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
