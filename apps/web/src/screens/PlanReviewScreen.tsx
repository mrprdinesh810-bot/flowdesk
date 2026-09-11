import React, { useState } from 'react';
import { useFlowDeskStore } from '../stores/store.js';
import {
  Check,
  AlertTriangle,
  Clock,
  Flame,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  Plus,
  Trash2,
  RefreshCw,
  Target,
  Sparkles,
  RotateCcw,
  Ban,
  CalendarOff,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Zap,
} from 'lucide-react';

export const PlanReviewScreen: React.FC = () => {
  const {
    candidates,
    feasibility,
    intelligencePlan,
    layoutMode,
    replanSchedule,
    updateCandidateField,
    recalculateSchedule,
    fixApprovedPlan,
    deleteCandidate,
    discardBrainDump,
    setCurrentView,
  } = useFlowDeskStore();

  const [isFixing, setIsFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [customReplanNote, setCustomReplanNote] = useState('');
  const [replanSuccessMsg, setReplanSuccessMsg] = useState<string | null>(null);

  // Collapsible section state for mobile
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    priority: true,
    mustWin: true,
    schedule: true,
    otherTasks: true,
    waste: false,
    moveDay: false,
    success: false,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleQuickReplan = async (note: string) => {
    setIsReplanning(true);
    setReplanSuccessMsg(null);
    try {
      await replanSchedule(note);
      setReplanSuccessMsg(`Schedule adapted: "${note}"`);
      setTimeout(() => setReplanSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Quick replan failed:', err);
    } finally {
      setIsReplanning(false);
      setCustomReplanNote('');
    }
  };

  const handleMoveCandidate = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= candidates.length) return;
    const reordered = [...candidates];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    reordered.forEach((c, idx) => {
      c.sort_order = idx;
    });
    useFlowDeskStore.setState({ candidates: reordered });
    recalculateSchedule();
  };

  const handleFix = async () => {
    setIsFixing(true);
    setFixError(null);
    try {
      await fixApprovedPlan();
    } catch (err: any) {
      setFixError(err.message || 'Failed to fix plan. Please try again.');
    } finally {
      setIsFixing(false);
    }
  };

  const p1Candidates = candidates.filter((c) => c.priority === 'P1' && c.is_included !== 0);
  const otherCandidates = candidates.filter((c) => (c.priority !== 'P1' || c.is_included === 0));
  const approvedCount = candidates.filter((c) => c.is_included !== 0).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              Editable Proposal
            </span>
            <span className="text-xs text-slate-400">• Step 5 of 6</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Review Proposed Plan</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Customize times, durations, and priorities below. FlowDesk recalculates feasibility live. Nothing is final until you click <strong>FIX PLAN</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => {
              if (confirm('Discard this entire schedule proposal and start over?')) {
                discardBrainDump();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs sm:text-sm font-semibold hover:bg-rose-50 transition-colors touch-target"
            title="Discard current schedule proposal"
          >
            <Trash2 className="w-4 h-4" /> Discard
          </button>
          <button
            onClick={() => setCurrentView('schedule')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors touch-target"
          >
            <Clock className="w-4 h-4" /> Timeline
          </button>
          <button
            onClick={handleFix}
            disabled={isFixing || approvedCount === 0}
            className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-bold shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 touch-target"
          >
            {isFixing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>FIX PLAN ({approvedCount})</span>
          </button>
        </div>
      </div>

      {fixError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
          {fixError}
        </div>
      )}

      {replanSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{replanSuccessMsg}</span>
        </div>
      )}

      {/* Schedule Intelligence Structured Container */}
      {intelligencePlan && (
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-indigo-500/20 space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Schedule Intelligence</span>
                  {intelligencePlan.currentTime && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-mono font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-300" />
                      <span>Now: {intelligencePlan.currentTime}</span>
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Today's Priority & Tactical Focus</h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMarkdownModal(!showMarkdownModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-indigo-100 transition-colors border border-white/10 touch-target"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-300" />
              <span>{showMarkdownModal ? 'Hide Report' : 'Markdown Report'}</span>
            </button>
          </div>

          {/* Overdue / Elapsed Tasks Warning */}
          {intelligencePlan.pendingPastTasks && intelligencePlan.pendingPastTasks.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-100 space-y-2 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Overdue Work Rescheduled Forward</span>
              </div>
              <div className="space-y-1.5">
                {intelligencePlan.pendingPastTasks.map((pt: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-xl bg-black/40 border border-amber-400/20 text-xs flex items-center justify-between gap-2">
                    <span className="font-bold text-amber-200">{pt.task}</span>
                    <span className="text-[10px] text-slate-300 truncate">{pt.actionTaken}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1. Today's Priority / Main Outcome */}
          {intelligencePlan.mainOutcome && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>1. Today's Priority (Main Outcome)</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-white leading-snug">
                {intelligencePlan.mainOutcome.outcome}
              </p>
              {intelligencePlan.mainOutcome.whyItMatters && (
                <p className="text-xs text-slate-300">
                  <span className="font-semibold text-indigo-300">Why it matters: </span>
                  {intelligencePlan.mainOutcome.whyItMatters}
                </p>
              )}
            </div>
          )}

          {/* 2. Must Win (P1) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>2. Must Win (🔴 P1)</span>
              </span>
            </div>
            <div className="space-y-1.5">
              {(intelligencePlan.mustWinTasks || []).map((mw: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                        {mw.priority || 'P1'}
                      </span>
                      <span className="font-semibold text-white">{mw.title}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{mw.expectedResult}</p>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-300 shrink-0 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">{mw.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Schedule Timeline (Collapsible) */}
          {intelligencePlan.schedule && intelligencePlan.schedule.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => toggleSection('schedule')}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-300 py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3. Schedule Timeline ({intelligencePlan.schedule.length} blocks)</span>
                </span>
                {openSections.schedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {openSections.schedule && (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {intelligencePlan.schedule.map((entry: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                        entry.isPast
                          ? 'bg-white/5 border-white/5 text-slate-500 opacity-60'
                          : entry.isFixed
                          ? 'bg-amber-500/10 border-amber-400/20 text-amber-100'
                          : 'bg-white/5 border-white/10 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[11px] font-bold shrink-0">{entry.time}</span>
                        <span className="font-semibold truncate">{entry.action}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold shrink-0 opacity-75">
                        {entry.priority || (entry.isFixed ? 'Fixed' : 'Task')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Other Tasks (P2–P4) */}
          {intelligencePlan.otherTasks && intelligencePlan.otherTasks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>4. Other Tasks ({intelligencePlan.otherTasks.length})</span>
              </span>
              <div className="space-y-1.5">
                {intelligencePlan.otherTasks.map((ot: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-200">{ot.title}</span>
                    <span className="text-[10px] text-slate-400">{ot.recommendation || ot.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Do Not Waste Time On (Collapsible) */}
          {intelligencePlan.doNotWasteTimeOn && intelligencePlan.doNotWasteTimeOn.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => toggleSection('waste')}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-rose-300 py-1"
              >
                <span className="flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>5. Do Not Waste Time On ({intelligencePlan.doNotWasteTimeOn.length})</span>
                </span>
                {openSections.waste ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {openSections.waste && (
                <div className="space-y-1.5">
                  {intelligencePlan.doNotWasteTimeOn.map((w: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-400/20 text-xs space-y-0.5">
                      <span className="font-bold text-rose-200 block">{w.task}</span>
                      <span className="text-[11px] text-slate-300 block">{w.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. Move to Another Day (Collapsible) */}
          {intelligencePlan.moveToAnotherDay && intelligencePlan.moveToAnotherDay.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => toggleSection('moveDay')}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-300 py-1"
              >
                <span className="flex items-center gap-1.5">
                  <CalendarOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>6. Move to Another Day ({intelligencePlan.moveToAnotherDay.length})</span>
                </span>
                {openSections.moveDay ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {openSections.moveDay && (
                <div className="space-y-1.5">
                  {intelligencePlan.moveToAnotherDay.map((m: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-xs space-y-0.5">
                      <span className="font-bold text-amber-200 block">{m.task}</span>
                      <span className="text-[11px] text-slate-300 block">{m.suggestedDayOrReason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. Definition of a Successful Day (Collapsible) */}
          {intelligencePlan.successCriteria && intelligencePlan.successCriteria.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => toggleSection('success')}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-300 py-1"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>7. Definition of a Successful Day</span>
                </span>
                {openSections.success ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {openSections.success && (
                <div className="space-y-1 bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-slate-200">
                  {intelligencePlan.successCriteria.map((sc: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 py-1 text-[12px]">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{sc.replace(/^[✅✓]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Replanning Chips & Note Bar */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 block">
              Quick Replanning (Dynamic Adjustment)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Class / meeting cancelled',
                'Only 2 hours remaining',
                'Finished first task early',
                'Feeling fatigued, drop low priority',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={isReplanning}
                  onClick={() => handleQuickReplan(chip)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-indigo-100 transition-colors border border-white/10 touch-target"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customReplanNote}
                onChange={(e) => setCustomReplanNote(e.target.value)}
                placeholder="e.g. 'urgent bug fix popped up'..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                disabled={!customReplanNote.trim() || isReplanning}
                onClick={() => handleQuickReplan(customReplanNote)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 touch-target"
              >
                {isReplanning ? 'Adapting...' : 'Replan'}
              </button>
            </div>
          </div>

          {/* Raw Markdown Report */}
          {showMarkdownModal && intelligencePlan.markdownReport && (
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-indigo-100 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {intelligencePlan.markdownReport}
            </div>
          )}
        </div>
      )}

      {/* Live Feasibility Banner */}
      {feasibility && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            feasibility.status === 'overloaded'
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : feasibility.status === 'tight'
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : feasibility.status === 'conflicted'
              ? 'bg-rose-50/70 border-rose-200 text-rose-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  feasibility.status === 'overloaded'
                    ? 'bg-rose-200 text-rose-800'
                    : feasibility.status === 'tight'
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                {feasibility.status === 'overloaded' || feasibility.status === 'conflicted' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold capitalize">
                  Feasibility: {feasibility.status.replace('_', ' ')}
                </h3>
                <p className="text-xs opacity-80 mt-0.5">
                  Work: {(feasibility.plannedMinutes / 60).toFixed(1)}h | Capacity: {(feasibility.availableMinutes / 60).toFixed(1)}h | Buffer: {feasibility.bufferMinutes}m
                </p>
              </div>
            </div>

            <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
              <span className="text-xs sm:text-xs opacity-75">Workload</span>
              <span className="text-xl sm:text-2xl font-bold font-timer">
                {feasibility.workloadPercent}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Tasks Customizer (Ordered List with Touch Controls) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Task Proposals ({candidates.length})</h2>
          </div>
          <span className="text-xs text-slate-500">{approvedCount} selected</span>
        </div>

        {candidates.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 text-sm">
            No proposed tasks. Enter a Brain Dump first.
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((cand, idx) => {
              const isP1 = cand.priority === 'P1';
              return (
                <div
                  key={cand.id}
                  className={`p-4 sm:p-5 rounded-2xl bg-white border-2 shadow-sm space-y-3 transition-all ${
                    isP1 ? 'border-rose-300' : 'border-slate-200/80'
                  }`}
                >
                  {/* Title & Touch Reorder Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      {/* Move Up / Down Buttons for Touch */}
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveCandidate(idx, 'up')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-20 touch-target"
                          title="Move task up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === candidates.length - 1}
                          onClick={() => handleMoveCandidate(idx, 'down')}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-20 touch-target"
                          title="Move task down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={cand.title}
                        onChange={(e) => updateCandidateField(cand.id, { title: e.target.value })}
                        className="text-sm sm:text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none w-full bg-transparent"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteCandidate(cand.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors touch-target"
                      title="Delete task candidate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Expected Outcome */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Expected Outcome:</label>
                    <input
                      type="text"
                      value={cand.expected_outcome || ''}
                      placeholder="Concrete result when completed..."
                      onChange={(e) => updateCandidateField(cand.id, { expected_outcome: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Priority, Duration, Times & Include Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <select
                        value={cand.priority}
                        onChange={(e) => updateCandidateField(cand.id, { priority: e.target.value })}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border-none focus:ring-2 ${
                          isP1 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <option value="P1">P1 Must Win</option>
                        <option value="P2">P2 High</option>
                        <option value="P3">P3 Medium</option>
                        <option value="P4">P4 Low</option>
                      </select>

                      <div className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                        <input
                          type="number"
                          min={10}
                          step={5}
                          value={cand.estimated_duration}
                          onChange={(e) => updateCandidateField(cand.id, { estimated_duration: parseInt(e.target.value) || 30 })}
                          className="w-10 bg-transparent text-center font-bold font-timer focus:outline-none"
                        />
                        <span>min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>{cand.scheduled_start || '--:--'}</span>
                        <span>–</span>
                        <span>{cand.scheduled_end || '--:--'}</span>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-bold p-1 touch-target">
                        <input
                          type="checkbox"
                          checked={cand.is_included !== 0}
                          onChange={(e) => updateCandidateField(cand.id, { is_included: e.target.checked ? 1 : 0 })}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Include</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Mobile "FIX PLAN" Action Bar (Always Accessible) */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl flex items-center justify-between gap-3 safe-area-bottom">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Ready to Execute?</span>
          <span className="text-xs font-bold text-slate-900 block">{approvedCount} Tasks Approved</span>
        </div>
        <button
          onClick={handleFix}
          disabled={isFixing || approvedCount === 0}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md flex items-center gap-2 touch-active disabled:opacity-50"
        >
          {isFixing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
          <span>FIX PLAN</span>
        </button>
      </div>
    </div>
  );
};
