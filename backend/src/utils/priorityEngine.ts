import { TaskStatus } from '../models/Task';

/**
 * Computes the number of whole days between two dates using Math.floor.
 * Result is positive when `to` is after `from`, negative when before.
 */
function wholeDays(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

/**
 * Computes the numeric priority score for a task.
 *
 * Formula: priorityScore = (daysLeft * -2) + (taskAge * 1.5)
 *   - daysLeft: whole days from `now` to `dueDate` (negative if overdue)
 *   - taskAge:  whole days from `createdAt` to `now`
 *
 * @param dueDate   - The task's due date
 * @param createdAt - The date the task was created
 * @param now       - The reference "current" date (defaults to new Date())
 */
export function computePriorityScore(
  dueDate: Date,
  createdAt: Date,
  now: Date = new Date()
): number {
  const daysLeft = wholeDays(now, dueDate);
  const taskAge = wholeDays(createdAt, now);
  return daysLeft * -2 + taskAge * 1.5;
}

/**
 * Maps a numeric priority score to a categorical priority level.
 *
 * Thresholds:
 *   score < -10          → 'High'
 *   -10 <= score < 10    → 'Medium'
 *   score >= 10          → 'Low'
 */
export function computePriorityLevel(score: number): 'High' | 'Medium' | 'Low' {
  if (score < -10) return 'High';
  if (score < 10) return 'Medium';
  return 'Low';
}

/**
 * Convenience helper that computes all derived task fields in one call.
 *
 * @param task  - Object with `dueDate`, `createdAt`, and `status`
 * @param now   - The reference "current" date (defaults to new Date())
 * @returns `{ priorityScore, priorityLevel, isOverdue }`
 */
export function computeTaskFields(
  task: { dueDate: Date; createdAt: Date; status: TaskStatus },
  now: Date = new Date()
): { priorityScore: number; priorityLevel: 'High' | 'Medium' | 'Low'; isOverdue: boolean } {
  const priorityScore = computePriorityScore(task.dueDate, task.createdAt, now);
  const priorityLevel = computePriorityLevel(priorityScore);
  const isOverdue = task.dueDate < now && task.status !== 'Done';
  return { priorityScore, priorityLevel, isOverdue };
}
