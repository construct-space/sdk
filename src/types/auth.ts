// Authentication types — what a space sees about the signed-in user.
//
// Login / register / reset flows live in the host. Spaces never see
// passwords or tokens — by the time a space mounts, `auth.user` is
// already populated.

export interface AuthUser {
  /** UUID — the canonical cross-service user identifier (use this in row stamps, ACL grants, etc.). */
  id: string
  email: string
  username?: string
  first_name?: string
  last_name?: string
  /** Display name — `first_name + last_name` when present, else username. */
  name?: string
  avatar?: string
  last_login?: string
  created_at: string
  updated_at: string
}

export type UserStatus = 'active' | 'inactive' | 'suspended'
