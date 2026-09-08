// Telemetry API types + the catalog of tracked feature keys.
//
// The list is a real exported const (not `export declare const`) because
// it's plain static data with no host dependency — declaring it without
// shipping a value made `import { TELEMETRY_FEATURE_KEYS } from
// '@construct-space/sdk'` typecheck but resolve to `undefined` at
// runtime, because the host shim had nothing to map onto __CONSTRUCT__.

export const TELEMETRY_FEATURE_KEYS = [
  'ai.chat.sent',
  'ai.chat.regenerate',
  'code.file.open',
  'code.file.save',
  'code.terminal.open',
  'design.element.insert',
  'design.export.used',
  'docs.page.create',
  'docs.page.edit',
  'git.commit.made',
  'git.branch.switch',
  'kanban.card.create',
  'kanban.card.move',
  'notes.note.create',
  'notes.note.edit',
  'calendar.event.create',
  'architect.diagram.create',
] as const

export type TelemetryFeatureKey = typeof TELEMETRY_FEATURE_KEYS[number]

export interface TelemetrySnapshot {
  schemaVersion: number
  firstRecordedAt: string
  lastUpdatedAt: string
  sessions: { total: number; lastStartedAt: string | null; lastEndedAt: string | null }
  screenViews: Record<string, number>
  spaceEnterCount: Record<string, number>
  spaceActiveMs: Record<string, number>
  featureActions: Record<string, number>
}

export declare function isTelemetryEnabled(): boolean
export declare function setTelemetryConsent(enabled: boolean): void
export declare function trackFeature(key: string): Promise<void>

export declare function useTelemetry(): {
  readonly isEnabled: boolean
  trackSessionStart(): Promise<void>
  trackSessionEnd(): Promise<void>
  trackScreenView(routeName: string, spaceId?: string): Promise<void>
  trackSpaceEnter(spaceId: string): Promise<void>
  trackSpaceLeave(spaceId: string, activeMs: number): Promise<void>
  trackFeature(key: string): Promise<void>
  getStoredData(): Promise<TelemetrySnapshot | null>
  clearStoredData(): Promise<void>
  syncToApi(): Promise<void>
}
