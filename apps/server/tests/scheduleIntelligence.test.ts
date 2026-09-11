import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server.js';
import { ScheduleIntelligenceService } from '../src/services/scheduleIntelligenceService.js';

describe('Schedule Intelligence Layer Suite', () => {
  it('executes full Section 17 scenario and prioritizes test prep before 3:10 PM test', () => {
    const rawInput = `
11:15 AM–12:40 PM EEM class
1:35 PM–3:00 PM EDC
3:10 PM test
12:45 study for test
work on FlowDesk
finish assignment
reply messages
learn Python
clean files
maybe watch CSS video
    `;

    const plan = ScheduleIntelligenceService.processOffline(rawInput, {
      dayStart: '11:00',
      dayEnd: '22:00',
      date: '2026-09-09',
    });

    // 1. Verify single main outcome and why it matters
    expect(plan.mainOutcome).toBeDefined();
    expect(plan.mainOutcome.outcome).toContain('3:10');
    expect(plan.mainOutcome.whyItMatters.length).toBeGreaterThan(10);

    // 2. Verify Must Win has P1 test prep / test
    const p1Tasks = plan.mustWinTasks.filter(m => m.priority === 'P1');
    expect(p1Tasks.length).toBeGreaterThanOrEqual(1);
    expect(p1Tasks.some(p => p.title.toLowerCase().includes('test'))).toBe(true);

    // 3. Verify FlowDesk is P2 (High Value)
    const flowDeskTask = plan.mustWinTasks.find(m => m.title.toLowerCase().includes('flowdesk'));
    expect(flowDeskTask).toBeDefined();
    expect(flowDeskTask?.priority).toBe('P2');

    // 4. Verify test prep is scheduled BEFORE 3:10 PM (15:10)
    const schedulePrep = plan.schedule.find(s => s.action.toLowerCase().includes('test prep') || s.action.toLowerCase().includes('study'));
    expect(schedulePrep).toBeDefined();
    if (schedulePrep) {
      const [startStr, endStr] = schedulePrep.time.split(' - ');
      const endMins = ScheduleIntelligenceService.timeToMinutes(endStr);
      expect(endMins).toBeLessThanOrEqual(15 * 60 + 10); // before or at 15:10
    }

    // 5. Verify Fixed Commitments are preserved
    const eemBlock = plan.schedule.find(s => s.action.toLowerCase().includes('eem'));
    expect(eemBlock).toBeDefined();
    expect(eemBlock?.isFixed).toBe(true);

    // 6. Verify Low-Value tasks are flagged in Do Not Waste / Move to Another Day
    const wasteTitles = plan.doNotWasteTimeOn.map(w => w.task.toLowerCase());
    const postponeTitles = plan.moveToAnotherDay.map(m => m.task.toLowerCase());
    const combinedLowValue = [...wasteTitles, ...postponeTitles];

    expect(combinedLowValue.some(t => t.includes('clean') || t.includes('video') || t.includes('messages'))).toBe(true);

    // 7. Verify 10-20% Buffer is respected
    expect(plan.feasibility.bufferMinutes).toBeGreaterThan(0);

    // 8. Verify Definition of Successful Day contains 3-5 concrete outcomes
    expect(plan.successCriteria.length).toBeGreaterThanOrEqual(3);
    expect(plan.successCriteria.length).toBeLessThanOrEqual(5);
    expect(plan.successCriteria[0]).toContain('✅');

    // 9. Verify Markdown report contains all 7 required Section 13 sections
    expect(plan.markdownReport).toContain("## 📅 TODAY'S PRIORITY");
    expect(plan.markdownReport).toContain('## 🔥 MUST WIN TODAY');
    expect(plan.markdownReport).toContain('## 🗂️ OTHER TASKS');
    expect(plan.markdownReport).toContain('## ⏰ PRACTICAL SCHEDULE');
    expect(plan.markdownReport).toContain('## 🚫 DO NOT WASTE TIME ON');
    expect(plan.markdownReport).toContain('## 📦 MOVE TO ANOTHER DAY');
    expect(plan.markdownReport).toContain('## ✅ DEFINITION OF A SUCCESSFUL DAY');
  });

  it('merges duplicate or equivalent tasks (CSS Flexbox)', () => {
    const raw = `
study css
learn flexbox
understand css flex
    `;
    const items = ScheduleIntelligenceService.extractAndNormalize(raw);
    expect(items.length).toBe(1);
    expect(items[0].normalizedTitle).toBe('Study CSS Flexbox');
    expect(items[0].action).toContain('flexbox');
  });

  it('adapts realistically after user updates (Replanning per §16)', () => {
    const raw = `
11:15 AM–12:40 PM EEM class
3:10 PM test
12:45 study for test
work on FlowDesk
    `;

    const initialPlan = ScheduleIntelligenceService.processOffline(raw, {
      dayStart: '11:00',
      dayEnd: '22:00',
    });

    // Test 1: Class was cancelled
    const replanCancel = ScheduleIntelligenceService.replanFromCurrentState(initialPlan, {
      interruptionNote: 'class was cancelled',
    });
    expect(replanCancel.schedule.some(s => s.action.includes('Class Cancelled'))).toBe(true);

    // Test 2: Only 2 hours left
    const replan2Hours = ScheduleIntelligenceService.replanFromCurrentState(initialPlan, {
      interruptionNote: 'I have only 2 hours left',
      remainingMinutes: 120,
    });
    expect(replan2Hours.mustWinTasks.length).toBe(1);
    expect(replan2Hours.moveToAnotherDay.some(m => m.suggestedDayOrReason.includes('2-hour'))).toBe(true);

    // Test 3: Only finished first task
    const replanFirst = ScheduleIntelligenceService.replanFromCurrentState(initialPlan, {
      interruptionNote: 'I only finished the first task',
      completedTaskIds: [initialPlan.mustWinTasks[0].title],
    });
    expect(replanFirst.mainOutcome.outcome).toContain('Regroup');
  });

  it('provides REST endpoints for intelligence-plan and replan', async () => {
    const app = createApp();

    // 1. Test POST /api/v1/brain-dumps/intelligence-plan
    const resPlan = await request(app)
      .post('/api/v1/brain-dumps/intelligence-plan')
      .send({
        raw_text: 'college 9 to 4 then study edc 1 hour and clean files',
        mode: 'offline_quick_split',
        day_start: '09:00',
        day_end: '22:00',
      });

    expect(resPlan.status).toBe(200);
    expect(resPlan.body.success).toBe(true);
    expect(resPlan.body.intelligence_plan).toBeDefined();
    expect(resPlan.body.intelligence_plan.mainOutcome).toBeDefined();
    expect(resPlan.body.markdown_report).toContain("## 📅 TODAY'S PRIORITY");

    // 2. Test POST /api/v1/brain-dumps/replan
    const resReplan = await request(app)
      .post('/api/v1/brain-dumps/replan')
      .send({
        new_raw_text: 'work on flowdesk, study edc',
        interruption_note: 'I have only 2 hours left',
      });

    expect(resReplan.status).toBe(200);
    expect(resReplan.body.success).toBe(true);
    expect(resReplan.body.intelligence_plan.mustWinTasks.length).toBeLessThanOrEqual(2);
  });

  it('handles real time awareness: marks past fixed commitments as elapsed and reschedules past flexible tasks as pending overdue work', () => {
    const raw = `
10:00 AM - 11:30 AM EEM class
9:00 AM - 10:00 AM study edc
3:10 PM test
work on FlowDesk
    `;

    const plan = ScheduleIntelligenceService.processOffline(raw, {
      dayStart: '08:00',
      dayEnd: '22:00',
      currentTime: '13:00',
    });

    // Verify current time was recorded
    expect(plan.currentTime).toBe('13:00');

    // Verify fixed commitment in the past is marked as isPast
    const eemBlock = plan.schedule.find(s => s.action.toLowerCase().includes('eem'));
    expect(eemBlock).toBeDefined();
    expect(eemBlock?.isPast).toBe(true);

    // Verify flexible task in the past was captured in pendingPastTasks
    expect(plan.pendingPastTasks).toBeDefined();
    expect(plan.pendingPastTasks.length).toBeGreaterThanOrEqual(1);
    const pendingEdc = plan.pendingPastTasks.find(p => p.task.toLowerCase().includes('edc'));
    expect(pendingEdc).toBeDefined();
    expect(pendingEdc?.originalTime).toContain('09:00');
    expect(pendingEdc?.actionTaken).toContain('Rescheduled');

    // Verify the task was rescheduled to a time >= currentTime (13:00)
    const edcSchedule = plan.schedule.find(s => s.action.toLowerCase().includes('edc'));
    expect(edcSchedule).toBeDefined();
    expect(edcSchedule?.isPending).toBe(true);
    const [startStr] = (edcSchedule?.time || '').split(' - ');
    const startMins = ScheduleIntelligenceService.timeToMinutes(startStr);
    expect(startMins).toBeGreaterThanOrEqual(13 * 60);

    // Verify markdown report renders the overdue callout
    expect(plan.markdownReport).toContain('## ⚠️ PENDING & OVERDUE WORK');
    expect(plan.markdownReport).toContain('Current Time: 13:00');
    expect(plan.markdownReport).toContain('Study EDC');
  });

  it('supports current_time in POST /api/v1/brain-dumps', async () => {
    const app = createApp();

    const res = await request(app)
      .post('/api/v1/brain-dumps')
      .send({
        raw_text: '9:00 AM - 10:30 AM study edc, 3:10 PM test, work on FlowDesk',
        mode: 'offline_quick_split',
        current_time: '12:00',
      });

    expect(res.status).toBe(201);
    expect(res.body.intelligence_plan).toBeDefined();
    expect(res.body.intelligence_plan.currentTime).toBe('12:00');
    expect(res.body.intelligence_plan.pendingPastTasks?.length).toBeGreaterThanOrEqual(1);
    expect(res.body.intelligence_plan.pendingPastTasks[0].task.toLowerCase()).toContain('edc');
  });
});

