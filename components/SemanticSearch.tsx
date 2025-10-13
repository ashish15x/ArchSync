'use client';

import { useState } from 'react';
import { Search, Loader2, Sparkles, User, Tag, Clock, Star, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface SearchResult {
  id: string;
  project_id: string;
  developer_name: string;
  change_description: string | null;
  module_name: string;
  understanding_text: string;
  confidence_score: number | null;
  created_at: string;
  similarity: number;
}

interface SemanticSearchProps {
  projectId: string;
  onViewInContext?: (understandingId: string) => void;
}

export default function SemanticSearch({ projectId, onViewInContext }: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          project_id: projectId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);

      if (data.results.length === 0) {
        toast('No results found. Try a different query.', { icon: '🔍' });
      } else {
        toast.success(`Found ${data.results.length} relevant ${data.results.length === 1 ? 'result' : 'results'}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getModuleColor = (moduleName: string) => {
    const colors = [
      'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'bg-green-500/20 text-green-400 border-green-500/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    ];
    const hash = moduleName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getRelevanceBadgeColor = (similarity: number) => {
    if (similarity >= 80) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (similarity >= 60) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  };

  const renderStars = (score: number | null) => {
    if (!score) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= score ? 'text-yellow-500' : 'text-gray-600'}>
          {i <= score ? '⭐' : '○'}
        </span>
      );
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Search Input - Google-like */}
      <form onSubmit={handleSearch} className="space-y-6">
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your project architecture..."
            className="w-full pl-16 pr-6 py-5 bg-gray-900/50 border-2 border-gray-800 rounded-full focus:outline-none focus:border-blue-500 focus:bg-gray-900 transition-all text-lg shadow-lg hover:shadow-xl hover:border-gray-700"
            disabled={loading}
            autoFocus
          />
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-full transition-all font-medium shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Search with AI</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results */}
      {hasSearched && !loading && (
        <div className="space-y-4">
          {results.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {results.length} {results.length === 1 ? 'Result' : 'Results'}
                </h3>
                <p className="text-sm text-gray-500">Sorted by relevance</p>
              </div>

              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className="border border-gray-800 rounded-lg p-5 hover:border-gray-700 hover:bg-gray-900/50 hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-200">{result.developer_name}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border', getModuleColor(result.module_name))}>
                              <Tag className="w-3 h-3" />
                              {result.module_name}
                            </span>
                            {result.change_description && (
                              <span className="text-xs text-gray-500">
                                • {result.change_description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className={clsx('px-3 py-1 rounded-full text-sm font-medium border flex-shrink-0', getRelevanceBadgeColor(result.similarity))}>
                        {result.similarity.toFixed(0)}% match
                      </span>
                    </div>

                    {/* Understanding Text */}
                    <div className="text-gray-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                      {result.understanding_text}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {result.confidence_score && (
                          <div className="flex items-center gap-1">
                            {renderStars(result.confidence_score)}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(result.created_at)}
                        </div>
                      </div>
                      {onViewInContext && (
                        <button
                          onClick={() => onViewInContext(result.id)}
                          className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View in context
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 border border-gray-800 rounded-lg animate-in fade-in duration-300">
              <Search className="w-20 h-20 mx-auto mb-6 text-gray-600" />
              <h3 className="text-2xl font-semibold mb-3">No matches found</h3>
              <p className="text-gray-400 text-lg mb-4">
                Try different keywords or rephrase your question
              </p>
              <p className="text-sm text-gray-500">
                Search covers understandings, HLD, and LLD documents
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && !loading && (
        <div className="text-center py-20">
          <Sparkles className="w-20 h-20 mx-auto mb-6 text-blue-500/50 animate-pulse" />
          <h3 className="text-2xl font-semibold mb-3">Search through all team understandings</h3>
          <p className="text-gray-400 text-lg mb-8">
            Ask questions in natural language and find relevant architecture insights
          </p>
          <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400 mb-2">💡 Try asking:</p>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>"How does authentication work?"</li>
                <li>"Payment processing flow"</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400 mb-2">🔍 Searches in:</p>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Team understandings</li>
                <li>• HLD & LLD documents</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
