'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Zap, Users, CheckCircle, Loader2, RefreshCw, ArrowUp, ArrowDown, Minus, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Prediction {
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  confidence: number;
  module: string;
  developer: string;
  description: string;
  current_similarity?: number;
  trend: string;
  predicted_conflict_in: string;
  recommendation: string;
}

interface ConsensusForecast {
  module: string;
  current_consensus: number;
  predicted_1week: number;
  predicted_2week: number;
  trend: string;
  reason: string;
}

interface AtRiskDeveloper {
  name: string;
  modules: string[];
  alignment: number;
  trend: string;
  recommendation: string;
}

interface EarlyWarningSystemProps {
  projectId: string;
}

export default function EarlyWarningSystem({ projectId }: EarlyWarningSystemProps) {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [consensusForecast, setConsensusForecast] = useState<ConsensusForecast[]>([]);
  const [atRiskDevelopers, setAtRiskDevelopers] = useState<AtRiskDeveloper[]>([]);
  const [stableModules, setStableModules] = useState<string[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    setHasLoaded(true);
    try {
      const response = await fetch(`/api/predictions?project_id=${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch predictions');
      
      const data = await response.json();
      setPredictions(data.predictions || []);
      setConsensusForecast(data.consensus_forecast || []);
      setAtRiskDevelopers(data.at_risk_developers || []);
      setStableModules(data.stable_modules || []);
      toast.success('Predictions loaded successfully');
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'developer_drift': return <Users className="w-5 h-5" />;
      case 'consensus_decline': return <TrendingDown className="w-5 h-5" />;
      case 'emerging_conflict': return <Zap className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'declining') return <ArrowDown className="w-4 h-4 text-red-400" />;
    if (trend === 'improving') return <ArrowUp className="w-4 h-4 text-green-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  // Prepare chart data
  const chartData = consensusForecast.map(forecast => ({
    module: forecast.module.substring(0, 15),
    'Current': forecast.current_consensus,
    '+1 Week': forecast.predicted_1week,
    '+2 Weeks': forecast.predicted_2week,
  }));

  // Show load button if not loaded yet
  if (!hasLoaded) {
    return (
      <div className="text-center py-16 border border-blue-500/30 bg-blue-500/10 rounded-lg">
        <AlertTriangle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Predictive Analysis Ready</h3>
        <p className="text-gray-400 mb-6">
          AI will analyze team patterns to predict potential conflicts
        </p>
        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-700 disabled:to-gray-700 rounded-lg transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing... (this may take 10-15 seconds)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>🔮 Run Predictive Analysis</span>
            </>
          )}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border border-gray-800 rounded-lg bg-gray-900/50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-400 text-sm">Analyzing patterns and generating predictions...</p>
        <p className="text-gray-500 text-xs mt-2">This may take 10-15 seconds</p>
      </div>
    );
  }

  if (predictions.length === 0 && consensusForecast.length === 0) {
    return (
      <div className="text-center py-16 border border-gray-800 rounded-lg bg-gray-900/50">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
        <p className="text-gray-400 mb-4">
          No potential conflicts detected. Team alignment looks strong.
        </p>
        <button
          onClick={fetchPredictions}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Refresh Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            Early Warning System
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            AI-powered conflict prediction and trend analysis
          </p>
        </div>
        <button
          onClick={fetchPredictions}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Top Priority Alerts */}
      {predictions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">🚨 Priority Alerts</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {predictions.slice(0, 3).map((prediction, index) => (
              <div
                key={index}
                className="border border-gray-800 rounded-lg p-5 bg-gray-900/50 hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(prediction.type)}
                    <span className={clsx('px-2 py-1 rounded text-xs font-medium border', getSeverityColor(prediction.severity))}>
                      {prediction.severity}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{prediction.confidence}% confidence</span>
                </div>

                <h4 className="font-semibold mb-2 text-sm">{prediction.description}</h4>
                
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Module:</span>
                    <span className="text-blue-400 font-medium">{prediction.module}</span>
                  </div>
                  {prediction.developer && (
                    <div className="flex items-center justify-between">
                      <span>Developer:</span>
                      <span className="text-gray-300">{prediction.developer}</span>
                    </div>
                  )}
                  {prediction.current_similarity && (
                    <div className="flex items-center justify-between">
                      <span>Team Alignment:</span>
                      <span className="text-yellow-400">{prediction.current_similarity}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Predicted:</span>
                    <span className="text-red-400">{prediction.predicted_conflict_in}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-2">Recommendation:</p>
                  <p className="text-sm text-gray-300">{prediction.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consensus Forecast Chart */}
      {consensusForecast.length > 0 && (
        <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
          <h3 className="text-lg font-semibold mb-4">📈 Consensus Forecast</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="module" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="Current" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="+1 Week" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="+2 Weeks" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid gap-3">
            {consensusForecast.map((forecast, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded">
                <div className="flex items-center gap-3">
                  {getTrendIcon(forecast.trend)}
                  <div>
                    <p className="font-medium text-sm">{forecast.module}</p>
                    <p className="text-xs text-gray-400">{forecast.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{forecast.current_consensus}% → {forecast.predicted_2week}%</p>
                  <p className="text-xs text-gray-500">2-week forecast</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* At-Risk Developers */}
      {atRiskDevelopers.length > 0 && (
        <div className="border border-gray-800 rounded-lg p-6 bg-gray-900/50">
          <h3 className="text-lg font-semibold mb-4">👥 Developer Drift Monitor</h3>
          <div className="space-y-3">
            {atRiskDevelopers.map((dev, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">{dev.name}</p>
                    <p className="text-sm text-gray-400">
                      Modules: {dev.modules.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="text-lg font-semibold text-yellow-400">{dev.alignment}%</span>
                    {getTrendIcon(dev.trend)}
                  </div>
                  <p className="text-xs text-gray-500">{dev.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stable Modules */}
      {stableModules.length > 0 && (
        <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Stable Modules
          </h3>
          <div className="flex flex-wrap gap-2">
            {stableModules.map((module, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30"
              >
                {module}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-3">
            These modules show consistent team alignment with no predicted conflicts.
          </p>
        </div>
      )}
    </div>
  );
}
