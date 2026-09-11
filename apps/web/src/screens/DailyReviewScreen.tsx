import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useFlowDeskStore } from '../stores/store.js';
import {
  Sun,
  CheckCircle2,
  Clock,
  ThumbsUp,
  TrendingUp,
  Save,
  Check,
} from 'lucide-react';

export const DailyReviewScreen: React.FC = () => {
  const { todayTasks, setCurrentView } = useFlowDeskStore();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [reviewData, setReviewData] = useState<any>(null);
  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatCouldImprove, setWhatCouldImprove] = useState('');
  const [notes, setNotes] = useState('');
  const [outcomeAchieved, setOutcomeAchieved] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.getDailyReview(todayStr).then((res) => {
      setReviewData(res);
      if (res.review) {
        setWhatWentWell(res.review.what_went_well || '');
        setWhatCouldImprove(res.review.what_could_improve || '');
        setNotes(res.review.notes || '');
        setOutcomeAchieved(Boolean(res.review.main_outcome_achieved));
      }
    });
  }, [todayStr]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.saveDailyReview(todayStr, {
        what_went_well: whatWentWell,
        what_could_improve: whatCouldImprove,
        notes,
        main_outcome_achieved: outcomeAchieved,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save review:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const plannedMinutes = todayTasks.reduce((s, t) => s + (t.planned_duration || 0), 0);
  const actualMinutes = Math.round(todayTasks.reduce((s, t) => s + (t.actual_duration || 0), 0) / 60);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Reflection & Closure</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Daily Review</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Record what happened today. Historical data refines future planning and feasibility estimates (§12, §20).
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Daily review saved successfully!
        </div>
      )}

      {/* Outcome Scorecard */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 rounded-xl bg-slate-50">
          <span className="text-xs text-slate-400 font-medium">Tasks Completed</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {completedCount}/{todayTasks.length}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50">
          <span className="text-xs text-slate-400 font-medium">Planned Work</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{plannedMinutes}m</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50">
          <span className="text-xs text-slate-400 font-medium">Actual Focus</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{actualMinutes}m</p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        {/* Main Outcome Check */}
        <label className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 cursor-pointer">
          <input
            type="checkbox"
            checked={outcomeAchieved}
            onChange={(e) => setOutcomeAchieved(e.target.checked)}
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <div>
            <span className="text-sm font-bold text-indigo-950 block">Did you achieve today's primary outcome?</span>
            <span className="text-xs text-indigo-700/80">Checking this reinforces execution habits and discipline tracking.</span>
          </div>
        </label>

        {/* Reflection Prompts */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" /> What went well today?
            </label>
            <textarea
              rows={3}
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              placeholder="e.g. Cleared EDC study block early, stayed focused with zero notifications..."
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> What could improve tomorrow?
            </label>
            <textarea
              rows={3}
              value={whatCouldImprove}
              onChange={(e) => setWhatCouldImprove(e.target.value)}
              placeholder="e.g. Underestimated parser debugging time, need bigger break after college..."
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            ></textarea>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Carry-over & Additional Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down tasks to carry into tomorrow's brain dump..."
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            ></textarea>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentView('today')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Reflection'}
          </button>
        </div>
      </form>
    </div>
  );
};
