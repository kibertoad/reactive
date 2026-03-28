import type { AnyRoute } from '@tanstack/react-router'

/**
 * Describes a reactive module — a self-contained piece of UI that declares
 * its routes, navigation items, shared dependency requirements, and lifecycle hooks.
 *
 * TSharedDependencies is the contract type defined by the host app (e.g. AppDependencies).
 */
export interface ReactiveModuleDescriptor<
  TSharedDependencies extends Record<string, any> = Record<string, any>,
> {
  /** Unique module identifier, e.g. "billing", "user-profile" */
  readonly id: string

  /** SemVer version string */
  readonly version: string

  /**
   * Receives a parent route and returns the module's route subtree.
   * Uses TanStack Router's createRoute directly.
   */
  readonly createRoutes: (parentRoute: AnyRoute) => AnyRoute

  /** Navigation items this module contributes to the app shell */
  readonly navigation?: readonly NavigationItem[]

  /** Keys from TSharedDependencies that this module needs */
  readonly requires?: readonly (keyof TSharedDependencies)[]

  /** Lifecycle hooks */
  readonly lifecycle?: ModuleLifecycle<TSharedDependencies>
}

export interface NavigationItem {
  /** Display label */
  readonly label: string

  /** Route path to navigate to */
  readonly to: string

  /** Icon identifier (consumed by the host app's icon system) */
  readonly icon?: string

  /** Grouping key for organizing nav items (e.g. "finance", "admin") */
  readonly group?: string

  /** Sort order within group (lower = higher priority) */
  readonly order?: number

  /** If true, item is registered but hidden from default nav rendering */
  readonly hidden?: boolean
}

export interface ModuleLifecycle<
  TSharedDependencies extends Record<string, any> = Record<string, any>,
> {
  /** Called once when the module is registered in the registry */
  onRegister?(deps: TSharedDependencies): void | Promise<void>

  /** Called when the module's route subtree is first mounted */
  onMount?(deps: TSharedDependencies): void | Promise<void>

  /** Called when the module's route subtree is unmounted */
  onUnmount?(): void | Promise<void>
}

/**
 * Descriptor for a lazily-loaded module.
 * The full module descriptor is loaded on demand when the route is first visited.
 */
export interface LazyModuleDescriptor<
  TSharedDependencies extends Record<string, any> = Record<string, any>,
> {
  /** Unique module identifier */
  readonly id: string

  /** Base path prefix — used to create a catch-all route that triggers loading */
  readonly basePath: string

  /** Dynamic import that returns the full module descriptor */
  readonly load: () => Promise<{
    default: ReactiveModuleDescriptor<TSharedDependencies>
  }>
}
