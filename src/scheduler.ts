// Scheduler composable — runtime-injected by the host. Spaces import
// `useScheduler` from `@construct-space/sdk`; at build time it's
// externalized and resolved at runtime to the host's implementation
// in `construct-app/frontend/composables/useScheduler.ts`.
//
// The scheduler is the host primitive for time-based dispatch. Pulses,
// Calendar reminders, Mail snooze, send-later, system jobs — all use
// this one API. See construct-app/docs/plans/2026-05-20-automations.md.

import type {
  ScheduledTask,
  ScheduledTaskInput,
  ScheduledTaskUpdate,
  ScheduledTaskListInput,
  ScheduledClaim,
  ScheduledClaimInput,
  ScheduledReportInput,
  ScheduledFireEvent,
} from './types/scheduler'

export type Unsubscribe = () => void

/**
 * Scheduler client returned by `useScheduler()`. All mutating methods
 * route through the host bridge, which enforces that the caller-space
 * (read from its manifest) matches the task's `ownerSpace` — so a space
 * can only create / edit / delete its own tasks.
 *
 * The `onFire` channel is filtered identically: the handler receives
 * only events for tasks whose `ownerSpace` matches the caller.
 *
 * Cross-space inspection of scheduled tasks (e.g. Settings →
 * Automations) is host-only authority and not part of the SDK.
 */
export interface Scheduler {
  /** Create a scheduled task. Server computes `nextRunAt` from `schedule`. */
  create(input: ScheduledTaskInput): Promise<ScheduledTask>

  /** List the caller-space's tasks. Pass `due: true` to get only ready-to-fire, unclaimed tasks. */
  list(filter?: ScheduledTaskListInput): Promise<ScheduledTask[]>

  /** Fetch one task by id. */
  get(id: string): Promise<ScheduledTask>

  /** Partial update. Server recomputes `nextRunAt` if `schedule` changes. */
  update(id: string, patch: ScheduledTaskUpdate): Promise<ScheduledTask>

  /** Toggle enabled flag. Cheaper than `update` and never re-validates the schedule. */
  toggle(id: string, enabled: boolean): Promise<ScheduledTask>

  /** Delete the task and any active claim. */
  cancel(id: string): Promise<void>

  /** Fire the task on the next tick regardless of `nextRunAt`. */
  runNow(id: string): Promise<ScheduledTask>

  /**
   * Atomically claim a due task. Returns 409-equivalent rejection
   * (thrown error with `code: 'already_claimed'`) when another device
   * holds the claim. Claim expires after ~60s; the reclaim loop frees
   * it automatically if the device disappears mid-run.
   */
  claim(id: string, input: ScheduledClaimInput): Promise<ScheduledClaim>

  /**
   * Report execution outcome. Server updates `state`, computes the next
   * `nextRunAt`, and releases the claim. One-shot tasks auto-disable.
   * After 5 consecutive errors the task is paused.
   */
  report(id: string, input: ScheduledReportInput): Promise<ScheduledTask>

  /**
   * Subscribe to live wake events. Host filters by `ownerSpace` so each
   * caller only sees events for its own tasks. Fires as soon as a task
   * becomes due; polling via `list({ due: true })` is the reconnect-time
   * fallback when the WS drops.
   *
   * Returns an unsubscribe function.
   *
   * Note: the bridge layer trusts callers to pass their own space id —
   * the same trust model `space.run_action` uses. Spoofing another
   * space's id would surface its events but couldn't actually claim
   * them (the claim endpoint is user-scoped, not space-scoped — and
   * cross-space claims happen all the time by design).
   */
  onFire(ownerSpace: string, handler: (event: ScheduledFireEvent) => void): Unsubscribe
}

export declare function useScheduler(): Scheduler

// Re-export the types so spaces can `import type { Schedule } from '@construct-space/sdk'`
// without going through the nested path.
export type {
  Schedule,
  ScheduledAction,
  ScheduledNotify,
  ScheduledOutcome,
  ScheduledTask,
  ScheduledTaskInput,
  ScheduledTaskUpdate,
  ScheduledTaskListInput,
  ScheduledClaim,
  ScheduledClaimInput,
  ScheduledReportInput,
  ScheduledFireEvent,
} from './types/scheduler'
