/**
 * Runtime-injected composables that aren't already declared in `composables.ts`
 * or `utils.ts`. Spaces import these from `@construct-space/sdk`; at build
 * time the package is externalized and at runtime references rewrite to
 * `window.__CONSTRUCT__['@construct-space/sdk'].<name>`.
 *
 * **If you find yourself reimplementing a host helper** (CSV export, font
 * loading, downloads, theme reading) — stop. Check this file first. The
 * host already ships one; importing it keeps spaces small and consistent.
 *
 * Type signatures here are deliberately permissive where the host
 * implementation is rich. The aim is to let imports compile and provide
 * enough shape to be useful; tighten per-call-site as needed.
 */

import type { Ref, ComputedRef, Component } from 'vue'

// ─── Toasts (transient inline feedback — distinct from useNotification) ───

export interface Toast {
  success(message: string, opts?: { description?: string; duration?: number }): void
  error(message: string, opts?: { description?: string; duration?: number }): void
  info(message: string, opts?: { description?: string; duration?: number }): void
  warning(message: string, opts?: { description?: string; duration?: number }): void
}

export declare function useToast(): Toast

// `notify` (bare function) was removed in v2 — call
// `useNotification().add({ title, ... })` instead.

// ─── Theme (host owns dark/light + CSS vars; rarely read directly) ────────

export interface AppTheme {
  mode: ComputedRef<'light' | 'dark'>
  /** Resolved CSS variable values, indexed by token name without the `--app-` prefix. */
  vars: ComputedRef<Record<string, string>>
}

export declare function useAppTheme(): AppTheme

// `useTheme` was the legacy alias of `useAppTheme` and is gone in v2.
// Spaces should import `useAppTheme` directly.

// ─── Skills, Spaces, Marketplace ──────────────────────────────────────────

export interface SkillSummary {
  id: string
  name: string
  category?: string
  description?: string
  spaceId?: string
  keywords?: string[]
  toolNames?: string[]
  hookTypes?: string[]
  isLoaded?: boolean
}

export declare function useSkills(): {
  skills: Readonly<Ref<Array<SkillSummary & {
    state?: 'unloaded' | 'loading' | 'active' | 'disabled' | 'error'
    version?: string
    source?: string
  }>>>
  hooks: Readonly<Ref<unknown[]>>
  isLoading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string | null>>
  /** Compatibility alias over `skills`, kept for spaces written against SDK 2.0. */
  list: ComputedRef<SkillSummary[]>
  byId(id: string): SkillSummary | undefined
  listSkills(): Promise<void>
  getSkill(skillId: string): Promise<SkillSummary | null>
  loadSkill(skillId: string): Promise<boolean>
  unloadSkill(skillId: string): Promise<boolean>
  enableSkill(skillId: string): Promise<boolean>
  disableSkill(skillId: string): Promise<boolean>
  getSummaries(): Promise<SkillSummary[]>
  searchSkills(query: Record<string, unknown>): Promise<{ matches: unknown[]; totalCount: number; query: string }>
  findRelevantSkills(query: string, limit?: number): Promise<unknown[]>
  refresh(): Promise<void>
}

export interface SpaceSummary {
  id: string
  name: string
  description?: string
  icon?: string
  scopes?: Array<'app' | 'org'>
  projectAware?: boolean
  version?: string
  isInstalled?: boolean
}

export interface SpaceConfig {
  name: string
  displayName: string
  description: string
  icon: string
  pages: Array<{ path: string; label: string; icon?: string; default?: boolean }>
  navigation: { label: string; icon: string; to: string; order: number }
  scopes?: Array<'app' | 'org'>
  projectAware?: boolean
  version?: string
  author?: string
  isInstalled?: boolean
}

export declare function useSpaces(): {
  spaces: Ref<SpaceConfig[]>
  loading: Ref<boolean>
  loadSpaces(): Promise<void>
  hasSpace(spaceName: string): boolean
  getSpace(spaceName: string): SpaceConfig | undefined
  /** Compatibility alias over `spaces`, kept for spaces written against SDK 2.0. */
  installed: ComputedRef<SpaceSummary[]>
  byId(id: string): SpaceSummary | undefined
}

// ─── Cross-space actions ──────────────────────────────────────────────────
//
// Every installed space registers its `actions` export with the host as a
// callable provider — the same surface the agent invokes via
// `space_run_action`. `callSpaceAction` lets one space invoke another's
// action by id, so domains stay encapsulated: the calendar asks `meet` to
// `createMeeting` rather than reaching into meet's graph with a duck-typed
// model.
//
//   import { callSpaceAction } from '@construct-space/sdk'
//
//   const { url } = await callSpaceAction<{ id: string; url: string }>(
//     'meet', 'createMeeting', { title, scheduled_at: startIso },
//   )
//
// The host runs the action against the *target* space's own graph schema,
// applies the target space's permission gates, and validates required
// params. The target space need not be open or active — installed is
// enough; its bundle is lazy-loaded on first call.

/** One action as advertised by a space, for discovery before calling it. */
export interface SpaceActionInfo {
  /** Action id — the second argument to `callSpaceAction`. */
  id: string
  /** One-line description (the same docstring the agent sees). */
  description: string
  /** JSON-schema-ish params object: `{ type, properties, required? }`. */
  params: { type: 'object'; properties: Record<string, unknown>; required?: string[] }
}

/**
 * Invoke another installed space's action by id and return its unwrapped
 * result. Rejects if the space has no registered actions, the action id is
 * unknown, a required param is missing, the caller lacks the target's
 * permission, or the action itself throws — the rejection message carries
 * the host's error string.
 *
 * `R` is the action's return type; supply it for type-safe destructuring.
 */
export declare function callSpaceAction<R = unknown>(
  spaceId: string,
  actionId: string,
  payload?: Record<string, unknown>,
): Promise<R>

/**
 * List the actions an installed space advertises, without running any.
 * Returns `[]` when the space is unknown or exposes no actions. Reads from
 * manifest metadata, so it does not force the target bundle to load.
 */
export declare function listSpaceActions(spaceId: string): Promise<SpaceActionInfo[]>

export interface RemoteSpaceSummary extends SpaceSummary {
  display_name?: string
  author?: string
  category?: string
  downloads?: number
  updated_at?: string
}

export interface InstalledSpaceSummary extends SpaceSummary {
  display_name?: string
  enabled: boolean
  installed_at: string
  has_update: boolean
  latest_version?: string
}

export declare function useSpaceMarketplace(): {
  installed: Ref<InstalledSpaceSummary[]>
  remote: Ref<RemoteSpaceSummary[]>
  filteredRemote: ComputedRef<RemoteSpaceSummary[]>
  isLoading: Ref<boolean>
  isCheckingUpdates: Ref<boolean>
  searchQuery: Ref<string>
  activeCategory: Ref<string>
  activeScope: Ref<string>
  error: Ref<string | null>
  currentPage: Ref<number>
  totalPages: Ref<number>
  totalSpaces: Ref<number>
  pageSize: Ref<number>
  fetchRemote(page?: number): Promise<void>
  searchRemote(query: string, category?: string): Promise<void>
  /** Compatibility helper that calls `searchRemote()` and returns the current filtered results. */
  search(query: string): Promise<SpaceSummary[]>
  goToPage(page: number): Promise<void>
  fetchInstalled(): Promise<void>
  install(id: string): Promise<boolean>
  uninstall(id: string): Promise<boolean>
  update(id: string): Promise<boolean>
  enable(id: string): void
  disable(id: string): void
  checkUpdates(): Promise<void>
  isInstalled(id: string): boolean
  hasUpdate(id: string): boolean
}

// ─── Space tool CLI ───────────────────────────────────────────────────────

export interface SpaceToolRunOptions {
  stdin?: string
  /** Working directory for the tool; must be inside the installed .space dir. */
  cwd?: string
  /** Wall-clock timeout in milliseconds. Host clamps to its safety max. */
  timeoutMs?: number
}

export interface SpaceToolResult {
  stdout: string
  stderr: string
  code: number
  timedOut: boolean
  stdoutTruncated: boolean
  stderrTruncated: boolean
}

export interface SpaceToolHandle {
  name: string
  spaceId: string
  invoke(args?: string[], opts?: SpaceToolRunOptions): Promise<SpaceToolResult>
  run(args?: string[], opts?: SpaceToolRunOptions): Promise<SpaceToolResult>
  resolve(): Promise<string>
}

/**
 * Run a first-party CLI shipped in `<space-id>.space/tools/<platform>/`.
 *
 * The host executes the selected tool with:
 * - `SPACE_DIR` = installed `<space-id>.space`
 * - `SPACE_TOOLS` = `tools/<platform>`
 * - `SPACE_LIB` = `lib/<platform>`
 * - `SPACE_LIB_ROOT` = `lib`
 * - `CONSTRUCT_SPACE_ID` and `CONSTRUCT_PLATFORM`
 * - `PATH` prefixed with `SPACE_LIB` and `SPACE_TOOLS`
 */
export declare function useSpaceTool(name: string, options?: { spaceId?: string }): SpaceToolHandle

// ─── Desktop file facades ─────────────────────────────────────────────────

export interface LocalDirectoryPickerOptions {
  title?: string
  defaultPath?: string
}

/** Open a host-mediated directory picker. Returns null when cancelled. */
export declare function pickLocalDirectory(options?: LocalDirectoryPickerOptions): Promise<string | null>

/** Convert an absolute local file path into a webview-safe media URL. */
export declare function resolveLocalFileUrl(path: string, protocol?: string): string

// ─── Billing + credits ────────────────────────────────────────────────────

export interface CreditsState {
  pool: Ref<unknown | null>
  packages: Ref<unknown[]>
  transactions: Ref<unknown[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  balance: ComputedRef<number>
  isLowCredits: ComputedRef<boolean>
  fetchCredits(): Promise<unknown>
  fetchBalance(): Promise<{ balance: number }>
  fetchPackages(): Promise<unknown[]>
  purchaseCredits(request: Record<string, unknown>): Promise<string>
  fetchTransactions(limit?: number, offset?: number): Promise<unknown[]>
  formatCredits(amount: number | null | undefined): string
  formatPrice(cents: number, currency?: string): string
  refresh(): Promise<void>
}

export declare function useCredits(): CreditsState

export interface BillingState {
  subscription: Ref<unknown | null>
  plans: Ref<unknown[]>
  invoices: Ref<unknown[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  isSubscribed: ComputedRef<boolean>
  isTrialing: ComputedRef<boolean>
  trialDaysRemaining: ComputedRef<number>
  currentPlan: ComputedRef<{ slug?: string; name?: string } | null>
  monthlyPrice: ComputedRef<number>
  /** Compatibility aliases over `currentPlan` and `subscription`. */
  plan: ComputedRef<string | null>
  status: ComputedRef<string | null>
  fetchPlans(): Promise<unknown[]>
  fetchSubscription(): Promise<unknown | null>
  createCheckout(planSlug: string, successUrl: string, cancelUrl: string): Promise<string>
  createCreditCheckout(productId: string, successUrl: string, cancelUrl: string): Promise<string>
  createPortalSession(returnUrl: string): Promise<string>
  cancelSubscription(): Promise<void>
  fetchInvoices(): Promise<unknown[]>
  formatPrice(cents: number, currency?: string): string
  openPortal(): Promise<void>
}

export declare function useBilling(): BillingState

// ─── App menu + context menus ─────────────────────────────────────────────

export interface AppMenuItem {
  id: string
  label: string
  icon?: string
  onClick?: () => void
  children?: AppMenuItem[]
}

export declare function useAppMenu(): {
  register(items: AppMenuItem[]): void
  unregister(): void
}

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  /**
   * Click handler. The host invokes `onSelect ?? onClick`, so either field
   * works; `onSelect` is the canonical name (it matches the host's native
   * menu) and `onClick` is kept as an alias. Set one of them.
   */
  onSelect?: () => void | Promise<void>
  onClick?: () => void | Promise<void>
}

export declare function useContextMenus(): {
  open(items: ContextMenuItem[], at: { x: number; y: number }): void
  registerContributor(context: string, fn: (target: unknown) => ContextMenuItem[]): () => void
}

export declare function showContextMenu(items: ContextMenuItem[], at: { x: number; y: number }): void

// ─── Construct app integration (host-only; no-ops in browser builds) ──────

export declare function useConstructConfig(): {
  graphUrl: ComputedRef<string>
  apiUrl: ComputedRef<string>
  profileId: ComputedRef<string | null>
}

export declare function getConstructRuntime(): {
  isDesktop: boolean
  isBrowser: boolean
  version: string
}

export declare function useConstructAuth(): {
  /** Trigger the host's login flow. */
  signIn(): Promise<void>
  /** Sign out and clear host-injected credentials. */
  signOut(): Promise<void>
}

export declare function useConstructWindow(): {
  close(): void
  minimize(): void
  maximize(): void
  isMaximized: Ref<boolean>
}

export declare function useUpdater(): {
  check(): Promise<{ available: boolean; version?: string }>
}

export declare function useUserModule(): {
  current(): { role: string; capabilities: string[] }
}

export declare function useContextDB(): {
  /** Get a Dexie-style DB scoped to this space. */
  get(name: string): unknown
}

export declare function useDeepLink(): {
  /** Subscribe to deep-link events targeting this space. */
  onLink(handler: (url: string) => void): () => void
}

export declare function useDraggableWindow(): {
  /** Make a node a window drag region in the desktop shell. */
  bind(el: HTMLElement | null): void
}

/**
 * Per-account avatar button rendered on the host sidebar's space-panel
 * face. Multi-account spaces (Mail, Calendar, …) use this to surface
 * quick-switchers in the same vertical strip the host already shows.
 */
export interface SpaceAccountItem {
  id: string
  label: string         // tooltip text (usually the email or display name)
  route: string         // navigate target when clicked
  avatar?: string       // photo URL; falls back to `fallback` when missing
  fallback: string      // 1-2 char initials
  active?: boolean      // true when this account is the currently selected one
}

export declare function useSidebar(): {
  /**
   * Replace the per-account avatar row on the space-panel. Pass an
   * empty array to hide it. The row renders ABOVE the regular page
   * items registered via `enterSpace`.
   */
  setSpaceAccounts(items: SpaceAccountItem[]): void
}

// ─── AI model picker (host-curated) ───────────────────────────────────────

export interface AIModelInfo {
  id: string
  name: string
  vision: boolean
  contextWindow: number
}

export interface AIModelOption {
  id: string
  label: string
  providerId: string
  providerLabel: string
  authType: 'oauth' | 'api' | 'local'
  capabilities?: string[]
  active: boolean
}

export interface AIProviderInfo {
  id: string
  label: string
  authType?: 'oauth' | 'api' | 'local'
  active?: boolean
  icon?: string
  models: Array<{ id: string; label: string; capabilities?: string[] }>
}

export declare function useAIModel(): {
  providers: Ref<AIProviderInfo[]>
  allModels: ComputedRef<AIModelOption[]>
  modelsByProvider: ComputedRef<Array<{ provider: AIProviderInfo; models: Array<AIProviderInfo['models'][number] & { compositeId: string }>; icon: string; authType: 'oauth' | 'api' | 'local' }>>
  defaultModelId: Ref<string>
  currentModel: ComputedRef<AIModelOption | undefined>
  currentProvider: ComputedRef<AIProviderInfo | null | undefined>
  loading: Ref<boolean>
  initialized: Ref<boolean>
  setDefaultModel(compositeId: string): void
  resolveModelId(modelId: string, options?: Record<string, unknown>): string
  isAutoModelId(modelId?: string | null): boolean
  isVisionModel(modelId: string): boolean
  loadProviders(retries?: number, preferredProviderId?: string, options?: Record<string, unknown>): Promise<void>
  ensureConstructProvider(): Promise<void>
  init(): Promise<void>
  resetForActiveProfile(nextProfileId?: string): void
  syncActiveProfileState(): void
  getModelId(compositeId: string): string
  getProviderId(compositeId: string): string
  /** Compatibility aliases over `allModels` and `defaultModelId`. */
  available: ComputedRef<AIModelInfo[]>
  active: Ref<string>
  setActive(id: string): void
}

export declare function isVisionModel(modelId: string): boolean

// ─── Keyboard shortcuts ───────────────────────────────────────────────────

export interface ShortcutBinding {
  id: string
  default: string
  override?: string
  /** Human label for the settings UI. */
  label: string
}

export declare const SHORTCUT_REGISTRY: Record<string, ShortcutBinding>

export declare function useShortcutStore(): {
  bindings: ComputedRef<ShortcutBinding[]>
}

export declare function getKey(id: string): string
export declare function setKey(id: string, accelerator: string): void
export declare function resetKey(id: string): void
export declare function resetAll(): void
export declare function hasOverride(id: string): boolean
export declare function exportJson(): string
export declare function importJson(json: string): void

// Pin helpers (createFolderPin / createLinkPin / createPagePin /
// createProjectPin / createSpacePin / createTaskPin) are declared in
// stores.ts — import them from there or from the package root.

// ─── Storage migration helpers (one-shot, legacy migration) ───────────────

export declare function migrateFromLocalStorage(): Promise<void>
export declare function migratePinnedItems(): Promise<void>

// ─── Project store (legacy — kept for older space code that still
// reads project context off the host's Pinia store). New spaces should
// flow project context through manifest-declared inputs/actions, but
// the symbol stays exported so existing pickers keep working until
// they're migrated. Removed-then-restored in 2.0.1 after audit found
// real consumers. ────────────────────────────────────────────────────

export declare function useProjectStore(): {
  currentProject: Ref<{ id: string; name: string; path: string } | null>
  loading: Ref<boolean>
  projects?: Ref<unknown[]>
  loadProjects?(): Promise<void>
}

/** Legacy alias of `useProjectStore` — both refer to the same Pinia store. */
export declare function usePanelsStore(): ReturnType<typeof useProjectStore>

// `navigateTo` (imperative wrapper around vue-router) was removed in v2.
// Use `useNavigator()` — same API but reactive and space-scoped, so
// `nav.to('/foo')` stays inside the calling space's mount tree instead
// of jumping to the app root.

// ─── Brain client ─────────────────────────────────────────────────────────
//
// Replaces the legacy `useOperator` API. Spaces talk to brain (the Go
// sidecar that replaced operator on 1.1.x) for two things:
//
//   1. Agent-session RPC (request/stream/isReady) — what custom space UIs
//      use to drive their own chat loops, push tool results, etc.
//   2. LLM completion (complete/chat) — what space *actions* use to run
//      tier-routed model calls mid-execution. The host resolves `tier`
//      ('small' | 'medium' | 'large') to a provider+model via the user's
//      tier config, so the space picks the cost bucket and the user picks
//      the slot.
//
// Permission for (2): the space's manifest must declare `<space-id>:brain`
// in `permissions.catalog`. If the action that calls `brain.complete` /
// `brain.chat` is in `permissions.actions`, the action must be granted
// that permission. Calling without the grant throws `BrainPermissionDenied`
// synchronously.
//
// Tier defaults: the enclosing action's `tier:` field sets the default
// for any brain call inside `run`. Each call may override per-request.
//
//   import { useBrain } from '@construct-space/sdk'
//
//   summarizeThread: {
//     description: 'Summarize an email thread',
//     tier: 'small',
//     params: { threadId: { type: 'string', required: true } },
//     async run({ threadId }) {
//       const brain = useBrain()
//       if (!brain) return { error: 'brain unavailable' }
//       const body = await loadThread(threadId)
//       const { text } = await brain.complete({ prompt: `Summarize:\n${body}` })
//       return { summary: text }
//     },
//   }

import type { BrainCompleteRequest, BrainChatRequest, BrainResponse } from './types/brain'

export interface BrainClient {
  // ─── Agent-session RPC ───
  request<T = unknown>(type: string, payload?: unknown): Promise<T>
  stream<T = unknown>(type: string, payload?: unknown, onEvent?: (e: T) => void): Promise<void>
  isReady(): boolean

  // ─── LLM completion (tier-routed) ───
  /**
   * One-shot completion. `tier` defaults to the enclosing action's declared
   * tier, then to `'medium'`. Resolves provider+model host-side via
   * `useTierConfig`.
   */
  complete(req: BrainCompleteRequest): Promise<BrainResponse>
  /**
   * Full chat — multi-turn or system+user shape. Same tier semantics as
   * `complete`.
   */
  chat(req: BrainChatRequest): Promise<BrainResponse>
}

/**
 * Host-injected brain client. Returns null when running outside the
 * desktop shell (web preview, headless dev). Spaces that need brain
 * should guard with `if (!brain) return` rather than assuming presence.
 */
export declare function useBrain(): BrainClient | null

/**
 * Send a tool result back to brain mid-turn — used by spaces that handle
 * tool calls themselves (e.g. host-side `ask_user`, custom UI tools).
 */
export declare function postToolResponse(toolUseId: string, result: unknown): Promise<void>

// ─── Components re-exported through SDK for convenience ───────────────────
//
// For most components, import from `@construct-space/ui` directly — that's
// the canonical surface. These three are wired through the SDK because they
// have host-shared state (modal stacking, panel sizing, toolbar slots).

export declare const ConfirmationModal: Component
export declare const SplitPane: Component
export declare const ToolbarSlot: Component
