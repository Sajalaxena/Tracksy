// Feature: personal-habit-tracker
// Tests for server/utils/analytics.js — completionRate and streak

import { describe, it, expect, vi, afterEach } from 'vitest';
import fc from 'fast-check';
import { completionRate, streak } from './analytics.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal record-like object with a plain-object data map. */
function makeRecord(data = {}) {
  return { data };
}

/** Build a record whose data is a real Map (mirrors Mongoose behaviour). */
function makeMapRecord(data = {}) {
  return { data: new Map(Object.entries(data)) };
}

/**
 * Pin "today" to a specific date for deterministic tests.
 * Returns a restore function.
 */
function mockToday(year, month, day) {
  const fixed = new Date(year, month - 1, day);
  vi.setSystemTime(fixed);
}

// ---------------------------------------------------------------------------
// Unit tests — completionRate
// ---------------------------------------------------------------------------

describe('completionRate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for an empty data map', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 15); // mid-July 2025
    const record = makeRecord({});
    expect(completionRate(record, '2025-07')).toBe(0);
  });

  it('returns 100 when all elapsed days are logged (current month)', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 3); // July 3 — only 3 days elapsed
    const data = { '1': true, '2': true, '3': true };
    expect(completionRate(makeRecord(data), '2025-07')).toBe(100);
  });

  it('returns 100 when all days of a past month are logged', () => {
    vi.useFakeTimers();
    mockToday(2025, 8, 1); // August — June is a past month
    // June has 30 days
    const data = {};
    for (let d = 1; d <= 30; d++) data[String(d)] = true;
    expect(completionRate(makeRecord(data), '2025-06')).toBe(100);
  });

  it('computes partial completion correctly for current month', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 10); // 10 days elapsed
    const data = { '1': true, '3': true, '5': true }; // 3 logged out of 10
    expect(completionRate(makeRecord(data), '2025-07')).toBeCloseTo(30, 5);
  });

  it('uses all days of a past month as daysElapsed', () => {
    vi.useFakeTimers();
    mockToday(2025, 8, 1);
    // May has 31 days; log 10 of them
    const data = {};
    for (let d = 1; d <= 10; d++) data[String(d)] = true;
    expect(completionRate(makeRecord(data), '2025-05')).toBeCloseTo((10 / 31) * 100, 5);
  });

  it('treats false values as not logged', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 5);
    const data = { '1': false, '2': false, '3': false, '4': false, '5': false };
    expect(completionRate(makeRecord(data), '2025-07')).toBe(0);
  });

  it('treats null values as not logged', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 2);
    const data = { '1': null, '2': null };
    expect(completionRate(makeRecord(data), '2025-07')).toBe(0);
  });

  it('treats numeric 0 as logged (0 is not null/undefined/false)', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 2);
    // Per spec: count any key where v !== null && v !== undefined && v !== false
    // 0 passes that check, so both days count → 100%
    const data = { '1': 0, '2': 5 };
    expect(completionRate(makeRecord(data), '2025-07')).toBe(100);
  });

  it('works with a Mongoose-style Map record', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 4);
    const data = { '1': true, '2': true };
    expect(completionRate(makeMapRecord(data), '2025-07')).toBeCloseTo(50, 5);
  });

  it('clamps result to 100 even if loggedDays somehow exceeds daysElapsed', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 2); // 2 days elapsed
    // 5 logged entries — shouldn't exceed 100
    const data = { '1': true, '2': true, '3': true, '4': true, '5': true };
    expect(completionRate(makeRecord(data), '2025-07')).toBe(100);
  });

  it('returns 0 for a future month (daysElapsed = daysInMonth, no data)', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 15);
    // 2099-01 is a future month — treated as past (all days elapsed), no data → 0
    expect(completionRate(makeRecord({}), '2099-01')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — streak
// ---------------------------------------------------------------------------

describe('streak', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 when data is empty', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 15);
    expect(streak(makeRecord({}))).toBe(0);
  });

  it('returns 0 when today has no logged value', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 5);
    const data = { '1': true, '2': true, '3': true, '4': true }; // day 5 missing
    expect(streak(makeRecord(data))).toBe(0);
  });

  it('counts consecutive days ending at today', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 5);
    const data = { '3': true, '4': true, '5': true }; // gap before day 3
    expect(streak(makeRecord(data))).toBe(3);
  });

  it('stops at the first gap', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 7);
    const data = { '1': true, '2': true, '5': true, '6': true, '7': true };
    // Days 3 and 4 are missing — streak from today is 3 (5,6,7)
    expect(streak(makeRecord(data))).toBe(3);
  });

  it('returns today\'s day number when all days from 1 to today are logged', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 5);
    const data = { '1': true, '2': true, '3': true, '4': true, '5': true };
    expect(streak(makeRecord(data))).toBe(5);
  });

  it('treats false as a gap', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 3);
    const data = { '1': true, '2': false, '3': true };
    expect(streak(makeRecord(data))).toBe(1); // day 2 is false → gap
  });

  it('works with numeric values', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 4);
    const data = { '2': 5, '3': 10, '4': 3 };
    expect(streak(makeRecord(data))).toBe(3);
  });

  it('works with a Mongoose-style Map record', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 3);
    const data = { '1': true, '2': true, '3': true };
    expect(streak(makeMapRecord(data))).toBe(3);
  });

  it('returns 0 when today is day 1 and day 1 has no value', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 1);
    expect(streak(makeRecord({}))).toBe(0);
  });

  it('returns 1 when only today is logged', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 10);
    expect(streak(makeRecord({ '10': true }))).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

// Feature: personal-habit-tracker, Property 9: Completion rate bounds
describe('Property 9: completionRate always returns a value in [0, 100]', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('holds for arbitrary data maps and months', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 15);

    // Arbitrary for day keys "1"–"31"
    const dayKeyArb = fc.stringMatching(/^([1-9]|[12]\d|3[01])$/);
    // Arbitrary for values: boolean or non-negative integer
    const valueArb = fc.oneof(fc.boolean(), fc.integer({ min: 0, max: 10000 }));
    // Arbitrary for data map
    const dataArb = fc.dictionary(dayKeyArb, valueArb);
    // Arbitrary for month (YYYY-MM)
    const monthArb = fc.tuple(
      fc.integer({ min: 2020, max: 2030 }),
      fc.integer({ min: 1, max: 12 })
    ).map(([y, m]) => `${y}-${String(m).padStart(2, '0')}`);

    // Validates: Requirements 10.2
    fc.assert(
      fc.property(dataArb, monthArb, (data, month) => {
        const record = makeRecord(data);
        const rate = completionRate(record, month);
        return rate >= 0 && rate <= 100;
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: personal-habit-tracker, Property 10: Streak non-negativity and monotonicity
describe('Property 10: streak is non-negative and adding a contiguous day increments by 1', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('streak is always non-negative', () => {
    vi.useFakeTimers();
    mockToday(2025, 7, 15);

    const dayKeyArb = fc.stringMatching(/^([1-9]|[12]\d|3[01])$/);
    const valueArb = fc.oneof(fc.boolean(), fc.integer({ min: 0, max: 10000 }));
    const dataArb = fc.dictionary(dayKeyArb, valueArb);

    // Validates: Requirements 10.3
    fc.assert(
      fc.property(dataArb, (data) => {
        const s = streak(makeRecord(data));
        return s >= 0;
      }),
      { numRuns: 100 }
    );
  });

  it('adding a day contiguous with the current streak increments streak by exactly 1', () => {
    // Validates: Requirements 10.3
    // Generate a "today" between 2 and 28 so we can always add a day before it
    const todayArb = fc.integer({ min: 2, max: 28 });
    // Generate a streak length between 1 and (today - 1)
    const streakSetup = todayArb.chain((today) =>
      fc.integer({ min: 1, max: today - 1 }).map((streakLen) => ({ today, streakLen }))
    );

    fc.assert(
      fc.property(streakSetup, ({ today, streakLen }) => {
        vi.useFakeTimers();
        mockToday(2025, 7, today);

        // Build a record with `streakLen` consecutive days ending at today
        const data = {};
        for (let d = today - streakLen + 1; d <= today; d++) {
          data[String(d)] = true;
        }
        const before = streak(makeRecord(data));

        // The day just before the streak starts
        const newDay = today - streakLen;
        if (newDay < 1) {
          vi.useRealTimers();
          return true; // can't extend further back than day 1 — skip
        }

        // Add the contiguous day
        data[String(newDay)] = true;
        const after = streak(makeRecord(data));

        vi.useRealTimers();
        return after === before + 1;
      }),
      { numRuns: 100 }
    );
  });
});
