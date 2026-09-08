/**
 * Org entity shapes. Mirror of the host types in
 * `construct-app/frontend/types/org.ts` — duplicated so the SDK has no
 * runtime host dependency. Keep in sync when the host shape changes.
 */

export interface Organization {
  id: string
  name: string
  slug: string
  icon: string
  owner_id: string
  developer_status: string
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  name: string
  email: string
  avatar: string
  title: string
  phone: string
  bio: string
  role: string
  role_id: string | null
  status: 'active' | 'invited' | 'suspended' | string
  department_id: string | null
  joined_at: string
  last_active_at: string
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  org_id: string
  name: string
  description: string
  code: string
  head_id: string | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  org_id: string
  name: string
  description: string
  department_id: string | null
  lead_id: string | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: number
  team_id: string
  member_id: string
  joined_at: string
}

export interface OrgRole {
  id: string
  org_id: string
  name: string
  description: string
  is_builtin: boolean
  created_at: string
  updated_at: string
}
