import React, { useState } from 'react';
import { useFlowDeskStore } from '../stores/store.js';
import { HelpCircle, CheckCircle2, ArrowRight, SkipForward } from 'lucide-react';

export const ClarificationScreen: React.FC = () => {
  const { clarificationCandidate, candidates, answerClarification, setCurrentView } = useFlowDeskStore();
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!clarificationCandidate) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No clarifications needed!</h2>
        <p className="text-sm text-slate-500">All tasks were understood cleanly.</p>
        <button
          onClick={() => setCurrentView('plan-review')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm"
        >
          Proceed to Plan Review
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setIsSubmitting(true);
    try {
      await answerClarification(clarificationCandidate.id, answer);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearCandidates = candidates.filter((c) => c.id !== clarificationCandidate.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Clarification Gate</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Quick Clarification</h1>
        <p className="text-sm text-slate-500 mt-1">
          FlowDesk asks questions only when genuinely necessary to schedule realistic work (§5).
        </p>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-sm p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-400"></div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Unclear Item</span>
            <h2 className="text-lg font-bold text-slate-900">{clarificationCandidate.title}</h2>
            <p className="text-xs text-slate-500">Category: {clarificationCandidate.category || 'General'}</p>
          </div>
        </div>

        {/* What FlowDesk Understood */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <span className="font-semibold text-slate-700 block">What FlowDesk understood:</span>
          <p>{clarificationCandidate.description || `Estimated at ${clarificationCandidate.estimated_duration} minutes.`}</p>
        </div>

        {/* The Exact Question */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-800">
            {clarificationCandidate.clarification_question || `What specific outcome or subtask is intended for "${clarificationCandidate.title}"?`}
          </label>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              autoFocus
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. Finish sections 4 and 5 notes"
              className="w-full text-sm p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('plan-review')}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                <SkipForward className="w-3.5 h-3.5" /> Skip / Decide during Plan Review
              </button>

              <button
                type="submit"
                disabled={!answer.trim() || isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Clear items summary */}
      {clearCandidates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Already Understood ({clearCandidates.length})
          </h3>
          <div className="space-y-2">
            {clearCandidates.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 text-sm"
              >
                <span className="font-semibold text-slate-800">{c.title}</span>
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
