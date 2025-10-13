'use client';

import { useState } from 'react';
import { Search, Lightbulb, AlertTriangle, CheckSquare, Wrench, Copy, CheckCircle2, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ConflictAnalysisProps {
  analysis: {
    root_cause: string;
    recommendation: string;
    recommended_approach: string;
    reasoning: string;
    risks: {
      if_unresolved: string;
      severity: 'High' | 'Medium' | 'Low';
    };
    action_items: string[];
    technical_considerations: string[];
  };
  analysisId?: string;
  onResolve?: () => void;
}

export default function ConflictAnalysis({ analysis, analysisId, onResolve }: ConflictAnalysisProps) {
  const [techExpanded, setTechExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRecommendationColor = () => {
    if (analysis.recommended_approach.includes('Hybrid')) {
      return 'bg-yellow-500/10 border-yellow-500/30';
    }
    return 'bg-green-500/10 border-green-500/30';
  };

  const handleCopy = () => {
    const text = `
# Conflict Analysis

## Root Cause
${analysis.root_cause}

## Recommendation
${analysis.recommendation}

Recommended Approach: ${analysis.recommended_approach}

## Reasoning
${analysis.reasoning}

## Risks if Unresolved
${analysis.risks.if_unresolved}
Severity: ${analysis.risks.severity}

## Action Items
${analysis.action_items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

## Technical Considerations
${analysis.technical_considerations.map((item, i) => `- ${item}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success('Analysis copied to clipboard!');
  };

  const handleResolve = async () => {
    if (!analysisId) return;
    
    setResolving(true);
    try {
      // Mark as resolved in database
      const response = await fetch(`/api/conflicts/${analysisId}/resolve`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Conflict marked as resolved!');
        onResolve?.();
      } else {
        throw new Error('Failed to mark as resolved');
      }
    } catch (error) {
      toast.error('Failed to mark as resolved');
      console.error(error);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Root Cause */}
      <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
        <div className="flex items-start gap-3 mb-3">
          <Search className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Root Cause</h3>
            <p className="text-gray-300 leading-relaxed">{analysis.root_cause}</p>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className={clsx('border rounded-lg p-6', getRecommendationColor())}>
        <div className="flex items-start gap-3 mb-4">
          <Lightbulb className="w-7 h-7 text-yellow-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-bold">AI Recommendation</h3>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm font-medium">
                {analysis.recommended_approach}
              </span>
            </div>
            <p className="text-lg text-gray-200 mb-4 font-medium">{analysis.recommendation}</p>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-sm font-semibold text-gray-400 mb-2">Reasoning:</p>
              <p className="text-gray-300 leading-relaxed">{analysis.reasoning}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold">Risk Assessment</h3>
              <span className={clsx('px-3 py-1 border rounded-full text-sm font-medium', getSeverityColor(analysis.risks.severity))}>
                {analysis.risks.severity} Severity
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed">{analysis.risks.if_unresolved}</p>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
        <div className="flex items-start gap-3">
          <CheckSquare className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4">Action Items</h3>
            <div className="space-y-3">
              {analysis.action_items.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-950 rounded-lg border border-gray-800">
                  <div className="w-5 h-5 rounded border-2 border-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300 flex-1">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Considerations */}
      <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
        <button
          onClick={() => setTechExpanded(!techExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-900 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wrench className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold">Technical Considerations</h3>
            <span className="text-sm text-gray-500">({analysis.technical_considerations.length})</span>
          </div>
          {techExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {techExpanded && (
          <div className="px-6 pb-6 space-y-2">
            {analysis.technical_considerations.map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-950 rounded-lg border border-gray-800">
                <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-2" />
                <p className="text-gray-300 flex-1">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-800">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          <Copy className="w-4 h-4" />
          Copy Analysis
        </button>
        {analysisId && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            {resolving ? 'Marking...' : 'Mark as Resolved'}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          Share with Team
        </button>
      </div>
    </div>
  );
}
