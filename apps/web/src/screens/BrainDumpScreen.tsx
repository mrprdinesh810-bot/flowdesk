import React, { useState, useEffect } from 'react';
import { useFlowDeskStore } from '../stores/store.js';
import { api } from '../api/client.js';
import { Sparkles, Zap, ShieldAlert, CornerDownLeft, Info, Cpu, Globe, RefreshCw } from 'lucide-react';

export const BrainDumpScreen: React.FC = () => {
  const [text, setText] = useState('');
  const [loadingMode, setLoadingMode] = useState<'ai' | 'offline' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [activeEngine, setActiveEngine] = useState<{ provider: string; model: string }>({
    provider: 'openrouter',
    model: 'minimax/minimax-m2.7:free',
  });
  const { setBrainDumpData, setCurrentView, layoutMode } = useFlowDeskStore();

  const loadSettings = () => {
    api.getSettings().then((s) => {
      const provider = s.selected_provider || 'openrouter';
      let model = 'deterministic';
      if (provider === 'ollama') model = s.ollama_model || 'mistral:latest';
      if (provider === 'openrouter') model = s.openrouter_model || 'minimax/minimax-m2.7:free';
      setActiveEngine({ provider, model });
    }).catch(() => {});
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSelectProvider = async (provider: 'ollama' | 'openrouter' | 'offline_quick_split') => {
    try {
      await api.saveSettings({ selected_provider: provider });
      loadSettings();
    } catch {
      setActiveEngine((prev) => ({ ...prev, provider }));
    }
  };

  const handleParse = async (mode: 'ai' | 'offline') => {
    if (!text.trim()) return;
    setLoadingMode(mode);
    setErrorMsg(null);
    setFallbackNotice(null);

    try {
      const data = await api.createBrainDump(
        text,
        mode === 'offline' ? 'offline_quick_split' : 'ai',
        mode === 'offline' ? 'offline_quick_split' : activeEngine.provider
      );

      if (mode === 'ai' && data.brain_dump?.was_fallback) {
        setFallbackNotice(
          data.brain_dump.ai_error || 'AI parsing did not succeed; created schedule using deterministic Quick Split.'
        );
      }

      setBrainDumpData(data);
    } catch (err: any) {
      console.error('Brain dump parsing failed:', err);
      setErrorMsg(err.message || 'Parsing failed. Try using Quick Split.');
    } finally {
      setLoadingMode(null);
    }
  };

  const handlePillClick = (snippet: string) => {
    setText((prev) => (prev ? `${prev.trim()}, ${snippet}` : snippet));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* Title & Philosophy */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Unfiltered Input</span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Brain Dump</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Type your messy thoughts, fixed commitments, classes, and tasks freely. FlowDesk extracts structured items and constructs a realistic schedule.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {fallbackNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-start gap-2.5">
          <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-xs uppercase tracking-wide text-amber-900 mb-0.5">Offline Fallback Activated</p>
            <p className="text-xs text-amber-800">{fallbackNotice}</p>
          </div>
        </div>
      )}

      {/* Main Input Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Engine Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Engine:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSelectProvider('openrouter')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-target ${
                activeEngine.provider === 'openrouter'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>OpenRouter</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectProvider('ollama')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-target ${
                activeEngine.provider === 'ollama'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ollama</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectProvider('offline_quick_split')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all touch-target ${
                activeEngine.provider === 'offline_quick_split'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Offline</span>
            </button>
          </div>
        </div>

        {/* Large Focus Textarea */}
        <textarea
          rows={layoutMode === 'compact' ? 7 : 6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. college till 4 then edc study, test at 3:10, finish trakt parser, revise python, maybe gym..."
          className="w-full text-base sm:text-base p-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none placeholder:text-slate-400 font-sans leading-relaxed shadow-inner"
        ></textarea>

        {/* Template Pills (Horizontally Scrollable with Large Tap Targets) */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-400 block">Quick tap suggestions:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              'College till 4pm',
              'EDC study for 90 min',
              'Test at 3:10pm',
              'Gym 6:30pm to 7:15pm',
              'Finish Trakt parser',
              'Revise Python for 45 min',
              'Clean files',
            ].map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => handlePillClick(pill)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shrink-0 transition-colors touch-target"
              >
                + {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons (Prominent on Mobile) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-slate-500">
            <span className="truncate">
              Model: <strong className="text-slate-800">{activeEngine.model}</strong>
            </span>
            <button
              type="button"
              onClick={() => setCurrentView('settings')}
              className="text-indigo-600 hover:underline font-semibold shrink-0"
            >
              Config
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={!text.trim() || loadingMode !== null}
              onClick={() => handleParse('offline')}
              className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-40 touch-target flex items-center justify-center gap-1.5"
            >
              {loadingMode === 'offline' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-600" />}
              <span>Quick Split</span>
            </button>

            <button
              type="button"
              disabled={!text.trim() || loadingMode !== null}
              onClick={() => handleParse('ai')}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all disabled:opacity-40 touch-target flex items-center justify-center gap-2"
            >
              {loadingMode === 'ai' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>AI Schedule Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
