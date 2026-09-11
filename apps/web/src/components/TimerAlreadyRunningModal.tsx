import React from 'react';
import { useFlowDeskStore } from '../stores/store.js';
import { AlertCircle, Play, Pause, CheckCircle, X } from 'lucide-react';

export const TimerAlreadyRunningModal: React.FC = () => {
  const { timerConflict, setTimerConflict, switchActiveTimer } = useFlowDeskStore();

  if (!timerConflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">Focus Timer Already Active</h3>
            <p className="text-sm text-slate-600 mt-1">
              FlowDesk enforces single-focus discipline (§45.E). You are currently timing:
            </p>
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {timerConflict.activeTaskTitle}
            </div>
          </div>
          <button
            onClick={() => setTimerConflict(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Would you like to switch to the new task? Choose what to do with your active session:
        </p>

        <div className="space-y-2">
          <button
            onClick={() => switchActiveTimer('pause')}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm hover:bg-indigo-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Pause className="w-4 h-4" /> Pause Current & Start New
            </span>
            <span className="text-xs bg-white px-2 py-0.5 rounded-md border border-indigo-200">Recommended</span>
          </button>

          <button
            onClick={() => switchActiveTimer('complete')}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Complete Current & Start New
            </span>
          </button>

          <button
            onClick={() => switchActiveTimer('abandon')}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-semibold text-sm hover:bg-rose-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <X className="w-4 h-4" /> Discard Current Session & Start New
            </span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setTimerConflict(null)}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Stay on Current Task
          </button>
        </div>
      </div>
    </div>
  );
};
