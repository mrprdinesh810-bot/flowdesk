import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import {
  BarChart2,
  TrendingUp,
  Clock,
  CheckCircle,
  Lightbulb,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

export const AnalyticsScreen: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, patternsData, recommendationsData] = await Promise.all([
        api.getAnalytics(),
        api.getPatterns(),
        api.getRecommendations(),
      ]);
      setAnalytics(analyticsData);
      setPatterns(patternsData);
      setRecommendations(recommendationsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptRec = async (id: string) => {
    try {
      await api.acceptRecommendation(id);
      await loadData();
    } catch (err) {
      console.error('Failed to accept recommendation:', err);
    }
  };

  const handleDismissRec = async (id: string) => {
    try {
      await api.dismissRecommendation(id);
      await loadData();
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'strong':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 uppercase">Strong Evidence</span>;
      case 'supported':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 uppercase">Supported Pattern</span>;
      case 'emerging':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 uppercase">Emerging Signal</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 uppercase">Insufficient Data</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Deterministic Metrics</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Analytics & Personalization</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          FlowDesk learns only from measurable historical execution evidence (§13, §61). No AI guesswork.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading metrics...</div>
      ) : (
        <>
          {/* Top 4 Numerical KPIs (§61) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completion Rate</span>
              <p className="text-3xl font-timer font-bold text-indigo-600 mt-1">
                {analytics?.completion_rate || 0}%
              </p>
              <span className="text-xs text-slate-500">
                {analytics?.completed_tasks || 0} of {analytics?.total_eligible_tasks || 0} planned
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Focus Duration</span>
              <p className="text-3xl font-timer font-bold text-emerald-600 mt-1">
                {((analytics?.total_actual_minutes || 0) / 60).toFixed(1)}h
              </p>
              <span className="text-xs text-slate-500">
                {((analytics?.total_planned_minutes || 0) / 60).toFixed(1)}h planned
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimation Accuracy</span>
              <p className="text-3xl font-timer font-bold text-slate-900 mt-1">
                {analytics?.estimation_accuracy_percent || 100}%
              </p>
              <span className="text-xs text-slate-500">
                ±{analytics?.average_estimation_error_minutes || 0}m average drift
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Postponements</span>
              <p className="text-3xl font-timer font-bold text-amber-600 mt-1">
                {analytics?.total_postponements || 0}
              </p>
              <span className="text-xs text-slate-500">Tasks carried over</span>
            </div>
          </div>

          {/* Recommendations (§63, §64) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Evidence-Backed Recommendations</h2>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500 text-center">
                No active recommendations. Keep completing tasks to build measurable historical patterns.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        {getConfidenceBadge(rec.confidence)}
                        <span className="text-xs font-semibold text-slate-400">{rec.affected_category}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{rec.message}</p>
                      <p className="text-xs text-slate-500">
                        Based on {JSON.parse(rec.evidence_json || '{}').sample_count || 'several'} completed sessions.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRec(rec.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Suggestion
                      </button>
                      <button
                        onClick={() => handleDismissRec(rec.id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence-Backed Patterns List (§62) */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">Learned Behavioral Patterns</h2>

            {patterns.length === 0 ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500 text-center">
                Need at least 2 completed sessions in a category to detect patterns (§P4).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {patterns.map((pat) => (
                  <div
                    key={pat.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      {getConfidenceBadge(pat.confidence)}
                      <span className="text-xs font-mono text-slate-400">{pat.sample_count} samples</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{pat.human_readable_summary}</p>
                    <p className="text-[11px] text-slate-400">
                      Calculated via: <span className="font-mono">{pat.calculation_method}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
