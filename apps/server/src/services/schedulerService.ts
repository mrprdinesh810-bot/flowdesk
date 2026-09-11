import { Candidate, ScheduleBlock, FeasibilityReport, FeasibilityStatus, Priority } from '../domain/types.js';

export interface SchedulerInputCandidate {
  id: string;
  title: string;
  estimated_duration: number; // minutes
  priority: Priority;
  scheduled_start?: string | null; // HH:MM
  scheduled_end?: string | null;   // HH:MM
  is_fixed_commitment?: number | boolean;
  is_included?: number | boolean;
  sort_order?: number;
}

export class SchedulerService {
  /**
   * Helper: Parse "HH:MM" to minutes from midnight
   */
  static timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Helper: Convert minutes from midnight to "HH:MM"
   */
  static minutesToTime(totalMinutes: number): string {
    const normalized = Math.max(0, totalMinutes) % (24 * 60);
    const h = Math.floor(normalized / 60);
    const m = Math.floor(normalized % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Compute schedule blocks and comprehensive feasibility report
   */
  static calculateSchedule(
    rawCandidates: SchedulerInputCandidate[],
    options: {
      dayStart?: string;
      dayEnd?: string;
      bufferPercent?: number;
    } = {}
  ): { blocks: ScheduleBlock[]; feasibility: FeasibilityReport } {
    const dayStartStr = options.dayStart || '09:00';
    const dayEndStr = options.dayEnd || '22:00';
    const bufferPercent = options.bufferPercent ?? 15;

    const dayStartMins = this.timeToMinutes(dayStartStr);
    const dayEndMins = this.timeToMinutes(dayEndStr);
    const totalDaySpan = Math.max(0, dayEndMins - dayStartMins);

    // Filter to only included candidates
    const included = rawCandidates.filter(c => c.is_included !== 0 && c.is_included !== false);

    // Identify fixed commitments
    const fixedBlocks: ScheduleBlock[] = [];
    const flexibleCandidates: SchedulerInputCandidate[] = [];

    for (const c of included) {
      const isFixed = Boolean(c.is_fixed_commitment);
      if (isFixed && c.scheduled_start && c.scheduled_end) {
        const startM = this.timeToMinutes(c.scheduled_start);
        const endM = this.timeToMinutes(c.scheduled_end);
        fixedBlocks.push({
          id: `blk_${c.id}`,
          candidateId: c.id,
          title: c.title,
          start: c.scheduled_start,
          end: c.scheduled_end,
          durationMinutes: Math.max(1, endM - startM),
          blockType: 'FIXED_COMMITMENT',
          priority: c.priority,
          isFixedCommitment: true,
        });
      } else if (isFixed && c.scheduled_end && !c.scheduled_start) {
        // e.g. "college till 4pm" -> starts at dayStart or end-duration
        const endM = this.timeToMinutes(c.scheduled_end);
        const startM = Math.max(dayStartMins, endM - c.estimated_duration);
        fixedBlocks.push({
          id: `blk_${c.id}`,
          candidateId: c.id,
          title: c.title,
          start: this.minutesToTime(startM),
          end: c.scheduled_end,
          durationMinutes: Math.max(1, endM - startM),
          blockType: 'FIXED_COMMITMENT',
          priority: c.priority,
          isFixedCommitment: true,
        });
      } else {
        flexibleCandidates.push(c);
      }
    }

    // Check for conflicts between fixed commitments
    fixedBlocks.sort((a, b) => this.timeToMinutes(a.start) - this.timeToMinutes(b.start));
    const conflicts: Array<{ blockA: string; blockB: string; time: string }> = [];

    for (let i = 0; i < fixedBlocks.length - 1; i++) {
      const aEnd = this.timeToMinutes(fixedBlocks[i].end);
      const bStart = this.timeToMinutes(fixedBlocks[i + 1].start);
      if (aEnd > bStart) {
        conflicts.push({
          blockA: fixedBlocks[i].title,
          blockB: fixedBlocks[i + 1].title,
          time: `${fixedBlocks[i].end} > ${fixedBlocks[i + 1].start}`,
        });
      }
    }

    // Calculate fixed time consumption inside work hours
    let fixedMinutes = 0;
    for (const fb of fixedBlocks) {
      const s = Math.max(dayStartMins, this.timeToMinutes(fb.start));
      const e = Math.min(dayEndMins, this.timeToMinutes(fb.end));
      if (e > s) {
        fixedMinutes += (e - s);
      }
    }

    const availableFlexibleMinutes = Math.max(0, totalDaySpan - fixedMinutes);

    // Calculate planned duration of flexible candidates
    const plannedFlexibleMinutes = flexibleCandidates.reduce((acc, c) => acc + c.estimated_duration, 0);
    const targetBufferMinutes = Math.round(availableFlexibleMinutes * (bufferPercent / 100));
    const remainingSlackMinutes = availableFlexibleMinutes - plannedFlexibleMinutes - targetBufferMinutes;

    // Sort flexible candidates by priority (P1 -> P2 -> P3 -> P4), then user sort_order
    const priorityWeight: Record<Priority, number> = { P1: 1, P2: 2, P3: 3, P4: 4 };
    flexibleCandidates.sort((a, b) => {
      if (a.sort_order !== undefined && b.sort_order !== undefined && a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    });

    // Schedule flexible blocks around fixed commitments
    const allBlocks: ScheduleBlock[] = [...fixedBlocks];
    let cursor = dayStartMins;

    for (const cand of flexibleCandidates) {
      // If candidate has explicit custom scheduled_start provided by user, honor it
      if (cand.scheduled_start && !cand.is_fixed_commitment) {
        const customStart = this.timeToMinutes(cand.scheduled_start);
        const customEnd = customStart + cand.estimated_duration;
        allBlocks.push({
          id: `blk_${cand.id}`,
          candidateId: cand.id,
          title: cand.title,
          start: cand.scheduled_start,
          end: this.minutesToTime(customEnd),
          durationMinutes: cand.estimated_duration,
          blockType: cand.priority === 'P1' ? 'FOCUS_WORK' : 'LIGHT_WORK',
          priority: cand.priority,
          isFixedCommitment: false,
        });
        cursor = Math.max(cursor, customEnd);
        continue;
      }

      // Find next available slot that doesn't overlap with a fixed block
      let scheduled = false;
      while (!scheduled && cursor < dayEndMins + 180) { // allow overflow detection
        const taskEnd = cursor + cand.estimated_duration;
        const overlappingFixed = fixedBlocks.find(fb => {
          const fbStart = this.timeToMinutes(fb.start);
          const fbEnd = this.timeToMinutes(fb.end);
          return Math.max(cursor, fbStart) < Math.min(taskEnd, fbEnd);
        });

        if (overlappingFixed) {
          // Advance cursor to end of fixed block + 10 min transition buffer
          cursor = this.timeToMinutes(overlappingFixed.end) + 10;
        } else {
          allBlocks.push({
            id: `blk_${cand.id}`,
            candidateId: cand.id,
            title: cand.title,
            start: this.minutesToTime(cursor),
            end: this.minutesToTime(taskEnd),
            durationMinutes: cand.estimated_duration,
            blockType: cand.priority === 'P1' ? 'FOCUS_WORK' : 'LIGHT_WORK',
            priority: cand.priority,
            isFixedCommitment: false,
          });
          cursor = taskEnd + 10; // 10 min break buffer between tasks
          scheduled = true;
        }
      }
    }

    // Sort all blocks chronologically
    allBlocks.sort((a, b) => this.timeToMinutes(a.start) - this.timeToMinutes(b.start));

    // Determine feasibility status
    let status: FeasibilityStatus = 'feasible';
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (conflicts.length > 0) {
      status = 'conflicted';
      warnings.push(`Fixed commitment conflict detected between ${conflicts[0].blockA} and ${conflicts[0].blockB}.`);
    } else if (plannedFlexibleMinutes > availableFlexibleMinutes) {
      status = 'overloaded';
      const overHours = ((plannedFlexibleMinutes - availableFlexibleMinutes) / 60).toFixed(1);
      warnings.push(`Your plan contains ${(plannedFlexibleMinutes / 60).toFixed(1)}h of work but only ${(availableFlexibleMinutes / 60).toFixed(1)}h of realistic available time (${overHours}h overload).`);
      
      // Suggest moving lowest priority task
      const lowerPriority = flexibleCandidates.filter(c => c.priority === 'P3' || c.priority === 'P4');
      if (lowerPriority.length > 0) {
        recommendations.push(`Consider moving ${lowerPriority[lowerPriority.length - 1].title} (${lowerPriority[lowerPriority.length - 1].priority}) to tomorrow.`);
      }
    } else if (remainingSlackMinutes < 15) {
      status = 'tight';
      warnings.push(`Schedule is tight: only ${Math.max(0, remainingSlackMinutes)} minutes of buffer remain. Minimal margin for interruptions.`);
    }

    // Check for tasks extending past day end
    const lastBlock = allBlocks[allBlocks.length - 1];
    if (lastBlock && this.timeToMinutes(lastBlock.end) > dayEndMins) {
      if (status === 'feasible') status = 'deadline_risk';
      warnings.push(`Final task (${lastBlock.title}) extends past your configured day end of ${dayEndStr}.`);
    }

    const workloadPercent = availableFlexibleMinutes > 0
      ? Math.round((plannedFlexibleMinutes / availableFlexibleMinutes) * 100)
      : 100;

    return {
      blocks: allBlocks,
      feasibility: {
        status,
        availableMinutes: availableFlexibleMinutes,
        plannedMinutes: plannedFlexibleMinutes,
        bufferMinutes: targetBufferMinutes,
        slackMinutes: remainingSlackMinutes,
        workloadPercent,
        conflicts,
        warnings,
        recommendations,
      },
    };
  }
}
