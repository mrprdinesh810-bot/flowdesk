import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CurrentTimeDisplayProps {
  variant?: 'dashboard' | 'sidebar' | 'inline';
  className?: string;
}

export const CurrentTimeDisplay: React.FC<CurrentTimeDisplayProps> = ({
  variant = 'dashboard',
  className = '',
}) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    // Update every 1 second to keep the clock live and accurate
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format: "Wednesday, September 9"
  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // 12-hour format with hours, minutes, seconds and AM/PM (e.g. "01:45:28 PM")
  const timeFormatted = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  if (variant === 'sidebar') {
    return (
      <div className={`p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 ${className}`}>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span className="truncate">{dateFormatted}</span>
        </div>
        <div className="text-base font-bold font-mono text-slate-900 mt-1 tracking-tight">
          {timeFormatted}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-2 font-medium ${className}`}>
        <span>{dateFormatted}</span>
        <span className="text-slate-300">•</span>
        <span className="font-mono font-bold text-indigo-600">{timeFormatted}</span>
      </span>
    );
  }

  // Dashboard variant (for TodayDashboard header)
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
        {dateFormatted}
      </span>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 shadow-sm shadow-indigo-100/50">
        <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
        <span className="font-mono text-base sm:text-lg font-bold tracking-tight">
          {timeFormatted}
        </span>
      </div>
    </div>
  );
};
