import { RouterProvider } from '@tanstack/react-router'
import type { Router } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { StoreApi } from 'zustand'
import {
  SharedDependenciesContext,
  EventBusContext,
  type EventBus,
} from '@reactive/core'
import { NavigationContext } from './navigation-context.js'
import type { NavigationManifest } from './types.js'

interface AppProps {
  router: Router<any, any, any>
  queryClient: QueryClient
  stores: Record<string, StoreApi<unknown>>
  services: Record<string, unknown>
  eventBus: EventBus
  navigation: NavigationManifest
}

export function createAppComponent({ router, queryClient, stores, services, eventBus, navigation }: AppProps) {
  function App() {
    return (
      <QueryClientProvider client={queryClient}>
        <SharedDependenciesContext value={{ stores, services }}>
          <EventBusContext value={eventBus}>
            <NavigationContext value={navigation}>
              <RouterProvider router={router} />
            </NavigationContext>
          </EventBusContext>
        </SharedDependenciesContext>
      </QueryClientProvider>
    )
  }

  App.displayName = 'ReactiveApp'
  return App
}
