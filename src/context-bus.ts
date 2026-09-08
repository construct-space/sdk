// Space Context Bus types and declarations
// Runtime implementation is provided by the Construct host app

export interface SpaceContextPayload {
  spaceId: string
  type: string
  summary: Record<string, unknown>
  timestamp: number
}

export type SpaceContextCallback = (payload: SpaceContextPayload) => void

export type ContextHandler = (request: { type: string; params?: Record<string, unknown> }) => Promise<unknown> | unknown

export declare function publishSpaceContext(payload: SpaceContextPayload): void
export declare function subscribeSpaceContext(type: string, callback: SpaceContextCallback): () => void
export declare function getLatestSpaceContext(type: string): SpaceContextPayload | undefined
export declare function registerContextHandler(spaceId: string, handler: ContextHandler): () => void
export declare function requestSpaceData(
  spaceId: string,
  params?: { type: string; params?: Record<string, unknown> },
): Promise<unknown>
