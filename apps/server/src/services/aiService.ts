import { config } from '../config.js';

export interface AiTestResult {
  connected: boolean;
  status: 'connected' | 'unavailable' | 'invalid_url' | 'model_not_found' | 'timeout' | 'auth_error';
  message: string;
}

/**
 * Robust JSON extraction from LLM text responses
 * Handles reasoning models (<think> tags), code fences, and extraneous prose
 */
export function extractJson<T>(rawContent: string): T {
  if (!rawContent || !rawContent.trim()) {
    throw new Error('Received empty content from AI provider.');
  }

  // 1. Remove reasoning tags like <think>...</think>
  let cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Check for markdown code fence ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 3. Try direct parse
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 4. Find outermost balanced JSON object { ... } or array [ ... ]
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = cleaned.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = cleaned.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx > startIdx) {
      const candidate = cleaned.slice(startIdx, endIdx + 1);
      return JSON.parse(candidate) as T;
    }

    throw new Error(`Unable to extract valid JSON from model response. Response preview: "${rawContent.slice(0, 150)}..."`);
  }
}

export class AiService {
  /**
   * Test connection to Ollama per §66
   */
  static async testOllama(baseUrl: string, modelName: string): Promise<AiTestResult> {
    try {
      const url = new URL('/api/tags', baseUrl).toString();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        return {
          connected: false,
          status: 'unavailable',
          message: `Ollama returned HTTP status ${res.status}`,
        };
      }

      const data = await res.json() as { models?: Array<{ name: string }> };
      const models = data.models || [];
      const found = models.some(m => m.name.toLowerCase().includes(modelName.toLowerCase()));

      if (models.length > 0 && !found) {
        return {
          connected: true, // Server is up and reachable!
          status: 'model_not_found',
          message: `Ollama is running, but model "${modelName}" was not found. Detected installed models: ${models.map(m => m.name).join(', ')}`,
        };
      }

      return {
        connected: true,
        status: 'connected',
        message: `Connected successfully to Ollama (${modelName} ready).`,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { connected: false, status: 'timeout', message: 'Connection to Ollama timed out. Check if Ollama is running.' };
      }
      return {
        connected: false,
        status: 'unavailable',
        message: `Could not connect to Ollama at ${baseUrl}: ${err.message}. Ensure "ollama serve" is running.`,
      };
    }
  }

  /**
   * Test connection to OpenRouter per §67
   */
  static async testOpenRouter(apiKey?: string, modelName?: string): Promise<AiTestResult> {
    const key = apiKey || process.env.OPENROUTER_API_KEY || config.openrouterApiKey;
    if (!key) {
      return {
        connected: false,
        status: 'auth_error',
        message: 'OpenRouter API key is not configured. Please enter your API key in Settings.',
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${key}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 401 || res.status === 403) {
        return {
          connected: false,
          status: 'auth_error',
          message: 'Invalid OpenRouter API key. Please check your key at openrouter.ai/keys.',
        };
      }

      if (!res.ok) {
        return {
          connected: false,
          status: 'unavailable',
          message: `OpenRouter returned HTTP status ${res.status}`,
        };
      }

      // Check model validity with probe
      const testModel = modelName || 'minimax/minimax-m2.7:free';
      try {
        const probeController = new AbortController();
        const probeTimeout = setTimeout(() => probeController.abort(), 8000);
        const probeRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 2,
          }),
          signal: probeController.signal,
        });
        clearTimeout(probeTimeout);

        if (!probeRes.ok) {
          const errData = await probeRes.json().catch(() => null) as any;
          const msg = errData?.error?.message || `HTTP ${probeRes.status}`;
          return {
            connected: false,
            status: probeRes.status === 404 ? 'model_not_found' : 'unavailable',
            message: `Key is valid, but model "${testModel}" returned: ${msg}. Recommended: "nvidia/nemotron-3-super-120b-a12b:free" or "openrouter/free".`,
          };
        }
      } catch {
        // Probe timeout is non-fatal if auth passed
      }

      return {
        connected: true,
        status: 'connected',
        message: `Connected successfully to OpenRouter (${testModel}).`,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { connected: false, status: 'timeout', message: 'Connection to OpenRouter timed out.' };
      }
      return {
        connected: false,
        status: 'unavailable',
        message: `Could not connect to OpenRouter: ${err.message}`,
      };
    }
  }

  /**
   * Generate completion using configured provider or fallback
   */
  static async generateJson<T>(prompt: string, options: {
    provider?: string;
    baseUrl?: string;
    model?: string;
    apiKey?: string;
  } = {}): Promise<{ data: T | null; provider: string; model: string; error?: string }> {
    const provider = options.provider || 'offline_quick_split';

    if (provider === 'ollama') {
      const baseUrl = options.baseUrl || config.ollamaBaseUrl;
      let model = options.model;

      // Auto-detect installed model if none specified
      if (!model || model === 'llama3') {
        try {
          const tagsRes = await fetch(new URL('/api/tags', baseUrl).toString());
          if (tagsRes.ok) {
            const data = await tagsRes.json() as { models?: Array<{ name: string }> };
            if (data.models && data.models.length > 0) {
              const preferred = data.models.find(m => m.name.includes('mistral') || m.name.includes('ornith') || m.name.includes('qwen'));
              model = preferred ? preferred.name : data.models[0].name;
            }
          }
        } catch {
          // fallback
        }
      }
      model = model || 'mistral:latest';

      try {
        const url = new URL('/api/generate', baseUrl).toString();
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            format: 'json',
            stream: false,
            options: {
              num_predict: 450, // Keep bounded so CPU inference finishes quickly
              temperature: 0.1,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(`Ollama HTTP error ${res.status}`);
        }

        const json = await res.json() as { response: string };
        const parsed = extractJson<T>(json.response);
        return { data: parsed, provider: 'ollama', model };
      } catch (err: any) {
        return { data: null, provider: 'ollama', model, error: `Ollama error: ${err.message}` };
      }
    }

    if (provider === 'openrouter') {
      const key = options.apiKey || process.env.OPENROUTER_API_KEY || config.openrouterApiKey;
      if (!key) {
        return { data: null, provider: 'openrouter', model: options.model || 'none', error: 'OpenRouter API key missing. Enter it in Settings.' };
      }

      // Priority list of proven, responsive free models
      const requestedModel = options.model && options.model !== 'meta-llama/llama-3.2-3b-instruct:free'
        ? options.model
        : 'nvidia/nemotron-3-super-120b-a12b:free';

      const candidateModels = [
        requestedModel,
        'nvidia/nemotron-3-super-120b-a12b:free',
        'openrouter/free',
        'minimax/minimax-m2.7:free',
      ].filter((m, i, arr) => arr.indexOf(m) === i); // unique

      let lastError = 'OpenRouter request failed';

      for (const targetModel of candidateModels) {
        try {
          // First attempt with response_format
          let res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${key}`,
              'HTTP-Referer': 'https://flowdesk.local',
              'X-Title': 'FlowDesk',
            },
            body: JSON.stringify({
              model: targetModel,
              messages: [
                { role: 'system', content: 'You are FlowDesk AI assistant. Output strictly valid raw JSON only. No explanations, no markdown blocks.' },
                { role: 'user', content: prompt }
              ],
              response_format: { type: 'json_object' }
            }),
          });

          // If provider returns 400 due to unsupported response_format, retry without it
          if (res.status === 400) {
            const errData = await res.json().catch(() => null) as any;
            if (errData?.error?.message?.includes('response_format')) {
              res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${key}`,
                  'HTTP-Referer': 'https://flowdesk.local',
                  'X-Title': 'FlowDesk',
                },
                body: JSON.stringify({
                  model: targetModel,
                  messages: [
                    { role: 'system', content: 'You are FlowDesk AI assistant. Output strictly valid raw JSON only. No explanations, no markdown blocks.' },
                    { role: 'user', content: prompt }
                  ],
                }),
              });
            }
          }

          if (!res.ok) {
            const errData = await res.json().catch(() => null) as any;
            const errMsg = errData?.error?.message || `HTTP status ${res.status}`;
            lastError = `Model "${targetModel}": ${errMsg}`;
            console.warn(`OpenRouter model ${targetModel} returned ${res.status} (${errMsg}), trying fallback...`);
            continue; // Fallback to next candidate model!
          }

          const json = await res.json() as any;
          const choice = json.choices?.[0]?.message;
          const content = choice?.content || choice?.reasoning || json.choices?.[0]?.text || '';
          if (!content || !content.trim()) {
            lastError = `Model "${targetModel}" returned empty content.`;
            console.warn(`OpenRouter model ${targetModel} returned empty content, trying fallback...`);
            continue;
          }

          const parsed = extractJson<T>(content);
          return { data: parsed, provider: 'openrouter', model: targetModel };
        } catch (err: any) {
          lastError = err.message;
          console.warn(`OpenRouter model ${targetModel} parse/request failed: ${err.message}`);
        }
      }

      return { data: null, provider: 'openrouter', model: requestedModel, error: lastError };
    }

    // Default offline
    return { data: null, provider: 'offline_quick_split', model: 'none' };
  }

  /**
   * Generate Schedule Intelligence according to the FlowDesk Master Intelligence Layer Spec
   */
  static async generateScheduleIntelligence(rawText: string, options: {
    provider?: string;
    baseUrl?: string;
    model?: string;
    apiKey?: string;
    dayStart?: string;
    dayEnd?: string;
    date?: string;
    currentTime?: string;
  } = {}): Promise<{ data: any | null; provider: string; model: string; error?: string }> {
    const dayStart = options.dayStart || '09:00';
    const dayEnd = options.dayEnd || '22:00';
    const date = options.date || 'Today';
    const currentTime = options.currentTime || new Date().toTimeString().slice(0, 5);

    const prompt = `You are the FlowDesk Productive Daily Schedule Intelligence Engine.
You act as a practical planning coach, NOT a passive calendar formatter.

OBJECTIVE:
Transform messy, unstructured natural language user input into an optimized, realistic, outcome-based daily schedule.
The goal is NOT to maximize the number of tasks completed.
The goal is: MAXIMUM REAL-WORLD PROGRESS WITHIN THE USER'S ACTUAL AVAILABLE TIME.

Available Planning Window:
Date: ${date}
Current Real Time: ${currentTime}
Planning Day Hours: ${dayStart} to ${dayEnd}

CORE RULES:
1. REAL TIME AWARENESS & OVERDUE WORK:
   - The current real time is ${currentTime}.
   - If the user provides an event or fixed commitment whose scheduled time has already passed (ended before ${currentTime}), mark it with "isPast": true in the schedule.
   - If the user provides a task/work whose requested or mentioned time has already elapsed/finished, DO NOT drop it and DO NOT schedule it in the past! Flag it in "pendingPastTasks" as pending overdue work, and dynamically RESCHEDULE it forward into active upcoming slots starting from ${currentTime} onwards. Tag its schedule entry with "isPending": true and "originalTime": "<original past time>".
   - Never schedule active work tasks into time slots before ${currentTime}. Future work starts at max(${dayStart}, ${currentTime}).
2. TASK EXTRACTION: Convert messy language into clear actionable tasks. Combine duplicates (e.g. "css flex" + "flexbox" -> "Study CSS Flexbox"). Do NOT invent unmentioned major work.
3. TASK CLASSIFICATION:
   - 🔴 P1 (Critical - must be completed today; at most 1 or 2 items!)
   - 🟠 P2 (High Value - important work that meaningfully moves goals forward)
   - 🟡 P3 (Useful - helpful but not essential today)
   - 🟢 P4 (Low Value - optional, minor, easily postponed)
   Never invent fake deadlines or assume something is urgent just because it appears in the input.
4. FIXED COMMITMENTS: Treat explicit commitments (e.g., classes, tests, meetings) as hard constraints. Reserve their time first.
5. USABLE TIME & BUFFER: Subtract fixed commitments, meals, travel, breaks. Reserve 10-20% of usable time as buffer. DO NOT pack to 100%.
6. DEADLINE AWARENESS: When a task has a real deadline (e.g. "test at 3:10 PM"), preparation MUST happen BEFORE the deadline. Later tasks cannot replace preparation.
7. PRIORITY CONFLICTS: When tasks exceed time, drop lower-priority tasks (P1 -> P2 -> P3 -> P4). DO NOT compress tasks into tiny unrealistic blocks.
8. OUTCOME-BASED TASKS: Every scheduled task must have a concrete, testable expected output.
9. ENERGY MANAGEMENT: Place difficult/high-focus work during peak periods. Avoid excessive context switching.
10. LOW-VALUE TASK DETECTION: Identify repetitive, procrastination-like, low-impact busywork. Mark them "Consider skipping/postponing" with concise rationale.
11. MAIN OUTCOME: Choose ONE main outcome for the day and state why it matters.
12. DEFINITION OF A SUCCESSFUL DAY: Provide 3-5 concrete result checkboxes.

OUTPUT STRICTLY A VALID JSON OBJECT WITH THIS EXACT STRUCTURE:
{
  "currentTime": "${currentTime}",
  "pendingPastTasks": [
    {
      "task": "Study Math",
      "originalTime": "09:00 - 10:00",
      "reason": "Original slot passed before planning started at ${currentTime}",
      "actionTaken": "Rescheduled to upcoming available slot at 13:00"
    }
  ],
  "mainOutcome": {
    "outcome": "One most important practical result",
    "whyItMatters": "Short practical reason why this matters"
  },
  "mustWinTasks": [
    {
      "priority": "P1",
      "title": "EDC Test Preparation",
      "action": "Focused revision of core EDC circuits and formulas",
      "expectedResult": "Review formulas and solve 2 practice problems",
      "time": "90m",
      "estimatedDuration": 90
    }
  ],
  "otherTasks": [
    {
      "priority": "P3",
      "title": "Learn Python",
      "time": "45m",
      "recommendation": "Postpone to tomorrow evening to protect test focus",
      "estimatedDuration": 45
    }
  ],
  "schedule": [
    {
      "time": "11:15 - 12:40",
      "action": "EEM Class",
      "priority": "P2",
      "expectedOutput": "Engage in lecture and take key notes",
      "blockType": "FIXED_COMMITMENT",
      "isFixed": true,
      "durationMinutes": 85,
      "isPast": false,
      "isPending": false,
      "originalTime": null
    }
  ],
  "doNotWasteTimeOn": [
    {
      "task": "Clean files",
      "reason": "Low-impact busywork during peak focus hours"
    }
  ],
  "moveToAnotherDay": [
    {
      "task": "Maybe watch CSS video",
      "suggestedDayOrReason": "Move to weekend leisure wind-down"
    }
  ],
  "successCriteria": [
    "✅ Test preparation completed before 3:10 PM",
    "✅ 3:10 PM test attended with confidence",
    "✅ FlowDesk priority milestone implemented and tested"
  ]
}

User input:
"""
${rawText}
"""`;

    return this.generateJson<any>(prompt, options);
  }
}


