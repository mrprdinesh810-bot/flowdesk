import React, { useState, useEffect } from 'react';
import { useFlowDeskStore } from '../stores/store.js';
import { api } from '../api/client.js';
import {
  Search,
  Filter,
  Play,
  CheckCircle,
  Clock,
  Calendar,
  ArrowRight,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react';

export const AllTasksScreen: React.FC = () => {
  const { setSelectedTaskId, setCurrentView, startTimerForTask, deleteTask } = useFlowDeskStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasks(undefined, filterStatus === 'all' ? undefined : filterStatus);
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filterStatus]);

  const handlePostponeTomorrow = async (taskId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    try {
      await api.postponeTask(taskId, dateStr);
      await loadTasks();
    } catch (err) {
      console.error('Failed to postpone task:', err);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'planned' : 'completed';
    try {
      await api.updateTaskStatus(taskId, nextStatus);
      await loadTasks();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery) return true;
    return (
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Task Directory</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">All Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage, filter, and inspect your approved task history.</p>
        </div>

        <button
          onClick={() => setCurrentView('brain-dump')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Brain Dump
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'planned', 'running', 'completed', 'postponed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No tasks found for the selected criteria.
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                setSelectedTaskId(t.id);
                setCurrentView('execution');
              }}
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(t.id, t.status);
                  }}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    t.status === 'completed'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 hover:border-indigo-600'
                  }`}
                >
                  {t.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                </button>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        t.priority === 'P1'
                          ? 'bg-rose-100 text-rose-700'
                          : t.priority === 'P2'
                          ? 'bg-amber-100 text-amber-700'
                          : t.priority === 'P3'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <h3
                      className={`text-sm font-semibold truncate ${
                        t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {t.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{t.category}</span>
                    <span>•</span>
                    <span>{t.planned_duration}m planned</span>
                    <span>•</span>
                    <span>Date: {t.scheduled_date}</span>
                    {t.checklist && t.checklist.length > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          {t.checklist.filter((c: any) => c.is_completed).length}/{t.checklist.length} checklist
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {t.status !== 'completed' && (
                  <>
                    <button
                      onClick={() => handlePostponeTomorrow(t.id)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Postpone to tomorrow"
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => startTimerForTask(t.id)}
                      className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors"
                      title="Start Timer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </>
                )}
                <button
                  onClick={async () => {
                    if (confirm(`Delete task "${t.title}"?`)) {
                      await deleteTask(t.id);
                      await loadTasks();
                    }
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
