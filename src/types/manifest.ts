// Space Manifest types (extracted from SpaceLoader)

export interface SpaceManifest {
  id: string
  name: string
  version: string
  description?: string
  icon?: string
  /**
   * Where this space can be installed. `'app'` = personal install;
   * `'org'` = org install (enables RBAC via the manifest `permissions[]`).
   * A space listing both can be installed in either context.
   */
  scopes?: Array<'app' | 'org'>
  /**
   * Permissions the space gates. Two halves:
   *
   *  - `catalog`: the set of permission ids this space exposes, shown to
   *    org admins in the role editor and to users in the install prompt.
   *  - `actions`: maps each action name from `src/actions.ts` to the
   *    catalog permission required to invoke it via the agent.
   *  - `abac`: optional per-resource ACL bindings (member/role tables)
   *    for fine-grained sharing inside the space.
   *
   * `'<space-id>:brain'` is the conventional permission id that grants
   * `useBrain()` access from inside an action. Declare it in `catalog`
   * for any space whose actions call the LLM.
   *
   * The legacy flat `SpacePermission[]` form is still accepted by older
   * tooling; new spaces should use the structured form.
   */
  permissions?: SpacePermissions | SpacePermission[]
  /**
   * `true` if this space also mounts inside projects (project-aware
   * navigation, project-scoped agent context). Orthogonal to `scopes`.
   */
  projectAware?: boolean
  navigation?: SpaceNavigation
  pages?: SpacePage[]
  toolbar?: SpaceToolbarConfig
  contextMenus?: Record<string, ManifestContextMenuItem[]>
  /** Path to `agent/config.md`. */
  agent?: string
  /** Paths to `agent/skills/*.md`. */
  skills?: string[]
  /** Path to `src/actions.ts` (relative to space root). */
  actions?: string
  widgets?: SpaceWidgetManifest[]
}

export interface SpacePermissions {
  /**
   * Maps action name → required permission id from `catalog`. If an action
   * is omitted, the agent can invoke it without a permission check.
   */
  actions?: Record<string, string>
  /** The permissions this space exposes. */
  catalog?: SpacePermissionCatalogEntry[]
  /** Optional ABAC bindings keyed by resource model name. */
  abac?: Record<string, SpaceAbacBinding>
}

export interface SpacePermissionCatalogEntry {
  /** Full id including the space prefix, e.g. `mail:write`, `mail:brain`. */
  id: string
  /** Shown in the install prompt + role editor. */
  label: string
  /** Optional — helps admins understand what they're granting. */
  description?: string
  /** Optional grouping label for the role editor UI. */
  group?: string
}

export interface SpaceAbacBinding {
  /** Name of the ACL model holding (resource_id, user_id, role) rows. */
  memberModel: string
  /** Foreign-key field on the ACL model pointing at the resource. */
  ownerField: string
  /** Field that stores the user id. Default `'user_id'`. */
  userField?: string
  /** Field that stores the role. Default `'role'`. */
  roleField?: string
  /** Role ladder; first = lowest privilege. */
  roles: readonly string[]
}

/**
 * Legacy flat permission shape — kept so older manifests still type-check.
 * New spaces should use `SpacePermissions` instead.
 *
 * @deprecated Use `SpacePermissions` (the object form with catalog + actions).
 */
export interface SpacePermission {
  key: string
  label: string
  description?: string
}

export interface SpaceWidgetManifest {
  id: string
  name: string
  description?: string
  icon?: string
  defaultSize: string
  sizes: Record<string, string> // e.g. { "2x1": "./widgets/example/2x1.vue", "4x2": "./widgets/example/4x2.vue" }
}

export interface ManifestContextMenuAction {
  type: 'host.navigate' | 'space.open' | 'space.request'
  spaceId?: string
  page?: string
  mode?: 'push' | 'replace'
  requestType?: string
  params?: Record<string, unknown>
  query?: Record<string, string>
}

export interface ManifestContextMenuItem {
  id?: string
  label?: string
  icon?: string
  type?: 'item' | 'separator' | 'submenu'
  disabled?: boolean
  shortcut?: string
  children?: ManifestContextMenuItem[]
  action?: ManifestContextMenuAction
}

export interface SpaceNavigation {
  label: string
  icon?: string
  order?: number
}

export interface SpacePage {
  id: string
  name: string
  path: string
  icon?: string
  default?: boolean
}

export interface SpaceToolbarConfig {
  items?: SpaceToolbarItem[]
}

export interface SpaceToolbarItem {
  id: string
  label: string
  icon?: string
  action?: string
}
