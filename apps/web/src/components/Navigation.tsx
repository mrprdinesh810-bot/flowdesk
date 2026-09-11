import React, { useState } from 'react';
import { useFlowDeskStore, ViewName } from '../stores/store.js';
import { CurrentTimeDisplay } from './CurrentTimeDisplay.js';
import { MobilePairingModal } from './MobilePairingModal.js';
import {
  Calendar,
  Sparkles,
  CheckSquare,
  Clock,
  PlayCircle,
  BookOpen,
  BarChart2,
  Settings,
  Database,
  Check,
  Smartphone,
  MoreHorizontal,
  X,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface NavItem {
  name: string;
  view: ViewName;
  icon: React.ElementType;
  description?: string;
}

const primaryMobileNav: NavItem[] = [
  { name: 'Today', view: 'today', icon: Calendar },
  { name: 'Dump', view: 'brain-dump', icon: Sparkles },
  { name: 'Schedule', view: 'schedule', icon: Clock },
  { name: 'Tasks', view: 'all-tasks', icon: CheckSquare },
  { name: 'Focus', view: 'execution', icon: PlayCircle },
];

const secondaryMobileNav: NavItem[] = [
  { name: 'Daily Review', view: 'daily-review', icon: BookOpen, description: 'Reflect on day & record outcomes' },
  { name: 'Analytics', view: 'analytics', icon: BarChart2, description: 'Completion rates & detected patterns' },
  { name: 'Settings', view: 'settings', icon: Settings, description: 'Server URL, OpenRouter, Ollama, work hours' },
  { name: 'Backup & Restore', view: 'backup', icon: Database, description: 'Portable ZIP database export/import' },
];

const allNavItems: NavItem[] = [
  { name: 'Today', view: 'today', icon: Calendar },
  { name: 'Brain Dump', view: 'brain-dump', icon: Sparkles },
  { name: 'Schedule', view: 'schedule', icon: Clock },
  { name: 'Tasks', view: 'all-tasks', icon: CheckSquare },
  { name: 'Execution', view: 'execution', icon: PlayCircle },
  { name: 'Daily Review', view: 'daily-review', icon: BookOpen },
  { name: 'Analytics', view: 'analytics', icon: BarChart2 },
  { name: 'Settings', view: 'settings', icon: Settings },
  { name: 'Backup & Restore', view: 'backup', icon: Database },
];

export const Navigation: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    layoutMode,
    isTimerRunning,
    activeTimerTask,
    activeTimerSeconds,
    isMoreMenuOpen,
    setIsMoreMenuOpen,
  } = useFlowDeskStore();

  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectView = (view: ViewName) => {
    setCurrentView(view);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. EXPANDED / DESKTOP SIDEBAR (>=1024px)                                  */}
      {/* ========================================================================= */}
      {layoutMode === 'expanded' && (
        <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen p-4 select-none">
          <div className="space-y-6">
            {/* Logo Branding */}
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">FlowDesk</span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-600 -mt-1">
                  Execution OS
                </span>
              </div>
            </div>

            {/* Current Date & Live 12-Hour Time */}
            <CurrentTimeDisplay variant="sidebar" />

            {/* Navigation Links */}
            <nav className="space-y-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => handleSelectView(item.view)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors text-left touch-target ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Actions */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <button
              onClick={() => setMobileModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/60 transition-all shadow-sm touch-target"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>📱 Connect Android App</span>
            </button>

            {/* Active Timer Floating Card */}
            {activeTimerTask && (
              <div
                onClick={() => handleSelectView('execution')}
                className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg cursor-pointer hover:bg-slate-800 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                    {isTimerRunning ? 'Focus Running' : 'Timer Paused'}
                  </span>
                  <span className="font-timer font-semibold text-emerald-300">
                    {formatTimer(activeTimerSeconds)}
                  </span>
                </div>
                <p className="text-sm font-semibold truncate text-white">{activeTimerTask.title}</p>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. MEDIUM / TABLET NAVIGATION RAIL (768px - 1023px)                       */}
      {/* ========================================================================= */}
      {layoutMode === 'medium' && (
        <aside className="w-56 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen p-3 select-none">
          <div className="space-y-5">
            {/* Compact Header */}
            <div className="flex items-center gap-2 px-1 py-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-base font-bold text-slate-900">FlowDesk</span>
            </div>

            <CurrentTimeDisplay variant="sidebar" />

            <nav className="space-y-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => handleSelectView(item.view)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left touch-target ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            {activeTimerTask && (
              <button
                onClick={() => handleSelectView('execution')}
                className="w-full p-2.5 rounded-xl bg-slate-900 text-white text-left text-xs hover:bg-slate-800 transition-all flex items-center justify-between"
              >
                <span className="truncate font-semibold max-w-[90px]">{activeTimerTask.title}</span>
                <span className="font-timer text-emerald-300 shrink-0 font-bold">{formatTimer(activeTimerSeconds)}</span>
              </button>
            )}
            <button
              onClick={() => setMobileModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200"
            >
              <Smartphone className="w-3.5 h-3.5" /> Pair Mobile
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 3. COMPACT / MOBILE BOTTOM NAVIGATION & "MORE" DRAWER (<768px)            */}
      {/* ========================================================================= */}
      {layoutMode === 'compact' && (
        <>
          {/* Bottom Navigation Bar */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1 safe-area-bottom flex items-center justify-around shadow-lg">
            {primaryMobileNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view && !isMoreMenuOpen;
              return (
                <button
                  key={item.view}
                  onClick={() => handleSelectView(item.view)}
                  className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all touch-target ${
                    isActive
                      ? 'text-indigo-600 scale-105'
                      : 'text-slate-500 hover:text-slate-700 active:scale-95'
                  }`}
                >
                  <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50' : ''}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  </div>
                  <span className="mt-0.5">{item.name}</span>
                </button>
              );
            })}

            {/* "More" Trigger Button */}
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all touch-target ${
                isMoreMenuOpen || ['daily-review', 'analytics', 'settings', 'backup'].includes(currentView)
                  ? 'text-indigo-600 scale-105'
                  : 'text-slate-500 hover:text-slate-700 active:scale-95'
              }`}
            >
              <div className={`p-1 rounded-lg ${isMoreMenuOpen ? 'bg-indigo-100' : ''}`}>
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="mt-0.5">More</span>
            </button>
          </nav>

          {/* "More" Bottom Sheet Modal */}
          {isMoreMenuOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
              {/* Tap backdrop to close */}
              <div className="flex-1" onClick={() => setIsMoreMenuOpen(false)} />

              {/* Sheet Container */}
              <div className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 pb-8 safe-area-bottom space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                {/* Pull handle */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto" />

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">FlowDesk Menu</h3>
                    <p className="text-xs text-slate-500">All features & settings on mobile</p>
                  </div>
                  <button
                    onClick={() => setIsMoreMenuOpen(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 touch-target"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Secondary Destinations Grid */}
                <div className="grid grid-cols-1 gap-2.5">
                  {secondaryMobileNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.view;
                    return (
                      <button
                        key={item.view}
                        onClick={() => handleSelectView(item.view)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all touch-target text-left ${
                          isActive
                            ? 'bg-indigo-50/90 border-indigo-200 text-indigo-900 shadow-sm'
                            : 'bg-slate-50/60 border-slate-200/80 text-slate-800 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${isActive ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-sm block">{item.name}</span>
                            <span className="text-xs text-slate-500 block">{item.description}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    );
                  })}
                </div>

                {/* Active Focus Timer Card inside Sheet */}
                {activeTimerTask && (
                  <div
                    onClick={() => handleSelectView('execution')}
                    className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-md flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Focus Session</span>
                        <span className="text-xs font-semibold text-white truncate max-w-[180px] block">{activeTimerTask.title}</span>
                      </div>
                    </div>
                    <span className="font-timer text-emerald-400 font-bold text-sm">{formatTimer(activeTimerSeconds)}</span>
                  </div>
                )}

                {/* Connect Desktop / Pairing Info */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setMobileModalOpen(true);
                    }}
                    className="font-semibold text-indigo-600 hover:underline flex items-center gap-1.5"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Desktop Server Pairing
                  </button>
                  <span>FlowDesk v1.0.0</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Desktop / Mobile Pairing QR Modal */}
      <MobilePairingModal isOpen={mobileModalOpen} onClose={() => setMobileModalOpen(false)} />
    </>
  );
};
