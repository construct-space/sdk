// Scheduler types — shared between the SDK (public API for spaces) and
// the host composable that implements them. Mirrors the wire shape of
// /api/scheduler/* in api/source.
//
// Design: construct-app/docs/plans/2026-05-20-automations.md

/**
 * A schedule defines *when* a task fires. Same shape across host, SDK,
 * and api/source — devices never interpret schedules; the server does.
 *
 * `timezone` is an IANA name ("Europe/Tirane", "America/New_York", …).
 * Empty defaults to UTC. Always carry the timezone alongside any
 * wall-clock value — Construct convention is "store UTC, schedule in
 * local."
 */
export type Schedule =
  | { kind: 'interval'; everyMinutes: number; timezone?: string }
  | { kind: 'daily'; time: string /* 'HH:mm' */; timezone?: string }
  | { kind: 'weekly'; weekdays: number[] /* 0=Sun … 6=Sat */; time: string; timezone?: string }
  | { kind: 'once'; at: string /* ISO8601 */; timezone?: string }

/**
 * A notification a scheduled action wants delivered when it fires.
 *
 * Attach this to a `ScheduledAction` as `notify` to make the task
 * **host-fired**: the desktop fires it app-wide (toast + durable bell +
 * optional sound) as soon as it's due and the app is running — no `onFire`
 * handler or mounted page required. This is how alarms / reminders ring even
 * when the owning space isn't open. Tasks without `notify` are delivered to
 * the owning space's `onFire` handler instead (the space runs them itself).
 */
export interface ScheduledNotify {
  /** Notification title (required). */
  title: string
  /** Body / subtitle. */
  body?: string
  /** Notification type tag, e.g. `clock.alarm`. Defaults to `scheduled.notify`. */
  type?: string
  /** Originating space id, surfaced in the bell. Defaults to `scheduler`. */
  source?: string
  /** Play an audible chime on fire. */
  sound?: boolean
}

/**
 * The action a task fires. Opaque to the scheduler service; the owning
 * space interprets it on `onFire`. Conventionally tagged `<space>.<verb>`
 * (e.g. `pulses.run`, `calendar.notifyReminder`, `mail.sendLater`).
 *
 * Set `notify` to have the host fire a notification app-wide when the task is
 * due (see {@link ScheduledNotify}); omit it to handle the fire yourself via
 * `useScheduler().onFire`.
 */
export interface ScheduledAction {
  kind: string
  notify?: ScheduledNotify
  [key: string]: unknown
}

/**
 * Outcome of a single fire reported by the executing device. `quiet`
 * means "task ran, nothing changed" — surfaces in activity but never
 * generates a user-visible notification.
 */
export type ScheduledOutcome = 'success' | 'quiet' | 'error'

/**
 * A scheduled task as returned by the API. State is an opaque blob the
 * owning space writes to (via `report`) and reads as needed; the
 * scheduler additionally maintains bookkeeping fields inside it
 * (`lastRunAt`, `lastOutcome`, `lastSuccessAt`, `consecutiveErrors`,
 * `lastError`) — spaces can read these without parsing their own state.
 */
export interface ScheduledTask {
  id: string
  ownerKind: 'user' | 'org' | 'system'
  ownerId: string
  ownerSpace: string
  ownerEntityId?: string
  title: string
  schedule: Schedule
  action: ScheduledAction
  enabled: boolean
  nextRunAt?: string
  state?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/** Payload accepted by `scheduler.create()`. */
export interface ScheduledTaskInput {
  /**
   * Owning space id. Bridge enforces this matches the caller's manifest;
   * a space can only create tasks tagged with its own id.
   */
  ownerSpace: string
  /** Optional FK into the owning space (pulse id, event id, …). */
  ownerEntityId?: string
  title: string
  schedule: Schedule
  action: ScheduledAction
  /** Defaults to true. */
  enabled?: boolean
  /**
   * Override first-fire time. Without this, server computes from
   * `schedule`. Useful for "run on next tick" creates.
   */
  nextRunAt?: string
}

/** Partial update payload — undefined fields stay unchanged. */
export type ScheduledTaskUpdate = Partial<ScheduledTaskInput>

/** Filter for `scheduler.list()`. */
export interface ScheduledTaskListInput {
  /** Restrict to a single owner space. Without it, returns tasks across all spaces the caller created. */
  ownerSpace?: string
  /** Filter by owner_entity_id (e.g. all reminders for one event). */
  ownerEntityId?: string
  /** Enabled / disabled / either. */
  enabled?: boolean
  /**
   * When true: returns only tasks ready to fire right now and not
   * already claimed by another device. The executor side uses this
   * to poll on reconnect.
   */
  due?: boolean
}

/** Result of a successful claim. */
export interface ScheduledClaim {
  taskId: string
  scheduledFor: string
  /** When the claim expires; another device may pick up the task after this. */
  expiresAt: string
}

/** Payload for `scheduler.claim()`. */
export interface ScheduledClaimInput {
  /** Stable identifier for this Construct install. */
  deviceId: string
  /**
   * The `scheduledFor` time the device saw. Optional — defaults to
   * the task's current `nextRunAt` on the server.
   */
  scheduledFor?: string
}

/** Payload for `scheduler.report()`. */
export interface ScheduledReportInput {
  deviceId: string
  outcome: ScheduledOutcome
  /** When outcome is 'error'. */
  error?: string
  /**
   * Opaque state the space wants persisted on the task. The server
   * shallow-merges this into `task.state`, then layers its own
   * bookkeeping fields on top.
   */
  state?: Record<string, unknown>
}

/**
 * Event delivered to `scheduler.onFire(handler)` when one of the
 * caller-space's tasks becomes due. Pure wake hint — the device still
 * needs to call `claim` to atomically reserve the run.
 */
export interface ScheduledFireEvent {
  taskId: string
  ownerSpace: string
  scheduledFor: string
  action: ScheduledAction
}
