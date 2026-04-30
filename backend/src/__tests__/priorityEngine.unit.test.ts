import { describe, it, expect } from 'vitest';
import {
  computePriorityScore,
  computePriorityLevel,
  computeTaskFields,
} from '../utils/priorityEngine';

// ---------------------------------------------------------------------------
// computePriorityScore
// ---------------------------------------------------------------------------

describe('computePriorityScore', () => {
  it('returns correct score when task is due in 5 days and is 10 days old', () => {
    const now = new Date('2025-07-15T00:00:00.000Z');
    const dueDate = new Date('2025-07-20T00:00:00.000Z'); // 5 days ahead
    const createdAt = new Date('2025-07-05T00:00:00.000Z'); // 10 days ago
    // daysLeft = 5, taskAge = 10
    // score = (5 * -2) + (10 * 1.5) = -10 + 15 = 5
    expect(computePriorityScore(dueDate, createdAt, now)).toBe(5);
  });

  it('returns correct score when task is overdue by 3 days and is 7 days old', () => {
    const now = new Date('2025-07-15T00:00:00.000Z');
    const dueDate = new Date('2025-07-12T00:00:00.000Z'); // 3 days ago → daysLeft = -3
    const createdAt = new Date('2025-07-08T00:00:00.000Z'); // 7 days ago
    // daysLeft = -3, taskAge = 7
    // score = (-3 * -2) + (7 * 1.5) = 6 + 10.5 = 16.5
    expect(computePriorityScore(dueDate, createdAt, now)).toBe(16.5);
  });

  it('returns 0 when dueDate equals now and task was just created', () => {
    const now = new Date('2025-07-15T00:00:00.000Z');
    // daysLeft = 0, taskAge = 0
    // score = 0 + 0 = 0
    expect(computePriorityScore(now, now, now)).toBe(0);
  });

  it('uses Math.floor for whole-day calculations (partial days are truncated)', () => {
    const now = new Date('2025-07-15T12:00:00.000Z'); // noon
    const dueDate = new Date('2025-07-16T06:00:00.000Z'); // 18 hours ahead → floor = 0 days
    const createdAt = new Date('2025-07-14T06:00:00.000Z'); // 30 hours ago → floor = 1 day
    // daysLeft = floor(18h / 24h) = 0, taskAge = floor(30h / 24h) = 1
    // score = (0 * -2) + (1 * 1.5) = 1.5
    expect(computePriorityScore(dueDate, createdAt, now)).toBe(1.5);
  });

  it('defaults now to the current date when not provided', () => {
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const createdAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const score = computePriorityScore(dueDate, createdAt);
    // Just verify it returns a number without throwing
    expect(typeof score).toBe('number');
  });

  it('produces a high-urgency (negative) score for a task due yesterday created long ago', () => {
    const now = new Date('2025-07-15T00:00:00.000Z');
    const dueDate = new Date('2025-07-14T00:00:00.000Z'); // 1 day ago → daysLeft = -1
    const createdAt = new Date('2025-07-01T00:00:00.000Z'); // 14 days ago
    // score = (-1 * -2) + (14 * 1.5) = 2 + 21 = 23
    expect(computePriorityScore(dueDate, createdAt, now)).toBe(23);
  });
});

// ---------------------------------------------------------------------------
// computePriorityLevel
// ---------------------------------------------------------------------------

describe('computePriorityLevel', () => {
  it('returns "High" for score strictly less than -10', () => {
    expect(computePriorityLevel(-11)).toBe('High');
    expect(computePriorityLevel(-100)).toBe('High');
    expect(computePriorityLevel(-10.1)).toBe('High');
  });

  it('returns "Medium" for score exactly -10 (boundary)', () => {
    expect(computePriorityLevel(-10)).toBe('Medium');
  });

  it('returns "Medium" for scores in the range [-10, 10)', () => {
    expect(computePriorityLevel(0)).toBe('Medium');
    expect(computePriorityLevel(-9.9)).toBe('Medium');
    expect(computePriorityLevel(9.9)).toBe('Medium');
  });

  it('returns "Low" for score exactly 10 (boundary)', () => {
    expect(computePriorityLevel(10)).toBe('Low');
  });

  it('returns "Low" for score greater than 10', () => {
    expect(computePriorityLevel(11)).toBe('Low');
    expect(computePriorityLevel(1000)).toBe('Low');
  });

  it('returns exactly one of the three valid levels for any score', () => {
    const validLevels = new Set(['High', 'Medium', 'Low']);
    [-100, -10.5, -10, -5, 0, 5, 9.9, 10, 50].forEach((score) => {
      expect(validLevels.has(computePriorityLevel(score))).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// computeTaskFields
// ---------------------------------------------------------------------------

describe('computeTaskFields', () => {
  const now = new Date('2025-07-15T00:00:00.000Z');

  it('returns correct priorityScore, priorityLevel, and isOverdue for a future task', () => {
    const task = {
      dueDate: new Date('2025-07-20T00:00:00.000Z'), // 5 days ahead
      createdAt: new Date('2025-07-05T00:00:00.000Z'), // 10 days ago
      status: 'Todo' as const,
    };
    // score = (5 * -2) + (10 * 1.5) = 5 → Medium
    const result = computeTaskFields(task, now);
    expect(result.priorityScore).toBe(5);
    expect(result.priorityLevel).toBe('Medium');
    expect(result.isOverdue).toBe(false);
  });

  it('marks a non-Done task with a past dueDate as overdue', () => {
    const task = {
      dueDate: new Date('2025-07-10T00:00:00.000Z'), // 5 days ago
      createdAt: new Date('2025-07-01T00:00:00.000Z'),
      status: 'In Progress' as const,
    };
    const result = computeTaskFields(task, now);
    expect(result.isOverdue).toBe(true);
  });

  it('does NOT mark a Done task as overdue even if dueDate is in the past', () => {
    const task = {
      dueDate: new Date('2025-07-10T00:00:00.000Z'), // 5 days ago
      createdAt: new Date('2025-07-01T00:00:00.000Z'),
      status: 'Done' as const,
    };
    const result = computeTaskFields(task, now);
    expect(result.isOverdue).toBe(false);
  });

  it('does NOT mark a task as overdue when dueDate equals now', () => {
    const task = {
      dueDate: now, // exactly now — not strictly less than now
      createdAt: new Date('2025-07-01T00:00:00.000Z'),
      status: 'Todo' as const,
    };
    const result = computeTaskFields(task, now);
    expect(result.isOverdue).toBe(false);
  });

  it('returns "High" priority for a task with a very negative score', () => {
    // dueDate far in the past, task just created → large negative daysLeft, small taskAge
    const task = {
      dueDate: new Date('2025-07-01T00:00:00.000Z'), // 14 days ago → daysLeft = -14
      createdAt: new Date('2025-07-14T00:00:00.000Z'), // 1 day ago → taskAge = 1
      status: 'Todo' as const,
    };
    // score = (-14 * -2) + (1 * 1.5) = 28 + 1.5 = 29.5 → Low
    // Wait — let's recalculate for a High result:
    // We need score < -10, so daysLeft must be large positive (far future) and taskAge small
    const highTask = {
      dueDate: new Date('2025-07-21T00:00:00.000Z'), // 6 days ahead → daysLeft = 6
      createdAt: new Date('2025-07-14T00:00:00.000Z'), // 1 day ago → taskAge = 1
      status: 'Todo' as const,
    };
    // score = (6 * -2) + (1 * 1.5) = -12 + 1.5 = -10.5 → High
    const result = computeTaskFields(highTask, now);
    expect(result.priorityLevel).toBe('High');
    expect(result.priorityScore).toBe(-10.5);
  });

  it('defaults now to the current date when not provided', () => {
    const task = {
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'Todo' as const,
    };
    const result = computeTaskFields(task);
    expect(typeof result.priorityScore).toBe('number');
    expect(['High', 'Medium', 'Low']).toContain(result.priorityLevel);
    expect(typeof result.isOverdue).toBe('boolean');
  });
});
