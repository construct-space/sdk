/**
 * Space Actions — the typed contract for entries in `src/actions.ts`.
 *
 * Each export of `actions` is a `SpaceAction`. The agent sees them via
 * `space_list_actions` and invokes them via `space_run_action`. Actions
 * run as plain host-side code (Vue/Tauri context); they can call the
 * Graph, the SDK composables, and — if granted — `useBrain()` for
 * LLM-powered work.
 *
 *   import { useBrain } from '@construct-space/sdk'
 *   import type { SpaceAction } from '@construct-space/sdk'
 *
 *   export const summarizeThread: SpaceAction = {
 *     description: 'Summarize one email thread.',
 *     tier: 'small',          // default tier for any useBrain() calls inside
 *     params: {
 *       threadId: { type: 'string', required: true },
 *     },
 *     async run({ threadId }) {
 *       const thread = await loadThread(threadId)
 *       const brain = useBrain()
 *       const { text } = await brain.complete({ prompt: `Summarize:\n${thread.body}` })
 *       return { summary: text }
 *     },
 *   }
 */
import type { Tier } from './tier'

export type ActionParamType = 'string' | 'number' | 'boolean' | 'object' | 'array'

export interface ActionParam {
  /** JSON-schema-ish primitive type. */
  type: ActionParamType
  /** Shown to the agent as the param's docstring. */
  description?: string
  /** When `true`, agent must supply it. Default `false`. */
  required?: boolean
  /** Enum of allowed values (string params only). */
  enum?: readonly string[]
  /**
   * Default value the host substitutes when the agent omits the param.
   * Only honoured when `required` is falsy.
   */
  default?: unknown
}

export interface SpaceAction<P = Record<string, unknown>, R = unknown> {
  /** One-line description; the *only* docstring the agent sees. */
  description: string
  /**
   * Default tier for any `useBrain()` call made inside `run`. Per-call
   * overrides on `brain.complete({ tier })` win. Omit to inherit `'medium'`.
   *
   * Examples:
   *   summarize  → 'small'   (fast & cheap)
   *   compose    → 'medium'  (balanced)
   *   plan/think → 'large'   (heavy reasoning)
   */
  tier?: Tier
  /** Parameter schema. Keys are param names. */
  params?: Record<string, ActionParam>
  /** Implementation. Receives validated params, returns any JSON-serialisable value. */
  run(params: P): Promise<R> | R
}

/**
 * The full export shape `src/actions.ts` should produce. Each key becomes
 * a tool named `<space-id>.<key>` at the agent layer.
 */
export type SpaceActions = Record<string, SpaceAction>
