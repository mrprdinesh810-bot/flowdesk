import React, { useState } from 'react';
import { api } from '../api/client.js';
import {
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Database,
  ArrowRight,
} from 'lucide-react';

export const BackupScreen: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleExport = () => {
    window.location.href = '/api/v1/backup/export';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setRestoreResult(null);
      setRestoreError(null);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsRestoring(true);
    setRestoreResult(null);
    setRestoreError(null);

    try {
      const res = await api.importBackup(selectedFile);
      setRestoreResult(res);
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Restore failed:', err);
      setRestoreError(err.message || 'Restore failed. Ensure archive is a valid FlowDesk backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Local-First Portability</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Backup & Restore</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          FlowDesk data is 100% locally owned. Transfer your entire history between devices via secure ZIP packages (§22, §72).
        </p>
      </div>

      {/* Export Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h2 className="text-base font-bold text-slate-900">Export Portable ZIP Archive</h2>
            <p className="text-xs text-slate-500">
              Generates a self-contained ZIP archive containing <code className="font-mono text-indigo-700">database.sqlite</code>, <code className="font-mono text-indigo-700">manifest.json</code> with SHA-256 checksums, and metadata.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-200 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Backup ZIP
          </button>
        </div>
      </div>

      {/* Restore / Import Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <h2 className="text-base font-bold text-slate-900">Restore from Backup Archive</h2>
            <p className="text-xs text-slate-500">
              Upload a valid FlowDesk backup ZIP. FlowDesk checks for path traversal, verifies SHA-256 integrity, validates SQLite schemas, and swaps atomically (§73).
            </p>
          </div>
        </div>

        {restoreResult && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <div>
              <span>Backup restored successfully! </span>
              <span className="font-normal opacity-80">
                ({restoreResult.record_counts?.tasks || 0} tasks restored)
              </span>
            </div>
          </div>
        )}

        {restoreError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{restoreError}</span>
          </div>
        )}

        <form onSubmit={handleImport} className="space-y-4 pt-2">
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer relative bg-slate-50/50 transition-colors">
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-1.5">
              <FileArchive className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                {selectedFile ? selectedFile.name : 'Select or drop FlowDesk ZIP backup'}
              </p>
              <p className="text-xs text-slate-400">Maximum file size: 50MB</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!selectedFile || isRestoring}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isRestoring ? 'Validating & Restoring...' : 'Validate & Restore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
