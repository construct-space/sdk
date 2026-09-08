// Utilities — runtime detection, env config, helpers Spaces actually use.
// Everything stateless/atomic goes here; composables.ts is for Vue
// reactive surfaces only. One utilities home, no parallel surfaces.
//
// Runtime implementations are provided by the Construct host app.

import type { Ref, ComputedRef } from 'vue'

// ── Env / config ──────────────────────────────────────────────────────

export interface AppConfig {
  apiBase: string
  sourceUrl: string
  paasUrl: string
  apiKey: string
  spacesRegistryUrl: string
  accountsUrl: string
  oauthClientId: string
}

export declare const appConfig: AppConfig

export interface ProjectLocalSettings {
  projectId: number
  localPath?: string
  updatedAt: Date
}

/** IndexedDB database instance (Dexie). */
export declare const db: unknown

/** Delete the IndexedDB database. */
export declare function deleteDatabase(): Promise<void>

// ── Markdown ──────────────────────────────────────────────────────────

/** Render a markdown string to safe, syntax-highlighted HTML. */
export declare function renderMarkdown(md: string): string

/** Streaming variant — handles partial input without crashing on
 *  unterminated code fences or links. */
export declare function renderStreamingMarkdown(md: string): string

export declare function useMarkdown(): {
  renderMarkdown: typeof renderMarkdown
  renderStreamingMarkdown: typeof renderStreamingMarkdown
  initModules(): Promise<void>
}

// ── Date formatting ───────────────────────────────────────────────────

export declare function useDateFormat(): {
  formatDate(date: string | Date): string
  formatDateShort(date: string | Date): string
  formatDateNoYear(date: string | Date): string
  formatDateRange(start: string | Date, end: string | Date): string
  formatDateTime(date: string | Date): string
  relative(date: string | Date): string
}

// ── Fonts ─────────────────────────────────────────────────────────────

export interface GoogleFont {
  family: string
  variants: string[]
  subsets: string[]
  category: string
}

export declare function useGoogleFonts(): {
  fonts: Ref<GoogleFont[]>
  fontOptions: ComputedRef<Array<{ label: string; value: string }>>
  isLoading: Ref<boolean>
  isLoaded: Ref<boolean>
  search(query: string): GoogleFont[]
  load(family: string, variants?: string[]): Promise<void>
  preloadCached(): Promise<void>
  isFontLoaded(family: string): boolean
}

// ── Downloads ─────────────────────────────────────────────────────────
//
// Save a blob / string / remote URL to the user's disk. In Tauri this
// opens the native save dialog and writes via the host's filesystem
// permissions; on web it falls back to an anchor + revokeObjectURL.
// Spaces shouldn't branch on host — one call works on both.

export interface DownloadOptions {
  /** Suggested filename in the save dialog. */
  filename: string
  /** MIME type. Inferred from filename extension when omitted. */
  contentType?: string
}

export declare function useDownload(): {
  /** Save raw bytes / text. Strings are treated as UTF-8 text. */
  save(data: Blob | string | Uint8Array, opts: DownloadOptions): Promise<void>
  /** Save the contents of a remote URL — host fetches, user picks path. */
  saveUrl(url: string, opts: DownloadOptions): Promise<void>
}

// ── Export / Import ───────────────────────────────────────────────────
//
// One pair of composables for moving tabular data in and out of a space.
// Parsers + serializers live in the host (papaparse, xlsx, etc.) so
// spaces don't each bundle 30–200 KB of format code. Pairs with
// useDownload() for one-call exports.

export type DataFormat = 'csv' | 'tsv' | 'json' | 'xlsx' | 'markdown'

/**
 * Metadata for a supported format — surface this from a format picker.
 * `kind: 'binary'` means the host returns a Blob; `'text'` returns string.
 */
export interface DataFormatInfo {
  format: DataFormat
  label: string                // "CSV", "Excel (xlsx)", …
  extension: string            // ".csv", ".xlsx", …
  mimeType: string
  kind: 'text' | 'binary'
}

export interface ExportOptions {
  format: DataFormat
  /**
   * Explicit column order. Defaults to keys of the first row, in
   * insertion order. Pass `{ key, label }` to rename the header.
   */
  columns?: Array<string | { key: string; label?: string }>
  /** Header row. Default true. */
  header?: boolean
  /** csv/tsv column separator override. */
  delimiter?: string
  /** json: pretty-print with 2-space indent. Default false. */
  pretty?: boolean
  /** xlsx sheet name. Default "Sheet1". */
  sheet?: string
  /** Line terminator for csv/tsv. Default "\r\n". */
  newline?: '\n' | '\r\n'
}

export interface ImportOptions {
  /**
   * Format hint. Auto-detected from filename extension / MIME / content
   * when omitted, so usually you can skip this.
   */
  format?: DataFormat
  /** First row is the header (csv/tsv/xlsx). Default true. */
  header?: boolean
  /** csv/tsv column separator override. */
  delimiter?: string
  /** Trim whitespace from each cell. Default false. */
  trim?: boolean
  /** Coerce numeric / boolean strings. Default false. */
  dynamicTyping?: boolean
  /** xlsx sheet to read (name or 0-based index). Default first sheet. */
  sheet?: string | number
  /** Skip empty rows. Default true. */
  skipEmpty?: boolean
}

export declare function useExport(): {
  /** Supported formats with metadata — drive a format picker. */
  formats: DataFormatInfo[]
  /** Serialize rows. Returns a string for text formats, Blob for binary (xlsx). */
  generate(rows: Array<Record<string, unknown>>, opts: ExportOptions): Promise<string | Blob>
  /**
   * Serialize and save to disk in one call. Internally calls useDownload();
   * pass any extension or omit it — the format's extension is appended.
   */
  save(
    rows: Array<Record<string, unknown>>,
    opts: ExportOptions & { filename: string },
  ): Promise<void>
}

export declare function useImport(): {
  /** Supported formats with metadata — drive an import-source picker. */
  formats: DataFormatInfo[]
  /**
   * Parse a string / File / Blob into row objects. Format is auto-detected
   * from the filename / MIME when input is a File and `opts.format` is omitted.
   */
  parse<T = Record<string, unknown>>(
    input: string | File | Blob,
    opts?: ImportOptions,
  ): Promise<T[]>
}

// ── Misc ──────────────────────────────────────────────────────────────

/** Pick a random element from a non-empty array. */
export declare function randomFrom<T>(array: T[]): T

/** Generate a random integer between min and max (inclusive). */
export declare function randomInt(min: number, max: number): number
