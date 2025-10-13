'use client';

import { useState, useEffect } from 'react';
import { Loader2, Users, TrendingUp, AlertCircle, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Developer {
  name: string;
  understanding_id: string;
  confidence_score: number | null;
}

interface ClusterData {
  id: number;
  size: number;
  percentage: number;
  representative_text: string;
  developers: Developer[];
}

interface ConsensusResult {
  consensus_percentage: number;
  clusters: ClusterData[];
  total_understandings: number;
  module_name: string;
  message?: string;
}

interface ConsensusViewProps {
  projectId: string;
  modules: string[];
}

export default function ConsensusView({ projectId, modules }: ConsensusViewProps) {
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConsensusResult | null>(null);

  const handleAnalyze = async () => {
    if (!selectedModule) {
      toast.error('Please select a module');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/consensus?project_id=${projectId}&module_name=${encodeURIComponent(selectedModule)}`
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Consensus API error:', error);
        throw new Error(error.details || error.error || 'Failed to analyze consensus');
      }

      const data = await response.json();
      console.log('Consensus result:', data);
      setResult(data);

      if (data.message) {
        toast.error(data.message);
      } else {
        toast.success('Consensus analysis complete!');
      }
    } catch (error) {
      console.error('Consensus analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze consensus');
    } finally {
      setLoading(false);
    }
  };

  const getConsensusColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-400';
    if (percentage >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConsensusLabel = (percentage: number) => {
    if (percentage >= 70) return 'Strong Consensus';
    if (percentage >= 40) return 'Moderate Consensus';
    return 'Low Consensus';
  };

  const getClusterColor = (percentage: number, isLargest: boolean) => {
    if (isLargest) return 'bg-green-500/10 border-green-500/30';
    if (percentage >= 20) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getClusterBadgeColor = (percentage: number, isLargest: boolean) => {
    if (isLargest) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (percentage >= 20) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getBarColor = (percentage: number, isLargest: boolean) => {
    if (isLargest) return '#22c55e'; // green-500
    if (percentage >= 20) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const chartData = result?.clusters.map(cluster => ({
    name: `Cluster ${cluster.id}`,
    developers: cluster.size,
    percentage: cluster.percentage,
    isLargest: cluster.id === 1,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Module Selector and Analyze Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="module" className="block text-sm font-medium mb-2">
            Select Module
          </label>
          <select
            id="module"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            disabled={loading}
          >
            <option value="">Choose a module...</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedModule}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Analyze Consensus
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!result && !loading && (
        <div className="text-center py-16 border border-gray-800 rounded-lg">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold mb-2">Select a module to analyze team consensus</h3>
          <p className="text-gray-400">
            Discover how aligned your team is on architectural decisions
          </p>
        </div>
      )}

      {/* Results */}
      {result && !result.message && (
        <div className="space-y-6">
          {/* Consensus Score */}
          <div className="border border-gray-800 rounded-lg p-8 text-center bg-gradient-to-br from-gray-900 to-gray-950">
            <div className="mb-4">
              <div 
                className={clsx('text-6xl font-bold mb-2 cursor-help', getConsensusColor(result.consensus_percentage))}
                title={`${result.consensus_percentage}% of the team has similar understandings (largest cluster)`}
              >
                {result.consensus_percentage}%
              </div>
              <div className="text-xl text-gray-400 mb-1">Team Consensus</div>
              <div 
                className={clsx('text-sm font-medium cursor-help', getConsensusColor(result.consensus_percentage))}
                title="Percentage of team members in the largest agreement cluster"
              >
                {getConsensusLabel(result.consensus_percentage)}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Users className="w-4 h-4" />
              <span>{result.total_understandings} developers analyzed</span>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Cluster Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" label={{ value: 'Developers', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem',
                      color: '#f3f4f6',
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} developers (${props.payload.percentage.toFixed(1)}%)`,
                      'Size'
                    ]}
                  />
                  <Bar dataKey="developers" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage, entry.isLargest)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Clusters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Understanding Clusters</h3>
            {result.clusters.map((cluster, index) => (
              <div
                key={cluster.id}
                className={clsx(
                  'border rounded-lg p-6 transition-all',
                  getClusterColor(cluster.percentage, index === 0)
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        'px-3 py-1 rounded-full text-sm font-medium border',
                        getClusterBadgeColor(cluster.percentage, index === 0)
                      )}
                    >
                      Cluster {cluster.id}
                    </span>
                    <span className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                      {cluster.size} {cluster.size === 1 ? 'developer' : 'developers'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={clsx('text-2xl font-bold', getConsensusColor(cluster.percentage))}>
                      {cluster.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">of team</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">Representative Understanding:</div>
                  <div className="bg-gray-900/50 rounded-lg p-4 text-gray-300 leading-relaxed">
                    {cluster.representative_text}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-3">Developers in this cluster:</div>
                  <div className="flex flex-wrap gap-2">
                    {cluster.developers.map((dev, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-900 rounded-lg border border-gray-800"
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-sm text-gray-300">{dev.name}</span>
                        {dev.confidence_score && (
                          <span className="text-xs text-gray-500">
                            ({dev.confidence_score}/5)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          {result.consensus_percentage < 70 && (
            <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-400 mb-2">Low Team Alignment Detected</h4>
                  <p className="text-sm text-gray-300">
                    Consider scheduling a team discussion to align on the architectural approach for this module.
                    Multiple perspectives can lead to inconsistent implementations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
