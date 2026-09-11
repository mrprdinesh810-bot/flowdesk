export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: any;
}

export class ApiError extends Error {
  code: string;
  details?: any;

  constructor(res: ApiErrorResponse) {
    super(res.message);
    this.code = res.code;
    this.details = res.details;
  }
}

export function getServerBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem('flowdesk_server_url');
  if (stored) return stored.replace(/\/+$/, '');
  return '';
}

export function setServerBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = url.trim().replace(/\/+$/, '');
  if (clean) {
    localStorage.setItem('flowdesk_server_url', clean);
  } else {
    localStorage.removeItem('flowdesk_server_url');
  }
}

export function resolveApiUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = getServerBaseUrl();
  if (base) {
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  if (typeof window !== 'undefined' && window.location?.origin && (window.location.origin.startsWith('http://') || window.location.origin.startsWith('https://'))) {
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const finalUrl = resolveApiUrl(url);
  const response = await fetch(finalUrl, { ...options, headers });

  if (!response.ok) {
    let rawText = '';
    let errData: any;
    try {
      rawText = await response.text();
      errData = JSON.parse(rawText);
    } catch {
      // Non-JSON response (e.g. proxy error, plain text message, HTML)
      const cleanMessage = rawText.replace(/<[^>]*>?/gm, '').trim();
      throw new ApiError({
        code: `HTTP_${response.status}`,
        message: cleanMessage ? `${cleanMessage.slice(0, 160)}` : `Request failed with status ${response.status}: ${response.statusText}`,
      });
    }

    if (errData && errData.error) {
      throw new ApiError(errData.error);
    }
    throw new ApiError({
      code: 'UNKNOWN_ERROR',
      message: errData?.message || 'An unknown error occurred.',
    });
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Brain Dumps & Candidates
  createBrainDump: (rawText: string, mode = 'ai', provider?: string, currentTime?: string) =>
    request<any>('/api/v1/brain-dumps', {
      method: 'POST',
      body: JSON.stringify({
        raw_text: rawText,
        mode,
        provider,
        current_time: currentTime || new Date().toTimeString().slice(0, 5),
      }),
    }),

  getBrainDump: (id: string) =>
    request<any>(`/api/v1/brain-dumps/${id}`),

  clarifyCandidate: (id: string, answer: string) =>
    request<any>(`/api/v1/brain-dumps/candidates/${id}/clarify`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    }),

  updateCandidate: (id: string, updates: any) =>
    request<any>(`/api/v1/brain-dumps/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteCandidate: (id: string) =>
    request<any>(`/api/v1/brain-dumps/candidates/${id}`, {
      method: 'DELETE',
    }),

  discardBrainDump: (id: string) =>
    request<any>(`/api/v1/brain-dumps/${id}`, {
      method: 'DELETE',
    }),

  recalculateSchedule: (candidates: any[], dayStart = '09:00', dayEnd = '22:00', bufferPercent = 15) =>
    request<any>('/api/v1/brain-dumps/schedule/recalculate', {
      method: 'POST',
      body: JSON.stringify({ candidates, day_start: dayStart, day_end: dayEnd, buffer_percent: bufferPercent }),
    }),

  // FIX Plan
  fixPlan: (brainDumpId: string, candidates: any[], scheduledDate?: string) =>
    request<any>('/api/v1/fix', {
      method: 'POST',
      body: JSON.stringify({ brain_dump_id: brainDumpId, candidates, scheduled_date: scheduledDate }),
    }),

  // Schedule Intelligence & Adaptive Replanning per §15, §16
  generateIntelligencePlan: (input: {
    raw_text: string;
    day_start?: string;
    day_end?: string;
    date?: string;
    mode?: string;
    provider?: string;
    current_time?: string;
  }) =>
    request<any>('/api/v1/brain-dumps/intelligence-plan', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        current_time: input.current_time || new Date().toTimeString().slice(0, 5),
      }),
    }),

  replanSchedule: (input: {
    brain_dump_id?: string;
    interruption_note?: string;
    remaining_minutes?: number;
    completed_task_ids?: string[];
    new_raw_text?: string;
    current_time?: string;
  }) =>
    request<any>('/api/v1/brain-dumps/replan', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        current_time: input.current_time || new Date().toTimeString().slice(0, 5),
      }),
    }),


  // Tasks & Checklists
  getTasks: (date?: string, status?: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (status) params.set('status', status);
    const q = params.toString();
    return request<any[]>(`/api/v1/tasks${q ? `?${q}` : ''}`);
  },

  getTask: (id: string) =>
    request<any>(`/api/v1/tasks/${id}`),

  updateTask: (id: string, updates: any) =>
    request<any>(`/api/v1/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteTask: (id: string) =>
    request<any>(`/api/v1/tasks/${id}`, {
      method: 'DELETE',
    }),

  updateTaskStatus: (id: string, status: string) =>
    request<any>(`/api/v1/tasks/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  postponeTask: (id: string, targetDate: string) =>
    request<any>(`/api/v1/tasks/${id}/postpone`, {
      method: 'POST',
      body: JSON.stringify({ target_date: targetDate }),
    }),

  toggleChecklist: (id: string, isCompleted: boolean) =>
    request<any>(`/api/v1/tasks/checklists/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ is_completed: isCompleted }),
    }),

  addChecklist: (taskId: string, title: string) =>
    request<any>(`/api/v1/tasks/${taskId}/checklists`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  // Timers
  getActiveTimer: () =>
    request<any>('/api/v1/timers/active'),

  startTimer: (taskId: string) =>
    request<any>('/api/v1/timers/start', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId }),
    }),

  pauseTimer: (sessionId: string) =>
    request<any>('/api/v1/timers/pause', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),

  resumeTimer: (sessionId: string) =>
    request<any>('/api/v1/timers/resume', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),

  completeTimer: (sessionId: string, markTaskCompleted = true) =>
    request<any>('/api/v1/timers/complete', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, mark_task_completed: markTaskCompleted }),
    }),

  switchTimer: (currentSessionId: string, newTaskId: string, action: 'pause' | 'complete' | 'abandon' = 'pause') =>
    request<any>('/api/v1/timers/switch', {
      method: 'POST',
      body: JSON.stringify({ current_session_id: currentSessionId, new_task_id: newTaskId, action }),
    }),

  // Daily Review & Analytics
  getDailyReview: (date: string) =>
    request<any>(`/api/v1/reviews/${date}`),

  saveDailyReview: (date: string, data: any) =>
    request<any>(`/api/v1/reviews/${date}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAnalytics: () =>
    request<any>('/api/v1/analytics'),

  getPatterns: () =>
    request<any[]>('/api/v1/analytics/patterns'),

  getRecommendations: () =>
    request<any[]>('/api/v1/analytics/recommendations'),

  acceptRecommendation: (id: string) =>
    request<any>(`/api/v1/analytics/recommendations/${id}/accept`, { method: 'POST' }),

  dismissRecommendation: (id: string) =>
    request<any>(`/api/v1/analytics/recommendations/${id}/dismiss`, { method: 'POST' }),

  // Settings
  getSettings: () =>
    request<any>('/api/v1/settings'),

  saveSettings: (settings: any) =>
    request<any>('/api/v1/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  testAi: (data: { provider: string; base_url?: string; model: string; api_key?: string }) =>
    request<any>('/api/v1/settings/ai/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOllamaModels: () =>
    request<{ models: string[] }>('/api/v1/settings/ai/models/ollama'),

  // Backup
  importBackup: async (file: File) => {
    const formData = new FormData();
    formData.append('backup_file', file);
    return request<any>('/api/v1/backup/import', {
      method: 'POST',
      body: formData,
    });
  },

  // Network info for mobile pairing
  getNetworkInfo: () =>
    request<{ port: number; apiPort: number; addresses: string[]; primaryAddress: string }>('/api/v1/network-info'),

  // App Update & Mobile APK
  checkAppUpdate: (currentVersion = '1.0.0') =>
    request<{
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
    }>(`/api/v1/app-update/check?version=${encodeURIComponent(currentVersion)}`),

  getApkDownloadUrl: () => resolveApiUrl('/api/v1/app-update/download'),
};
