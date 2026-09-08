# @construct-space/sdk

TypeScript contracts for building Construct Spaces. The package ships types, declaration stubs, schemas, and helper signatures; the Construct host provides the runtime implementation through `window.__CONSTRUCT__['@construct-space/sdk']`.

## Install

```bash
bun add @construct-space/sdk
bun add @construct-space/ui
```

Use `@construct-space/sdk` for host APIs and `@construct-space/ui` for most Vue components.

## How It Works

```ts
import { useAuth, useHttp, useToast } from '@construct-space/sdk'
import { Button, Card, Input } from '@construct-space/ui'
```

At build time, the Construct CLI externalizes the SDK. At runtime, imports resolve to the host-injected implementation. Your Space gets autocomplete and type checking without bundling the host app.

## Core Composables

| Group | Exports |
|---|---|
| Auth & identity | `useAuth`, `useAuthorization`, `useAccess` |
| Organization | `useOrg`, `useOrgMembers`, `useOrgTeams`, `useOrgDepartments`, `useOrgRoles` |
| Messaging | `useToast`, `useNotification`, `useDelivery` |
| Networking & data | `useHttp`, `useStorage`, `useLocalStorage` |
| Routing & shortcuts | `useNavigator`, `useSpaceShortcuts` |
| Native tools | `useSpaceTool` |
| Toolbar & breadcrumb | `useToolbar`, `useBreadcrumb` |
| Utilities | `useMarkdown`, `renderMarkdown`, `renderStreamingMarkdown`, `useDateFormat`, `useGoogleFonts`, `useDownload`, `useExport`, `useImport` |
| Scheduler | `useScheduler` |
| Context bus | `publishSpaceContext`, `subscribeSpaceContext`, `getLatestSpaceContext`, `registerContextHandler`, `requestSpaceData` |
| Telemetry | `useTelemetry`, `trackFeature`, `isTelemetryEnabled`, `setTelemetryConsent` |

## Host Runtime Helpers

The SDK also declares host-owned runtime helpers:

| Area | Exports |
|---|---|
| Theme | `useAppTheme` |
| Spaces and marketplace | `useSkills`, `useSpaces`, `useSpaceMarketplace` |
| Billing | `useCredits`, `useBilling` |
| Menus | `useAppMenu`, `useContextMenus`, `showContextMenu` |
| Construct shell | `useConstructConfig`, `getConstructRuntime`, `useConstructAuth`, `useConstructWindow`, `useUpdater`, `useDeepLink`, `useSidebar` |
| AI model | `useAIModel`, `isVisionModel` |
| Shortcut settings | `useShortcutStore`, `getKey`, `setKey`, `resetKey`, `resetAll`, `hasOverride`, `exportJson`, `importJson` |
| Brain bridge | `useBrain`, `postToolResponse` |
| Host-wired components | `ConfirmationModal`, `SplitPane`, `ToolbarSlot` |

Most UI components are not re-declared here. Import them from `@construct-space/ui`.

### Native Tools

`useSpaceTool` runs a first-party CLI bundled at
`<space-id>.space/tools/<platform>/<name>`. Helpers such as ffmpeg belong in
`lib/<platform>/`; Construct prefixes `PATH` with the selected `SPACE_LIB` and
`SPACE_TOOLS` directories before invoking the tool.

```ts
import { useSpaceTool } from '@construct-space/sdk'

const tool = useSpaceTool('video-tools')
const result = await tool.invoke(['probe', filePath], { timeoutMs: 120_000 })
```

## Stores

Host Pinia store declarations:

| Store | Use |
|---|---|
| `useAuthStore` | Read-only auth state |
| `usePinnedStore` | Pinned projects, folders, pages, spaces, links, and tasks |
| `usePreferencesStore` | User preferences, toolbar/sidebar state, editor settings |
| `useSettingsStore` | App-wide settings groups |

Pin factories are exported from the package root:

```ts
createProjectPin(project)
createFolderPin(folder)
createPagePin(page)
createSpacePin(space)
createLinkPin(link)
createTaskPin(task)
```

## Schemas

Zod schemas are available through the package root and `@construct-space/sdk/schemas`:

```ts
import { spaceManifestSchema, validateManifest } from '@construct-space/sdk/schemas'

const parsed = validateManifest(manifest)
```

Exports include manifest, widget, permission, activity, pagination, API response schemas, and validation helpers.

## Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useAuth, useHttp, useToast } from '@construct-space/sdk'
import { Button, Input } from '@construct-space/ui'

const auth = useAuth()
const http = useHttp()
const toast = useToast()
const title = ref('')

async function save() {
  await http.post('/api/notes', {
    title: title.value,
    created_by: auth.user?.id,
  })
  toast.success('Saved')
}
</script>

<template>
  <Input v-model="title" />
  <Button @click="save">Save</Button>
</template>
```

## TypeScript Setup

The Construct CLI handles externalization for generated Spaces. If you need an explicit path alias during local monorepo work:

```json
{
  "compilerOptions": {
    "paths": {
      "@construct-space/sdk": ["../packages/sdk/src/index.ts"]
    }
  }
}
```

## Reference

Full docs live in the Construct docs site under the SDK reference section. The source declarations in `src/` are the authority when in doubt.

## License

MIT
