import React, { useState, useEffect } from 'react';
import { useFlowDeskStore } from '../stores/store.js';
import { api } from '../api/client.js';
import {
  Play,
  Pause,
  CheckCircle,
  Plus,
  Clock,
  CheckSquare,
  Square,
  AlertCircle,
  Calendar,
  FileText,
  Trash2,
} from 'lucide-react';

export const ExecutionScreen: React.FC = () => {
  const {
    todayTasks,
    selectedTaskId,
    setSelectedTaskId,
    activeTimerTask,
    activeTimerSeconds,
    isTimerRunning,
    startTimerForTask,
    pauseActiveTimer,
    resumeActiveTimer,
    completeActiveTimer,
    fetchTodayTasks,
    deleteTask,
    setCurrentView,
  } = useFlowDeskStore();

  const currentTask = todayTasks.find((t) => t.id === (selectedTaskId || activeTimerTask?.id)) || todayTasks[0];
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState(currentTask?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (currentTask) {
      setTaskNotes(currentTask.notes || '');
    }
  }, [currentTask?.id]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleToggleChecklist = async (chkId: string, currentStatus: boolean) => {
    try {
      await api.toggleChecklist(chkId, !currentStatus);
      await fetchTodayTasks();
    } catch (err) {
      console.error('Failed to toggle checklist:', err);
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim() || !currentTask) return;
    try {
      await api.addChecklist(currentTask.id, newChecklistTitle.trim());
      setNewChecklistTitle('');
      await fetchTodayTasks();
    } catch (err) {
      console.error('Failed to add checklist item:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!currentTask) return;
    setIsSavingNotes(true);
    try {
      await api.updateTask(currentTask.id, { notes: taskNotes });
      await fetchTodayTasks();
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (!currentTask) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">No active task selected</h2>
        <p className="text-sm text-slate-500">Go to Today Dashboard or Tasks to choose a task to focus on.</p>
      </div>
    );
  }

  const isCurrentTaskActive = activeTimerTask?.id === currentTask.id;
  const plannedSeconds = (currentTask.planned_duration || 30) * 60;
  const isOvertime = isCurrentTaskActive && activeTimerSeconds > plannedSeconds;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Task Header & Context */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 uppercase tracking-wider">
              {currentTask.priority}
            </span>
            <span className="text-xs text-slate-400 font-medium">{currentTask.category}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              Planned: {currentTask.planned_duration}m
            </span>
            <button
              onClick={async () => {
                if (confirm(`Delete task "${currentTask.title}"?`)) {
                  await deleteTask(currentTask.id);
                  setCurrentView('today');
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{currentTask.title}</h1>
          {currentTask.expected_outcome && (
            <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-800">Outcome: </span>
              {currentTask.expected_outcome}
            </p>
          )}
        </div>
      </div>

      {/* Giant Focus Timer Station (§10, §15) */}
      <div className={`rounded-3xl border-2 p-8 text-center space-y-6 shadow-sm transition-all ${
        isCurrentTaskActive && isTimerRunning
          ? 'bg-slate-900 text-white border-slate-900 shadow-indigo-100'
          : isCurrentTaskActive && !isTimerRunning
          ? 'bg-amber-50/60 border-amber-300 text-slate-900'
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">
            {isOvertime ? 'OVERTIME SESSION' : isCurrentTaskActive && isTimerRunning ? 'RUNNING FOCUS SESSION' : isCurrentTaskActive ? 'PAUSED' : 'READY'}
          </span>
          <div className={`text-6xl sm:text-7xl font-timer font-bold tracking-tight ${
            isOvertime ? 'text-amber-400' : isCurrentTaskActive && isTimerRunning ? 'text-white' : 'text-slate-900'
          }`}>
            {isCurrentTaskActive ? formatTimer(activeTimerSeconds) : '00:00'}
          </div>
          <p className="text-xs opacity-60">
            {isCurrentTaskActive
              ? `${Math.round(activeTimerSeconds / 60)}m of ${currentTask.planned_duration}m planned`
              : `Click below to start ${currentTask.planned_duration}m focus session`}
          </p>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {isCurrentTaskActive ? (
            <>
              {isTimerRunning ? (
                <button
                  onClick={pauseActiveTimer}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-colors"
                >
                  <Pause className="w-5 h-5" /> Pause Timer
                </button>
              ) : (
                <button
                  onClick={resumeActiveTimer}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" /> Resume Timer
                </button>
              )}

              <button
                onClick={() => completeActiveTimer(true)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                <CheckCircle className="w-5 h-5" /> Mark Completed
              </button>
            </>
          ) : (
            <button
              onClick={() => startTimerForTask(currentTask.id)}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
            >
              <Play className="w-5 h-5 fill-current" /> Start Timer Session
            </button>
          )}
        </div>
      </div>

      {/* Actionable Checklist (§9, §16) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-600" /> Checklist Blocks
        </h3>

        <div className="space-y-2">
          {currentTask.checklist && currentTask.checklist.length > 0 ? (
            currentTask.checklist.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleToggleChecklist(item.id, Boolean(item.is_completed))}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition-colors"
              >
                {item.is_completed ? (
                  <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300 shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    item.is_completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                  }`}
                >
                  {item.title}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-2">No checklist subtasks added.</p>
          )}
        </div>

        {/* Add Checklist Form */}
        <form onSubmit={handleAddChecklist} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            placeholder="Add a concrete checklist step..."
            className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!newChecklistTitle.trim()}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold disabled:opacity-50"
          >
            + Add Step
          </button>
        </form>
      </div>

      {/* Task Notes & Scratchpad */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" /> Focus Notes
          </h3>
          <button
            onClick={handleSaveNotes}
            disabled={isSavingNotes}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {isSavingNotes ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
        <textarea
          rows={3}
          value={taskNotes}
          onChange={(e) => setTaskNotes(e.target.value)}
          placeholder="Jot down quick thoughts, links, or context while focusing..."
          className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
        ></textarea>
      </div>
    </div>
  );
};
