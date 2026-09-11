import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, X, Copy, Check, Wifi, ExternalLink, RefreshCw, Download, Share2 } from 'lucide-react';
import { api } from '../api/client.js';

interface MobilePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobilePairingModal: React.FC<MobilePairingModalProps> = ({ isOpen, onClose }) => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [port, setPort] = useState<number>(3000);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoading(true);

    api.getNetworkInfo()
      .then((data) => {
        if (!mounted) return;
        setPort(data.port || 3000);
        const addrs = data.addresses && data.addresses.length > 0
          ? data.addresses
          : [window.location.hostname];
        setAddresses(addrs);
        setSelectedAddress(data.primaryAddress || addrs[0] || window.location.hostname);
      })
      .catch((err) => {
        console.warn('Failed to get network info, using hostname fallback:', err);
        if (!mounted) return;
        const fallback = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        setAddresses([fallback]);
        setSelectedAddress(fallback);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const targetUrl = selectedAddress
    ? `http://${selectedAddress}:${port}`
    : `http://localhost:${port}`;

  useEffect(() => {
    if (!targetUrl || !isOpen) return;

    QRCode.toDataURL(targetUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [targetUrl, isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Open on Android as an App</h2>
              <p className="text-xs text-indigo-100">1-click home screen icon & live sync with desktop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Wi-Fi note */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
            <Wifi className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Make sure your phone is connected to the <strong>same Wi-Fi network</strong> as this computer.</span>
          </div>

          {/* QR Code and Target Link */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="w-44 h-44 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0">
              {loading ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Detecting IP...</span>
                </div>
              ) : qrCodeUrl ? (
                <img src={qrCodeUrl} alt="FlowDesk Mobile QR" className="w-full h-full object-contain rounded" />
              ) : (
                <span className="text-xs text-slate-400">Generating QR...</span>
              )}
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Mobile URL
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={targetUrl}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-800 select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1 transition-all ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {addresses.length > 1 && (
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    Select Network Adapter:
                  </label>
                  <select
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-slate-700"
                  >
                    {addresses.map((addr) => (
                      <option key={addr} value={addr}>
                        {addr} {addr.startsWith('10.') || addr.startsWith('192.168.') ? '(Local Wi-Fi)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Direct APK Download for WhatsApp & Android Installation */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                  <Download className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Standalone FlowDesk.apk</h4>
                  <p className="text-[11px] text-slate-500">Share via WhatsApp, Bluetooth, or download directly</p>
                </div>
              </div>
              <a
                href={api.getApkDownloadUrl()}
                download="FlowDesk.apk"
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download APK</span>
              </a>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-white/70 px-2.5 py-1.5 rounded-lg border border-emerald-100">
              <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Full standalone installer file is also saved at: <strong>H:\taskmanagerapp\FlowDesk.apk</strong></span>
            </div>
          </div>

          {/* 3-Step Setup Instructions */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              How to add to Android Home Screen (30 seconds):
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-600">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] shrink-0">
                  1
                </span>
                <span>Scan the QR code with your phone camera or open the URL in <strong>Google Chrome</strong>.</span>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] shrink-0">
                  2
                </span>
                <span>Tap the Chrome menu (<strong>⋮</strong> in top-right) and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] shrink-0">
                  3
                </span>
                <span>The <strong>FlowDesk</strong> icon will appear on your phone home screen! Tap it anytime to open in full app mode.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Live syncs with desktop database</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
