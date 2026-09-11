import React, { useEffect } from 'react';
import { useFlowDeskStore } from '../stores/store.js';
import { CurrentTimeDisplay } from '../components/CurrentTimeDisplay.js';
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ListTodo,
  CheckSquare,
  Flame,
  Trash2,
  Target,
} from 'lucide-react';

export const TodayDashboard: React.FC = () => {
  const {
    todayTasks,
    fetchTodayTasks,
    setCurrentView,
    setSelectedTaskId,
    activeTimerTask,
    activeTimerSeconds,
    isTimerRunning,
    startTimerForTask,
    pauseActiveTimer,
    resumeActiveTimer,
    completeActiveTimer,
    deleteTask,
    intelligencePlan,
    layoutMode,
  } = useFlowDeskStore();

  useEffect(() => {
    fetchTodayTasks();
  }, [fetchTodayTasks]);

  const p1Task = todayTasks.find((t) => t.priority === 'P1');
  const currentTask = activeTimerTask || p1Task || todayTasks.find((t) => t.status === 'planned');
  const upcomingTasks = todayTasks.filter((t) => t.id !== currentTask?.id && t.status !== 'completed');
  const completedTasks = todayTasks.filter((t) => t.status === 'completed');

  const totalPlannedMinutes = todayTasks.reduce((s, t) => s + (t.planned_duration || 0), 0);
  const totalActualMinutes = Math.round(todayTasks.reduce((s, t) => s + (t.actual_duration || 0), 0) / 60);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'P1':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-700">P1 Must Win</span>;
      case 'P2':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 text-amber-700">P2 High</span>;
      case 'P3':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-100 text-blue-700">P3 Medium</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700">P4 Low</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Today's Command Center</span>
          <div className="mt-1">
            <CurrentTimeDisplay variant="dashboard" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {completedTasks.length} of {todayTasks.length} tasks completed today
          </p>
        </div>

        <button
          onClick={() => setCurrentView('brain-dump')}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all touch-active"
        >
          <Sparkles className="w-4 h-4" />
          <span>Quick Brain Dump</span>
        </button>
      </header>

      {/* Main Outcome Callout if available */}
      {intelligencePlan?.mainOutcome && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-md flex items-start gap-3 border border-indigo-700/30">
          <div className="p-2 rounded-xl bg-indigo-500/20 shrink-0 text-indigo-300">
            <Target className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300 block">Today's Core Mission</span>
            <p className="text-sm sm:text-base font-bold text-white leading-snug">{intelligencePlan.mainOutcome.outcome}</p>
            {intelligencePlan.mainOutcome.whyItMatters && (
              <p className="text-xs text-slate-300 leading-relaxed">{intelligencePlan.mainOutcome.whyItMatters}</p>
            )}
          </div>
        </div>
      )}

      {/* Primary Focus Section */}
      {currentTask ? (
        <section className="bg-white rounded-3xl border border-indigo-100 shadow-sm p-5 sm:p-6 relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  <Flame className="w-3.5 h-3.5 text-indigo-600" />
                  Primary Focus
                </span>
                {getPriorityBadge(currentTask.priority)}
                <span className="text-xs text-slate-400 font-medium">{currentTask.category}</span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{currentTask.title}</h2>

              {currentTask.expected_outcome && (
                <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-800">Expected Outcome: </span>
                  {currentTask.expected_outcome}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Planned: {currentTask.planned_duration}m
                </span>
                {currentTask.scheduled_start && currentTask.scheduled_end && (
                  <span className="flex items-center gap-1 font-mono">
                    {currentTask.scheduled_start} – {currentTask.scheduled_end}
                  </span>
                )}
              </div>
            </div>

            {/* Live Focus Action Box with Large Touch Targets */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 border border-slate-200/80 min-w-[240px] space-y-3">
              <div className="text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Focus Time</span>
                <div className="text-3xl font-timer font-bold text-slate-900 mt-0.5">
                  {activeTimerTask?.id === currentTask.id ? formatTimer(activeTimerSeconds) : '00:00'}
                </div>
              </div>

              {activeTimerTask?.id === currentTask.id ? (
                <div className="flex gap-2 w-full">
                  {isTimerRunning ? (
                    <button
                      onClick={pauseActiveTimer}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors touch-target"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={resumeActiveTimer}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors touch-target"
                    >
                      <Play className="w-4 h-4 fill-current" /> Resume
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedTaskId(currentTask.id);
                      setCurrentView('execution');
                    }}
                    className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 touch-target"
                    title="Open Focus Workspace"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startTimerForTask(currentTask.id)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-colors touch-target"
                >
                  <Play className="w-4 h-4 fill-current" /> Start Focus Session
                </button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Tasks Scheduled Today</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Start with an unfiltered brain dump to extract priorities, check feasibility, and lock in your daily execution plan.
          </p>
          <button
            onClick={() => setCurrentView('brain-dump')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700"
          >
            Create Daily Plan
          </button>
        </div>
      )}

      {/* Main Grid: Upcoming Tasks and Progress Stats */}
      <div className={`grid gap-6 ${layoutMode === 'expanded' ? 'grid-cols-3' : 'grid-cols-1'}`}>
        {/* Upcoming Tasks List (Takes 2 cols on expanded) */}
        <div className={`space-y-3 ${layoutMode === 'expanded' ? 'col-span-2' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-indigo-600" />
              <span>Upcoming Scheduled Tasks ({upcomingTasks.length})</span>
            </h3>
            <button
              onClick={() => setCurrentView('all-tasks')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View All Tasks
            </button>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-slate-200/70 text-center text-slate-400 text-xs">
              No other upcoming tasks for today.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setCurrentView('execution');
                  }}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all touch-target"
                >
                  <div className="space-y-1 flex-1 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{task.title}</span>
                      {getPriorityBadge(task.priority)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>{task.category}</span>
                      <span>•</span>
                      <span>{task.planned_duration}m</span>
                      {task.scheduled_start && (
                        <>
                          <span>•</span>
                          <span>{task.scheduled_start}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startTimerForTask(task.id);
                      }}
                      className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors touch-target"
                      title="Start Timer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete task "${task.title}"?`)) {
                          deleteTask(task.id);
                        }
                      }}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors touch-target"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Day Metrics & Quick Routines (1 col) */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Today's Progress</h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Completion</span>
                  <span>{todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Planned</span>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{totalPlannedMinutes}m</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Actual</span>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">{totalActualMinutes}m</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Quick Navigation</h4>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentView('daily-review')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-indigo-100 text-left text-xs font-bold text-indigo-900 hover:bg-indigo-50 transition-colors touch-target"
              >
                <span>End of Day Reflection</span>
                <ArrowRight className="w-4 h-4 text-indigo-500" />
              </button>
              <button
                onClick={() => setCurrentView('schedule')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-indigo-100 text-left text-xs font-bold text-indigo-900 hover:bg-indigo-50 transition-colors touch-target"
              >
                <span>Full Timeline & Buffers</span>
                <ArrowRight className="w-4 h-4 text-indigo-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
