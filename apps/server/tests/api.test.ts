import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server.js';
import { getDb, setDefaultDb, DatabaseAdapter } from '../src/db/db.js';
import { runMigrations } from '../src/db/migrations.js';

describe('FlowDesk REST API End-to-End Integration Suite', () => {
  let app: any;
  let db: DatabaseAdapter;

  beforeAll(() => {
    db = getDb(':memory:');
    runMigrations(db);
    setDefaultDb(db);
    app = createApp();
  });

  afterAll(() => {
    setDefaultDb(null);
    db.close();
  });

  it('GET /api/v1/health returns 200 and status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('FlowDesk');
  });

  let brainDumpId: string;
  let candidates: any[] = [];

  it('POST /api/v1/brain-dumps parses raw messy text into candidates and schedule', async () => {
    const res = await request(app)
      .post('/api/v1/brain-dumps')
      .send({
        raw_text: 'college till 4 then edc study, finish trakt parser, revise python and check github issue',
        mode: 'offline_quick_split',
      });

    expect(res.status).toBe(201);
    expect(res.body.brain_dump).toBeDefined();
    expect(res.body.candidates.length).toBeGreaterThanOrEqual(4);
    expect(res.body.schedule.length).toBeGreaterThanOrEqual(4);
    expect(res.body.feasibility).toBeDefined();

    brainDumpId = res.body.brain_dump.id;
    candidates = res.body.candidates;
  });

  it('PUT /api/v1/brain-dumps/candidates/:id customizes candidate schedule and recalculates', async () => {
    const cand = candidates.find(c => c.title.toLowerCase().includes('edc')) || candidates[1];
    const res = await request(app)
      .put(`/api/v1/brain-dumps/candidates/${cand.id}`)
      .send({
        estimated_duration: 120, // customize duration
        priority: 'P1',
        scheduled_start: '16:30',
      });

    expect(res.status).toBe(200);
    expect(res.body.candidate.estimated_duration).toBe(120);
    expect(res.body.feasibility).toBeDefined();
  });

  let fixedTasks: any[] = [];

  it('POST /api/v1/fix transactionally promotes candidates into executable tasks', async () => {
    const res = await request(app)
      .post('/api/v1/fix')
      .send({
        brain_dump_id: brainDumpId,
        candidates: candidates.map((c, idx) => ({
          ...c,
          estimated_duration: idx === 0 ? 90 : 45,
          checklist: ['Step 1: Prep', 'Step 2: Focus', 'Step 3: Verify'],
        })),
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tasks.length).toBe(candidates.length);
    fixedTasks = res.body.tasks;
  });

  it('GET /api/v1/tasks returns approved tasks with attached checklist items', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(fixedTasks.length);
    expect(res.body[0].checklist.length).toBe(3);
    expect(res.body[0].status).toBe('planned');
  });

  let activeSessionId: string;

  it('POST /api/v1/timers/start starts focus timer and enforces single active timer', async () => {
    const task1 = fixedTasks[0];
    const task2 = fixedTasks[1];

    // Start timer for task 1
    const res1 = await request(app)
      .post('/api/v1/timers/start')
      .send({ task_id: task1.id });

    expect(res1.status).toBe(201);
    expect(res1.body.active).toBe(true);
    expect(res1.body.session.task_id).toBe(task1.id);
    activeSessionId = res1.body.session.id;

    // Attempt to start timer for task 2 -> MUST return 409 TIMER_ALREADY_RUNNING
    const res2 = await request(app)
      .post('/api/v1/timers/start')
      .send({ task_id: task2.id });

    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('TIMER_ALREADY_RUNNING');
    expect(res2.body.error.details.active_task_id).toBe(task1.id);
  });

  it('POST /api/v1/timers/pause and resume works properly', async () => {
    const resPause = await request(app)
      .post('/api/v1/timers/pause')
      .send({ session_id: activeSessionId });

    expect(resPause.status).toBe(200);
    expect(resPause.body.active).toBe(false);
    expect(resPause.body.session.state).toBe('paused');

    const resResume = await request(app)
      .post('/api/v1/timers/resume')
      .send({ session_id: activeSessionId });

    expect(resResume.status).toBe(200);
    expect(resResume.body.active).toBe(true);
    expect(resResume.body.session.state).toBe('running');
  });

  it('POST /api/v1/timers/complete finishes session and marks task complete', async () => {
    const res = await request(app)
      .post('/api/v1/timers/complete')
      .send({ session_id: activeSessionId, mark_task_completed: true });

    expect(res.status).toBe(200);
    expect(res.body.session.state).toBe('completed');
    expect(res.body.task.status).toBe('completed');

    // Active timer should now be none
    const resActive = await request(app).get('/api/v1/timers/active');
    expect(resActive.body.active).toBe(false);
    expect(resActive.body.session).toBeNull();
  });

  it('GET /api/v1/analytics returns calculated numerical metrics', async () => {
    const res = await request(app).get('/api/v1/analytics');
    expect(res.status).toBe(200);
    expect(res.body.completed_tasks).toBe(1);
    expect(res.body.completion_rate).toBeGreaterThan(0);
    expect(Array.isArray(res.body.productive_hours)).toBe(true);
  });

  it('GET /api/v1/backup/export downloads portable ZIP package', async () => {
    const res = await request(app)
      .get('/api/v1/backup/export')
      .buffer(true);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/zip');
    expect(res.header['x-flowdesk-sha256']).toBeDefined();
    expect(res.body).toBeDefined();
  });

  it('GET /api/v1/app-update/check returns mobile update metadata', async () => {
    const res = await request(app).get('/api/v1/app-update/check?version=1.0.0');
    expect(res.status).toBe(200);
    expect(res.body.latestVersion).toBe('1.0.1');
    expect(res.body.updateAvailable).toBe(true);
    expect(res.body.downloadUrl).toContain('/api/v1/app-update/download');
    expect(res.body.apkAvailable).toBe(true);
    expect(res.body.apkSize).toBeGreaterThan(0);
    expect(Array.isArray(res.body.releaseNotes)).toBe(true);
  });

  it('GET /api/v1/app-update/versions returns release manifest history', async () => {
    const res = await request(app).get('/api/v1/app-update/versions');
    expect(res.status).toBe(200);
    expect(res.body.latest).toBeDefined();
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  it('GET /api/v1/app-update/download serves FlowDesk.apk binary package', async () => {
    const res = await request(app).get('/api/v1/app-update/download');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/vnd.android.package-archive');
    expect(res.header['content-disposition']).toContain('.apk');
  });
});
