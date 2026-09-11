import React, { useState, useEffect } from 'react';
import { api, getServerBaseUrl, setServerBaseUrl } from '../api/client.js';
import {
  Settings,
  Cpu,
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Save,
  Smartphone,
  Wifi,
  RefreshCw,
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [serverUrl, setServerUrl] = useState('');
  const [serverTestStatus, setServerTestStatus] = useState<string | null>(null);
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [installedOllamaModels, setInstalledOllamaModels] = useState<string[]>([]);

  // Test status states
  const [ollamaStatus, setOllamaStatus] = useState<any>(null);
  const [openrouterStatus, setOpenrouterStatus] = useState<any>(null);
  const [isTestingOllama, setIsTestingOllama] = useState(false);
  const [isTestingOpenRouter, setIsTestingOpenRouter] = useState(false);

  useEffect(() => {
    setServerUrl(getServerBaseUrl());

    Promise.all([
      api.getSettings(),
      api.getOllamaModels().catch(() => ({ models: [] })),
    ]).then(([res, ollamaRes]) => {
      const models: string[] = (ollamaRes.models || []) as string[];
      setInstalledOllamaModels(models);

      const updatedSettings = { ...res };
      if ((!updatedSettings.ollama_model || updatedSettings.ollama_model === 'llama3') && models.length > 0) {
        updatedSettings.ollama_model = models.includes('mistral:latest') ? 'mistral:latest' : models[0];
      }
      if (!updatedSettings.openrouter_model || updatedSettings.openrouter_model === 'meta-llama/llama-3.2-3b-instruct:free' || updatedSettings.openrouter_model === 'openrouter/free') {
        updatedSettings.openrouter_model = 'minimax/minimax-m2.7:free';
      }

      setSettings(updatedSettings);
      setLoading(false);

      testOllamaWithModel(updatedSettings.ollama_base_url, updatedSettings.ollama_model);
      testOpenRouterWithModel(updatedSettings.openrouter_model, updatedSettings.openrouter_api_key);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setServerBaseUrl(serverUrl);
      await api.saveSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleTestServer = async () => {
    setIsTestingServer(true);
    setServerTestStatus(null);
    try {
      const targetUrl = (serverUrl.trim() || window.location.origin).replace(/\/+$/, '');
      const res = await fetch(`${targetUrl}/api/v1/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setServerTestStatus(`Connected! FlowDesk v${data.version || '1.0.0'} online.`);
      } else {
        setServerTestStatus(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setServerTestStatus(`Failed to connect: ${err.message}`);
    } finally {
      setIsTestingServer(false);
    }
  };

  const testOllamaWithModel = async (baseUrl?: string, model?: string) => {
    setIsTestingOllama(true);
    setOllamaStatus(null);
    try {
      const res = await api.testAi({
        provider: 'ollama',
        base_url: baseUrl || settings.ollama_base_url || 'http://127.0.0.1:11434',
        model: model || settings.ollama_model || 'mistral:latest',
      });
      setOllamaStatus(res);
    } catch (err: any) {
      setOllamaStatus({ connected: false, status: 'unavailable', message: err.message });
    } finally {
      setIsTestingOllama(false);
    }
  };

  const handleTestOllama = () => testOllamaWithModel(settings.ollama_base_url, settings.ollama_model);

  const testOpenRouterWithModel = async (model?: string, apiKey?: string) => {
    setIsTestingOpenRouter(true);
    setOpenrouterStatus(null);
    try {
      const res = await api.testAi({
        provider: 'openrouter',
        model: model || settings.openrouter_model || 'openrouter/free',
        api_key: apiKey || settings.openrouter_api_key || undefined,
      });
      setOpenrouterStatus(res);
    } catch (err: any) {
      setOpenrouterStatus({ connected: false, status: 'unavailable', message: err.message });
    } finally {
      setIsTestingOpenRouter(false);
    }
  };

  const handleTestOpenRouter = () => testOpenRouterWithModel(settings.openrouter_model, settings.openrouter_api_key);

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-28 md:pb-12">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Preferences & Connections</span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">System Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure server address, work hours, and local/remote AI providers.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Mobile Server Connection URL */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-3">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600" /> Server Connection (Mobile & LAN)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            When running on an Android device, specify your desktop server's local IP address (e.g. <code className="font-mono text-indigo-600">http://192.168.1.15:4000</code>). Leave blank to use local origin.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="e.g. http://192.168.1.15:4000"
              className="flex-1 text-sm p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            <button
              type="button"
              disabled={isTestingServer}
              onClick={handleTestServer}
              className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors touch-target flex items-center justify-center gap-1.5"
            >
              {isTestingServer ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4 text-indigo-600" />}
              <span>Test Connection</span>
            </button>
          </div>

          {serverTestStatus && (
            <div className={`p-3 rounded-xl text-xs font-medium ${serverTestStatus.startsWith('Connected') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {serverTestStatus}
            </div>
          )}
        </div>

        {/* Work Hours & Capacity */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" /> Work Hours & Capacity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Day Start Time</label>
              <input
                type="time"
                value={settings.work_start || '09:00'}
                onChange={(e) => setSettings({ ...settings, work_start: e.target.value })}
                className="w-full text-sm p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Day End Time</label>
              <input
                type="time"
                value={settings.work_end || '22:00'}
                onChange={(e) => setSettings({ ...settings, work_end: e.target.value })}
                className="w-full text-sm p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Target Buffer (%)</label>
              <input
                type="number"
                min={5}
                max={40}
                value={settings.buffer_percent ?? 15}
                onChange={(e) => setSettings({ ...settings, buffer_percent: parseInt(e.target.value) || 15 })}
                className="w-full text-sm p-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-timer"
              />
            </div>
          </div>
        </div>

        {/* AI Provider Selection */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" /> AI Provider Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'offline_quick_split',
                title: 'Offline Quick Split',
                desc: '100% deterministic, instant, zero cloud dependencies.',
                icon: Zap,
              },
              {
                id: 'ollama',
                title: 'Ollama (Local)',
                desc: 'Local LLM running on your machine via HTTP.',
                icon: Cpu,
              },
              {
                id: 'openrouter',
                title: 'OpenRouter (Cloud)',
                desc: 'Free tier remote models with server-held keys.',
                icon: Globe,
              },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = (settings.selected_provider || 'offline_quick_split') === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSettings({ ...settings, selected_provider: p.id })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all touch-target flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="text-sm font-bold text-slate-900">{p.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ollama Config */}
          {settings.selected_provider === 'ollama' && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Ollama Setup</h3>
                {installedOllamaModels.length > 0 && (
                  <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {installedOllamaModels.length} models detected
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Ollama Base URL</label>
                <input
                  type="text"
                  value={settings.ollama_base_url || 'http://127.0.0.1:11434'}
                  onChange={(e) => setSettings({ ...settings, ollama_base_url: e.target.value })}
                  className="w-full text-sm p-3 rounded-2xl border border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Model</label>
                {installedOllamaModels.length > 0 ? (
                  <select
                    value={settings.ollama_model || 'mistral:latest'}
                    onChange={(e) => setSettings({ ...settings, ollama_model: e.target.value })}
                    className="w-full text-sm p-3 rounded-2xl border border-slate-200 bg-white"
                  >
                    {installedOllamaModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={settings.ollama_model || 'mistral:latest'}
                    onChange={(e) => setSettings({ ...settings, ollama_model: e.target.value })}
                    placeholder="e.g. mistral:latest"
                    className="w-full text-sm p-3 rounded-2xl border border-slate-200"
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={isTestingOllama}
                  onClick={handleTestOllama}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors touch-target flex items-center gap-1.5"
                >
                  {isTestingOllama ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Test Ollama</span>
                </button>
                {ollamaStatus && (
                  <span className={`text-xs font-semibold ${ollamaStatus.connected ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {ollamaStatus.message}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* OpenRouter Config */}
          {settings.selected_provider === 'openrouter' && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">OpenRouter Setup</h3>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">OpenRouter API Key</label>
                <input
                  type="password"
                  value={settings.openrouter_api_key || ''}
                  placeholder={settings.has_openrouter_api_key ? settings.openrouter_api_key_masked : 'sk-or-v1-...'}
                  onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
                  className="w-full text-sm p-3 rounded-2xl border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">OpenRouter Model</label>
                <input
                  type="text"
                  value={settings.openrouter_model || 'minimax/minimax-m2.7:free'}
                  onChange={(e) => setSettings({ ...settings, openrouter_model: e.target.value })}
                  placeholder="e.g. minimax/minimax-m2.7:free"
                  className="w-full text-sm p-3 rounded-2xl border border-slate-200 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={isTestingOpenRouter}
                  onClick={handleTestOpenRouter}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors touch-target flex items-center gap-1.5"
                >
                  {isTestingOpenRouter ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Test OpenRouter</span>
                </button>
                {openrouterStatus && (
                  <span className={`text-xs font-semibold truncate max-w-xs ${openrouterStatus.connected ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {openrouterStatus.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md transition-all touch-active flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
