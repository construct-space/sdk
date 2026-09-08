/**
 * Model tier — the cost/capability bucket a request belongs to.
 *
 *   small  → fast + cheap; summarisation, classification, short Q&A
 *   medium → balanced; general assistance, code edits, structured output
 *   large  → reasoning-heavy; long-form writing, deep code work, planning
 *
 * The host maps each tier to a concrete provider+model via
 * `useTierConfig` (see Settings → LLM Providers). The user always owns
 * which model fills each slot.
 */
export type Tier = 'small' | 'medium' | 'large'
