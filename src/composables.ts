// Composable return-type declarations
// Runtime implementations are provided by the Construct host app

import type { Ref, ComputedRef } from 'vue'
import type { Role, Permission, PermissionCheck } from './types/authorization'
import type { User } from './types/user'
import type { Organization, OrgMember, Department, Team, TeamMember, OrgRole } from './types/org'

// ─── useDelivery ────────────────────────────────────────────────────────────
//
// Transactional email from inside a space. v1: every space sends From the
// shared construct.delivery domain — no per-user DNS setup, no key in the
// bundle. The host wires auth (gateway session in browser, cat_ Bearer in
// the desktop app) before forwarding to delivery-api's POST /api/emails.
//
// Two ways to call: a single object, or a chainable builder for cases
// where the body is composed from a template loop.
//
//   const email = useDelivery()
//
//   await email.send({
//     to:      'someone@example.com',
//     subject: 'Welcome',
//     html:    '<p>Hi!</p>',
//   })
//
// Every email is wrapped in Construct branded chrome (mark + footer).
// Layout is not configurable — the host owns brand consistency across
// every space's outbound mail. Use `space` to set the wordmark next to
// the mark (e.g. "Notes", "Weather").
//
//   await email.message()
//     .to('someone@example.com')
//     .subject('Welcome')
//     .html('<p>Hi!</p>')
//     .tag('welcome')
//     .send()

export interface DeliveryMessageInput {
  /**
   * From address, optional. Defaults to "Construct <noreply@construct.delivery>"
   * when omitted. Custom domains require the user to verify them at
   * /api/delivery/domains first; until then the From must be on the shared
   * Construct-owned domain.
   */
  from?: string
  to: string
  subject: string
  html?: string
  text?: string
  headers?: Record<string, string>
  tags?: string[]
  /**
   * Wordmark text shown next to the Construct mark in the branded layout
   * (e.g. "Weather", "Notes"). Auto-uppercased server-side. Defaults to
   * "Construct" when omitted. Layout itself is fixed — every space's
   * outbound mail uses the Construct-branded chrome.
   */
  space?: string
  /**
   * File attachments. Each `content` is base64-encoded — easiest path in
   * a browser is `btoa()` over a binary string, or strip the data-URL
   * prefix from `FileReader.readAsDataURL`. Server caps: 10 files,
   * 10 MB each, 15 MB total decoded.
   */
  attachments?: DeliveryAttachment[]
}

export interface DeliveryAttachment {
  /** Filename shown to the recipient (e.g. "INV-2026-001.pdf"). */
  filename: string
  /** MIME type. Defaults to application/octet-stream when omitted. */
  content_type?: string
  /** Base64-encoded payload. */
  content: string
}

export interface DeliveryMessageResponse {
  id: string
  status: string
  created_at: string
}

// ─── Notification payload (used by useNotification.send) ───────────────────

export interface SelfNotifyInput {
  /**
   * Headline shown in the bell + push surface. Required.
   */
  title: string
  /**
   * Optional body — preview text under the title.
   */
  body?: string
  /**
   * Notification type (e.g. "chat.mention", "board.assigned"). Defaults to
   * "self.message". Used by the recipient's notification prefs for muting.
   */
  type?: string
  /**
   * Originating service / space (e.g. "chat", "board"). Defaults to "self".
   */
  source?: string
  /**
   * Optional deep link to open when the notification is clicked.
   */
  link?: string
  /**
   * Free-form metadata stored alongside the notification (rendering hints,
   * IDs the recipient surface can use to navigate, etc.).
   */
  data?: Record<string, unknown>
}

export interface SelfNotifyResponse {
  id: string | number
  status: string
  created_at: string
  /** True when delivery skipped the row because the user's prefs muted this type. */
  skipped?: boolean
  /** When skipped is true, the reason ("type muted", etc.). */
  reason?: string
}

export interface DeliveryMessageBuilder {
  from(addr: string): DeliveryMessageBuilder
  to(addr: string): DeliveryMessageBuilder
  subject(s: string): DeliveryMessageBuilder
  html(s: string): DeliveryMessageBuilder
  text(s: string): DeliveryMessageBuilder
  header(key: string, value: string): DeliveryMessageBuilder
  tag(name: string): DeliveryMessageBuilder
  space(name: string): DeliveryMessageBuilder
  /** Attach a file. `content` must be base64. See DeliveryAttachment. */
  attach(att: DeliveryAttachment): DeliveryMessageBuilder
  /** Materialize the accumulated message and POST it. */
  send(): Promise<DeliveryMessageResponse>
  /** Read-only snapshot of the accumulated payload. Useful for testing. */
  toJSON(): DeliveryMessageInput
}

export declare function useDelivery(): {
  /** Send a single transactional email. */
  send(message: DeliveryMessageInput): Promise<DeliveryMessageResponse>
  /** Start an empty message; chain setters then call .send(). */
  message(): DeliveryMessageBuilder
  /** Look up a previously-sent message by id (queued / sent / bounced / etc.). */
  get(id: string): Promise<DeliveryMessageResponse>
}

// ─── useNotification ────────────────────────────────────────────────────────
//
// Fire one notification into the current user's inbox. That's it. The
// host owns the bell, the inbox UI, mark-read, push enrollment, prefs,
// multi-window sync — spaces don't touch any of that.
//
// Sending to *other* users is a service-only operation and not exposed
// here; this is always self-scoped via the auth context.
//
//   const notif = useNotification()
//
//   await notif.send({
//     title: 'Folder shared with you',
//     body:  'Flak shared "Marketing 2026"',
//     type:  'drive.share',
//     link:  '/folders/123',
//   })
//
// The host writes the row, fans it out to every signed-in surface, and
// emails the user when their prefs allow. The space stays out of it.

export declare function useNotification(): {
  /** Fire one notification into the current user's inbox. */
  send(input: SelfNotifyInput): Promise<SelfNotifyResponse>
}

// ─── useOrg ─────────────────────────────────────────────────────────────────
//
// Basic org context for org-scoped spaces. Collapses useOrgStore +
// useAuthStore reaches into one read surface. No auto-fetch — these
// bits land during app boot.

export declare function useOrg(): {
  /** Current org id, or null when the user isn't in an org. */
  orgId: ComputedRef<string | null>
  /** Display name. */
  orgName: ComputedRef<string | null>
  /** Full record (slug, icon, owner, timestamps) once hydrated. */
  currentOrg: ComputedRef<Organization | null>
  /** True when the user is in an org context (vs personal). */
  isOrg: ComputedRef<boolean>
  /** Role strings from /api/me/scope: ['owner'|'admin'|'developer'|…]. */
  roles: ComputedRef<string[]>
  /** Convenience gate for admin UIs. */
  isAdmin: ComputedRef<boolean>
  /** True while the first org fetch is in flight. */
  loading: ComputedRef<boolean>
  /** Force a refresh of the org + member/team/etc caches. */
  refresh(): Promise<void>
}

// ─── useOrgMembers ──────────────────────────────────────────────────────────
//
// Read slice of the host's org store for org-scoped spaces (assignee
// pickers, mentions, approvals). Auto-fetches on first call; reactive
// roster stays shared across all callers so duplicate /org/members
// round-trips don't happen.

export declare function useOrgMembers(): {
  /** Reactive roster. Empty array until the initial fetch resolves. */
  members: ComputedRef<OrgMember[]>
  /** True while a fetch is in flight. */
  loading: ComputedRef<boolean>
  /** Current org id, or null when the user isn't in an org. */
  orgId: ComputedRef<string | null>
  /** Convenience: members.length without pulling the array. */
  memberCount: ComputedRef<number>
  /** Lookup by the org-scoped member id. */
  byId(id: string): OrgMember | null
  /** Lookup by the underlying accounts user id. */
  byUserId(userId: string): OrgMember | null
  /** Force a fresh fetch (e.g. after inviting a new member). */
  refresh(): Promise<void>
}

// ─── useOrgTeams ────────────────────────────────────────────────────────────
//
// Teams + team-member resolution for "assign to team", filter-by-team
// views, and per-team dashboards.

export declare function useOrgTeams(): {
  /** Reactive list of teams in the current org. */
  teams: ComputedRef<Team[]>
  /** Raw team↔member join rows. Prefer membersOf(teamId). */
  teamMembers: ComputedRef<TeamMember[]>
  /** True while a fetch is in flight. */
  loading: ComputedRef<boolean>
  /** Team count. */
  teamCount: ComputedRef<number>
  /** Lookup a team by id. */
  byId(id: string): Team | null
  /** Resolved OrgMember list for a given team. */
  membersOf(teamId: string): OrgMember[]
  /** Teams a given member belongs to. */
  teamsOf(memberId: string): Team[]
  /** Force a fresh fetch. */
  refresh(): Promise<void>
}

// ─── useOrgDepartments ──────────────────────────────────────────────────────
//
// Departments + member⇄department lookups for group headers, filters,
// and per-department dashboards.

export declare function useOrgDepartments(): {
  /** Reactive list of departments. */
  departments: ComputedRef<Department[]>
  /** True while a fetch is in flight. */
  loading: ComputedRef<boolean>
  /** Department count. */
  departmentCount: ComputedRef<number>
  /** Lookup by id. */
  byId(id: string): Department | null
  /** Department of a given member (null if unassigned). */
  ofMember(memberId: string): Department | null
  /** All members in a department. */
  membersOf(deptId: string): OrgMember[]
  /** Force a fresh fetch. */
  refresh(): Promise<void>
}

// ─── useOrgRoles ────────────────────────────────────────────────────────────
//
// Role *catalog* for the current org — list roles, look one up, find
// which role a member has. This is read-only metadata: name, id, label.
//
// Permission evaluation is dynamic and lives elsewhere:
//   • useAuthorization() — RBAC: can(action, resource), canEdit(...), hasRole(...)
//   • useAccess<T>()     — ABAC: per-resource ACL on a space's own model

export declare function useOrgRoles(): {
  /** All roles defined in the current org (builtin + custom). */
  roles: ComputedRef<OrgRole[]>
  /** True while a fetch is in flight. */
  loading: ComputedRef<boolean>
  /** Lookup by role id. */
  byId(id: string): OrgRole | null
  /** Lookup by human-readable name (e.g. "owner", "admin"). */
  byName(name: string): OrgRole | null
  /** Role assigned to a given member by role_id. */
  ofMember(memberId: string): OrgRole | null
  /** Force a fresh fetch. */
  refresh(): Promise<void>
}

// ─── useAuth ────────────────────────────────────────────────────────────────

export declare function useAuth(): ReturnType<typeof import('./stores').useAuthStore>

// ─── useAuthorization ───────────────────────────────────────────────────────
//
// RBAC. One question: "can my role do X on Y?". Argument order matches
// useAccess — always (action, resource) — so the two surfaces read the same.
//
//   const { can, canEdit, hasRole } = useAuthorization()
//   can('edit', 'project')         // Ref<boolean>
//   canEdit('project')             // sugar for can('edit', 'project')
//   hasRole('admin')               // Ref<boolean>
//
// For per-resource sharing (e.g. "can this user open *this* folder"),
// use useAccess<T>() instead — that's ABAC, bound to a model's ACL table.

export declare function useAuthorization(): {
  // Core checks — reactive
  can(action: string, resource: string, resourceId?: string | number): Ref<boolean>
  canSync(action: string, resource: string): boolean
  canAny(checks: Array<{ action: string; resource: string }>): Ref<boolean>
  canAll(checks: Array<{ action: string; resource: string }>): Ref<boolean>

  // CRUD sugar — the four gates spaces actually render
  canView(resource: string): Ref<boolean>
  canCreate(resource: string): Ref<boolean>
  canEdit(resource: string): Ref<boolean>
  canDelete(resource: string): Ref<boolean>

  // Role inspection
  roles: Ref<Role[]>
  hasRole(role: string): Ref<boolean>
  hasPermission(permissionName: string): Ref<boolean>
}

// ─── useAccess ──────────────────────────────────────────────────────────────
//
// ABAC composable. Bound at model-definition time via the `acl:` block
// in defineModel(). Reads grants from the space's own ACL model (e.g.
// FolderMember) — no global access table.
//
// Convention: an empty member set = open to org. Adding a member row
// restricts the resource to listed users; clearing all rows opens it
// back to org-wide. Only user-keyed principals in v1.

export interface AccessMember {
  user_id: string
  role: string
  granted_at?: string
  granted_by?: string
}

export declare function useAccess<T = unknown>(): {
  // ── Decisions ──
  can(action: string, resource: T): Ref<boolean>
  canSync(action: string, resource: T): boolean
  filter(action: string, items: T[]): Ref<T[]>
  decide(action: string, items: T[]): Ref<Map<string, boolean>>

  // ── Membership reads ──
  members(resource: T): Ref<AccessMember[]>
  isOrgWide(resource: T): Ref<boolean>
  isRestricted(resource: T): Ref<boolean>
  hasAccess(resource: T, userId: string): Ref<boolean>
  roleOf(resource: T, userId: string): Ref<string | null>
  hasRoleAtLeast(resource: T, role: string): Ref<boolean>

  // ── Mutations ──
  grant(resource: T, userId: string, role: string): Promise<void>
  revoke(resource: T, userId: string): Promise<void>
  setRole(resource: T, userId: string, role: string): Promise<void>
  openToOrg(resource: T): Promise<void>
  transferOwnership(resource: T, toUserId: string): Promise<void>
}

// ─── useHttp ────────────────────────────────────────────────────────────────
//
// Full HTTP client for spaces — typed verbs (get/post/put/patch/delete/head),
// JSON in and out by default, query params, headers, timeouts, abort,
// interceptors, retry, baseUrl, scoped instances. Cross-origin requests
// route through the host's Tauri command (Rust + reqwest) so CORS is not
// a problem; web hosts fall back to native fetch.
//
// One client = the SDK's HTTP surface. Spaces should NOT bring axios,
// ky, ofetch, dio, etc.
//
//   const http = useHttp()
//   const user = await http.get<User>('/api/me')
//   await http.post('/api/notes', { title: 'Hello' })
//
//   // Scoped instance for a third-party API
//   const stripe = http.create({
//     baseUrl: 'https://api.stripe.com/v1',
//     headers: { Authorization: `Bearer ${key}` },
//   })
//   await stripe.get('/charges', { params: { limit: 10 } })

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface HttpRequestConfig {
  /** Method override (when calling `.request()` directly). */
  method?: HttpMethod
  /** Path or absolute URL. Joined with `baseUrl` if present and not absolute. */
  url?: string
  /** Query string params. Arrays repeat the key; null/undefined are skipped. */
  params?: Record<string, string | number | boolean | null | undefined | Array<string | number>>
  /** Per-request headers. Merged over the client's defaults. */
  headers?: Record<string, string>
  /**
   * Request body. Auto-serialized: plain objects → JSON, FormData / Blob /
   * Uint8Array / string passed through. Set `responseType: 'bytes'` to
   * receive raw response bytes (binary downloads).
   */
  data?: unknown
  /** Timeout in milliseconds. Default 15000. */
  timeoutMs?: number
  /**
   * `'json'` (default) parses the response body as JSON.
   * `'text'` returns the raw string.
   * `'bytes'` returns a `Uint8Array` for binary downloads.
   * `'blob'` returns a `Blob`.
   */
  responseType?: 'json' | 'text' | 'bytes' | 'blob'
  /** AbortSignal for cancellation. */
  signal?: AbortSignal
  /**
   * Retry policy. `0` disables. With `retries: 3` the request is attempted
   * up to 4 times total with exponential backoff (capped). Only idempotent
   * methods + 5xx / network errors retry by default.
   */
  retries?: number
  /** Override the auto-retry predicate. */
  shouldRetry?(err: HttpError, attempt: number): boolean
  /**
   * When true (default), non-2xx responses throw `HttpError`. Set to false
   * to receive every response and inspect `status` yourself.
   */
  throwOnError?: boolean
}

export interface HttpResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  /** The fully-resolved URL the request actually hit. */
  url: string
}

export interface HttpError extends Error {
  status?: number
  statusText?: string
  data?: unknown
  headers?: Record<string, string>
  url?: string
  config?: HttpRequestConfig
  /** True when caused by `AbortSignal` cancellation. */
  cancelled?: boolean
  /** True when no HTTP response was received (network down, DNS, timeout). */
  isNetworkError?: boolean
}

export interface HttpInterceptors {
  /** Mutate or replace the request config before it goes out. */
  request: {
    use(fn: (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>): number
    eject(id: number): void
  }
  /** Inspect or transform the response on the way back. */
  response: {
    use(
      onFulfilled?: (res: HttpResponse) => HttpResponse | Promise<HttpResponse>,
      onRejected?: (err: HttpError) => unknown,
    ): number
    eject(id: number): void
  }
}

export interface HttpClientDefaults {
  /** Prepended to non-absolute request URLs. */
  baseUrl?: string
  /** Headers merged into every request. `Content-Type` is set automatically. */
  headers?: Record<string, string>
  /** Default timeout. */
  timeoutMs?: number
  /** Default retry count for idempotent requests. */
  retries?: number
  /** Default response parse mode. */
  responseType?: HttpRequestConfig['responseType']
}

export interface HttpClient {
  /** Verb shortcuts. All return parsed body as `T`; throws on non-2xx. */
  get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  head<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  options<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>

  /** Same as the verb shortcuts, but returns the full HttpResponse<T>. */
  request<T = unknown>(config: HttpRequestConfig): Promise<HttpResponse<T>>

  /** Spawn a scoped client with its own defaults + interceptors. */
  create(defaults?: HttpClientDefaults): HttpClient

  /** Mutate this client's defaults (baseUrl, headers, retries, timeout). */
  defaults: HttpClientDefaults

  /** Request / response interceptors. */
  interceptors: HttpInterceptors

  /** Type guard — narrows unknown errors to HttpError. */
  isHttpError(err: unknown): err is HttpError
}

/**
 * Full HTTP client. Use this — do not bring axios / ky / ofetch / dio.
 *
 * Routes via the host's Tauri command (reqwest) so CORS is bypassed when
 * the space hits third-party origins; falls back to native fetch on web.
 * JSON in / JSON out by default; binary, FormData, abort, retry, and
 * interceptors all supported.
 */
export declare function useHttp(): HttpClient

// ─── useSpaceShortcuts ──────────────────────────────────────────────────────

export interface SpaceShortcut {
  id?: string
  key: string
  label: string
  group?: string
  when?: () => boolean
  onPress: () => void
}

export declare function useSpaceShortcuts(shortcuts: SpaceShortcut[]): void

// ─── useLocalStorage ────────────────────────────────────────────────────────
//
// Per-space, per-profile persistent KV. IndexedDB-backed, namespaced by
// space id so two spaces can't collide on the same key. Survives reloads.
// Use this for view prefs, last-opened-tab, pinned-item ids — UI state
// the model doesn't need. For shared/typed data, use @construct-space/graph.

export declare function useLocalStorage(): {
  get<T = unknown>(key: string): Promise<T | null>
  set<T = unknown>(key: string, value: T): Promise<void>
  has(key: string): Promise<boolean>
  del(key: string): Promise<void>
  keys(): Promise<string[]>
  clear(): Promise<void>
}

// ─── useStorage ─────────────────────────────────────────────────────────────
//
// File storage. Your space's root is `{space_id}/<path>` — pick whatever
// path you want inside it. Two spaces cannot read each other's files;
// `..` segments are rejected.
//
// Uploads go via presign + direct PUT by default; `proxy: true` routes
// bytes through the host for tiny files / strict CSP contexts.

export interface UploadOptions {
  /**
   * Path inside this space's storage area (e.g. "reports/q1.pdf").
   * Auto-derived from the file name when omitted. Leading slashes are
   * stripped; `..` segments are rejected.
   */
  path?: string
  contentType?: string
  /** Route bytes through the host instead of direct PUT. */
  proxy?: boolean
}

export interface UploadResult {
  /** Public or signed URL — depending on bucket policy. */
  url: string
  /** Path within this space's scope (what you passed / what was generated). */
  path: string
}

export interface PresignOptions {
  path?: string
  contentType?: string
  ttlSeconds?: number
}

export interface PresignResult {
  /** Presigned PUT URL — client uploads directly to R2. */
  url: string
  /** GET URL the recipient can use afterwards. */
  publicUrl: string
  path: string
  expiresAt?: string
}

export interface SignedUrlOptions {
  path: string
  ttlSeconds?: number
}

export interface ListOptions {
  /** Filter to paths starting with this prefix (within the space's scope). */
  prefix?: string
  limit?: number
  cursor?: string
}

export interface ListResult {
  items: Array<{ path: string; size: number; modified_at: string }>
  cursor?: string
}

export interface CopyOptions {
  from: string
  to: string
}

export declare function useStorage(): {
  loading: Ref<boolean>
  error: Ref<string | null>

  upload(file: Blob | File, opts?: UploadOptions): Promise<UploadResult>
  presign(opts?: PresignOptions): Promise<PresignResult>
  signedUrl(opts: SignedUrlOptions): Promise<string>
  download(path: string): Promise<Blob>
  delete(path: string): Promise<void>
  list(opts?: ListOptions): Promise<ListResult>
  copy(opts: CopyOptions): Promise<void>
  exists(path: string): Promise<boolean>
}


// ─── Routing — useNavigator (GetX-style) ────────────────────────────────────
//
// One composable for navigation inside the space's own pages. Verb-first,
// terse, and awaitable. Modeled after Flutter GetX.
//
//   const nav = useNavigator()
//
//   nav.to('/folders/123')                       // push
//   nav.off('/list')                             // replace current
//   nav.offAll('/home')                          // clear stack + push
//   nav.back()                                   // pop
//   nav.back('selected-value')                   // pop with result
//   const picked = await nav.to('/picker')       // pickers: awaits back(result)
//   nav.until(r => r.path === '/home')           // pop until predicate
//
//   nav.current.value     // Ref<SpaceRoute>
//   nav.params.value      // route params (/detail/:id → { id: '42' })
//   nav.query.value       // query string params
//   nav.arguments.value   // free-form args passed to last nav

export interface SpaceRoute {
  readonly path: string
  readonly hash: string
  readonly query: Record<string, string | (string | null)[] | null | undefined>
  readonly fullPath: string
  readonly params: Record<string, string | string[]>
  readonly name: string | symbol | null | undefined
  readonly meta: Record<string, unknown>
}

/** Options accepted by `to`, `off`, `offAll`, `toNamed`, etc. */
export interface NavigateOptions {
  /** Hash to set on the target route (e.g. '#boards'). */
  hash?: string
  /** Query string params. Null/undefined values are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>
  /**
   * Free-form arguments — passed through to the destination and exposed
   * as `nav.arguments.value` there. Survives push/replace but not refresh.
   */
  arguments?: unknown
}

export interface Navigator {
  // ── Reactive route state ──────────────────────────────────────────────
  /** Current route inside this space — reactive. */
  current: Ref<SpaceRoute>
  /** Path params (e.g. `/detail/:id` → `{ id: '42' }`). Reactive. */
  params: ComputedRef<Record<string, string>>
  /** Query string. Reactive. */
  query: ComputedRef<Record<string, string>>
  /** Free-form args from the last navigate call. */
  arguments: ComputedRef<unknown>

  /**
   * Push a path. Returns a promise that resolves with the value passed
   * to `back(result)` when this route is popped — useful for pickers.
   */
  to<T = unknown>(path: string, opts?: NavigateOptions): Promise<T | undefined>
  /** Replace the current route (no new history entry). */
  off(path: string, opts?: NavigateOptions): Promise<void>
  /** Pop everything, then push. Use after a flow completes → home. */
  offAll(path: string, opts?: NavigateOptions): Promise<void>

  /**
   * Pop one entry. Pass `result` to resolve the awaiting `to()` call
   * with that value (picker pattern).
   */
  back<T = unknown>(result?: T): void
  /** Pop until predicate returns true. */
  until(predicate: (route: SpaceRoute) => boolean): void

  /** Browser-style history controls. */
  forward(): void
  go(delta: number): void

  /** True when the current route's path matches `path` exactly. */
  isCurrent(path: string): boolean
}

/**
 * One composable for all navigation. Replaces the prior `useRoute` +
 * `useRouter` + `navigateTo` trio with a single GetX-style surface.
 */
export declare function useNavigator(): Navigator

// ─── useToolbar ─────────────────────────────────────────────────────────────

export interface ToolbarItem {
  id: string
  icon: string
  label: string
  type?: 'action' | 'space' | 'separator' | 'flexible-space' | 'breadcrumb'
  onClick?: () => void
  to?: string
  action?: string
  disabled?: boolean
  active?: boolean
  category?: 'navigation' | 'app' | 'space' | 'utility'
  /**
   * Where this item renders in the host toolbar. Defaults to 'center' (the
   * traditional slot between breadcrumb and the right-side controls). Use
   * 'left' or 'right' to push the item into the corresponding host slot.
   */
  position?: 'left' | 'center' | 'right'
}

export declare function useToolbar(): {
  toolbarItems: ComputedRef<ToolbarItem[]>
  setPageItems(items: ToolbarItem[]): void
  clearPageItems(): void
  searchPlaceholder: ComputedRef<string>
  hasSearchHandler: ComputedRef<boolean>
  setSearch(placeholder: string, handler: (query: string) => void): void
  executeSearch(query: string): void
  isCustomizing: ComputedRef<boolean>
  loading: ComputedRef<boolean>
  registerItem(item: ToolbarItem): void
  toggleCustomize(): void
  initToolbar(): Promise<void>
  clearToolbar(): void
}

// ─── useBreadcrumb ─────────────────────────────────────────────────────────
//
// The space declares its breadcrumb trail; the host renders it in the
// toolbar's left slot. Clicking a crumb fires nav.to(crumb.to).
//
//   const crumbs = useBreadcrumb()
//
//   crumbs.set([
//     { label: 'Drive', to: '/' },
//     { label: 'Marketing 2026', to: '/folders/123' },
//     { label: 'Q1' },                      // current — no `to`
//   ])

export interface Breadcrumb {
  label: string
  icon?: string
  iconColor?: string
  /** Path inside this space. Clicking the crumb calls `nav.to(to)`. */
  to?: string
}

export declare function useBreadcrumb(): {
  /** Current trail — reactive. */
  trail: ComputedRef<Breadcrumb[]>
  /** Replace the whole trail. */
  set(items: Breadcrumb[]): void
  /** Append one crumb. */
  push(item: Breadcrumb): void
  /** Remove + return the last crumb. */
  pop(): Breadcrumb | undefined
  /** Clear the trail. */
  clear(): void
}

// ─── useMediaSession ──────────────────────────────────────────────────────────
//
// Host-owned "now playing" store, surfaced as a persistent mini-player in the
// app title bar. A space that plays audio (podcasts, radio, …) publishes its
// now-playing metadata + transport state here and registers control callbacks;
// the title-bar player stays visible and controllable even after you navigate
// to another space. The host does NOT own the audio element — only the state +
// control routing. The space's audio engine (a module-level Audio singleton)
// keeps playing across navigation on its own.
//
//   const media = useMediaSession()
//   media.setTrack({ spaceId: 'podcasts', page: 'show/123',
//                    title: ep.title, subtitle: show.name, artwork: ep.image })
//   media.registerControls({ toggle, skipForward, skipBack, stop, seek })
//   // on every audio state change:
//   media.publish({ isPlaying: true, position: t, duration: d })
//   // on stop/ended:
//   media.clear()

export interface MediaTrack {
  /** Owning space id — used to navigate back from the title bar. */
  spaceId: string
  /** Page path within the space to return to (optional; defaults to root). */
  page?: string
  title: string
  subtitle?: string
  /** Cover artwork URL. */
  artwork?: string
}

export interface MediaControls {
  toggle?: () => void
  play?: () => void
  pause?: () => void
  skipForward?: () => void
  skipBack?: () => void
  stop?: () => void
  seek?: (seconds: number) => void
}

export interface MediaSessionState {
  track: MediaTrack | null
  isPlaying: boolean
  isBuffering: boolean
  /** Playhead in seconds. */
  position: number
  /** Total duration in seconds once known. */
  duration: number
}

export declare function useMediaSession(): {
  /** Reactive now-playing state (read by the title-bar player). */
  state: MediaSessionState
  /** Set/replace what's playing. */
  setTrack(track: MediaTrack | null): void
  /** Patch transport state (isPlaying/position/duration/…). */
  publish(patch: Partial<MediaSessionState>): void
  /** Register transport callbacks (closures over the space's audio). */
  registerControls(controls: MediaControls): void
  /** Clear the slot + controls (on stop/ended). */
  clear(): void
  toggle(): void
  play(): void
  pause(): void
  skipForward(): void
  skipBack(): void
  stop(): void
  seek(seconds: number): void
}

// ─── usePresenceStatus ────────────────────────────────────────────────────────
//
// The user's self-announced availability (Online / Away / Offline), set from a
// title-bar picker in the host (like the now-playing player) and persisted.
// Spaces (e.g. Chat) read it to broadcast presence and render status dots.
//
//   const { status, setStatus } = usePresenceStatus()
//   setStatus('away')

export type PresenceStatus = 'online' | 'away' | 'offline'

export declare function usePresenceStatus(): {
  /** Reactive current status. */
  status: { value: PresenceStatus }
  /** Set + persist the status. */
  setStatus(s: PresenceStatus): void
}

/** Display metadata (label + dot color) per status. */
export declare const PRESENCE_STATUS_META: Record<PresenceStatus, { label: string; color: string }>
