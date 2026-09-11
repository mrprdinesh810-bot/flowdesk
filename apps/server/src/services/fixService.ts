import crypto from 'node:crypto';
import { DatabaseAdapter } from '../db/db.js';
import { Task, Priority } from '../domain/types.js';

export interface FixCandidatePayload {
  id: string;
  title: string;
  description?: string | null;
  priority: Priority;
  category?: string;
  estimated_duration: number;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  expected_outcome?: string | null;
  is_fixed_commitment?: number;
  is_included?: number;
  sort_order?: number;
  checklist?: string[];
}

export class FixService {
  /**
   * Execute FIX approval gate inside an atomic transaction per §6, §55
   */
  static fixPlan(
    db: DatabaseAdapter,
    brainDumpId: string,
    candidates: FixCandidatePayload[],
    scheduledDate?: string
  ): { tasks: Task[]; scheduledDate: string } {
    const targetDate = scheduledDate || new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    // Only approve included candidates
    const approvedCandidates = candidates.filter(c => c.is_included !== 0);

    if (approvedCandidates.length === 0) {
      throw new Error('Cannot fix plan with zero included tasks.');
    }

    return db.transaction(() => {
      // 1. Verify brain dump exists
      const bd = db.prepare('SELECT * FROM brain_dumps WHERE id = ?').get(brainDumpId) as any;
      if (!bd) {
        throw new Error(`Brain dump with ID "${brainDumpId}" not found.`);
      }

      const createdTasks: Task[] = [];

      const insertTaskStmt = db.prepare(`
        INSERT INTO tasks (
          id, source_candidate_id, source_brain_dump_id, title, description,
          priority, category, tags_json, estimated_duration, planned_duration,
          actual_duration, scheduled_date, scheduled_start, scheduled_end,
          deadline, expected_outcome, status, postponed_count, notes,
          is_fixed_commitment, sort_order, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);

      const insertChecklistStmt = db.prepare(`
        INSERT INTO checklist_items (
          id, task_id, title, is_completed, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, 0, ?, ?, ?)
      `);

      const insertEventStmt = db.prepare(`
        INSERT INTO task_events (
          id, task_id, event_type, prior_state, next_state, timestamp, metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < approvedCandidates.length; i++) {
        const cand = approvedCandidates[i];
        const taskId = `task_${crypto.randomUUID().slice(0, 8)}`;
        const duration = Math.max(1, cand.estimated_duration || 30);
        const priority = cand.priority || 'P2';
        const category = cand.category || 'Work';

        insertTaskStmt.run(
          taskId,
          cand.id,
          brainDumpId,
          cand.title,
          cand.description || null,
          priority,
          category,
          JSON.stringify([category.toLowerCase()]),
          duration,
          duration, // planned_duration initially equals estimated_duration
          0,        // actual_duration starts at 0 seconds
          targetDate,
          cand.scheduled_start || null,
          cand.scheduled_end || null,
          null,     // deadline
          cand.expected_outcome || null,
          'planned',
          0,        // postponed_count
          null,     // notes
          cand.is_fixed_commitment ? 1 : 0,
          cand.sort_order ?? i,
          now,
          now
        );

        // Checklist items
        const checklistItems = cand.checklist || ['Review task objectives', 'Execute focus block', 'Verify completion'];
        for (let j = 0; j < checklistItems.length; j++) {
          const chkId = `chk_${crypto.randomUUID().slice(0, 8)}`;
          insertChecklistStmt.run(chkId, taskId, checklistItems[j], j, now, now);
        }

        // Record TASK_CREATED and TASK_FIXED event
        insertEventStmt.run(
          `evt_${crypto.randomUUID().slice(0, 8)}`,
          taskId,
          'TASK_FIXED',
          'candidate',
          'planned',
          now,
          JSON.stringify({ source_candidate_id: cand.id, brain_dump_id: brainDumpId })
        );

        // Update candidate status
        db.prepare('UPDATE candidates SET status = ? WHERE id = ?').run('fixed', cand.id);

        createdTasks.push({
          id: taskId,
          source_candidate_id: cand.id,
          source_brain_dump_id: brainDumpId,
          title: cand.title,
          description: cand.description || null,
          priority,
          category,
          tags_json: JSON.stringify([category.toLowerCase()]),
          estimated_duration: duration,
          planned_duration: duration,
          actual_duration: 0,
          scheduled_date: targetDate,
          scheduled_start: cand.scheduled_start || null,
          scheduled_end: cand.scheduled_end || null,
          deadline: null,
          expected_outcome: cand.expected_outcome || null,
          status: 'planned',
          postponed_count: 0,
          notes: null,
          is_fixed_commitment: cand.is_fixed_commitment ? 1 : 0,
          sort_order: cand.sort_order ?? i,
          created_at: now,
          updated_at: now,
        });
      }

      // Mark brain dump as fixed
      db.prepare('UPDATE brain_dumps SET status = ?, updated_at = ? WHERE id = ?')
        .run('fixed', now, brainDumpId);

      return { tasks: createdTasks, scheduledDate: targetDate };
    });
  }
}
