import { createStore } from 'zustand/vanilla'
import type { ConfigStore } from '@example/app-contract'

export const configStore = createStore<ConfigStore>()(() => ({
  apiBaseUrl: 'http://localhost:3000/api',
  environment: 'dev' as const,
  appName: 'Reactive Shell',
}))
