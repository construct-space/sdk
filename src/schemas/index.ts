/**
 * @construct-space/sdk/schemas
 *
 * Zod schemas for validating space manifests, activities, and common types.
 */

import { z } from 'zod/v4'

// ─── Manifest Schemas ────────────────────────────────────────────────────────

export const spaceNavigationSchema = z.object({
  label: z.string().min(1),
  icon: z.string().optional(),
  order: z.int().optional(),
})

export const spacePageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().min(1),
  icon: z.string().optional(),
  default: z.boolean().optional(),
})

export const spaceToolbarItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().optional(),
  action: z.string().optional(),
})

export const spaceToolbarConfigSchema = z.object({
  items: z.array(spaceToolbarItemSchema).optional(),
})

export const spaceWidgetManifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  defaultSize: z.string().regex(/^\d+x\d+$/),
  sizes: z.record(z.string().regex(/^\d+x\d+$/), z.string()),
})

/** Legacy flat permission row — kept for back-compat. */
export const spacePermissionLegacySchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/, {
    message: 'permission key must be dotted lowercase, e.g. "folder.create"',
  }),
  label: z.string().min(1),
  description: z.string().optional(),
})

/** Catalog entry in the modern object-form permissions block. */
export const spacePermissionCatalogEntrySchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/, {
    message: 'permission id must be "<space-id>:<key>", e.g. "mail:write" or "mail:brain"',
  }),
  label: z.string().min(1),
  description: z.string().optional(),
  group: z.string().optional(),
})

export const spaceAbacBindingSchema = z.object({
  memberModel: z.string().min(1),
  ownerField: z.string().min(1),
  userField: z.string().optional(),
  roleField: z.string().optional(),
  roles: z.array(z.string().min(1)).nonempty(),
})

export const spacePermissionsObjectSchema = z.object({
  actions: z.record(z.string(), z.string()).optional(),
  catalog: z.array(spacePermissionCatalogEntrySchema).optional(),
  abac: z.record(z.string(), spaceAbacBindingSchema).optional(),
})

/** Either form is accepted. New spaces use the object form. */
export const spacePermissionsSchema = z.union([
  spacePermissionsObjectSchema,
  z.array(spacePermissionLegacySchema),
])

/** Public alias for the legacy row — older callers import this name. */
export const spacePermissionSchema = spacePermissionLegacySchema

export const spaceManifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
  description: z.string().optional(),
  icon: z.string().optional(),
  scopes: z.array(z.enum(['app', 'org'])).nonempty().optional(),
  projectAware: z.boolean().optional(),
  permissions: spacePermissionsSchema.optional(),
  navigation: spaceNavigationSchema.optional(),
  pages: z.array(spacePageSchema).optional(),
  toolbar: spaceToolbarConfigSchema.optional(),
  agent: z.string().optional(),
  skills: z.array(z.string()).optional(),
  actions: z.string().optional(),
  widgets: z.array(spaceWidgetManifestSchema).optional(),
}).refine(
  m => {
    const p = m.permissions
    if (!p) return true
    // org gate only applies to actual permission grants; brain:call counts
    // as a permission too. Accept any non-empty permissions block when
    // scopes includes 'org'.
    let hasContent: boolean
    if (Array.isArray(p)) {
      hasContent = p.length > 0
    } else {
      hasContent = !!(p.actions || (p.catalog && p.catalog.length > 0))
    }
    return !hasContent || !!m.scopes?.includes('org')
  },
  { message: 'permissions are only valid when scopes includes "org"', path: ['permissions'] },
)

export type SpaceManifestInput = z.input<typeof spaceManifestSchema>

// ─── Activity Schemas ────────────────────────────────────────────────────────

export const activitySchema = z.object({
  id: z.int().optional(),
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  entity_type: z.string().optional(),
  entity_id: z.int().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().optional(),
})

export type ActivityInput = z.input<typeof activitySchema>

// ─── Common Schemas ──────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.int().min(1).default(1),
  per_page: z.int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationInput = z.input<typeof paginationSchema>

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
    error: z.string().optional(),
  })

// ─── Validation Helpers ──────────────────────────────────────────────────────

export function validateManifest(data: unknown) {
  return spaceManifestSchema.safeParse(data)
}

export function validateActivity(data: unknown) {
  return activitySchema.safeParse(data)
}

export function validateWidgetManifest(data: unknown) {
  return spaceWidgetManifestSchema.safeParse(data)
}
