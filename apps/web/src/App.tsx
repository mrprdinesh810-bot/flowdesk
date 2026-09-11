import React, { useEffect } from 'react';
import { useFlowDeskStore } from './stores/store.js';
import { Navigation } from './components/Navigation.js';
import { TimerAlreadyRunningModal } from './components/TimerAlreadyRunningModal.js';
import { AppUpdateModal } from './components/AppUpdateModal.js';

import { TodayDashboard } from './screens/TodayDashboard.js';
import { BrainDumpScreen } from './screens/BrainDumpScreen.js';
import { ClarificationScreen } from './screens/ClarificationScreen.js';
import { PlanReviewScreen } from './screens/PlanReviewScreen.js';
import { ScheduleScreen } from './screens/ScheduleScreen.js';
import { ExecutionScreen } from './screens/ExecutionScreen.js';
import { AllTasksScreen } from './screens/AllTasksScreen.js';
import { DailyReviewScreen } from './screens/DailyReviewScreen.js';
import { AnalyticsScreen } from './screens/AnalyticsScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';
import { BackupScreen } from './screens/BackupScreen.js';

export const App: React.FC = () => {
  const {
    currentView,
    layoutMode,
    setLayoutMode,
    goBack,
    fetchActiveTimer,
    fetchTodayTasks,
    fetchSettings,
    tickTimer,
  } = useFlowDeskStore();

  useEffect(() => {
    // Initial data fetch
    fetchActiveTimer();
    fetchTodayTasks();
    fetchSettings();

    // 1-second monotonic timer ticker
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchActiveTimer, fetchTodayTasks, fetchSettings, tickTimer]);

  useEffect(() => {
    // Layout mode resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const nextMode = w < 768 ? 'compact' : w < 1024 ? 'medium' : 'expanded';
      setLayoutMode(nextMode);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Android hardware back button handler
    const handleBackButton = () => {
      goBack();
    };
    window.addEventListener('flowdesk:backbutton', handleBackButton);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('flowdesk:backbutton', handleBackButton);
    };
  }, [setLayoutMode, goBack]);

  const renderActiveScreen = () => {
    switch (currentView) {
      case 'today':
        return <TodayDashboard />;
      case 'brain-dump':
        return <BrainDumpScreen />;
      case 'clarification':
        return <ClarificationScreen />;
      case 'plan-review':
        return <PlanReviewScreen />;
      case 'schedule':
        return <ScheduleScreen />;
      case 'execution':
        return <ExecutionScreen />;
      case 'all-tasks':
        return <AllTasksScreen />;
      case 'daily-review':
        return <DailyReviewScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'backup':
        return <BackupScreen />;
      default:
        return <TodayDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] safe-area-top safe-area-left safe-area-right select-none">
      {/* Navigation Shell (Compact Bottom Nav + More Sheet / Medium Rail / Expanded Sidebar) */}
      <Navigation />

      {/* Main Content Viewport */}
      <main
        className={`flex-1 overflow-y-auto max-h-screen ${
          layoutMode === 'compact'
            ? 'p-3 pb-24 safe-area-bottom'
            : layoutMode === 'medium'
            ? 'p-5'
            : 'p-8'
        }`}
      >
        {renderActiveScreen()}
      </main>

      {/* Global Timer Concurrency Guard Modal */}
      <TimerAlreadyRunningModal />

      {/* Global In-App Version Update Checker & Modal */}
      <AppUpdateModal />
    </div>
  );
};
