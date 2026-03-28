import {
  createRootRoute,
  createRoute,
} from '@tanstack/react-router'
import type { AnyRoute } from '@tanstack/react-router'
import type { ReactiveModuleDescriptor, LazyModuleDescriptor } from '@reactive-framework/core'

export interface RouteBuilderOptions {
  /** Component for the root layout (renders <Outlet /> for child routes) */
  rootComponent?: () => React.JSX.Element
  /** Component for the index route (/) */
  indexComponent?: () => React.JSX.Element
  /** Component for the 404 / not-found route */
  notFoundComponent?: () => React.JSX.Element
}

/**
 * Composes all module route subtrees into a single TanStack Router route tree.
 */
export function buildRouteTree(
  modules: ReactiveModuleDescriptor[],
  lazyModules: LazyModuleDescriptor[],
  options?: RouteBuilderOptions,
): AnyRoute {
  const rootRoute = createRootRoute({
    component: options?.rootComponent,
    notFoundComponent: options?.notFoundComponent,
  })

  const children: AnyRoute[] = []

  // Add index route if provided
  if (options?.indexComponent) {
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: options.indexComponent,
    })
    children.push(indexRoute)
  }

  // Eager modules: call createRoutes with rootRoute as parent
  for (const mod of modules) {
    const subtree = mod.createRoutes(rootRoute)
    children.push(subtree)
  }

  // Lazy modules: create a catch-all route under basePath that triggers loading
  for (const lazyMod of lazyModules) {
    const lazyRoute = createLazyModuleRoute(rootRoute, lazyMod)
    children.push(lazyRoute)
  }

  return rootRoute.addChildren(children)
}

function createLazyModuleRoute(
  parentRoute: AnyRoute,
  _lazyMod: LazyModuleDescriptor,
): AnyRoute {
  // TODO: Implement lazy module loading properly
  // For now, create a placeholder route
  return createRoute({
    getParentRoute: () => parentRoute,
    path: _lazyMod.basePath.replace(/^\//, ''),
    component: () => null,
  })
}
