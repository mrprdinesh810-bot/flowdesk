import { describe, it, expect } from 'vitest';
import { ParserService } from '../src/services/parserService.js';

describe('Parser Service (Offline Quick Split & Heuristics)', () => {
  it('parses messy input string into structured candidates', () => {
    const input = 'college till 4 then edc study, finish trakt parser, revise python and check github issue';
    const candidates = ParserService.parseOfflineQuickSplit(input);

    expect(candidates.length).toBeGreaterThanOrEqual(4);

    // Verify "college till 4" detected as fixed commitment with end time
    const college = candidates.find(c => c.title.toLowerCase().includes('college'));
    expect(college).toBeDefined();
    expect(college?.is_fixed_commitment).toBe(true);
    expect(college?.scheduled_end).toBe('16:00');

    // Verify first main task is P1
    const p1Task = candidates.find(c => c.priority === 'P1');
    expect(p1Task).toBeDefined();

    // Verify categories assigned
    const edc = candidates.find(c => c.title.toLowerCase().includes('edc'));
    expect(edc?.category).toBe('Study');

    const trakt = candidates.find(c => c.title.toLowerCase().includes('trakt'));
    expect(trakt?.category).toBe('Coding');
  });

  it('detects explicit duration specifiers like "for 90 min"', () => {
    const input = 'edc study for 90 min then walk for 30 mins';
    const candidates = ParserService.parseOfflineQuickSplit(input);

    const edc = candidates.find(c => c.title.toLowerCase().includes('edc'));
    expect(edc?.estimated_duration).toBe(90);

    const walk = candidates.find(c => c.title.toLowerCase().includes('walk'));
    expect(walk?.estimated_duration).toBe(30);
  });
});
