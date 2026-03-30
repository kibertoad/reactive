---
name: add-zones
description: Adds zone-based layout regions to the shell that modules populate per-route or per-active-tab. Use when the shell layout has dynamic panels, sidebars, or header regions that change based on the current route or active module.
metadata:
  author: reactive
  version: "1.0"
---

# Add Zones

Zones are named layout regions in the shell that modules populate with React components. Unlike slots (arrays concatenated across all modules), each zone holds a single component contributed by the currently active route or module.

Use zones when:

- The shell has a sidebar, detail panel, or header area whose content depends on the current page.
- Different routes need to show different components in the same layout region.

Do NOT use zones for:

- Collecting multiple items from all modules — use [slots](#) instead.
- Shared state — use stores.

## Two zone contribution patterns

1. **Route-based zones** — the route's `staticData` declares zone components. The deepest matched route wins. Read via `useZones()`.
2. **Descriptor zones** — workspace-style modules declare zones on their `ReactiveModuleDescriptor`. The active tab's module zones override route zones. Read via `useActiveZones(moduleId)`.

Most apps use route-based zones. Descriptor zones are for tabbed workspace layouts where the active module isn't determined by routing.

## Step 1: Define the AppZones interface in app-shared

```typescript
// app-shared/src/index.ts
import type { ComponentType } from "react";

export interface AppZones {
  /** Component rendered in the header actions area */
  headerActions?: ComponentType;
  /** Component rendered in a contextual detail panel alongside the main content */
  detailPanel?: ComponentType;
}
```

Every value must be `ComponentType | undefined` (optional — not all routes fill every zone).

## Step 2: Augment TanStack Router's StaticDataRouteOption

This gives you compile-time type checking when setting `staticData` on routes:

```typescript
// app-shared/src/index.ts (or a global .d.ts in the shell)
declare module "@tanstack/router-core" {
  interface StaticDataRouteOption extends AppZones {}
}
```

With this declaration, `createRoute({ staticData: { detailPanle: ... } })` produces a compile error (typo caught).

## Step 3: Contribute zones from module routes

```typescript
// modules/users/src/index.ts (inside createRoutes callback)
import { createRoute, lazyRouteComponent } from "@tanstack/react-router";
import { UserDetailSidebar } from "./components/UserDetailSidebar.js";

const userDetail = createRoute({
  getParentRoute: () => usersRoot,
  path: "$userId",
  component: lazyRouteComponent(() => import("./pages/UserDetail.js")),
  staticData: {
    detailPanel: UserDetailSidebar, // ← this zone is active when this route matches
  },
});
```

## Step 4: Read zones in the shell layout

```typescript
// shell/src/components/Layout.tsx
import { useZones } from "@tanstack-react-modules/runtime";
import type { AppZones } from "@example/app-shared";
import { Outlet } from "@tanstack/react-router";

export function Layout() {
  const zones = useZones<AppZones>();

  return (
    <div className="grid grid-cols-[1fr_300px]">
      <main>
        <Outlet />
      </main>
      <aside>
        {zones.detailPanel ? <zones.detailPanel /> : <DefaultSidebar />}
      </aside>
    </div>
  );
}
```

## Initial state and navigation

Zones are fully reactive — they re-evaluate on every route change. There is no "sticky" behavior and no implicit default.

**On first render (or when no route contributes zones)**, every zone key is `undefined`. The shell layout must handle this with fallback content or conditional rendering:

```typescript
// When no matched route sets detailPanel, zones.detailPanel is undefined
{zones.detailPanel ? <zones.detailPanel /> : <DefaultSidebar />}
```

**When navigating between routes**, zones that were filled by the previous route disappear if the new route doesn't contribute them:

```
Navigate: /users/123  →  /settings
  zones before: { headerActions: UserActions, detailPanel: UserSidebar }
  zones after:  { headerActions: undefined,   detailPanel: undefined   }
```

Zones are derived entirely from the currently matched route hierarchy — they do not carry over from the previous page. If a zone should persist across multiple routes, set it on a shared parent layout route that stays matched:

```typescript
// This layout route stays matched for all /users/* routes
import { createRoute } from "@tanstack/react-router";

const usersLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "users-layout",
  component: UsersLayout,
  staticData: {
    headerActions: UsersHeaderActions, // persists across all /users/* pages
  },
});
```

For workspace-style apps using `useActiveZones`, the same rules apply. When the active tab changes to a module that doesn't declare zones, those zone keys revert to whatever the route hierarchy provides (or `undefined` if no route sets them either).

## How route zone merging works

`useZones()` walks all matched routes from root to leaf and returns a merged map. The **deepest match wins** for each zone key:

```
Root layout     → staticData: { headerActions: GlobalActions }
  /users        → staticData: {} (no zones)
    /$userId    → staticData: { detailPanel: UserDetailSidebar }
```

Result: `{ headerActions: GlobalActions, detailPanel: UserDetailSidebar }`

If the child doesn't override a zone, the parent's value is preserved.

## Descriptor zones (workspace-style apps)

For tabbed workspace layouts where the active module is a tab, not a route:

### Declare zones on the module descriptor

```typescript
// modules/billing/src/index.ts
import BillingContextPanel from "./components/BillingContextPanel.js";

export default defineModule<AppDependencies, AppSlots>({
  id: "billing",
  version: "0.1.0",
  component: BillingWorkspace,
  zones: {
    contextualPanel: BillingContextPanel,
  },
  // ...
});
```

### Read with useActiveZones

```typescript
// shell/src/components/WorkspaceLayout.tsx
import { useActiveZones } from "@tanstack-react-modules/runtime";
import type { AppZones } from "@example/app-shared";

export function WorkspaceLayout({ activeModuleId }: { activeModuleId: string | null }) {
  // Merges route zones with the active module's descriptor zones.
  // Module zones override route zones for the same key.
  const zones = useActiveZones<AppZones>(activeModuleId);

  return (
    <div>
      <main>{/* active tab content */}</main>
      <aside>
        {zones.contextualPanel ? <zones.contextualPanel /> : <DefaultPanel />}
      </aside>
    </div>
  );
}
```

When `activeModuleId` is `null` or `undefined`, `useActiveZones` returns only route zones (same as `useZones`).

## Dynamic zone visibility (toggling zones without navigation)

Zones answer **what** component fills a layout region. **Whether** that region is visible is a separate concern.

If a page has six zones and a button should toggle one of them, the zone component is still contributed by the route. Visibility is controlled by shell-owned state (a Zustand store or local React state):

```typescript
// app-shared/src/index.ts
export interface UIState {
  visibleZones: Record<string, boolean>;
  toggleZone: (key: string) => void;
}
```

```typescript
// shell/src/components/Layout.tsx
import { useZones } from "@tanstack-react-modules/runtime";
import { useStore } from "@example/app-shared";
import type { AppZones } from "@example/app-shared";

export function Layout() {
  const zones = useZones<AppZones>();
  const visibleZones = useStore("ui", (s) => s.visibleZones);

  const DetailPanel = zones.detailPanel;
  const Inspector = zones.inspector;
  const Timeline = zones.timeline;

  return (
    <div className="grid">
      <main>
        <Outlet />
      </main>

      {/* Each zone renders only when both contributed AND visible */}
      {DetailPanel && visibleZones.detailPanel && (
        <aside><DetailPanel /></aside>
      )}
      {Inspector && visibleZones.inspector && (
        <aside><Inspector /></aside>
      )}
      {Timeline && visibleZones.timeline && (
        <footer><Timeline /></footer>
      )}
    </div>
  );
}
```

Modules toggle visibility via the shared store, not by manipulating zone values:

```typescript
// Inside a module component
import { useStore } from "@example/app-shared";

function ToolbarActions() {
  const toggleZone = useStore("ui", (s) => s.toggleZone);

  return (
    <button onClick={() => toggleZone("inspector")}>
      Toggle Inspector
    </button>
  );
}
```

**Why not dynamically set zone values to `undefined`?** Zones are static declarations on routes and module descriptors — they describe what a route *can* contribute, not what's currently shown. Mixing visibility state into zone values would mean routes need runtime logic in `staticData`, which is meant to be static. Keep the two concerns separate:

| Concern    | Mechanism                        | Changes when…                 |
| ---------- | -------------------------------- | ----------------------------- |
| Zone content | `staticData` / descriptor `zones` | Route or active tab changes |
| Zone visibility | Zustand store / React state    | User clicks a button        |

## Rules

- Zone values are React component types (`ComponentType`), not instances. The shell renders them: `<zones.detailPanel />`.
- Every zone key should be optional (`ComponentType | undefined`) in AppZones. Not all routes fill all zones.
- Augment `StaticDataRouteOption` in app-shared for compile-time safety on `staticData`.
- Use `useZones()` for route-based apps. Use `useActiveZones(moduleId)` for workspace/tab-based apps.
- The deepest matched route wins when multiple routes in the hierarchy set the same zone key.
- Module descriptor zones (via `useActiveZones`) override route zones for the same key.
- Do not put complex logic in zone components — they're rendered by the shell and should be self-contained.
