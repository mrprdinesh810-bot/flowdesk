import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db/db.js';
import { ParserService } from '../services/parserService.js';
import { SchedulerService } from '../services/schedulerService.js';
import { ScheduleIntelligenceService } from '../services/scheduleIntelligenceService.js';
import { BrainDumpInputSchema, ClarifyInputSchema, CandidateUpdateSchema, RecalculateScheduleSchema, PlanningInputSchema, ReplanInputSchema } from '../domain/schemas.js';

export const brainDumpsRouter = Router();

/**
 * POST /api/v1/brain-dumps
 * Process raw input into candidate tasks and initial schedule with schedule intelligence
 */
brainDumpsRouter.post('/', async (req, res, next) => {
  try {
    const input = BrainDumpInputSchema.parse(req.body);
    const db = getDb();
    const bdId = `bd_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    // Fetch user settings for provider and time windows
    const providerSetting = db.prepare('SELECT value_json FROM settings WHERE key = ?').get('selected_provider') as any;
    const provider = input.mode === 'offline_quick_split'
      ? 'offline_quick_split'
      : (input.provider || (providerSetting ? JSON.parse(providerSetting.value_json) : 'openrouter'));

    const ollamaBaseUrl = (db.prepare('SELECT value_json FROM settings WHERE key = ?').get('ollama_base_url') as any)?.value_json;
    const ollamaModel = (db.prepare('SELECT value_json FROM settings WHERE key = ?').get('ollama_model') as any)?.value_json;
    const openrouterModel = (db.prepare('SELECT value_json FROM settings WHERE key = ?').get('openrouter_model') as any)?.value_json;
    const openrouterApiKeySetting = (db.prepare('SELECT value_json FROM settings WHERE key = ?').get('openrouter_api_key') as any)?.value_json;
    const openrouterApiKey = openrouterApiKeySetting ? (typeof openrouterApiKeySetting === 'string' ? JSON.parse(openrouterApiKeySetting) : openrouterApiKeySetting) : process.env.OPENROUTER_API_KEY;

    // Parse input through Schedule Intelligence layer
    const parseResult = await ParserService.parseBrainDump(input.raw_text, {
      provider,
      baseUrl: ollamaBaseUrl ? JSON.parse(ollamaBaseUrl) : undefined,
      model: provider === 'ollama' ? (ollamaModel ? JSON.parse(ollamaModel) : undefined) : (openrouterModel ? JSON.parse(openrouterModel) : undefined),
      apiKey: openrouterApiKey,
      currentTime: input.current_time || new Date().toTimeString().slice(0, 5),
    });

    const bdStatus = parseResult.candidates.some(c => c.clarification_question) ? 'clarifying' : 'parsed';

    // Insert brain dump record with intelligence metadata
    db.prepare(`
      INSERT INTO brain_dumps (id, raw_text, status, parsing_provider, parsing_model, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bdId,
      input.raw_text,
      bdStatus,
      parseResult.providerUsed,
      parseResult.modelUsed,
      JSON.stringify({ intelligencePlan: parseResult.intelligencePlan }),
      now,
      now
    );


    // Insert candidates
    const insertCandStmt = db.prepare(`
      INSERT INTO candidates (
        id, brain_dump_id, title, description, estimated_duration, priority,
        expected_outcome, category, tags_json, status, clarification_question,
        scheduled_start, scheduled_end, is_fixed_commitment, is_included, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertedCandidates: any[] = [];
    for (let i = 0; i < parseResult.candidates.length; i++) {
      const c = parseResult.candidates[i];
      const candId = `cand_${crypto.randomUUID().slice(0, 8)}`;
      const status = c.clarification_question ? 'clarification_required' : 'reviewable';

      insertCandStmt.run(
        candId,
        bdId,
        c.title,
        c.description || null,
        c.estimated_duration,
        c.priority,
        c.expected_outcome || null,
        c.category,
        JSON.stringify(c.tags || []),
        status,
        c.clarification_question || null,
        c.scheduled_start || null,
        c.scheduled_end || null,
        c.is_fixed_commitment ? 1 : 0,
        1,
        i,
        now,
        now
      );

      insertedCandidates.push({
        id: candId,
        brain_dump_id: bdId,
        title: c.title,
        description: c.description || null,
        estimated_duration: c.estimated_duration,
        priority: c.priority,
        expected_outcome: c.expected_outcome || null,
        category: c.category,
        tags: c.tags || [],
        status,
        clarification_question: c.clarification_question || null,
        scheduled_start: c.scheduled_start || null,
        scheduled_end: c.scheduled_end || null,
        is_fixed_commitment: c.is_fixed_commitment ? 1 : 0,
        is_included: 1,
        sort_order: i,
      });
    }

    // Calculate initial schedule
    const schedule = SchedulerService.calculateSchedule(insertedCandidates);

    // Update candidate scheduled times with calculated blocks
    for (const b of schedule.blocks) {
      if (b.candidateId) {
        db.prepare('UPDATE candidates SET scheduled_start = ?, scheduled_end = ? WHERE id = ?')
          .run(b.start, b.end, b.candidateId);
        const cand = insertedCandidates.find(c => c.id === b.candidateId);
        if (cand) {
          cand.scheduled_start = b.start;
          cand.scheduled_end = b.end;
        }
      }
    }

    res.status(201).json({
      brain_dump: {
        id: bdId,
        raw_text: input.raw_text,
        status: bdStatus,
        provider: parseResult.providerUsed,
        model: parseResult.modelUsed,
        was_fallback: parseResult.wasFallback,
        ai_error: parseResult.aiError || null,
        created_at: now,
      },
      candidates: insertedCandidates,
      schedule: schedule.blocks,
      feasibility: schedule.feasibility,
      intelligence_plan: parseResult.intelligencePlan,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/brain-dumps/:id
 */
brainDumpsRouter.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const bd = db.prepare('SELECT * FROM brain_dumps WHERE id = ?').get(req.params.id);
    if (!bd) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Brain dump not found.' } });
    }
    const candidates = db.prepare('SELECT * FROM candidates WHERE brain_dump_id = ? ORDER BY sort_order ASC').all(req.params.id);
    res.json({ brain_dump: bd, candidates });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/candidates/:id/clarify
 * Submit answer to clarification question
 */
brainDumpsRouter.post('/candidates/:id/clarify', (req, res, next) => {
  try {
    const input = ClarifyInputSchema.parse(req.body);
    const db = getDb();
    const now = new Date().toISOString();

    const cand = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id) as any;
    if (!cand) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidate not found.' } });
    }

    // Update candidate with answer and transition status to clarified/reviewable
    db.prepare(`
      UPDATE candidates
      SET clarification_answer = ?, status = 'reviewable', clarification_question = NULL,
          expected_outcome = COALESCE(expected_outcome, ?), updated_at = ?
      WHERE id = ?
    `).run(input.answer, input.answer, now, req.params.id);

    const allCandidates = db.prepare('SELECT * FROM candidates WHERE brain_dump_id = ? ORDER BY sort_order ASC')
      .all(cand.brain_dump_id) as any[];

    // Check if all clarified
    const remainingClarifications = allCandidates.filter(c => c.status === 'clarification_required');
    if (remainingClarifications.length === 0) {
      db.prepare("UPDATE brain_dumps SET status = 'parsed', updated_at = ? WHERE id = ?").run(now, cand.brain_dump_id);
    }

    const schedule = SchedulerService.calculateSchedule(allCandidates);

    res.json({
      candidate: db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id),
      all_candidates: allCandidates,
      schedule: schedule.blocks,
      feasibility: schedule.feasibility,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/candidates/:id
 * User customization of candidate properties (start, duration, priority, is_included, etc.)
 */
brainDumpsRouter.put('/candidates/:id', (req, res, next) => {
  try {
    const input = CandidateUpdateSchema.parse(req.body);
    const db = getDb();
    const cand = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id) as any;
    if (!cand) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidate not found.' } });
    }

    const updates: string[] = [];
    const values: any[] = [];
    const now = new Date().toISOString();

    for (const [key, val] of Object.entries(input)) {
      if (val !== undefined) {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(req.params.id);

    db.prepare(`UPDATE candidates SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedCand = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
    const allCandidates = db.prepare('SELECT * FROM candidates WHERE brain_dump_id = ? ORDER BY sort_order ASC')
      .all(cand.brain_dump_id) as any[];

    const schedule = SchedulerService.calculateSchedule(allCandidates);

    res.json({
      candidate: updatedCand,
      schedule: schedule.blocks,
      feasibility: schedule.feasibility,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/schedule/recalculate
 * Dynamic schedule recalculation for arbitrary candidate lists during user editing
 */
brainDumpsRouter.post('/schedule/recalculate', (req, res, next) => {
  try {
    const input = RecalculateScheduleSchema.parse(req.body);
    const schedule = SchedulerService.calculateSchedule(input.candidates, {
      dayStart: input.day_start,
      dayEnd: input.day_end,
      bufferPercent: input.buffer_percent,
    });
    res.json({
      blocks: schedule.blocks,
      feasibility: schedule.feasibility,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/brain-dumps/candidates/:id
 * Delete unwanted candidate task from proposed plan and recalculate schedule
 */
brainDumpsRouter.delete('/candidates/:id', (req, res, next) => {
  try {
    const db = getDb();
    const cand = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id) as any;
    if (!cand) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidate not found.' } });
    }

    db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);

    const remainingCandidates = db.prepare('SELECT * FROM candidates WHERE brain_dump_id = ? ORDER BY sort_order ASC')
      .all(cand.brain_dump_id) as any[];

    const schedule = SchedulerService.calculateSchedule(remainingCandidates);

    // Update remaining candidate scheduled times with recalculated blocks
    for (const b of schedule.blocks) {
      if (b.candidateId) {
        db.prepare('UPDATE candidates SET scheduled_start = ?, scheduled_end = ? WHERE id = ?')
          .run(b.start, b.end, b.candidateId);
        const c = remainingCandidates.find(item => item.id === b.candidateId);
        if (c) {
          c.scheduled_start = b.start;
          c.scheduled_end = b.end;
        }
      }
    }

    res.json({
      success: true,
      deleted_id: req.params.id,
      candidates: remainingCandidates,
      schedule: schedule.blocks,
      feasibility: schedule.feasibility,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/brain-dumps/:id
 * Discard entire brain dump and its candidates
 */
brainDumpsRouter.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM candidates WHERE brain_dump_id = ?').run(req.params.id);
    db.prepare('DELETE FROM brain_dumps WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Brain dump discarded.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/brain-dumps/intelligence-plan
 * Directly generate or test a Productive Daily Schedule Intelligence Plan
 */
brainDumpsRouter.post('/intelligence-plan', async (req, res, next) => {
  try {
    const input = PlanningInputSchema.parse(req.body);
    const db = getDb();

    const providerSetting = db.prepare('SELECT value_json FROM settings WHERE key = ?').get('selected_provider') as any;
    const provider = input.mode === 'offline_quick_split'
      ? 'offline_quick_split'
      : (input.provider || (providerSetting ? JSON.parse(providerSetting.value_json) : 'openrouter'));

    const ollamaBaseUrl = (db.prepare('SELECT value_json FROM settings WHERE key = ?').get('ollama_base_url') as any)?.value_json;
    const ollamaModel = (db.prepare('SELECT value_json FROM settings WHERE key = ?').get('ollama_model') as any)?.value_json;
    const openrouterModel = (db.prepare('SELECT value_json FROM settings WHERE key = ?').get('openrouter_model') as any)?.value_json;
    const openrouterApiKeySetting = (db.prepare('SELECT value_json FROM settings WHERE key = ?').get('openrouter_api_key') as any)?.value_json;
    const openrouterApiKey = openrouterApiKeySetting ? (typeof openrouterApiKeySetting === 'string' ? JSON.parse(openrouterApiKeySetting) : openrouterApiKeySetting) : process.env.OPENROUTER_API_KEY;

    const parseResult = await ParserService.parseBrainDump(input.raw_text, {
      provider,
      baseUrl: ollamaBaseUrl ? JSON.parse(ollamaBaseUrl) : undefined,
      model: provider === 'ollama' ? (ollamaModel ? JSON.parse(ollamaModel) : undefined) : (openrouterModel ? JSON.parse(openrouterModel) : undefined),
      apiKey: openrouterApiKey,
      dayStart: input.day_start,
      dayEnd: input.day_end,
      date: input.date,
      currentTime: input.current_time || new Date().toTimeString().slice(0, 5),
    });

    res.json({
      success: true,
      intelligence_plan: parseResult.intelligencePlan,
      markdown_report: parseResult.intelligencePlan.markdownReport,
      candidates: parseResult.candidates,
      provider: parseResult.providerUsed,
      model: parseResult.modelUsed,
      was_fallback: parseResult.wasFallback,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/brain-dumps/replan
 * Adapt schedule after user updates ("class cancelled", "only 2 hours left", "only finished first task") per §16
 */
brainDumpsRouter.post('/replan', async (req, res, next) => {
  try {
    const input = ReplanInputSchema.parse(req.body);
    const db = getDb();

    let basePlan = null;
    if (input.brain_dump_id) {
      const bd = db.prepare('SELECT metadata_json, raw_text FROM brain_dumps WHERE id = ?').get(input.brain_dump_id) as any;
      if (bd && bd.metadata_json) {
        try {
          const meta = JSON.parse(bd.metadata_json);
          basePlan = meta.intelligencePlan;
        } catch {
          // ignore
        }
      }
      if (!basePlan && bd) {
        basePlan = ScheduleIntelligenceService.processOffline(bd.raw_text);
      }
    }

    if (!basePlan) {
      basePlan = ScheduleIntelligenceService.processOffline(input.new_raw_text || 'Core focus tasks');
    }

    const updatedPlan = ScheduleIntelligenceService.replanFromCurrentState(basePlan, input);

    if (input.brain_dump_id) {
      db.prepare('UPDATE brain_dumps SET metadata_json = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify({ intelligencePlan: updatedPlan }), new Date().toISOString(), input.brain_dump_id);
    }

    res.json({
      success: true,
      intelligence_plan: updatedPlan,
      markdown_report: updatedPlan.markdownReport,
    });
  } catch (err) {
    next(err);
  }
});


