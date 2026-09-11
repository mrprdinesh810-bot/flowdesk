import crypto from 'node:crypto';
import { AiService } from './aiService.js';
import { Priority, CandidateStatus, ProductiveDayPlan } from '../domain/types.js';
import { ScheduleIntelligenceService } from './scheduleIntelligenceService.js';

export interface ParsedCandidateData {
  title: string;
  description?: string;
  estimated_duration: number; // minutes
  priority: Priority;
  expected_outcome?: string;
  category: string;
  tags: string[];
  is_fixed_commitment: boolean;
  scheduled_start?: string; // HH:MM
  scheduled_end?: string;   // HH:MM
  clarification_question?: string;
}

export class ParserService {
  /**
   * Deterministic Offline Quick Split per §68
   */
  static parseOfflineQuickSplit(rawText: string): ParsedCandidateData[] {
    const rawItems = rawText
      .split(/\n|;|,(?![^()]*\))|\bthen\b|\band then\b/gi)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (rawItems.length === 0) {
      return [];
    }

    const results: ParsedCandidateData[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      let title = item;
      let duration = 45;
      let isFixed = false;
      let startTime: string | undefined;
      let endTime: string | undefined;
      let priority: Priority = i === 0 ? 'P1' : (i <= 2 ? 'P2' : (i <= 4 ? 'P3' : 'P4'));
      let category = 'Work';

      // Pattern: "till 4" or "till 4pm" or "until 16:00"
      const tillMatch = item.match(/(.*?)\s+(?:till|until)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (tillMatch) {
        title = tillMatch[1].trim() || item;
        let hour = parseInt(tillMatch[2], 10);
        const mins = tillMatch[3] ? parseInt(tillMatch[3], 10) : 0;
        const ampm = tillMatch[4]?.toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        if (!ampm && hour <= 6) hour += 12; // heuristic for 4 -> 16:00
        endTime = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        isFixed = true;
      }

      // Pattern: "for 90 min" or "for 2 hours"
      const durMatch = item.match(/(?:for\s+)?(\d+)\s*(?:m|min|minutes|mins|h|hr|hours)\b/i);
      if (durMatch) {
        const val = parseInt(durMatch[1], 10);
        if (/h|hr|hours/i.test(durMatch[0])) {
          duration = val * 60;
        } else {
          duration = val;
        }
      }

      // Category detection heuristic
      const lower = item.toLowerCase();
      if (lower.includes('college') || lower.includes('study') || lower.includes('revise') || lower.includes('edc')) {
        category = 'Study';
      } else if (lower.includes('gym') || lower.includes('walk') || lower.includes('workout') || lower.includes('dinner')) {
        category = 'Health';
      } else if (lower.includes('trakt') || lower.includes('github') || lower.includes('code') || lower.includes('parser') || lower.includes('bug')) {
        category = 'Coding';
      }

      // Detect ambiguous vague items: e.g. "finish project", "fix bug", "call someone"
      let clarificationQuestion: string | undefined;
      if (title.length < 8 && (lower.includes('project') || lower.includes('task') || lower.includes('call') || lower.includes('fix'))) {
        clarificationQuestion = `What specific outcome do you need to achieve for "${title}" today?`;
      }

      results.push({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: `Extracted from: "${item}" (Offline quick split)`,
        estimated_duration: duration,
        priority,
        expected_outcome: `Complete ${title.toLowerCase()}`,
        category,
        tags: [category.toLowerCase()],
        is_fixed_commitment: isFixed,
        scheduled_start: startTime,
        scheduled_end: endTime,
        clarification_question: clarificationQuestion,
      });
    }

    return results;
  }

  /**
   * Helper to normalize time strings (e.g. '4pm', '16:00', '9:30 AM') to HH:MM format
   */
  static normalizeTime(timeStr?: string): string | undefined {
    if (!timeStr) return undefined;
    const clean = timeStr.trim().toLowerCase();
    const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (!match) return undefined;

    let hour = parseInt(match[1], 10);
    const min = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3];

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    if (!ampm && hour <= 6) hour += 12; // heuristic: 4 -> 16:00

    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }

  /**
   * Schedule Intelligence parsing with seamless offline-first fallback
   */
  static async parseBrainDump(rawText: string, options: {
    provider?: string;
    baseUrl?: string;
    model?: string;
    apiKey?: string;
    dayStart?: string;
    dayEnd?: string;
    date?: string;
    currentTime?: string;
  } = {}): Promise<{
    candidates: ParsedCandidateData[];
    intelligencePlan: ProductiveDayPlan;
    providerUsed: string;
    modelUsed: string;
    wasFallback: boolean;
    aiError?: string;
  }> {
    const provider = options.provider || 'offline_quick_split';

    if (provider === 'offline_quick_split') {
      const plan = ScheduleIntelligenceService.processOffline(rawText, {
        dayStart: options.dayStart,
        dayEnd: options.dayEnd,
        date: options.date,
        currentTime: options.currentTime,
      });
      const candidates = ScheduleIntelligenceService.planToCandidates(plan, '');
      return {
        candidates,
        intelligencePlan: plan,
        providerUsed: 'offline_quick_split',
        modelUsed: 'deterministic_intelligence',
        wasFallback: false,
      };
    }

    try {
      const response = await AiService.generateScheduleIntelligence(rawText, options);

      if (response.data && response.data.mainOutcome && Array.isArray(response.data.mustWinTasks)) {
        const d = response.data;
        const currentTime = d.currentTime || options.currentTime || new Date().toTimeString().slice(0, 5);
        const pendingPastTasks = Array.isArray(d.pendingPastTasks) ? d.pendingPastTasks : [];

        // Construct markdown report if not present
        const mdReport = d.markdownReport || ScheduleIntelligenceService.renderMarkdownReport({
          currentTime,
          pendingPastTasks,
          mainOutcome: d.mainOutcome,
          mustWinTasks: d.mustWinTasks || [],
          otherTasks: d.otherTasks || [],
          schedule: d.schedule || [],
          doNotWasteTimeOn: d.doNotWasteTimeOn || [],
          moveToAnotherDay: d.moveToAnotherDay || [],
          successCriteria: d.successCriteria || [],
        });

        const plan: ProductiveDayPlan = {
          currentTime,
          pendingPastTasks,
          mainOutcome: d.mainOutcome,
          mustWinTasks: d.mustWinTasks || [],
          otherTasks: d.otherTasks || [],
          schedule: d.schedule || [],
          doNotWasteTimeOn: d.doNotWasteTimeOn || [],
          moveToAnotherDay: d.moveToAnotherDay || [],
          successCriteria: d.successCriteria || [],
          feasibility: d.feasibility || {
            status: 'feasible',
            availableMinutes: 480,
            plannedMinutes: 360,
            bufferMinutes: 60,
            slackMinutes: 60,
            workloadPercent: 75,
            conflicts: [],
            warnings: [],
            recommendations: [],
          },
          markdownReport: mdReport,
        };

        const candidates = ScheduleIntelligenceService.planToCandidates(plan, '');
        return {
          candidates,
          intelligencePlan: plan,
          providerUsed: response.provider,
          modelUsed: response.model,
          wasFallback: false,
        };
      }
    } catch (err: any) {
      console.warn('AI schedule intelligence failed:', err.message);
    }

    // AI failed or returned invalid shape -> Fallback to deterministic ScheduleIntelligenceService
    const offlinePlan = ScheduleIntelligenceService.processOffline(rawText, {
      dayStart: options.dayStart,
      dayEnd: options.dayEnd,
      date: options.date,
      currentTime: options.currentTime,
    });
    const fallbackCandidates = ScheduleIntelligenceService.planToCandidates(offlinePlan, '');

    return {
      candidates: fallbackCandidates,
      intelligencePlan: offlinePlan,
      providerUsed: 'offline_quick_split',
      modelUsed: 'deterministic_intelligence_fallback',
      wasFallback: true,
      aiError: 'AI response was unavailable or malformed. Formatted realistic plan using Schedule Intelligence heuristics.',
    };
  }
}


