import crypto from 'node:crypto';
import {
  Priority,
  BlockType,
  FeasibilityReport,
  FeasibilityStatus,
  ProductiveDayPlan,
  MainOutcomeDefinition,
  MustWinTaskItem,
  OtherTaskItem,
  PlanningScheduleEntry,
  WasteTaskItem,
  PostponedTaskItem,
  PendingPastTaskItem,
  PlanningInputContext,
  ReplanInput,
} from '../domain/types.js';
import { ParsedCandidateData } from './parserService.js';
import { AiService } from './aiService.js';

export interface RawExtractedItem {
  raw: string;
  normalizedTitle: string;
  action: string;
  expectedOutput: string;
  estimatedDuration: number; // minutes
  priority: Priority;
  isFixedCommitment: boolean;
  scheduledStart?: string; // HH:MM
  scheduledEnd?: string;   // HH:MM
  deadlineTime?: string;   // HH:MM (e.g. 15:10 for test at 3:10)
  isDeadlineTrigger?: boolean; // e.g. "test 3:10" itself
  isPrepHigherPriority?: boolean; // e.g. "study for test"
  isLowValueCandidate?: boolean;
  lowValueReason?: string;
  postponeReason?: string;
  category: string;
  isPast?: boolean;
  isPending?: boolean;
  originalPastTime?: string;
}


export class ScheduleIntelligenceService {
  /**
   * Helper: Parse "HH:MM" or "H.MM" or "H:MMam/pm" to minutes from midnight
   */
  static timeToMinutes(timeStr: string): number {
    const clean = timeStr.trim().toLowerCase().replace('.', ':');
    const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (!match) return 0;

    let hour = parseInt(match[1], 10);
    const min = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3];

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    if (!ampm && hour <= 6) hour += 12; // heuristic: e.g. 3:10 or 4 -> 15:10 or 16:00

    return (hour % 24) * 60 + min;
  }

  /**
   * Helper: Convert minutes from midnight to "HH:MM"
   */
  static minutesToTime(totalMinutes: number): string {
    const normalized = Math.max(0, Math.round(totalMinutes)) % (24 * 60);
    const h = Math.floor(normalized / 60);
    const m = Math.floor(normalized % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Helper: Format minutes into human readable 12-hour or HH:MM time
   */
  static formatDisplayTime(totalMinutes: number): string {
    const normalized = Math.max(0, Math.round(totalMinutes)) % (24 * 60);
    let h = Math.floor(normalized / 60);
    const m = Math.floor(normalized % 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    const mStr = String(m).padStart(2, '0');
    return `${displayH}:${mStr} ${ampm}`;
  }

  /**
   * STAGE 1 & 2: Natural Language Task Extraction & Duplicate/Noise Cleaning
   */
  static extractAndNormalize(rawText: string): RawExtractedItem[] {
    // Split by newlines, semicolons, bullet points, commas, and transitional conjunctions
    const lines = rawText
      .split(/\n|;|\*|\b(?:and then|then)\b|,(?![^()]*\))/gi)
      .map(s => s.trim().replace(/^[-•*]\s*/, ''))
      .filter(s => s.length > 0);

    const items: RawExtractedItem[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Filter out pure filler thoughts that have no actionable core
      if (/^(thoughts?|rough|maybe|just thinking|idk|note to self):?$/i.test(line.trim())) {
        continue;
      }

      let title = line;
      let action = line;
      let expectedOutput = `Complete ${line}`;
      let duration = 45;
      let priority: Priority = 'P3';
      let isFixed = false;
      let startStr: string | undefined;
      let endStr: string | undefined;
      let deadlineTime: string | undefined;
      let isDeadlineTrigger = false;
      let isPrepHigherPriority = false;
      let isLowValue = false;
      let lowValueReason: string | undefined;
      let postponeReason: string | undefined;
      let category = 'Work';

      // 1. Check for time range: e.g. "11.15 to 12.40", "11:15 AM–12:40 PM", "9 to 4", "1:35 PM-3:00 PM"
      const rangeMatch = line.match(/(?:from\s+)?(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?)\s*(?:to|[-–—]|till|until)\s*(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?)/i);
      if (rangeMatch) {
        const sMins = this.timeToMinutes(rangeMatch[1]);
        const eMins = this.timeToMinutes(rangeMatch[2]);
        startStr = this.minutesToTime(sMins);
        endStr = this.minutesToTime(eMins);
        duration = Math.max(15, eMins - sMins);
        isFixed = true;
        title = line.replace(rangeMatch[0], '').replace(/\b(?:session|at|from)\b/gi, '').trim();
        if (!title) title = line.trim();
      }

      // 2. Check for explicit deadline / fixed event: "test 3.10", "test at 3:10", "meeting at 2pm"
      const testMatch = line.match(/(?:test|exam|quiz|submission|meeting|call)\s+(?:at\s+)?(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?)/i)
        || line.match(/(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?)\s+(?:test|exam|quiz)/i);
      if (testMatch) {
        const tMins = this.timeToMinutes(testMatch[1]);
        deadlineTime = this.minutesToTime(tMins);
        startStr = this.minutesToTime(tMins);
        endStr = this.minutesToTime(tMins + 45); // default test duration 45 mins
        duration = 45;
        isFixed = true;
        isDeadlineTrigger = true;
        priority = 'P1';
        title = line.trim();
      }

      // 3. Check for "till 4" or "until 4pm" (e.g. "college till 4")
      const tillMatch = line.match(/(.*?)\s+(?:till|until)\s+(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?)/i);
      if (tillMatch && !rangeMatch && !testMatch) {
        const eMins = this.timeToMinutes(tillMatch[2]);
        endStr = this.minutesToTime(eMins);
        isFixed = true;
        title = tillMatch[1].trim() || line;
        duration = 180; // default multi-hour block if start unknown
      }

      // 4. Check for explicit duration: "1 hour", "for 90 min", "2 hours", "30 mins"
      const durMatch = line.match(/(\d+)\s*(?:m|min|minutes|mins|h|hr|hours)\b/i);
      if (durMatch && !isFixed) {
        const val = parseInt(durMatch[1], 10);
        duration = /h|hr|hours/i.test(durMatch[0]) ? val * 60 : val;
        title = line.replace(durMatch[0], '').replace(/\b(?:for|study|work on)\b/gi, '').trim() || title;
      }

      // 5. Category and semantic classification
      if (/test|exam|quiz/i.test(lower)) {
        category = 'Academic';
        priority = 'P1';
        action = `Attend and execute ${title}`;
        expectedOutput = `Complete test questions accurately and submit on time.`;
      } else if (/study|edc|eem|revision|lecture|class|college|assignment/i.test(lower)) {
        category = 'Study';
        if (/prep|preparation|study for test|revision for test/i.test(lower)) {
          priority = 'P1';
          isPrepHigherPriority = true;
          action = `Intensive focus preparation for test`;
          expectedOutput = `Review key formulas, concepts, and solve target practice problems.`;
        } else if (/edc/i.test(lower)) {
          priority = 'P2';
          action = `Study EDC topics systematically`;
          expectedOutput = `Complete EDC revision of the required topics and test recall.`;
        } else if (/assignment/i.test(lower)) {
          priority = 'P2';
          action = `Work through assignment questions`;
          expectedOutput = `Complete the required assignment sections and prepare for submission.`;
        } else if (/eem|class|college/i.test(lower)) {
          priority = 'P2';
          action = `Attend and actively engage in session`;
          expectedOutput = `Absorb key lecture takeaways and note action items.`;
        }
      } else if (/flowdesk|code|coding|dev|project|bug|feature|pr\b/i.test(lower)) {
        category = 'Coding';
        priority = 'P2';
        action = `Deep work on project deliverables`;
        expectedOutput = `Implement and verify target functional milestone.`;
        if (/flowdesk/i.test(lower)) {
          expectedOutput = `Implement and verify the schedule-priority logic.`;
        }
      } else if (/messages?|email|inbox|reply|slack|chat|whatsapp/i.test(lower)) {
        category = 'Admin';
        priority = 'P3';
        duration = Math.min(duration, 20);
        action = `Process pending high-priority messages`;
        expectedOutput = `Clear critical replies in a single bounded batch.`;
        isLowValue = true;
        lowValueReason = 'Scattered messaging causes high context-switching and procrastination risk.';
      } else if (/clean|organize files|tidy|desktop|clean files/i.test(lower)) {
        category = 'Chore';
        priority = 'P4';
        action = `Tidy and organize workspace`;
        expectedOutput = `Organize workspace files.`;
        isLowValue = true;
        lowValueReason = 'Low cognitive impact; easily becomes productive procrastination during peak work hours.';
        postponeReason = 'Postpone to end-of-week or downtime buffer.';
      } else if (/video|watch|youtube|css video|browse|social media|maybe/i.test(lower)) {
        category = 'Leisure';
        priority = 'P4';
        action = `Optional learning or casual browsing`;
        expectedOutput = `Casual review.`;
        isLowValue = true;
        lowValueReason = 'Passive consumption without an immediate application today.';
        postponeReason = 'Move to weekend or casual evening wind-down.';
      } else if (/python|learn python/i.test(lower)) {
        category = 'Learning';
        priority = 'P3';
        action = `Python practice session`;
        expectedOutput = `Write code and complete 1 practical exercise.`;
      }

      // Title capitalization
      let cleanTitle = title.replace(/[.,:;]+$/, '').trim();
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

      items.push({
        raw: line,
        normalizedTitle: cleanTitle,
        action,
        expectedOutput,
        estimatedDuration: duration,
        priority,
        isFixedCommitment: isFixed,
        scheduledStart: startStr,
        scheduledEnd: endStr,
        deadlineTime,
        isDeadlineTrigger,
        isPrepHigherPriority,
        isLowValueCandidate: isLowValue,
        lowValueReason,
        postponeReason,
        category,
      });
    }

    // Merge duplicate or equivalent tasks (e.g. "css flex" + "flexbox" + "css video")
    const merged: RawExtractedItem[] = [];
    const seenEquivalents = new Set<string>();

    for (const it of items) {
      const lower = it.normalizedTitle.toLowerCase();
      let key = lower;

      if (/video|watch|youtube|browse/i.test(it.raw.toLowerCase())) {
        key = 'casual_video';
      } else if (/css|flexbox|flex/i.test(lower)) {
        key = 'css_flexbox';

        it.normalizedTitle = 'Study CSS Flexbox';
        it.action = 'Review CSS flexbox layout concepts and test implementation';
        it.expectedOutput = 'Build or verify responsive flexbox structure.';
      } else if (/flowdesk/i.test(lower)) {
        key = 'flowdesk_dev';
        it.normalizedTitle = 'FlowDesk Development';
      } else if (/edc/i.test(lower)) {
        key = 'edc_study';
        it.normalizedTitle = 'EDC Study';
      } else if (/eem/i.test(lower)) {
        key = 'eem_class';
        it.normalizedTitle = 'EEM Class';
      }


      if (seenEquivalents.has(key)) {
        // Find existing and merge durations/outputs
        const existing = merged.find(m => m.normalizedTitle.toLowerCase().includes(key) || key.includes(m.normalizedTitle.toLowerCase()));
        if (existing) {
          existing.estimatedDuration = Math.max(existing.estimatedDuration, it.estimatedDuration);
          if (it.isFixedCommitment) existing.isFixedCommitment = true;
          if (it.scheduledStart) existing.scheduledStart = it.scheduledStart;
          if (it.scheduledEnd) existing.scheduledEnd = it.scheduledEnd;
        }
      } else {
        seenEquivalents.add(key);
        merged.push(it);
      }
    }

    return merged;
  }

  /**
   * STAGES 3 through 12: Full Deterministic Schedule Intelligence Pipeline
   */
  static processOffline(rawText: string, context: PlanningInputContext = {}): ProductiveDayPlan {
    const dayStartStr = context.dayStart || '09:00';
    const dayEndStr = context.dayEnd || '22:00';
    const currentTime = context.currentTime || dayStartStr;

    const dayStartMins = this.timeToMinutes(dayStartStr);
    const dayEndMins = this.timeToMinutes(dayEndStr);
    const currentMinutes = this.timeToMinutes(currentTime);
    const effectiveDayStart = Math.max(dayStartMins, currentMinutes);

    // 1. Extract and normalize
    const extracted = this.extractAndNormalize(rawText);

    // Merge any explicit context fixed commitments
    if (context.fixedCommitments && context.fixedCommitments.length > 0) {
      for (const fc of context.fixedCommitments) {
        const sMins = this.timeToMinutes(fc.start);
        const eMins = this.timeToMinutes(fc.end);
        extracted.push({
          raw: `${fc.title} ${fc.start}-${fc.end}`,
          normalizedTitle: fc.title,
          action: `Attend ${fc.title}`,
          expectedOutput: `Participate in ${fc.title}`,
          estimatedDuration: Math.max(15, eMins - sMins),
          priority: 'P2',
          isFixedCommitment: true,
          scheduledStart: fc.start,
          scheduledEnd: fc.end,
          category: 'Commitment',
        });
      }
    }

    // 2. Identify explicit hard deadlines (e.g. "test 3.10" -> 15:10)
    let earliestDeadlineMins: number | null = null;
    let deadlineItem: RawExtractedItem | null = null;

    for (const it of extracted) {
      if (it.deadlineTime) {
        const dMins = this.timeToMinutes(it.deadlineTime);
        if (earliestDeadlineMins === null || dMins < earliestDeadlineMins) {
          earliestDeadlineMins = dMins;
          deadlineItem = it;
        }
      }
    }

    // Elevate preparation specifically for the deadline to 🔴 P1
    if (earliestDeadlineMins !== null) {
      for (const it of extracted) {
        const rawLower = it.raw.toLowerCase();
        const normLower = it.normalizedTitle.toLowerCase();
        const isPrepForDeadline = /study for test|prep for test|revision for test|test prep|exam prep/i.test(rawLower)
          || (/study|prep|revision/i.test(normLower) && (rawLower.includes('test') || normLower.includes('test')));

        if (isPrepForDeadline && !it.isDeadlineTrigger) {
          it.priority = 'P1';
          it.isPrepHigherPriority = true;
          it.action = `Focused test preparation before ${this.formatDisplayTime(earliestDeadlineMins)}`;
          it.expectedOutput = `Complete key revision topics and recall drills for the upcoming test.`;
        }
      }
    }

    // 2.1 Check for finished/past times relative to real time -> detect PENDING OVERDUE work!
    const pendingPastTasks: PendingPastTaskItem[] = [];

    for (const it of extracted) {
      if (it.scheduledEnd || it.scheduledStart) {
        const sM = it.scheduledStart ? this.timeToMinutes(it.scheduledStart) : 0;
        const eM = it.scheduledEnd ? this.timeToMinutes(it.scheduledEnd) : (sM + it.estimatedDuration);

        // If the task's time has already elapsed in real time
        if (eM <= currentMinutes) {
          it.isPast = true;
          // Check if this was a hard external event (class, meeting, exam) vs user work/study task
          const isHardExternalEvent = it.isFixedCommitment && /class|lecture|college|school|university|eem|meeting|sync|interview|appointment|flight|doctor|dentist/i.test(it.normalizedTitle);

          if (isHardExternalEvent) {
            it.action = `${it.normalizedTitle} (Past)`;
          } else {
            // Flexible/work task or study task whose allotted time has elapsed -> mark as PENDING OVERDUE WORK!
            it.isPending = true;
            it.isFixedCommitment = false; // Release fixed constraint so it gets rescheduled forward!
            const pastSlot = it.scheduledStart && it.scheduledEnd
              ? `${it.scheduledStart} - ${it.scheduledEnd}`
              : (it.scheduledStart || `${this.minutesToTime(sM)} - ${this.minutesToTime(eM)}`);
            it.originalPastTime = pastSlot;
            pendingPastTasks.push({
              task: it.normalizedTitle,
              originalTime: pastSlot,
              reason: `Scheduled time (${pastSlot}) elapsed before current time (${this.formatDisplayTime(currentMinutes)}). Rescheduled to active upcoming window.`,
              actionTaken: `Rescheduled forward to upcoming window starting from ${this.formatDisplayTime(Math.max(dayStartMins, currentMinutes))}.`,
            });
            // Clear past fixed constraint so it gets rescheduled into upcoming active time
            it.scheduledStart = undefined;
            it.scheduledEnd = undefined;
          }
        }
      }
    }

    // 3. Separate Fixed Commitments vs Flexible Work
    const fixedBlocks: PlanningScheduleEntry[] = [];
    let futureFixedConsumedMinutes = 0;

    for (const it of extracted) {
      if (it.isFixedCommitment && it.scheduledStart && it.scheduledEnd) {
        const sMins = this.timeToMinutes(it.scheduledStart);
        const eMins = this.timeToMinutes(it.scheduledEnd);
        const dur = Math.max(15, eMins - sMins);
        const isPastBlock = eMins <= currentMinutes;

        fixedBlocks.push({
          time: `${it.scheduledStart} - ${it.scheduledEnd}`,
          action: it.normalizedTitle,
          priority: it.priority,
          expectedOutput: it.expectedOutput,
          blockType: 'FIXED_COMMITMENT',
          isFixed: true,
          durationMinutes: dur,
          isPast: isPastBlock,
        });

        // Only count future overlap against future usable planning time
        const overlapStart = Math.max(effectiveDayStart, sMins);
        const overlapEnd = Math.min(dayEndMins, eMins);
        if (overlapEnd > overlapStart) {
          futureFixedConsumedMinutes += (overlapEnd - overlapStart);
        }
      }
    }

    // Sort fixed commitments chronologically
    fixedBlocks.sort((a, b) => this.timeToMinutes(a.time.split(' - ')[0]) - this.timeToMinutes(b.time.split(' - ')[0]));

    // 4. Calculate Usable Time from NOW onwards with 15% Buffer Protection per §4
    const futureDaySpan = Math.max(0, dayEndMins - effectiveDayStart);
    const availableNetMinutes = Math.max(0, futureDaySpan - futureFixedConsumedMinutes);
    const targetBufferMinutes = Math.round(availableNetMinutes * 0.15);
    const usableWorkMinutes = Math.max(0, availableNetMinutes - targetBufferMinutes);


    // 5. Select & Sift Tasks (Strict Priority: P1 -> P2 -> P3 -> P4)
    const flexibleItems = extracted.filter(it => !it.isFixedCommitment);

    // Priority comparator: P1 first, then prep tasks, then P2, P3, P4
    const priorityScore = (it: RawExtractedItem) => {
      let score = it.priority === 'P1' ? 100 : it.priority === 'P2' ? 75 : it.priority === 'P3' ? 50 : 25;
      if (it.isPrepHigherPriority) score += 20;
      if (it.isLowValueCandidate) score -= 30;
      return score;
    };

    flexibleItems.sort((a, b) => priorityScore(b) - priorityScore(a));

    const scheduledWork: RawExtractedItem[] = [];
    const doNotWaste: WasteTaskItem[] = [];
    const moveToAnotherDay: PostponedTaskItem[] = [];

    let allocatedMinutes = 0;

    for (const it of flexibleItems) {
      // Check if task is identified low value or procrastination
      if (it.isLowValueCandidate && it.priority === 'P4') {
        doNotWaste.push({
          task: it.normalizedTitle,
          reason: it.lowValueReason || 'Low direct leverage; better postponed during core work windows.',
        });
        moveToAnotherDay.push({
          task: it.normalizedTitle,
          suggestedDayOrReason: it.postponeReason || 'Move to weekend or casual evening review.',
        });
        continue;
      }

      // Check capacity
      if (allocatedMinutes + it.estimatedDuration <= usableWorkMinutes) {
        scheduledWork.push(it);
        allocatedMinutes += it.estimatedDuration;
      } else {
        // Can't fit without violating realistic buffer
        if (it.priority === 'P3' || it.priority === 'P4') {
          doNotWaste.push({
            task: it.normalizedTitle,
            reason: `Exceeds realistic usable capacity (${(usableWorkMinutes / 60).toFixed(1)}h available after fixed commitments and 15% buffer).`,
          });
          moveToAnotherDay.push({
            task: it.normalizedTitle,
            suggestedDayOrReason: 'Move to tomorrow or subsequent focus slot to protect today’s main outcome.',
          });
        } else {
          // It's P2 but tight - allocate what remains if reasonable, or flag postponement
          const remainingMins = usableWorkMinutes - allocatedMinutes;
          if (remainingMins >= 30) {
            it.estimatedDuration = remainingMins;
            scheduledWork.push(it);
            allocatedMinutes += remainingMins;
          } else {
            moveToAnotherDay.push({
              task: it.normalizedTitle,
              suggestedDayOrReason: 'Postpone to tomorrow morning to ensure full focus rather than a rushed attempt.',
            });
          }
        }
      }
    }

    // 6. Chronological Schedule Assembly with Deadline Protection & Buffers
    const fullSchedule: PlanningScheduleEntry[] = [];
    let timeCursor = effectiveDayStart;

    // Separate prep tasks that MUST happen before deadline
    const prepTasks = scheduledWork.filter(it => it.isPrepHigherPriority);
    const regularWork = scheduledWork.filter(it => !it.isPrepHigherPriority);

    // Combine all fixed intervals for gap filling
    const busyIntervals = fixedBlocks.map(fb => {
      const [s, e] = fb.time.split(' - ');
      return { start: this.timeToMinutes(s), end: this.timeToMinutes(e), entry: fb };
    });

    // Helper: place a task in next available gap before targetMaxTime
    const placeTaskInSchedule = (item: RawExtractedItem, maxEndTime?: number): boolean => {
      let candidateStart = timeCursor;

      while (candidateStart + item.estimatedDuration <= (maxEndTime || dayEndMins + 120)) {
        const candidateEnd = candidateStart + item.estimatedDuration;

        // Check clash with fixed intervals
        const clash = busyIntervals.find(bi => Math.max(candidateStart, bi.start) < Math.min(candidateEnd, bi.end));

        if (clash) {
          candidateStart = clash.end + 10; // 10 min break transition
        } else {
          // If a max end time is specified (e.g. deadline), verify it fits strictly before it!
          if (maxEndTime && candidateEnd > maxEndTime) {
            return false;
          }

          fullSchedule.push({
            time: `${this.minutesToTime(candidateStart)} - ${this.minutesToTime(candidateEnd)}`,
            action: item.action,
            priority: item.priority,
            expectedOutput: item.expectedOutput,
            blockType: item.priority === 'P1' ? 'FOCUS_WORK' : 'LIGHT_WORK',
            isFixed: false,
            durationMinutes: item.estimatedDuration,
            isPending: Boolean(item.isPending),
            originalTime: item.originalPastTime,
          });

          timeCursor = candidateEnd + 10; // 10 min break
          return true;
        }
      }
      return false;
    };


    // First: Schedule Prep Tasks strictly BEFORE the earliest deadline
    if (earliestDeadlineMins !== null && prepTasks.length > 0) {
      for (const prep of prepTasks) {
        const placed = placeTaskInSchedule(prep, earliestDeadlineMins);
        if (!placed) {
          // If couldn't fit with full duration, fit into available window before deadline
          const availableGap = Math.max(25, earliestDeadlineMins - timeCursor - 10);
          prep.estimatedDuration = Math.min(prep.estimatedDuration, availableGap);
          placeTaskInSchedule(prep, earliestDeadlineMins);
        }
      }
    }

    // Insert fixed blocks
    for (const fb of fixedBlocks) {
      fullSchedule.push(fb);
    }

    // Schedule remaining regular work in chronological order
    for (const rw of regularWork) {
      // Advance cursor past earlier fixed blocks if needed
      placeTaskInSchedule(rw);
    }

    // Add meals / recovery if span is long (e.g. dinner break around 19:30 - 20:15)
    if (dayEndMins - dayStartMins >= 480) {
      const dinnerTime = this.timeToMinutes('19:30');
      if (dinnerTime >= dayStartMins && dinnerTime + 45 <= dayEndMins) {
        // Add meal if no clash
        const clash = fullSchedule.find(s => {
          const [st, et] = s.time.split(' - ');
          return Math.max(dinnerTime, this.timeToMinutes(st)) < Math.min(dinnerTime + 45, this.timeToMinutes(et));
        });
        if (!clash) {
          fullSchedule.push({
            time: `${this.minutesToTime(dinnerTime)} - ${this.minutesToTime(dinnerTime + 45)}`,
            action: 'Dinner & Recovery Break',
            priority: 'BREAK',
            expectedOutput: 'Nutritional meal and mental detachment.',
            blockType: 'BREAK',
            isFixed: false,
            durationMinutes: 45,
          });
        }
      }
    }

    // Sort full schedule chronologically
    fullSchedule.sort((a, b) => this.timeToMinutes(a.time.split(' - ')[0]) - this.timeToMinutes(b.time.split(' - ')[0]));

    // Tag each block with real-time status (past, current, upcoming)
    for (const entry of fullSchedule) {
      const [sStr, eStr] = entry.time.split(' - ');
      if (sStr && eStr) {
        const sM = this.timeToMinutes(sStr);
        const eM = this.timeToMinutes(eStr);
        if (eM <= currentMinutes) {
          entry.isPast = true;
        } else if (sM <= currentMinutes && eM > currentMinutes) {
          entry.isCurrent = true;
        }
      }
    }

    // 7. Compose Must Win and Other Tasks tables
    const mustWinTasks: MustWinTaskItem[] = [];
    const otherTasks: OtherTaskItem[] = [];

    for (const it of extracted) {
      if (it.priority === 'P1' || it.priority === 'P2') {
        mustWinTasks.push({
          priority: it.priority,
          title: it.normalizedTitle,
          action: it.action,
          expectedResult: it.expectedOutput,
          time: `${it.estimatedDuration}m`,
          estimatedDuration: it.estimatedDuration,
        });
      } else {
        const isScheduled = scheduledWork.some(sw => sw.normalizedTitle === it.normalizedTitle);
        otherTasks.push({
          priority: it.priority,
          title: it.normalizedTitle,
          time: `${it.estimatedDuration}m`,
          recommendation: isScheduled
            ? 'Scheduled in flexible afternoon/evening window.'
            : (it.postponeReason || 'Defer to protect high-leverage focus work.'),
          estimatedDuration: it.estimatedDuration,
        });
      }
    }

    // 8. Main Outcome Formulation per §12
    let mainOutcomeTitle = 'Complete critical focus milestones and maintain schedule integrity.';
    let whyItMatters = 'Protects high-stakes commitments while ensuring tangible real-world progress.';

    if (earliestDeadlineMins !== null && deadlineItem) {
      const cleanDeadlineTitle = deadlineItem.normalizedTitle.replace(/^\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?\s*/i, '').trim() || 'test';
      mainOutcomeTitle = `Prepare thoroughly for the ${this.formatDisplayTime(earliestDeadlineMins)} ${cleanDeadlineTitle} and complete the primary post-test priority.`;
      whyItMatters = `High consequence of unpreparedness; succeeding here removes immediate academic pressure and frees mental energy for evening work.`;
    } else if (mustWinTasks.length > 0) {
      mainOutcomeTitle = `Complete ${mustWinTasks[0].title} with verifiable outcome (${mustWinTasks[0].expectedResult}).`;
      whyItMatters = `Delivers the single highest-impact contribution toward your active goal today.`;
    }

    const mainOutcome: MainOutcomeDefinition = {
      outcome: mainOutcomeTitle,
      whyItMatters,
    };

    // 9. Definition of a Successful Day (3-5 concrete outcomes)
    const successCriteria: string[] = [];
    if (deadlineItem && earliestDeadlineMins !== null) {
      successCriteria.push(`✅ Dedicated preparation completed before ${this.formatDisplayTime(earliestDeadlineMins)}.`);
      successCriteria.push(`✅ ${deadlineItem.normalizedTitle} attended with high focus.`);
    }

    const primaryMustWin = mustWinTasks.find(m => !m.title.toLowerCase().includes('test') && !m.title.toLowerCase().includes('class'));
    if (primaryMustWin) {
      successCriteria.push(`✅ ${primaryMustWin.title} completed: ${primaryMustWin.expectedResult}`);
    }

    successCriteria.push(`✅ Fixed commitments honored without overlap or rushing.`);
    successCriteria.push(`✅ Preserved buffer time to avoid burnout and review tomorrow's plan.`);

    // 10. Feasibility Report
    const slackMinutes = usableWorkMinutes - allocatedMinutes;
    let status: FeasibilityStatus = 'feasible';
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (allocatedMinutes > usableWorkMinutes) {
      status = 'overloaded';
      warnings.push(`Workload exceeds available time by ${allocatedMinutes - usableWorkMinutes} minutes.`);
    } else if (slackMinutes < 15) {
      status = 'tight';
      warnings.push(`Schedule has very tight slack (${slackMinutes}m remaining). Protect buffer against unexpected delays.`);
    }

    const feasibility: FeasibilityReport = {
      status,
      availableMinutes: usableWorkMinutes,
      plannedMinutes: allocatedMinutes,
      bufferMinutes: targetBufferMinutes,
      slackMinutes: Math.max(0, slackMinutes),
      workloadPercent: usableWorkMinutes > 0 ? Math.round((allocatedMinutes / usableWorkMinutes) * 100) : 100,
      conflicts: [],
      warnings,
      recommendations,
    };

    // 11. Format Exact Section 13 Markdown Report
    const markdownReport = this.renderMarkdownReport({
      mainOutcome,
      mustWinTasks,
      otherTasks,
      schedule: fullSchedule,
      doNotWasteTimeOn: doNotWaste,
      moveToAnotherDay,
      successCriteria,
      currentTime: this.minutesToTime(currentMinutes),
      pendingPastTasks,
    });

    return {
      currentTime: this.minutesToTime(currentMinutes),
      mainOutcome,
      mustWinTasks,
      otherTasks,
      schedule: fullSchedule,
      pendingPastTasks,
      doNotWasteTimeOn: doNotWaste,
      moveToAnotherDay,
      successCriteria,
      feasibility,
      markdownReport,
    };
  }

  /**
   * STAGE 12: Section 13 Markdown Generator
   */
  static renderMarkdownReport(data: {
    mainOutcome: MainOutcomeDefinition;
    mustWinTasks: MustWinTaskItem[];
    otherTasks: OtherTaskItem[];
    schedule: PlanningScheduleEntry[];
    doNotWasteTimeOn: WasteTaskItem[];
    moveToAnotherDay: PostponedTaskItem[];
    successCriteria: string[];
    currentTime?: string;
    pendingPastTasks?: PendingPastTaskItem[];
  }): string {
    let md = '';

    // 📅 TODAY'S PRIORITY
    const timeLabel = data.currentTime ? ` (Current Time: ${data.currentTime})` : '';
    md += `## 📅 TODAY'S PRIORITY${timeLabel}\n\n`;
    md += `**Main outcome for today:**\n${data.mainOutcome.outcome}\n\n`;
    md += `**Why it matters:**\n${data.mainOutcome.whyItMatters}\n\n`;
    md += `---\n\n`;

    // ⚠️ PENDING & OVERDUE WORK (if user entered past times)
    if (data.pendingPastTasks && data.pendingPastTasks.length > 0) {
      md += `## ⚠️ PENDING & OVERDUE WORK\n\n`;
      md += `*Tasks specified for hours prior to ${data.currentTime || 'now'} were preserved and rescheduled into upcoming active windows:*\n\n`;
      md += `| Task | Original Elapsed Time | Action Taken |\n`;
      md += `| ---- | --------------------- | ------------ |\n`;
      for (const p of data.pendingPastTasks) {
        md += `| **${p.task}** | ${p.originalTime} | ⏳ ${p.reason} |\n`;
      }
      md += `\n---\n\n`;
    }

    // 🔥 MUST WIN TODAY
    md += `## 🔥 MUST WIN TODAY\n\n`;
    md += `| Priority | Task | Expected result | Time |\n`;
    md += `| -------- | ---- | --------------- | ---- |\n`;
    for (const row of data.mustWinTasks) {
      const emoji = row.priority === 'P1' ? '🔴 P1' : '🟠 P2';
      md += `| ${emoji} | ${row.title} | ${row.expectedResult} | ${row.time} |\n`;
    }
    md += `\n---\n\n`;

    // 🗂️ OTHER TASKS
    md += `## 🗂️ OTHER TASKS\n\n`;
    md += `| Priority | Task | Time | Recommendation |\n`;
    md += `| -------- | ---- | ---- | -------------- |\n`;
    for (const row of data.otherTasks) {
      const emoji = row.priority === 'P3' ? '🟡 P3' : '🟢 P4';
      md += `| ${emoji} | ${row.title} | ${row.time} | ${row.recommendation} |\n`;
    }
    md += `\n---\n\n`;

    // ⏰ PRACTICAL SCHEDULE
    md += `## ⏰ PRACTICAL SCHEDULE\n\n`;
    md += `| Time | Action | Priority | Expected output |\n`;
    md += `| ---- | ------ | -------- | --------------- |\n`;
    for (const row of data.schedule) {
      let pStr: string = row.priority;
      if (row.priority === 'P1') pStr = '🔴 P1';
      else if (row.priority === 'P2') pStr = '🟠 P2';
      else if (row.priority === 'P3') pStr = '🟡 P3';
      else if (row.priority === 'P4') pStr = '🟢 P4';

      let statusTag = '';
      if (row.isPast) statusTag = ' *(⌛ Past)*';
      else if (row.isCurrent) statusTag = ' *(⚡ Active Now)*';
      else if (row.isPending) statusTag = ' *(⚠️ Rescheduled)*';
      md += `| ${row.time} | ${row.action}${statusTag} | ${pStr} | ${row.expectedOutput} |\n`;
    }
    md += `\n---\n\n`;




    // 🚫 DO NOT WASTE TIME ON
    md += `## 🚫 DO NOT WASTE TIME ON\n\n`;
    if (data.doNotWasteTimeOn.length === 0) {
      md += `*No unnecessary time-wasters identified in input.*\n\n`;
    } else {
      for (const item of data.doNotWasteTimeOn) {
        md += `* **${item.task}:** ${item.reason}\n`;
      }
      md += `\n`;
    }
    md += `---\n\n`;

    // 📦 MOVE TO ANOTHER DAY
    md += `## 📦 MOVE TO ANOTHER DAY\n\n`;
    md += `| Task | Suggested day/reason |\n`;
    md += `| ---- | -------------------- |\n`;
    if (data.moveToAnotherDay.length === 0) {
      md += `| None | All extracted tasks fitted into available capacity. |\n`;
    } else {
      for (const item of data.moveToAnotherDay) {
        md += `| ${item.task} | ${item.suggestedDayOrReason} |\n`;
      }
    }
    md += `\n---\n\n`;

    // ✅ DEFINITION OF A SUCCESSFUL DAY
    md += `## ✅ DEFINITION OF A SUCCESSFUL DAY\n\n`;
    for (const sc of data.successCriteria) {
      md += `${sc}\n`;
    }

    return md.trim();
  }

  /**
   * STAGE 13: State-Adaptive Replanning Engine per §16
   */
  static replanFromCurrentState(
    basePlan: ProductiveDayPlan,
    replanInput: ReplanInput
  ): ProductiveDayPlan {
    const completedIds = new Set(replanInput.completedTaskIds || []);
    const note = (replanInput.interruptionNote || '').toLowerCase();

    // 1. Filter out completed tasks from mustWinTasks & schedule
    let remainingMustWin = basePlan.mustWinTasks.filter(m => !completedIds.has(m.title));
    let remainingSchedule = basePlan.schedule.filter(s => !completedIds.has(s.action));

    // 2. Adjust for specific user update conditions
    if (note.includes('class was cancelled') || note.includes('class cancelled')) {
      // Remove cancelled class fixed block
      remainingSchedule = remainingSchedule.filter(s => !/class|eem|lecture/i.test(s.action));
      remainingSchedule.push({
        time: 'Freed Window',
        action: 'Class Cancelled — Reallocated to Core Prep & Buffer',
        priority: 'BUFFER',
        expectedOutput: 'Extra calm focus margin.',
        blockType: 'BUFFER',
        isFixed: false,
        durationMinutes: 60,
      });
    }

    if (note.includes('2 hours left') || note.includes('only 2 hours')) {
      // Strictly protect top remaining P1 task only, move everything else to another day
      const topP1 = remainingMustWin.find(m => m.priority === 'P1') || remainingMustWin[0];
      const protectedList = topP1 ? [topP1] : [];
      const bumped = remainingMustWin.slice(1);

      for (const b of bumped) {
        basePlan.moveToAnotherDay.push({
          task: b.title,
          suggestedDayOrReason: 'Postponed due to 2-hour remaining constraint; protected top priority.',
        });
      }

      basePlan.mainOutcome = {
        outcome: `Execute ${topP1 ? topP1.title : 'final priority'} in remaining 2-hour window.`,
        whyItMatters: 'Protects single highest remaining payoff with zero distraction.',
      };

      remainingMustWin = protectedList;
      remainingSchedule = remainingSchedule.slice(0, 2);
    }

    if (note.includes('only finished the first task') || note.includes('first task')) {
      basePlan.mainOutcome = {
        outcome: `Regroup after initial milestone; execute next single high-value outcome.`,
        whyItMatters: 'Prevents schedule drift and guarantees momentum on primary goal.',
      };
    }

    if (replanInput.newRawText && replanInput.newRawText.trim()) {
      // Re-run offline pipeline with new text and merge
      const appended = this.processOffline(replanInput.newRawText, {
        dayStart: replanInput.currentTime || '14:00',
      });
      for (const m of appended.mustWinTasks) {
        remainingMustWin.push(m);
      }
    }

    basePlan.mustWinTasks = remainingMustWin;
    basePlan.schedule = remainingSchedule;

    if (replanInput.currentTime) {
      basePlan.currentTime = replanInput.currentTime;
      const currentMinutes = this.timeToMinutes(replanInput.currentTime);
      for (const entry of basePlan.schedule) {
        const [sStr, eStr] = entry.time.split(' - ');
        if (sStr && eStr) {
          const sM = this.timeToMinutes(sStr);
          const eM = this.timeToMinutes(eStr);
          if (eM <= currentMinutes) {
            entry.isPast = true;
            entry.isCurrent = false;
          } else if (sM <= currentMinutes && eM > currentMinutes) {
            entry.isCurrent = true;
            entry.isPast = false;
          } else {
            entry.isPast = false;
            entry.isCurrent = false;
          }
        }
      }
    }

    // Refresh Markdown Report
    basePlan.markdownReport = this.renderMarkdownReport({
      mainOutcome: basePlan.mainOutcome,
      mustWinTasks: basePlan.mustWinTasks,
      otherTasks: basePlan.otherTasks,
      schedule: basePlan.schedule,
      doNotWasteTimeOn: basePlan.doNotWasteTimeOn,
      moveToAnotherDay: basePlan.moveToAnotherDay,
      successCriteria: basePlan.successCriteria,
      currentTime: basePlan.currentTime,
      pendingPastTasks: basePlan.pendingPastTasks,
    });


    return basePlan;
  }

  /**
   * Convert ProductiveDayPlan items to database-compatible Candidate tasks
   */
  static planToCandidates(plan: ProductiveDayPlan, brainDumpId: string): ParsedCandidateData[] {
    const candidates: ParsedCandidateData[] = [];

    // Add Must Win tasks
    for (let i = 0; i < plan.mustWinTasks.length; i++) {
      const mw = plan.mustWinTasks[i];
      const schedBlock = plan.schedule.find(s => s.action.includes(mw.title) || mw.title.includes(s.action));
      const times = schedBlock ? schedBlock.time.split(' - ') : [];

      candidates.push({
        title: mw.title,
        description: `Action: ${mw.action}`,
        estimated_duration: mw.estimatedDuration,
        priority: mw.priority,
        expected_outcome: mw.expectedResult,
        category: mw.priority === 'P1' ? 'Critical' : 'High Value',
        tags: [mw.priority.toLowerCase(), 'must-win'],
        is_fixed_commitment: false,
        scheduled_start: times[0] ? times[0].trim() : undefined,
        scheduled_end: times[1] ? times[1].trim() : undefined,
      });
    }

    // Add Fixed commitments from schedule
    for (const sc of plan.schedule) {
      if (sc.isFixed && !candidates.some(c => c.title === sc.action)) {
        const [s, e] = sc.time.split(' - ');
        candidates.push({
          title: sc.action,
          description: `Fixed Commitment (${sc.time})`,
          estimated_duration: sc.durationMinutes,
          priority: sc.priority === 'P1' ? 'P1' : 'P2',
          expected_outcome: sc.expectedOutput,
          category: 'Commitment',
          tags: ['fixed'],
          is_fixed_commitment: true,
          scheduled_start: s ? s.trim() : undefined,
          scheduled_end: e ? e.trim() : undefined,
        });
      }
    }

    // Add Other tasks
    for (const ot of plan.otherTasks) {
      if (!candidates.some(c => c.title === ot.title)) {
        candidates.push({
          title: ot.title,
          description: ot.recommendation,
          estimated_duration: ot.estimatedDuration,
          priority: ot.priority,
          expected_outcome: `Review or advance ${ot.title}`,
          category: 'Secondary',
          tags: [ot.priority.toLowerCase()],
          is_fixed_commitment: false,
        });
      }
    }

    return candidates;
  }
}
