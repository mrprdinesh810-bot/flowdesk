import { describe, it, expect } from 'vitest';
import { SchedulerService, SchedulerInputCandidate } from '../src/services/schedulerService.js';

describe('Scheduler Service & Feasibility Calculation', () => {
  it('schedules flexible tasks around fixed commitments with buffers', () => {
    const candidates: SchedulerInputCandidate[] = [
      {
        id: 'c1',
        title: 'College',
        estimated_duration: 240,
        priority: 'P2',
        is_fixed_commitment: 1,
        scheduled_start: '09:00',
        scheduled_end: '16:00',
      },
      {
        id: 'c2',
        title: 'EDC Study',
        estimated_duration: 90,
        priority: 'P1',
      },
      {
        id: 'c3',
        title: 'Trakt Parser',
        estimated_duration: 60,
        priority: 'P2',
      },
    ];

    const result = SchedulerService.calculateSchedule(candidates, {
      dayStart: '09:00',
      dayEnd: '22:00',
      bufferPercent: 15,
    });

    expect(result.blocks.length).toBe(3);

    // EDC Study should start after College ends (>= 16:00)
    const edcBlock = result.blocks.find(b => b.title === 'EDC Study');
    expect(edcBlock).toBeDefined();
    expect(SchedulerService.timeToMinutes(edcBlock!.start)).toBeGreaterThanOrEqual(SchedulerService.timeToMinutes('16:00'));

    expect(result.feasibility.status).toBe('feasible');
    expect(result.feasibility.plannedMinutes).toBe(150);
  });

  it('detects overloaded schedule and generates warnings and move recommendations', () => {
    // 3 hours available (19:00 to 22:00), but 5 hours of work
    const candidates: SchedulerInputCandidate[] = [
      { id: 'c1', title: 'Big Task 1', estimated_duration: 120, priority: 'P1' },
      { id: 'c2', title: 'Big Task 2', estimated_duration: 120, priority: 'P2' },
      { id: 'c3', title: 'Minor Task 3', estimated_duration: 60, priority: 'P4' },
    ];

    const result = SchedulerService.calculateSchedule(candidates, {
      dayStart: '19:00',
      dayEnd: '22:00',
    });

    expect(result.feasibility.status).toBe('overloaded');
    expect(result.feasibility.warnings.length).toBeGreaterThan(0);
    expect(result.feasibility.warnings[0]).toContain('overload');
    expect(result.feasibility.recommendations.length).toBeGreaterThan(0);
    expect(result.feasibility.recommendations[0]).toContain('Minor Task 3 (P4)');
  });

  it('recalculates dynamically when user customizes schedule times and exclusions', () => {
    const candidates: SchedulerInputCandidate[] = [
      { id: 'c1', title: 'Task A', estimated_duration: 60, priority: 'P1' },
      { id: 'c2', title: 'Task B', estimated_duration: 60, priority: 'P2', is_included: 1 },
    ];

    const before = SchedulerService.calculateSchedule(candidates, { dayStart: '09:00', dayEnd: '12:00' });
    expect(before.feasibility.plannedMinutes).toBe(120);

    // User excludes Task B
    candidates[1].is_included = 0;
    const after = SchedulerService.calculateSchedule(candidates, { dayStart: '09:00', dayEnd: '12:00' });
    expect(after.feasibility.plannedMinutes).toBe(60);
    expect(after.blocks.length).toBe(1);
  });
});
