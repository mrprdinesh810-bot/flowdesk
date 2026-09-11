import React, { useEffect, useState, useCallback } from 'react';
import { Download, Sparkles, CheckCircle2, ArrowRight, X, Smartphone, AlertCircle, RefreshCw, ExternalLink, ShieldAlert } from 'lucide-react';
import { api, getServerBaseUrl, setServerBaseUrl } from '../api/client.js';
import { nativeBridge } from '../services/nativeBridge.js';
import { useFlowDeskStore } from '../stores/store.js';

export const CURRENT_APP_VERSION = '1.0.0';

interface UpdateInfo {
  latestVersion: string;
  buildNumber: number;
  clientVersion: string;
  updateAvailable: boolean;
  downloadUrl: string;
  apkAvailable: boolean;
  apkSize: number;
  releaseDate: string;
  releaseNotes: string[];
  mandatory: boolean;
}

export const AppUpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [checking, setChecking] = useState(false);

  const activeModal = useFlowDeskStore((state) => state.activeModal);
  const setActiveModal = useFlowDeskStore((state) => state.setActiveModal);

  const isNative = nativeBridge.isNativePlatform();

  const checkForUpdates = useCallback(async (manual = false) => {
    try {
      if (manual) setChecking(true);
      const data = await api.checkAppUpdate(CURRENT_APP_VERSION);
      
      const dismissed = localStorage.getItem('flowdesk_dismissed_update');
      const isNewer = data.updateAvailable;

      if (isNewer) {
        setUpdateInfo(data);
        if (manual || dismissed !== data.latestVersion || data.mandatory) {
          setIsOpen(true);
          setActiveModal('update');
        }
      } else if (manual) {
        alert('You are already running the latest version of FlowDesk (v' + CURRENT_APP_VERSION + ')!');
      }
    } catch (err) {
      console.warn('Auto-update check skipped/failed:', err);
    } finally {
      if (manual) setChecking(false);
    }
  }, [setActiveModal]);

  useEffect(() => {
    // Initial check on load
    checkForUpdates(false);

    // Check automatically whenever device comes back online
    const handleOnline = () => {
      console.log('Device is online, checking for FlowDesk updates...');
      checkForUpdates(false);
    };

    window.addEventListener('online', handleOnline);

    // Periodic check every 30 minutes
    const interval = setInterval(() => {
      checkForUpdates(false);
    }, 30 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [checkForUpdates]);

  // Sync with store activeModal (hardware back button closes modal if not mandatory)
  useEffect(() => {
    if (isOpen && activeModal !== 'update' && !updateInfo?.mandatory) {
      setIsOpen(false);
    }
  }, [activeModal, isOpen, updateInfo?.mandatory]);

  const triggerBrowserDownload = () => {
    const downloadUrl = api.getApkDownloadUrl();
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'FlowDesk.apk');
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setStatusMessage('Download started via browser. Check your notification bar or downloads.');
    setTimeout(() => {
      setDownloading(false);
    }, 3000);
  };

  const handleDownload = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setNeedsPermission(false);

    if (isNative) {
      try {
        // Step 1: Check unknown sources permission on Android 8.0+
        const canInstall = await nativeBridge.canRequestPackageInstalls();
        if (!canInstall) {
          setNeedsPermission(true);
          setStatusMessage('Permission needed to install update directly. Please enable "Allow from this source".');
          return;
        }

        // Step 2: Download APK and trigger package installer handoff
        setDownloading(true);
        setStatusMessage('Downloading APK to cache & preparing installer...');

        const downloadUrl = api.getApkDownloadUrl();
        const res = await nativeBridge.downloadAndInstallApk(downloadUrl);

        if (res.success) {
          setStatusMessage(res.message || 'Installer launched! Please tap "Install" or "Update" on your screen.');
        } else {
          setErrorMessage(res.message || 'Failed to start installer.');
        }
      } catch (err: any) {
        console.error('Native APK update failed:', err);
        setErrorMessage(err.message || 'Installation handoff failed. You can still download the APK via browser.');
      } finally {
        setDownloading(false);
      }
    } else {
      // Desktop / Web: direct download
      setDownloading(true);
      setStatusMessage('Downloading FlowDesk.apk...');
      triggerBrowserDownload();
    }
  };

  const handleOpenPermissionSettings = async () => {
    await nativeBridge.openInstallPermissionSettings();
    setNeedsPermission(false);
    setStatusMessage('After granting permission in Settings, tap "Install Update" again.');
  };

  const handleDismiss = () => {
    if (updateInfo) {
      localStorage.setItem('flowdesk_dismissed_update', updateInfo.latestVersion);
    }
    setActiveModal(null);
    setIsOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '';
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return ` (~${mb} MB)`;
  };

  const handleSaveServerUrl = () => {
    setServerBaseUrl(serverUrlInput);
    setShowServerConfig(false);
    checkForUpdates(true);
  };

  if (!isOpen || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
        {/* Banner Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">New Update Available</h2>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full shadow-sm">
                  v{updateInfo.latestVersion}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                {isNative ? 'FlowDesk Android App' : 'FlowDesk Desktop / Web'}
              </p>
            </div>
          </div>

          {!updateInfo.mandatory && (
            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors relative z-10 touch-target"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Version badge comparison */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
            <div>
              <span className="block text-[11px] text-slate-400 uppercase font-semibold">Current</span>
              <span className="font-bold text-slate-600">v{CURRENT_APP_VERSION}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <span className="block text-[11px] text-emerald-600 uppercase font-semibold">Latest</span>
              <span className="font-bold text-emerald-600 text-sm">v{updateInfo.latestVersion}</span>
            </div>
          </div>

          {/* Release Notes */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              What's New in this Update:
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
              {updateInfo.releaseNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Android / Desktop Handoff Guidance */}
          {isNative ? (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-950 text-[11px] leading-relaxed">
              <Smartphone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Tap <strong>"Install Update"</strong> to automatically download and open the Android package installer. No manual file browsing required!
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-900 text-[11px] leading-relaxed">
              <Download className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Download the updated APK to sideload onto your Android devices or test locally.
              </span>
            </div>
          )}

          {/* Needs Permission Notice */}
          {needsPermission && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Permission Required</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Android requires explicit permission for FlowDesk to install app updates. Tap below to enable "Allow from this source".
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleOpenPermissionSettings}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 touch-target"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Settings</span>
                </button>
                <button
                  onClick={triggerBrowserDownload}
                  className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold transition-colors touch-target"
                >
                  Download APK Directly
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && !errorMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error Message & Fallback Option */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-xs text-rose-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={triggerBrowserDownload}
                className="w-full mt-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 touch-target"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Fallback: Download APK via Browser</span>
              </button>
            </div>
          )}

          {/* Server Config Accordion for Mobile Users */}
          {showServerConfig && (
            <div className="p-3.5 bg-slate-100 rounded-2xl space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">Custom Server Address:</label>
              <input
                type="text"
                value={serverUrlInput}
                onChange={(e) => setServerUrlInput(e.target.value)}
                placeholder="e.g. http://192.168.1.5:4000"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowServerConfig(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 touch-target"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveServerUrl}
                  className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-xl font-medium touch-target"
                >
                  Save & Check
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setServerUrlInput(getServerBaseUrl());
              setShowServerConfig(!showServerConfig);
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 underline touch-target"
          >
            Server Settings
          </button>

          <div className="flex items-center gap-2">
            {!updateInfo.mandatory && (
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-2xl transition-colors touch-target"
              >
                Later
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 touch-target disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isNative ? 'Installing...' : 'Downloading...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{isNative ? 'Install Update' : 'Download & Update'}{formatFileSize(updateInfo.apkSize)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
