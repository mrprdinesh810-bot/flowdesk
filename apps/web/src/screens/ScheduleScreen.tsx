import React, { useEffect, useState } from 'react';
import { useFlowDeskStore } from '../stores/store.js';
import { Clock, ShieldCheck, AlertCircle, ArrowLeft, ArrowRight, Lock, Coffee } from 'lucide-react';

export const ScheduleScreen: React.FC = () => {
  const { scheduleBlocks, feasibility, todayTasks, currentView, setCurrentView } = useFlowDeskStore();

  // If we came directly from approved todayTasks, format blocks from tasks
  const displayBlocks = scheduleBlocks.length > 0
    ? scheduleBlocks
    : todayTasks.map((t, idx) => ({
        id: `blk_${t.id}`,
        title: t.title,
        start: t.scheduled_start || '09:00',
        end: t.scheduled_end || '10:00',
        durationMinutes: t.planned_duration || 60,
        blockType: t.is_fixed_commitment ? 'FIXED_COMMITMENT' : (t.priority === 'P1' ? 'FOCUS_WORK' : 'LIGHT_WORK'),
        priority: t.priority,
        isFixedCommitment: Boolean(t.is_fixed_commitment),
      }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Timeline & Capacity</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Practical Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">
            FlowDesk structures work around fixed commitments, priority levels, and essential buffer slots (§7).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {scheduleBlocks.length > 0 && (
            <button
              onClick={() => setCurrentView('plan-review')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Review
            </button>
          )}
          <button
            onClick={() => setCurrentView('today')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors"
          >
            Today Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slack & Buffer Capacity Breakdown Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Work</span>
          <p className="text-lg font-bold text-slate-900 mt-0.5">
            {displayBlocks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0)}m
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">Buffer Target</span>
          <p className="text-lg font-bold text-indigo-600 mt-0.5">
            {feasibility?.bufferMinutes || 45}m
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">Slack Slack</span>
          <p className={`text-lg font-bold mt-0.5 ${feasibility?.slackMinutes < 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {feasibility?.slackMinutes !== undefined ? `${feasibility.slackMinutes}m` : 'Normal'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">Feasibility</span>
          <p className="text-lg font-bold capitalize text-slate-800 mt-0.5">
            {feasibility?.status || 'Feasible'}
          </p>
        </div>
      </div>

      {/* Visual Timeline Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Day Execution Blocks</h3>

        {displayBlocks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No schedule blocks generated yet.
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-[47px] before:w-0.5 before:bg-slate-200">
            {displayBlocks.map((b, idx) => {
              const isFixed = b.blockType === 'FIXED_COMMITMENT' || b.isFixedCommitment;
              const isP1 = b.priority === 'P1' || b.blockType === 'FOCUS_WORK';

              return (
                <div key={b.id || idx} className="flex items-start gap-4 relative z-10">
                  {/* Start time bubble */}
                  <div className="w-20 pt-1 text-right text-xs font-timer font-semibold text-slate-500 shrink-0">
                    {b.start}
                  </div>

                  {/* Block Card */}
                  <div
                    className={`flex-1 p-4 rounded-xl border transition-all ${
                      isFixed
                        ? 'bg-slate-900 text-white border-slate-900'
                        : isP1
                        ? 'bg-indigo-50/70 border-indigo-200 text-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isFixed ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-300 px-2 py-0.5 rounded">
                              <Lock className="w-3 h-3" /> Fixed Commitment
                            </span>
                          ) : isP1 ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
                              P1 Focus Block
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {b.priority || 'P2'} Flexible Work
                            </span>
                          )}
                          <h4 className="text-sm font-bold">{b.title}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs opacity-75">
                        <span className="font-timer font-medium">
                          {b.start} → {b.end} ({b.durationMinutes}m)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
