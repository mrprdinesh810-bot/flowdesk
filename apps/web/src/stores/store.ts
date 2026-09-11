import { create } from 'zustand';
import { api, ApiError } from '../api/client.js';

export type ViewName =
  | 'today'
  | 'brain-dump'
  | 'clarification'
  | 'plan-review'
  | 'schedule'
  | 'execution'
  | 'all-tasks'
  | 'daily-review'
  | 'analytics'
  | 'settings'
  | 'backup';

import { nativeBridge } from '../services/nativeBridge.js';

export type LayoutMode = 'compact' | 'medium' | 'expanded';

export interface TimerConflict {
  activeTaskId: string;
  activeTaskTitle: string;
  activeSessionId: string;
  attemptedTaskId: string;
}

// BroadcastChannel for cross-tab multi-window synchronization per §45.F
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('flowdesk_state_sync')
  : null;

interface FlowDeskState {
  // Adaptive Layout Mode per Phase 1
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;

  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;

  navigationHistory: ViewName[];
  isMoreMenuOpen: boolean;
  setIsMoreMenuOpen: (open: boolean) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  goBack: () => Promise<void>;

  // Brain Dump & Proposal State
  activeBrainDump: any | null;
  candidates: any[];
  scheduleBlocks: any[];
  feasibility: any | null;
  intelligencePlan: any | null;
  clarificationCandidate: any | null;
  isParsing: boolean;

  setBrainDumpData: (data: { brain_dump: any; candidates: any[]; schedule?: any[]; feasibility?: any; intelligence_plan?: any }) => void;
  setIntelligencePlan: (plan: any) => void;
  replanSchedule: (note: string) => Promise<void>;
  updateCandidateField: (id: string, updates: any) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;
  discardBrainDump: () => Promise<void>;
  answerClarification: (candidateId: string, answer: string) => Promise<void>;
  recalculateSchedule: () => Promise<void>;
  fixApprovedPlan: () => Promise<boolean>;

  // Execution & Tasks State
  todayTasks: any[];
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  fetchTodayTasks: () => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Active Focus Timer State
  activeTimerSession: any | null;
  activeTimerTask: any | null;
  activeTimerSeconds: number;
  isTimerRunning: boolean;
  timerConflict: TimerConflict | null;
  setTimerConflict: (conflict: TimerConflict | null) => void;

  fetchActiveTimer: () => Promise<void>;
  startTimerForTask: (taskId: string) => Promise<void>;
  pauseActiveTimer: () => Promise<void>;
  resumeActiveTimer: () => Promise<void>;
  completeActiveTimer: (markTaskCompleted?: boolean) => Promise<void>;
  switchActiveTimer: (action: 'pause' | 'complete' | 'abandon') => Promise<void>;
  tickTimer: () => void;

  // Settings
  settings: Record<string, any>;
  fetchSettings: () => Promise<void>;
}

export const useFlowDeskStore = create<FlowDeskState>((set, get) => {
  // Listen to BroadcastChannel messages from other tabs
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data?.type === 'TIMER_STATE_CHANGED' || event.data?.type === 'PLAN_FIXED') {
        get().fetchActiveTimer();
        get().fetchTodayTasks();
      }
    };
  }

  return {
    layoutMode: typeof window !== 'undefined'
      ? (window.innerWidth < 768 ? 'compact' : window.innerWidth < 1024 ? 'medium' : 'expanded')
      : 'expanded',
    setLayoutMode: (mode) => set({ layoutMode: mode }),

    currentView: 'today',
    navigationHistory: [],
    isMoreMenuOpen: false,
    setIsMoreMenuOpen: (open) => set({ isMoreMenuOpen: open }),
    activeModal: null,
    setActiveModal: (modal) => set({ activeModal: modal }),

    setCurrentView: (view) => {
      const current = get().currentView;
      if (current !== view) {
        set((state) => ({
          currentView: view,
          navigationHistory: [...state.navigationHistory, current],
          isMoreMenuOpen: false,
        }));
      }
    },

    goBack: async () => {
      // 0. If an input or textarea is currently focused -> blur it first (closes soft keyboard on mobile)
      if (typeof document !== 'undefined' && document.activeElement) {
        const el = document.activeElement as HTMLElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
          el.blur();
          return;
        }
      }

      // 1. If More menu is open -> close it
      if (get().isMoreMenuOpen) {
        set({ isMoreMenuOpen: false });
        return;
      }
      // 2. If an active modal is open -> close it
      if (get().activeModal) {
        set({ activeModal: null });
        return;
      }
      // 3. If timer conflict modal is open -> close it
      if (get().timerConflict) {
        set({ timerConflict: null });
        return;
      }
      // 4. If there is navigation history -> pop and navigate back (avoid loops)
      const history = [...get().navigationHistory];
      while (history.length > 0) {
        const prev = history.pop()!;
        if (prev !== get().currentView) {
          set({ currentView: prev, navigationHistory: history });
          return;
        }
      }
      // 5. If on another screen without history -> return to Today
      if (get().currentView !== 'today') {
        set({ currentView: 'today', navigationHistory: [] });
        return;
      }
      // 6. Already at root 'today' -> invoke native exit on Android
      await nativeBridge.exitApp();
    },

    activeBrainDump: null,
    candidates: [],
    scheduleBlocks: [],
    feasibility: null,
    intelligencePlan: null,
    clarificationCandidate: null,
    isParsing: false,

    setBrainDumpData: (data) => {
      const clarifying = data.candidates?.find((c: any) => c.status === 'clarification_required') || null;
      set({
        activeBrainDump: data.brain_dump,
        candidates: data.candidates || [],
        scheduleBlocks: data.schedule || [],
        feasibility: data.feasibility || null,
        intelligencePlan: data.intelligence_plan || null,
        clarificationCandidate: clarifying,
        currentView: clarifying ? 'clarification' : 'plan-review',
      });
    },

    setIntelligencePlan: (plan) => set({ intelligencePlan: plan }),

    replanSchedule: async (note: string) => {
      try {
        const brainDumpId = get().activeBrainDump?.id;
        const res = await api.replanSchedule({
          brain_dump_id: brainDumpId,
          interruption_note: note,
        });
        if (res.intelligence_plan) {
          set({
            intelligencePlan: res.intelligence_plan,
          });
        }
      } catch (err) {
        console.error('Replanning failed:', err);
      }
    },


    updateCandidateField: async (id, updates) => {
      try {
        const res = await api.updateCandidate(id, updates);
        set((state) => ({
          candidates: state.candidates.map((c) => (c.id === id ? { ...c, ...updates, ...res.candidate } : c)),
          scheduleBlocks: res.schedule || state.scheduleBlocks,
          feasibility: res.feasibility || state.feasibility,
        }));
      } catch (err) {
        console.error('Failed to update candidate:', err);
      }
    },

    deleteCandidate: async (id) => {
      try {
        const res = await api.deleteCandidate(id);
        const remaining = res.candidates || get().candidates.filter((c) => c.id !== id);
        const clarifying = remaining.find((c: any) => c.status === 'clarification_required') || null;
        set({
          candidates: remaining,
          scheduleBlocks: res.schedule || get().scheduleBlocks.filter((b) => b.candidateId !== id),
          feasibility: res.feasibility || get().feasibility,
          clarificationCandidate: clarifying,
          currentView: remaining.length === 0 ? 'brain-dump' : (clarifying ? 'clarification' : get().currentView),
        });
      } catch (err) {
        console.error('Failed to delete candidate:', err);
      }
    },

    discardBrainDump: async () => {
      const { activeBrainDump } = get();
      if (activeBrainDump?.id) {
        try {
          await api.discardBrainDump(activeBrainDump.id);
        } catch (err) {
          console.error('Failed to discard brain dump:', err);
        }
      }
      set({
        activeBrainDump: null,
        candidates: [],
        scheduleBlocks: [],
        feasibility: null,
        clarificationCandidate: null,
        currentView: 'brain-dump',
      });
    },

    answerClarification: async (candidateId, answer) => {
      try {
        const res = await api.clarifyCandidate(candidateId, answer);
        const remaining = res.all_candidates?.find((c: any) => c.status === 'clarification_required') || null;
        set({
          candidates: res.all_candidates,
          scheduleBlocks: res.schedule,
          feasibility: res.feasibility,
          clarificationCandidate: remaining,
          currentView: remaining ? 'clarification' : 'plan-review',
        });
      } catch (err) {
        console.error('Failed to clarify candidate:', err);
      }
    },

    recalculateSchedule: async () => {
      const { candidates } = get();
      try {
        const res = await api.recalculateSchedule(candidates);
        set({
          scheduleBlocks: res.blocks,
          feasibility: res.feasibility,
        });
      } catch (err) {
        console.error('Failed to recalculate schedule:', err);
      }
    },

    fixApprovedPlan: async () => {
      const { activeBrainDump, candidates } = get();
      if (!activeBrainDump) return false;

      try {
        const res = await api.fixPlan(activeBrainDump.id, candidates);
        if (res.success) {
          await get().fetchTodayTasks();
          set({
            activeBrainDump: null,
            candidates: [],
            scheduleBlocks: [],
            feasibility: null,
            currentView: 'today',
          });
          syncChannel?.postMessage({ type: 'PLAN_FIXED' });
          return true;
        }
      } catch (err) {
        console.error('FIX Plan failed:', err);
        throw err;
      }
      return false;
    },

    todayTasks: [],
    selectedTaskId: null,
    setSelectedTaskId: (id) => set({ selectedTaskId: id }),

    fetchTodayTasks: async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const tasks = await api.getTasks(today);
        set({ todayTasks: tasks });
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      }
    },

    deleteTask: async (id: string) => {
      try {
        await api.deleteTask(id);
        const { activeTimerTask, activeTimerSession, selectedTaskId } = get();
        if (activeTimerTask?.id === id || activeTimerSession?.task_id === id) {
          set({
            activeTimerSession: null,
            activeTimerTask: null,
            activeTimerSeconds: 0,
            isTimerRunning: false,
          });
        }
        if (selectedTaskId === id) {
          set({ selectedTaskId: null });
        }
        await get().fetchTodayTasks();
        syncChannel?.postMessage({ type: 'TIMER_STATE_CHANGED' });
      } catch (err) {
        console.error('Failed to delete task:', err);
        throw err;
      }
    },

    activeTimerSession: null,
    activeTimerTask: null,
    activeTimerSeconds: 0,
    isTimerRunning: false,
    timerConflict: null,
    setTimerConflict: (conflict) => set({ timerConflict: conflict }),

    fetchActiveTimer: async () => {
      try {
        const data = await api.getActiveTimer();
        set({
          activeTimerSession: data.session,
          activeTimerTask: data.task,
          activeTimerSeconds: data.active_seconds || 0,
          isTimerRunning: data.active,
        });
      } catch (err) {
        console.error('Failed to fetch active timer:', err);
      }
    },

    startTimerForTask: async (taskId) => {
      try {
        const res = await api.startTimer(taskId);
        set({
          activeTimerSession: res.session,
          activeTimerTask: res.task,
          activeTimerSeconds: res.active_seconds || 0,
          isTimerRunning: true,
          timerConflict: null,
        });
        await get().fetchTodayTasks();
        syncChannel?.postMessage({ type: 'TIMER_STATE_CHANGED' });
      } catch (err: any) {
        if (err instanceof ApiError && err.code === 'TIMER_ALREADY_RUNNING') {
          set({
            timerConflict: {
              activeTaskId: err.details?.active_task_id,
              activeTaskTitle: err.details?.active_task_title || 'Current Task',
              activeSessionId: err.details?.active_session_id,
              attemptedTaskId: taskId,
            },
          });
          return;
        }
        console.error('Failed to start timer:', err);
        throw err;
      }
    },

    pauseActiveTimer: async () => {
      const { activeTimerSession } = get();
      if (!activeTimerSession) return;
      try {
        const res = await api.pauseTimer(activeTimerSession.id);
        set({
          activeTimerSession: res.session,
          activeTimerSeconds: res.active_seconds || 0,
          isTimerRunning: false,
        });
        await get().fetchTodayTasks();
        syncChannel?.postMessage({ type: 'TIMER_STATE_CHANGED' });
      } catch (err) {
        console.error('Failed to pause timer:', err);
      }
    },

    resumeActiveTimer: async () => {
      const { activeTimerSession } = get();
      if (!activeTimerSession) return;
      try {
        const res = await api.resumeTimer(activeTimerSession.id);
        set({
          activeTimerSession: res.session,
          isTimerRunning: true,
        });
        await get().fetchTodayTasks();
        syncChannel?.postMessage({ type: 'TIMER_STATE_CHANGED' });
      } catch (err) {
        console.error('Failed to resume timer:', err);
      }
    },

    completeActiveTimer: async (markTaskCompleted = true) => {
      const { activeTimerSession } = get();
      if (!activeTimerSession) return;
      try {
        await api.completeTimer(activeTimerSession.id, markTaskCompleted);
        set({
          activeTimerSession: null,
          activeTimerTask: null,
          activeTimerSeconds: 0,
          isTimerRunning: false,
        });
        await get().fetchTodayTasks();
        syncChannel?.postMessage({ type: 'TIMER_STATE_CHANGED' });
      } catch (err) {
        console.error('Failed to complete timer:', err);
      }
    },

    switchActiveTimer: async (action) => {
      const { timerConflict } = get();
      if (!timerConflict) return;
      try {
        const res = await api.switchTimer(
          timerConflict.activeSessionId,
          timerConflict.attemptedTaskId,
          action
        );
        set({
          activeTimerSession: res.session,
          activeTimerTask: res.task,
          activeTimerSeconds: res.active_seconds || 0,
          isTimerRunning: true,
          timerConflict: null,
        });
        await get().fetchTodayTasks();
        syncChannel?.postMessage({ type: 'TIMER_STATE_CHANGED' });
      } catch (err) {
        console.error('Failed to switch timer:', err);
      }
    },

    tickTimer: () => {
      const { isTimerRunning } = get();
      if (isTimerRunning) {
        set((state) => ({ activeTimerSeconds: state.activeTimerSeconds + 1 }));
      }
    },

    settings: {},
    fetchSettings: async () => {
      try {
        const res = await api.getSettings();
        set({ settings: res });
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    },
  };
});
