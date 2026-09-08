// Preference types for user preferences

export interface Preference {
  id: number
  key: string
  value: unknown
  user_id?: number
  created_at: string
  updated_at: string
}

export type PreferenceKey =
  | 'toolbar.collapsed'
  | 'toolbar.position'
  | 'toolbar.items'
  | 'sidebar.width'
  | 'sidebar.collapsed'
  | 'theme'
  | 'locale'
  | 'editor.settings'
  | (string & {})

export interface EditorSettings {
  theme: string
  fontSize: number
  fontFamily: string
  fontLigatures: boolean
  minimap: boolean
  lineNumbers: 'on' | 'off' | 'relative'
  wordWrap: 'on' | 'off' | 'bounded'
  renderWhitespace: 'none' | 'selection' | 'all'
  renderLineHighlight: 'none' | 'gutter' | 'line' | 'all'
  tabSize: number
  insertSpaces: boolean
  cursorStyle: string
  cursorBlinking: string
  cursorSmoothCaretAnimation: boolean
  smoothScrolling: boolean
  mouseWheelZoom: boolean
  formatOnPaste: boolean
  autoClosingBrackets: string
  bracketPairColorization: boolean
  folding: boolean
  links: boolean
  colorDecorators: boolean
}

export interface ToolbarPreferences {
  collapsed: boolean
  position: 'top' | 'bottom' | 'left' | 'right'
  items: string[]
}

export interface SidebarPreferences {
  width: number
  collapsed: boolean
}

/**
 * Marketing/digest opt-ins. Distinct from the per-channel
 * NotificationPreferences in `./notification` (which controls in-app vs
 * web push vs mobile push for transactional notifications).
 */
export interface MarketingPreferences {
  email: boolean
  desktop: boolean
  product_updates: boolean
  weekly_digest: boolean
  important_updates: boolean
}
