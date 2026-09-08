/**
 * Brain composable — lets a space action call the LLM mid-execution.
 *
 *   const brain = useBrain()
 *   const { text } = await brain.complete({
 *     prompt: 'Summarize this email thread:\n' + body,
 *     tier: 'small',     // optional; defaults to the action's declared tier
 *   })
 *
 * The host resolves `tier` → concrete provider+model via the user's tier
 * config. The space cannot pin a specific model id; it picks the bucket,
 * the user owns the slot.
 *
 * Permission: the space must request `<space-id>:brain` (or grant the
 * `brain:call` permission through its catalog). Without that, useBrain
 * throws `BrainPermissionDenied` synchronously on the first call.
 */
import type { Tier } from './tier'

export interface BrainMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface BrainCompleteRequest {
  /** The prompt to send. Treated as a single user turn. */
  prompt: string
  /**
   * Tier hint. Defaults to the enclosing action's declared `tier`. If the
   * action did not declare one, defaults to `'medium'`.
   */
  tier?: Tier
  /** Hard cap on output tokens. Host applies a sensible default if omitted. */
  maxTokens?: number
  /**
   * Sampling temperature. Most spaces should leave this unset and let the
   * host pick a tier-appropriate default (small → cooler, large → warmer).
   */
  temperature?: number
  /**
   * Optional system instruction. Prepended ahead of the user prompt. Keep
   * it short — the host already sets a base system frame.
   */
  system?: string
  /** AbortSignal for cancellation. */
  signal?: AbortSignal
}

export interface BrainChatRequest {
  /** Conversation so far. Order matters; last message must be `role:'user'`. */
  messages: BrainMessage[]
  /** Same semantics as `BrainCompleteRequest.tier`. */
  tier?: Tier
  /** Same semantics as `BrainCompleteRequest.system`. */
  system?: string
  maxTokens?: number
  temperature?: number
  signal?: AbortSignal
}

export interface BrainResponse {
  /** The model's text output, with any wrapping `<think>` blocks stripped. */
  text: string
  /** Echo of the tier that was actually used after host resolution. */
  tier: Tier
  /** Provider id (e.g. 'anthropic', 'construct', 'openrouter'). */
  provider: string
  /** Concrete model id the host resolved (e.g. 'claude-haiku-4-5'). */
  model: string
  /** Token usage, when the provider reports it. */
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  /** Wall-clock duration in milliseconds. */
  elapsedMs: number
  /** Reason completion stopped. */
  finishReason: 'stop' | 'length' | 'error' | 'cancelled'
}

/**
 * The LLM-completion half of the host-injected brain client. Live methods
 * on `BrainClient` (see `runtime.ts`). Spaces don't import this interface
 * directly; it's spelled out here so the request/response types stay
 * grouped with the rest of the brain contract.
 */
export interface BrainCompleter {
  /** One-shot prompt. */
  complete(req: BrainCompleteRequest): Promise<BrainResponse>
  /** Full chat — multi-turn or system+user shape. */
  chat(req: BrainChatRequest): Promise<BrainResponse>
}

/**
 * Thrown when an action calls a brain method without the required permission
 * grant. The host throws synchronously on the first method call so the
 * action's `run` can fall back gracefully.
 */
export class BrainPermissionDenied extends Error {
  readonly code = 'BRAIN_PERMISSION_DENIED'
  constructor(spaceId: string) {
    super(`Space "${spaceId}" must declare the "brain:call" permission to use useBrain()`)
    this.name = 'BrainPermissionDenied'
  }
}
