// Store return-type declarations
// Runtime implementations are provided by the Construct host app

import type { Ref, ComputedRef } from 'vue'
import type { AuthUser } from './types/auth'
import type { Setting, SettingUpdate } from './types/setting'
import type { EditorSettings } from './types/preference'

// ─── Auth Store ─────────────────────────────────────────────────────────────
//
// Read-only auth state for spaces. The host handles login/logout/refresh;
// by the time a space mounts, `user` is already populated (or null when
// signed out, but spaces should never mount in that case).

export interface AuthStoreState {
  user: AuthUser | null
  isAuthenticated: boolean
  userName: string
  userEmail: string
  userAvatar: string | null
}

export declare function useAuthStore(): AuthStoreState

// ─── Pinned Store ───────────────────────────────────────────────────────────

export interface PinnedItem {
  id: string
  type: 'project' | 'folder' | 'page' | 'space' | 'link' | 'task'
  name: string
  icon: string
  path: string
  color?: string
  metadata?: {
    projectId?: string | number
    localPath?: string
    spaceId?: string
    taskId?: string | number
    description?: string
    priority?: string
    status?: string
  }
  pinnedAt: string
  sortOrder?: number
}

export interface PinnedStoreState {
  items: PinnedItem[]
  pinnedItems: PinnedItem[]
  isPinned(id: string): boolean
  pinnedByType(type: PinnedItem['type']): PinnedItem[]
  pinnedCount: number
  init(): Promise<void>
  addPin(item: Omit<PinnedItem, 'pinnedAt'>): Promise<void>
  removePin(id: string): Promise<void>
  togglePin(item: Omit<PinnedItem, 'pinnedAt'>): Promise<void>
  updatePin(id: string, updates: Partial<PinnedItem>): Promise<void>
  reorder(orderedIds: string[]): Promise<void>
  clearAll(): Promise<void>
  getPin(id: string): PinnedItem | undefined
}

export declare function usePinnedStore(): PinnedStoreState

export declare function createProjectPin(project: { id: string | number; name: string; path: string }): Omit<PinnedItem, 'pinnedAt'>
export declare function createFolderPin(folder: { name: string; path: string }): Omit<PinnedItem, 'pinnedAt'>
export declare function createPagePin(page: { name: string; path: string }): Omit<PinnedItem, 'pinnedAt'>
export declare function createSpacePin(space: { id: string; name: string; icon?: string }): Omit<PinnedItem, 'pinnedAt'>
export declare function createLinkPin(link: { name: string; url: string }): Omit<PinnedItem, 'pinnedAt'>
export declare function createTaskPin(task: { id: string | number; name: string; description?: string; priority?: string; status?: string }): Omit<PinnedItem, 'pinnedAt'>

// ─── Preferences Store ──────────────────────────────────────────────────────

export interface PreferencesStoreState {
  preferences: Record<string, unknown>
  loading: boolean
  initialized: boolean
  error: string | null
  get<T>(key: string, defaultValue?: T): T
  toolbarCollapsed: boolean
  toolbarPosition: 'top' | 'bottom' | 'left' | 'right'
  toolbarItems: string[]
  sidebarWidth: number
  sidebarCollapsed: boolean
  theme: string
  editorSettings: EditorSettings
  fetchPreferences(): Promise<void>
  setPreference<T>(key: string, value: T): Promise<void>
  setToolbarCollapsed(collapsed: boolean): Promise<void>
  setToolbarPosition(position: 'top' | 'bottom' | 'left' | 'right'): Promise<void>
  setToolbarItems(items: string[]): Promise<void>
  setSidebarWidth(width: number): Promise<void>
  setSidebarCollapsed(collapsed: boolean): Promise<void>
  setTheme(theme: string): Promise<void>
  setEditorSettings(settings: Partial<EditorSettings>): Promise<void>
  init(): Promise<void>
}

export declare function usePreferencesStore(): PreferencesStoreState

// ─── Settings Store ─────────────────────────────────────────────────────────

export interface SettingsStoreState {
  settings: Setting[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
  getByGroup(group: string): Setting[]
  getByKey(key: string): Setting | undefined
  companySettings: Setting[]
  systemSettings: Setting[]
  emailSettings: Setting[]
  mediaSettings: Setting[]
  securitySettings: Setting[]
  designSettings: Setting[]
  aiSettings: Setting[]
  collaborationSettings: Setting[]
  companyName: string
  maintenanceMode: boolean
  timezone: string
  aiEnabled: boolean
  autoSaveEnabled: boolean
  gridSize: number
  snapEnabled: boolean
  showRulers: boolean
  showGrid: boolean
  autoSaveInterval: number
  fetchSettings(): Promise<void>
  updateSetting(id: number, data: SettingUpdate): Promise<void>
  updateSettings(updates: SettingUpdate[]): Promise<void>
  updateCompanySettings(formData: Record<string, unknown>): Promise<void>
  updateSystemSettings(formData: Record<string, unknown>): Promise<void>
  updateEmailSettings(formData: Record<string, unknown>): Promise<void>
  updateMediaSettings(formData: Record<string, unknown>): Promise<void>
  updateDesignSettings(formData: Record<string, unknown>): Promise<void>
  updateAiSettings(formData: Record<string, unknown>): Promise<void>
  updateCollaborationSettings(formData: Record<string, unknown>): Promise<void>
  updateMultipleSettings(updates: Record<string, unknown>): Promise<void>
  clearError(): void
}

export declare function useSettingsStore(): SettingsStoreState

