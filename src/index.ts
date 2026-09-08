// Construct SDK — main entry point
// This package provides TypeScript types and declarations for building Construct spaces.
// Runtime implementations are provided by the Construct host app via window.__CONSTRUCT__['@construct-space/sdk'].

// Types
export * from './types/index'

// Stores
export * from './stores'

// Composables (typed contract)
export * from './composables'

// Runtime composables (host-injected; type stubs only)
export * from './runtime'

// Scheduler (host-injected)
export * from './scheduler'

// Components: import directly from '@construct-space/ui'. The SDK does
// not re-declare them — one component library, no parallel surfaces.

// Context Bus
export * from './context-bus'

// Telemetry
export * from './telemetry'

// Utilities
export * from './utils'

// Schemas (Zod validation)
export * from './schemas/index'
